/**
 * CodeFlow — Cyclomatic Complexity Service
 *
 * Calculates approximate cyclomatic complexity per file.
 * Ported from index.html Parser.calcComplexity (lines 4611–4632).
 */

import type { ComplexityResult } from "./types.js";

/**
 * Calculate cyclomatic complexity for a piece of source code.
 *
 * Counts branching keywords and logical operators:
 * if, else if, while, for, case, catch, ternary, &&, ||
 * Plus Python-specific: elif, except, with, and, or, comprehensions.
 */
export function calcComplexity(content: string, filename?: string): ComplexityResult {
  if (!content) return { score: 0, level: "low" };

  let complexity = 1; // Base complexity

  // JS/C-style patterns
  const jsPatterns: RegExp[] = [
    /\bif\s*\(/g,
    /\belse\s+if\s*\(/g,
    /\bwhile\s*\(/g,
    /\bfor\s*\(/g,
    /\bcase\s+/g,
    /\bcatch\s*\(/g,
    /\?\s*[^:]+\s*:/g,
    /&&/g,
    /\|\|/g,
  ];

  // Python-specific patterns
  const pyPatterns: RegExp[] = [
    /\bif\s+[^(]/g,
    /\belif\s+/g,
    /\bwhile\s+[^(]/g,
    /\bfor\s+\w+\s+in\s+/g,
    /\bexcept\s*/g,
    /\bwith\s+/g,
    /\band\b/g,
    /\bor\b/g,
    /\bif\s+.+\s+else\s+/g,
    /\bfor\s+.+\s+in\s+[^\n]*\]/g,
  ];

  const allPatterns = jsPatterns.concat(pyPatterns);

  for (const p of allPatterns) {
    const m = content.match(p);
    if (m) complexity += m.length;
  }

  let level: ComplexityResult["level"] = "low";
  if (complexity > 30) level = "critical";
  else if (complexity > 20) level = "high";
  else if (complexity > 10) level = "medium";

  return { score: complexity, level };
}
