import React, { useEffect, useState } from "react";
import { useCodeflow } from "../../context/CodeflowContext";
import type { RightTab } from "../../context/CodeflowContext";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import ResizablePanel from "./ResizablePanel";
import {
  ArrowLeft,
  Menu,
  Settings,
  Ban,
  Folder,
  Archive,
  GitPullRequest,
  Download,
  Share2,
  Moon,
  Info,
  Grid,
  ShieldAlert,
  Zap,
  Code,
  FileText,
  BookOpen,
  X,
} from "lucide-react";
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
import GraphView from "../graph/GraphView";
import DesignDocModal from "../graph/DesignDocModal";
import OnboardingModal from "../graph/OnboardingModal";
import FilePreviewModal from "./modals/FilePreviewModal";
import PRAnalysisModal from "./modals/PRAnalysisModal";
import ExportModal from "./modals/ExportModal";
import UnusedFunctionsModal from "./modals/UnusedFunctionsModal";
import ExcludePatternsModal from "./modals/ExcludePatternsModal";
import ConfirmDialog from "./modals/ConfirmDialog";
import ThemeToggle from "./ThemeToggle";
import AnalysisProgress from "./AnalysisProgress";
import { getWorkerManager } from "../../lib/worker.utils";

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
    isLoading,
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
    refreshKey,
    useWebWorker,
    setUseWebWorker,
    analysisProgress,
    setAnalysisProgress,
    folderFilter,
    setFolderFilter,
  } = useCodeflow();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [isDesignDocOpen, setIsDesignDocOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        setUseWebWorker(true);
        setAnalysisProgress({ progress: 10, message: "Initializing analysis..." });

        const workerManager = getWorkerManager();
        let workerPromise;
        if (workerManager.isWebWorkerSupported()) {
          workerPromise = workerManager
            .runAnalysis({ files: [], functions: [], relationships: [] }, (progress, message) => {
              setAnalysisProgress({ progress, message });
            })
            .catch((err) => {
              console.error("[Worker] Analysis worker failed:", err);
            });
        }

        const patternsParam = excludePatterns
          .split("\n")
          .filter((p) => p.trim())
          .join(",");
        const res = await api.get(
          `/codeflow/analysis/${repoId}?excludes=${encodeURIComponent(patternsParam)}`
        );

        if (workerPromise) {
          await workerPromise;
        }

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
        setAnalysisProgress(null);
      }
    };

    fetchAnalysis();
  }, [
    repoId,
    setAnalysisData,
    setIsLoading,
    refreshKey,
    setUseWebWorker,
    setAnalysisProgress,
    excludePatterns,
  ]);

  const tabs = [
    { key: "details", label: "Details", icon: <Info size={12} /> },
    { key: "patterns", label: "Patterns", icon: <Grid size={12} /> },
    { key: "security", label: "Security", icon: <ShieldAlert size={12} /> },
    { key: "suggestions", label: "Action Items", icon: <Zap size={12} /> },
    { key: "code", label: "Source Code", icon: <Code size={12} /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gh-bg text-gh-text overflow-hidden font-mono">
      {/* Topbar */}
      <div className="h-14 border-b border-gh-border bg-gh-panel flex items-center px-4 shrink-0 z-50 justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard`}
            className="p-1.5 hover:bg-gh-btn-secondary-hover rounded-md transition text-gh-text-muted hover:text-gh-text"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <button
              className="p-1.5 hover:bg-gh-btn-secondary-hover rounded-md transition text-[#8b949e] hover:text-[#c9d1d9] flex items-center gap-2 border border-[#30363d] px-2.5 bg-[#161b22] font-mono"
              onClick={() => setLeftOpen(!leftOpen)}
              title="Toggle File Explorer"
            >
              <Folder size={14} className="text-[#58a6ff]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {leftOpen ? "Hide Explorer" : "Show Explorer"}
              </span>
            </button>
            <div className="w-6 h-6 rounded bg-gh-btn-secondary flex items-center justify-center text-gh-text border border-gh-border ml-1 hidden md:flex">
              <span className="font-bold text-xs">CF</span>
            </div>
            <span className="font-bold text-gh-text tracking-wide text-sm hidden lg:block">
              CODEFLOW
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-2xl px-2 sm:px-6">
          <input
            type="text"
            className="flex-1 bg-gh-input border border-gh-border rounded-md px-3 py-1.5 text-xs text-gh-text focus:outline-none focus:border-gh-accent hidden sm:block"
            placeholder="owner/repo or GitHub URL"
            value={repoId}
            readOnly
          />
          <button
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gh-btn-secondary border border-gh-border hover:bg-gh-btn-secondary-hover rounded-md transition text-gh-text"
            onClick={() => setShowExcludeModal(true)}
          >
            <Ban size={14} /> Excludes
          </button>
          <button
            className="hidden sm:flex items-center gap-2 px-4 py-1.5 text-xs bg-gh-btn-primary hover:bg-gh-btn-primary-hover border border-gh-border rounded-md transition text-white font-medium"
            onClick={triggerAnalysis}
          >
            Analyze
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            className="p-1.5 text-gh-text-muted hover:text-[#58a6ff] hover:bg-gh-btn-secondary-hover rounded-md transition flex items-center gap-1.5"
            title="Generate System Design"
            onClick={() => setIsDesignDocOpen(true)}
          >
            <FileText size={16} />
            <span className="text-[10px] uppercase font-bold hidden xl:inline">Design Doc</span>
          </button>
          <button
            className="p-1.5 text-gh-text-muted hover:text-[#2ea043] hover:bg-gh-btn-secondary-hover rounded-md transition flex items-center gap-1.5"
            title="Onboarding Guide"
            onClick={() => setIsOnboardingOpen(true)}
          >
            <BookOpen size={16} />
            <span className="text-[10px] uppercase font-bold hidden xl:inline">Onboarding</span>
          </button>
          <button
            className="p-1.5 text-gh-text-muted hover:text-gh-text hover:bg-gh-btn-secondary-hover rounded-md transition"
            title="Pull Request"
            onClick={() => setShowPRModal(true)}
          >
            <GitPullRequest size={16} />
          </button>
          <button
            className="p-1.5 text-gh-text-muted hover:text-gh-text hover:bg-gh-btn-secondary-hover rounded-md transition"
            title="Export"
            onClick={() => setShowExportModal(true)}
          >
            <Download size={16} />
          </button>
          <button
            className="p-1.5 text-gh-text-muted hover:text-gh-text hover:bg-gh-btn-secondary-hover rounded-md transition"
            title="Share"
          >
            <Share2 size={16} />
          </button>
          <div className="hidden sm:block">{/* <ThemeToggle /> */}</div>
          <button
            className="lg:hidden p-1.5 text-gh-text-muted hover:text-gh-text"
            onClick={() => setRightOpen(!rightOpen)}
          >
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
          className="flex md:relative inset-y-0 left-0 z-40 h-full bg-gh-panel border-r border-gh-border relative overflow-hidden"
        >
          {analysisData ? (
            <div className="flex flex-col h-full bg-gh-bg w-full relative">
              {/* Upper Section */}
              <div className="flex-1 p-4 space-y-5 overflow-y-auto custom-scrollbar">
                {folderFilter && (
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-2 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Folder size={14} className="text-[#58a6ff] shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-[#8b949e] uppercase font-bold tracking-tight">Active Filter</span>
                        <span className="text-xs text-[#c9d1d9] font-medium truncate">{folderFilter}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setFolderFilter(null)}
                      className="p-1.5 hover:bg-[#21262d] rounded-md text-[#8b949e] hover:text-[#f85149] transition-colors"
                      title="Clear Filter"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <HealthRing
                  score={analysisData.health?.score || 0}
                  grade={analysisData.health?.grade || "F"}
                />
                <ColorModeSelector />
                <StatsGrid />
                <LanguageBar />
              </div>

              {/* Sliding File Explorer Drawer Overlapping Wholly */}
              {leftOpen && (
                <div className="absolute inset-0 z-50 bg-[#0d1117] flex flex-col animate-in slide-in-from-left duration-200">
                  <div className="flex items-center justify-between p-3 border-b border-[#30363d] bg-[#161b22]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#c9d1d9] uppercase tracking-wider">
                      <Folder size={14} className="text-[#58a6ff]" />
                      <span>File Tree Explorer</span>
                    </div>
                    <button
                      onClick={() => setLeftOpen(false)}
                      className="p-1 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#c9d1d9]"
                      title="Close Explorer"
                    >
                      <Ban size={14} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-3 custom-scrollbar">
                    <TreeExplorer />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gh-text-muted">
              <div className="w-12 h-12 mb-4 opacity-50 flex items-center justify-center rounded-full bg-gh-btn-secondary">
                <Menu size={24} />
              </div>
              <h3 className="text-gh-text font-bold text-sm mb-1">No Repository</h3>
              <p className="text-xs">Analyzing architecture and calculating metrics...</p>
            </div>
          )}
        </ResizablePanel>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-gh-bg relative overflow-hidden">
          {analysisData && <VizSelector />}

          <div className="absolute inset-0 z-0">
            {graphConfig.vizType === "visual" && <GraphView repoId={repoId} />}
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
          className={`${rightOpen ? "flex absolute inset-y-0 right-0 z-40" : "hidden"} lg:relative lg:flex`}
        >
          {/* Tab Bar */}
          <div className="flex border-b border-gh-border bg-gh-panel shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`flex-1 py-2 text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                  rightTab === tab.key
                    ? "text-gh-accent border-b-2 border-gh-accent"
                    : "text-gh-text-muted hover:text-gh-text border-b-2 border-transparent hover:border-gh-border"
                }`}
                onClick={() => {
                  setRightTab(tab.key as RightTab);
                  setDrillDown(null);
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div
            className={`flex-1 overflow-y-auto bg-gh-bg custom-scrollbar flex flex-col ${rightTab === "code" ? "p-0" : "p-3"}`}
          >
            {analysisData ? (
              <div className="flex-1 flex flex-col relative bg-gh-bg">
                {rightTab === "details" && (selectedFile ? <FileInspector /> : <IssuesPanel />)}
                {rightTab === "patterns" && <PatternsPanel />}
                {rightTab === "security" && <SecurityPanel />}
                {rightTab === "suggestions" && <SuggestionsPanel />}
                {rightTab === "code" && <CodePanel repoId={repoId} />}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gh-text-muted">
                <div className="text-3xl mb-3 opacity-30">📊</div>
                <div className="text-xs font-semibold mb-1">Analysis</div>
                <div className="text-[10px] text-center opacity-60">
                  Analyze a repo to see insights
                </div>
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
      <DesignDocModal
        repoId={repoId}
        isOpen={isDesignDocOpen}
        onClose={() => setIsDesignDocOpen(false)}
      />
      <OnboardingModal
        repoId={repoId}
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* Analysis Progress Overlay */}
      <AnalysisProgress
        progress={analysisProgress?.progress || 0}
        message={analysisProgress?.message || ""}
        isVisible={isLoading && useWebWorker && analysisProgress !== null}
      />
    </div>
  );
}
