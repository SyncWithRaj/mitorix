/**
 * Embedding Efficiency Test — Nomic-embed-text via Ollama
 *
 * Compares embedding quality and performance metrics:
 *  - Latency per embedding call
 *  - Vector dimension verification
 *  - Cosine similarity between related vs unrelated code snippets
 *  - Batch embedding throughput
 *
 * Run: npx tsx test/testNomicEmbedding.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: "../.env", quiet: true });
import { OllamaEmbeddings } from "@langchain/ollama";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text",
    baseUrl: OLLAMA_BASE_URL,
});
// ─── Test Data ───────────────────────────────────────────────────────────────
const CODE_SNIPPETS = {
    // Pair 1: Semantically SIMILAR (both are user creation functions)
    createUserA: `
Entity Type: function
Name: createUser
File: controllers/user.controller.ts

Code:
async function createUser(req, res) {
  const user = new User(req.body);
  await user.save();
  res.status(201).json(user);
}`,
    createUserB: `
Entity Type: function
Name: addNewUser
File: services/user.service.ts

Code:
async function addNewUser(data) {
  const newUser = await UserModel.create(data);
  return newUser;
}`,
    // Pair 2: Semantically DIFFERENT
    deleteUser: `
Entity Type: function
Name: deleteUser
File: controllers/user.controller.ts

Code:
async function deleteUser(req, res) {
  await User.findByIdAndDelete(req.params.id);
  res.status(204).send();
}`,
    // Pair 3: Completely UNRELATED (database config)
    dbConfig: `
Entity Type: variable
Name: mongoConfig
File: config/database.ts

Code:
const mongoConfig = {
  uri: process.env.MONGO_URI,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
  }
};`,
    // Short natural language query
    queryFindUser: "Find the function that creates a new user",
    queryDbSetup: "How is the database configured",
};
// ─── Helpers ─────────────────────────────────────────────────────────────────
function cosineSimilarity(a, b) {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
function formatMs(ms) {
    return `${ms.toFixed(1)}ms`;
}
// ─── Tests ───────────────────────────────────────────────────────────────────
async function runTests() {
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("  Nomic-embed-text Embedding Efficiency Test");
    console.log("  Model: nomic-embed-text | Provider: Ollama (local)");
    console.log("═══════════════════════════════════════════════════════════════\n");
    // ── Test 1: Single embedding latency & dimension check ──
    console.log("─── Test 1: Single Embedding Latency & Dimensions ───────────\n");
    const t1Start = performance.now();
    const vec1 = await embeddings.embedQuery(CODE_SNIPPETS.createUserA);
    const t1End = performance.now();
    console.log(`  ✓ Vector dimension: ${vec1.length}`);
    console.log(`  ✓ First call latency (cold): ${formatMs(t1End - t1Start)}`);
    // Warm call
    const t2Start = performance.now();
    const vec2 = await embeddings.embedQuery(CODE_SNIPPETS.createUserB);
    const t2End = performance.now();
    console.log(`  ✓ Second call latency (warm): ${formatMs(t2End - t2Start)}`);
    // ── Test 2: Semantic similarity checks ──
    console.log("\n─── Test 2: Semantic Similarity (Cosine) ────────────────────\n");
    const vecDeleteUser = await embeddings.embedQuery(CODE_SNIPPETS.deleteUser);
    const vecDbConfig = await embeddings.embedQuery(CODE_SNIPPETS.dbConfig);
    const vecQueryUser = await embeddings.embedQuery(CODE_SNIPPETS.queryFindUser);
    const vecQueryDb = await embeddings.embedQuery(CODE_SNIPPETS.queryDbSetup);
    const simSameIntent = cosineSimilarity(vec1, vec2);
    const simDifferentFn = cosineSimilarity(vec1, vecDeleteUser);
    const simUnrelated = cosineSimilarity(vec1, vecDbConfig);
    const simQueryToDoc = cosineSimilarity(vecQueryUser, vec1);
    const simQueryToWrongDoc = cosineSimilarity(vecQueryUser, vecDbConfig);
    const simDbQueryToDbDoc = cosineSimilarity(vecQueryDb, vecDbConfig);
    const results = [
        { label: "createUser ↔ addNewUser (same intent)", score: simSameIntent, expected: "HIGH (>0.7)" },
        { label: "createUser ↔ deleteUser (related entity)", score: simDifferentFn, expected: "MEDIUM (0.5-0.7)" },
        { label: "createUser ↔ mongoConfig (unrelated)", score: simUnrelated, expected: "LOW (<0.5)" },
        { label: "Query:'create user' ↔ createUser doc", score: simQueryToDoc, expected: "HIGH (>0.6)" },
        { label: "Query:'create user' ↔ mongoConfig doc", score: simQueryToWrongDoc, expected: "LOW (<0.4)" },
        { label: "Query:'db config' ↔ mongoConfig doc", score: simDbQueryToDbDoc, expected: "HIGH (>0.6)" },
    ];
    for (const r of results) {
        const scoreStr = (r.score * 100).toFixed(1) + "%";
        const icon = r.score > 0.6 ? "🟢" : r.score > 0.4 ? "🟡" : "🔴";
        console.log(`  ${icon} ${r.label}`);
        console.log(`     Score: ${scoreStr}  |  Expected: ${r.expected}`);
    }
    // ── Test 3: Batch embedding throughput ──
    console.log("\n─── Test 3: Batch Embedding Throughput ──────────────────────\n");
    const batchTexts = [
        CODE_SNIPPETS.createUserA,
        CODE_SNIPPETS.createUserB,
        CODE_SNIPPETS.deleteUser,
        CODE_SNIPPETS.dbConfig,
        CODE_SNIPPETS.queryFindUser,
        CODE_SNIPPETS.queryDbSetup,
    ];
    const batchStart = performance.now();
    const batchVectors = await embeddings.embedDocuments(batchTexts);
    const batchEnd = performance.now();
    const totalBatchMs = batchEnd - batchStart;
    const perItemMs = totalBatchMs / batchTexts.length;
    console.log(`  ✓ Batch size: ${batchTexts.length} documents`);
    console.log(`  ✓ Total batch time: ${formatMs(totalBatchMs)}`);
    console.log(`  ✓ Per-document avg: ${formatMs(perItemMs)}`);
    console.log(`  ✓ All vectors ${batchVectors[0].length}-dimensional: ${batchVectors.every(v => v.length === batchVectors[0].length)}`);
    // ── Test 4: Ranking accuracy ──
    console.log("\n─── Test 4: Ranking Accuracy (Query → Documents) ────────────\n");
    const query = "function that creates a new user in the database";
    const queryVec = await embeddings.embedQuery(query);
    const docs = [
        { name: "createUser", vec: vec1 },
        { name: "addNewUser", vec: vec2 },
        { name: "deleteUser", vec: vecDeleteUser },
        { name: "mongoConfig", vec: vecDbConfig },
    ];
    const ranked = docs
        .map(d => ({ name: d.name, score: cosineSimilarity(queryVec, d.vec) }))
        .sort((a, b) => b.score - a.score);
    console.log(`  Query: "${query}"\n`);
    console.log("  Rank | Entity       | Score");
    console.log("  ─────┼──────────────┼──────────");
    ranked.forEach((r, i) => {
        const bar = "█".repeat(Math.round(r.score * 20));
        console.log(`    ${i + 1}  | ${r.name.padEnd(12)} | ${(r.score * 100).toFixed(1)}% ${bar}`);
    });
    const correctRanking = ranked[0].name === "createUser" || ranked[0].name === "addNewUser";
    console.log(`\n  ${correctRanking ? "✅" : "❌"} Top result is ${correctRanking ? "CORRECT" : "INCORRECT"} — ${ranked[0].name}`);
    // ── Summary ──
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("  SUMMARY");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`  Model:            nomic-embed-text (Ollama local)`);
    console.log(`  Dimensions:       ${vec1.length}`);
    console.log(`  Cold latency:     ${formatMs(t1End - t1Start)}`);
    console.log(`  Warm latency:     ${formatMs(t2End - t2Start)}`);
    console.log(`  Batch throughput: ${formatMs(perItemMs)}/doc`);
    console.log(`  Ranking:          ${correctRanking ? "PASS ✅" : "FAIL ❌"}`);
    console.log(`  Same-intent sim:  ${(simSameIntent * 100).toFixed(1)}%`);
    console.log(`  Cross-intent sim: ${(simUnrelated * 100).toFixed(1)}%`);
    console.log(`  Discrimination:   ${((simSameIntent - simUnrelated) * 100).toFixed(1)}% gap`);
    console.log("═══════════════════════════════════════════════════════════════\n");
}
runTests().catch(console.error);
//# sourceMappingURL=testNomicEmbedding.js.map