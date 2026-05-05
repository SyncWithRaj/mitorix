/**
 * CodeFlow — Security Vulnerability Scanner Service
 *
 * Regex-based detection of common security issues:
 * hardcoded secrets, SQL injection, XSS, eval, command execution, etc.
 * Ported from index.html Parser.detectSecurity (lines 4682–4789).
 */

import type { AnalyzedFile, SecurityIssue } from "./types.js";

/**
 * Scan all files for security vulnerabilities.
 */
export function detectSecurity(files: AnalyzedFile[]): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  for (const f of files) {
    const content = f.content;
    if (!content) continue;

    const lines = content.split("\n");

    // Hardcoded secrets
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      if (
        /(?:password|passwd|pwd|secret|api_key|apikey|token|auth)\s*[=:]\s*['"][^'"]{4,}['"]/i.test(line) &&
        !line.includes("process.env") &&
        !line.includes("config.")
      ) {
        issues.push({
          severity: "high",
          title: "Hardcoded Secret",
          file: f.name,
          path: f.path,
          line: idx + 1,
          desc: "Credentials should never be hardcoded. Use environment variables or a secrets manager.",
          code: line.trim().substring(0, 80),
        });
      }
    }

    // SQL Injection
    if (
      /query\s*\(\s*['"`][^'"`]*\s*\+/.test(content) ||
      /execute\s*\(\s*['"`][^'"`]*\$\{/.test(content) ||
      /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE)/i.test(content)
    ) {
      const m = content.match(/.*(query|execute|SELECT|INSERT|UPDATE|DELETE).*(\+|\$\{).*/i);
      issues.push({
        severity: "high",
        title: "SQL Injection Risk",
        file: f.name,
        path: f.path,
        desc: "String concatenation in SQL queries. Use parameterized queries instead.",
        code: m ? m[0].trim().substring(0, 80) : "",
      });
    }

    // XSS Vulnerabilities
    const hasInnerHtmlAssignment = /innerHTML\s*=/.test(content);
    const hasDangerousHtmlRender = /dangerouslySetInnerHTML/.test(content);
    if (hasInnerHtmlAssignment || hasDangerousHtmlRender) {
      issues.push({
        severity: "high",
        title: "XSS Vulnerability",
        file: f.name,
        path: f.path,
        desc: "Direct HTML injection can lead to XSS attacks. Sanitize user input.",
        code: "",
      });
    }

    // eval() usage
    if (content.includes("eval(")) {
      const evalLine = lines.findIndex((l) => l.includes("eval("));
      issues.push({
        severity: "medium",
        title: "Dynamic Code Execution",
        file: f.name,
        path: f.path,
        line: evalLine + 1,
        desc: "eval() executes arbitrary code. Avoid if possible or validate input strictly.",
        code: evalLine >= 0 ? lines[evalLine].trim().substring(0, 80) : "",
      });
    }

    // Function constructor
    if (content.includes("Function(") || /new\s+Function\s*\(/.test(content)) {
      issues.push({
        severity: "medium",
        title: "Function Constructor",
        file: f.name,
        path: f.path,
        desc: "Function constructor is similar to eval(). Consider alternatives.",
        code: "",
      });
    }

    // Command execution
    if (/\.exec\s*\(/.test(content) || /child_process/.test(content)) {
      issues.push({
        severity: "medium",
        title: "Command Execution",
        file: f.name,
        path: f.path,
        desc: "Shell command execution detected. Ensure input is sanitized to prevent injection.",
        code: "",
      });
    }

    // Debug statements (excessive)
    if (/console\.(log|debug|info)\(/.test(content)) {
      const consoleCount = (content.match(/console\.(log|debug|info)\(/g) || []).length;
      if (consoleCount > 3) {
        issues.push({
          severity: "low",
          title: "Debug Statements",
          file: f.name,
          path: f.path,
          desc: `${consoleCount} console statements found. Remove before production.`,
          code: "",
        });
      }
    }

    // TODO/FIXME comments
    if (/TODO|FIXME|HACK|XXX/.test(content)) {
      const todoCount = (content.match(/TODO|FIXME|HACK|XXX/g) || []).length;
      issues.push({
        severity: "low",
        title: "Code Comments",
        file: f.name,
        path: f.path,
        desc: `${todoCount} TODO/FIXME comments found. Address before release.`,
        code: "",
      });
    }

    // ---- Python-specific security checks ----
    const isPyFile = f.name.endsWith(".py") || f.name.endsWith(".pyw");
    if (isPyFile) {
      // Python eval()
      if (/\beval\s*\(/.test(content)) {
        const evalLine = lines.findIndex((l) => /\beval\s*\(/.test(l));
        issues.push({
          severity: "high",
          title: "Python eval()",
          file: f.name,
          path: f.path,
          line: evalLine >= 0 ? evalLine + 1 : undefined,
          desc: "eval() executes arbitrary Python code. Use ast.literal_eval() for safe parsing.",
          code: evalLine >= 0 ? lines[evalLine].trim().substring(0, 80) : "",
        });
      }

      // Python exec()
      if (/\bexec\s*\(/.test(content)) {
        const execLine = lines.findIndex((l) => /\bexec\s*\(/.test(l));
        issues.push({
          severity: "high",
          title: "Python exec()",
          file: f.name,
          path: f.path,
          line: execLine >= 0 ? execLine + 1 : undefined,
          desc: "exec() executes arbitrary Python code. This is almost always a security risk.",
          code: execLine >= 0 ? lines[execLine].trim().substring(0, 80) : "",
        });
      }

      // Pickle deserialization
      if (/\bpickle\.load/.test(content) || /\bunpickle/.test(content)) {
        issues.push({
          severity: "high",
          title: "Pickle Deserialization",
          file: f.name,
          path: f.path,
          desc: "pickle.load() can execute arbitrary code from untrusted data. Use JSON or safe alternatives.",
          code: "",
        });
      }

      // subprocess with shell=True
      if (/subprocess\.\w+\([^)]*shell\s*=\s*True/.test(content)) {
        issues.push({
          severity: "high",
          title: "Shell Injection Risk",
          file: f.name,
          path: f.path,
          desc: "subprocess with shell=True is vulnerable to command injection. Use shell=False with a list of args.",
          code: "",
        });
      }

      // os.system / os.popen
      if (/\bos\.system\s*\(/.test(content) || /\bos\.popen\s*\(/.test(content)) {
        const osLine = lines.findIndex((l) => /\bos\.(system|popen)\s*\(/.test(l));
        issues.push({
          severity: "high",
          title: "OS Command Execution",
          file: f.name,
          path: f.path,
          line: osLine >= 0 ? osLine + 1 : undefined,
          desc: "os.system()/os.popen() are vulnerable to command injection. Use subprocess with shell=False.",
          code: osLine >= 0 ? lines[osLine].trim().substring(0, 80) : "",
        });
      }

      // Bare except clauses
      const bareExcepts = (content.match(/\bexcept\s*:/g) || []).length;
      if (bareExcepts > 2) {
        issues.push({
          severity: "medium",
          title: "Bare Except Clauses",
          file: f.name,
          path: f.path,
          desc: `${bareExcepts} bare except: clauses found. These catch all exceptions including SystemExit and KeyboardInterrupt.`,
          code: "",
        });
      }

      // DEBUG = True
      if (/\bDEBUG\s*=\s*True\b/.test(content)) {
        issues.push({
          severity: "medium",
          title: "Debug Mode Enabled",
          file: f.name,
          path: f.path,
          desc: "DEBUG = True found. Ensure this is disabled in production.",
          code: "",
        });
      }
    }
  }

  // Sort by severity
  const sevOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => (sevOrder[a.severity] ?? 2) - (sevOrder[b.severity] ?? 2));

  return issues;
}
