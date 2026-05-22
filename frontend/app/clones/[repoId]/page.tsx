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
      ? "#da3633"
      : value >= 90
        ? "#f0883e"
        : value >= 85
          ? "#d29922"
          : "#2ea043";

  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#21262d"
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
          ? "bg-[#161b22]/80 border-[#58a6ff]/20"
          : "bg-[#0d1117]/60 border-[#30363d]/50 hover:border-[#484f58]"
      }`}
    >
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setShowCode(!showCode)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {isAnchor ? (
            <div className="w-6 h-6 rounded-md bg-[#58a6ff]/15 border border-[#58a6ff]/30 flex items-center justify-center shrink-0">
              <Target size={12} className="text-[#58a6ff]" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-md bg-[#f0883e]/15 border border-[#f0883e]/30 flex items-center justify-center shrink-0">
              <Copy size={12} className="text-[#f0883e]" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate">
                {entity.name}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] uppercase tracking-wider shrink-0">
                {entity.type}
              </span>
              {isAnchor && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#58a6ff]/10 text-[#58a6ff] shrink-0">
                  ANCHOR
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-[#6e7681] truncate">
              {entity.filePath}:{entity.startLine}–{entity.endLine}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {similarity !== undefined && (
            <span className="text-xs font-mono text-[#f0883e] font-semibold">
              {similarity}% match
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-[#6e7681] transition-transform ${showCode ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {showCode && entity.content && (
        <div className="border-t border-[#30363d]/30">
          <pre className="text-[11px] font-mono text-[#c9d1d9] bg-[#010409] p-3 overflow-x-auto max-h-[180px] overflow-y-auto custom-scrollbar leading-relaxed whitespace-pre-wrap break-words">
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
      className="rounded-2xl border border-[#30363d]/60 bg-[#0d1117]/80 backdrop-blur-sm overflow-hidden animate-fadeInUp transition-all duration-300 hover:border-[#484f58]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Cluster header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#161b22]/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <SimilarityRing value={cluster.avgSimilarity} />
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitCompare size={14} className="text-[#f0883e]" />
              {cluster.anchor.name}
              <span className="text-[#8b949e] font-normal">
                has {cluster.cloneCount} semantic{" "}
                {cluster.cloneCount === 1 ? "clone" : "clones"}
              </span>
            </h3>
            <p className="text-xs text-[#6e7681] font-mono mt-0.5">
              {cluster.anchor.filePath} →{" "}
              {cluster.clones.map((c) => c.filePath).join(", ")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-[10px] font-mono px-2 py-1 rounded-lg border ${
              cluster.avgSimilarity >= 95
                ? "bg-[#da3633]/10 text-[#da3633] border-[#da3633]/20"
                : cluster.avgSimilarity >= 90
                  ? "bg-[#f0883e]/10 text-[#f0883e] border-[#f0883e]/20"
                  : "bg-[#d29922]/10 text-[#d29922] border-[#d29922]/20"
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
            className={`text-[#6e7681] transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
          />
        </div>
      </div>

      {/* Expanded content — side by side code comparison */}
      {expanded && (
        <div className="border-t border-[#30363d]/30 p-4 space-y-3 bg-[#0d1117]/50">
          <p className="text-[10px] font-mono text-[#6e7681] uppercase tracking-widest">
            Anchor (Original)
          </p>
          <EntityCard entity={cluster.anchor} isAnchor />

          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-[#30363d]/50" />
            <span className="text-[10px] font-mono text-[#6e7681]">
              CLONES ({cluster.cloneCount})
            </span>
            <div className="flex-1 h-px bg-[#30363d]/50" />
          </div>

          {cluster.clones.map((clone, i) => (
            <EntityCard
              key={`${clone.mongoId}-${i}`}
              entity={clone}
              similarity={clone.similarity}
            />
          ))}

          <div className="mt-3 p-3 rounded-lg bg-[#d29922]/5 border border-[#d29922]/15">
            <p className="text-xs text-[#d29922] flex items-center gap-2">
              <AlertTriangle size={12} />
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
    <div className="min-h-screen bg-[#0a0c10] text-[#c9d1d9] pt-24 pb-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#f0883e]/5 via-[#da3633]/3 to-transparent blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#a371f7]/5 to-transparent blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(`/dashboard`)}
            className="p-2 rounded-xl text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#f0883e]/20 to-[#da3633]/20 border border-[#f0883e]/20 flex items-center justify-center">
                <GitCompare size={18} className="text-[#f0883e]" />
              </div>
              Semantic Clone Detection
            </h1>
            <p className="text-sm text-[#8b949e] mt-1">
              Discover semantically similar code across your codebase — powered
              by Qdrant vector clustering
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8 p-6 rounded-2xl border border-[#30363d]/60 bg-[#161b22]/40 backdrop-blur-sm">
          <div className="flex items-end gap-6 flex-wrap">
            {/* Threshold slider */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-mono text-[#8b949e] block mb-2">
                Similarity Threshold:{" "}
                <span className="text-[#f0883e] font-semibold">
                  {threshold}%
                </span>
              </label>
              <input
                type="range"
                min={60}
                max={99}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-[#21262d] rounded-full appearance-none cursor-pointer accent-[#f0883e]"
              />
              <div className="flex justify-between text-[10px] text-[#6e7681] mt-1 font-mono">
                <span>60% (loose)</span>
                <span>99% (strict)</span>
              </div>
            </div>

            {/* Scan button */}
            <button
              onClick={runDetection}
              disabled={loading}
              className="cursor-pointer flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#f0883e] to-[#da3633] text-white text-sm font-bold transition-all hover:shadow-[0_0_25px_rgba(240,136,62,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Zap size={16} />
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
                color: "#f0883e",
              },
              {
                label: "Total Clones",
                value: result.totalClones,
                icon: Copy,
                color: "#da3633",
              },
              {
                label: "Vectors Scanned",
                value: result.scanStats.pointsScanned,
                icon: BarChart3,
                color: "#58a6ff",
              },
              {
                label: "Time Elapsed",
                value: `${(result.scanStats.elapsedMs / 1000).toFixed(1)}s`,
                icon: Zap,
                color: "#2ea043",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl bg-[#161b22]/60 border border-[#30363d]/40"
              >
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon size={14} style={{ color: stat.color }} />
                  <span className="text-[10px] font-mono text-[#6e7681] uppercase tracking-widest">
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
                <div className="w-14 h-14 border-[3px] border-[#30363d] border-t-[#f0883e] rounded-full animate-spin" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f0883e]/20 blur-sm" />
              </div>
              <p className="text-sm text-[#8b949e] font-medium">
                Scanning vector space for semantic clones...
              </p>
              <p className="text-xs text-[#6e7681] mt-1">
                Comparing every code entity against its neighbours in Qdrant
              </p>
            </div>
          ) : hasScanned && result && result.clusters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-4">
                <GitCompare size={28} className="text-[#2ea043]" />
              </div>
              <p className="text-lg font-medium text-white mb-1">
                No semantic clones found! 🎉
              </p>
              <p className="text-sm text-[#8b949e] max-w-sm text-center">
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
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-[#30363d] flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <GitCompare size={40} className="text-[#30363d]" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#f0883e] to-[#da3633] flex items-center justify-center shadow-lg">
                <Layers size={14} className="text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Find Hidden Code Clones
            </h2>
            <p className="text-sm text-[#8b949e] max-w-md text-center mb-4">
              Uses Qdrant vector similarity to find code blocks that are
              semantically identical — even if they use different variable names,
              formatting, or slightly different logic. Goes beyond text-based
              diff tools.
            </p>
            <div className="flex items-center gap-3 text-xs text-[#6e7681]">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#da3633]" />
                ≥95% Near Identical
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#f0883e]" />
                ≥90% High Similarity
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#d29922]" />
                ≥85% Semantic Clone
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
