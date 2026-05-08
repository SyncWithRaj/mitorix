/**
 * CodeFlow — Layer Detection & Violation Service
 *
 * Detects architectural layer of each file and identifies violations
 * where lower layers depend on higher layers.
 * Ported from index.html Parser.detectLayer (lines 4303–4331)
 * and Parser.detectLayerViolations (lines 4584–4609).
 */

import type { AnalyzedFile, Connection, LayerViolation } from "./types.js";

/**
 * Layer hierarchy (lower number = higher in stack):
 * presentation/ui/component (0) → feature (1) → service (2) → data/model (3) → util (4) → config (5) → test (6)
 */
const LAYER_ORDER: Record<string, number> = {
  presentation: 0,
  ui: 0,
  component: 0,
  components: 0,
  page: 0,
  view: 0,
  feature: 1,
  service: 2,
  services: 2,
  api: 2,
  data: 3,
  model: 3,
  util: 4,
  utils: 4,
  helper: 4,
  lib: 4,
  core: 4,
  config: 5,
  test: 6,
  modules: 5,
  forms: 0,
  classes: 3,
};

/**
 * Detect the architectural layer of a file based on its path.
 */
export function detectLayer(filePath: string): string {
  const l = filePath.toLowerCase();

  // Test files
  if (
    l.includes("/test") ||
    l.match(/test_\w+\.py$/) ||
    l.match(/\w+_test\.py$/) ||
    l.includes("conftest")
  )
    return "test";

  // UI/View layer
  if (
    l.includes("/ui/") ||
    l.includes("/views/") ||
    l.includes("/pages/") ||
    l.includes("/templates/") ||
    l.includes("/static/")
  )
    return "ui";

  if (l.includes("/component")) return "components";

  // Service/API layer
  if (
    l.includes("/service") ||
    l.includes("/api/") ||
    l.includes("/controller") ||
    l.includes("/endpoint") ||
    l.includes("/router")
  )
    return "services";

  // Python middleware/handler layer
  if (l.includes("/middleware") || l.includes("/handler") || l.includes("/signal"))
    return "services";

  // Utility/Helper layer
  if (l.includes("/util") || l.includes("/helper") || l.includes("/lib/") || l.includes("/common/"))
    return "utils";

  // Data/Model layer
  if (
    l.includes("/data") ||
    l.includes("/model") ||
    l.includes("/store") ||
    l.includes("/schema") ||
    l.includes("/serializer")
  )
    return "data";

  // Python-specific data layers
  if (l.includes("/migration")) return "data";
  if (l.includes("/fixtures/")) return "data";

  // Task/Worker layer
  if (l.includes("/task") || l.includes("/worker") || l.includes("/celery") || l.includes("/job"))
    return "services";

  // Config layer
  if (l.includes("/config") || l.includes("/settings") || l.match(/settings\.py$/)) return "config";

  // VBA-specific
  if (l.includes("/modules/") || l.includes("/bas/")) return "modules";
  if (l.includes("/forms/") || l.includes("/userforms/")) return "ui";
  if (l.includes("/classes/")) return "data";
  if (l.includes("/standard/")) return "utils";

  return "utils";
}

/**
 * Detect layer violations: lower layers should not import from higher layers.
 * For example, a model importing from a controller is a violation.
 */
export function detectLayerViolations(
  files: AnalyzedFile[],
  connections: Connection[]
): LayerViolation[] {
  const violations: LayerViolation[] = [];
  const fileByPath: Record<string, AnalyzedFile> = {};

  for (const f of files) {
    fileByPath[f.path] = f;
  }

  for (const c of connections) {
    const srcFile = fileByPath[c.source];
    const tgtFile = fileByPath[c.target];
    if (!srcFile || !tgtFile) continue;

    const srcLayer = (srcFile.layer || "").toLowerCase();
    const tgtLayer = (tgtFile.layer || "").toLowerCase();
    const srcLevel = LAYER_ORDER[srcLayer];
    const tgtLevel = LAYER_ORDER[tgtLayer];

    // Violation: lower layer importing from higher layer (skip if levels only differ by 1)
    if (
      srcLevel !== undefined &&
      tgtLevel !== undefined &&
      srcLevel > tgtLevel &&
      srcLevel - tgtLevel > 1
    ) {
      violations.push({
        from: srcFile.path,
        fromLayer: srcFile.layer,
        to: tgtFile.path,
        toLayer: tgtFile.layer,
        fn: c.fn,
        suggestion: `${srcFile.layer} should not import from ${tgtFile.layer}. Consider inverting the dependency or using dependency injection.`,
      });
    }
  }

  return violations;
}
