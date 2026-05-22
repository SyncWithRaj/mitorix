# RepoLens — AI Architectural Copilot & Vector Intelligence Platform

![RepoLens AI Engine](https://img.shields.io/badge/RepoLens-AI_Engine-58a6ff?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-22_LTS-339933?style=for-the-badge&logo=nodedotjs)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-7-4DB33D?style=for-the-badge&logo=mongodb)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google)
![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-FF5252?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)

**Understand your codebase. Faster than ever.**

RepoLens is an AI-powered architectural copilot that leverages **high-dimensional vector embeddings**, **multi-language AST parsing**, and **Retrieval-Augmented Generation (RAG)** to let you visually map, explore, and interrogate any codebase through natural language. Stop reading thousands of lines of code — start asking questions, detecting semantic drift, and visualizing structural dependencies instantly.

> **Supported Languages:** JavaScript, TypeScript, Python, Go, Rust, Java, C, C++, C#, PHP, Ruby — powered by native [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) compilers for high-fidelity AST parsing.

---

## 🚀 Core Features

### 🔬 Vector RepoLabs Intelligence
We repurpose Qdrant vector embeddings to unlock deep semantic codebase analytics that transcend traditional text-matching engines:
- **Natural Language Search:** Find code by describing its logic. Qdrant’s Cosine similarity matching retrieves semantically relevant AST blocks even if exact keywords are absent.
- **Semantic Clone Detection:** A high-performance clustering algorithm scans the vector space to identify hidden duplication where code logic is semantically identical (≥95% Near Identical, ≥85% Semantic boundary), regardless of variable renaming or syntax formatting.
- **Version Drift Tracking:** Compute vector distances between indexed version fingerprints to trace actual code behavior deviation and semantic drift over time.

### 🌐 7 Interactive D3.js Visual Layouts
Visualize your repository as an interconnected dependency map. 
1. **Force-Directed Graph** (Files and caller-callee bindings)
2. **Treemap View** (Mosaic directory sizing based on Lines of Code)
3. **Adjacency Matrix** (Import/function density grids)
4. **Hierarchical Dendrogram** (Nested namespace mapping)
5. **Sankey Flow Diagrams** (Function call volume paths)
6. **Disjoint Clusters** (Bounded hulls revealing isolated modules)
7. **Circular Edge Bundles** (Radial cyclic trace binding)

### 💥 Blast Radius & Telemetry Simulation
Before making a change, RepoLens simulates structural risk. Triggering a **Breadth-First Search (BFS) to Depth 3**, the engine flags transitive downstream impacts across the dependency graph. Includes automated **Cyclomatic Complexity**, **Security Vulnerability Regex Scans** (SQLi, XSS, Weak Crypto), and strict **Architectural Layer** validation (Controller, Service, Model boundaries).

### 🧠 Contextual AI Chat (RAG) & Voice Calls
Ask questions like *"Where is the authentication logic?"* and get exact code snippets via Google Gemini. Connect via the **Hands-Free Speech Pipeline** utilizing AssemblyAI (Speech-to-Text) -> Gemini -> Murf AI (Text-to-Speech) for complete hands-free exploration.

### 🔒 Ephemeral & Secure Ingestion Pipeline
Repositories are cloned asynchronously via a **BullMQ + Redis** job queue to a `/tmp` sandbox. The codebase is parsed into ASTs, embedded into the Qdrant vector database, and the physical disk directory is instantly wiped. **Zero persistent file storage on the server.**

---

## 🏗 Architecture & Engineering Pipeline

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
         │  RAG Engine  │ → Gemini LLM → Chat / RepoLabs / Voice
         └──────────────┘
```

**Key Design Decisions:**
- **Ephemeral Sandbox Clones** — Host file integrity is protected by immediate cleanup routines.
- **Asynchronous Execution** — Parsing heavy repositories runs on isolated background workers, ensuring immediate `202 Accepted` API responses.
- **MongoDB for Schema Metadata** — File trees, code entities, relationship edges, and chat history are persisted in structured BSON documents.
- **Qdrant for Semantics** — 1536/768-dimensional coordinates representing semantic fragments are indexed using HNSW graphs for rapid retrieval.

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend UI** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React |
| **Data Visualizations** | D3.js, react-force-graph-2d, Mermaid.js |
| **Backend API** | Node.js 22 LTS, Express 5, TypeScript 5 |
| **AST Parsers** | Tree-sitter (WASM/Native extensions for 11 architectures) |
| **AI / LLM** | Google Gemini (`@google/generative-ai`) |
| **Vector Database** | Qdrant (Semantic similarity search) |
| **Document Store** | MongoDB 7 + Mongoose 9 |
| **Job Queueing** | BullMQ + Redis |
| **Voice Streaming** | AssemblyAI (STT) → Gemini → Murf AI (TTS) |
| **Infrastructure** | Docker Compose, Nginx Reverse Proxy |

---

## ⚡ Getting Started

### Prerequisites
- **Node.js 22** (LTS)
- **Docker & Docker Compose**
- **Git**

### Quick Setup (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/repolens.git
cd repolens

# 2. Run the automated setup script
chmod +x setup.sh
./setup.sh

# 3. Configure your API secrets
nano backend/.env    # Set JWT_SECRET, GOOGLE_API_KEY, etc.

# 4. Spin up the infrastructure components
docker compose up -d mongodb redis qdrant

# 5. Start the backend server (terminal 1)
cd backend && npm run dev

# 6. Start the frontend application (terminal 2)
cd frontend && npm run dev
```

Open **http://localhost:3000/login** and utilize the **"Dev Login"** portal to bypass OAuth.

### Docker Production Deployment

```bash
# Build and orchestrate the full stack (Nginx, Express, Next.js, Mongo, Redis, Qdrant)
make build

# Production Lifecycle Commands
make start     # Spin up containers
make stop      # Halt containers gracefully
make logs      # Tail live unified logs
make clean     # Halt and strip standard database volumes
make wipe      # Nuclear: Strips volumes and Qdrant storage arrays
```

### Required Environment Variables
A `.env.production.example` template is provided in the `backend/` directory.

| Variable | Required | Description |
|---|---|---|
| `GITHUB_CLIENT_ID` | Required | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | Required | GitHub OAuth App client secret |
| `JWT_SECRET` | Required | Random string for JWT signing (`openssl rand -hex 32`) |
| `GOOGLE_API_KEY` | Required | Google Gemini API Key |
| `MONGO_URI` | Required | MongoDB instance URI string |
| `QDRANT_URL` | Required | Qdrant vector DB host |
| `REDIS_HOST` / `REDIS_PORT` | Required | Redis connection strings |

---

## 🤝 Contributing
Please see `CONTRIBUTING.md` for our strict styling guidelines, component architecture logic, and PR review workflow. We welcome additions to the Tree-sitter parsers and D3 visualization layouts.

## 📄 License
This codebase is released under the **ISC License**.

---
*Built for engineers who want to understand architecture, not just read text files.*