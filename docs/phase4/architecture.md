# Phase 4 Architecture Documentation

## System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  - Webhook Management UI                                     │
│  - Job Queue Status Dashboard                                │
│  - MFA Setup Interface                                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP/HTTPS
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Load Balancer                             │
│              (AWS ALB / Nginx / CloudFlare)                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│   API Node 1 │ │  API Node 2 │ │  API Node N │
│   (NestJS)   │ │  (NestJS)   │ │  (NestJS)   │
└───────┬──────┘ └──────┬──────┘ └──────┬──────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│   Redis      │ │  MongoDB    │ │  Workers    │
│  (Cache +    │ │  (Primary)  │ │  (BullMQ)   │
│   Queue)     │ │             │ │             │
└──────────────┘ └──────┬──────┘ └─────────────┘
                        │
                 ┌──────▼──────┐
                 │  MongoDB    │
                 │  (Replica)  │
                 └─────────────┘
```

## Data Flow

### Request Flow

1. **Client Request** → Load Balancer
2. **Load Balancer** → Routes to available API node
3. **API Node** → Processes request:
   - Validates authentication
   - Applies rate limiting (Redis)
   - Executes business logic
   - Enqueues background jobs (if needed)
   - Returns response
4. **Worker Process** → Processes queued jobs:
   - Pulls job from Redis queue
   - Executes job logic
   - Updates job status
   - Logs results

### Job Processing Flow

```
┌─────────────┐
│   API Node  │
│  Enqueues   │
│    Job      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Redis    │
│   (Queue)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Worker    │
│  Processes  │
│    Job      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │
│  (Logs)     │
└─────────────┘
```

## Component Details

### 1. API Server (NestJS)

**Responsibilities**:
- Handle HTTP requests
- Authentication & authorization
- Business logic execution
- Job enqueueing
- Response formatting

**Key Features**:
- Stateless design (no session storage)
- JWT-based authentication
- Role-based access control
- Request ID correlation
- Structured logging

**Scaling**: Horizontal scaling via load balancer

### 2. Worker Process

**Responsibilities**:
- Process background jobs
- Email delivery
- Webhook dispatch
- Workflow execution
- Report generation

**Key Features**:
- Separate process from API
- Configurable concurrency
- Automatic retries
- Dead-letter queue handling
- Graceful shutdown

**Scaling**: Scale independently based on queue depth

### 3. Redis

**Use Cases**:
1. **Queue Backend**: BullMQ uses Redis for job storage
2. **Caching**: Frequently accessed data
3. **Rate Limiting**: Distributed rate limit counters
4. **Session Store**: (Optional) If needed for future features

**Configuration**:
- Persistence: AOF (Append-Only File) recommended
- Memory: Based on queue size and cache requirements
- Replication: For high availability

### 4. MongoDB

**Schema Design**:
- Company-scoped collections
- Indexes on frequently queried fields
- TTL indexes for time-based data

**Replication**:
- Primary for writes
- Read replicas for analytics/aggregations
- Automatic failover

### 5. Load Balancer

**Features**:
- Health check routing
- SSL termination
- Request distribution
- Sticky sessions (if needed)

**Health Checks**:
- Liveness: `/api/v1/health/live`
- Readiness: `/api/v1/health/ready`

## Queue Architecture

### Queue Types

1. **Email Queue** (`nova:email`)
   - Priority: High
   - Concurrency: 5
   - Retries: 5
   - Backoff: Exponential

2. **Webhook Queue** (`nova:webhook`)
   - Priority: Medium
   - Concurrency: 10
   - Retries: 3
   - Backoff: Exponential

3. **Workflow Queue** (`nova:workflow`)
   - Priority: Medium
   - Concurrency: 3
   - Retries: 3
   - Backoff: Exponential

4. **Report Queue** (`nova:report`)
   - Priority: Low
   - Concurrency: 2
   - Retries: 2
   - Backoff: Fixed

### Job Lifecycle

```
┌──────────┐
│  Waiting │
└────┬─────┘
     │
     ▼
┌──────────┐
│  Active  │
└────┬─────┘
     │
     ├──► ┌──────────┐
     │    │Completed │
     │    └──────────┘
     │
     └──► ┌──────────┐
          │  Failed  │
          └────┬─────┘
               │
               ▼
          ┌──────────┐
          │ Retrying │
          └────┬─────┘
               │
               └──► (Back to Active or Dead Letter)
```

## Security Architecture

### Authentication Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Login Request
     ▼
┌─────────────┐
│  API Node   │
│  - Validate │
│  - Check MFA│
└────┬────────┘
     │
     │ 2. MFA Required?
     ├──► Yes ──► Return MFA Challenge
     │
     │ 3. MFA Token
     ▼
┌─────────────┐
│  API Node   │
│  - Verify   │
│  - Generate │
│    JWT      │
└────┬────────┘
     │
     │ 4. JWT Token
     ▼
┌─────────┐
│  User   │
└─────────┘
```

### Webhook Security

**HMAC Signing Process**:
1. Serialize payload to JSON
2. Create HMAC-SHA256 with webhook secret
3. Add signature to `X-NovaPulse-Signature` header
4. Receiver verifies signature before processing

**Headers**:
- `X-NovaPulse-Signature`: `sha256=<hex-digest>`
- `X-NovaPulse-Event`: Event type
- `X-NovaPulse-Webhook-Id`: Webhook identifier

## Observability Architecture

### Metrics Collection

```
┌─────────────┐
│  API Node   │
│  (Prometheus│
│   Client)   │
└──────┬──────┘
       │
       │ /metrics endpoint
       ▼
┌─────────────┐
│ Prometheus  │
│  (Scraper)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Grafana   │
│ (Dashboard) │
└─────────────┘
```

### Tracing Flow

```
Request → OpenTelemetry SDK → Span Creation
  │
  ├──► HTTP Span
  ├──► Database Span
  └──► Queue Job Span
       │
       ▼
  Trace Export (OTLP)
       │
       ▼
  Tracing Backend (Jaeger, Tempo, etc.)
```

## Scalability Considerations

### Horizontal Scaling

**API Servers**:
- Stateless design enables easy scaling
- Load balancer distributes traffic
- No shared state between instances

**Workers**:
- Scale based on queue depth
- Each worker processes jobs independently
- No coordination needed

### Vertical Scaling

**Database**:
- Connection pooling limits
- Index optimization
- Query optimization

**Redis**:
- Memory limits
- Persistence configuration
- Replication for HA

## Failure Handling

### API Server Failure

1. Load balancer detects health check failure
2. Routes traffic away from failed instance
3. Failed instance can be restarted/replaced
4. No data loss (stateless)

### Worker Failure

1. Jobs remain in Redis queue
2. Other workers continue processing
3. Failed worker can be restarted
4. Jobs automatically retried

### Redis Failure

1. Rate limiting fails open (allows requests)
2. Queue operations fail (jobs not processed)
3. Cache misses occur (fallback to database)
4. High availability via replication

### MongoDB Failure

1. Primary failure triggers replica election
2. Read replicas continue serving reads
3. Writes fail until new primary elected
4. Connection pooling handles reconnection

## Performance Optimization

### Caching Strategy

**Cache Keys**:
- `cache:company:{id}:stats` - TTL: 60s
- `cache:user:{id}:profile` - TTL: 5m
- `cache:department:{id}:members` - TTL: 5m

**Invalidation**:
- Event-based invalidation
- TTL-based expiration
- Manual cache clear

### Database Optimization

**Indexes**:
- Company ID + role
- User email (unique)
- Created/updated timestamps
- Frequently queried fields

**Query Optimization**:
- Use projections to limit fields
- Pagination for large result sets
- Aggregation pipelines for analytics

## Deployment Patterns

### Blue-Green Deployment

1. Deploy new version to "green" environment
2. Run health checks
3. Switch load balancer to green
4. Monitor for issues
5. Keep blue as rollback option

### Canary Deployment

1. Deploy to small percentage of instances
2. Monitor metrics and errors
3. Gradually increase percentage
4. Full rollout if successful

## Monitoring & Alerting

### Key Metrics

**API Metrics**:
- Request rate
- Error rate
- Latency (p50, p95, p99)
- Active connections

**Queue Metrics**:
- Queue depth
- Job processing rate
- Failure rate
- Processing time

**Infrastructure Metrics**:
- CPU usage
- Memory usage
- Disk I/O
- Network I/O

### Alert Thresholds

- **Error Rate**: > 1% for 5 minutes
- **Queue Depth**: > 1000 jobs
- **Latency**: p95 > 1 second
- **CPU**: > 80% for 10 minutes
- **Memory**: > 90% for 5 minutes

## Disaster Recovery

### Backup Strategy

**Database**:
- Daily full backups
- Continuous oplog backup
- Point-in-time recovery capability
- Backup retention: 30 days

**Redis**:
- AOF persistence
- RDB snapshots (hourly)
- Backup retention: 7 days

### Recovery Procedures

1. **Database Recovery**:
   - Restore from latest backup
   - Replay oplog to point-in-time
   - Verify data integrity

2. **Redis Recovery**:
   - Restore from AOF or RDB
   - Rebuild queue state
   - Verify job integrity

3. **Full System Recovery**:
   - Provision new infrastructure
   - Restore databases
   - Deploy application code
   - Verify health checks
   - Route traffic

## Future Enhancements

1. **CDN Integration**: Static asset delivery
2. **Object Storage**: S3/Supabase for file storage
3. **Read Replicas**: MongoDB read scaling
4. **Analytics DB**: Separate database for analytics
5. **API Gateway**: Advanced routing and throttling
6. **Service Mesh**: Istio/Linkerd for microservices

