/**
 * Mitorix — Seed Script
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");
dotenv.config({ path: path.join(repoRoot, ".env") } as any);

import { User } from "../../models/auth.model.js";
import { Repository } from "../../models/repo.model.js";
import { CodeEntity } from "../../models/codeEntity.model.js";
import { CodeRelationship } from "../../models/relationship.model.js";
import { FileMetadata } from "../../models/fileMetadata.model.js";
import { FileContent } from "../../models/fileContent.model.js";
import { scanCodeFiles } from "../../modules/indexer/fileScanner.js";
import { processRepositoryParsing, saveRepoFilesToDB } from "../../services/parser.service.js";

// ─── Demo User Credentials ──────────────────────────────────
const DEMO_USER = {
  githubId: "demo-dev-00000",
  username: "mitorix-dev",
  email: "dev@mitorix.local",
  avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=mitorix",
};

const DEMO_REPO = {
  name: "todo-express-app",
  githubUrl: "local://test/seeding/test_project",
  defaultBranch: "main",
  localPath: "seeded-from-local",
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
  console.log(`\n${BOLD}${CYAN}━━━ Mitorix Seed Script ━━━${NC}\n`);

  // 1. Connect to MongoDB
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    error("MONGO_URI not set in .env");
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
    success("Old seed data cleaned");
  }

  // 4. Determine the test project path
  const testProjectPath = path.resolve(__dirname, "test_project");
  info(`Using test project at: ${testProjectPath}`);

  // 5. Create or update repository record
  if (!repo) {
    repo = await Repository.create({
      user: user._id,
      ...DEMO_REPO,
      localPath: testProjectPath,
      status: "cloned",
      fingerprint: "demo-test-fingerprint",
    });
    success("Repository record created");
  } else {
    repo.localPath = testProjectPath;
    repo.status = "cloned";
    repo.fingerprint = "demo-test-fingerprint";
    await repo.save();
    success("Repository record updated");
  }

  const repoId = repo._id.toString();

  // 6. Scan and save file contents
  info("Scanning files...");
  const files = await scanCodeFiles(testProjectPath);
  success(`Found ${files.length} code files`);

  info("Saving file contents to DB...");
  await saveRepoFilesToDB(repoId, testProjectPath);
  success("File contents saved");

  // 7. Parse code entities and relationships
  info("Parsing code entities...");
  const filePaths = files.map((f: any) => f.absolutePath);
  const result: any = await processRepositoryParsing(repoId, filePaths);
  success(`Parsed ${result.totalEntities} entities and ${result.totalRelationships} relationships`);

  // 8. Generate Vector Embeddings
  info("Generating vector embeddings (this might take a few moments)...");
  const { embedRepository } = await import("../../services/embedRepository.service.js");
  await embedRepository(repoId);
  success("Vector embeddings generated successfully");

  // 9. Update repo status
  repo.status = "indexed";
  repo.isEmbedded = true;
  await repo.save();
  success("Repository status set to 'indexed' and 'isEmbedded'");

  // 10. Summary
  const entityCount = await CodeEntity.countDocuments({ repoId: repo._id });
  const relCount = await CodeRelationship.countDocuments({ repoId: repo._id });

  console.log(`\n${BOLD}${GREEN}✔ Seed complete!${NC}`);
  console.log(`  User:          ${DEMO_USER.username} (${DEMO_USER.githubId})`);
  console.log(`  Repository:    ${DEMO_REPO.name}`);
  console.log(`  Entities:      ${entityCount}`);
  console.log(`  Relationships: ${relCount}`);
  console.log(`\n  ${YELLOW}Use 'Dev Login' button on the login page to sign in.${NC}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((e) => {
  error(`Seed failed: ${e.message}`);
  console.error(e);
  process.exit(1);
});
