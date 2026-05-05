/**
 * CodeFlow — Dependency Graph Service
 *
 * Builds file-level connections from existing CodeRelationship data,
 * tracks per-function stats (internal/external calls, callers),
 * and identifies dead functions.
 * Ported from index.html buildAnalysisData dependency stages (lines 6316–6401).
 */

import type {
  AnalyzedFile,
  FunctionDef,
  Connection,
  FnStat,
  DeadFunction,
  ArchIssue,
  ArchIssueItem,
  BlastRadius,
} from "./types.js";

// ---------------------------------------------------------------------------
// Build connections and function stats
// ---------------------------------------------------------------------------

export interface DependencyResult {
  connections: Connection[];
  fnStats: Record<string, FnStat>;
  deadFunctions: DeadFunction[];
  issues: ArchIssue[];
}

/**
 * Build file-level dependency graph from function definitions
 * and relationship data already stored in MongoDB.
 *
 * @param files Analyzed files with their function lists
 * @param allFns All function definitions across the repo
 * @param rawRelationships Raw relationships from CodeRelationship collection
 */
export function buildDependencyGraph(
  files: AnalyzedFile[],
  allFns: FunctionDef[],
  rawRelationships: Array<{
    fromName: string;
    fromFilePath: string;
    toName: string;
    toFilePath?: string | null;
    relationType: string;
    line: number;
  }>
): DependencyResult {
  const connections: Connection[] = [];
  const fnStats: Record<string, FnStat> = Object.create(null);
  const issues: ArchIssue[] = [];

  // Initialize fnStats for every known function
  for (const fn of allFns) {
    if (!fnStats[fn.name]) {
      fnStats[fn.name] = {
        internal: 0,
        external: 0,
        callers: [],
        count: 0,
        file: fn.file,
        folder: fn.folder,
        line: fn.line,
        code: fn.code,
        isTopLevel: fn.isTopLevel !== false,
        isExported: fn.isExported || false,
        isClassMethod: fn.isClassMethod || false,
        type: fn.type || "function",
        decorators: fn.decorators || null,
        className: fn.className || null,
      };
    }
  }

  // Build a lookup of function names → defining file
  const fnToFile: Record<string, string> = {};
  for (const fn of allFns) {
    if (!fnToFile[fn.name]) {
      fnToFile[fn.name] = fn.file;
    }
  }

  // Build a lookup of module/file names -> defining file
  const moduleToFile: Record<string, string> = {};
  for (const f of files) {
    const relPath = f.path.replace(/\\/g, "/");
    const parts = relPath.split("/");
    const fileName = parts[parts.length - 1];
    const fileNameNoExt = fileName.split(".")[0];
    
    // Index by filename
    moduleToFile[fileName] = f.path;
    moduleToFile[fileNameNoExt] = f.path;
    
    // Index by relative module path (e.g. services/rag or services.rag)
    const repoMarker = "/tmp/repolens-repos/";
    if (f.path.includes(repoMarker)) {
      const subPath = f.path.split(repoMarker)[1];
      const repoPathParts = subPath.split("/");
      if (repoPathParts.length > 2) {
        // repoPathParts[0] is user id, [1] is repo id, [2+] is the actual project path
        const projectParts = repoPathParts.slice(2);
        for (let j = 0; j < projectParts.length; j++) {
          const suffixParts = projectParts.slice(j);
          const suffix = suffixParts.join("/");
          const suffixNoExt = suffix.includes(".") ? suffix.split(".").slice(0, -1).join(".") : suffix;
          
          if (!moduleToFile[suffix]) moduleToFile[suffix] = f.path;
          if (!moduleToFile[suffixNoExt]) moduleToFile[suffixNoExt] = f.path;
          const dotted = suffixNoExt.replace(/\//g, ".");
          if (!moduleToFile[dotted]) moduleToFile[dotted] = f.path;
        }
      }
    }
  }

  // Build connections from relationships
  const callerMaps: Record<string, Map<string, { file: string; name: string; count: number }>> =
    Object.create(null);

  for (const rel of rawRelationships) {
    if (rel.relationType !== "calls" && rel.relationType !== "imports" && rel.relationType !== "accesses") continue;
    const targetFnName = rel.toName;
    const sourceFile = rel.fromFilePath.replace(/\\/g, "/");
    let defFile = rel.toFilePath ? rel.toFilePath.replace(/\\/g, "/") : null;

    // Resolve missing toFilePath if possible
    if (!defFile) {
      if (fnToFile[targetFnName]) {
        defFile = fnToFile[targetFnName].replace(/\\/g, "/");
      } else if (moduleToFile[targetFnName]) {
        defFile = moduleToFile[targetFnName].replace(/\\/g, "/");
      }
    }

    if (!sourceFile || !defFile) continue;

    if (sourceFile === defFile) {
      // Internal call
      if (fnStats[targetFnName]) {
        fnStats[targetFnName].internal += 1;
      }
    } else {
      // External call → creates a connection
      connections.push({
        source: defFile,
        target: sourceFile,
        fn: targetFnName,
        count: 1,
      });

      if (fnStats[targetFnName]) {
        fnStats[targetFnName].external += 1;

        if (!callerMaps[targetFnName]) {
          callerMaps[targetFnName] = new Map();
        }
        const existing = callerMaps[targetFnName].get(sourceFile);
        if (existing) {
          existing.count += 1;
        } else {
          const sourceFileName = sourceFile.split("/").pop() || sourceFile;
          callerMaps[targetFnName].set(sourceFile, {
            file: sourceFile,
            name: sourceFileName,
            count: 1,
          });
        }
      }
    }
  }

  // Finalize fnStats callers
  for (const [fnName, callerMap] of Object.entries(callerMaps)) {
    if (fnStats[fnName]) {
      fnStats[fnName].callers = Array.from(callerMap.values());
    }
  }

  // Set count = internal + external
  for (const s of Object.values(fnStats)) {
    s.count = s.internal + s.external;
  }

  // ---------- Dead Function Detection ----------
  const deadFns = Object.entries(fnStats).filter(([name, stats]) => {
    if (stats.internal > 0 || stats.external > 0) return false;
    if (stats.isClassMethod) return false;
    if (!stats.isTopLevel) return false;
    if (stats.decorators && stats.decorators.length > 0) return false;
    if (["class", "dataclass", "abstract_class"].includes(stats.type)) return false;

    const baseName = name.includes(".") ? name.split(".").pop()! : name;
    if (baseName.startsWith("__") && baseName.endsWith("__")) return false;
    if (
      baseName.startsWith("test_") ||
      baseName === "setUp" ||
      baseName === "tearDown" ||
      baseName === "setUpClass" ||
      baseName === "tearDownClass"
    )
      return false;
    if (
      stats.file &&
      (stats.file.includes("test_") ||
        stats.file.includes("_test.") ||
        stats.file.includes("/tests/"))
    )
      return false;
    if (
      (baseName === "upgrade" || baseName === "downgrade") &&
      stats.file &&
      (stats.file.includes("migration") ||
        stats.file.includes("alembic") ||
        stats.file.includes("versions"))
    )
      return false;
    if (
      [
        "main",
        "create_app",
        "make_app",
        "get_app",
        "setup",
        "configure",
        "register",
        "on_startup",
        "on_shutdown",
        "lifespan",
      ].includes(baseName)
    )
      return false;
    if (stats.isExported && stats.file && /\.[jt]sx?$/.test(stats.file)) return false;
    if (
      stats.file &&
      (/\.(?:spec|test)\.[jt]sx?$/.test(stats.file) || stats.file.includes("__tests__"))
    )
      return false;
    return true;
  });

  const deadFunctions: DeadFunction[] = deadFns.map(([name, stats]) => {
    const codeLines = stats.code ? stats.code.split("\n").length : 0;
    return {
      name,
      file: stats.file,
      folder: stats.folder,
      line: stats.line,
      code: stats.code,
      codeLines,
      ext: stats.file.split(".").pop() || "",
    };
  });

  // ---------- Architecture Issues ----------
  if (deadFns.length) {
    issues.push({
      type: "warning",
      title: `${deadFns.length} Unused Functions`,
      desc: "Functions not called from other files",
      items: deadFns.map(([name, stats]) => ({
        name,
        file: stats.file,
        line: stats.line,
        code: stats.code,
      })),
    });
  }

  const godFiles = files.filter((f) => f.functions.length > 15);
  if (godFiles.length) {
    issues.push({
      type: "critical",
      title: `${godFiles.length} Large Files`,
      desc: "Files with 15+ functions",
      items: godFiles.map((f) => ({
        name: `${f.name} (${f.functions.length} fns)`,
        file: f.path,
        fns: f.functions.length,
        lines: f.lines,
      })),
    });
  }

  // High coupling detection
  const coupling: Record<string, number> = Object.create(null);
  for (const c of connections) {
    coupling[c.target] = (coupling[c.target] || 0) + 1;
  }
  const highCoup = Object.entries(coupling)
    .filter(([, count]) => count > 8)
    .sort((a, b) => b[1] - a[1]);

  if (highCoup.length) {
    issues.push({
      type: "warning",
      title: `${highCoup.length} Highly Coupled`,
      desc: "Files imported by 8+ others",
      items: highCoup.map(([file, count]) => ({
        name: `${file.split("/").pop()} (${count} imports)`,
        file,
        imports: count,
      })),
    });
  }

  // Circular dependency detection
  const connSet = new Set(connections.map((c) => `${c.source}|${c.target}`));
  const circularKeys: string[] = [];
  for (const c of connections) {
    if (connSet.has(`${c.target}|${c.source}`)) {
      const key = [c.source, c.target].sort().join("|");
      if (!circularKeys.includes(key)) circularKeys.push(key);
    }
  }
  if (circularKeys.length) {
    issues.push({
      type: "critical",
      title: `${circularKeys.length} Circular Dependencies`,
      desc: "Files that import each other",
      items: circularKeys.map((p) => {
        const parts = p.split("|");
        return {
          name: parts.map((x) => x.split("/").pop()).join(" ↔ "),
          files: parts.map((x) => ({ file: x })),
        };
      }),
    });
  }

  return { connections, fnStats, deadFunctions, issues };
}

// ---------------------------------------------------------------------------
// Blast Radius Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the blast radius for a given file: how many files would be
 * affected if this file changes.
 * Ported from index.html calcBlast (lines 6584–6668).
 */
export function calcBlast(
  fileId: string,
  connections: Connection[],
  files: AnalyzedFile[]
): BlastRadius {
  // Build adjacency lists
  const exportedTo: Record<string, Set<string>> = {};
  const importedFrom: Record<string, Set<string>> = {};
  const exportedFns: Record<string, Map<string, number>> = {};

  for (const c of connections) {
    const src = c.source;
    const tgt = c.target;

    if (!exportedTo[src]) exportedTo[src] = new Set();
    exportedTo[src].add(tgt);

    if (!importedFrom[tgt]) importedFrom[tgt] = new Set();
    importedFrom[tgt].add(src);

    if (!exportedFns[src]) exportedFns[src] = new Map();
    const fnMap = exportedFns[src];
    fnMap.set(c.fn, (fnMap.get(c.fn) || 0) + (c.count || 1));
  }

  // 1. Direct dependents
  const directDeps = exportedTo[fileId] ? Array.from(exportedTo[fileId]) : [];

  // 2. Transitive dependents (BFS, depth ≤ 3)
  const transitive = new Map<string, number>();
  const queue = directDeps.map((f) => ({ file: f, depth: 1 }));
  const visited = new Set([fileId, ...directDeps]);

  while (queue.length > 0) {
    const item = queue.shift()!;
    if (item.depth > 3) continue;
    transitive.set(item.file, item.depth);

    const nextDeps = exportedTo[item.file] || new Set<string>();
    for (const f of nextDeps) {
      if (!visited.has(f)) {
        visited.add(f);
        queue.push({ file: f, depth: item.depth + 1 });
      }
    }
  }

  // 3. Functions exported
  const fnUsage = exportedFns[fileId] || new Map<string, number>();
  const fnsUsed = fnUsage.size;
  let totalCalls = 0;
  for (const cnt of fnUsage.values()) totalCalls += cnt;

  // 4. Dependencies (files this file imports from)
  const dependencies = importedFrom[fileId] ? Array.from(importedFrom[fileId]) : [];

  // 5. Impact score
  let impactScore = directDeps.length;
  for (const [, depth] of transitive) {
    if (depth > 1) impactScore += 1 / depth;
  }

  // 6. Centrality
  const centrality = directDeps.length + dependencies.length + fnsUsed;

  // Level
  let level: BlastRadius["level"] = "low";
  const connectedFiles = files.filter(
    (f) => exportedTo[f.path] || importedFrom[f.path]
  ).length;
  const relativePct =
    connectedFiles > 0 ? Math.round((directDeps.length / connectedFiles) * 100) : 0;

  if (directDeps.length >= 8 || fnsUsed >= 5) level = "critical";
  else if (directDeps.length >= 4 || fnsUsed >= 3) level = "high";
  else if (directDeps.length >= 2 || fnsUsed >= 1) level = "medium";

  return {
    affected: directDeps,
    transitive: Array.from(transitive.keys()),
    count: directDeps.length,
    transitiveCount: transitive.size,
    percent: relativePct,
    level,
    depth: transitive.size > 0 ? Math.max(...transitive.values()) : 0,
    fnsUsed,
    totalCalls,
    dependencies,
    impactScore: Math.round(impactScore * 10) / 10,
    centrality,
  };
}
