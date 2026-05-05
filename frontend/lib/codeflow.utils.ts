import { AnalyzedFile, BlastRadius, Connection } from "./codeflow.types";

/**
 * Calculate the blast radius for a given file.
 * Ported from index.html calcBlast() — lines 6585-6668.
 * 
 * Connection format: {source: fileDefiningFn, target: fileCallingFn, fn: fnName, count: callCount}
 */
export function calcBlast(
  fileId: string,
  conns: Connection[],
  files: AnalyzedFile[]
): BlastRadius {
  // Build adjacency lists for fast lookups
  const exportedTo: Record<string, Set<string>> = {};   // fileId -> Set of files that import from it
  const importedFrom: Record<string, Set<string>> = {}; // fileId -> Set of files it imports from
  const exportedFns: Record<string, Map<string, number>> = {}; // fileId -> Map of fn -> count of external calls

  conns.forEach(c => {
    const src = typeof c.source === "object" ? (c.source as any).id : c.source;
    const tgt = typeof c.target === "object" ? (c.target as any).id : c.target;
    // src exports, tgt imports
    if (!exportedTo[src]) exportedTo[src] = new Set();
    exportedTo[src].add(tgt);
    if (!importedFrom[tgt]) importedFrom[tgt] = new Set();
    importedFrom[tgt].add(src);
    if (!exportedFns[src]) exportedFns[src] = new Map();
    const fnMap = exportedFns[src];
    fnMap.set(c.fn, (fnMap.get(c.fn) || 0) + (c.count || 1));
  });

  // 1. Direct dependents (files that directly import from this file)
  const directDeps = exportedTo[fileId] ? Array.from(exportedTo[fileId]) : [];

  // 2. Transitive dependents (BFS with depth tracking)
  const transitive = new Map<string, number>(); // fileId -> depth
  const queue = directDeps.map(f => ({ file: f, depth: 1 }));
  const visited = new Set([fileId, ...directDeps]);
  while (queue.length > 0) {
    const item = queue.shift()!;
    if (item.depth > 3) continue; // Limit depth to 3 for transitive
    transitive.set(item.file, item.depth);
    const nextDeps = exportedTo[item.file] || new Set();
    nextDeps.forEach(f => {
      if (!visited.has(f)) {
        visited.add(f);
        queue.push({ file: f, depth: item.depth + 1 });
      }
    });
  }

  // 3. Functions exported (how many of this file's functions are used)
  const fnUsage = exportedFns[fileId] || new Map();
  const fnsUsed = fnUsage.size;
  let totalCalls = 0;
  fnUsage.forEach(cnt => { totalCalls += cnt; });

  // 4. Dependencies (files this file imports from - its risk)
  const dependencies = importedFrom[fileId] ? Array.from(importedFrom[fileId]) : [];

  // 5. Calculate weighted impact score
  let impactScore = directDeps.length;
  transitive.forEach((depth) => {
    if (depth > 1) impactScore += 1 / depth;
  });

  // 6. Calculate centrality
  const centrality = directDeps.length + dependencies.length + fnsUsed;

  // Determine level based on direct dependents and functions used
  let level: BlastRadius["level"] = "low";
  const connectedFiles = files.filter(f => exportedTo[f.path] || importedFrom[f.path]).length;
  const relativePct = connectedFiles > 0 ? Math.round(directDeps.length / connectedFiles * 100) : 0;

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
    depth: transitive.size > 0 ? Math.max(...Array.from(transitive.values())) : 0,
    fnsUsed,
    totalCalls,
    dependencies,
    impactScore: Math.round(impactScore * 10) / 10,
    centrality,
  };
}
