# ============================================
# NOVAPULSE BACKEND - PRODUCTION DOCKERFILE
# ============================================
# Multi-stage build for optimal image size

# ============================================
# Stage 1: Build
# ============================================
# Install ALL deps (including devDependencies like @nestjs/cli)
# because we need them to run "nest build"
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json* .npmrc* ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# ============================================
# Stage 2: Production Dependencies Only
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json* .npmrc* ./
RUN npm install --omit=dev --legacy-peer-deps

# ============================================
# Stage 3: Production Runner
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy necessary files from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Create logs directory (winston needs it)
RUN mkdir -p logs && chown nestjs:nodejs logs

# Switch to non-root user
USER nestjs

# Expose the application port
EXPOSE 5500

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5500/api/v1/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]

