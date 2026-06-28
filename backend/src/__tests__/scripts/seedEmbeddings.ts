/**
 * Seed & Unseed Test Script
 *
 * Seeds fake code entities into MongoDB and embeds them into Qdrant,
 * then provides an unseed command to clean everything up.
 *
 * Usage:
 *   npx tsx src/__tests__/scripts/seedEmbeddings.ts seed       # Seed test data + embed
 *   npx tsx src/__tests__/scripts/seedEmbeddings.ts unseed     # Remove all test data
 *   npx tsx src/__tests__/scripts/seedEmbeddings.ts status     # Check current state
 */
import dotenv from "dotenv";
dotenv.config({ path: "../../.env", quiet: true } as any);

import mongoose from "mongoose";
import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuidv4 } from "uuid";
import { embedBatch } from "../../services/embedding.service.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Mitorix";
const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const COLLECTION = "repo_entities";

// Test identifiers — used to find and clean up test data
const TEST_REPO_ID = "000000000000000000000001";
const TEST_FINGERPRINT = "test-seed-fingerprint-v1";

const qdrant = new QdrantClient({ url: QDRANT_URL });

// ── Sample code entities to seed ──
const SEED_ENTITIES = [
  {
    name: "add",
    type: "function",
    language: "typescript",
    filePath: "/test/src/math.ts",
    startLine: 1,
    endLine: 5,
    content: `function add(a: number, b: number): number {
  return a + b;
}`,
    parameters: ["a: number", "b: number"],
    returnType: "number",
  },
  {
    name: "subtract",
    type: "function",
    language: "typescript",
    filePath: "/test/src/math.ts",
    startLine: 7,
    endLine: 11,
    content: `function subtract(a: number, b: number): number {
  return a - b;
}`,
    parameters: ["a: number", "b: number"],
    returnType: "number",
  },
  {
    name: "UserService",
    type: "class",
    language: "typescript",
    filePath: "/test/src/services/userService.ts",
    startLine: 1,
    endLine: 25,
    content: `class UserService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async findById(id: string): Promise<User | null> {
    return this.db.users.findOne({ _id: id });
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    return this.db.users.create(data);
  }
}`,
    parameters: [],
    returnType: "",
  },
  {
    name: "IConfig",
    type: "interface",
    language: "typescript",
    filePath: "/test/src/types/config.ts",
    startLine: 1,
    endLine: 8,
    content: `interface IConfig {
  port: number;
  host: string;
  dbUri: string;
  jwtSecret: string;
  nodeEnv: 'development' | 'production' | 'test';
}`,
    parameters: [],
    returnType: "",
  },
  {
    name: "healthCheck",
    type: "route",
    language: "typescript",
    filePath: "/test/src/routes/health.ts",
    startLine: 5,
    endLine: 12,
    content: `router.get('/api/health', async (req: Request, res: Response) => {
  const dbStatus = await checkDatabaseConnection();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    database: dbStatus ? 'connected' : 'disconnected',
  });
});`,
    parameters: ["req: Request", "res: Response"],
    returnType: "void",
  },
  {
    name: "Status",
    type: "enum",
    language: "typescript",
    filePath: "/test/src/types/status.ts",
    startLine: 1,
    endLine: 5,
    content: `enum Status {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended',
}`,
    parameters: [],
    returnType: "",
  },
];

// ── SEED: Insert entities into MongoDB + embed into Qdrant ──
async function seed() {
  console.log("🌱 Seeding test data...\n");

  await mongoose.connect(MONGO_URI);
  console.log(`  ✓ Connected to MongoDB`);

  const CodeEntity = mongoose.model(
    "CodeEntity",
    new mongoose.Schema({
      repoId: { type: mongoose.Schema.Types.ObjectId, required: true },
      filePath: String,
      name: String,
      type: String,
      language: String,
      parameters: [String],
      returnType: String,
      startLine: Number,
      endLine: Number,
      content: String,
      scopeDepth: { type: Number, default: 0 },
      parentName: { type: String, default: null },
      embeddingId: String,
    }, { timestamps: true })
  );

  // Check if already seeded
  const existing = await CodeEntity.countDocuments({ repoId: new mongoose.Types.ObjectId(TEST_REPO_ID) });
  if (existing > 0) {
    console.log(`  ⚠ Test data already exists (${existing} entities). Run 'unseed' first.`);
    await mongoose.disconnect();
    return;
  }

  // Insert into MongoDB
  const docs = SEED_ENTITIES.map((e) => ({
    ...e,
    repoId: new mongoose.Types.ObjectId(TEST_REPO_ID),
    scopeDepth: 0,
    parentName: null,
  }));

  const inserted = await CodeEntity.insertMany(docs);
  console.log(`  ✓ Inserted ${inserted.length} code entities into MongoDB`);

  // Embed into Qdrant
  console.log(`  ⏳ Embedding ${inserted.length} entities...`);
  const texts = inserted.map((entity: any) => `
Entity Type: ${entity.type}
Name: ${entity.name}
File: ${entity.filePath}

Code:
${entity.content || ""}
`);

  const vectors = await embedBatch(texts, 1);
  console.log(`  ✓ Generated ${vectors.length} embedding vectors`);

  // Build Qdrant points
  const points = inserted.map((entity: any, i: number) => ({
    id: uuidv4(),
    vector: vectors[i],
    payload: {
      pageContent: entity.content || entity.name,
      metadata: {
        mongoId: entity._id.toString(),
        repoId: TEST_REPO_ID,
        fingerprint: TEST_FINGERPRINT,
        filePath: entity.filePath,
        language: entity.language,
        startLine: entity.startLine,
        endLine: entity.endLine,
      },
    },
  }));

  // Ensure collection exists
  try {
    await qdrant.getCollection(COLLECTION);
  } catch {
    console.log(`  Creating Qdrant collection "${COLLECTION}"...`);
    await qdrant.createCollection(COLLECTION, {
      vectors: { size: 3072, distance: "Cosine" },
    });
  }

  await qdrant.upsert(COLLECTION, { wait: true, points });
  console.log(`  ✓ Uploaded ${points.length} vectors to Qdrant`);

  await mongoose.disconnect();
  console.log("\n✅ Seed complete! Test data is ready.\n");
}

// ── UNSEED: Remove all test data ──
async function unseed() {
  console.log("🧹 Cleaning up test data...\n");

  // Remove from MongoDB
  await mongoose.connect(MONGO_URI);
  const CodeEntity = mongoose.model("CodeEntity");
  const result = await CodeEntity.deleteMany({ repoId: new mongoose.Types.ObjectId(TEST_REPO_ID) });
  console.log(`  ✓ Removed ${result.deletedCount} entities from MongoDB`);
  await mongoose.disconnect();

  // Remove from Qdrant
  try {
    await qdrant.delete(COLLECTION, {
      filter: {
        must: [
          { key: "metadata.fingerprint", match: { value: TEST_FINGERPRINT } },
        ],
      },
    });
    console.log(`  ✓ Removed test vectors from Qdrant`);
  } catch (err: any) {
    if (err.status === 404) {
      console.log(`  ⚠ Qdrant collection not found — nothing to clean`);
    } else {
      throw err;
    }
  }

  console.log("\n✅ Unseed complete! All test data removed.\n");
}

// ── STATUS: Check current state ──
async function status() {
  console.log("📊 Checking test data status...\n");

  await mongoose.connect(MONGO_URI);
  const CodeEntity = mongoose.model(
    "CodeEntity",
    new mongoose.Schema({}, { strict: false })
  );
  const mongoCount = await CodeEntity.countDocuments({ repoId: new mongoose.Types.ObjectId(TEST_REPO_ID) });
  console.log(`  MongoDB: ${mongoCount} test entities`);
  await mongoose.disconnect();

  try {
    const qdrantCount = await qdrant.count(COLLECTION, {
      filter: {
        must: [
          { key: "metadata.fingerprint", match: { value: TEST_FINGERPRINT } },
        ],
      },
      exact: true,
    });
    console.log(`  Qdrant:  ${qdrantCount.count} test vectors`);
  } catch {
    console.log(`  Qdrant:  Collection not found`);
  }

  console.log("");
}

// ── CLI Router ──
const command = process.argv[2];

if (command === "seed") {
  seed().catch((e) => { console.error("Seed failed:", e.message); process.exit(1); });
} else if (command === "unseed") {
  unseed().catch((e) => { console.error("Unseed failed:", e.message); process.exit(1); });
} else if (command === "status") {
  status().catch((e) => { console.error("Status check failed:", e.message); process.exit(1); });
} else {
  console.log("Usage:");
  console.log("  npx tsx src/__tests__/scripts/seedEmbeddings.ts seed     # Seed test data");
  console.log("  npx tsx src/__tests__/scripts/seedEmbeddings.ts unseed   # Remove test data");
  console.log("  npx tsx src/__tests__/scripts/seedEmbeddings.ts status   # Check status");
}
