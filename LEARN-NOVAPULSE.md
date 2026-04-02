# Learn NovaPulse — Complete Breakdown

> "Read it → Google what you don't know → Explain it out loud"

---

## WHAT THIS PROJECT IS

NovaPulse is an enterprise multi-tenant workforce management platform with AI. Companies manage projects, tasks, teams, and departments — while AI provides insights, risk scoring, predictive analytics, and a RAG-powered chat assistant.

**User flow:** Register company → invite team → create projects → assign tasks → AI analyzes performance + risks

---

## THE TECH STACK

| Tech | What It Is | Why |
|------|-----------|-----|
| **NestJS 11** | Backend framework | Enterprise-grade Node.js with modules, DI, guards |
| **Next.js 15** | Frontend | React with server-side rendering |
| **MongoDB** | Database | Flexible schemas for multi-tenant data |
| **Mongoose** | MongoDB ORM | Schema validation + TypeScript types |
| **Redis** | Cache + queue backend | Fast caching, BullMQ queue storage |
| **Pinecone** | Vector database | Stores embeddings for RAG |
| **OpenAI** | LLM (GPT-4o-mini) | Chat, agents, embeddings |
| **BullMQ** | Job queue | Async AI processing |
| **Socket.IO** | WebSockets | Real-time notifications |
| **Stripe** | Payments | Subscription billing |
| **Passport** | Auth | JWT + role-based guards |
| **Docker** | Containers | 7-service orchestration |
| **GitHub Actions** | CI/CD | Automated lint/test/build/deploy |

---

## PROJECT STRUCTURE

```
Novapulsee/
├── backend/                ← NestJS API + Workers
│   └── src/
│       ├── modules/        ← 24 feature modules
│       │   ├── ai/         ← RAG, agents, embeddings, analytics
│       │   ├── auth/       ← JWT + MFA + sessions
│       │   ├── billing/    ← Stripe subscriptions
│       │   ├── company/    ← Multi-tenant companies
│       │   ├── task/       ← Task management
│       │   ├── project/    ← Project management
│       │   ├── notifications/ ← WebSocket gateway
│       │   └── ...20 more modules
│       ├── common/         ← Guards, interceptors, middleware
│       ├── providers/      ← Cache, queue, Redis
│       ├── workers/        ← Background job processors
│       └── config/         ← Environment configuration
│
├── Frontend/               ← Next.js app
│   └── app/
│       ├── (dashboard)/    ← 25+ dashboard pages
│       ├── (admin)/        ← Admin panel
│       └── (marketing)/    ← Blog, pricing, features
│
├── docker-compose.yml      ← 7 services
├── .github/workflows/      ← 4 CI/CD pipelines
```

---

## PHASE 1: NestJS Architecture (How The Backend Works)

### 1.1 Modules — The Building Blocks
NestJS organizes code into MODULES. Each module = one feature:

```
Module = Controller (HTTP) + Service (Logic) + DTOs (Validation) + Entities (Data)
```

| Module | What It Manages |
|--------|----------------|
| `auth` | Login, register, JWT tokens, MFA, sessions |
| `company` | Companies (tenants) |
| `user` | User CRUD, profiles |
| `department` | Departments within companies |
| `project` | Projects |
| `task` | Tasks (create, assign, update status) |
| `team` | Teams and members |
| `billing` | Stripe subscriptions, plan limits |
| `notifications` | WebSocket real-time notifications |
| `ai` | RAG, chat, agents, embeddings, analytics |
| `audit` | Audit logging for compliance |
| `workflow` | Workflow automation engine |
| `invite` | Team invitations |
| `uploads` | File storage (Cloudinary) |
| `export` | Data export |
| `health` | Health check endpoints |
| `webhook` | External webhook management |

**Read:** `backend/src/modules/auth/` — look at controller.ts, service.ts, module.ts

**Can you explain?**
- [ ] What's a Module in NestJS? (organized feature: controller + service + entities)
- [ ] What's Dependency Injection? (services are injected, not imported)
- [ ] What's a Controller vs Service? (controller handles HTTP, service has business logic)

### 1.2 Guards — Security Checks
**Files:** `backend/src/modules/auth/guards/`

- `JwtAuthGuard` — checks if JWT token is valid
- `RolesGuard` — checks if user has required role (admin, manager, user)
- `CompanyGuard` — checks if user belongs to this company (tenant isolation)

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('/users')
getUsers() { ... }  // Only authenticated admins can call this
```

**Can you explain?**
- [ ] What's a Guard? When does it run? (before the route handler)
- [ ] What's the difference between JwtAuthGuard and RolesGuard?
- [ ] How does CompanyGuard prevent Company A from accessing Company B's data?

### 1.3 Common Infrastructure
**Files:** `backend/src/common/`

| File | What It Does |
|------|-------------|
| `interceptors/logging.interceptor.ts` | Logs every request (method, URL, duration) |
| `interceptors/transform.interceptor.ts` | Wraps responses in `{ data, statusCode, timestamp }` |
| `interceptors/request-id.interceptor.ts` | Adds unique ID to every request |
| `filters/http-exception.filter.ts` | Catches errors, formats error responses |
| `guards/redis-throttle.guard.ts` | Rate limiting using Redis |
| `middleware/request-timeout.middleware.ts` | Kills requests after timeout |
| `decorators/current-user.decorator.ts` | `@CurrentUser()` — gets user from JWT |
| `decorators/roles.decorator.ts` | `@Roles('admin')` — defines required roles |
| `tracing/opentelemetry.ts` | OpenTelemetry instrumentation |
| `logger/winston.logger.ts` | Structured logging with daily rotation |

---

## PHASE 2: The AI Module (The Brain)

### 2.1 RAG Pipeline
**Files:**
| File | Step |
|------|------|
| `ai/pipeline/cleaner.service.ts` | Step 1: Clean text (strip HTML, normalize) |
| `ai/pipeline/chunk.service.ts` | Step 2: Split into 1000-char chunks with 200 overlap |
| `ai/pipeline/embedding.service.ts` | Step 3: Embed chunks (OpenAI text-embedding-3-small, 1536d) |
| `ai/vector/pinecone.service.ts` | Step 4: Store vectors in Pinecone (per-tenant namespace) |
| `ai/chat/rag.service.ts` | Step 5: Query — embed question → search Pinecone → GPT-4o-mini answers |
| `ai/pipeline/ingestion.consumer.ts` | Orchestrator: listens for events → runs full pipeline |

**Data flow:**
```
Entity Created/Updated (user, task, project)
  → Event emitted
  → BullMQ worker picks up
  → Clean text
  → Chunk (1000 chars, 200 overlap)
  → Embed (text-embedding-3-small, 1536d)
  → Upsert to Pinecone (tenant namespace)

User asks question
  → Embed question
  → Search Pinecone (top 5 chunks)
  → Build prompt: "Context: [chunks]. Question: [query]"
  → GPT-4o-mini generates answer
  → Return with source attribution
```

**Can you explain?**
- [ ] What's RAG? (Retrieval-Augmented Generation — give the LLM YOUR data)
- [ ] Why chunk at 1000 chars with 200 overlap? (overlap prevents losing info at boundaries)
- [ ] What's Pinecone? How is it different from pgvector? (managed service vs PostgreSQL extension)
- [ ] What's a namespace in Pinecone? (tenant isolation — Company A's data separate from Company B)

### 2.2 AI Agents (4 Types)
| Agent | File | What It Does |
|-------|------|-------------|
| **Manager** | `agents/manager-agent.service.ts` | Detects user intent: question vs action (confidence > 0.7) |
| **HR** | `agents/hr-agent.service.ts` | Morale detection, hiring recommendations, overload detection |
| **Workflow** | `agents/workflow-agent.service.ts` | Natural language → structured workflow parsing |
| **Automation** | `agents/automation-agent.service.ts` | Detects repetitive patterns, suggests automations |

**Manager Agent actions it can detect:**
- ASSIGN_DEPARTMENT, INVITE_USER, DEACTIVATE_USER
- CREATE_TASK, ASSIGN_TASK, CREATE_DEPARTMENT, ASSIGN_MANAGER

**Can you explain?**
- [ ] How does the Manager Agent decide question vs action? (JSON mode + confidence threshold)
- [ ] What happens if confidence < 0.7? (falls back to RAG Q&A)

### 2.3 Analytics & Prediction
| File | What It Does |
|------|-------------|
| `analytics/risk-score.service.ts` | Multi-factor risk score (0-100) per user/dept/company |
| `analytics/ai-insights.service.ts` | Company-wide insights, burnout alerts, anomaly detection |
| `analytics/prediction.service.ts` | Churn prediction, capacity forecasting, completion estimation |

### 2.4 Scheduled AI Jobs
**File:** `ai/jobs/ai-scheduler.service.ts`
| Schedule | Job |
|----------|-----|
| Daily 9 AM | Generate daily summary |
| Monday 8 AM | Generate weekly insights |
| Every hour | Sync ingestion |
| Daily 6 AM | Risk assessment |

---

## PHASE 3: Real-Time (WebSockets)

**File:** `backend/src/modules/notifications/notifications.gateway.ts`
- Socket.IO WebSocket gateway
- JWT authentication on connection
- Users join company-specific rooms
- Notifications broadcast to correct tenant only

---

## PHASE 4: Billing (Stripe)

**File:** `backend/src/modules/billing/`
- Stripe subscription integration
- Plan limits guard: `plan-limits.guard.ts` — blocks actions if plan limit exceeded
- Plan config: defines limits per plan (free: 5 users, pro: 50 users, enterprise: unlimited)

---

## PHASE 5: Docker & CI/CD

### Docker Compose (7 services)
**File:** `docker-compose.yml`

| Service | Image | Port |
|---------|-------|------|
| mongodb | mongo:7 | 27017 |
| redis | redis:7-alpine | 6380 |
| backend | NestJS API | 5500 |
| worker | Background jobs | (no port) |
| frontend | Next.js | 3100 |
| mongo-express | DB admin UI | 8081 |
| redis-commander | Redis admin UI | 8082 |

### CI/CD (4 workflows)
| Workflow | What It Does |
|----------|-------------|
| `ci.yml` | Lint → test → build (backend + frontend + Docker) |
| `cd.yml` | Build Docker images → push to GHCR → deploy |
| `security.yml` | CodeQL + dependency audit + TruffleHog secret scan |
| `release.yml` | Release management |

---

## PHASE 6: Frontend (Next.js 15)

25+ pages across 4 role-based dashboards:

| Role | Dashboard | Key Pages |
|------|-----------|-----------|
| **User** | `/dashboard/user` | tasks, projects, notifications |
| **Manager** | `/dashboard/manager` | team overview, task assignment |
| **Company Admin** | `/dashboard/company-admin` | departments, billing, settings |
| **Super Admin** | `/dashboard/super-admin` | all companies, system health |

AI pages: `/ai-chat`, `/ai-insights`, `/ai-reports`

---

## STUDY ORDER

```
Day 1:  NestJS basics — modules, controllers, services (Phase 1.1)
Day 2:  Guards, interceptors, middleware (Phase 1.2-1.3)
Day 3:  RAG pipeline — clean → chunk → embed → store → query (Phase 2.1)
Day 4:  AI agents — Manager + HR agents (Phase 2.2)
Day 5:  Risk scoring + predictions (Phase 2.3)
Day 6:  Database — MongoDB schemas, tenant isolation
Day 7:  WebSockets + notifications (Phase 3)
Day 8:  Billing + Stripe (Phase 4)
Day 9:  Docker + CI/CD (Phase 5)
Day 10: Frontend — role-based dashboards (Phase 6)
Day 11: Workers — BullMQ, email worker, AI ingest worker
Day 12: Review — explain the whole system
```
