import dotenv from "dotenv";
import mongoose from "mongoose";
import { runAnalysisPipeline } from "../services/codeflow/analysis.pipeline.js";
import { SecurityIssue } from "../models/securityIssue.model.js";
import { ArchitectureViolation } from "../models/architectureViolation.model.js";
import { Repository } from "../models/repo.model.js";

dotenv.config();

async function testFullPipeline() {
    console.log("=== 💡 Starting Full Analysis Pipeline & suggestions Test Suite ===");

    // 1. Establish MongoDB Connection
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/repolens";
    console.log(`[Test] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("[Test] MongoDB connected successfully.");

    // 2. Create mock repository record
    const mockRepo = new Repository({
        user: new mongoose.Types.ObjectId(),
        name: "full_pipeline_test_repo",
        githubUrl: "local://full_pipeline_test_repo",
        localPath: "./full_pipeline_test_repo",
        status: "indexed"
    });
    await mockRepo.save();
    const repoId = mockRepo._id.toString();
    console.log(`[Test] Created mock Repository in DB with ID: ${repoId}`);

    // 3. Save mock findings directly to MongoDB
    console.log("[Test] Injecting mock security issues and architectural violations...");
    const mockSecurity = new SecurityIssue({
        repoId,
        severity: "critical",
        title: "Hardcoded AWS Secret Key",
        file: "config.js",
        path: "/src/config.js",
        line: 12,
        desc: "Credentials should never be hardcoded. Use environment variables.",
        code: "const AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';"
    });

    const mockViolation = new ArchitectureViolation({
        repoId,
        severity: "high",
        file: "math.ts",
        path: "/src/utils/math.ts",
        importedFile: "Button.tsx",
        importedPath: "/src/components/Button.tsx",
        violatingLayer: "utils",
        importedLayer: "ui",
        desc: "Clean Architecture Violation: Lower layer file 'math.ts' is importing from higher layer 'Button.tsx'."
    });

    await Promise.all([mockSecurity.save(), mockViolation.save()]);
    console.log("[Test] Mock findings successfully persisted in MongoDB.");

    // 4. Run the full orchestrator pipeline
    console.log("[Test] Triggering runAnalysisPipeline...");
    const analysisData = await runAnalysisPipeline(repoId);
    console.log("[Test] Pipeline execution complete.");

    // 5. Verify the data orchestration
    console.log("\n=== 🔍 ORCHESTRATION PAYLOAD VERIFICATION ===");
    console.log(`Total Files Checked      : ${analysisData.files.length}`);
    console.log(`Security Issues Found    : ${analysisData.securityIssues.length}`);
    console.log(`Architecture Violations  : ${analysisData.layerViolations.length}`);
    console.log(`Actionable Suggestions   : ${analysisData.suggestions.length}`);

    if (analysisData.securityIssues.length > 0) {
        console.log(`\n-> Top Security Issue  : [${analysisData.securityIssues[0].severity.toUpperCase()}] ${analysisData.securityIssues[0].title}`);
    }
    if (analysisData.layerViolations.length > 0) {
        console.log(`-> Top Violation       : ${analysisData.layerViolations[0].desc}`);
    }

    console.log("\n=== 💡 SYNTHESIZED ACTION CARDS ===");
    analysisData.suggestions.forEach((s, index) => {
        console.log(`\n[Card #${index + 1}]`);
        console.log(`Priority: ${s.priority.toUpperCase()}`);
        console.log(`Title   : ${s.title}`);
        console.log(`Desc    : ${s.desc}`);
        console.log(`Action  : ${s.action}`);
        console.log(`Impact  : ${s.impact}`);
    });
    console.log("\n=============================================");

    // 6. Clean up database artifacts
    console.log("\n[Test] Initiating cleanup...");
    await SecurityIssue.deleteMany({ repoId });
    await ArchitectureViolation.deleteMany({ repoId });
    await Repository.deleteOne({ _id: repoId });
    console.log("[Test] Cleaned up MongoDB mock records.");

    await mongoose.disconnect();
    console.log("[Test] Disconnected from MongoDB. Suite finished.");
}

testFullPipeline().catch(err => {
    console.error("[Test] Suite failed with error:", err);
});
