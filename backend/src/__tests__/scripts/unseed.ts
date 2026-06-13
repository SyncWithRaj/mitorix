/**
 * RepoLens — Unseed Script
 *
 * Removes all data created by the seed script:
 *   - Demo user
 *   - Seeded repository and all associated data (entities, relationships, files)
 *   - Qdrant vectors (if any)
 *   - Chat history
 *
 * Usage:  npm run unseed
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { QdrantClient } from "@qdrant/js-client-rest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");
dotenv.config({ path: path.join(repoRoot, ".env") } as any);

import { User } from "../../models/auth.model.js";
import { Repository } from "../../models/repo.model.js";
import { CodeEntity } from "../../models/codeEntity.model.js";
import { CodeRelationship } from "../../models/relationship.model.js";
import { FileMetadata } from "../../models/fileMetadata.model.js";
import { FileContent } from "../../models/fileContent.model.js";
import ChatHistory from "../../models/chatHistory.model.js";

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

const info = (msg: string) => console.log(`${CYAN}ℹ${NC} ${msg}`);
const success = (msg: string) => console.log(`${GREEN}✔${NC} ${msg}`);
const warn = (msg: string) => console.log(`${YELLOW}⚠${NC} ${msg}`);
const error = (msg: string) => console.log(`${RED}✖${NC} ${msg}`);

// ─── Main ────────────────────────────────────────────────────
async function unseed() {
  console.log(`\n${BOLD}${CYAN}━━━ RepoLens Unseed Script ━━━${NC}\n`);

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    error("MONGO_URI not set in .env");
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
    } catch (e: any) {
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
