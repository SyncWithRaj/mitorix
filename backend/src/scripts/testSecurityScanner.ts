import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { runSecurityScan } from "../services/securityScanner.service.js";
import { SecurityIssue } from "../models/securityIssue.model.js";
import { Repository } from "../models/repo.model.js";

dotenv.config();

async function testScanner() {
    console.log("=== 🛡️ Starting Security Scanner Test Suite ===");

    // 1. Establish MongoDB Connection
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/repolens";
    console.log(`[Test] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("[Test] MongoDB connected successfully.");

    // 2. Create mock repository record
    const mockRepo = new Repository({
        user: new mongoose.Types.ObjectId(),
        name: "security_test_repo",
        githubUrl: "local://security_test_repo",
        localPath: "./security_test_repo",
        status: "indexing"
    });
    await mockRepo.save();
    const repoId = mockRepo._id.toString();
    console.log(`[Test] Created mock Repository in DB with ID: ${repoId}`);

    // 3. Create a temporary folder and write vulnerable files
    const mockRepoPath = path.resolve("./security_test_repo");
    if (!fs.existsSync(mockRepoPath)) {
        fs.mkdirSync(mockRepoPath, { recursive: true });
    }

    const jsFileContent = `
// JavaScript Vulnerable Test File
const app_secret = "sk_live_51Msz9y6p7v8q";
function processUser(id, queryStr) {
    eval("var test = " + id);
    const sql = "SELECT * FROM users WHERE id = " + queryStr;
    db.query(sql);
}
document.getElementById('container').innerHTML = queryStr;
    `;

    const pyFileContent = `
# Python Vulnerable Test File
import os
import pickle

def load_data(file_path):
    f = open(file_path, 'rb')
    data = pickle.load(f)
    os.system("echo Processing " + file_path)
    `;

    fs.writeFileSync(path.join(mockRepoPath, "vulnerable.js"), jsFileContent);
    fs.writeFileSync(path.join(mockRepoPath, "vulnerable.py"), pyFileContent);
    console.log(`[Test] Wrote JS and Python vulnerable mock files into: ${mockRepoPath}`);

    // 4. Run the scanner
    console.log("[Test] Triggering runSecurityScan...");
    const issueCount = await runSecurityScan(repoId, mockRepoPath);
    console.log(`[Test] Scan complete. Detected and saved ${issueCount} issues.`);

    // 5. Query and print saved issues
    const issues = await SecurityIssue.find({ repoId }).lean();
    console.log("\n=== 🎯 DETECTED VULNERABILITIES ===");
    issues.forEach((issue, index) => {
        console.log(`\n[Vulnerability #${index + 1}]`);
        console.log(`Severity : ${issue.severity.toUpperCase()}`);
        console.log(`Title    : ${issue.title}`);
        console.log(`File     : ${issue.file} (Line: ${issue.line || "N/A"})`);
        console.log(`Path     : ${issue.path}`);
        console.log(`Desc     : ${issue.desc}`);
        if (issue.code) {
            console.log(`Code     : "${issue.code}"`);
        }
    });
    console.log("\n=====================================");

    // 6. Clean up database and disk artifacts
    console.log("\n[Test] Initiating cleanup...");
    await SecurityIssue.deleteMany({ repoId });
    await Repository.deleteOne({ _id: repoId });
    console.log("[Test] Cleaned up MongoDB mock records.");

    if (fs.existsSync(mockRepoPath)) {
        fs.rmSync(mockRepoPath, { recursive: true, force: true });
        console.log("[Test] Cleaned up temporary folders from disk.");
    }

    await mongoose.disconnect();
    console.log("[Test] Disconnected from MongoDB. Suite finished.");
}

testScanner().catch(err => {
    console.error("[Test] Suite failed with error:", err);
});
