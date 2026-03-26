# NovaPulse Documentation

> **Version:** 3.0 | **Last Updated:** March 2026

---

## Guides

| Document | What's Inside |
|----------|---------------|
| [Master Guide](./MASTER_GUIDE.md) | Full build guide -- every phase from foundation to AI layer |
| [Setup Guide](./SETUP.md) | Local dev setup, Docker, environment config, troubleshooting |
| [API Reference](./API_REFERENCE.md) | Every endpoint with methods, auth, request/response shapes |

---

## Quick Links

- **Frontend:** http://localhost:3100
- **Backend API:** http://localhost:5500/api/v1
- **Health Check:** http://localhost:5500/api/v1/health

## Getting Started

```bash
# 1. Start infrastructure
docker-compose up -d mongodb redis

# 2. Backend
cd backend && npm install && npm run start:dev

# 3. Frontend
cd Frontend && npm install && npm run dev
```

See [Setup Guide](./SETUP.md) for full instructions.
