import React, { useEffect, useState } from "react";
import { useCodeflow } from "../../context/CodeflowContext";
import type { RightTab } from "../../context/CodeflowContext";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import ResizablePanel from "./ResizablePanel";
import { ArrowLeft, Menu, Settings, Ban, Folder, Archive, GitPullRequest, Download, Share2, Moon, Info, Grid, ShieldAlert, Zap, Code } from "lucide-react";
import Link from "next/link";
import HealthRing from "./sidebar/HealthRing";
import ColorModeSelector from "./sidebar/ColorModeSelector";
import StatsGrid from "./sidebar/StatsGrid";
import LanguageBar from "./sidebar/LanguageBar";
import TreeExplorer from "./sidebar/TreeExplorer";
import VizSelector from "./canvas/VizSelector";
import CanvasToolbar from "./canvas/CanvasToolbar";
import TreemapView from "./visualizers/TreemapView";
import MatrixView from "./visualizers/MatrixView";
import DendrogramView from "./visualizers/DendrogramView";
import SankeyView from "./visualizers/SankeyView";
import DisjointView from "./visualizers/DisjointView";
import BundleView from "./visualizers/BundleView";
import FileInspector from "./panels/FileInspector";
import IssuesPanel from "./panels/IssuesPanel";
import PatternsPanel from "./panels/PatternsPanel";
import SecurityPanel from "./panels/SecurityPanel";
import SuggestionsPanel from "./panels/SuggestionsPanel";
import DrillDownModal from "./panels/DrillDownModal";
import CodePanel from "./panels/CodePanel";

// Modals
import FilePreviewModal from "./modals/FilePreviewModal";
import PRAnalysisModal from "./modals/PRAnalysisModal";
import ExportModal from "./modals/ExportModal";
import UnusedFunctionsModal from "./modals/UnusedFunctionsModal";
import ExcludePatternsModal from "./modals/ExcludePatternsModal";
import ConfirmDialog from "./modals/ConfirmDialog";

export default function CodeflowLayout({
  repoId,
  children,
}: {
  repoId: string;
  children: React.ReactNode;
}) {
  const { 
    analysisData, 
    setAnalysisData, 
    setIsLoading, 
    graphConfig, 
    selectedFile, 
    rightTab, 
    setRightTab, 
    setDrillDown,
    setShowPRModal,
    setShowExportModal,
    setShowExcludeModal,
    excludePatterns,
    triggerAnalysis,
    // @ts-ignore - we'll add refreshKey to context too to make it easy
    refreshKey 
  } = useCodeflow();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        const patternsParam = excludePatterns.split("\n").filter(p => p.trim()).join(",");
        const res = await api.get(`/codeflow/analysis/${repoId}?excludes=${encodeURIComponent(patternsParam)}`);
        if (res.data.success) {
          setAnalysisData(res.data.data);
        } else {
          toast.error("Failed to load CodeFlow analysis");
        }
      } catch (err) {
        console.error("Error loading analysis:", err);
        toast.error("Failed to load CodeFlow analysis");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [repoId, setAnalysisData, setIsLoading, refreshKey]);

  const tabs = [
    { key: "details", label: "Details", icon: <Info size={12} /> },
    { key: "patterns", label: "Patterns", icon: <Grid size={12} /> },
    { key: "security", label: "Security", icon: <ShieldAlert size={12} /> },
    { key: "suggestions", label: "Action Items", icon: <Zap size={12} /> },
    { key: "code", label: "Source Code", icon: <Code size={12} /> }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0d1117] text-[#c9d1d9] overflow-hidden font-mono">
      {/* Topbar */}
      <div className="h-14 border-b border-[#30363d] bg-[#161b22] flex items-center px-4 shrink-0 z-50 justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard`}
            className="p-1.5 hover:bg-[#30363d] rounded-md transition text-[#8b949e] hover:text-[#c9d1d9]"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <button className="md:hidden p-1.5 text-[#8b949e] hover:text-[#c9d1d9]" onClick={() => setLeftOpen(!leftOpen)}>
              <Menu size={18} />
            </button>
            <div className="w-6 h-6 rounded bg-[#21262d] flex items-center justify-center text-[#c9d1d9] border border-[#30363d]">
              <span className="font-bold text-xs">CF</span>
            </div>
            <span className="font-bold text-[#c9d1d9] tracking-wide text-sm hidden sm:block">
              CODEFLOW
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-1 max-w-2xl px-2 sm:px-6">
          <input 
            type="text" 
            className="flex-1 bg-[#010409] border border-[#30363d] rounded-md px-3 py-1.5 text-xs text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] hidden sm:block"
            placeholder="owner/repo or GitHub URL"
            value={repoId}
            readOnly
          />
          <button 
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] rounded-md transition text-[#c9d1d9]"
            onClick={() => setShowExcludeModal(true)}
          >
             <Ban size={14} /> Excludes
          </button>
          <button 
            className="hidden sm:flex items-center gap-2 px-4 py-1.5 text-xs bg-[#238636] hover:bg-[#2ea043] border border-[rgba(240,246,252,0.1)] rounded-md transition text-white font-medium" 
            onClick={triggerAnalysis}
          >
             Analyze
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
           <button className="p-1.5 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] rounded-md transition" title="Open local folder">
             <Folder size={16} />
           </button>
           <button className="p-1.5 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] rounded-md transition" title="Open ZIP archive">
             <Archive size={16} />
           </button>
           <button 
             className="p-1.5 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] rounded-md transition" 
             title="Pull Request"
             onClick={() => setShowPRModal(true)}
           >
             <GitPullRequest size={16} />
           </button>
           <button 
             className="p-1.5 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] rounded-md transition" 
             title="Export"
             onClick={() => setShowExportModal(true)}
           >
             <Download size={16} />
           </button>
           <button className="p-1.5 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] rounded-md transition" title="Share">
             <Share2 size={16} />
           </button>
           <button className="p-1.5 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] rounded-md transition hidden sm:block" title="Toggle theme">
             <Moon size={16} />
           </button>
           <button className="lg:hidden p-1.5 text-[#8b949e] hover:text-[#c9d1d9]" onClick={() => setRightOpen(!rightOpen)}>
              <Settings size={18} />
           </button>
        </div>
      </div>

      {/* Main 3-Panel Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <ResizablePanel
          side="left"
          initialWidth={260}
          minWidth={180}
          maxWidth={400}
          className={`${leftOpen ? 'flex absolute inset-y-0 left-0 z-40' : 'hidden'} md:relative md:flex`}
        >
          {analysisData ? (
            <div className="flex flex-col h-full bg-[#0d1117]">
              {/* Upper Section */}
              <div className="flex-none p-4 space-y-5 border-b border-[#30363d] overflow-y-auto max-h-[65%] custom-scrollbar">
                <HealthRing 
                  score={analysisData.health?.score || 0} 
                  grade={analysisData.health?.grade || "F"} 
                />
                <ColorModeSelector />
                <StatsGrid />
                <LanguageBar />
              </div>
              
              {/* Lower Section: Tree Explorer */}
              <div className="flex-1 overflow-hidden p-3 pt-4">
                <TreeExplorer />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#8b949e]">
              <div className="w-12 h-12 mb-4 opacity-50 flex items-center justify-center rounded-full bg-[#21262d]">
                <Menu size={24} />
              </div>
              <h3 className="text-[#c9d1d9] font-bold text-sm mb-1">No Repository</h3>
              <p className="text-xs">Analyzing architecture and calculating metrics...</p>
            </div>
          )}
        </ResizablePanel>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative overflow-hidden">
          {analysisData && <VizSelector />}
          
          <div className="absolute inset-0 z-0">
            {graphConfig.vizType === "force" && children}
            {graphConfig.vizType === "treemap" && <TreemapView />}
            {graphConfig.vizType === "matrix" && <MatrixView />}
            {graphConfig.vizType === "dendro" && <DendrogramView />}
            {graphConfig.vizType === "sankey" && <SankeyView />}
            {graphConfig.vizType === "disjoint" && <DisjointView />}
            {graphConfig.vizType === "bundle" && <BundleView />}
          </div>

          {analysisData && <CanvasToolbar />}
        </div>

        {/* Right Panel */}
        <ResizablePanel
          side="right"
          initialWidth={360}
          minWidth={280}
          maxWidth={500}
          className={`${rightOpen ? 'flex absolute inset-y-0 right-0 z-40' : 'hidden'} lg:relative lg:flex`}
        >
          {/* Tab Bar */}
          <div className="flex border-b border-[#30363d] bg-[#161b22] shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`flex-1 py-2 text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                  rightTab === tab.key
                    ? "text-[#58a6ff] border-b-2 border-[#58a6ff]"
                    : "text-[#8b949e] hover:text-[#c9d1d9] border-b-2 border-transparent hover:border-[#30363d]"
                }`}
                onClick={() => { setRightTab(tab.key as RightTab); setDrillDown(null); }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className={`flex-1 overflow-y-auto bg-[#0d1117] custom-scrollbar flex flex-col ${rightTab === "code" ? "p-0" : "p-3"}`}>
            {analysisData ? (
              <div className="flex-1 flex flex-col relative bg-[#0d1117]">
                {rightTab === "details" && (
                  selectedFile ? <FileInspector /> : <IssuesPanel />
                )}
                {rightTab === "patterns" && <PatternsPanel />}
                {rightTab === "security" && <SecurityPanel />}
                {rightTab === "suggestions" && <SuggestionsPanel />}
                {rightTab === "code" && <CodePanel repoId={repoId} />}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#8b949e]">
                <div className="text-3xl mb-3 opacity-30">📊</div>
                <div className="text-xs font-semibold mb-1">Analysis</div>
                <div className="text-[10px] text-center opacity-60">Analyze a repo to see insights</div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </div>

      {/* Global Modals */}
      <DrillDownModal />
      <FilePreviewModal />
      <PRAnalysisModal repoId={repoId} />
      <ExportModal />
      <UnusedFunctionsModal />
      <ExcludePatternsModal />
      <ConfirmDialog />
    </div>
  );
}
