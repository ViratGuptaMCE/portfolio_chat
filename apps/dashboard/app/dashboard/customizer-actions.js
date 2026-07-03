"use server";

import { db, projects, widgetConfigs, eq, and } from "@portfoliochat/db";
import { redisDel } from "@portfoliochat/db";
import { DEFAULT_WIDGET_CONFIG } from "./customizer-constants";

export async function getWidgetConfig(userId, projectId) {
  if (!userId || !projectId) return null;

  try {
    const [project] = await db.select().from(projects).where(
      and(eq(projects.id, projectId), eq(projects.userId, userId))
    );
    if (!project) return null;

    let [configRow] = await db.select().from(widgetConfigs).where(
      eq(widgetConfigs.projectId, projectId)
    );

    if (!configRow) {
      // Initialize default widget config row for project if not existing
      [configRow] = await db.insert(widgetConfigs).values({
        projectId,
        botName: project.name || "AI Assistant",
        welcomeMessage: `Hi! Ask me anything about ${project.name || "my work"}.`,
        draftConfig: DEFAULT_WIDGET_CONFIG,
        publishedConfig: DEFAULT_WIDGET_CONFIG
      }).returning();
    }

    const draft = configRow.draftConfig && Object.keys(configRow.draftConfig).length > 0 
      ? { ...DEFAULT_WIDGET_CONFIG, ...configRow.draftConfig }
      : DEFAULT_WIDGET_CONFIG;

    const published = configRow.publishedConfig && Object.keys(configRow.publishedConfig).length > 0
      ? { ...DEFAULT_WIDGET_CONFIG, ...configRow.publishedConfig }
      : DEFAULT_WIDGET_CONFIG;

    return {
      id: configRow.id,
      projectId: configRow.projectId,
      draft,
      published,
      updatedAt: configRow.updatedAt ? new Date(configRow.updatedAt).toISOString() : new Date().toISOString()
    };
  } catch (error) {
    console.error("Error in getWidgetConfig:", error);
    return null;
  }
}

export async function saveDraftConfig(userId, projectId, draftConfig) {
  if (!userId || !projectId || !draftConfig) {
    return { success: false, error: "Invalid parameters" };
  }

  try {
    const [project] = await db.select().from(projects).where(
      and(eq(projects.id, projectId), eq(projects.userId, userId))
    );
    if (!project) return { success: false, error: "Unauthorized" };

    const botName = draftConfig.header?.botName || draftConfig.personality?.assistantName || "AI Assistant";
    const welcomeMessage = draftConfig.welcome?.greeting || "Hi! How can I help you today?";
    const placeholderText = draftConfig.input?.placeholder || "Ask me anything...";

    await db.update(widgetConfigs)
      .set({
        draftConfig,
        botName,
        welcomeMessage,
        placeholderText,
        customCss: draftConfig.developer?.customCss || "",
        allowedDomains: draftConfig.developer?.allowedDomains || [],
        updatedAt: new Date()
      })
      .where(eq(widgetConfigs.projectId, projectId));

    return { success: true };
  } catch (error) {
    console.error("Error saving draft config:", error);
    return { success: false, error: error.message };
  }
}

export async function publishWidgetConfig(userId, projectId, draftConfig) {
  if (!userId || !projectId || !draftConfig) {
    return { success: false, error: "Invalid parameters font" };
  }

  try {
    const [project] = await db.select().from(projects).where(
      and(eq(projects.id, projectId), eq(projects.userId, userId))
    );
    if (!project) return { success: false, error: "Unauthorized" };

    const botName = draftConfig.header?.botName || draftConfig.personality?.assistantName || "AI Assistant";
    const welcomeMessage = draftConfig.welcome?.greeting || "Hi! How can I help you today?";
    const placeholderText = draftConfig.input?.placeholder || "Ask me anything...";

    await db.update(widgetConfigs)
      .set({
        draftConfig,
        publishedConfig: draftConfig,
        botName,
        welcomeMessage,
        placeholderText,
        customCss: draftConfig.developer?.customCss || "",
        allowedDomains: draftConfig.developer?.allowedDomains || [],
        updatedAt: new Date()
      })
      .where(eq(widgetConfigs.projectId, projectId));

    // Invalidate Redis cache for live embedded widgets
    await redisDel(`widget_config:${projectId}`);

    return { success: true };
  } catch (error) {
    console.error("Error publishing widget config:", error);
    return { success: false, error: error.message };
  }
}

export async function resetSectionConfig(userId, projectId, currentDraft, sectionName) {
  if (!userId || !projectId || !currentDraft || !sectionName) {
    return { success: false, error: "Invalid parameters" };
  }

  try {
    const defaultSection = DEFAULT_WIDGET_CONFIG[sectionName];
    if (!defaultSection) {
      return { success: false, error: `Invalid section name: ${sectionName}` };
    }

    const updatedDraft = {
      ...currentDraft,
      [sectionName]: defaultSection
    };

    return await saveDraftConfig(userId, projectId, updatedDraft);
  } catch (error) {
    console.error("Error resetting section config:", error);
    return { success: false, error: error.message };
  }
}

export async function resetAllConfig(userId, projectId) {
  if (!userId || !projectId) {
    return { success: false, error: "Invalid parameters" };
  }

  try {
    return await saveDraftConfig(userId, projectId, DEFAULT_WIDGET_CONFIG);
  } catch (error) {
    console.error("Error resetting all config:", error);
    return { success: false, error: error.message };
  }
}
