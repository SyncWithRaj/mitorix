w# Contributing to Mitorix

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
| **Docker & Docker Compose** | Latest | For MongoDB, Redis, Qdrant |
| **Git** | Latest | Required by backend at runtime too |
| **OS build tools** | — | `python3`, `make`, `g++` (setup.sh handles this) |

### Step 1: Clone & Install

```bash
git clone https://github.com/your-org/mitorix.git
cd mitorix

# Switch to Node 22 (if using nvm)
nvm use

# Install all dependencies (backend + frontend)
chmod +x setup.sh
./setup.sh
```

The setup script will:
1. Validate Node.js v22+
2. Install OS-level build tools (for tree-sitter native compilation)
3. Run `npm ci` in `backend/` and `frontend/`
4. Scaffold `.env` from the example template
5. Skip reinstall on re-runs if dependencies haven't changed

### Step 2: Configure Environment

Edit `.env` and fill in your secrets:

```bash
nano .env
```

At minimum, you need:
- `JWT_SECRET` — Generate with `openssl rand -hex 32`

Optional (for full functionality):
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` — [Create a GitHub OAuth App](https://github.com/settings/developers) (not needed if using Dev Login)
- `GOOGLE_API_KEY` — [Get a Gemini API key](https://aistudio.google.com/apikey) (needed for LLM chat responses, not for embeddings or graph/editor)
- **Ollama** — [Install Ollama](https://ollama.com) and run `ollama pull nomic-embed-text` (needed for vector embeddings — runs locally, no API key required)

### Step 3: Start Infrastructure & Seed Data

```bash
# Start MongoDB, Redis, and Qdrant in Docker
docker compose up -d mongodb redis qdrant

# Seed a demo user and a pre-parsed test repository
cd backend && npm run seed
```

The seed script:
- Creates a **demo user** you can log in with (no GitHub OAuth needed)
- Runs the **real Mitorix parsing pipeline** on a bundled Express todo app
- Populates MongoDB with file tree, code entities, and relationships
- If Ollama is running with `nomic-embed-text`, also embeds into Qdrant (enables chat and semantic search)

### Step 4: Start Development Servers

```bash
# Terminal 1: Backend (auto-reloads on changes)
cd backend && npm run dev

# Terminal 2: Frontend (auto-reloads on changes)
cd frontend && npm run dev
```

### Step 5: Open & Login

Open **http://localhost:3000/login** and click the **"Dev Login (Seeded User)"** button.

You'll be redirected to the dashboard with the seeded repository — graph, editor, and file browser all work immediately. No GitHub OAuth or API keys required for basic UI development.

> **Note:** The "Dev Login" button only appears in development mode (`NODE_ENV=development`). It is completely absent in production builds.

### Quick Reference

| Command | Description |
|---|---|
| `./setup.sh` | Install all dependencies (smart — skips if up to date) |
| `docker compose up -d mongodb redis qdrant` | Start infrastructure services |
| `cd backend && npm run seed` | Seed demo user + test repository |
| `cd backend && npm run unseed` | Remove all seeded data |
| `cd backend && npm run dev` | Start backend dev server (tsx watch, port 5000) |
| `cd frontend && npm run dev` | Start frontend dev server (Turbopack, port 3000) |

---

## Development Workflow

### Branch Strategy

```
main              ← production-ready code
  └── dev         ← integration branch
       └── feature/your-feature   ← your work
       └── fix/your-bugfix        ← bug fixes
```

1. Always branch off `dev` (or `main` if `dev` doesn't exist).
2. Keep branches focused — one feature or fix per branch.
3. Rebase on the base branch before opening a PR.

### Backend

- Written in **TypeScript** (strict mode), runs via `tsx` (no compile step needed in dev).
- Express 5 with `type: "module"` (ESM).
- API routes are under `/api/v1/`.
- Hot reloads automatically via `tsx watch`.

### Frontend

- **Next.js 16** with the App Router and **React 19**.
- Styled with **Tailwind CSS v4**.
- Runs with **Turbopack** in development.
- API calls go through the axios instance in `lib/axios.ts`.

---

## Project Architecture

```
backend/src/
├── server.ts              # Entry point — starts Express + connects DB
├── app.ts                 # Express middleware stack
├── config/                # DB connection, Passport setup
├── routes/                # Route definitions (thin layer)
├── controllers/           # Request handlers (orchestration)
├── services/              # Business logic (LLM, RAG, Qdrant, embeddings)
├── models/                # Mongoose schemas
├── modules/
│   ├── parser/            # Tree-sitter AST parsing (11 languages)
│   │   ├── astParser.ts   # Dispatcher — routes files to the right parser
│   │   └── parsers/       # Language-specific parsers (BaseParser → subclasses)
│   ├── indexer/           # Code entity extraction & indexing
│   └── repo/              # Repository lifecycle management
├── queue/                 # BullMQ job queue definitions
├── workers/               # Async job processors (repo parsing, cleanup)
├── middlewares/           # Auth, rate limiting, error handling
└── utils/                 # Helper functions
```

### Key Patterns

- **Controllers** call **Services**. Controllers handle HTTP; services handle logic.
- **Workers** process BullMQ jobs asynchronously (repo cloning, parsing, embedding).
- **Parsers** extend `BaseParser` with a consistent interface per language.
- **RAG pipeline:** User query → embed query (Nomic via Ollama, local) → Qdrant similarity search → build context → Gemini LLM → stream response.

---

## Coding Standards

### TypeScript

- **Strict mode** is enabled in both backend and frontend.
- Use explicit types — avoid `any` wherever possible.
- Use `type` imports for type-only imports:
  ```typescript
  import type { Request, Response } from 'express';
  ```
- Backend uses **ESM** (`"type": "module"`) — use `.js` extensions in imports when referencing compiled output.

### File Naming

| Type | Convention | Example |
|---|---|---|
| Controllers | `kebab-case.controller.ts` | `repo.controller.ts` |
| Services | `kebab-case.service.ts` | `llm.service.ts` |
| Models | `camelCase.model.ts` | `codeEntity.model.ts` |
| Routes | `kebab-case.route.ts` | `auth.route.ts` |
| React Components | `PascalCase.tsx` | `ChatPanel.tsx` |
| Utilities | `camelCase.ts` | `tokenizer.ts` |

### Frontend

- Use **functional components** with hooks.
- Keep components focused — one component per file.
- Use the `@/*` path alias for imports.
- Use `lucide-react` for icons (don't add new icon libraries).

### General

- Don't remove existing comments or docstrings unless directly related to your change.
- Keep functions small and focused.
- Add comments for non-obvious logic, especially in parsers and services.

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code change that neither fixes nor adds |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build, CI, tooling changes |

### Examples

```
feat(parser): add Ruby language support via Tree-sitter
fix(chat): resolve scroll-to-bottom lag on new messages
docs: update README with Docker deployment instructions
chore: add setup.sh for one-command contributor onboarding
```

---

## Pull Request Process

### Before Opening a PR

- [ ] Your branch is up to date with the base branch
- [ ] `./setup.sh` runs without errors
- [ ] Backend starts without errors: `cd backend && npm run dev`
- [ ] Frontend starts without errors: `cd frontend && npm run dev`
- [ ] You've tested your changes manually
- [ ] No unrelated changes are included

### PR Template

When opening a PR, include:

```markdown
## What does this PR do?
Brief description of the change.

## Why?
Context and motivation.

## How to test
Step-by-step instructions for reviewers.

## Screenshots (if UI change)
Before / after screenshots or recordings.
```

### Review Process

1. Open a PR against `dev` (or `main`).
2. At least one maintainer must approve.
3. All CI checks must pass.
4. Squash-merge is preferred for a clean history.

---

## Reporting Issues

### Bug Reports

Please include:
- **Steps to reproduce** — what you did
- **Expected behavior** — what should happen
- **Actual behavior** — what happened instead
- **Environment** — OS, Node version (`node -v`), browser
- **Logs** — relevant terminal output or browser console errors

### Feature Requests

Open an issue with the `enhancement` label. Include:
- **Problem** — what pain point does this solve?
- **Proposed solution** — your idea for how it should work
- **Alternatives considered** — other approaches you thought of

---

## 🙏 Thank You

Every contribution matters — whether it's fixing a typo, reporting a bug, or building a new parser. Thank you for helping make Mitorix better!
