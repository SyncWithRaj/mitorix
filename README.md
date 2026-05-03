# RepoLens — Architectural Copilot for Your Codebase

![RepoLens AI Engine](https://img.shields.io/badge/RepoLens-AI_Engine-58a6ff?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-22_LTS-339933?style=for-the-badge&logo=nodedotjs)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-7-4DB33D?style=for-the-badge&logo=mongodb)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google)
![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-FF5252?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)

**Understand your codebase. Faster than ever.**

RepoLens is an AI-powered architectural copilot that uses vector embeddings, multi-language AST parsing, and Retrieval-Augmented Generation (RAG) to let you visually map, explore, and interrogate any codebase through natural language. Stop reading thousands of lines of code — start asking questions and get exact, contextual explanations instantly.

> **Supported Languages:** JavaScript, TypeScript, Python, Go, Rust, Java, C, C++, C#, PHP, Ruby — powered by [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) for high-fidelity AST parsing.

---

## ✨ Features

### 🧠 Contextual AI Chat (RAG)
Ask natural language questions like *"Where is the authentication logic?"* or *"How does the payment flow work?"* and get exact code snippets, file references, and architectural explanations — powered by **Google Gemini** with semantic vector search over your indexed codebase.

### 🌐 Interactive Force-Graph Visualization
Visualize your repository as an interconnected **2D Force-Graph** that maps real relationships and dependencies between files, functions, and modules. Click any node to navigate, highlight blast-radius impacts, and understand the architecture at a glance.

### 💥 Blast Radius Analysis
Before making a change, ask: *"If I modify `authenticateUser`, what else breaks?"* — the AI identifies affected files and renders an interactive blast-radius view on the graph, highlighting all dependent components in red.

### 📊 Auto-Generated Architecture Diagrams
One-click generation of **Mermaid.js** architecture diagrams from your codebase structure. The AI analyzes your AST relationships and produces system design diagrams you can embed in documentation.

### 📖 Onboarding Guide Generation
New to a codebase? Click "Generate Onboarding Guide" and RepoLens identifies entry points, core schemas, and key components, then creates a step-by-step walkthrough tailored to the repository's language and structure.

### 🔍 Monaco Code Editor
Integrated web-based code editor with syntax highlighting, file tree navigation, and resizable panels — browse and read code without leaving the browser.

### 📞 Voice-Powered Code Exploration
Call the AI agent directly in your browser for hands-free architectural queries.
**Pipeline:** Speech-to-Text (AssemblyAI) → RAG/LLM Synthesis (Gemini) → Text-to-Speech (Murf AI)

### 🔒 Ephemeral & Secure
Repositories are cloned temporarily, parsed into ASTs, embedded into the vector database, and then deleted from disk. Zero persistent file storage on the server.

---

## 🏗 Architecture

```
User → GitHub OAuth → Paste Repo URL
                          ↓
               ┌─────────────────────┐
               │   BullMQ Job Queue  │ ← Redis
               └────────┬────────────┘
                         ↓
              ┌──────────────────────┐
              │  Worker: Clone Repo  │
              │  → AST Parse (Tree-  │
              │    sitter, 11 langs) │
              │  → Extract Entities  │
              │    & Relationships   │
              │  → Vector Embed      │
              │  → Delete Clone      │
              └──────────┬───────────┘
                         ↓
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
    ┌─────────┐    ┌──────────┐    ┌──────────┐
    │ MongoDB │    │  Qdrant  │    │  Redis   │
    │ metadata│    │ vectors  │    │ sessions │
    │ files   │    │ search   │    │ queues   │
    └─────────┘    └──────────┘    └──────────┘
         ↑               ↑
         └───────┬───────┘
                 ↓
         ┌──────────────┐
         │  RAG Engine  │ → Gemini LLM → Chat / Voice / Diagrams
         └──────────────┘
```

**Key Design Decisions:**
- **Ephemeral Cloning** — Repos are cloned to `/tmp`, parsed, then wiped. No persistent file storage.
- **Event-Driven Processing** — BullMQ + Redis workers handle repo parsing asynchronously. The API returns `202 Accepted` immediately.
- **Multi-Language AST** — Tree-sitter replaces ts-morph for universal language support across 11 languages.
- **MongoDB for Metadata** — File trees, code entities, relationships, and chat history are persisted in structured documents.
- **Qdrant for Semantics** — Code chunks are embedded as vectors for semantic similarity search during RAG queries.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4 |
| **UI Components** | Monaco Editor, react-force-graph-2d, Mermaid.js, lucide-react, react-resizable-panels |
| **Backend** | Node.js 22, Express 5, TypeScript 5 |
| **AST Parsing** | Tree-sitter (JS, TS, Python, Go, Rust, Java, C, C++, C#, PHP, Ruby) |
| **AI / LLM** | Google Gemini (`@google/generative-ai`, LangChain) |
| **Vector DB** | Qdrant (semantic code search) |
| **Database** | MongoDB 7 + Mongoose 9 |
| **Queue** | BullMQ + Redis (async job processing) |
| **Auth** | Passport.js (GitHub OAuth2), JWT |
| **Voice Pipeline** | AssemblyAI (STT) → Gemini → Murf AI (TTS) |
| **Infrastructure** | Docker Compose, Nginx reverse proxy |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 22** (LTS) — [install via nvm](https://github.com/nvm-sh/nvm)
- **Docker & Docker Compose** — for infrastructure services
- **Git** — for repo cloning

### Quick Setup (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/repolens.git
cd repolens

# 2. Run the setup script (installs everything)
chmod +x setup.sh
./setup.sh

# 3. Configure your secrets
nano backend/.env    # At minimum, set JWT_SECRET

# 4. Start infrastructure services
docker compose up -d mongodb redis qdrant

# 5. Seed demo data (creates a test user + parses a sample project)
cd backend && npm run seed

# 6. Start backend (terminal 1)
cd backend && npm run dev

# 7. Start frontend (terminal 2)
cd frontend && npm run dev
```

Open **http://localhost:3000/login** → click **"Dev Login"** → you're in! 🎉

> **What does `setup.sh` do?**
> Validates Node 22, installs OS build tools for native addons (tree-sitter/node-gyp), runs `npm ci` in both backend and frontend, and scaffolds `backend/.env` from the example template. Smart caching skips reinstall if dependencies haven't changed.

> **What does `npm run seed` do?**
> Creates a demo user (bypasses GitHub OAuth) and runs the real parsing pipeline on a bundled Express todo app. The dashboard, graph, editor, and file browser work immediately — no API keys needed for basic testing.

### Docker Production Deployment

```bash
# Build and start everything (backend, frontend, MongoDB, Redis, Qdrant, Nginx)
make build

# Other commands
make start     # Start without rebuilding
make stop      # Stop all services
make restart   # Stop + start
make logs      # Tail live logs
make clean     # Stop + delete database volumes
make wipe      # Nuclear: stop + delete volumes + Qdrant storage
```

Once running, open **http://localhost** (port 80) — Nginx serves the frontend and proxies API requests to the backend.

### Environment Variables

Copy the example and fill in your secrets:

```bash
cp backend/.env.production.example backend/.env
```

| Variable | Required | Description |
|---|---|---|
| `GITHUB_CLIENT_ID` | ✅ | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | ✅ | GitHub OAuth App client secret |
| `JWT_SECRET` | ✅ | Random string for JWT signing (`openssl rand -hex 32`) |
| `GOOGLE_API_KEY` | ✅ | Google Gemini API key |
| `MONGO_URI` | ✅ | MongoDB connection string |
| `QDRANT_URL` | ✅ | Qdrant vector DB URL |
| `REDIS_HOST` / `REDIS_PORT` | ✅ | Redis connection for BullMQ |
| `GITHUB_APP_ID` | Optional | GitHub App ID (private repo access) |
| `GITHUB_APP_PRIVATE_KEY` | Optional | GitHub App private key |
| `MURF_API_KEY` | Optional | Murf AI key (voice TTS) |
| `ASSEMBLYAI_API_KEY` | Optional | AssemblyAI key (voice STT) |

---

## 📂 Project Structure

```
repolens/
├── setup.sh                     # One-command project setup
├── docker-compose.yml           # Full-stack orchestration
├── Makefile                     # Dev workflow shortcuts
├── .nvmrc                       # Node 22 version pin
│
├── backend/
│   ├── src/
│   │   ├── server.ts            # Entry point
│   │   ├── app.ts               # Express app configuration
│   │   ├── config/              # Database & Passport config
│   │   ├── controllers/         # Route handlers
│   │   │   ├── repo.controller.ts         # Repository onboarding
│   │   │   ├── parser.controller.ts       # AST parsing orchestration
│   │   │   ├── query.controller.ts        # RAG chat queries
│   │   │   ├── graph.controller.ts        # Force-graph data
│   │   │   ├── call.controller.ts         # Voice call pipeline
│   │   │   ├── designDoc.controller.ts    # Mermaid diagram generation
│   │   │   └── onboarding.controller.ts   # Onboarding guide generation
│   │   ├── models/              # MongoDB schemas
│   │   │   ├── repo.model.ts              # Repository metadata
│   │   │   ├── codeEntity.model.ts        # Functions, classes, exports
│   │   │   ├── relationship.model.ts      # File/entity dependencies
│   │   │   ├── fileContent.model.ts       # File tree & source code
│   │   │   └── chatHistory.model.ts       # Conversation persistence
│   │   ├── modules/
│   │   │   ├── parser/          # Multi-language AST parsing
│   │   │   │   ├── astParser.ts           # Tree-sitter orchestrator
│   │   │   │   └── parsers/               # Per-language parsers (11 langs)
│   │   │   ├── indexer/         # Code entity indexing
│   │   │   └── repo/            # Repository management
│   │   ├── services/            # Business logic
│   │   │   ├── rag.service.ts             # RAG pipeline
│   │   │   ├── llm.service.ts             # Gemini LLM integration
│   │   │   ├── qdrant.service.ts          # Vector DB operations
│   │   │   └── embedding.service.ts       # Vector embedding
│   │   ├── queue/               # BullMQ job definitions
│   │   ├── workers/             # Async job processors
│   │   ├── middlewares/         # Auth, rate limiting, error handling
│   │   ├── routes/              # Express route definitions
│   │   └── utils/               # Helpers & formatters
│   ├── Dockerfile               # Production multi-stage build
│   └── package.json
│
├── frontend/
│   ├── app/                     # Next.js 16 App Router
│   │   ├── page.tsx             # Landing page
│   │   ├── dashboard/           # Repository dashboard
│   │   ├── chat/                # AI chat interface
│   │   ├── graph/               # Force-graph visualization
│   │   ├── auth/                # GitHub OAuth flow
│   │   └── login/               # Login page
│   ├── components/
│   │   ├── chat/                # ChatPanel, message rendering
│   │   ├── editor/              # Monaco editor integration
│   │   ├── files/               # File tree browser
│   │   ├── graph/               # Force-graph component
│   │   └── layout/              # Navigation, sidebar
│   ├── context/                 # React context (EditorContext)
│   ├── lib/                     # Axios instance
│   ├── Dockerfile               # Production multi-stage build
│   └── package.json
│
└── nginx/
    └── nginx.conf               # Reverse proxy config
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on getting started, coding standards, and the pull request process.

---

## 📄 License

This project is licensed under the ISC License.

---

*Built for developers who want to understand code, not just read it.*