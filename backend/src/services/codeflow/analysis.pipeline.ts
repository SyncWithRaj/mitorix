/**
 * CodeFlow — Analysis Pipeline Orchestrator
 *
 * Five-stage pipeline that runs all CodeFlow services in sequence
 * and produces the complete AnalysisData object.
 * Ported from index.html buildAnalysisData (lines 6299–6487).
 */

import { FileContent } from "../../models/fileContent.model.js";
import { FileMetadata } from "../../models/fileMetadata.model.js";
import { CodeEntity } from "../../models/codeEntity.model.js";
import { CodeRelationship } from "../../models/relationship.model.js";
import { Repository } from "../../models/repo.model.js";
import path from "path";

import type {
  AnalysisData,
  AnalyzedFile,
  FunctionDef,
  FolderTree,
  ArchIssue,
  LanguageStat,
} from "./types.js";

import { calcComplexity } from "./complexity.service.js";
import { detectLayer } from "./layer.service.js";
import { detectLayerViolations } from "./layer.service.js";
import { detectPatterns } from "./pattern.service.js";
import { detectSecurity } from "./security.service.js";
import { detectDuplicates } from "./duplicate.service.js";
import { buildDependencyGraph } from "./dependency.service.js";
import { calcHealth } from "./health.service.js";
import { generateSuggestions } from "./suggestions.service.js";

// ---------------------------------------------------------------------------
// Folder Tree Builder
// ---------------------------------------------------------------------------

function buildTree(files: AnalyzedFile[]): FolderTree {
  const root: FolderTree = { name: "root", path: "", children: {}, files: [] };

  for (const f of files) {
    const parts = f.folder && f.folder !== "root" ? f.folder.split("/") : [];
    let cur = root;

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const folderPath = parts.slice(0, i + 1).join("/");
      if (!cur.children[p]) {
        cur.children[p] = { name: p, path: folderPath, children: {}, files: [] };
      }
      cur = cur.children[p];
    }

    cur.files.push(f);
  }

  return root;
}

// ---------------------------------------------------------------------------
// Code Extension Helpers
// ---------------------------------------------------------------------------

const CODE_EXTS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".py", ".pyw", ".pyi",
  ".java", ".go", ".rb", ".php", ".rs",
  ".c", ".cpp", ".cc", ".h", ".hpp", ".cs",
  ".swift", ".kt", ".kts", ".scala",
  ".ex", ".exs", ".lua", ".sh", ".bash",
]);

function isCodeFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return CODE_EXTS.has(ext);
}

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

/**
 * Run the full CodeFlow analysis pipeline for a repository.
 *
 * Stage 1: Load data from MongoDB (entities, relationships, file metadata, file content)
 * Stage 2: Build dependency graph, connections, function stats, dead functions
 * Stage 3: Detect patterns + security issues
 * Stage 4: Calculate complexity, find duplicates, check layer violations
 * Stage 5: Aggregate stats, compute health score, generate suggestions
 */
export async function runAnalysisPipeline(repoId: string): Promise<AnalysisData> {
  // =========================================================================
  // STAGE 1: Load Data from MongoDB
  // =========================================================================

  const repo = await Repository.findById(repoId).lean();
  if (!repo) throw new Error(`Repository ${repoId} not found`);

  const basePath = (repo as any).localPath || "";

  const [dbFiles, dbEntities, dbRelationships, dbContents] = await Promise.all([
    FileMetadata.find({ repoId }).lean(),
    CodeEntity.find({ repoId }).lean(),
    CodeRelationship.find({ repoId }).lean(),
    FileContent.find({ repoId, isDirectory: false, content: { $ne: null } }).lean(),
  ]);

  // Build a content lookup
  const contentByPath: Record<string, string> = {};
  for (const fc of dbContents) {
    const fullPath = (fc as any).relativePath
      ? path.join(basePath, (fc as any).relativePath)
      : (fc as any).relativePath;
    if ((fc as any).content) {
      contentByPath[fullPath] = (fc as any).content;
      // Also index by relative path
      if ((fc as any).relativePath) {
        contentByPath[(fc as any).relativePath] = (fc as any).content;
      }
    }
  }

  // Build analyzed files array
  const analyzedFiles: AnalyzedFile[] = [];
  const allFns: FunctionDef[] = [];

  for (const fileMeta of dbFiles) {
    const fp = (fileMeta as any).filePath as string;
    const fileName = (fileMeta as any).fileName as string;
    const relativePath = basePath ? path.relative(basePath, fp) : fp;
    const folder = path.dirname(relativePath).replace(/\\/g, "/");
    const content = contentByPath[fp] || contentByPath[relativePath] || null;
    const totalLines = (fileMeta as any).totalLines || (content ? content.split("\n").length : 0);
    const isCode = isCodeFile(fileName);
    const layer = detectLayer(relativePath);

    // Collect functions from entities for this file
    const fileEntities = dbEntities.filter(
      (e: any) => e.filePath === fp && ["function", "method", "arrow", "class", "constructor", "staticMethod"].includes(e.type)
    );

    const fileFns: FunctionDef[] = fileEntities.map((e: any) => ({
      name: e.name,
      file: fp,
      folder,
      line: e.startLine || 1,
      code: (e.content || "").substring(0, 500),
      isTopLevel: (e.scopeDepth || 0) <= 1,
      isExported: content ? content.includes(`export`) && content.includes(e.name) : false,
      isClassMethod: e.type === "method" || e.type === "staticMethod",
      type: e.type,
      decorators: null,
      className: e.parentName || null,
    }));

    const analyzedFile: AnalyzedFile = {
      path: fp,
      name: fileName,
      folder,
      content,
      lines: totalLines,
      layer,
      functions: fileFns,
      complexity: { score: 0, level: "low" },
      isCode,
    };

    analyzedFiles.push(analyzedFile);
    allFns.push(...fileFns);
  }

  // =========================================================================
  // STAGE 2: Build Dependency Graph
  // =========================================================================

  const rawRels = dbRelationships.map((r: any) => ({
    fromName: r.fromName,
    fromFilePath: r.fromFilePath,
    toName: r.toName,
    toFilePath: r.toFilePath || null,
    relationType: r.relationType,
    line: r.line || 0,
  }));

  const depResult = buildDependencyGraph(analyzedFiles, allFns, rawRels);
  const { connections, fnStats, deadFunctions, issues } = depResult;

  // =========================================================================
  // STAGE 3: Detect Patterns + Security
  // =========================================================================

  const patterns = detectPatterns(analyzedFiles);
  const securityIssues = detectSecurity(analyzedFiles);

  // =========================================================================
  // STAGE 4: Code Quality — Complexity, Duplicates, Layer Violations
  // =========================================================================

  // Calculate complexity per file
  for (const file of analyzedFiles) {
    if (file.isCode && file.content) {
      file.complexity = calcComplexity(file.content, file.path);
    }
  }

  const duplicates = detectDuplicates(analyzedFiles, allFns);
  const layerViolations = detectLayerViolations(analyzedFiles, connections);

  // Add complexity issues
  const highComplexity = analyzedFiles
    .filter((f) => f.complexity && f.complexity.level === "critical")
    .sort((a, b) => b.complexity.score - a.complexity.score);

  if (highComplexity.length) {
    issues.push({
      type: "warning",
      title: `${highComplexity.length} High Complexity Files`,
      desc: "Files with complexity score >30",
      items: highComplexity.map((f) => ({
        name: `${f.name} (${f.complexity.score})`,
        file: f.path,
        score: f.complexity.score,
        lines: f.lines,
      })),
    });
  }

  // Add duplicate issues
  if (duplicates.length > 0) {
    const nameDups = duplicates.filter((d) => d.type === "name");
    const codeDups = duplicates.filter((d) => d.type === "code");

    if (nameDups.length) {
      issues.push({
        type: "warning",
        title: `${nameDups.length} Duplicate Function Names`,
        desc: "Same function name in multiple files",
        items: nameDups.map((d) => ({
          name: `${d.name} (${d.count} files)`,
          suggestion: d.suggestion,
          files: d.files,
          count: d.count,
        })),
      });
    }
    if (codeDups.length) {
      issues.push({
        type: "warning",
        title: `${codeDups.length} Similar Code Blocks`,
        desc: "Copy-paste code detected",
        items: codeDups.map((d) => ({
          name: d.name,
          suggestion: d.suggestion,
          files: d.files,
        })),
      });
    }
  }

  if (layerViolations.length > 0) {
    issues.push({
      type: "critical",
      title: `${layerViolations.length} Architecture Violations`,
      desc: "Lower layers importing from higher layers",
      items: layerViolations.map((v) => ({
        name: `${v.fromLayer} → ${v.toLayer}`,
        file: v.from,
        toFile: v.to,
        fn: v.fn,
        suggestion: v.suggestion,
      })),
    });
  }

  // =========================================================================
  // STAGE 5: Finalization — Stats, Health, Suggestions, Tree
  // =========================================================================

  // Clear content to reduce response size
  for (const f of analyzedFiles) {
    f.content = null;
  }

  const folders = [...new Set(analyzedFiles.map((f) => f.folder))].sort();
  const tree = buildTree(analyzedFiles);
  const totalLoc = analyzedFiles.reduce((s, f) => s + f.lines, 0);

  // Language stats
  const langStats: Record<string, number> = Object.create(null);
  for (const f of analyzedFiles) {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    langStats[ext] = (langStats[ext] || 0) + f.lines;
  }
  const languages: LanguageStat[] = Object.entries(langStats)
    .sort((a, b) => b[1] - a[1])
    .map(([ext, lines]) => ({
      ext,
      lines,
      pct: totalLoc ? Math.round((lines / totalLoc) * 100) : 0,
    }));

  // Stats object
  const stats = {
    files: analyzedFiles.length,
    functions: allFns.length,
    connections: connections.length,
    dead: deadFunctions.length,
    patterns: patterns.length,
    security: securityIssues.filter((i) => i.severity === "high").length,
    duplicates: duplicates.length,
    violations: layerViolations.length,
    loc: totalLoc,
    languages,
    parserModes: [],
  };

  // Health score
  const health = calcHealth({
    stats,
    issues,
    securityIssues,
  });

  // Build final data object
  const analysisData: AnalysisData = {
    files: analyzedFiles,
    functions: allFns,
    connections,
    fnStats,
    folders,
    tree,
    issues,
    patterns,
    securityIssues,
    duplicates,
    layerViolations,
    deadFunctions,
    suggestions: [],
    health,
    stats,
  };

  // Generate suggestions (needs the full data)
  analysisData.suggestions = generateSuggestions(analysisData);

  return analysisData;
}
