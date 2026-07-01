# PortfolioChat (Monorepo)

PortfolioChat is a serverless SaaS platform that allows users to create AI-powered chatbot widgets trained on their personal documents (resumes, portfolios, text files).

## Architecture

This project is structured as a Turborepo monorepo:

- `apps/dashboard`: Next.js App Router (Frontend + user management + auth)
- `apps/api`: Fastify server (Webhooks, internal endpoints)
- `packages/db`: Drizzle ORM schema + Neon connection pool

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, Material Design 3 Web Components, Tailwind CSS, Framer Motion
- **Database**: Neon Serverless Postgres (with Better Auth for Authentication)
- **Background Jobs**: Upstash QStash
- **Vector DB & Embeddings**: Cloudflare Worker + Vectorize + Workers AI (`@cf/baai/bge-large-en-v1.5`)
- **Email**: Nodemailer + Gmail SMTP

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.local.example` to `.env.local` and fill in your keys.

3. Push the database schema:
   ```bash
   npm run db:push -w @portfoliochat/db
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Rules & Constraints
- Do NOT run or build commands directly unless specified.
- The UI follows Material Design 3 specs using `@material/web`. Tailwind is only for layout/spacing.
- We use strict data isolation (Cloudflare Worker filters vector searches by `projectId`).
