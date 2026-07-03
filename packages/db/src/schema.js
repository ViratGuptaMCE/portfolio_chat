import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  varchar,
  integer,
  bigint,
  bigserial,
  jsonb,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// --- Better Auth Tables ---
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  expiresAt: timestamp("expiresAt"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// --- PortfolioChat Core Tables ---

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  widgetToken: varchar('widget_token', { length: 128 }).notNull().unique(),
  apiKeyHash: varchar('api_key_hash', { length: 128 }),
  embeddingModel: varchar('embedding_model', { length: 100 }).default('bge-large-en-v1.5'),
  llmModel: varchar('llm_model', { length: 100 }).default('groq/llama-3.1-70b'),
  widgetEnabled: boolean('widget_enabled').default(true),
  apiEnabled: boolean('api_enabled').default(true),
  apiAllowedOrigins: text('api_allowed_origins').array(),
  apiRateLimitRpm: integer('api_rate_limit_rpm').default(20),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  idx_projects_widget_token: index('idx_projects_widget_token').on(t.widgetToken),
  idx_projects_api_key_hash: index('idx_projects_api_key_hash').on(t.apiKeyHash),
  idx_projects_user_id: index('idx_projects_user_id').on(t.userId)
}));

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 500 }),
  fileType: varchar('file_type', { length: 50 }),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }),
  extractedText: text('extracted_text'),
  status: varchar('status', { length: 50 }).default('pending'),
  chunkCount: integer('chunk_count').default(0),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  idx_documents_project_id: index('idx_documents_project_id').on(t.projectId),
  idx_documents_status: index('idx_documents_status').on(t.projectId, t.status)
}));

export const knowledgeEntries = pgTable('knowledge_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  category: varchar('category', { length: 100 }).default('other'),
  content: text('content').notNull(),
  tags: text('tags').array().default(sql`'{}'`),
  status: varchar('status', { length: 50 }).default('pending'),
  chunkCount: integer('chunk_count').default(0),
  version: integer('version').default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  idx_knowledge_entries_project: index('idx_knowledge_entries_project').on(t.projectId),
  idx_knowledge_entries_category: index('idx_knowledge_entries_category').on(t.projectId, t.category)
}));

export const websiteSources = pgTable('website_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  title: varchar('title', { length: 500 }),
  extractedText: text('extracted_text'),
  status: varchar('status', { length: 50 }).default('pending'),
  chunkCount: integer('chunk_count').default(0),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  idx_website_sources_project_id: index('idx_website_sources_project_id').on(t.projectId),
  idx_website_sources_status: index('idx_website_sources_status').on(t.projectId, t.status)
}));

export const userApiKeys = pgTable('user_api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(),
  keyEncrypted: text('key_encrypted').notNull(),
  keyHint: varchar('key_hint', { length: 10 }),
  isValid: boolean('is_valid').default(true),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const widgetConfigs = pgTable('widget_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).unique(),
  templateId: varchar('template_id', { length: 100 }).default('minimal'),
  position: varchar('position', { length: 20 }).default('bottom-right'),
  theme: jsonb('theme').default({}),
  welcomeMessage: text('welcome_message').default('Hi! Ask me anything about my work.'),
  placeholderText: text('placeholder_text').default('Ask me anything...'),
  botName: varchar('bot_name', { length: 100 }).default('AI Assistant'),
  avatarUrl: text('avatar_url'),
  customCss: text('custom_css'),
  customHtml: text('custom_html'),
  allowedDomains: text('allowed_domains').array(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const credits = pgTable('credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  balance: integer('balance').default(500),
  totalUsed: integer('total_used').default(0),
  totalAdded: integer('total_added').default(500),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  delta: integer('delta').notNull(),
  reason: varchar('reason', { length: 100 }),
  projectId: uuid('project_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  idx_credit_tx_user_id: index('idx_credit_tx_user_id').on(t.userId)
}));

export const chatSessions = pgTable('chat_sessions', {
  id: varchar('id', { length: 128 }).primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  source: varchar('source', { length: 20 }).notNull(),
  visitorIpHash: text('visitor_ip_hash'),
  turnCount: integer('turn_count').default(0),
  isFlagged: boolean('is_flagged').default(false),
  flagNote: text('flag_note'),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  idx_chat_sessions_project_id: index('idx_chat_sessions_project_id').on(t.projectId),
  idx_chat_sessions_last_active: index('idx_chat_sessions_last_active').on(t.lastActiveAt),
}));

export const conversationMessages = pgTable('conversation_messages', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  sessionId: varchar('session_id', { length: 128 }).notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  sources: jsonb('sources'),
  tokenCount: integer('token_count'),
  latencyMs: integer('latency_ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  idx_conv_messages_session: index('idx_conv_messages_session').on(t.sessionId, t.createdAt),
  idx_conv_messages_project: index('idx_conv_messages_project').on(t.projectId, t.createdAt)
}));

export const analyticsEvents = pgTable('analytics_events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  projectId: uuid('project_id').notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  sessionId: varchar('session_id', { length: 128 }),
  visitorIpHash: text('visitor_ip_hash'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const templates = pgTable('templates', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  previewUrl: text('preview_url'),
  defaultTheme: jsonb('default_theme'),
  isPremium: boolean('is_premium').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});
