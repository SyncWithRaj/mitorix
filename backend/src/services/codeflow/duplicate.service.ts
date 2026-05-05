/**
 * CodeFlow — Duplicate / Clone Detection Service
 *
 * Detects duplicate function names across files and similar code blocks
 * via structural fingerprinting and LCS-based similarity.
 * Ported from index.html Parser.detectDuplicates (lines 4378–4499),
 * Parser.codeSimilarity (lines 4503–4530), Parser.lcsLength (lines 4533–4557),
 * and Parser.codeFingerprint (lines 4560–4583).
 */

import type { AnalyzedFile, FunctionDef, Duplicate } from "./types.js";

// Common function names that are expected to be duplicated across files (idiomatic, not DRY violations)
const COMMON_NAMES = new Set([
  // React lifecycle and handlers
  "render", "componentDidMount", "componentWillUnmount", "componentDidUpdate",
  "shouldComponentUpdate", "getDerivedStateFromProps", "getSnapshotBeforeUpdate",
  "handleClick", "handleChange", "handleSubmit", "handleInput", "handleKeyDown",
  "handleKeyUp", "handleKeyPress", "handleBlur", "handleFocus", "handleScroll",
  "handleMouseEnter", "handleMouseLeave", "handleDrag", "handleDrop",
  "onClick", "onChange", "onSubmit", "onBlur", "onFocus", "onKeyDown",
  // Common utility names
  "init", "setup", "cleanup", "destroy", "reset", "clear", "update", "refresh",
  "validate", "parse", "format", "transform", "convert", "process", "execute",
  "get", "set", "fetch", "load", "save", "create", "delete", "remove", "add",
  "find", "filter", "map", "reduce", "sort", "merge", "clone", "copy",
  // Test patterns
  "beforeEach", "afterEach", "beforeAll", "afterAll", "describe", "it", "test",
  "setUp", "tearDown", "mock",
  // Common class methods
  "toString", "valueOf", "equals", "hashCode", "compare",
  "serialize", "deserialize", "toJSON", "fromJSON",
  // Express/API patterns
  "index", "show", "store", "update", "destroy", "edit",
  // Python common patterns
  "__init__", "__str__", "__repr__", "__len__", "__eq__", "__hash__", "__enter__", "__exit__",
  "__getattr__", "__setattr__", "__delattr__", "__getitem__", "__setitem__", "__contains__",
  "__iter__", "__next__", "__call__", "__bool__", "__lt__", "__gt__", "__le__", "__ge__",
  "upgrade", "downgrade", "setUpClass", "tearDownClass",
  "main", "create_app", "configure", "register", "on_startup", "on_shutdown", "lifespan",
  // Vue / Angular / Svelte lifecycle
  "mounted", "created", "updated", "destroyed", "beforeCreate", "beforeMount",
  "ngOnInit", "ngOnDestroy", "ngOnChanges", "ngAfterViewInit",
  "onMount", "onDestroy",
]);

/**
 * Normalize code by stripping comments, strings, and whitespace for comparison.
 */
function normalizeCode(code: string): string {
  return code
    .replace(/\/\/.*$/gm, "")
    .replace(/#.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/"""[\s\S]*?"""/g, "S")
    .replace(/'''[\s\S]*?'''/g, "S")
    .replace(/['"`][^'"`]*['"`]/g, "S")
    .replace(/\b\d+\.?\d*\b/g, "N")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * LCS length (optimized — truncates to 500 chars max).
 */
function lcsLength(s1: string, s2: string): number {
  const a = s1.length > 500 ? s1.substring(0, 500) : s1;
  const b = s2.length > 500 ? s2.substring(0, 500) : s2;

  const m = a.length;
  const n = b.length;
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
    curr.fill(0);
  }

  return prev[n];
}

/**
 * Calculate similarity between two code blocks (0–1 scale).
 */
function codeSimilarity(code1: string, code2: string): number {
  if (!code1 || !code2) return 0;

  const n1 = normalizeCode(code1);
  const n2 = normalizeCode(code2);

  if (n1 === n2) return 1;
  if (n1.length === 0 || n2.length === 0) return 0;

  const lcs = lcsLength(n1, n2);
  const maxLen = Math.max(n1.length, n2.length);
  return lcs / maxLen;
}

/**
 * Create a structural fingerprint for grouping similar code.
 */
function codeFingerprint(code: string): string | null {
  if (!code || code.length < 50) return null;

  const structure = code
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/['"`][^'"`]*['"`]/g, "")
    .replace(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g, "I")
    .replace(/\b\d+\.?\d*\b/g, "N")
    .replace(/\s+/g, "");

  const patterns = {
    loops: (structure.match(/for|while/g) || []).length,
    conditions: (structure.match(/if|\?/g) || []).length,
    calls: (structure.match(/I\(/g) || []).length,
    returns: (structure.match(/return/g) || []).length,
    len: Math.floor(structure.length / 50) * 50,
  };

  return `L${patterns.loops}C${patterns.conditions}F${patterns.calls}R${patterns.returns}S${patterns.len}`;
}

/**
 * Detect duplicate functions across all analyzed files.
 */
export function detectDuplicates(
  _files: AnalyzedFile[],
  allFns: FunctionDef[]
): Duplicate[] {
  const duplicates: Duplicate[] = [];

  // ---------- 1. Same-name functions across files ----------

  const fnByName: Record<string, FunctionDef[]> = Object.create(null);
  for (const fn of allFns) {
    if (typeof fn.name !== "string") continue;
    if (COMMON_NAMES.has(fn.name)) continue;
    if (fn.name.length < 3) continue;
    if (fn.isClassMethod) continue;
    if (fn.name.includes(".")) continue;
    if (fn.decorators && fn.decorators.length > 0) continue;

    if (!fnByName[fn.name]) fnByName[fn.name] = [];
    fnByName[fn.name].push(fn);
  }

  for (const [name, fns] of Object.entries(fnByName)) {
    const uniqueFiles = [...new Set(fns.map((f) => f.file))];
    if (uniqueFiles.length >= 3) {
      const codeSamples = fns.filter((f) => f.code && f.code.length > 30);
      if (codeSamples.length >= 2) {
        const sim = codeSimilarity(codeSamples[0].code, codeSamples[1].code);
        if (sim > 0.5) {
          duplicates.push({
            type: "name",
            name,
            count: uniqueFiles.length,
            files: fns.map((f) => ({ file: f.file, line: f.line })),
            similarity: Math.round(sim * 100),
            suggestion: `Function "${name}" appears in ${uniqueFiles.length} files with ${Math.round(sim * 100)}% similarity - consider consolidating`,
          });
        }
      }
    }
  }

  // ---------- 2. Similar code blocks via fingerprinting ----------

  const codeGroups: Record<string, FunctionDef[]> = Object.create(null);
  for (const fn of allFns) {
    if (!fn.code || fn.code.length < 80) continue;

    const fingerprint = codeFingerprint(fn.code);
    if (!fingerprint) continue;

    if (!codeGroups[fingerprint]) codeGroups[fingerprint] = [];
    codeGroups[fingerprint].push(fn);
  }

  for (const fns of Object.values(codeGroups)) {
    if (fns.length > 1) {
      const uniqueFiles = [...new Set(fns.map((f) => f.file))];
      if (uniqueFiles.length > 1) {
        const sim = codeSimilarity(fns[0].code, fns[1].code);
        if (sim > 0.7) {
          duplicates.push({
            type: "code",
            name: fns.map((f) => f.name).join(", "),
            count: fns.length,
            files: fns.map((f) => ({ file: f.file, name: f.name, line: f.line })),
            similarity: Math.round(sim * 100),
            suggestion: `Similar code blocks (${Math.round(sim * 100)}% match) - consider extracting to a shared utility`,
          });
        }
      }
    }
  }

  return duplicates;
}
