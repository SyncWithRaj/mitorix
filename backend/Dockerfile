# ==============================================
# Mitorix Backend — Production Dockerfile
# ==============================================
# Build context: project root (.)
# Usage: docker compose build backend

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder
WORKDIR /app

# tree-sitter requires native compilation (node-gyp)
RUN apk add --no-cache python3 make g++ git

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy workspace config + all package.json files for lockfile validation
COPY pnpm-workspace.yaml .npmrc ./
COPY pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install only backend dependencies
RUN pnpm install --frozen-lockfile --config.minimum-release-age=0s --filter backend


# ---- Stage 2: Production ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# simple-git needs git at runtime; tree-sitter native bindings need libstdc++
RUN apk add --no-cache git libstdc++

# Enable pnpm for runtime (pnpm exec tsx)
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy everything from builder (tsx + source needed at runtime)
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./

# Copy TypeScript source (tsx runs directly from .ts files)
COPY backend/tsconfig.json ./
COPY backend/src/ ./src/

# Create storage directory for cloned repos
RUN mkdir -p /app/storage

# Don't run as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

# Use tsx to run TypeScript directly (same as dev mode)
# This avoids ESM import extension issues that tsc compilation produces
CMD ["pnpm", "exec", "tsx", "src/server.ts"]
