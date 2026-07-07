"use server";

import { db, projects, widgetConfigs, eq, and, redisGet, redisSet, redisDel } from "@portfoliochat/db";
import { DEFAULT_WIDGET_CONFIG } from "./customizer-constants";

async function triggerQStashEvent(destination, payload) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const qstashToken = process.env.QSTASH_TOKEN;
  const rawQStashUrl = process.env.QSTASH_URL || "https://qstash.upstash.io";
  const isLocalTarget = apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1");

  if (qstashToken && !isLocalTarget) {
    const destinationUrl = `${apiUrl}${destination}`;
    const cleanBase = rawQStashUrl.replace(/\/+$/, "").replace(/\/v2\/publish$/, "");
    const publishUrl = `${cleanBase}/v2/publish/${destinationUrl}`;

    try {
      await fetch(publishUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${qstashToken}`,
          "Content-Type": "application/json",
          "Upstash-Retries": "3"
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
    }
  }

  fetch(`${apiUrl}${destination}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export async function getWidgetConfig(userId, projectId) {
  if (!userId || !projectId) return null;
  const cacheKey = `widget_config:${projectId}`;

  try {
    const cached = await redisGet(cacheKey);
    if (cached) return cached;

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

    const result = {
      id: configRow.id,
      projectId: configRow.projectId,
      draft,
      published,
      updatedAt: configRow.updatedAt ? new Date(configRow.updatedAt).toISOString() : new Date().toISOString()
    };

    await redisSet(cacheKey, result, 3600); // 1 hr TTL
    return result;
  } catch (error) {
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

    await redisDel(`widget_config:${projectId}`);

    return { success: true };
  } catch (error) {
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

    // Queue QStash Event for Widget Release Publishing
    triggerQStashEvent("/webhooks/widget-published", {
      type: "widget_published",
      projectId,
      publishedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
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
    return { success: false, error: error.message };
  }
}
