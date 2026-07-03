"use server";

import { db, projects, chatSessions, conversationMessages, eq, and, desc, asc, inArray } from "@portfoliochat/db";

function getDateGroupLabel(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - today.getDay());

  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (itemDate.getTime() === today.getTime()) {
    return "Today";
  } else if (itemDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else if (itemDate >= startOfWeek) {
    return "Earlier This Week";
  } else {
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
}

export async function getProjectConversations(userId, projectId, { dateFilter = "all", sourceFilter = "all", searchQuery = "" } = {}) {
  if (!userId || !projectId) return [];

  try {
    // 1. Verify project ownership
    const [project] = await db.select().from(projects).where(
      and(eq(projects.id, projectId), eq(projects.userId, userId))
    );
    if (!project) return [];

    // 2. Query sessions
    let conditions = [eq(chatSessions.projectId, projectId)];

    if (sourceFilter && sourceFilter !== "all") {
      conditions.push(eq(chatSessions.source, sourceFilter));
    }

    const sessions = await db.select()
      .from(chatSessions)
      .where(and(...conditions))
      .orderBy(desc(chatSessions.createdAt));

    if (!sessions || sessions.length === 0) return [];

    // 3. For each session, fetch the first user message as a preview snippet
    const sessionIds = sessions.map(s => s.id);
    const messages = await db.select()
      .from(conversationMessages)
      .where(and(eq(conversationMessages.projectId, projectId), inArray(conversationMessages.sessionId, sessionIds)))
      .orderBy(conversationMessages.createdAt);

    // Group first user message by sessionId
    const firstUserMsgMap = {};
    for (const msg of messages) {
      if (msg.role === "user" && !firstUserMsgMap[msg.sessionId]) {
        firstUserMsgMap[msg.sessionId] = msg.content;
      }
    }

    // Process sessions and assign date group
    const formattedSessions = sessions.map(s => {
      const createdAtDate = s.createdAt ? new Date(s.createdAt) : new Date();
      return {
        id: s.id,
        projectId: s.projectId,
        source: s.source,
        visitorIpHash: s.visitorIpHash,
        turnCount: s.turnCount || 0,
        isFlagged: s.isFlagged || false,
        flagNote: s.flagNote || "",
        lastActiveAt: s.lastActiveAt,
        createdAt: createdAtDate.toISOString(),
        formattedDate: createdAtDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        formattedTime: createdAtDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        dateGroup: getDateGroupLabel(createdAtDate),
        firstQuestionPreview: firstUserMsgMap[s.id] || "No questions recorded in this session"
      };
    });

    let filtered = formattedSessions;

    if (dateFilter === "today") {
      const todayStr = new Date().toDateString();
      filtered = filtered.filter(s => new Date(s.createdAt).toDateString() === todayStr);
    } else if (dateFilter === "7days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter(s => new Date(s.createdAt) >= sevenDaysAgo);
    } else if (dateFilter === "30days") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(s => new Date(s.createdAt) >= thirtyDaysAgo);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(s => 
        s.firstQuestionPreview.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    }

    return filtered;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
}

export async function getConversationDetails(userId, projectId, sessionId) {
  if (!userId || !projectId || !sessionId) return null;

  try {
    const [project] = await db.select().from(projects).where(
      and(eq(projects.id, projectId), eq(projects.userId, userId))
    );
    if (!project) return null;

    const [session] = await db.select().from(chatSessions).where(
      and(eq(chatSessions.id, sessionId), eq(chatSessions.projectId, projectId))
    );
    if (!session) return null;

    const messages = await db.select()
      .from(conversationMessages)
      .where(and(eq(conversationMessages.sessionId, sessionId), eq(conversationMessages.projectId, projectId)))
      .orderBy(asc(conversationMessages.createdAt));

    return {
      session: {
        id: session.id,
        source: session.source,
        visitorIpHash: session.visitorIpHash,
        turnCount: session.turnCount,
        isFlagged: session.isFlagged,
        flagNote: session.flagNote,
        createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : null,
        lastActiveAt: session.lastActiveAt ? new Date(session.lastActiveAt).toISOString() : null
      },
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: m.sources,
        tokenCount: m.tokenCount,
        latencyMs: m.latencyMs,
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null
      }))
    };
  } catch (error) {
    console.error("Error fetching conversation details:", error);
    return null;
  }
}

export async function toggleFlagConversation(userId, projectId, sessionId, flagged, note = "") {
  if (!userId || !projectId || !sessionId) throw new Error("Invalid input");

  try {
    const [project] = await db.select().from(projects).where(
      and(eq(projects.id, projectId), eq(projects.userId, userId))
    );
    if (!project) throw new Error("Unauthorized");

    await db.update(chatSessions)
      .set({ isFlagged: flagged, flagNote: note })
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.projectId, projectId)));

    return { success: true };
  } catch (error) {
    console.error("Error flagging conversation:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteConversation(userId, projectId, sessionId) {
  if (!userId || !projectId || !sessionId) throw new Error("Invalid input");

  try {
    const [project] = await db.select().from(projects).where(
      and(eq(projects.id, projectId), eq(projects.userId, userId))
    );
    if (!project) throw new Error("Unauthorized");

    await db.delete(chatSessions).where(
      and(eq(chatSessions.id, sessionId), eq(chatSessions.projectId, projectId))
    );

    return { success: true };
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return { success: false, error: error.message };
  }
}
