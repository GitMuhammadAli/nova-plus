# Phase 4: Enterprise Infrastructure & Scalability

## Overview

Phase 4 transforms NovaPulse into a production-grade, horizontally scalable SaaS platform. This phase introduces queueing, caching, multi-server readiness, database reliability practices, observability, secure webhooks, and enterprise security features.

## Table of Contents

1. [Architecture](#architecture)
2. [Components](#components)
3. [Deployment](#deployment)
4. [Operations](#operations)
5. [Monitoring](#monitoring)
6. [Security](#security)

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Load Balancer  │ (ALB / Nginx)
└────────┬────────┘
         │
    ┌────┴────┐
    │        │
┌───▼───┐ ┌──▼───┐
│ API 1 │ │ API 2│ (Multiple stateless NestJS instances)
└───┬───┘ └──┬───┘
    │        │
    └────┬───┘
         │
    ┌────▼────┐
    │  Redis  │ (Cache, Rate Limiting, Queue Backend)
    └────┬────┘
         │
    ┌────▼────┐
    │ MongoDB │ (Primary + Read Replicas)
    └─────────┘

┌─────────────┐
│   Workers   │ (Separate processes for job processing)
│  (BullMQ)   │
└─────────────┘
```

### Key Components

1. **Stateless API Servers**: Multiple NestJS instances behind a load balancer
2. **Worker Processes**: Separate processes for background job processing
3. **Redis**: Used for caching, rate limiting, and BullMQ backend
4. **MongoDB**: Primary database with optional read replicas
5. **Observability Stack**: OpenTelemetry, Prometheus, Grafana

## Components

### 1. Queue System (BullMQ + Redis)

**Purpose**: Asynchronous job processing for emails, webhooks, workflows, and reports.

**Queues**:
- `nova:email` - Email delivery jobs
- `nova:webhook` - Webhook dispatch jobs
- `nova:workflow` - Workflow execution jobs
- `nova:report` - Report generation jobs

**Usage**:
```typescript
// Enqueue a job
await queueService.addEmailJob({
  to: 'user@example.com',
  template: 'welcome',
  data: { name: 'John' }
}, {
  attempts: 5,
  backoff: { type: 'exponential', delay: 2000 }
});
```

### 2. Worker Processes

**Entry Point**: `backend/src/worker.ts`

**Running Workers**:
```bash
npm run start:worker
```

Workers process jobs from Redis queues with configurable concurrency.

### 3. Webhook System

**Features**:
- HMAC-SHA256 signing for security
- Automatic retries with exponential backoff
- Delivery logging and status tracking
- Event-based subscriptions

**Creating a Webhook**:
```typescript
POST /api/v1/webhooks
{
  "url": "https://example.com/webhook",
  "events": ["task.created", "user.updated"],
  "retries": 3,
  "isActive": true
}
```

### 4. MFA (Multi-Factor Authentication)

**Implementation**: TOTP (Time-based One-Time Password) using speakeasy

**Flow**:
1. User requests MFA setup → Backend generates secret + QR code
2. User scans QR code with authenticator app
3. User verifies with 6-digit code → MFA enabled
4. On login, if MFA enabled → User must provide TOTP code

**Endpoints**:
- `POST /api/v1/auth/mfa/setup` - Generate secret and QR code
- `POST /api/v1/auth/mfa/verify` - Verify and enable MFA
- `POST /api/v1/auth/mfa/disable` - Disable MFA

### 5. Distributed Rate Limiting

**Implementation**: Redis-backed rate limiting

**Limits**:
- Login/Register: 5 requests per minute
- Invite creation: 10 requests per minute
- General API: 100 requests per minute (configurable)

**Key Generation**: `throttle:{companyId}:{ip}:{route}`

### 6. Health Checks

**Endpoints**:
- `GET /api/v1/health` - Full health check (MongoDB, Redis, Memory)
- `GET /api/v1/health/live` - Liveness probe
- `GET /api/v1/health/ready` - Readiness probe (MongoDB, Redis)

### 7. Observability

**Metrics**: Prometheus metrics exposed at `/api/v1/metrics`

**Tracing**: OpenTelemetry instrumentation for HTTP requests and database queries

**Logs**: Winston structured logging with correlation IDs

## Deployment

### Prerequisites

1. **Redis**: Version 6.0+ (managed service recommended)
2. **MongoDB**: Version 5.0+ (replica set recommended)
3. **Node.js**: Version 18+
4. **Environment Variables**: See `.env.example`

### Environment Variables

```env
# Redis
REDIS_URL=redis://localhost:6379

# Queue Configuration
QUEUE_CONCURRENCY=5

# Service Name (for tracing)
SERVICE_NAME=novapulse-api

# Existing variables
MONGO_URI=mongodb://localhost:27017/novapulse
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-secret
```

### Docker Deployment

**API Server**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
CMD ["node", "dist/main.js"]
```

**Worker Process**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
CMD ["node", "dist/worker.js"]
```

### Kubernetes Deployment

See `docs/phase4/deploy.md` for detailed Kubernetes manifests.

### Scaling

**Horizontal Scaling**:
- API servers: Scale based on CPU/memory metrics
- Workers: Scale based on queue depth
- Use load balancer for API traffic distribution

**Vertical Scaling**:
- Increase `QUEUE_CONCURRENCY` for workers
- Adjust MongoDB connection pool size
- Tune Redis memory limits

## Operations

### Starting Services

**Development**:
```bash
# Terminal 1: API Server
cd backend
npm run start:dev

# Terminal 2: Worker
cd backend
npm run start:worker
```

**Production**:
```bash
# API Server
npm run start:prod

# Worker
npm run start:worker
```

### Monitoring Queue Health

**Check Queue Stats**:
```bash
curl http://localhost:5000/api/v1/queue/stats
```

**Monitor Redis**:
```bash
redis-cli
> INFO stats
> KEYS nova:*
```

### Graceful Shutdown

Both API and worker processes handle SIGTERM/SIGINT gracefully:
1. Stop accepting new requests/jobs
2. Wait for in-flight operations to complete
3. Close connections (MongoDB, Redis)
4. Shutdown OpenTelemetry
5. Exit

### Common Operations

**Restart Workers**:
```bash
# Send SIGTERM to worker process
kill -TERM <worker-pid>

# Or use process manager
pm2 restart worker
```

**Clear Failed Jobs**:
```bash
# Access Redis
redis-cli
> DEL nova:email:failed
> DEL nova:webhook:failed
```

**View Queue Metrics**:
- Access `/api/v1/metrics` endpoint
- Scrape with Prometheus
- Visualize in Grafana

## Monitoring

### Key Metrics

1. **HTTP Metrics**:
   - `http_request_duration_seconds`
   - `http_requests_total`
   - `http_request_errors_total`

2. **Queue Metrics**:
   - `queue_job_duration_seconds`
   - `queue_jobs_total`
   - `queue_job_errors_total`
   - `queue_size`

3. **Database Metrics**:
   - `db_query_duration_seconds`
   - `db_connection_pool_size`

4. **Redis Metrics**:
   - `redis_command_duration_seconds`
   - `redis_connection_status`

### Alerts

Configure alerts for:
- High 5xx error rates (> 1%)
- Queue backlog > 1000 jobs
- Job failure rate > 10%
- High database latency (> 500ms)
- Redis connection failures

## Security

### Webhook Security

**HMAC Signing**:
- All webhook payloads are signed with HMAC-SHA256
- Signature header: `X-NovaPulse-Signature`
- Format: `sha256=<hex-digest>`

**Verification** (on receiver side):
```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');
const expected = `sha256=${signature}`;
```

### MFA Security

- TOTP secrets stored encrypted in database
- Recovery codes generated during setup
- MFA required on login if enabled
- Window tolerance: ±2 time steps (60 seconds)

### Rate Limiting

- Distributed rate limiting using Redis
- Per-company and per-IP limits
- Fail-open behavior if Redis is unavailable

## Troubleshooting

### Queue Jobs Not Processing

1. Check worker is running: `ps aux | grep worker`
2. Check Redis connection: `redis-cli ping`
3. Check queue stats: `GET /api/v1/queue/stats`
4. Review worker logs for errors

### Webhook Delivery Failures

1. Check webhook logs: `GET /api/v1/webhooks/:id/logs`
2. Verify webhook URL is accessible
3. Check signature verification on receiver
4. Review retry attempts in logs

### High Memory Usage

1. Check health endpoint: `GET /api/v1/health`
2. Review Prometheus metrics for memory
3. Adjust worker concurrency
4. Review MongoDB connection pool size

## Next Steps

1. Set up Prometheus + Grafana dashboards
2. Configure alerting rules
3. Set up log aggregation (ELK, Loki, etc.)
4. Implement database backups
5. Set up CI/CD pipelines
6. Load testing and optimization

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [NestJS Best Practices](https://docs.nestjs.com/)

