# ==============================================
# Mitorix Backend — Production Dockerfile
# ==============================================

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder
WORKDIR /app

# tree-sitter requires native compilation (node-gyp)
RUN apk add --no-cache python3 make g++ git

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install ALL dependencies (tsx is needed at runtime)
COPY package.json pnpm-lock.yaml ./
COPY .npmrc* ./
RUN pnpm install --frozen-lockfile


# ---- Stage 2: Production ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# simple-git needs git at runtime; tree-sitter native bindings need libstdc++
RUN apk add --no-cache git libstdc++

# Copy everything from builder (tsx + source needed at runtime)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy TypeScript source (tsx runs directly from .ts files)
COPY tsconfig.json ./
COPY src/ ./src/

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
CMD ["npx", "tsx", "src/server.ts"]
