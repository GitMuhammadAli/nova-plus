# Phase 4 Deployment Guide

## Prerequisites

- Docker and Docker Compose (for local development)
- Kubernetes cluster (for production)
- Redis instance (managed or self-hosted)
- MongoDB instance (managed or self-hosted)
- Domain name and SSL certificates
- CI/CD pipeline (GitHub Actions, GitLab CI, etc.)

## Local Development Setup

### 1. Start Dependencies

```bash
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Start MongoDB
docker run -d -p 27017:27017 mongo:6
```

### 2. Environment Configuration

Create `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/novapulse

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
ACCESS_TOKEN_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=7d

# Redis
REDIS_URL=redis://localhost:6379

# Queue
QUEUE_CONCURRENCY=5

# Email
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your-user
MAILTRAP_PASS=your-pass
EMAIL_FROM=noreply@novapulse.com

# Frontend
FRONTEND_URL=http://localhost:3100

# Service
SERVICE_NAME=novapulse-api
```

### 3. Start Services

**Terminal 1 - API Server**:
```bash
cd backend
npm install
npm run build
npm run start:dev
```

**Terminal 2 - Worker**:
```bash
cd backend
npm run start:worker
```

**Terminal 3 - Frontend**:
```bash
cd Frontend
npm install
npm run dev
```

### 4. Verify Setup

```bash
# Health check
curl http://localhost:5000/api/v1/health

# Queue stats
curl http://localhost:5000/api/v1/queue/stats

# Metrics
curl http://localhost:5000/api/v1/metrics
```

## Docker Deployment

### Dockerfile (API Server)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
EXPOSE 5000
CMD ["node", "dist/main.js"]
```

### Dockerfile (Worker)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/worker.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_DATABASE: novapulse

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongodb:27017/novapulse
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - mongodb

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongodb:27017/novapulse
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - mongodb

volumes:
  redis-data:
  mongo-data:
```

### Build and Run

```bash
docker-compose build
docker-compose up -d
```

## Kubernetes Deployment

### Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: novapulse
```

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: novapulse-config
  namespace: novapulse
data:
  NODE_ENV: "production"
  PORT: "5000"
  QUEUE_CONCURRENCY: "5"
  SERVICE_NAME: "novapulse-api"
```

### Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: novapulse-secrets
  namespace: novapulse
type: Opaque
stringData:
  MONGO_URI: "mongodb://mongodb:27017/novapulse"
  REDIS_URL: "redis://redis:6379"
  JWT_ACCESS_SECRET: "your-secret"
  JWT_REFRESH_SECRET: "your-secret"
```

### API Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: novapulse-api
  namespace: novapulse
spec:
  replicas: 3
  selector:
    matchLabels:
      app: novapulse-api
  template:
    metadata:
      labels:
        app: novapulse-api
    spec:
      containers:
      - name: api
        image: novapulse/api:latest
        ports:
        - containerPort: 5000
        envFrom:
        - configMapRef:
            name: novapulse-config
        - secretRef:
            name: novapulse-secrets
        livenessProbe:
          httpGet:
            path: /api/v1/health/live
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health/ready
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Worker Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: novapulse-worker
  namespace: novapulse
spec:
  replicas: 2
  selector:
    matchLabels:
      app: novapulse-worker
  template:
    metadata:
      labels:
        app: novapulse-worker
    spec:
      containers:
      - name: worker
        image: novapulse/worker:latest
        envFrom:
        - configMapRef:
            name: novapulse-config
        - secretRef:
            name: novapulse-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: novapulse-api
  namespace: novapulse
spec:
  selector:
    app: novapulse-api
  ports:
  - port: 80
    targetPort: 5000
  type: ClusterIP
```

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: novapulse-ingress
  namespace: novapulse
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.novapulse.com
    secretName: novapulse-tls
  rules:
  - host: api.novapulse.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: novapulse-api
            port:
              number: 80
```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build API Image
        run: |
          docker build -t novapulse/api:${{ github.sha }} ./backend
          docker push novapulse/api:${{ github.sha }}
      
      - name: Build Worker Image
        run: |
          docker build -t novapulse/worker:${{ github.sha }} ./backend
          docker push novapulse/worker:${{ github.sha }}
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/novapulse-api \
            api=novapulse/api:${{ github.sha }} \
            -n novapulse
          kubectl set image deployment/novapulse-worker \
            worker=novapulse/worker:${{ github.sha }} \
            -n novapulse
          kubectl rollout status deployment/novapulse-api -n novapulse
          kubectl rollout status deployment/novapulse-worker -n novapulse
```

## Production Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Secrets stored in secure vault
- [ ] Database backups configured
- [ ] Redis persistence enabled
- [ ] SSL certificates obtained
- [ ] Domain DNS configured
- [ ] Monitoring dashboards set up
- [ ] Alerting rules configured

### Deployment

- [ ] Build Docker images
- [ ] Push images to registry
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Verify health checks
- [ ] Monitor metrics

### Post-Deployment

- [ ] Verify API endpoints
- [ ] Test webhook delivery
- [ ] Check queue processing
- [ ] Monitor error rates
- [ ] Review logs
- [ ] Verify MFA functionality

## Rollback Procedure

### Kubernetes Rollback

```bash
# Rollback API
kubectl rollout undo deployment/novapulse-api -n novapulse

# Rollback Worker
kubectl rollout undo deployment/novapulse-worker -n novapulse

# Check status
kubectl rollout status deployment/novapulse-api -n novapulse
```

### Docker Compose Rollback

```bash
# Stop current containers
docker-compose down

# Start previous version
docker-compose -f docker-compose.previous.yml up -d
```

## Scaling

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: novapulse-api-hpa
  namespace: novapulse
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: novapulse-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Manual Scaling

```bash
# Scale API
kubectl scale deployment novapulse-api --replicas=5 -n novapulse

# Scale Workers
kubectl scale deployment novapulse-worker --replicas=3 -n novapulse
```

## Monitoring Setup

### Prometheus ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: novapulse-api
  namespace: novapulse
spec:
  selector:
    matchLabels:
      app: novapulse-api
  endpoints:
  - port: http
    path: /api/v1/metrics
    interval: 30s
```

## Troubleshooting

### Common Issues

1. **API not starting**:
   - Check environment variables
   - Verify MongoDB connection
   - Check Redis connection
   - Review logs

2. **Workers not processing jobs**:
   - Verify Redis connection
   - Check queue stats
   - Review worker logs
   - Verify worker is running

3. **High memory usage**:
   - Check connection pool sizes
   - Review queue depth
   - Adjust worker concurrency
   - Check for memory leaks

4. **Database connection errors**:
   - Verify connection string
   - Check network connectivity
   - Review connection pool limits
   - Check database logs

## Security Hardening

1. **Secrets Management**:
   - Use Kubernetes Secrets
   - Rotate secrets regularly
   - Never commit secrets to git

2. **Network Security**:
   - Use private networks
   - Enable TLS/SSL
   - Configure firewall rules

3. **Container Security**:
   - Use minimal base images
   - Scan for vulnerabilities
   - Run as non-root user

4. **API Security**:
   - Enable rate limiting
   - Use HTTPS only
   - Validate all inputs
   - Implement CORS properly

