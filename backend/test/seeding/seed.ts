/**
 * RepoLens — Seed Script
 *
 * Seeds a demo user and runs the real parsing pipeline on the test project.
 * This allows contributors to test the UI without GitHub OAuth or API keys.
 *
 * Usage:  npm run seed
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

// Load env from backend/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(backendRoot, ".env") });

import { User } from "../../src/models/auth.model.js";
import { Repository } from "../../src/models/repo.model.js";
import { CodeEntity } from "../../src/models/codeEntity.model.js";
import { CodeRelationship } from "../../src/models/relationship.model.js";
import { FileMetadata } from "../../src/models/fileMetadata.model.js";
import { FileContent } from "../../src/models/fileContent.model.js";
import { scanCodeFiles } from "../../src/modules/indexer/fileScanner.js";
import { processRepositoryParsing, saveRepoFilesToDB } from "../../src/services/parser.service.js";

// ─── Demo User Credentials ──────────────────────────────────

const DEMO_USER = {
  githubId: "demo-dev-00000",
  username: "repolens-dev",
  email: "dev@repolens.local",
  avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=repolens",
};

const DEMO_REPO = {
  name: "todo-express-app",
  githubUrl: "https://github.com/repolens/todo-express-app",
  defaultBranch: "main",
  localPath: "/tmp/seed-test-project",
};

// ─── Colors ──────────────────────────────────────────────────

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";
const NC = "\x1b[0m";

const info = (msg: string) => console.log(`${CYAN}ℹ${NC} ${msg}`);
const success = (msg: string) => console.log(`${GREEN}✔${NC} ${msg}`);
const warn = (msg: string) => console.log(`${YELLOW}⚠${NC} ${msg}`);
const error = (msg: string) => console.log(`${RED}✖${NC} ${msg}`);

// ─── Main ────────────────────────────────────────────────────

async function seed() {
  console.log(`\n${BOLD}${CYAN}━━━ RepoLens Seed Script ━━━${NC}\n`);

  // 1. Connect to MongoDB
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    error("MONGO_URI not set in backend/.env");
    process.exit(1);
  }

  info("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  success("Connected to MongoDB");

  // 2. Create or find demo user
  info("Creating demo user...");
  let user = await User.findOne({ githubId: DEMO_USER.githubId });

  if (user) {
    warn("Demo user already exists — reusing");
  } else {
    user = await User.create(DEMO_USER);
    success("Demo user created");
  }

  // 3. Check if seed repo already exists
  let repo = await Repository.findOne({
    user: user._id,
    name: DEMO_REPO.name,
  });

  if (repo) {
    warn("Seed repository already exists — cleaning old data before re-seeding...");
    const repoId = repo._id.toString();
    await CodeEntity.deleteMany({ repoId: repo._id });
    await CodeRelationship.deleteMany({ repoId: repo._id });
    await FileMetadata.deleteMany({ repoId: repo._id });
    await FileContent.deleteMany({ repoId: repo._id });
    await Repository.findByIdAndDelete(repo._id);
    success("Old seed data cleaned");
  }

  // 4. Create the repo record
  info("Creating repository record...");
  repo = await Repository.create({
    user: user._id,
    name: DEMO_REPO.name,
    githubUrl: DEMO_REPO.githubUrl,
    defaultBranch: DEMO_REPO.defaultBranch,
    localPath: DEMO_REPO.localPath,
    status: "indexing",
    commitHash: "seed-local",
    fingerprint: `${DEMO_REPO.githubUrl}_seed-local`,
  });
  success(`Repository record created: ${repo._id}`);

  // 5. Run the real parsing pipeline on test_project/
  const testProjectPath = path.resolve(__dirname, "test_project");
  const repoId = repo._id.toString();

  info("Scanning test project files...");
  const scannedFiles = scanCodeFiles(testProjectPath);
  success(`Found ${scannedFiles.length} files to parse`);

  info("Running AST parsing pipeline (Tree-sitter)...");
  const filePaths = scannedFiles.map((f) => f.absolutePath);
  const parseResult = await processRepositoryParsing(repoId, filePaths);
  success(
    `Parsed: ${parseResult?.totalEntities ?? 0} entities, ${parseResult?.totalRelationships ?? 0} relationships, ${parseResult?.totalFiles ?? 0} files`
  );

  // 6. Save file tree and contents (for Monaco editor & file explorer)
  info("Saving file tree and contents to MongoDB...");
  const savedCount = await saveRepoFilesToDB(repoId, testProjectPath);
  success(`Saved ${savedCount} files/directories`);

  // 7. Vector embedding (optional — requires GOOGLE_API_KEY)
  if (process.env.GOOGLE_API_KEY) {
    info("GOOGLE_API_KEY detected — embedding into Qdrant...");
    try {
      const { embedRepository } = await import(
        "../../src/services/embedRepository.service.js"
      );
      await embedRepository(repoId);
      success("Vector embeddings stored in Qdrant — chat will work!");
    } catch (e: any) {
      warn(`Embedding failed (Qdrant may not be running): ${e.message}`);
      warn("Chat/RAG won't work, but graph, editor, and dashboard will.");
    }
  } else {
    warn("No GOOGLE_API_KEY — skipping vector embedding");
    warn("Graph, editor, and dashboard will work. Chat/RAG requires API key.");
  }

  // 8. Mark repo as indexed
  await Repository.findByIdAndUpdate(repoId, { status: "indexed" });

  // Done!
  console.log(`\n${BOLD}${GREEN}╔══════════════════════════════════════════════════╗${NC}`);
  console.log(`${BOLD}${GREEN}║          🌱  Seed completed successfully!        ║${NC}`);
  console.log(`${BOLD}${GREEN}╚══════════════════════════════════════════════════╝${NC}\n`);

  console.log(`  Demo User Credentials:`);
  console.log(`  ${CYAN}Username:${NC}  ${DEMO_USER.username}`);
  console.log(`  ${CYAN}Email:${NC}     ${DEMO_USER.email}`);
  console.log(`  ${CYAN}GitHub ID:${NC} ${DEMO_USER.githubId}\n`);

  console.log(`  Seeded Repository:`);
  console.log(`  ${CYAN}Name:${NC}      ${DEMO_REPO.name}`);
  console.log(`  ${CYAN}Repo ID:${NC}   ${repoId}\n`);

  console.log(`  To login, start the servers and click "Dev Login" on the login page.\n`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((e) => {
  error(`Seed failed: ${e.message}`);
  console.error(e);
  process.exit(1);
});
