#!/usr/bin/env bash
# ==============================================
# RepoLens — One-Command Project Setup
# ==============================================
# Usage:  chmod +x setup.sh && ./setup.sh
#
# This script will:
#   1. Verify Node.js v22 (LTS) and npm are installed
#   2. Install OS-level build tools needed by native addons (tree-sitter / node-gyp)
#   3. Install backend npm dependencies
#   4. Install frontend npm dependencies
#   5. Install Ollama and pull the nomic-embed-text model (local embeddings)
#   6. Scaffold a starter .env for the project root (if missing)
#
# Tested on: Ubuntu/Debian, Fedora/RHEL, Arch, macOS, Alpine
# ==============================================

set -euo pipefail

# ─── Colors & Helpers ──────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

info()    { printf "${BLUE}ℹ ${NC}%s\n" "$*"; }
success() { printf "${GREEN}✔ ${NC}%s\n" "$*"; }
warn()    { printf "${YELLOW}⚠ ${NC}%s\n" "$*"; }
error()   { printf "${RED}✖ ${NC}%s\n" "$*"; }
header()  { printf "\n${BOLD}${CYAN}━━━ %s ━━━${NC}\n" "$*"; }

# Resolve the directory where this script lives (project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

REQUIRED_NODE_MAJOR=22

# ─── Step 1: Verify Node.js ───────────────────────────────────

header "Step 1/6 — Checking Node.js"

if ! command -v node &>/dev/null; then
  error "Node.js is not installed."
  echo ""
  echo "  RepoLens requires Node.js v${REQUIRED_NODE_MAJOR}.x (LTS)."
  echo ""
  echo "  Install via nvm (recommended):"
  echo "    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash"
  echo "    nvm install ${REQUIRED_NODE_MAJOR}"
  echo "    nvm use ${REQUIRED_NODE_MAJOR}"
  echo ""
  echo "  Or download directly from: https://nodejs.org/"
  exit 1
fi

NODE_VERSION="$(node -v)"                       # e.g. v22.14.0
NODE_MAJOR="${NODE_VERSION%%.*}"                 # e.g. v22
NODE_MAJOR="${NODE_MAJOR#v}"                     # e.g. 22

if [[ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]]; then
  error "Node.js ${NODE_VERSION} detected — v${REQUIRED_NODE_MAJOR}.x or later is required."
  echo ""
  echo "  Upgrade with nvm:"
  echo "    nvm install ${REQUIRED_NODE_MAJOR} && nvm use ${REQUIRED_NODE_MAJOR}"
  exit 1
fi

success "Node.js ${NODE_VERSION} ✓"

# ─── Step 2: Verify npm ───────────────────────────────────────

if ! command -v npm &>/dev/null; then
  error "npm is not installed (should ship with Node.js)."
  exit 1
fi

NPM_VERSION="$(npm -v)"
success "npm v${NPM_VERSION} ✓"

# ─── Step 3: Install OS-level build tools ─────────────────────

header "Step 2/6 — Checking native build tools"

# tree-sitter (backend dep) compiles C/C++ via node-gyp, which needs:
#   - python3, make, g++/gcc, git
# We detect the OS and install if missing.

install_build_deps() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS — Xcode CLI tools provide make, g++, git
    if ! xcode-select -p &>/dev/null; then
      info "Installing Xcode Command Line Tools (provides make, g++, git)…"
      xcode-select --install 2>/dev/null || true
      warn "A system dialog may have appeared. Please complete the install and re-run this script."
      exit 1
    fi
    # Ensure python3 is present (macOS 12.3+ removed built-in python)
    if ! command -v python3 &>/dev/null; then
      if command -v brew &>/dev/null; then
        info "Installing python3 via Homebrew…"
        brew install python3
      else
        warn "python3 not found. Install it via https://www.python.org/downloads/ or Homebrew."
      fi
    fi
    success "macOS build tools ready ✓"
    return
  fi

  # Linux — detect package manager
  local missing=()
  command -v python3 &>/dev/null || missing+=(python3)
  command -v make    &>/dev/null || missing+=(make)
  command -v g++     &>/dev/null || missing+=(g++)
  command -v git     &>/dev/null || missing+=(git)

  if [[ ${#missing[@]} -eq 0 ]]; then
    success "All native build tools already installed (python3, make, g++, git) ✓"
    return
  fi

  warn "Missing build tools: ${missing[*]}"
  info "Attempting to install them…"

  if command -v apt-get &>/dev/null; then
    # Debian / Ubuntu
    sudo apt-get update -qq
    sudo apt-get install -y -qq python3 build-essential git
  elif command -v dnf &>/dev/null; then
    # Fedora / RHEL 8+
    sudo dnf install -y python3 make gcc-c++ git
  elif command -v yum &>/dev/null; then
    # RHEL 7 / CentOS
    sudo yum install -y python3 make gcc-c++ git
  elif command -v pacman &>/dev/null; then
    # Arch Linux
    sudo pacman -Sy --noconfirm python make gcc git
  elif command -v apk &>/dev/null; then
    # Alpine
    sudo apk add --no-cache python3 make g++ git
  elif command -v zypper &>/dev/null; then
    # openSUSE
    sudo zypper install -y python3 make gcc-c++ git
  else
    error "Could not detect your package manager."
    echo "  Please install manually: python3, make, g++ (or gcc), git"
    exit 1
  fi

  success "Build tools installed ✓"
}

install_build_deps

# ─── Helper: Smart npm install (skip if lockfile unchanged) ───

# Computes an md5 hash of package-lock.json and stores it inside
# node_modules/.lockfile-hash. On re-runs, if the hash matches,
# we skip the install entirely.
smart_npm_ci() {
  local dir="$1"
  local label="$2"
  local lockfile="${dir}/package-lock.json"
  local hashfile="${dir}/node_modules/.lockfile-hash"

  if [[ ! -f "$lockfile" ]]; then
    error "${label}/package-lock.json not found. Are you in the project root?"
    exit 1
  fi

  local current_hash
  current_hash="$(md5sum "$lockfile" | cut -d ' ' -f1)"

  if [[ -d "${dir}/node_modules" && -f "$hashfile" ]]; then
    local cached_hash
    cached_hash="$(cat "$hashfile" 2>/dev/null || echo "")"
    if [[ "$current_hash" == "$cached_hash" ]]; then
      success "${label} dependencies are up to date — skipping ✓"
      return
    fi
    info "Lockfile changed since last install — reinstalling…"
  fi

  info "Running npm ci in ${label}/ (this may take a minute)…"
  (cd "$dir" && npm ci --legacy-peer-deps)

  # Cache the hash so next run can skip
  printf '%s' "$current_hash" > "$hashfile"
  success "${label} dependencies installed ✓"
}

# ─── Step 4: Install backend dependencies ─────────────────────

header "Step 3/6 — Installing backend dependencies"

if [[ ! -f "${SCRIPT_DIR}/backend/package.json" ]]; then
  error "backend/package.json not found. Are you in the project root?"
  exit 1
fi

smart_npm_ci "${SCRIPT_DIR}/backend" "backend"

# ─── Step 5: Install frontend dependencies ────────────────────

header "Step 4/6 — Installing frontend dependencies"

if [[ ! -f "${SCRIPT_DIR}/frontend/package.json" ]]; then
  error "frontend/package.json not found. Are you in the project root?"
  exit 1
fi

smart_npm_ci "${SCRIPT_DIR}/frontend" "frontend"

# ─── Step 5: Install Ollama & pull nomic-embed-text ──────────

header "Step 5/6 — Setting up Ollama (local embedding model)"

install_ollama() {
  if command -v ollama &>/dev/null; then
    OLLAMA_VERSION="$(ollama --version 2>/dev/null || echo 'installed')"
    success "Ollama already installed (${OLLAMA_VERSION}) ✓"
  else
    info "Ollama is not installed. Installing…"

    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      if command -v brew &>/dev/null; then
        brew install ollama
      else
        warn "Install Ollama manually from: https://ollama.com/download"
        warn "Then re-run this script or run: ollama pull nomic-embed-text"
        return
      fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      # Linux — official install script
      curl -fsSL https://ollama.com/install.sh | sh
    else
      warn "Unsupported OS for automatic Ollama install."
      warn "Install from: https://ollama.com/download"
      warn "Then run: ollama pull nomic-embed-text"
      return
    fi

    if command -v ollama &>/dev/null; then
      success "Ollama installed ✓"
    else
      warn "Ollama installation may have failed. Install manually from https://ollama.com"
      return
    fi
  fi

  # Pull the embedding model
  info "Pulling nomic-embed-text model (137M parameters, ~270MB download)…"
  info "This is the local embedding model used for vector search — no API key needed."

  if ollama list 2>/dev/null | grep -q "nomic-embed-text"; then
    success "nomic-embed-text model already available ✓"
  else
    ollama pull nomic-embed-text
    success "nomic-embed-text model pulled ✓"
  fi
}

install_ollama

# ─── Step 6: Scaffold .env if missing ─────────────────────────

header "Step 6/6 — Environment setup"

ROOT_ENV="${SCRIPT_DIR}/.env"
ROOT_ENV_EXAMPLE="${SCRIPT_DIR}/.env.development.example"

if [[ -f "$ROOT_ENV" ]]; then
  success ".env already exists — skipping ✓"
else
  if [[ -f "$ROOT_ENV_EXAMPLE" ]]; then
    cp "$ROOT_ENV_EXAMPLE" "$ROOT_ENV"
    warn "Created .env from .env.development.example"
    warn "→ Please edit .env and fill in your JWT_SECRET"
  else
    warn "No .env.development.example found in root."
    warn "→ You will need to create .env manually before starting the server."
  fi
fi

# ─── Done ──────────────────────────────────────────────────────

printf "\n"
printf "${BOLD}${GREEN}╔══════════════════════════════════════════════════╗${NC}\n"
printf "${BOLD}${GREEN}║             RepoLens setup complete!             ║${NC}\n"
printf "${BOLD}${GREEN}╚══════════════════════════════════════════════════╝${NC}\n"
printf "\n"
printf "  Next steps:\n"
printf "\n"
printf "  1. Configure your secrets:\n"
printf "     ${CYAN}nano .env${NC}\n"
printf "\n"
printf "  2. Start infrastructure (MongoDB, Redis, Qdrant):\n"
printf "     ${CYAN}docker compose up -d mongodb redis qdrant${NC}\n"
printf "\n"
printf "  3. Start Ollama (if not already running):\n"
printf "     ${CYAN}ollama serve${NC}\n"
printf "\n"
printf "  4. Seed demo data (creates a test user + parses a sample project):\n"
printf "     ${CYAN}cd backend && npm run seed${NC}\n"
printf "\n"
printf "  5. Run the backend:\n"
printf "     ${CYAN}cd backend && npm run dev${NC}\n"
printf "\n"
printf "  6. Run the frontend (in a new terminal):\n"
printf "     ${CYAN}cd frontend && npm run dev${NC}\n"
printf "\n"
printf "  Once running, open http://localhost:3000/login and click \"Dev Login\"!\n"
printf "\n"

