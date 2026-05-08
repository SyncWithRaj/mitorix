/**
 * CodeFlow — Design Pattern & Anti-Pattern Detection Service
 *
 * Detects common design patterns (Singleton, Factory, Observer, etc.)
 * and anti-patterns (God Objects, Long Files) from file contents.
 * Ported from index.html Parser.detectPatterns (lines 4332–4376).
 */

import type { AnalyzedFile, Pattern } from "./types.js";

/**
 * Detect design patterns and anti-patterns across all analyzed files.
 */
export function detectPatterns(files: AnalyzedFile[]): Pattern[] {
  const patterns: Pattern[] = [];

  // ---------- Design Patterns ----------

  const singletons = files.filter(
    (f) =>
      f.content &&
      (f.content.includes("getInstance") ||
        /let\s+instance\s*=/.test(f.content) ||
        /private\s+static\s+instance/.test(f.content))
  );
  if (singletons.length) {
    patterns.push({
      name: "Singleton",
      icon: "lock",
      desc: "Ensures a class has only one instance. Common for configuration, logging, or connection pools.",
      severity: "info",
      files: singletons.map((f) => ({ name: f.name, path: f.path })),
      metrics: { instances: singletons.length },
    });
  }

  const factories = files.filter(
    (f) =>
      f.content &&
      (f.name.toLowerCase().includes("factory") ||
        /create[A-Z]\w*\s*\(/.test(f.content) ||
        f.content.includes("return new"))
  );
  if (factories.length) {
    patterns.push({
      name: "Factory",
      icon: "factory",
      desc: "Creates objects without specifying exact class. Enables loose coupling and extensibility.",
      severity: "info",
      files: factories.map((f) => ({ name: f.name, path: f.path })),
      metrics: { factories: factories.length },
    });
  }

  const observers = files.filter(
    (f) =>
      f.content &&
      (f.content.includes("subscribe") ||
        f.content.includes("addEventListener") ||
        f.content.includes(".on(") ||
        f.content.includes("emit("))
  );
  if (observers.length) {
    patterns.push({
      name: "Observer/Event",
      icon: "eye",
      desc: "Defines a subscription mechanism for event-driven architecture. Great for decoupling.",
      severity: "info",
      files: observers.map((f) => ({ name: f.name, path: f.path })),
      metrics: { emitters: observers.length },
    });
  }

  const hooks = files.filter(
    (f) => f.content && /export\s+(?:const|function)\s+use[A-Z]/.test(f.content)
  );
  if (hooks.length) {
    patterns.push({
      name: "Custom Hooks",
      icon: "hook",
      desc: "React hooks for reusable stateful logic. Promotes code reuse and separation of concerns.",
      severity: "info",
      files: hooks.map((f) => ({ name: f.name, path: f.path })),
      metrics: { hooks: hooks.length },
    });
  }

  const hocs = files.filter(
    (f) =>
      f.content &&
      (/with[A-Z]\w*\s*=\s*\(/.test(f.content) || /export\s+default\s+connect/.test(f.content))
  );
  if (hocs.length) {
    patterns.push({
      name: "Higher-Order Component",
      icon: "spark",
      desc: "Functions that take a component and return an enhanced component.",
      severity: "info",
      files: hocs.map((f) => ({ name: f.name, path: f.path })),
      metrics: { hocs: hocs.length },
    });
  }

  const providers = files.filter(
    (f) =>
      f.content &&
      (f.content.includes("createContext") ||
        f.content.includes("Provider") ||
        f.content.includes("useContext"))
  );
  if (providers.length) {
    patterns.push({
      name: "Context Provider",
      icon: "globe",
      desc: "React Context for global state. Alternative to prop drilling.",
      severity: "info",
      files: providers.map((f) => ({ name: f.name, path: f.path })),
      metrics: { contexts: providers.length },
    });
  }

  // Python-specific patterns
  const pyDecorators = files.filter(
    (f) =>
      f.content &&
      f.name.endsWith(".py") &&
      /@(?:app\.route|router\.|blueprint\.|get|post|put|delete|patch)\s*\(/.test(f.content)
  );
  if (pyDecorators.length) {
    patterns.push({
      name: "Route Decorators",
      icon: "route",
      desc: "Flask/FastAPI/Django route decorators for URL routing. Common in Python web frameworks.",
      severity: "info",
      files: pyDecorators.map((f) => ({ name: f.name, path: f.path })),
      metrics: { routes: pyDecorators.length },
    });
  }

  const dataclasses = files.filter(
    (f) => f.content && f.name.endsWith(".py") && /@dataclass/.test(f.content)
  );
  if (dataclasses.length) {
    patterns.push({
      name: "Dataclasses",
      icon: "database",
      desc: "Python dataclasses for structured data. Reduces boilerplate for data-holding classes.",
      severity: "info",
      files: dataclasses.map((f) => ({ name: f.name, path: f.path })),
      metrics: { dataclasses: dataclasses.length },
    });
  }

  const abcFiles = files.filter(
    (f) =>
      f.content &&
      f.name.endsWith(".py") &&
      (/\bABC\b/.test(f.content) || /@abstractmethod/.test(f.content) || /ABCMeta/.test(f.content))
  );
  if (abcFiles.length) {
    patterns.push({
      name: "Abstract Base Classes",
      icon: "layers",
      desc: "Python ABCs enforce interface contracts. Ensures subclasses implement required methods.",
      severity: "info",
      files: abcFiles.map((f) => ({ name: f.name, path: f.path })),
      metrics: { abcs: abcFiles.length },
    });
  }

  const ctxManagers = files.filter(
    (f) =>
      f.content &&
      f.name.endsWith(".py") &&
      (/@contextmanager/.test(f.content) || /def\s+__enter__/.test(f.content))
  );
  if (ctxManagers.length) {
    patterns.push({
      name: "Context Managers",
      icon: "refresh",
      desc: "Python context managers for resource management (with statement). Ensures proper cleanup.",
      severity: "info",
      files: ctxManagers.map((f) => ({ name: f.name, path: f.path })),
      metrics: { managers: ctxManagers.length },
    });
  }

  const pyMiddleware = files.filter(
    (f) =>
      f.content &&
      f.name.endsWith(".py") &&
      (/class\s+\w*Middleware/.test(f.content) ||
        /def\s+middleware\s*\(/.test(f.content) ||
        f.name.toLowerCase().includes("middleware"))
  );
  if (pyMiddleware.length) {
    patterns.push({
      name: "Middleware",
      icon: "link",
      desc: "Request/response middleware for cross-cutting concerns (auth, logging, CORS).",
      severity: "info",
      files: pyMiddleware.map((f) => ({ name: f.name, path: f.path })),
      metrics: { middleware: pyMiddleware.length },
    });
  }

  // ---------- Anti-Patterns ----------

  const godFiles = files.filter(
    (f) => f.isCode !== false && f.functions && f.functions.length > 15
  );
  if (godFiles.length) {
    patterns.push({
      name: "God Object",
      icon: "warning",
      desc: "Files with too many responsibilities (15+ functions). Consider splitting into smaller modules.",
      severity: "warning",
      isAnti: true,
      files: godFiles.map((f) => ({ name: f.name, path: f.path, fns: f.functions.length })),
      metrics: {
        files: godFiles.length,
        avgFns: Math.round(godFiles.reduce((s, f) => s + f.functions.length, 0) / godFiles.length),
      },
    });
  }

  const longFiles = files.filter((f) => f.isCode !== false && f.lines && f.lines > 500);
  if (longFiles.length) {
    patterns.push({
      name: "Long File",
      icon: "scroll",
      desc: "Files over 500 lines are harder to maintain. Consider breaking into smaller modules.",
      severity: "warning",
      isAnti: true,
      files: longFiles.map((f) => ({ name: f.name, path: f.path, lines: f.lines })),
      metrics: {
        files: longFiles.length,
        avgLines: Math.round(longFiles.reduce((s, f) => s + f.lines, 0) / longFiles.length),
      },
    });
  }

  return patterns;
}
