"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AnalysisData, GraphConfig, ColorMode, BlastRadius } from "../lib/codeflow.types";
import { DEFAULT_GRAPH_CONFIG } from "../lib/codeflow.constants";
import { calcBlast } from "../lib/codeflow.utils";
import { getWorkerManager, cleanupWorkerManager } from "../lib/worker.utils";
import { shouldUseWebWorker } from "../lib/performance.utils";
import { useEffect } from "react";

export type RightTab = "details" | "patterns" | "security" | "suggestions" | "code";

interface CodeflowState {
  // Dynamic Filtering States
  codeFilterMode: "all" | "programming";
  setCodeFilterMode: (mode: "all" | "programming") => void;
  filteredFiles: any[];
  filteredConnections: any[];
  filteredTree: any | null;
  highlightLinks: boolean;
  setHighlightLinks: (highlight: boolean) => void;
  relationFilters: { calls: boolean; accesses: boolean; imports: boolean; handles: boolean };
  setRelationFilters: React.Dispatch<
    React.SetStateAction<{ calls: boolean; accesses: boolean; imports: boolean; handles: boolean }>
  >;

  // Data from backend
  analysisData: AnalysisData | null;
  setAnalysisData: (data: AnalysisData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Global UI State
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  graphConfig: GraphConfig;
  setGraphConfig: (config: GraphConfig) => void;

  // Interaction State
  selectedFile: string | null;
  setSelectedFile: (fileId: string | null) => void;
  codeHighlightRange: { startLine: number; endLine: number } | null;
  setCodeHighlightRange: (range: { startLine: number; endLine: number } | null) => void;
  codeOpenTabs: string[];
  setCodeOpenTabs: React.Dispatch<React.SetStateAction<string[]>>;
  hoveredNode: any | null;
  setHoveredNode: (node: any | null) => void;
  folderFilter: string | null;
  setFolderFilter: (folder: string | null) => void;

  // Blast Radius State
  blastRadius: BlastRadius | null;
  setBlastRadius: (blast: BlastRadius | null) => void;

  // Right Panel State
  rightTab: RightTab;
  setRightTab: (tab: RightTab) => void;
  expandedCards: Set<string>;
  toggleCard: (cardId: string) => void;
  expandedFns: Set<string>;
  toggleFn: (fnName: string) => void;
  drillDown: { type: string; data: any } | null;
  setDrillDown: (dd: { type: string; data: any } | null) => void;

  // Convenience: select a file and auto-compute blast radius
  selectFile: (path: string) => void;
  deselectFile: () => void;

  // Modal States
  filePreview: {
    path: string;
    content?: string | null;
    line?: number;
    filename: string;
    loading?: boolean;
    error?: string;
  } | null;
  setFilePreview: (preview: any | null) => void;
  showPRModal: boolean;
  setShowPRModal: (show: boolean) => void;
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
  showUnusedModal: boolean;
  setShowUnusedModal: (show: boolean) => void;
  showExcludeModal: boolean;
  setShowExcludeModal: (show: boolean) => void;
  excludePatterns: string;
  setExcludePatterns: (patterns: string) => void;
  refreshKey: number;
  triggerAnalysis: () => void;
  confirmDialog: { tone: string; title: string; desc: string; onConfirm: () => void } | null;
  setConfirmDialog: (dialog: any | null) => void;

  // Web Worker State
  useWebWorker: boolean;
  setUseWebWorker: (use: boolean) => void;
  analysisProgress: { progress: number; message: string } | null;
  setAnalysisProgress: (progress: { progress: number; message: string } | null) => void;
}

const REAL_CODE_EXTS = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "py",
  "pyw",
  "pyi",
  "java",
  "go",
  "rb",
  "php",
  "rs",
  "c",
  "cpp",
  "cc",
  "h",
  "hpp",
  "cs",
  "swift",
  "kt",
  "kts",
  "scala",
  "ex",
  "exs",
  "lua",
  "sh",
  "bash",
]);

function buildTreeFromFiles(files: any[]) {
  const root: any = { name: "Root", path: "", files: [], children: {} };

  files.forEach((file) => {
    const cleanPath = file.path.replace(/^\/tmp\/mitorix-repos\/[^\/]+\/[^\/]+\//, "");
    const parts = cleanPath.split("/");
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      const folderPath = parts.slice(0, i + 1).join("/");

      if (!current.children) {
        current.children = {};
      }

      if (!current.children[folderName]) {
        current.children[folderName] = {
          name: folderName,
          path: folderPath,
          files: [],
          children: {},
        };
      }

      current = current.children[folderName];
    }

    if (!current.files) {
      current.files = [];
    }
    current.files.push({
      name: parts[parts.length - 1],
      path: file.path,
    });
  });

  return root;
}

export const CodeflowContext = createContext<CodeflowState | undefined>(undefined);

export function CodeflowProvider({ children }: { children: ReactNode }) {
  const [analysisData, setRawAnalysisData] = useState<AnalysisData | null>(null);

  const setAnalysisData = useCallback((data: AnalysisData | null) => {
    if (!data) {
      setRawAnalysisData(null);
      return;
    }
    const cleanRepoPrefix = /^\/tmp\/mitorix-repos\/[^\/]+\/[^\/]+\/?/;
    const cleanedFiles = data.files.map((f) => ({
      ...f,
      folder: f.folder ? f.folder.replace(cleanRepoPrefix, "") : "",
    }));
    const cleanedFolders = data.folders.map((f) => f.replace(cleanRepoPrefix, ""));
    setRawAnalysisData({
      ...data,
      files: cleanedFiles,
      folders: cleanedFolders,
    });
  }, []);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [codeFilterMode, setCodeFilterMode] = useState<"all" | "programming">("programming");
  const [highlightLinks, setHighlightLinks] = useState<boolean>(false);
  const [relationFilters, setRelationFilters] = useState({
    calls: true,
    accesses: true,
    imports: true,
    handles: true,
  });

  const filteredFiles = React.useMemo(() => {
    if (!analysisData) return [];
    if (codeFilterMode === "all") return analysisData.files;
    return analysisData.files.filter((f) => {
      const ext = f.path.split(".").pop()?.toLowerCase();
      return ext && REAL_CODE_EXTS.has(ext);
    });
  }, [analysisData, codeFilterMode]);

  const filteredConnections = React.useMemo(() => {
    if (!analysisData) return [];
    if (codeFilterMode === "all") return analysisData.connections;
    const fileSet = new Set(filteredFiles.map((f) => f.path));
    return analysisData.connections.filter((c) => fileSet.has(c.source) && fileSet.has(c.target));
  }, [analysisData, filteredFiles, codeFilterMode]);

  const filteredTree = React.useMemo(() => {
    if (!analysisData) return null;
    return buildTreeFromFiles(analysisData.files);
  }, [analysisData]);

  const [colorMode, setColorMode] = useState<ColorMode>("folder");
  const [graphConfig, setGraphConfig] = useState<GraphConfig>(DEFAULT_GRAPH_CONFIG);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [codeHighlightRange, setCodeHighlightRange] = useState<{
    startLine: number;
    endLine: number;
  } | null>(null);
  const [codeOpenTabs, setCodeOpenTabs] = useState<string[]>([]);
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);
  const [folderFilter, setFolderFilter] = useState<string | null>(null);

  const [blastRadius, setBlastRadius] = useState<BlastRadius | null>(null);

  // Right Panel
  const [rightTab, setRightTab] = useState<RightTab>("details");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(["blast"]));
  const [expandedFns, setExpandedFns] = useState<Set<string>>(new Set());
  const [drillDown, setDrillDown] = useState<{ type: string; data: any } | null>(null);

  // Modal States
  const [filePreview, setFilePreview] = useState<any | null>(null);
  const [showPRModal, setShowPRModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showUnusedModal, setShowUnusedModal] = useState<boolean>(false);
  const [showExcludeModal, setShowExcludeModal] = useState<boolean>(false);
  const [excludePatterns, setExcludePatterns] = useState<string>(
    "node_modules\n.git\ndist\nbuild\n.next"
  );
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [confirmDialog, setConfirmDialog] = useState<any | null>(null);

  // Web Worker State
  const [useWebWorker, setUseWebWorker] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<{
    progress: number;
    message: string;
  } | null>(null);

  // Initialize Web Worker on mount
  useEffect(() => {
    const workerManager = getWorkerManager();
    workerManager.initialize();

    return () => {
      cleanupWorkerManager();
    };
  }, []);

  // Auto-enable Web Worker for large repos
  useEffect(() => {
    if (analysisData && analysisData.stats.files > 100) {
      setUseWebWorker(true);
    }
  }, [analysisData]);

  const triggerAnalysis = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const toggleCard = useCallback((cardId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }, []);

  const toggleFn = useCallback((fnName: string) => {
    setExpandedFns((prev) => {
      const next = new Set(prev);
      if (next.has(fnName)) next.delete(fnName);
      else next.add(fnName);
      return next;
    });
  }, []);

  const selectFile = useCallback(
    (path: string) => {
      if (!analysisData) return;
      const file = analysisData.files.find((f) => f.path === path);
      if (file) {
        console.log("[CodeFlow] Selecting file:", path);
        console.log("[CodeFlow] Connections sample:", analysisData.connections.slice(0, 2));
        setSelectedFile(path);
        setCodeOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
        setCodeHighlightRange(null);
        setRightTab("details");
        setExpandedFns(new Set());
        const blast = calcBlast(path, analysisData.connections, analysisData.files);
        console.log("[CodeFlow] Computed blast radius:", blast);
        setBlastRadius(blast);
      }
    },
    [analysisData]
  );

  const deselectFile = useCallback(() => {
    setSelectedFile(null);
    setCodeHighlightRange(null);
    setBlastRadius(null);
  }, []);

  return (
    <CodeflowContext.Provider
      value={{
        codeFilterMode,
        setCodeFilterMode,
        filteredFiles,
        filteredConnections,
        filteredTree,
        highlightLinks,
        setHighlightLinks,
        relationFilters,
        setRelationFilters,
        analysisData,
        setAnalysisData,
        isLoading,
        setIsLoading,
        colorMode,
        setColorMode,
        graphConfig,
        setGraphConfig,
        selectedFile,
        setSelectedFile,
        codeHighlightRange,
        setCodeHighlightRange,
        codeOpenTabs,
        setCodeOpenTabs,
        hoveredNode,
        setHoveredNode,
        folderFilter,
        setFolderFilter,
        blastRadius,
        setBlastRadius,
        rightTab,
        setRightTab,
        expandedCards,
        toggleCard,
        expandedFns,
        toggleFn,
        drillDown,
        setDrillDown,
        selectFile,
        deselectFile,
        filePreview,
        setFilePreview,
        showPRModal,
        setShowPRModal,
        showExportModal,
        setShowExportModal,
        showUnusedModal,
        setShowUnusedModal,
        showExcludeModal,
        setShowExcludeModal,
        excludePatterns,
        setExcludePatterns,
        refreshKey,
        triggerAnalysis,
        confirmDialog,
        setConfirmDialog,
        useWebWorker,
        setUseWebWorker,
        analysisProgress,
        setAnalysisProgress,
      }}
    >
      {children}
    </CodeflowContext.Provider>
  );
}

export function useCodeflow() {
  const context = useContext(CodeflowContext);
  if (context === undefined) {
    throw new Error("useCodeflow must be used within a CodeflowProvider");
  }
  return context;
}
