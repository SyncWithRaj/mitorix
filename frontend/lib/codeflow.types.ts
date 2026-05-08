export type ColorMode = "folder" | "layer" | "churn";
export type VizType =
  | "visual"
  | "force"
  | "treemap"
  | "matrix"
  | "dendro"
  | "sankey"
  | "disjoint"
  | "bundle";
export type ViewMode = "force" | "radial" | "hierarchical" | "grid" | "metro";

export interface GraphConfig {
  vizType: VizType;
  viewMode: ViewMode;
  curvedLinks: boolean;
  showLabels: boolean;
  linkDist: number;
  spacing: number;
}

export interface AnalyzedFile {
  path: string;
  name: string;
  folder: string;
  content: string | null;
  lines: number;
  layer: string;
  functions: FunctionDef[];
  complexity: ComplexityResult;
  isCode: boolean;
  dependencies?: MarkdownDep[];
  parserProvenance?: string;
  churn?: number; // Added dynamically by Git history
}

export interface FunctionDef {
  name: string;
  file: string;
  folder?: string;
  line: number;
  code: string;
  isTopLevel: boolean;
  isExported: boolean;
  isClassMethod?: boolean;
  type: string;
  decorators?: string[] | null;
  className?: string | null;
}

export interface MarkdownDep {
  kind: string;
  raw: string;
  target: string;
  resolved: string | null;
}

export interface Connection {
  source: string;
  target: string;
  fn: string;
  count: number;
  kind?: string;
}

export interface FnStat {
  internal: number;
  external: number;
  callers: CallerInfo[];
  count: number;
  file: string;
  folder?: string;
  line: number;
  code: string;
  isTopLevel: boolean;
  isExported: boolean;
  isClassMethod: boolean;
  type: string;
  decorators?: string[] | null;
  className?: string | null;
}

export interface CallerInfo {
  file: string;
  name: string;
  count: number;
}

export type ComplexityLevel = "low" | "medium" | "high" | "critical";

export interface ComplexityResult {
  score: number;
  level: ComplexityLevel;
}

export interface ArchIssue {
  type: "warning" | "critical" | "info";
  title: string;
  desc: string;
  items: ArchIssueItem[];
}

export interface ArchIssueItem {
  name: string;
  file?: string;
  line?: number;
  code?: string;
  fns?: number;
  lines?: number;
  imports?: number;
  toFile?: string;
  fn?: string;
  suggestion?: string;
  files?: Array<{ file: string; line?: number; name?: string }>;
  count?: number;
  score?: number;
}

export interface Pattern {
  name: string;
  icon: string;
  desc: string;
  severity: "info" | "warning";
  isAnti?: boolean;
  files: PatternFile[];
  metrics: Record<string, number>;
}

export interface PatternFile {
  name: string;
  path: string;
  fns?: number;
  lines?: number;
}

export interface SecurityIssue {
  severity: "high" | "medium" | "low";
  title: string;
  file: string;
  path: string;
  line?: number;
  desc: string;
  code: string;
}

export interface Duplicate {
  type: "name" | "code";
  name: string;
  count: number;
  files: Array<{ file: string; line?: number; name?: string }>;
  similarity: number;
  suggestion: string;
}

export interface LayerViolation {
  from: string;
  fromLayer: string;
  to: string;
  toLayer: string;
  fn: string;
  suggestion: string;
}

export interface DeadFunction {
  name: string;
  file: string;
  folder?: string;
  line: number;
  code: string;
  codeLines: number;
  ext: string;
}

export interface Suggestion {
  priority: "critical" | "high" | "medium" | "low";
  icon: string;
  title: string;
  desc: string;
  action: string;
  impact: string;
}

export interface HealthScore {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
}

export interface BlastRadius {
  affected: string[];
  transitive: string[];
  count: number;
  transitiveCount: number;
  percent: number;
  level: "low" | "medium" | "high" | "critical";
  depth: number;
  fnsUsed: number;
  totalCalls: number;
  dependencies: string[];
  impactScore: number;
  centrality: number;
}

export interface FolderTree {
  name: string;
  path: string;
  children: Record<string, FolderTree>;
  files: AnalyzedFile[];
}

export interface LanguageStat {
  ext: string;
  lines: number;
  pct: number;
}

export interface ParserModeStat {
  mode: string;
  files: number;
}

export interface AnalysisStats {
  files: number;
  functions: number;
  connections: number;
  dead: number;
  patterns: number;
  security: number;
  duplicates: number;
  violations: number;
  loc: number;
  languages: LanguageStat[];
  parserModes: ParserModeStat[];
}

export interface AnalysisData {
  files: AnalyzedFile[];
  functions: FunctionDef[];
  connections: Connection[];
  fnStats: Record<string, FnStat>;
  folders: string[];
  tree: FolderTree;
  issues: ArchIssue[];
  patterns: Pattern[];
  securityIssues: SecurityIssue[];
  duplicates: Duplicate[];
  layerViolations: LayerViolation[];
  deadFunctions: DeadFunction[];
  suggestions: Suggestion[];
  health: HealthScore;
  stats: AnalysisStats;
}
