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

export type RightTab = "details" | "patterns" | "security" | "suggestions";

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
