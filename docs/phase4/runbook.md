# Phase 4 Operations Runbook

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Common Tasks](#common-tasks)
3. [Troubleshooting](#troubleshooting)
4. [Emergency Procedures](#emergency-procedures)
5. [Maintenance Windows](#maintenance-windows)

## Daily Operations

### Health Check Routine

**Morning Checklist**:
```bash
# 1. Check API health
curl https://api.novapulse.com/api/v1/health

# 2. Check queue stats
curl https://api.novapulse.com/api/v1/queue/stats

# 3. Check metrics
curl https://api.novapulse.com/api/v1/metrics | grep -E "(queue_size|http_request_errors)"

# 4. Review error logs
kubectl logs -f deployment/novapulse-api -n novapulse --tail=100 | grep ERROR
```

### Monitoring Queue Health

**Check Queue Depths**:
```bash
# Via API
curl https://api.novapulse.com/api/v1/queue/stats | jq

# Via Redis CLI
redis-cli
> LLEN nova:email:waiting
> LLEN nova:webhook:waiting
> LLEN nova:workflow:waiting
> LLEN nova:report:waiting
```

**Alert Thresholds**:
- Email queue > 500 jobs: Warning
- Email queue > 1000 jobs: Critical
- Failed jobs > 100: Warning
- Failed jobs > 500: Critical

## Common Tasks

### Adding a New Worker

**Kubernetes**:
```bash
kubectl scale deployment novapulse-worker --replicas=3 -n novapulse
kubectl rollout status deployment/novapulse-worker -n novapulse
```

**Docker Compose**:
```bash
docker-compose scale worker=3
```

**Verify**:
```bash
# Check worker logs
kubectl logs -f deployment/novapulse-worker -n novapulse

# Check queue processing
curl https://api.novapulse.com/api/v1/queue/stats
```

### Restarting Queue

**Graceful Restart**:
```bash
# Kubernetes
kubectl rollout restart deployment/novapulse-worker -n novapulse

# Docker Compose
docker-compose restart worker
```

**Force Restart** (if graceful fails):
```bash
# Kubernetes
kubectl delete pod -l app=novapulse-worker -n novapulse

# Docker Compose
docker-compose stop worker
docker-compose start worker
```

### Clearing Failed Jobs

**Via Redis**:
```bash
redis-cli
> DEL nova:email:failed
> DEL nova:webhook:failed
> DEL nova:workflow:failed
> DEL nova:report:failed
```

**Via BullMQ Dashboard** (if configured):
- Access dashboard at configured URL
- Navigate to failed jobs
- Select and delete or retry

### Viewing Webhook Logs

**Via API**:
```bash
# Get webhook logs
curl -H "Authorization: Bearer $TOKEN" \
  https://api.novapulse.com/api/v1/webhooks/{webhookId}/logs
```

**Via Database**:
```javascript
// MongoDB query
db.webhooklogs.find({ webhookId: ObjectId("...") })
  .sort({ createdAt: -1 })
  .limit(50)
```

### Testing Webhook

**Via API**:
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  https://api.novapulse.com/api/v1/webhooks/{webhookId}/test
```

**Verify Delivery**:
```bash
# Check logs
curl -H "Authorization: Bearer $TOKEN" \
  https://api.novapulse.com/api/v1/webhooks/{webhookId}/logs | jq '.[0]'
```

## Troubleshooting

### Queue Jobs Not Processing

**Symptoms**:
- Queue depth increasing
- No worker activity in logs
- Jobs stuck in "waiting" state

**Diagnosis**:
```bash
# 1. Check if workers are running
kubectl get pods -l app=novapulse-worker -n novapulse

# 2. Check worker logs
kubectl logs -f deployment/novapulse-worker -n novapulse

# 3. Check Redis connection
redis-cli ping

# 4. Check queue stats
curl https://api.novapulse.com/api/v1/queue/stats
```

**Solutions**:
1. **Workers not running**: Restart worker deployment
2. **Redis connection issue**: Check Redis service and network
3. **Job errors**: Review failed jobs and error messages
4. **High concurrency**: Reduce QUEUE_CONCURRENCY if memory issues

### Webhook Delivery Failures

**Symptoms**:
- Webhook logs show "failed" status
- High retry count
- Error messages in logs

**Diagnosis**:
```bash
# 1. Check webhook logs
curl -H "Authorization: Bearer $TOKEN" \
  https://api.novapulse.com/api/v1/webhooks/{webhookId}/logs

# 2. Check webhook configuration
curl -H "Authorization: Bearer $TOKEN" \
  https://api.novapulse.com/api/v1/webhooks/{webhookId}

# 3. Test webhook manually
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  https://api.novapulse.com/api/v1/webhooks/{webhookId}/test
```

**Common Issues**:
1. **Invalid URL**: Verify webhook URL is accessible
2. **SSL Certificate**: Check if receiver accepts SSL
3. **Timeout**: Increase timeout in webhook worker
4. **Signature Verification**: Verify receiver validates HMAC signature

### High Memory Usage

**Symptoms**:
- Pods restarting due to OOM
- High memory metrics
- Slow response times

**Diagnosis**:
```bash
# 1. Check memory usage
kubectl top pods -n novapulse

# 2. Check metrics
curl https://api.novapulse.com/api/v1/metrics | grep memory

# 3. Review logs for memory warnings
kubectl logs -f deployment/novapulse-api -n novapulse | grep -i memory
```

**Solutions**:
1. **Reduce concurrency**: Lower QUEUE_CONCURRENCY
2. **Increase limits**: Adjust resource limits in deployment
3. **Scale horizontally**: Add more API instances
4. **Review code**: Check for memory leaks

### Database Connection Issues

**Symptoms**:
- Connection timeout errors
- High connection count
- Slow queries

**Diagnosis**:
```bash
# 1. Check MongoDB connection
mongosh "mongodb://..." --eval "db.adminCommand('ping')"

# 2. Check connection pool
curl https://api.novapulse.com/api/v1/metrics | grep db_connection_pool

# 3. Review MongoDB logs
# (Check MongoDB server logs)
```

**Solutions**:
1. **Increase pool size**: Adjust MONGO_MAX_POOL_SIZE
2. **Check network**: Verify network connectivity
3. **Review queries**: Optimize slow queries
4. **Scale database**: Add read replicas

## Emergency Procedures

### API Server Outage

**Immediate Actions**:
1. Check load balancer health checks
2. Verify all API pods are running
3. Review recent deployments
4. Check error logs

**Recovery Steps**:
```bash
# 1. Check pod status
kubectl get pods -l app=novapulse-api -n novapulse

# 2. Restart if needed
kubectl rollout restart deployment/novapulse-api -n novapulse

# 3. Rollback if recent deployment
kubectl rollout undo deployment/novapulse-api -n novapulse

# 4. Verify recovery
curl https://api.novapulse.com/api/v1/health
```

### Worker Outage

**Immediate Actions**:
1. Check worker pod status
2. Review queue depth
3. Check Redis connectivity
4. Review worker logs

**Recovery Steps**:
```bash
# 1. Restart workers
kubectl rollout restart deployment/novapulse-worker -n novapulse

# 2. Scale up if needed
kubectl scale deployment novapulse-worker --replicas=5 -n novapulse

# 3. Monitor queue processing
watch -n 5 'curl -s https://api.novapulse.com/api/v1/queue/stats | jq'
```

### Redis Outage

**Immediate Actions**:
1. Check Redis service status
2. Verify network connectivity
3. Check Redis logs
4. Review failover status (if using cluster)

**Recovery Steps**:
```bash
# 1. Restart Redis (if self-hosted)
kubectl rollout restart statefulset/redis -n novapulse

# 2. Verify connection
redis-cli -h <redis-host> ping

# 3. Check queue state
redis-cli -h <redis-host> KEYS "nova:*"

# 4. Restart workers to reconnect
kubectl rollout restart deployment/novapulse-worker -n novapulse
```

### Database Outage

**Immediate Actions**:
1. Check MongoDB service status
2. Verify primary/replica status
3. Check network connectivity
4. Review MongoDB logs

**Recovery Steps**:
```bash
# 1. Check replica set status
mongosh "mongodb://..." --eval "rs.status()"

# 2. Promote replica if primary failed
mongosh "mongodb://..." --eval "rs.stepDown()"

# 3. Update connection string if needed
kubectl set env deployment/novapulse-api \
  MONGO_URI="mongodb://new-primary:27017/novapulse" -n novapulse

# 4. Restart API to reconnect
kubectl rollout restart deployment/novapulse-api -n novapulse
```

## Maintenance Windows

### Planned Maintenance

**Pre-Maintenance Checklist**:
- [ ] Notify users (if needed)
- [ ] Backup databases
- [ ] Document current state
- [ ] Prepare rollback plan

**Maintenance Steps**:
1. Scale down workers (drain queues)
2. Wait for queues to empty
3. Perform maintenance
4. Verify health checks
5. Scale up workers
6. Monitor for issues

**Post-Maintenance Verification**:
```bash
# 1. Health checks
curl https://api.novapulse.com/api/v1/health

# 2. Queue stats
curl https://api.novapulse.com/api/v1/queue/stats

# 3. Test critical endpoints
curl https://api.novapulse.com/api/v1/auth/login -X POST -d '...'

# 4. Monitor metrics for 30 minutes
```

### Database Maintenance

**Backup Before Maintenance**:
```bash
# MongoDB backup
mongodump --uri="mongodb://..." --out=/backup/$(date +%Y%m%d)

# Redis backup
redis-cli --rdb /backup/redis-$(date +%Y%m%d).rdb
```

**Index Maintenance**:
```javascript
// Rebuild indexes
db.collection.reIndex()

// Check index usage
db.collection.aggregate([{ $indexStats: {} }])
```

### Application Updates

**Deployment Process**:
1. Build new Docker images
2. Deploy to staging
3. Run smoke tests
4. Deploy to production (canary)
5. Monitor metrics
6. Full rollout
7. Verify health

**Rollback Process**:
```bash
# Kubernetes
kubectl rollout undo deployment/novapulse-api -n novapulse
kubectl rollout undo deployment/novapulse-worker -n novapulse

# Verify
kubectl rollout status deployment/novapulse-api -n novapulse
```

## Performance Tuning

### Queue Optimization

**Adjust Concurrency**:
```bash
# Update ConfigMap
kubectl edit configmap novapulse-config -n novapulse
# Change QUEUE_CONCURRENCY value

# Restart workers
kubectl rollout restart deployment/novapulse-worker -n novapulse
```

**Monitor Impact**:
- Queue depth should decrease
- Job processing time should improve
- Memory usage may increase

### Database Optimization

**Connection Pool Tuning**:
```env
MONGO_MAX_POOL_SIZE=20
MONGO_MIN_POOL_SIZE=5
```

**Query Optimization**:
- Add indexes for frequently queried fields
- Use projections to limit returned fields
- Implement pagination for large result sets

### Caching Strategy

**Cache Key Patterns**:
- `cache:company:{id}:stats` - TTL: 60s
- `cache:user:{id}:profile` - TTL: 5m
- `cache:department:{id}:members` - TTL: 5m

**Cache Invalidation**:
- Event-based: Invalidate on updates
- TTL-based: Automatic expiration
- Manual: Clear via admin API

## Monitoring & Alerts

### Key Metrics to Monitor

1. **API Metrics**:
   - Request rate
   - Error rate (4xx, 5xx)
   - Latency (p50, p95, p99)
   - Active connections

2. **Queue Metrics**:
   - Queue depth per queue
   - Job processing rate
   - Failure rate
   - Average processing time

3. **Infrastructure Metrics**:
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network I/O

### Alert Configuration

**Critical Alerts**:
- API error rate > 5% for 5 minutes
- Queue depth > 2000 jobs
- Database connection failures
- Redis connection failures

**Warning Alerts**:
- API error rate > 1% for 10 minutes
- Queue depth > 1000 jobs
- High memory usage (> 85%)
- High CPU usage (> 80%)

## Backup & Recovery

### Backup Schedule

**Daily Backups**:
- MongoDB: Full backup at 2 AM UTC
- Redis: RDB snapshot at 3 AM UTC
- Retention: 30 days

**Backup Verification**:
```bash
# Verify MongoDB backup
mongorestore --dry-run /backup/20240101

# Verify Redis backup
redis-cli --rdb-check /backup/redis-20240101.rdb
```

### Recovery Procedures

**Database Recovery**:
1. Stop application
2. Restore from backup
3. Replay oplog (if available)
4. Verify data integrity
5. Restart application

**Full System Recovery**:
1. Provision infrastructure
2. Restore databases
3. Deploy application
4. Verify health checks
5. Route traffic

## Contact & Escalation

### On-Call Rotation

- **Primary**: [Contact Info]
- **Secondary**: [Contact Info]
- **Escalation**: [Contact Info]

### Escalation Path

1. **Level 1**: On-call engineer
2. **Level 2**: Team lead
3. **Level 3**: Engineering manager
4. **Level 4**: CTO

### Communication Channels

- **Slack**: #novapulse-alerts
- **PagerDuty**: [Integration]
- **Email**: alerts@novapulse.com

