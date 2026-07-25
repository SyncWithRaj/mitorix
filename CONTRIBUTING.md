# Contributing to Mitorix

Thank you for your interest in contributing to Mitorix! This document provides guidelines and instructions to help you get started.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Architecture](#project-architecture)
- [Coding Standards](#coding-standards)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Be kind, constructive, and professional in all interactions.

---

## Getting Started

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | 22.x (LTS) | Use [nvm](https://github.com/nvm-sh/nvm) — `.nvmrc` is included |
| **pnpm** | 10.x | Installed automatically via `corepack` in `setup.sh` |
| **Docker & Docker Compose** | Latest | For MongoDB, Redis, Qdrant |
| **Git** | Latest | Required by backend at runtime too |
| **OS build tools** | — | `python3`, `make`, `g++`, `git` (`setup.sh` handles this) |

### Step 1: Clone & Install

```bash
git clone https://github.com/your-org/mitorix.git
cd mitorix

# Switch to Node 22 (if using nvm)
nvm use

# Install all dependencies & initialize project
chmod +x setup.sh
./setup.sh
```

The setup script will:
1. Validate Node.js v22+
2. Check/install `pnpm` via corepack
3. Install OS-level build tools (for tree-sitter native compilation)
4. Run `pnpm install` across the workspace
5. Scaffold `.env` from `.env.example` template
6. Automatically start Redis and Qdrant via `make dev`

### Step 2: Configure Environment

Edit `.env` and fill in your secrets:

```bash
nano .env
```

At minimum, you need:
- `JWT_SECRET` — Generate a strong random string

Optional (for full functionality & API key rotation):
- `GOOGLE_API_KEY` — [Get a Gemini API key](https://aistudio.google.com/apikey) (comma-separated keys supported for rotation)
- `COHERE_API_KEY` — [Get a Cohere API key](https://dashboard.cohere.com/api-keys) (comma-separated keys supported for rotation)
- `GROQ_API_KEY` — [Get a Groq API key](https://console.groq.com/keys) (comma-separated keys supported for rotation)
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` — [Create a GitHub OAuth App](https://github.com/settings/developers) (not needed if using Dev Login)

### Step 3: Start Infrastructure & Seed Data

```bash
# Option A: Start Redis + Qdrant in Docker (if using local MongoDB)
make dev

# Option B: Start MongoDB, Redis, and Qdrant all in Docker
make dev-full

# Seed a demo user and a pre-parsed test repository
cd backend && pnpm run seed
```

The seed script:
- Creates a **demo user** you can log in with (no GitHub OAuth needed)
- Runs the **real Mitorix parsing pipeline** on a sample project
- Populates MongoDB with file tree, code entities, and relationships
- Embeds code chunks into Qdrant using Cohere embeddings

### Step 4: Start Development Servers

```bash
# Terminal 1: Backend (auto-reloads on changes)
cd backend && pnpm run dev

# Terminal 2: Frontend (auto-reloads on changes)
cd frontend && pnpm run dev
```

### Step 5: Open & Login

Open **http://localhost:3000/login** and click the **"Dev Login (Seeded User)"** button.

You'll be redirected to the dashboard with the seeded repository — graph, editor, and file browser all work immediately. No GitHub OAuth or API keys required for basic UI development.

> **Note:** The "Dev Login" button only appears in development mode (`NODE_ENV=development`). It is completely absent in production builds.

### Quick Reference

| Command | Description |
|---|---|
| `./setup.sh` | Install workspace dependencies & boot infrastructure |
| `make dev` | Start Redis and Qdrant in Docker |
| `make dev-full` | Start MongoDB, Redis, and Qdrant in Docker |
| `make deploy-ec2` | Build and launch backend + redis for EC2 deployment |
| `cd backend && pnpm run seed` | Seed demo user + test repository |
| `cd backend && pnpm run unseed` | Remove all seeded data |
| `cd backend && pnpm run dev` | Start backend dev server (tsx watch, port 5000) |
| `cd frontend && pnpm run dev` | Start frontend dev server (port 3000) |

---

## Development Workflow

### Branch Strategy

```
main              ← production-ready code
  └── feature/your-feature   ← your work
  └── fix/your-bugfix        ← bug fixes
```

1. Create a branch off `main` for your feature or fix.
2. Push your branch and open a Pull Request (PR) against `main`.
3. GitHub Actions will run automated vitest tests (`.github/workflows/pr-check.yml`).
4. Once merged to `main`, GitHub Actions automatically deploys to EC2 (`.github/workflows/deploy-backend.yml`).

---

## Project Architecture

```
backend/src/
├── server.ts              # Entry point — starts Express + connects DB
├── app.ts                 # Express middleware stack
├── config/                # DB connection, Passport setup
├── routes/                # Route definitions
├── controllers/           # Request handlers
├── services/              # Business logic (LLM, RAG, Qdrant, embeddings)
├── models/                # Mongoose schemas
├── modules/
│   ├── parser/            # Tree-sitter AST parsing (11 languages)
│   └── indexer/           # Code entity extraction & indexing
├── queue/                 # BullMQ job queue definitions
├── workers/               # Async job processors (repo parsing, cleanup)
├── middlewares/           # Auth, rate limiting, error handling
├── utils/                 # Helper functions
└── __tests__/             # Unit tests & database scripts
```

---

## Coding Standards

### TypeScript

- **Strict mode** is enabled in both backend and frontend.
- Use explicit types — avoid `any` wherever possible.
- Use `type` imports for type-only imports:
  ```typescript
  import type { Request, Response } from 'express';
  ```
- Backend uses **ESM** (`"type": "module"`) — use `.js` extensions in imports when referencing internal files.

---

## Pull Request Process

### Before Opening a PR

- [ ] Your branch is up to date with `main`
- [ ] `./setup.sh` runs without errors
- [ ] Backend tests pass: `pnpm --filter backend test`
- [ ] Backend starts without errors: `cd backend && pnpm run dev`
- [ ] Frontend starts without errors: `cd frontend && pnpm run dev`

---

## 🙏 Thank You

Every contribution matters — whether it's fixing a typo, reporting a bug, or building a new parser. Thank you for helping make Mitorix better!
