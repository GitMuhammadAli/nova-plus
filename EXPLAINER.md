# NovaPulse — How to Explain This Project

> 2-minute talking-points version. Pair with [README.md](README.md) for the full feature matrix and [docs/MASTER_GUIDE.md](docs/MASTER_GUIDE.md) for the (frozen) original curriculum.

---

**One-liner.** NovaPulse is a multi-tenant SaaS admin & operations platform — Linear/Notion/Vercel-shaped — with a built-in AI layer that runs four specialist agents (HR, Manager, Workflow, Automation) over the company's own data via a RAG pipeline.

**The problem.** Mid-size companies stitch together 8 SaaS tools (a project tracker, a workflow builder, a chatbot, a billing dashboard, an analytics tool, …) and pay per seat for each. NovaPulse is the opinionated "everything for ops in one tenant-isolated instance" play, with an AI assistant that actually knows your company's data because it indexed it into Pinecone.

**Architecture in five bullets.**
- **NestJS 11 backend** (`backend/src/modules/*`, ~20 modules) + **Next.js 15 + React 19 + Redux Toolkit + shadcn/ui** frontend.
- **MongoDB** for the operational store, **Redis** for rate-limit + session + queue (BullMQ), **Pinecone** for the RAG vector index, **Cloudinary** for files, **Stripe** for subscriptions, **Mailtrap** for email.
- **Multi-tenant isolation** at the data layer: every model carries `companyId`, every guard enforces it, RBAC layered on top (SUPER_ADMIN → COMPANY_ADMIN → MANAGER → USER).
- **AI layer (`modules/ai/*`)**: ingestion → chunking → OpenAI embedding → Pinecone upsert → 4 agents (HR/Manager/Workflow/Automation) with a RAG-powered chat that cites sources.
- **Real-time**: Socket.IO gateway for notifications + a notification bell with unread state in Redux.

**Three hardest calls.**
1. *Why MongoDB instead of Postgres.* The operational schema (workflows, audit logs, AI conversation history, dynamic settings per company) is heavily document-shaped with per-tenant variability. Mongo's flexible schema beats jsonb columns when every company customizes structure.
2. *Why Pinecone instead of pgvector / Mongo Atlas vector.* Pinecone's free tier is generous and the latency is consistent under load. Keeping vectors out of the operational DB also means you can re-index without a migration.
3. *Why a custom workflow builder (NovaFlow) instead of n8n / Zapier embed.* In-product workflows need to read company-scoped tenant data. Embedding an external builder would require exporting that data over webhooks; building it in-tree keeps the trigger/action surface inside the same auth boundary.

**Status (April 2026).** Production-ready, version 3.0. Every feature in the README's "Complete" column is shipped: auth + MFA, multi-tenancy, projects/tasks/teams, workflows, AI agents/chat/insights/predictions, billing, webhooks, real-time notifications, file uploads, audit logs, CSV export, health monitoring.

**Lead with this in an interview.** "NovaPulse is the project where I had to think about *every* SaaS concern at once — multi-tenancy, RBAC, billing, real-time, AI, audit, file storage, integrations. The piece I'll defend hardest is the AI layer: how the RAG pipeline keeps each tenant's vectors isolated in Pinecone namespaces, and why I built four specialist agents instead of one general one. Specialist agents with constrained tool surfaces are easier to evaluate and easier to keep cheap."
