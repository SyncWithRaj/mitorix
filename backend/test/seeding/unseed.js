/**
 * RepoLens — Unseed Script
 *
 * Removes all data created by the seed script:
 *   - Demo user
 *   - Seeded repository and all associated data
 *   - Qdrant vectors (if any)
 *
 * Usage:  npm run unseed
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(backendRoot, "../.env") });
import { User } from "../../src/models/auth.model.js";
import { Repository } from "../../src/models/repo.model.js";
import { CodeEntity } from "../../src/models/codeEntity.model.js";
import { CodeRelationship } from "../../src/models/relationship.model.js";
import { FileMetadata } from "../../src/models/fileMetadata.model.js";
import { FileContent } from "../../src/models/fileContent.model.js";
import ChatHistory from "../../src/models/chatHistory.model.js";
// ─── Constants ───────────────────────────────────────────────
const DEMO_GITHUB_ID = "demo-dev-00000";
const DEMO_REPO_NAME = "todo-express-app";
// ─── Colors ──────────────────────────────────────────────────
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";
const NC = "\x1b[0m";
const info = (msg) => console.log(`${CYAN}ℹ${NC} ${msg}`);
const success = (msg) => console.log(`${GREEN}✔${NC} ${msg}`);
const warn = (msg) => console.log(`${YELLOW}⚠${NC} ${msg}`);
const error = (msg) => console.log(`${RED}✖${NC} ${msg}`);
// ─── Main ────────────────────────────────────────────────────
async function unseed() {
  console.log(`\n${BOLD}${CYAN}━━━ RepoLens Unseed Script ━━━${NC}\n`);
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    error("MONGO_URI not set in backend/.env");
    process.exit(1);
  }
  info("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  success("Connected to MongoDB");
  // 1. Find demo user
  const user = await User.findOne({ githubId: DEMO_GITHUB_ID });
  if (!user) {
    warn("Demo user not found — nothing to clean up");
    await mongoose.disconnect();
    process.exit(0);
  }
  // 2. Find seeded repo
  const repo = await Repository.findOne({
    user: user._id,
    name: DEMO_REPO_NAME,
  });
  if (repo) {
    const repoId = repo._id;
    info("Removing code entities...");
    const entitiesResult = await CodeEntity.deleteMany({ repoId });
    success(`Deleted ${entitiesResult.deletedCount} code entities`);
    info("Removing relationships...");
    const relsResult = await CodeRelationship.deleteMany({ repoId });
    success(`Deleted ${relsResult.deletedCount} relationships`);
    info("Removing file metadata...");
    const metaResult = await FileMetadata.deleteMany({ repoId });
    success(`Deleted ${metaResult.deletedCount} file metadata records`);
    info("Removing file contents...");
    const filesResult = await FileContent.deleteMany({ repoId });
    success(`Deleted ${filesResult.deletedCount} file content records`);
    info("Removing chat history...");
    const chatResult = await ChatHistory.deleteMany({ repoId });
    success(`Deleted ${chatResult.deletedCount} chat messages`);
    // 3. Try to clean Qdrant vectors
    try {
      const { QdrantClient } = await import("@qdrant/js-client-rest");
      const qdrant = new QdrantClient({
        url: process.env.QDRANT_URL || "http://localhost:6333",
      });
      const fingerprint = repo.fingerprint;
      if (fingerprint) {
        info("Removing vectors from Qdrant...");
        await qdrant.delete("repo_entities", {
          filter: {
            must: [
              {
                key: "metadata.fingerprint",
                match: { value: fingerprint },
              },
            ],
          },
        });
        success("Qdrant vectors removed");
      }
    } catch (e) {
      warn(`Could not clean Qdrant (may not be running): ${e.message}`);
    }
    // 4. Delete repo record
    info("Removing repository record...");
    await Repository.findByIdAndDelete(repoId);
    success("Repository record deleted");
  } else {
    warn("Seeded repository not found — skipping");
  }
  // 5. Delete demo user
  info("Removing demo user...");
  await User.findByIdAndDelete(user._id);
  success("Demo user deleted");
  console.log(`\n${BOLD}${GREEN}✔ Unseed complete — all seed data removed.${NC}\n`);
  await mongoose.disconnect();
  process.exit(0);
}
unseed().catch((e) => {
  error(`Unseed failed: ${e.message}`);
  console.error(e);
  process.exit(1);
});
//# sourceMappingURL=unseed.js.map
