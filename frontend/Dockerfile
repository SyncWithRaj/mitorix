# ==============================================
# Mitorix Frontend — Production Dockerfile
# ==============================================
# Build context: project root (.)
# Usage: docker compose build frontend

# ---- Stage 1: Dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy workspace config + all package.json files for lockfile validation
COPY pnpm-workspace.yaml .npmrc ./
COPY pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install frontend dependencies (workspace-aware)
RUN pnpm install --frozen-lockfile --config.minimum-release-age=0s --filter frontend

# ---- Stage 2: Builder ----
FROM node:22-alpine AS builder
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy the ENTIRE deps output (preserves pnpm symlink structure)
COPY --from=deps /app ./

# Copy frontend source code on top (node_modules excluded by .dockerignore)
COPY frontend/ ./frontend/

# Build Next.js app (using standalone output)
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* vars must be available at BUILD time in Next.js
ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app/frontend
RUN pnpm run build

# ---- Stage 3: Runner ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Automatically leverage output traces to reduce image size
COPY --from=builder /app/frontend/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
# Important for Docker: tell Next.js to listen on all interfaces
ENV HOSTNAME="0.0.0.0"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
