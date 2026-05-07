import dotenv from "dotenv";
import mongoose from "mongoose";
import { runArchitectureCheck } from "../services/architectureEngine.service.js";
import { CodeRelationship } from "../models/relationship.model.js";
import { ArchitectureViolation } from "../models/architectureViolation.model.js";
import { Repository } from "../models/repo.model.js";

dotenv.config();

async function testArchitectureEngine() {
    console.log("=== 📐 Starting Clean Architecture Engine Test Suite ===");

    // 1. Establish MongoDB Connection
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/repolens";
    console.log(`[Test] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("[Test] MongoDB connected successfully.");

    // 2. Create mock repository record
    const mockRepo = new Repository({
        user: new mongoose.Types.ObjectId(),
        name: "architecture_test_repo",
        githubUrl: "local://architecture_test_repo",
        localPath: "./architecture_test_repo",
        status: "indexing"
    });
    await mockRepo.save();
    const repoId = mockRepo._id.toString();
    console.log(`[Test] Created mock Repository in DB with ID: ${repoId}`);

    // 3. Create simulated dependencies/CodeRelationships
    console.log("[Test] Injecting simulated import relationships...");
    const mockRelationships = [
        // Violation 1: Level 1 (utils) -> Level 5 (ui) = High-Severity Violation!
        new CodeRelationship({
            repoId,
            fromName: "mathHelper",
            fromFilePath: "/src/utils/math.ts",
            toName: "Button",
            toFilePath: "/src/components/Button.tsx",
            relationType: "imports",
            line: 4
        }),
        // Violation 2: Level 2 (models) -> Level 4 (controllers) = Medium-Severity Violation!
        new CodeRelationship({
            repoId,
            fromName: "UserModel",
            fromFilePath: "/src/models/User.ts",
            toName: "userController",
            toFilePath: "/src/controllers/userController.ts",
            relationType: "imports",
            line: 12
        }),
        // Valid relation: Level 4 (controllers) -> Level 3 (services) = Valid Architecture!
        new CodeRelationship({
            repoId,
            fromName: "userController",
            fromFilePath: "/src/controllers/userController.ts",
            toName: "userService",
            toFilePath: "/src/services/userService.ts",
            relationType: "imports",
            line: 2
        })
    ];

    await CodeRelationship.insertMany(mockRelationships);
    console.log("[Test] Successfully injected 3 simulated relations (2 violating, 1 valid).");

    // 4. Run the architecture rule engine
    console.log("[Test] Triggering runArchitectureCheck...");
    const violationCount = await runArchitectureCheck(repoId);
    console.log(`[Test] Check complete. Detected and saved ${violationCount} boundary violations.`);

    // 5. Query and print saved violations
    const violations = await ArchitectureViolation.find({ repoId }).lean();
    console.log("\n=== 🎯 DETECTED ARCHITECTURE VIOLATIONS ===");
    violations.forEach((violation, index) => {
        console.log(`\n[Violation #${index + 1}]`);
        console.log(`Severity       : ${violation.severity.toUpperCase()}`);
        console.log(`File           : ${violation.file} (Line: ${violation.line || "N/A"})`);
        console.log(`Path           : ${violation.path}`);
        console.log(`Violating Layer: ${violation.violatingLayer.toUpperCase()}`);
        console.log(`Imported Layer : ${violation.importedLayer.toUpperCase()}`);
        console.log(`Description    : ${violation.desc}`);
    });
    console.log("\n=============================================");

    // 6. Clean up database artifacts
    console.log("\n[Test] Initiating cleanup...");
    await CodeRelationship.deleteMany({ repoId });
    await ArchitectureViolation.deleteMany({ repoId });
    await Repository.deleteOne({ _id: repoId });
    console.log("[Test] Cleaned up MongoDB mock records.");

    await mongoose.disconnect();
    console.log("[Test] Disconnected from MongoDB. Suite finished.");
}

testArchitectureEngine().catch(err => {
    console.error("[Test] Suite failed with error:", err);
});
