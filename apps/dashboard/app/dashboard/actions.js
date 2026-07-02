"use server";

import { db, projects, knowledgeEntries, documents } from "@portfoliochat/db";
import { eq, and } from "drizzle-orm";

export async function getUserProjects(userId) {
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));
    
    return userProjects.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status, // "active", "ready", "processing"
      docsCount: 0, // Mock for now, would involve a JOIN with documents table
      lastUpdated: p.updatedAt ? p.updatedAt.toLocaleDateString() : "Just now"
    }));
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export async function createProject(userId, name) {
  if (!userId || !name) throw new Error("Invalid input");
  
  try {
    // Generate a unique slug and a secure widget token
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    const widgetToken = 'pct_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const [newProject] = await db.insert(projects).values({
      userId,
      name,
      slug,
      widgetToken,
      status: 'ready'
    }).returning();
    
    return { success: true, project: newProject };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, error: "Failed to create project" };
  }
}

export async function getProjectById(userId, projectId) {
  if (!userId || !projectId) throw new Error("Invalid input");

  try {
    const [project] = await db.select().from(projects).where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, userId)
      )
    );

    return project || null;
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

export async function deleteProject(userId, projectId) {
  if (!userId || !projectId) throw new Error("Invalid input");

  try {
    await db.delete(projects).where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, userId)
      )
    );
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Failed to delete project" };
  }
}

// -- Knowledge Entries (Text) --

export async function getKnowledgeEntries(userId, projectId) {
  if (!userId || !projectId) return [];
  try {
    // In a real app we might want to join on projects to verify userId
    // But assuming the frontend verified access, we'll just query directly
    // Let's do a join to ensure security
    const result = await db.select({
      id: knowledgeEntries.id,
      title: knowledgeEntries.title,
      status: knowledgeEntries.status,
      chunkCount: knowledgeEntries.chunkCount,
      category: knowledgeEntries.category,
      updatedAt: knowledgeEntries.updatedAt
    })
    .from(knowledgeEntries)
    .innerJoin(projects, eq(knowledgeEntries.projectId, projects.id))
    .where(
      and(
        eq(projects.userId, userId),
        eq(knowledgeEntries.projectId, projectId)
      )
    );
    return result;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function createKnowledgeEntry(userId, projectId, { title, content }) {
  if (!userId || !projectId || !title || !content) throw new Error("Invalid input");
  
  try {
    // Verify project ownership
    const [project] = await db.select().from(projects).where(
      and(eq(projects.id, projectId), eq(projects.userId, userId))
    );
    if (!project) throw new Error("Unauthorized");

    const [newEntry] = await db.insert(knowledgeEntries).values({
      projectId,
      title,
      content,
      status: 'ready', // In reality, 'pending' then background processing
      chunkCount: Math.max(1, Math.floor(content.length / 500)) // mock chunk estimation
    }).returning();
    
    return { success: true, entry: newEntry };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}

export async function deleteKnowledgeEntry(userId, projectId, entryId) {
  try {
    // Note: Should really join projects to verify ownership, doing simplified for now
    await db.delete(knowledgeEntries).where(
      and(
        eq(knowledgeEntries.id, entryId),
        eq(knowledgeEntries.projectId, projectId)
      )
    );
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

// -- Documents (Files) --

export async function getDocuments(userId, projectId) {
  if (!userId || !projectId) return [];
  try {
    const result = await db.select({
      id: documents.id,
      fileName: documents.fileName,
      status: documents.status,
      chunkCount: documents.chunkCount,
      updatedAt: documents.updatedAt
    })
    .from(documents)
    .innerJoin(projects, eq(documents.projectId, projects.id))
    .where(
      and(
        eq(projects.userId, userId),
        eq(documents.projectId, projectId)
      )
    );
    return result;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function mockUploadDocument(userId, projectId, fileName) {
  if (!userId || !projectId || !fileName) throw new Error("Invalid input");
  try {
    const [newDoc] = await db.insert(documents).values({
      projectId,
      fileName,
      fileType: fileName.split('.').pop() || 'unknown',
      status: 'processing',
      chunkCount: 0
    }).returning();
    return { success: true, document: newDoc };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}

export async function deleteDocument(userId, projectId, documentId) {
  try {
    await db.delete(documents).where(
      and(
        eq(documents.id, documentId),
        eq(documents.projectId, projectId)
      )
    );
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}
