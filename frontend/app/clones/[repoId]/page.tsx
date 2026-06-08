"use client";

import { useState, useCallback } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
  ArrowLeft,
  Loader2,
  Copy,
  GitCompare,
  FileCode,
  Zap,
  ChevronDown,
  ChevronRight,
  Layers,
  BarChart3,
  Target,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────
interface CloneEntity {
  mongoId: string;
  name: string;
  type: string;
  filePath: string;
  language: string;
  startLine: number;
  endLine: number;
  content: string;
}

interface CloneCluster {
  id: string;
  anchor: CloneEntity;
  clones: Array<CloneEntity & { similarity: number }>;
  avgSimilarity: number;
  cloneCount: number;
}

interface CloneResponse {
  success: boolean;
  clusters: CloneCluster[];
  totalClusters: number;
  totalClones: number;
  scanStats: {
    pointsScanned: number;
    comparisons: number;
    elapsedMs: number;
  };
}

// ─── Similarity Ring ─────────────────────────────────────────────────────────
function SimilarityRing({ value }: { value: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color =
    value >= 95
      ? "#ef4444"
      : value >= 90
        ? "#ff6b00"
        : value >= 85
          ? "#ff8c00"
          : "#60a5fa";

  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="3"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
        style={{ color }}
      >
        {value}%
      </span>
    </div>
  );
}

// ─── Entity Card (anchor or clone) ──────────────────────────────────────────
function EntityCard({
  entity,
  similarity,
  isAnchor,
}: {
  entity: CloneEntity;
  similarity?: number;
  isAnchor?: boolean;
}) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-all duration-300 overflow-hidden ${
        isAnchor
          ? "bg-[#0a0a0a]/80 border-[#ff6b00]/20"
          : "bg-[#050505]/60 border-[#1a1a1a]/50 hover:border-[#ff6b00]/30"
      }`}
    >
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setShowCode(!showCode)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {isAnchor ? (
            <div className="w-6 h-6 rounded-md bg-[#ff6b00]/15 border border-[#ff6b00]/30 flex items-center justify-center shrink-0">
              <Target size={12} className="text-[#ff6b00]" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-md bg-[#ff8c00]/15 border border-[#ff8c00]/30 flex items-center justify-center shrink-0">
              <Copy size={12} className="text-[#ff8c00]" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate">
                {entity.name}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1a1a1a] text-[#737373] uppercase tracking-wider shrink-0 border border-[#1a1a1a]">
                {entity.type}
              </span>
              {isAnchor && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff6b00]/10 text-[#ff6b00] shrink-0 border border-[#ff6b00]/20">
                  ANCHOR
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-[#737373] truncate">
              {entity.filePath}:{entity.startLine}–{entity.endLine}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {similarity !== undefined && (
            <span className="text-xs font-mono text-[#ff8c00] font-semibold">
              {similarity}% match
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-[#737373] transition-transform ${showCode ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {showCode && entity.content && (
        <div className="border-t border-[#1a1a1a]/30">
          <pre className="text-[11px] font-mono text-[#e5e5e5] bg-[#000000] p-3 overflow-x-auto max-h-[180px] overflow-y-auto custom-scrollbar leading-relaxed whitespace-pre-wrap break-words">
            {entity.content}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Clone Cluster Card ─────────────────────────────────────────────────────
function ClusterCard({
  cluster,
  index,
}: {
  cluster: CloneCluster;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm overflow-hidden animate-fadeInUp transition-all duration-300 hover:border-[#ff6b00]/30"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Cluster header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#1a1a1a]/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <SimilarityRing value={cluster.avgSimilarity} />
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitCompare size={14} className="text-[#ff6b00]" />
              {cluster.anchor.name}
              <span className="text-[#737373] font-normal">
                has {cluster.cloneCount} semantic{" "}
                {cluster.cloneCount === 1 ? "clone" : "clones"}
              </span>
            </h3>
            <p className="text-xs text-[#737373] font-mono mt-0.5">
              {cluster.anchor.filePath} →{" "}
              {cluster.clones.map((c) => c.filePath).join(", ")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-[10px] font-mono px-2 py-1 rounded-lg border ${
              cluster.avgSimilarity >= 95
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : cluster.avgSimilarity >= 90
                  ? "bg-[#ff6b00]/10 text-[#ff6b00] border-[#ff6b00]/20"
                  : "bg-[#ff8c00]/10 text-[#ff8c00] border-[#ff8c00]/20"
            }`}
          >
            {cluster.avgSimilarity >= 95
              ? "NEAR IDENTICAL"
              : cluster.avgSimilarity >= 90
                ? "HIGH SIMILARITY"
                : "SEMANTIC CLONE"}
          </span>
          <ChevronRight
            size={16}
            className={`text-[#737373] transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
          />
        </div>
      </div>

      {/* Expanded content — side by side code comparison */}
      {expanded && (
        <div className="border-t border-[#1a1a1a]/30 p-4 space-y-3 bg-[#050505]/50">
          <p className="text-[10px] font-mono text-[#737373] uppercase tracking-widest">
            Anchor (Original)
          </p>
          <EntityCard entity={cluster.anchor} isAnchor />

          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-[#1a1a1a]/50" />
            <span className="text-[10px] font-mono text-[#737373]">
              CLONES ({cluster.cloneCount})
            </span>
            <div className="flex-1 h-px bg-[#1a1a1a]/50" />
          </div>

          {cluster.clones.map((clone, i) => (
            <EntityCard
              key={`${clone.mongoId}-${i}`}
              entity={clone}
              similarity={clone.similarity}
            />
          ))}

          <div className="mt-3 p-3 rounded-lg bg-[#ff8c00]/5 border border-[#ff8c00]/15">
            <p className="text-xs text-[#ff8c00] flex items-center gap-2">
              <AlertTriangle size={12} className="text-[#ff6b00]" />
              <span className="font-semibold">Refactoring Suggestion:</span>{" "}
              These code blocks are semantically similar. Consider extracting
              shared logic into a reusable utility function.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ClonesPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CloneResponse | null>(null);
  const [threshold, setThreshold] = useState(85);
  const [hasScanned, setHasScanned] = useState(false);

  const runDetection = useCallback(async () => {
    setLoading(true);
    setHasScanned(true);

    try {
      const res = await api.get<CloneResponse>(`/clones/${repoId}`, {
        params: { threshold: threshold / 100 },
      });

      if (res.data.success) {
        setResult(res.data);
      }
    } catch (err: any) {
      console.error("Clone detection failed:", err);
      toast.error(
        err.response?.data?.message || "Clone detection failed"
      );
    } finally {
      setLoading(false);
    }
  }, [repoId, threshold]);

  return (
    <div className="min-h-screen bg-[#000000] text-[#e5e5e5] pt-24 pb-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#ff6b00]/8 via-[#ff8c00]/4 to-transparent blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#ff6b00]/3 to-transparent blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(`/dashboard`)}
            className="p-2 rounded-xl text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#ff6b00]/20 to-[#ff8c00]/20 border border-[#ff6b00]/20 flex items-center justify-center">
                <GitCompare size={18} className="text-[#ff6b00]" />
              </div>
              Semantic Clone Detection
            </h1>
            <p className="text-sm text-[#737373] mt-1">
              Discover semantically similar code across your codebase — powered
              by Qdrant vector clustering
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8 p-6 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]/40 backdrop-blur-sm">
          <div className="flex items-end gap-6 flex-wrap">
            {/* Threshold slider */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-mono text-[#737373] block mb-2">
                Similarity Threshold:{" "}
                <span className="text-[#ff6b00] font-semibold">
                  {threshold}%
                </span>
              </label>
              <input
                type="range"
                min={60}
                max={99}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-[#1a1a1a] rounded-full appearance-none cursor-pointer accent-[#ff6b00]"
              />
              <div className="flex justify-between text-[10px] text-[#737373] mt-1 font-mono">
                <span>60% (loose)</span>
                <span>99% (strict)</span>
              </div>
            </div>

            {/* Scan button */}
            <button
              onClick={runDetection}
              disabled={loading}
              className="cursor-pointer flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white text-sm font-bold transition-all hover:shadow-[0_0_25px_rgba(255,107,0,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin text-white" />
              ) : (
                <Zap size={16} className="text-white" />
              )}
              {loading ? "Scanning Vectors..." : "Detect Clones"}
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {result && !loading && (
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fadeIn">
            {[
              {
                label: "Clone Clusters",
                value: result.totalClusters,
                icon: Layers,
                color: "#ff6b00",
              },
              {
                label: "Total Clones",
                value: result.totalClones,
                icon: Copy,
                color: "#ff8c00",
              },
              {
                label: "Vectors Scanned",
                value: result.scanStats.pointsScanned,
                icon: BarChart3,
                color: "#60a5fa",
              },
              {
                label: "Time Elapsed",
                value: `${(result.scanStats.elapsedMs / 1000).toFixed(1)}s`,
                icon: Zap,
                color: "#ffaa00",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl bg-[#0a0a0a]/60 border border-[#1a1a1a]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon size={14} style={{ color: stat.color }} />
                  <span className="text-[10px] font-mono text-[#737373] uppercase tracking-widest">
                    {stat.label}
                  </span>
                </div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="w-14 h-14 border-[3px] border-[#1a1a1a] border-t-[#ff6b00] rounded-full animate-spin" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#ff6b00]/20 blur-sm" />
              </div>
              <p className="text-sm text-[#737373] font-medium">
                Scanning vector space for semantic clones...
              </p>
              <p className="text-xs text-[#737373] mt-1">
                Comparing every code entity against its neighbours in Qdrant
              </p>
            </div>
          ) : hasScanned && result && result.clusters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-4">
                <GitCompare size={28} className="text-[#60a5fa]" />
              </div>
              <p className="text-lg font-medium text-white mb-1">
                No semantic clones found! 🎉
              </p>
              <p className="text-sm text-[#737373] max-w-sm text-center">
                Your codebase has good code reuse. Try lowering the similarity
                threshold to find looser matches.
              </p>
            </div>
          ) : (
            result?.clusters.map((cluster, index) => (
              <ClusterCard
                key={cluster.id}
                cluster={cluster}
                index={index}
              />
            ))
          )}
        </div>

        {/* Empty state (before first scan) */}
        {!hasScanned && (
          <div className="flex flex-col items-center justify-center py-16 animate-fadeIn">
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0a0a0a] to-[#000000] border border-[#1a1a1a] flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <GitCompare size={40} className="text-[#1a1a1a]" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] flex items-center justify-center shadow-lg">
                <Layers size={14} className="text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Find Hidden Code Clones
            </h2>
            <p className="text-sm text-[#737373] max-w-md text-center mb-4">
              Uses Qdrant vector similarity to find code blocks that are
              semantically identical — even if they use different variable names,
              formatting, or slightly different logic. Goes beyond text-based
              diff tools.
            </p>
            <div className="flex items-center gap-3 text-xs text-[#737373]">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                ≥95% Near Identical
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#ff6b00]" />
                ≥90% High Similarity
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#ff8c00]" />
                ≥85% Semantic Clone
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
