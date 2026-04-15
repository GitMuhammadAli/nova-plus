# NovaPulse - Production-Ready Multi-Tenant SaaS Platform

> Enterprise-grade SaaS admin & operations platform built with NestJS 11 and Next.js 15. Features multi-tenant isolation, AI intelligence, real-time notifications, workflow automation, and comprehensive analytics.

## Quick Start

### Prerequisites
- Node.js 22+ and npm
- Docker Desktop (for MongoDB & Redis)

### Installation

```bash
git clone <repository-url>
cd Novapulsee

# Install all dependencies
cd backend && npm install && cd ../Frontend && npm install && cd ..
```

### Start Services

```bash
# Terminal 1 - Infrastructure
docker-compose up -d mongodb redis

# Terminal 2 - Backend (http://localhost:5500)
cd backend && npm run start:dev

# Terminal 3 - Frontend (http://localhost:3100)
cd Frontend && npm run dev
```

### Environment Setup

**Backend (`backend/.env`):**
```env
NODE_ENV=development
PORT=5500
MONGO_URI=mongodb://root:password@localhost:27017/novapulse?authSource=admin
REDIS_URL=redis://localhost:6380
JWT_SECRET=your-secure-secret-key-min-32-chars
JWT_ACCESS_SECRET=your-access-token-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-chars
FRONTEND_URL=http://localhost:3100
STRIPE_SECRET_KEY=sk_test_your_stripe_key

# Optional
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password
OPENAI_API_KEY=your_openai_key          # For AI features
PINECONE_API_KEY=your_pinecone_key      # For AI vector search
```

**Frontend (`Frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5500
```

## Architecture

```
NovaPulse Platform
├── Frontend (Next.js 15 + React 19 + Redux Toolkit + Tailwind + shadcn/ui)
├── Backend (NestJS + MongoDB + Redis + WebSocket)
├── AI Layer (OpenAI + Pinecone + RAG Pipeline)
└── Infrastructure (Docker + MongoDB + Redis)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Redux Toolkit, Tailwind CSS, shadcn/ui, Framer Motion, Recharts |
| Backend | NestJS 11, MongoDB/Mongoose, Passport JWT, Socket.IO, BullMQ |
| AI | OpenAI GPT-4o, Pinecone Vector DB, LangChain, RAG Pipeline |
| Infrastructure | Docker, Redis, Cloudinary, Stripe, Mailtrap |
| Testing | Jest, Playwright, Supertest |

### Project Structure

```
Novapulsee/
├── backend/src/
│   ├── modules/
│   │   ├── auth/           # JWT auth, MFA, sessions
│   │   ├── user/           # User CRUD, roles
│   │   ├── company/        # Multi-tenant companies
│   │   ├── project/        # Project management
│   │   ├── task/           # Task tracking
│   │   ├── department/     # Department management
│   │   ├── team/           # Team management
│   │   ├── invite/         # Invitation system
│   │   ├── dashboard/      # Dashboard stats
│   │   ├── analytics/      # Real-time analytics
│   │   ├── workflow/       # Automation workflows
│   │   ├── audit/          # Audit logging
│   │   ├── billing/        # Stripe billing
│   │   ├── uploads/        # File uploads (Cloudinary)
│   │   ├── webhook/        # Webhook system
│   │   ├── notifications/  # Real-time notifications (WebSocket)
│   │   ├── export/         # CSV data export
│   │   ├── integrations/   # Third-party integrations
│   │   ├── email/          # Email (Mailtrap)
│   │   ├── health/         # Health checks & system status
│   │   ├── ai/             # AI intelligence layer
│   │   │   ├── agents/     # HR, Manager, Workflow, Automation agents
│   │   │   ├── analytics/  # AI insights, risk scoring, predictions
│   │   │   ├── chat/       # RAG-powered AI assistant
│   │   │   ├── pipeline/   # Ingestion, chunking, embedding
│   │   │   └── vector/     # Pinecone integration
│   │   └── settings/       # Company settings
│   └── common/             # Guards, filters, interceptors, logging
│
└── Frontend/
    ├── app/
    │   ├── (dashboard)/    # Protected dashboard pages
    │   ├── (marketing)/    # Public marketing pages
    │   ├── store/          # Redux slices
    │   └── services/       # API service layer
    ├── components/
    │   ├── ui/             # shadcn/ui components
    │   ├── layout/         # Sidebar, Topbar, AppShell
    │   ├── ai/             # AI components
    │   ├── automation/     # Workflow builder
    │   └── notifications/  # Notification bell
    └── hooks/              # Custom React hooks
```

## Features

### Core Platform
| Feature | Status | Description |
|---------|--------|-------------|
| Authentication | Complete | JWT + MFA + refresh tokens + sessions |
| Multi-Tenancy | Complete | Company isolation with RBAC |
| User Management | Complete | CRUD, roles, departments, bulk ops |
| Project Management | Complete | CRUD, status, user assignment |
| Task Management | Complete | CRUD, comments, status, priority, recurring |
| Department Management | Complete | CRUD, manager assignment, members |
| Team Management | Complete | Team CRUD, member assignment |
| Invite System | Complete | Email invites with token acceptance |

### Operations & Analytics
| Feature | Status | Description |
|---------|--------|-------------|
| Dashboard | Complete | Role-based dashboards (admin, manager, user) |
| Analytics | Complete | Real-time traffic, devices, conversion funnel |
| Audit Logs | Complete | Complete activity tracking with CSV export |
| Reports | Complete | Configurable reports with filters |
| Data Export | Complete | CSV export for users, tasks, projects, audit logs |

### Automation & AI
| Feature | Status | Description |
|---------|--------|-------------|
| NovaFlow Workflows | Complete | Visual drag-and-drop workflow builder |
| AI Chat Assistant | Complete | RAG-powered chat with source citations |
| AI Insights | Complete | Company-wide insights, risk scoring |
| AI Agents | Complete | HR, Manager, Workflow, Automation agents |
| AI Reports | Complete | Daily/weekly AI-generated summaries |
| Predictions | Complete | Churn risk, capacity, project completion |

### Infrastructure
| Feature | Status | Description |
|---------|--------|-------------|
| Real-time Notifications | Complete | WebSocket gateway + bell indicator |
| File Uploads | Complete | Cloudinary with thumbnails, signed URLs |
| Billing | Complete | Stripe subscriptions, plan limits |
| Webhooks | Complete | HMAC-signed, retry, delivery logs |
| Integrations | Complete | Email, Slack, Google OAuth |
| Health Monitoring | Complete | MongoDB, Redis, memory, system status |
| Email | Complete | Mailtrap SMTP with templates |
| System Status | Complete | Real-time service monitoring dashboard |

## API Endpoints

All endpoints prefixed with `/api/v1`

```
Auth:           POST /auth/login|register|logout|refresh, GET /auth/me
                POST /auth/mfa/setup|verify|disable
Users:          GET|POST /user, GET|PATCH|DELETE /user/:id
Company:        POST /company/register, GET|PATCH /company/:id, GET /company/:id/stats
Departments:    GET|POST /departments, GET|PATCH|DELETE /departments/:id
Projects:       GET|POST /projects, GET|PATCH|DELETE /projects/:id
Tasks:          GET|POST /tasks, GET /tasks/me, PATCH /tasks/:id/status
Analytics:      GET /analytics/stats|traffic|devices|conversion|top-pages
Workflows:      GET|POST /workflow, POST /workflow/:id/execute
Audit:          GET /audit
Billing:        GET|POST /billing, POST /billing/webhook
Uploads:        POST /uploads, GET /uploads, POST /uploads/signed-url
Webhooks:       GET|POST /webhooks, POST /webhooks/:id/test
Notifications:  GET /notifications, PATCH /notifications/:id/read, PATCH /notifications/read-all
Export:         GET /export/users|tasks|projects|audit-logs|analytics
Health:         GET /health, GET /health/live, GET /health/ready, GET /health/status
AI:             POST /ai/chat|search, GET /ai/insights|risks|summary/:type
Integrations:   POST /integrations/email/test|slack/test, GET /integrations/oauth/google/start
```

## User Roles

| Role | Capabilities |
|------|-------------|
| `SUPER_ADMIN` | Full platform access, manage all companies |
| `COMPANY_ADMIN` | Manage company users, projects, settings, billing |
| `MANAGER` | Create projects/tasks, manage team, view analytics |
| `USER` | View assigned tasks, update status, personal dashboard |

Default super admin: `admin@novapulse.com` / `admin123`

## Security

- JWT with HttpOnly cookies (15min access, 7d refresh)
- MFA via TOTP (Google Authenticator / Authy)
- bcrypt password hashing (10 rounds)
- Helmet.js security headers
- Rate limiting (Throttler + Redis)
- Company-scoped data isolation
- Role-based guards on all endpoints
- AES-256-CBC encryption for integration secrets
- HMAC-SHA256 webhook payload signing
- Input validation (class-validator, whitelist mode)
- CORS with environment-based origins

## Testing

```bash
# Backend unit tests
cd backend && npm test

# Backend e2e tests
cd backend && npm run test:e2e

# Frontend e2e tests (Playwright)
cd Frontend && npm run test:e2e
```

## Deployment

```bash
# Backend
cd backend && npm run build && npm run start:prod

# Frontend
cd Frontend && npm run build && npm start
```

Set `NEXT_PUBLIC_API_URL` to your production backend URL.

---

**Version:** 3.0
**Last Updated:** April 2026
**Status:** Production Ready
