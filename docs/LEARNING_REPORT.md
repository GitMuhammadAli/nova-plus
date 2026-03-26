# NovaPulse — Learning Report

**What we built, how we built it, what we learned, and what to say in interviews.**

---

## Project Overview

NovaPulse is a multi-tenant SaaS admin & operations platform. It's the most architecturally complex project in the portfolio — separate backend (NestJS) and frontend (Next.js 15), MongoDB with multi-tenant isolation, Redis caching, BullMQ job queues, Stripe billing, WebSocket real-time notifications, and a full AI layer with RAG, agents, and predictions.

**Stack:** NestJS 11 + Next.js 15 + React 19 + MongoDB + Redis + Pinecone + OpenAI + Stripe + BullMQ + Docker

---

## What Makes This Different From DevRadar/JobPilot

| Aspect | DevRadar/JobPilot | NovaPulse |
|--------|-------------------|-----------|
| Architecture | Monolith (Next.js fullstack) | Separated backend + frontend |
| Backend | tRPC / Next.js API routes | NestJS (modules, DI, guards, interceptors) |
| Database | PostgreSQL + Prisma | MongoDB + Mongoose |
| Auth | NextAuth (OAuth) | Custom JWT + MFA + refresh tokens |
| Multi-tenancy | Single tenant | Full company isolation with RBAC |
| Real-time | Polling | WebSocket (Socket.IO) |
| Payments | None | Stripe subscriptions with plan limits |
| Job Queue | Vercel Cron + QStash | BullMQ (Redis-backed) |
| AI | Groq (Llama 3.1) | OpenAI (GPT-4o) + Pinecone + LangChain |

This demonstrates: "I can build with different stacks. Not just Next.js + PostgreSQL."

---

## Key Architecture Decisions

### Why NestJS instead of Next.js API routes?
NestJS gives you proper backend structure — modules, dependency injection, guards, interceptors, pipes. For a complex SaaS with 20+ modules, this matters. Next.js API routes would become a tangled mess of files.

### Why MongoDB instead of PostgreSQL?
Multi-tenant SaaS with varied company data structures. Each company has different departments, custom fields, workflows. MongoDB's flexible schema handles this better than rigid SQL migrations.

### Why separate frontend/backend?
Scalability. Backend can be deployed independently, scaled horizontally, and maintained by different teams. Frontend is a pure Next.js app consuming the API.

---

## AI Features Deep Dive

### RAG-Powered AI Assistant
**How it works:**
1. Company data (tasks, projects, users) → chunked → embedded via OpenAI → stored in Pinecone
2. User asks question → embed query → Pinecone similarity search → top 5 chunks
3. Chunks + query → OpenAI GPT-4o → answer with source citations

**What you learn:** Full RAG pipeline (Lesson 8), embedding management, vector DB operations, source attribution.

### 4 AI Agents
- **HR Agent:** Analyze team performance, suggest role changes, churn prediction
- **Manager Agent:** Project health scoring, capacity planning, deadline risk
- **Workflow Agent:** Suggest automation rules from patterns
- **Automation Agent:** Execute triggered workflows

**What you learn:** Multi-agent patterns (Lesson 23), specialized agents with domain knowledge.

### AI Predictions
- Project completion probability
- Employee churn risk scoring
- Capacity forecasting
- Task priority optimization

**What you learn:** Using LLMs for business predictions, structured output, risk scoring.

---

## Problems Faced & How We Fixed Them

### Problem 1: Multi-Tenant Data Isolation
**What happened:** Early queries returned data from other companies. Security nightmare.

**Fix:** Added `companyId` guard on every Mongoose query. Created a `CompanyGuard` NestJS guard that injects `companyId` from JWT into every request. All service methods filter by `companyId` automatically.

**Interview answer:** "Every query goes through a company-scoped guard. The JWT contains the companyId, a NestJS guard validates it, and the service layer filters all queries by it. No cross-tenant data leakage possible."

### Problem 2: Real-Time Notifications Scale
**What happened:** WebSocket connections per company were unbounded. 100 users = 100 connections per company.

**Fix:** Socket.IO rooms — each company gets a room. Events broadcast to the room, not individual sockets. Redis adapter for multi-server broadcasting.

### Problem 3: RAG Chunk Quality
**What happened:** AI answers were generic because chunks were too small (lost context) or too large (irrelevant content mixed in).

**Fix:** Semantic chunking with overlap. Task descriptions chunked by paragraph with 50-token overlap. Project data chunked by section (description, milestones, comments separately). Each chunk includes metadata (projectId, taskId) for source citation.

### Problem 4: Stripe Webhook Reliability
**What happened:** Webhook events occasionally missed — user pays but plan doesn't upgrade.

**Fix:** Idempotent webhook handler (check if event already processed). Added retry verification: cron job every hour checks Stripe subscription status vs local DB and fixes mismatches.

---

## Interview-Ready Explanations

### "Why NestJS over Express?"
> "NestJS provides module-based architecture with dependency injection, which is essential for a SaaS with 20+ modules. Each module (auth, billing, notifications, AI) is self-contained with its own service, controller, and guards. DI makes testing easy — swap real services with mocks. Express would require manual wiring of all these patterns."

### "How does your multi-tenant system work?"
> "Each company is isolated at the application level. JWT tokens contain companyId. A NestJS guard extracts it and injects it into the request context. Every service method filters by companyId — there's no way to query another company's data. For extra safety, Mongoose schemas have companyId as a required field with an index. The billing module enforces plan limits per company."

### "Explain your RAG pipeline"
> "Data flows through 4 stages: (1) Ingestion — company data (tasks, projects, users) is collected when created/updated. (2) Chunking — semantic chunking with overlap, metadata preserved. (3) Embedding — OpenAI text-embedding-ada-002, stored in Pinecone with company namespace. (4) Retrieval — user query embedded, top 5 chunks retrieved by cosine similarity, fed to GPT-4o with system prompt. Source citations included in response."

### "How do you handle real-time features?"
> "Socket.IO with Redis adapter for multi-server support. Each company joins a Socket.IO room on connection. Events (new task, status change, mention) broadcast to the room. Frontend uses a custom `useSocket` hook that auto-reconnects. Notifications persist to MongoDB for users who are offline — they see them on next login."

---

## Tech Stack Comparison Across All Projects

| | DevRadar | JobPilot | NovaPulse |
|---|---|---|---|
| **Backend** | Next.js + tRPC | Next.js API routes | NestJS |
| **Frontend** | Next.js + React 18 | Next.js + React 18 | Next.js 15 + React 19 |
| **Database** | PostgreSQL + pgvector | PostgreSQL | MongoDB |
| **ORM** | Prisma | Prisma | Mongoose |
| **Auth** | NextAuth OAuth | NextAuth OAuth | Custom JWT + MFA |
| **AI** | Groq + Gemini | Groq + Gemini Vision | OpenAI + Pinecone |
| **Real-time** | — | — | WebSocket (Socket.IO) |
| **Payments** | — | — | Stripe |
| **Queue** | Vercel Cron + QStash | Vercel Cron | BullMQ + Redis |
| **Deploy** | Vercel | Vercel | Docker |

**This shows:** SQL + NoSQL, serverless + containerized, OAuth + custom auth, multiple AI providers, monolith + separated architecture. Full versatility.
