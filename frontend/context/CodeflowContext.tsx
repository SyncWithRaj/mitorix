"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { 
  AnalysisData, 
  GraphConfig, 
  ColorMode, 
  BlastRadius 
} from "../lib/codeflow.types";
import { DEFAULT_GRAPH_CONFIG } from "../lib/codeflow.constants";

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
  blastRadius: { targetId: string; affectedNodeIds: Set<string> } | null;
  setBlastRadius: (blast: { targetId: string; affectedNodeIds: Set<string> } | null) => void;
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
  
  const [blastRadius, setBlastRadius] = useState<{ targetId: string; affectedNodeIds: Set<string> } | null>(null);

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
