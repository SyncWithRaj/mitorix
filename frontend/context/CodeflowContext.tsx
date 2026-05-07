"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { 
  AnalysisData, 
  GraphConfig, 
  ColorMode, 
  BlastRadius 
} from "../lib/codeflow.types";
import { DEFAULT_GRAPH_CONFIG } from "../lib/codeflow.constants";
import { calcBlast } from "../lib/codeflow.utils";
import { getWorkerManager, cleanupWorkerManager } from "../lib/worker.utils";
import { shouldUseWebWorker } from "../lib/performance.utils";
import { useEffect } from "react";

export type RightTab = "details" | "patterns" | "security" | "suggestions" | "code";

interface CodeflowState {
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
  filePreview: { path: string; content?: string | null; line?: number; filename: string; loading?: boolean; error?: string } | null;
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

const CodeflowContext = createContext<CodeflowState | undefined>(undefined);

export function CodeflowProvider({ children }: { children: ReactNode }) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [colorMode, setColorMode] = useState<ColorMode>("folder");
  const [graphConfig, setGraphConfig] = useState<GraphConfig>(DEFAULT_GRAPH_CONFIG);
  
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
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
  const [excludePatterns, setExcludePatterns] = useState<string>("node_modules\n.git\ndist\nbuild\n.next");
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [confirmDialog, setConfirmDialog] = useState<any | null>(null);

  // Web Worker State
  const [useWebWorker, setUseWebWorker] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ progress: number; message: string } | null>(null);

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
    setRefreshKey(prev => prev + 1);
  }, []);

  const toggleCard = useCallback((cardId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }, []);

  const toggleFn = useCallback((fnName: string) => {
    setExpandedFns(prev => {
      const next = new Set(prev);
      if (next.has(fnName)) next.delete(fnName);
      else next.add(fnName);
      return next;
    });
  }, []);

  const selectFile = useCallback((path: string) => {
    if (!analysisData) return;
    const file = analysisData.files.find(f => f.path === path);
    if (file) {
      console.log("[CodeFlow] Selecting file:", path);
      console.log("[CodeFlow] Connections sample:", analysisData.connections.slice(0, 2));
      setSelectedFile(path);
      setRightTab("details");
      setExpandedFns(new Set());
      const blast = calcBlast(path, analysisData.connections, analysisData.files);
      console.log("[CodeFlow] Computed blast radius:", blast);
      setBlastRadius(blast);
    }
  }, [analysisData]);

  const deselectFile = useCallback(() => {
    setSelectedFile(null);
    setBlastRadius(null);
  }, []);

  return (
    <CodeflowContext.Provider
      value={{
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
