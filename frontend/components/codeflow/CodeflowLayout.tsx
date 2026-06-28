import React, { useEffect, useState, useCallback } from "react";
import { useCodeflow } from "../../context/CodeflowContext";
import type { RightTab } from "../../context/CodeflowContext";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import ResizablePanel from "./ResizablePanel";
import {
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
  MessageSquare,
  Bot,
  Loader2,
} from "lucide-react";
import ChatPanel from "../chat/ChatPanel";
import DragGhost from "./DragGhost";
import type { DraggedContextNode } from "../../lib/dragdrop.types";
import { useDragStore } from "../../lib/dragStore";
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

import AnalysisProgress from "./AnalysisProgress";
import { getWorkerManager } from "../../lib/worker.utils";
import { useSubscription } from "../../context/SubscriptionContext";

export type ChatRef = { file: string; startLine?: number; endLine?: number };
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  references?: ChatRef[];
  attachedNodes?: DraggedContextNode[];
  attachments?: DraggedContextNode[];
};

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
    setSelectedFile,
    setCodeHighlightRange,
    setCodeOpenTabs,
    rightTab,
    setRightTab,
    setDrillDown,
    setShowPRModal,
    setShowExportModal,
    setShowExcludeModal,
    excludePatterns,
    triggerAnalysis,
    refreshKey,
    useWebWorker,
    setUseWebWorker,
    analysisProgress,
    setAnalysisProgress,
    folderFilter,
    setFolderFilter,
  } = useCodeflow();
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(260);
  const [isDesignDocOpen, setIsDesignDocOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const { hasFeature, tier } = useSubscription();

  // ── Chat Slide-Out State ──
  const [chatOpen, setChatOpen] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [callMessages, setCallMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingIndex, setStreamingIndex] = useState<number | null>(null);
  const [attachedNodes, setAttachedNodes] = useState<DraggedContextNode[]>([]);

  // Keyboard shortcuts: Ctrl+B (left panel), Ctrl+D (explorer drawer), Ctrl+K (AI chat), Ctrl+J (right panel)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      const key = e.key.toLowerCase();

      if (key === "b") {
        e.preventDefault();
        setLeftPanelOpen((prev) => !prev);
      } else if (key === "d") {
        e.preventDefault();
        setExplorerOpen((prev) => !prev);
      } else if (key === "k") {
        e.preventDefault();
        setChatOpen((prev) => !prev);
      } else if (key === "j") {
        e.preventDefault();
        setRightPanelOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ── Fetch chat history when chat opens ──
  useEffect(() => {
    if (!chatOpen) return;
    const fetchChatHistory = async () => {
      try {
        const chatRes = await api.get(`/history/${repoId}?type=chat`);
        if (chatRes.data.success) setChatMessages(chatRes.data.messages || []);
        const callRes = await api.get(`/history/${repoId}?type=call`);
        if (callRes.data.success) setCallMessages(callRes.data.messages || []);
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };
    fetchChatHistory();
  }, [chatOpen, repoId]);

  const sendMessage = useCallback(async () => {
    if (!chatInput.trim() && attachedNodes.length === 0) return;

    const questionText = chatInput.trim();
    const sentNodes = [...attachedNodes];

    const userMsg: ChatMessage = { role: "user", content: questionText };
    if (sentNodes.length > 0) {
      userMsg.attachedNodes = sentNodes;
      userMsg.attachments = sentNodes;
    }

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setAttachedNodes([]);
    setChatLoading(true);

    try {
      const res = await api.post("/query/ask", {
        repoId,
        question: questionText,
        attachedNodes: sentNodes.length > 0 ? sentNodes : undefined,
      });

      const aiMsg: ChatMessage = {
        role: "assistant",
        content: res.data.answer,
        references: res.data.references || [],
      };

      setChatMessages((prev) => {
        const newMessages = [...prev, aiMsg];
        setStreamingIndex(newMessages.length - 1);
        return newMessages;
      });

      if (res.data.references?.length > 0) {
        const topRef = res.data.references[0];
        setSelectedFile(topRef.file);
        setCodeOpenTabs((prev) => (prev.includes(topRef.file) ? prev : [...prev, topRef.file]));
        setCodeHighlightRange({
          startLine: topRef.startLine || 1,
          endLine: topRef.endLine || topRef.startLine || 1,
        });
        setRightTab("code");
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
      toast.error("Failed to get response. Please try again.");
    }

    setChatLoading(false);
  }, [
    chatInput,
    attachedNodes,
    repoId,
    setSelectedFile,
    setCodeHighlightRange,
    setCodeOpenTabs,
    setRightTab,
  ]);

  const handleDeleteChat = useCallback(
    async (type: "chat" | "call") => {
      try {
        await api.delete(`/history/${repoId}?type=${type}`);
        if (type === "chat") setChatMessages([]);
        else setCallMessages([]);
        setStreamingIndex(null);
      } catch (err) {
        console.error("Delete chat error:", err);
        toast.error("Failed to delete chat history");
      }
    },
    [repoId]
  );

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
          toast.error("Failed to load Mitorix analysis");
        }
      } catch (err) {
        console.error("Error loading analysis:", err);
        toast.error("Failed to load Mitorix analysis");
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
    <div className={`fixed inset-0 z-[100] flex flex-col text-gh-text overflow-hidden font-mono ${isLoading ? 'bg-transparent' : 'bg-gh-bg'}`}>
      
      {/* Main Content Wrapper - Hidden during loading so global Silk shows through */}
      <div className={`flex flex-col h-full w-full transition-opacity duration-700 ease-in-out ${isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Topbar */}
        <div className="h-14 border-b border-gh-border bg-gh-panel flex items-center px-4 shrink-0 sticky top-0 z-[120] justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/dashboard`}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-gh-border bg-gh-btn-secondary hover:bg-gh-btn-secondary-hover transition"
            title="Mitorix"
          >
            <div className="w-5 h-5 rounded bg-gh-btn-secondary flex items-center justify-center text-gh-text border border-gh-border">
              <span className="font-bold text-[10px]">RL</span>
            </div>
            <span className="font-bold text-gh-text tracking-wide text-xs sm:text-sm">
              MITORIX
            </span>
          </Link>

          <button
            className={`p-1.5 rounded-md transition flex items-center gap-1.5 border ${
              leftPanelOpen
                ? "text-gh-accent bg-gh-accent/10 border-gh-accent/30"
                : "text-gh-text-muted hover:text-gh-accent hover:bg-gh-btn-secondary-hover border-transparent"
            }`}
            onClick={() => setLeftPanelOpen((prev) => !prev)}
            title="Toggle Left Panel (Ctrl+B)"
          >
            <Menu size={15} />
            <span className="text-[10px] uppercase font-bold hidden xl:inline">Left</span>
          </button>

          <button
            className={`p-1.5 rounded-md transition flex items-center gap-1.5 border ${
              explorerOpen
                ? "text-gh-accent bg-gh-accent/10 border-gh-accent/30"
                : "text-gh-text-muted hover:text-gh-accent hover:bg-gh-btn-secondary-hover border-transparent"
            }`}
            onClick={() => setExplorerOpen((prev) => !prev)}
            title="Toggle Explorer Drawer (Ctrl+D)"
          >
            <Folder size={15} />
            <span className="text-[10px] uppercase font-bold hidden xl:inline">Explorer</span>
          </button>
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
            className="p-1.5 rounded-md transition flex items-center gap-1.5 text-gh-text-muted hover:text-gh-accent hover:bg-gh-btn-secondary-hover"
            title={hasFeature('repo:design-doc') ? "Generate System Design" : "System Design requires PRO plan"}
            onClick={() => {
              if (!hasFeature('repo:design-doc')) {
                toast.error("🔒 System Design requires the PRO plan. Upgrade to unlock.");
                return;
              }
              setIsDesignDocOpen(true);
            }}
          >
            <FileText size={16} />
            <span className="text-[10px] uppercase font-bold hidden xl:inline">Design Doc</span>
          </button>
          <button
            className="p-1.5 rounded-md transition flex items-center gap-1.5 text-gh-text-muted hover:text-gh-accent hover:bg-gh-btn-secondary-hover"
            title={hasFeature('repo:onboarding') ? "Onboarding Guide" : "Onboarding Guide requires PRO plan"}
            onClick={() => {
              if (!hasFeature('repo:onboarding')) {
                toast.error("🔒 Onboarding Guide requires the PRO plan. Upgrade to unlock.");
                return;
              }
              setIsOnboardingOpen(true);
            }}
          >
            <BookOpen size={16} />
            <span className="text-[10px] uppercase font-bold hidden xl:inline">Onboarding</span>
          </button>
          <button
            className="p-1.5 rounded-md transition text-gh-text-muted hover:text-gh-text hover:bg-gh-btn-secondary-hover"
            title={hasFeature('codeflow:pr') ? "Pull Request Analysis" : "PR Analysis requires PRO plan"}
            onClick={() => {
              if (!hasFeature('codeflow:pr')) {
                toast.error("🔒 Pull Request Analysis requires the PRO plan. Upgrade to unlock.");
                return;
              }
              setShowPRModal(true);
            }}
          >
            <GitPullRequest size={16} />
          </button>
          <button
            className="p-1.5 rounded-md transition text-gh-text-muted hover:text-gh-text hover:bg-gh-btn-secondary-hover"
            title={hasFeature('export:data') ? "Export Analysis" : "Export requires BASIC plan"}
            onClick={() => {
              if (!hasFeature('export:data')) {
                toast.error("🔒 Export Analysis requires the BASIC plan. Upgrade to unlock.");
                return;
              }
              setShowExportModal(true);
            }}
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
            className={`p-1.5 rounded-md transition flex items-center gap-1.5 border ${
              chatOpen
                ? "text-gh-accent bg-gh-accent/10 border-gh-accent/30"
                : "text-gh-text-muted hover:text-gh-accent hover:bg-gh-btn-secondary-hover border-transparent"
            }`}
            title="AI Chat (Ctrl+K)"
            onClick={() => setChatOpen((prev) => !prev)}
          >
            <MessageSquare size={16} />
            <span className="text-[10px] uppercase font-bold hidden xl:inline">AI Chat</span>
          </button>

          <button
            className={`p-1.5 rounded-md transition flex items-center gap-1.5 border ${
              rightPanelOpen
                ? "text-gh-accent bg-gh-accent/10 border-gh-accent/30"
                : "text-gh-text-muted hover:text-gh-accent hover:bg-gh-btn-secondary-hover border-transparent"
            }`}
            title="Toggle Right Panel (Ctrl+J)"
            onClick={() => setRightPanelOpen((prev) => !prev)}
          >
            <Settings size={16} />
            <span className="text-[10px] uppercase font-bold hidden xl:inline">Right</span>
          </button>
        </div>
      </div>

      {/* Main 3-Panel Area */}
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        {/* Left Sidebar */}
        {leftPanelOpen && (
          <ResizablePanel
            side="left"
            initialWidth={260}
            minWidth={180}
            maxWidth={400}
            className="relative z-20 h-full bg-gh-panel border-r border-gh-border overflow-hidden"
            onWidthChange={setLeftPanelWidth}
          >
            {analysisData ? (
              <div className="flex flex-col h-full bg-gh-bg w-full relative">
                {/* Upper Section */}
                <div className="flex-1 p-4 space-y-5 overflow-y-auto custom-scrollbar">
                  {folderFilter && (
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-2 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Folder size={14} className="text-[#ff6b00] shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] text-[#737373] uppercase font-bold tracking-tight">
                            Active Filter
                          </span>
                          <span className="text-xs text-[#e5e5e5] font-medium truncate">
                            {folderFilter}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setFolderFilter(null)}
                        className="p-1.5 hover:bg-[#1a1a1a] rounded-md text-[#737373] hover:text-[#ff4500] transition-colors"
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
                {explorerOpen && (
                  <div className="absolute inset-0 z-50 bg-[#000000] flex flex-col animate-in slide-in-from-left duration-200">
                    <div className="flex items-center justify-between p-3 border-b border-[#1a1a1a] bg-[#050505]">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#e5e5e5] uppercase tracking-wider">
                        <Folder size={14} className="text-[#ff6b00]" />
                        <span>File Tree Explorer</span>
                      </div>
                      <button
                        onClick={() => setExplorerOpen(false)}
                        className="p-1 hover:bg-[#1a1a1a] rounded text-[#737373] hover:text-[#e5e5e5]"
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
        )}

        {/* Explorer Overlay (independent of left panel) */}
        {explorerOpen && (
          <div
            className="absolute z-60 bg-[#000000] border-r border-gh-border shadow-2xl flex flex-col min-h-0"
            style={{
              top: 0,
              bottom: 0,
              left: 0,
              width: `${leftPanelOpen ? leftPanelWidth : 320}px`,
            }}
          >
            <div className="flex items-center justify-between p-3 border-b border-[#1a1a1a] bg-[#050505]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#e5e5e5] uppercase tracking-wider">
                <Folder size={14} className="text-[#ff6b00]" />
                <span>File Tree Explorer</span>
              </div>
              <button
                onClick={() => setExplorerOpen(false)}
                className="p-1 hover:bg-[#1a1a1a] rounded text-[#737373] hover:text-[#e5e5e5]"
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
        {rightPanelOpen && (
          <ResizablePanel
            side="right"
            initialWidth={360}
            minWidth={280}
            maxWidth={500}
            className="relative z-20 h-full"
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
        )}

        {/* ── Chat Slide-Out Panel ── */}
        {chatOpen && (
          <div className="w-[380px] shrink-0 z-20 border-l border-gh-border bg-[#000000] shadow-[-10px_0_20px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-300 relative min-h-0">
            <ChatPanel
              repoId={repoId}
              chatMessages={chatMessages}
              callMessages={callMessages}
              input={chatInput}
              setInput={setChatInput}
              sendMessage={sendMessage}
              addCallMessages={(newMsgs: ChatMessage[]) =>
                setCallMessages((prev) => [...prev, ...newMsgs])
              }
              loading={chatLoading}
              streamingIndex={streamingIndex}
              onDeleteChat={handleDeleteChat}
              attachedNodes={attachedNodes}
              setAttachedNodes={setAttachedNodes}
            />
          </div>
        )}
      </div>

      {/* Global Modals */}
      <DragGhost />
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
      </div> {/* End Main Content Wrapper */}

      {/* Analysis Progress Overlay */}
      <AnalysisProgress
        progress={analysisProgress?.progress || 0}
        message={analysisProgress?.message || ""}
        isVisible={isLoading && useWebWorker && analysisProgress !== null}
      />
    </div>
  );
}
