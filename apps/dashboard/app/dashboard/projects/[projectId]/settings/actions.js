"use server";

import { db, projects, projectSettings, eq, and, redisGet, redisSet, redisDel } from "@portfoliochat/db";
import crypto from "crypto";

async function triggerQStashEvent(destination, payload) {
  const apiUrl = process.env.API_URL || "http://localhost:8080";
  const qstashToken = process.env.QSTASH_TOKEN;
  const rawQStashUrl = process.env.QSTASH_URL || "https://qstash.upstash.io";
  const isLocalTarget = apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1");

  if (qstashToken && !isLocalTarget) {
    const destinationUrl = `${apiUrl}${destination}`;
    const cleanBase = rawQStashUrl.replace(/\/+$/, "").replace(/\/v2\/publish$/, "");
    const publishUrl = `${cleanBase}/v2/publish/${destinationUrl}`;

    console.log(`[QSTASH QUEUE] Publishing settings event to ${publishUrl}...`);
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
      console.error(`[QSTASH QUEUE ERROR]`, err.message);
    }
  }

  fetch(`${apiUrl}${destination}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

const ALLOWED_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
];

const ALLOWED_TONES = [
  "professional",
  "friendly",
  "concise",
  "technical",
  "academic",
  "enthusiastic",
];

/**
 * Fetch project settings (auto-creating default record if absent)
 */
export async function getProjectSettingsAction(userId, projectId) {
  if (!userId || !projectId) {
    return { success: false, error: "Missing required params" };
  }

  const cacheKey = `settings:${projectId}`;

  try {
    const cached = await redisGet(cacheKey);
    if (cached) return cached;

    // 1. Verify project ownership
    const [proj] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

    if (!proj) {
      return { success: false, error: "Project not found or access denied" };
    }

    // 2. Query project_settings
    let [settings] = await db
      .select()
      .from(projectSettings)
      .where(eq(projectSettings.projectId, projectId));

    // 3. Auto-initialize default settings if table entry doesn't exist yet
    if (!settings) {
      const [newSettings] = await db
        .insert(projectSettings)
        .values({
          projectId: projectId,
          llmModel: ALLOWED_MODELS.includes(proj.llmModel) ? proj.llmModel : "openai/gpt-oss-120b",
          embeddingModel: proj.embeddingModel || "bge-large-en-v1.5",
          temperature: "0.30",
          maxTokens: 500,
          modelTone: "professional",
          modelLanguage: "auto",
          systemInstructions: "",
          apiEnabled: proj.apiEnabled ?? true,
          apiAllowedOrigins: proj.apiAllowedOrigins || [],
          apiRateLimitRpm: proj.apiRateLimitRpm || 20,
          widgetEnabled: proj.widgetEnabled ?? true,
          widgetVersion: "v1.0.0",
          allowedDomains: [],
          customCss: "",
          customHtml: "",
        })
        .returning();
      settings = newSettings;
    }

    const result = {
      success: true,
      data: {
        project: {
          id: proj.id,
          name: proj.name,
          slug: proj.slug,
          widgetToken: proj.widgetToken,
          hasApiKey: !!proj.apiKeyHash,
          createdAt: proj.createdAt,
        },
        settings: {
          id: settings.id,
          llmModel: settings.llmModel || "openai/gpt-oss-120b",
          embeddingModel: settings.embeddingModel || "bge-large-en-v1.5",
          temperature: parseFloat(settings.temperature || "0.30"),
          maxTokens: settings.maxTokens || 500,
          modelTone: settings.modelTone || "professional",
          modelLanguage: settings.modelLanguage || "auto",
          systemInstructions: settings.systemInstructions || "",
          apiEnabled: settings.apiEnabled ?? true,
          apiAllowedOrigins: settings.apiAllowedOrigins || [],
          apiRateLimitRpm: settings.apiRateLimitRpm || 20,
          widgetEnabled: settings.widgetEnabled ?? true,
          widgetVersion: settings.widgetVersion || "v1.0.0",
          allowedDomains: settings.allowedDomains || [],
          customCss: settings.customCss || "",
          customHtml: settings.customHtml || "",
          updatedAt: settings.updatedAt,
        },
      },
    };

    await redisSet(cacheKey, result, 3600); // 1 hr TTL
    return result;
  } catch (err) {
    console.error("[GET_PROJECT_SETTINGS_ERROR]", err);
    return { success: false, error: err.message || "Failed to load settings" };
  }
}

/**
 * Save updated project settings
 */
export async function updateProjectSettingsAction(userId, projectId, payload) {
  if (!userId || !projectId || !payload) {
    return { success: false, error: "Invalid payload parameters" };
  }

  try {
    // 1. Verify project ownership
    const [proj] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

    if (!proj) {
      return { success: false, error: "Project not found or access denied" };
    }

    // 2. Validate model & tone
    const selectedModel = ALLOWED_MODELS.includes(payload.llmModel)
      ? payload.llmModel
      : "openai/gpt-oss-120b";
    const selectedTone = ALLOWED_TONES.includes(payload.modelTone)
      ? payload.modelTone
      : "professional";

    const tempVal = Math.min(Math.max(parseFloat(payload.temperature || 0.3), 0), 1).toFixed(2);
    const maxTokensVal = Math.min(Math.max(parseInt(payload.maxTokens || 500, 10), 100), 2000);
    const rateLimitVal = Math.min(Math.max(parseInt(payload.apiRateLimitRpm || 20, 10), 5), 100);

    const origins = Array.isArray(payload.apiAllowedOrigins)
      ? payload.apiAllowedOrigins.map((s) => s.trim()).filter(Boolean)
      : [];
    const domains = Array.isArray(payload.allowedDomains)
      ? payload.allowedDomains.map((s) => s.trim()).filter(Boolean)
      : [];

    // 3. Upsert into project_settings table
    const [existingSettings] = await db
      .select()
      .from(projectSettings)
      .where(eq(projectSettings.projectId, projectId));

    if (existingSettings) {
      await db
        .update(projectSettings)
        .set({
          llmModel: selectedModel,
          temperature: tempVal,
          maxTokens: maxTokensVal,
          modelTone: selectedTone,
          modelLanguage: payload.modelLanguage || "auto",
          systemInstructions: payload.systemInstructions || "",
          apiEnabled: !!payload.apiEnabled,
          apiAllowedOrigins: origins,
          apiRateLimitRpm: rateLimitVal,
          widgetEnabled: !!payload.widgetEnabled,
          widgetVersion: payload.widgetVersion || "v1.0.0",
          allowedDomains: domains,
          customCss: payload.customCss || "",
          customHtml: payload.customHtml || "",
          updatedAt: new Date(),
        })
        .where(eq(projectSettings.projectId, projectId));
    } else {
      await db.insert(projectSettings).values({
        projectId: projectId,
        llmModel: selectedModel,
        embeddingModel: "bge-large-en-v1.5",
        temperature: tempVal,
        maxTokens: maxTokensVal,
        modelTone: selectedTone,
        modelLanguage: payload.modelLanguage || "auto",
        systemInstructions: payload.systemInstructions || "",
        apiEnabled: !!payload.apiEnabled,
        apiAllowedOrigins: origins,
        apiRateLimitRpm: rateLimitVal,
        widgetEnabled: !!payload.widgetEnabled,
        widgetVersion: payload.widgetVersion || "v1.0.0",
        allowedDomains: domains,
        customCss: payload.customCss || "",
        customHtml: payload.customHtml || "",
      });
    }

    // 4. Also update legacy columns in projects table for backwards compatibility
    await db
      .update(projects)
      .set({
        llmModel: selectedModel,
        widgetEnabled: !!payload.widgetEnabled,
        apiEnabled: !!payload.apiEnabled,
        apiAllowedOrigins: origins,
        apiRateLimitRpm: rateLimitVal,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    // 5. Invalidate Redis cache
    await redisDel(`settings:${projectId}`).catch(console.error);
    await redisDel(`project:${projectId}:settings`).catch(console.error);

    // 6. Queue QStash Event for Settings Update
    triggerQStashEvent("/webhooks/settings-updated", {
      type: "settings_updated",
      projectId,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (err) {
    console.error("[UPDATE_PROJECT_SETTINGS_ERROR]", err);
    return { success: false, error: err.message || "Failed to update settings" };
  }
}

/**
 * Regenerate Secret API Key for project
 */
export async function regenerateApiKeyAction(userId, projectId) {
  if (!userId || !projectId) {
    return { success: false, error: "Missing required params" };
  }

  try {
    const [proj] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

    if (!proj) {
      return { success: false, error: "Project not found or access denied" };
    }

    // Generate new raw secret key
    const rawSecret = `pct_secret_${crypto.randomBytes(24).toString("hex")}`;
    const hash = crypto.createHash("sha256").update(rawSecret).digest("hex");

    await db
      .update(projects)
      .set({ apiKeyHash: hash, updatedAt: new Date() })
      .where(eq(projects.id, projectId));

    await redisDel(`settings:${projectId}`).catch(console.error);

    triggerQStashEvent("/webhooks/apikey-regenerated", {
      type: "apikey_regenerated",
      projectId
    });

    return { success: true, secretKey: rawSecret };
  } catch (err) {
    console.error("[REGENERATE_API_KEY_ERROR]", err);
    return { success: false, error: err.message || "Failed to regenerate API key" };
  }
}

/**
 * Delete project permanently
 */
export async function deleteProjectAction(userId, projectId, confirmSlug) {
  if (!userId || !projectId || !confirmSlug) {
    return { success: false, error: "Missing required parameters" };
  }

  try {
    const [proj] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

    if (!proj) {
      return { success: false, error: "Project not found or access denied" };
    }

    if (proj.slug !== confirmSlug) {
      return { success: false, error: "Project slug confirmation does not match" };
    }

    await db.delete(projects).where(eq(projects.id, projectId));
    await redisDel(`project:${projectId}:settings`).catch(console.error);

    return { success: true };
  } catch (err) {
    console.error("[DELETE_PROJECT_ERROR]", err);
    return { success: false, error: err.message || "Failed to delete project" };
  }
}
