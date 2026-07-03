# PortfolioChat (Monorepo)

PortfolioChat is a serverless SaaS platform that allows users to create AI-powered chatbot widgets trained on their personal documents (resumes, portfolios, text files).

---

## Architecture & Workspaces

This project is structured as a Turborepo monorepo using **100% pure JavaScript ES Modules**:

- **`apps/dashboard`**: Next.js App Router (Frontend UI, Knowledge Base Management, Profile Settings, PDF parsing via `pdf-parse`, and Better Auth API integration)
- **`apps/api`**: Fastify server in pure ES Module JavaScript (`node --watch src/index.js`), handling document ingestion webhooks (`/webhooks/ingest`), `@langchain/textsplitters` 512-token semantic chunking, and Cloudflare Worker vector embedding dispatch
- **`packages/db`**: Drizzle ORM schema (`schema.js`) + Neon Serverless PostgreSQL connection pool (`index.js`), exported natively as ES Modules

---

## Ingestion & Embedding Pipeline

```
[1. PDF / Text Entry]  ──► Dashboard Server Action parses text & inserts into Neon DB
                                  │
                                  ▼
[2. Upstash QStash]    ──► Publishes ingestion job asynchronously to QStash Queue
                                  │
                                  ▼
[3. Fastify Webhook]   ──► `apps/api` splits content into 512-token chunks via `@langchain/textsplitters`
                                  │
                                  ▼
[4. Cloudflare Worker] ──► Dispatches `POST ${CLOUDFLARE_WORKER_URL}/embed` per chunk
                           └─ Generates `@cf/baai/bge-large-en-v1.5` Workers AI embeddings
                           └─ Inserts vectors into Cloudflare Vectorize DB
                                  │
                                  ▼
[5. Finalized]         ──► Updates document / knowledge entry status to 'ready' in Neon Postgres
                                  │
                                  ▼
[6. Real-Time Cache]   ──► Invalidates Upstash Redis key (`redisDel`); next read serves cached 'ready' data
                                  │
                                  ▼
[7. Deletion Cleanup]  ──► On delete, triggers `POST /delete-vectors` to erase vector chunks from Cloudflare Vectorize
```

---

## Tech Stack

### Frontend (`apps/dashboard`)
- **Framework**: Next.js 16 (App Router), React 19
- **Parsing**: `pdf-parse` for binary PDF text extraction
- **Styling & Aesthetic**: Modern Tech-Minimalist design system with monochromatic high-contrast UI
- **Animations**: Framer Motion (Emil Kowalski design engineering principles: fluid `layoutId` tab transitions, spring physics, micro-interactions)
- **Knowledge Base Management**: Manual text entry & PDF upload fully synchronized with database schema (`category`, `tags`, `content`, `version`, category filtering, read-only parsed PDF text viewer modal, and edit modal with versioning).
- **Authentication**: Better Auth with Email/Password, Magic Link, Nodemailer SMTP verification, and Google OAuth support

### Backend (`apps/api`)
- **API Server**: Fastify (Native JavaScript ES Modules)
- **Ingestion & Processing**: `@langchain/textsplitters` 512-token semantic chunking
- **Vector DB & Edge AI**: Cloudflare Worker + Vectorize + Workers AI (`@cf/baai/bge-large-en-v1.5`) via `CLOUDFLARE_WORKER_URL` & `CLOUDFLARE_WORKER_AUTH_TOKEN`
- **LLM Gateway**: Groq (Llama 3.3 70B / Llama 3.1 70B) / Google Gemini 1.5 Flash
- **Headless Chat API**: `POST /v1/chat/message` endpoint featuring API Key authentication (`Bearer <pct_key>`), Vector RAG retrieval from Cloudflare Vectorize DB, Groq LLM inference, and multi-turn session logging.
- **Overview Command Center**: API key management (show/hide toggle, real-time key regeneration with confirmation dialogs), ready-to-run code snippets in Python (`requests`), cURL (JSON), and JavaScript, plus an in-dashboard interactive Live API Tester / Playground.
- **Queue & Webhooks**: Upstash QStash

### Infrastructure & Single Environment
- **Database**: Neon Serverless Postgres
- **Email Service**: Nodemailer (Gmail SMTP / custom SMTP) with asynchronous fire-and-forget dispatch
- **Single Source Env**: Configured in `.env.local` at the monorepo root (`C:\port_ragbot\.env.local`). Loaded dynamically by both `apps/dashboard` and `apps/api` via `dotenv-cli`.

---

## Deployment Strategy

1. **Vercel Deployment (Frontend + Auth)**:
   - Root Directory: `apps/dashboard`
   - Framework: Next.js
   - Handles the Tech-Minimalist UI and Better Auth API routes out of the box as Serverless Functions.

2. **Render Deployment (Backend Processing)**:
   - Root Directory: `apps/api`
   - Command: `node src/index.js`
   - Handles background webhooks, PDF processing, and chunking jobs.

---

## Guidelines & Strict Rules (`AGENTS.md`)

- **Command Execution Rules**: Never execute `run` or `build` commands directly on terminal; perform required edits directly in code.
- **Pure JavaScript Workspace**: `apps/api` and `packages/db` run on native JavaScript ES Modules (`.js` files with explicit relative extensions).
- **Frontend Design System**: Tech-Minimalist aesthetic with high white-space, geometric controls, and Emil Kowalski motion principles (`.agents/skills/emil-design-eng`).
- **Single Environment Source**: All environment variables reside in the root `.env.local`.
- **Security & Secrets**: Never expose API keys, credentials, or internal identifiers in public repositories or user responses.
