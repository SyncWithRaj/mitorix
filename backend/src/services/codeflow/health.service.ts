/**
 * CodeFlow — Health Score Service
 *
 * Calculates a 0–100 health score for a repository, deducting points
 * for dead code, circular dependencies, god files, coupling, and security.
 * Ported from index.html calcHealth (lines 6670–6688).
 */

import type { AnalysisData, HealthScore } from "./types.js";

/**
 * Calculate health score based on analysis data.
 *
 * Starts at 100 and deducts:
 * - Dead code percentage (max -20)
 * - Circular dependencies (max -20, -5 each)
 * - God files >15 functions (max -15, -3 each)
 * - High coupling ratio (max -15)
 * - Security issues HIGH severity (max -20, -5 each)
 *
 * Grading: A (≥90), B (≥80), C (≥70), D (≥60), F (<60)
 */
export function calcHealth(data: {
  stats: {
    functions: number;
    dead: number;
    files: number;
    connections: number;
    security: number;
  };
  issues: Array<{ title: string }>;
  securityIssues?: Array<{ severity: string }>;
}): HealthScore {
  if (!data) return { score: 0, grade: "F" };

  let score = 100;

  // Dead code penalty
  const deadPct =
    data.stats.functions > 0
      ? (data.stats.dead / data.stats.functions) * 100
      : 0;
  score -= Math.min(20, deadPct);

  // Circular dependency penalty
  const circular = data.issues.filter((i) => i.title.includes("Circular")).length;
  score -= Math.min(20, circular * 5);

  // God file penalty
  const god = data.issues.filter((i) => i.title.includes("Large")).length;
  score -= Math.min(15, god * 3);

  // Coupling penalty
  const avgCoup =
    data.stats.files > 0 ? data.stats.connections / data.stats.files : 0;
  score -= Math.min(15, Math.max(0, avgCoup - 3) * 2);

  // Security penalty
  const sec = data.securityIssues
    ? data.securityIssues.filter((i) => i.severity === "high").length
    : 0;
  score -= Math.min(20, sec * 5);

  score = Math.max(0, Math.round(score));

  let grade: HealthScore["grade"] = "F";
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";

  return { score, grade };
}
