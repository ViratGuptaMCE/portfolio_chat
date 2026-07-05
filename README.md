# PortfolioChat (Monorepo)

PortfolioChat is a serverless SaaS platform that allows users to create AI-powered chatbot widgets trained on their personal documents (resumes, portfolios, text files, and website URLs).

---

## Architecture & Workspaces

This project is structured as a Turborepo monorepo using **100% pure JavaScript ES Modules**:

- **`apps/dashboard`**: Next.js App Router (Frontend UI, Modular Knowledge Base, Command Center, Profile Settings, PDF parsing via `pdf-parse`, and Better Auth API integration)
- **`apps/api`**: Fastify server in pure ES Module JavaScript (`node --watch src/index.js`), handling Headless RAG Chat API (`/v1/chat/message`), document/website ingestion webhooks (`/webhooks/ingest`), `@langchain/textsplitters` 512-token semantic chunking, and Cloudflare Worker vector embedding dispatch
- **`packages/db`**: Drizzle ORM schema (`schema.js`) + Neon Serverless PostgreSQL connection pool (`index.js`), exported natively as ES Modules

---

## Ingestion & Embedding Pipeline

```
[1. PDF / Text / Website URL] ──► Dashboard Action inserts 'processing' record into Neon DB
                                        │
                                        ▼
[2. Upstash QStash Queue]     ──► Publishes ingestion job asynchronously to QStash Queue
                                        │
                                        ▼
[3. Fastify Webhook Engine]   ──► `apps/api` fetches text/scrapes URL (with Jina SPA fallback)
                                  └─ Splits content into 512-token chunks via `@langchain/textsplitters`
                                        │
                                        ▼
[4. Cloudflare Worker]       ──► Dispatches `POST ${CLOUDFLARE_WORKER_URL}/embed` per chunk
                                  └─ Generates `@cf/baai/bge-large-en-v1.5` Workers AI embeddings
                                  └─ Inserts vectors into Cloudflare Vectorize DB
                                        │
                                        ▼
[5. Finalized Record]        ──► Updates document / knowledge / website status to 'ready' in Neon DB
                                        │
                                        ▼
[6. Real-Time Status Cache]  ──► Invalidates Upstash Redis key (`redisDel`); next read serves cached 'ready' data
                                        │
                                        ▼
[7. Vector Deletion Cleanup] ──► On delete, triggers `POST /delete-vectors` to erase vector chunks from Cloudflare Vectorize
```

---

## Security & Authentication Model

### 1. Zero-Hint SHA-256 API Key Storage
- **Public Widget Token (`pct_pub_...`)**: Stored in DB as-is for drop-in client-side `<script>` tag embeds.
- **Secret API Key (`pct_secret_...`)**: Generated in memory using 256 bits of cryptographic randomness (`crypto.randomBytes(24)`). **NEVER stored in the database**.
- **SHA-256 Database Hash**: The server computes `crypto.createHash('sha256').update(rawSecretKey).digest('hex')` and stores strictly `apiKeyHash` in Neon Postgres.
- **One-Time Key Display Modal**: Shown once upon creation or key regeneration with a strict warning: *"This won't be shown again. Store it somewhere safe!"*. After closing the modal, secret keys display strictly as masked asterisks (`••••••••••••••••••••••••••••••••`).

### 2. Non-Pastable Confirmation Security Verification
- **Key Regeneration Confirmation**: Requires manually typing `"I confirm to regenerate the key"` into a non-pastable input box (`onPaste={(e) => e.preventDefault()}`).
- **Knowledge Base Deletion Confirmation**: Deleting an item requires manually typing the exact `documentId`, `knowledgeId`, or `websiteId` (copy-pasting disabled).

---

## Features & Core Modules

### 1. Modular Knowledge Base (`apps/dashboard/app/dashboard/projects/[projectId]/knowledge/`)
- **[UploadedFilesTab.js](file:///C:/port_ragbot/apps/dashboard/app/dashboard/projects/%5BprojectId%5D/knowledge/components/UploadedFilesTab.js)**: PDF file drop zone, size limit checks, document status tracking, and read-only parsed text reader modal.
- **[ManualEntriesTab.js](file:///C:/port_ragbot/apps/dashboard/app/dashboard/projects/%5BprojectId%5D/knowledge/components/ManualEntriesTab.js)**: Structured text entry creation with tags, category filtering (`Work Experience`, `Projects`, `Skills`, `Education`, `Bio`, `Other`), version incrementing, and inline editing modal.
- **[WebsiteUrlsTab.js](file:///C:/port_ragbot/apps/dashboard/app/dashboard/projects/%5BprojectId%5D/knowledge/components/WebsiteUrlsTab.js)**: Dual-mode source ingestion:
  - **Website URL Mode**: Portfolio website URL crawling, Chrome browser header fetching, and automatic Jina AI Reader (`r.jina.ai`) fallback for client-rendered React/Vite SPAs.
  - **GitHub Repositories Mode**: Fetch public repositories by GitHub username, browse repository metadata (stars, primary language, updated date), view scrollable `README.md` content in a modal, and click "Save the Data" to chunk, embed, and vectorize the README.md content into the project's vector database.
- **Real-Time Polling & Redis Bypass**: Dashboard polls DB status every 1.2s while items are `processing` or `scraping`, bypassing Redis cache until all items reach `ready`.

### 2. Strict Free Tier Quota & Usage Policy (USAGE_RULES.sample.md)
- **Chunking Specification**: Standardized 2000-character chunk size with 250-character overlap ($\lceil \text{length} / 1750 \rceil$) across both frontend and backend.
- **PDF Uploads**: 10 PDFs / day reset limit (00:00 UTC), 200 PDF chunks max storage limit.
- **Knowledge Entries**: 50 Entries / day reset limit (00:00 UTC), 100 Knowledge chunks max storage limit.
- **Web & GitHub URLs**: 5 URLs / day reset limit (00:00 UTC), 5 simultaneous URLs stored limit, 200 Web chunks max storage limit.
- **Atomic Operation**: All-or-nothing pre-validation before calling Cloudflare Workers AI or Cloudflare Vectorize DB APIs.

### 3. Chronological Conversation History Module (`apps/dashboard/app/dashboard/projects/[projectId]/conversations/`)
- **Date-Based Chronological Grouping**: Multi-turn sessions automatically grouped into clean date buckets (`Today`, `Yesterday`, `Earlier This Week`, or exact calendar dates).
- **Multi-Filter & Search Engine**: Real-time search across visitor questions + filters for date ranges (`All Dates`, `Today Only`, `Last 7 Days`, `Last 30 Days`) and sources (`Widget`, `Headless API`).
- **Interactive Transcript Modal ([ConversationDetailModal.js](file:///C:/port_ragbot/apps/dashboard/app/dashboard/projects/%5BprojectId%5D/conversations/components/ConversationDetailModal.js))**: Full chat transcript viewer with message bubbles, latency timing, expandable **Retrieved Context Sources** panel (vector chunks & similarity scores), flag toggles, and JSON/copy export actions.
- **Non-Pastable Deletion Guard**: Manual session ID typing verification to prevent accidental conversation log deletion.

### 4. Chatbot Customizer Studio Module (`apps/dashboard/app/dashboard/projects/[projectId]/customizer/`)
- **Split-Screen Studio Architecture**: Left-side 13-category settings studio panel + right-side real-time interactive widget preview canvas.
- **Draft vs. Published State Machine**: Experiment freely in **Draft Mode** (`draft_config`) without affecting embedded live widgets until **Publish to Live** is clicked.
- **6 One-Click Theme Presets**: *Minimal Dark*, *Clean Corporate*, *Frosted Glass*, *Cyber Neon*, *Playful Rounded*, and *Modern Slate*.
- **13 Deep Customization Panels**: Appearance, Widget Launcher, Header, Welcome Experience, Layout & Bubbles, AI Personality (temperature slider & tone presets), Prompt Chips editor (max 6 chips), and Developer Embed & CSS settings.
- **Export & Import**: Download configuration as JSON backup or import JSON to clone branding across projects.

### 5. Headless RAG Chat API (`apps/api/src/routes/chat/index.js`)
- **API Endpoint**: `POST /v1/chat/message` supporting `Authorization: Bearer <pct_secret_...>` authentication.
- **Context Search**: Queries Cloudflare Vectorize DB namespace for `projectId` + fallback text retrieval from Neon Postgres (`knowledgeEntries`, `documents`, `websiteSources`).
- **Structured Markdown AI Answers**: Formatted responses with bullet points, numbered lists, bold highlights, and clean typography without robotic preambles (*"According to my knowledge base..."*).

### 6. Project Settings Module (`apps/dashboard/app/dashboard/projects/[projectId]/settings/`)
- **Dedicated `project_settings` Storage**: Decoupled settings table supporting standalone API users as well as widget deployments.
- **AI Model & Intelligence Control**: Select model (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`), tone pills, temperature slider, max tokens, target language, and custom prompt directives.
- **Developer & API Controls**: Master API switch, rate limit RPM slider, CORS allowed origins list, custom developer CSS, and custom developer HTML injection.
- **Widget Release & Embed Security**: Master widget switch, semantic release versioning (`v1.0.0`), and authorized embed domain whitelisting.
- **Keys & Danger Zone**: Public widget token, non-pastable API key regeneration modal, and non-pastable project deletion verification.

---

## Database Table Schemas

### `website_sources` (Neon Postgres)
```sql
CREATE TABLE website_sources (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  title           VARCHAR(500),
  extracted_text  TEXT,
  status          VARCHAR(50) DEFAULT 'pending',
  chunk_count     INTEGER DEFAULT 0,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_website_sources_project_id ON website_sources(project_id);
```

*(See [TABLES.md](file:///C:/port_ragbot/TABLES.md) for full project schema documentation).*

---

## Tech Stack

### Frontend (`apps/dashboard`)
- **Framework**: Next.js 16 (App Router), React 19
- **Parsing**: `pdf-parse` for binary PDF text extraction
- **Styling & Aesthetic**: Modern Tech-Minimalist design system with monochromatic high-contrast UI
- **Animations**: Framer Motion (Emil Kowalski design engineering principles: fluid `layoutId` tab transitions, spring physics, micro-interactions)
- **Authentication**: Better Auth with Email/Password, Password Reset / Forgot Password flow, Magic Link, Nodemailer SMTP verification, and Google OAuth support

### Backend (`apps/api`)
- **API Server**: Fastify (Native JavaScript ES Modules)
- **Ingestion & Processing**: `@langchain/textsplitters` 512-token semantic chunking
- **Vector DB & Edge AI**: Cloudflare Worker + Vectorize + Workers AI (`@cf/baai/bge-large-en-v1.5`) via `CLOUDFLARE_WORKER_URL` & `CLOUDFLARE_WORKER_AUTH_TOKEN`
- **LLM Gateway**: Groq (`llama-3.3-70b-versatile` / `llama-3.1-70b`)
- **Queue & Webhooks**: Upstash QStash & Redis Cache

---

## Guidelines & Strict Rules (`AGENTS.md`)

- **Command Execution Rules**: Never execute `run` or `build` commands directly on terminal; perform required edits directly in code.
- **Pure JavaScript Workspace**: `apps/api` and `packages/db` run on native JavaScript ES Modules (`.js` files with explicit relative extensions).
- **Frontend Design System**: Tech-Minimalist aesthetic with high white-space, geometric controls, and Emil Kowalski motion principles (`.agents/skills/emil-design-eng`).
- **Single Environment Source**: All environment variables reside in the root `.env.local`.
- **Security & Secrets**: Never expose API keys, credentials, or internal identifiers in public repositories or user responses.
