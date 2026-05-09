import fs from "fs";
import path from "path";
import { SecurityIssue } from "../models/securityIssue.model.js";
import { scanCodeFiles } from "../modules/indexer/fileScanner.js";
import logger from "../lib/logger.js";

export async function runSecurityScan(repoId: string, repoPath: string): Promise<number> {
  try {
    logger.info({ repoId, repoPath }, "Starting security scan");

    // Clean up any old scan issues for this repository
    await SecurityIssue.deleteMany({ repoId });

    const scannedFiles = scanCodeFiles(repoPath);
    if (scannedFiles.length === 0) {
      logger.info({ repoId }, "No files found to scan");
      return 0;
    }

    const issuesToSave: any[] = [];

    for (const fileObj of scannedFiles) {
      const absolutePath = fileObj.absolutePath;
      const relativePath = path.relative(repoPath, absolutePath);
      const fileName = path.basename(absolutePath);

      try {
        const content = fs.readFileSync(absolutePath, "utf8");
        if (!content) continue;

        const lines = content.split(/\r?\n/);

        // --- RULE 1: Hardcoded Secrets ---
        lines.forEach((line, idx) => {
          const lineNum = idx + 1;
          if (
            line.match(
              /(?:password|passwd|pwd|secret|api_key|apikey|token|auth)\s*[=:]\s*['"][^'"]{4,}['"]/i
            ) &&
            !line.includes("process.env") &&
            !line.includes("config.")
          ) {
            issuesToSave.push({
              repoId,
              severity: "critical",
              title: "Hardcoded Secret",
              file: fileName,
              path: relativePath,
              line: lineNum,
              desc: "Credentials, passwords, or API keys should never be hardcoded. Use environment variables or a secure vault instead.",
              code: line.trim().substring(0, 100),
            });
          }
        });

        // --- RULE 2: SQL Injection Risk ---
        if (
          content.match(/query\s*\(\s*['"`][^'"`]*\s*\+/) ||
          content.match(/execute\s*\(\s*['"`][^'"`]*\$\{/) ||
          content.match(/\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE)/i)
        ) {
          const matchLine = lines.find((l) =>
            l.match(/.*(query|execute|SELECT|INSERT|UPDATE|DELETE).*(\+|\$\{).*/i)
          );
          issuesToSave.push({
            repoId,
            severity: "high",
            title: "SQL Injection Risk",
            file: fileName,
            path: relativePath,
            desc: "String concatenation or dynamic variable interpolation detected in SQL query. Use parameterized queries to prevent SQL injection.",
            code: matchLine ? matchLine.trim().substring(0, 100) : "",
          });
        }

        // --- RULE 3: XSS Vulnerability ---
        const hasInnerHtml = content.match(/innerHTML\s*=/);
        const hasDangerousHtml = content.match(/dangerouslySetInnerHTML/);
        if (hasInnerHtml || hasDangerousHtml) {
          issuesToSave.push({
            repoId,
            severity: "high",
            title: "Potential XSS Vulnerability",
            file: fileName,
            path: relativePath,
            desc: "Direct HTML injection or dangerouslySetInnerHTML render detected. Ensure all HTML inputs are thoroughly sanitized before rendering.",
            code: "",
          });
        }

        // --- RULE 4: Dynamic Code Execution ---
        if (content.includes("eval(")) {
          const evalLineIdx = lines.findIndex((l) => l.includes("eval("));
          issuesToSave.push({
            repoId,
            severity: "high",
            title: "Dynamic Code Execution (eval)",
            file: fileName,
            path: relativePath,
            line: evalLineIdx >= 0 ? evalLineIdx + 1 : undefined,
            desc: "Usage of eval() executes arbitrary strings as code, which represents a severe code-execution security risk.",
            code: evalLineIdx >= 0 ? lines[evalLineIdx].trim().substring(0, 100) : "eval(...)",
          });
        }

        if (content.includes("Function(") || content.match(/new\s+Function\s*\(/)) {
          issuesToSave.push({
            repoId,
            severity: "medium",
            title: "Function Constructor",
            file: fileName,
            path: relativePath,
            desc: "Function constructors execute strings dynamically, presenting risks similar to eval().",
            code: "",
          });
        }

        // --- RULE 5: OS Command Execution & Injection ---
        if (content.match(/\.exec\s*\(/) || content.match(/child_process/)) {
          issuesToSave.push({
            repoId,
            severity: "high",
            title: "System Command Execution",
            file: fileName,
            path: relativePath,
            desc: "Direct shell command execution detected. Ensure all system inputs are strictly validated and escaped.",
            code: "",
          });
        }

        // Python-Specific Checks
        const isPyFile = fileName.endsWith(".py") || fileName.endsWith(".pyw");
        if (isPyFile) {
          if (content.match(/\bpickle\.load/) || content.match(/\bunpickle/)) {
            issuesToSave.push({
              repoId,
              severity: "high",
              title: "Pickle Deserialization Vulnerability",
              file: fileName,
              path: relativePath,
              desc: "pickle.load() can execute arbitrary code during deserialization from untrusted data sources. Use JSON instead.",
              code: "",
            });
          }

          if (content.match(/subprocess\.\w+\([^)]*shell\s*=\s*True/)) {
            issuesToSave.push({
              repoId,
              severity: "high",
              title: "Shell Command Execution",
              file: fileName,
              path: relativePath,
              desc: "subprocess execution with shell=True is highly vulnerable to shell injection. Set shell=False.",
              code: "",
            });
          }

          if (content.match(/\bos\.system\s*\(/) || content.match(/\bos\.popen\s*\(/)) {
            issuesToSave.push({
              repoId,
              severity: "high",
              title: "OS Command Execution",
              file: fileName,
              path: relativePath,
              desc: "os.system() or os.popen() execute system commands. Port to subprocess with shell=False.",
              code: "",
            });
          }
        }

        // --- RULE 6: Code Comment Warnings (TODO/FIXME) ---
        if (content.match(/TODO|FIXME|HACK|XXX/)) {
          const todoCount = (content.match(/TODO|FIXME|HACK|XXX/g) || []).length;
          issuesToSave.push({
            repoId,
            severity: "low",
            title: "Outstanding Code Comments",
            file: fileName,
            path: relativePath,
            desc: `Detected ${todoCount} active TODO, FIXME, or HACK comments in the source file.`,
            code: "",
          });
        }
      } catch (fileReadError) {
        logger.error({ err: fileReadError, file: fileName }, "Security scanner failed to read file");
      }
    }

    if (issuesToSave.length > 0) {
      await SecurityIssue.insertMany(issuesToSave);
      logger.info({ repoId, issueCount: issuesToSave.length }, "Security issues saved to database");
    } else {
      logger.info({ repoId }, "No security issues detected");
    }

    return issuesToSave.length;
  } catch (err) {
    logger.error({ err, repoId }, "Security scan failed");
    return 0;
  }
}
