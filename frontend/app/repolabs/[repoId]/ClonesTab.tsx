"use client";

import { useState, useCallback } from "react";
import api from "@/lib/axios";
import { Loader2, Copy, GitCompare, Zap, ChevronDown, ChevronRight, Layers, BarChart3, Target, AlertTriangle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

interface CloneEntity { mongoId: string; name: string; type: string; filePath: string; language: string; startLine: number; endLine: number; content: string; }
interface CloneCluster { id: string; anchor: CloneEntity; clones: Array<CloneEntity & { similarity: number }>; avgSimilarity: number; cloneCount: number; }
interface CloneResponse { success: boolean; clusters: CloneCluster[]; totalClusters: number; totalClones: number; scanStats: { pointsScanned: number; comparisons: number; elapsedMs: number }; }

function SimilarityRing({ value }: { value: number }) {
  const r = 18, c = 2 * Math.PI * r, o = c - (value / 100) * c;
  const color = value >= 95 ? "#FF4500" : value >= 90 ? "#FF6B00" : value >= 85 ? "#FF8C00" : "#FFA800";
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#1A1A1A" strokeWidth="3" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" className="transition-all duration-700 ease-out" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color }}>{value}%</span>
    </div>
  );
}

function EntityCard({ entity, similarity, isAnchor }: { entity: CloneEntity; similarity?: number; isAnchor?: boolean }) {
  const [showCode, setShowCode] = useState(false);
  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${isAnchor ? "bg-[#0A0A0A] border-[#FF6B00]/30" : "bg-[#050505] border-[#1A1A1A] hover:border-[#FF6B00]/20"}`}>
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setShowCode(!showCode)}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isAnchor ? "bg-[#FF6B00]/10 border border-[#FF6B00]/20" : "bg-[#1A1A1A] border border-[#333]"}`}>
            {isAnchor ? <Target size={12} className="text-[#FF6B00]" /> : <Copy size={12} className="text-[#737373]" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#E5E5E5] truncate">{entity.name}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1A1A1A] text-[#A3A3A3] uppercase">{entity.type}</span>
              {isAnchor && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FF6B00]/10 text-[#FF6B00]">ANCHOR</span>}
            </div>
            <p className="text-[11px] font-mono text-[#737373] truncate mt-0.5">{entity.filePath}:{entity.startLine}–{entity.endLine}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {similarity !== undefined && <span className="text-xs font-mono text-[#FF8C00] font-medium">{similarity}% match</span>}
          <ChevronDown size={14} className={`text-[#737373] transition-transform ${showCode ? "rotate-180" : ""}`} />
        </div>
      </div>
      {showCode && entity.content && <div className="border-t border-[#1A1A1A]"><pre className="text-[11px] font-mono text-[#A3A3A3] bg-[#000000] p-4 overflow-x-auto max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words">{entity.content}</pre></div>}
    </div>
  );
}

function ClusterCard({ cluster, index }: { cluster: CloneCluster; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const severity = cluster.avgSimilarity >= 95 ? { label: "NEAR IDENTICAL", cls: "bg-[#FF4500]/10 text-[#FF4500] border-[#FF4500]/20" }
    : cluster.avgSimilarity >= 90 ? { label: "HIGH SIMILARITY", cls: "bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/20" }
    : { label: "SEMANTIC CLONE", cls: "bg-[#FF8C00]/10 text-[#FF8C00] border-[#FF8C00]/20" };

  return (
    <div className="rounded-2xl border border-[#1A1A1A] bg-[#050505] overflow-hidden animate-fadeInUp transition-all hover:border-[#FF6B00]/30" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#0A0A0A] transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <SimilarityRing value={cluster.avgSimilarity} />
          <div>
            <h3 className="text-[15px] font-medium text-white flex items-center gap-2"><GitCompare size={14} className="text-[#FF6B00]" />{cluster.anchor.name}<span className="text-[#737373] text-[13px] font-normal">has {cluster.cloneCount} semantic {cluster.cloneCount === 1 ? "clone" : "clones"}</span></h3>
            <p className="text-[11px] text-[#A3A3A3] font-mono mt-1">{cluster.anchor.filePath} → <span className="text-[#737373]">{cluster.clones.map(c => c.filePath).join(", ")}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-[10px] font-mono px-2 py-1 rounded-md border ${severity.cls}`}>{severity.label}</span>
          <ChevronRight size={16} className={`text-[#737373] transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>
      {expanded && (
        <div className="border-t border-[#1A1A1A] p-5 space-y-4 bg-[#0A0A0A]/50">
          <p className="text-[10px] font-mono text-[#737373] uppercase tracking-widest">Anchor (Original)</p>
          <EntityCard entity={cluster.anchor} isAnchor />
          <div className="flex items-center gap-2 py-2"><div className="flex-1 h-px bg-[#1A1A1A]" /><span className="text-[10px] font-mono text-[#737373]">CLONES ({cluster.cloneCount})</span><div className="flex-1 h-px bg-[#1A1A1A]" /></div>
          {cluster.clones.map((clone, i) => <EntityCard key={`${clone.mongoId}-${i}`} entity={clone} similarity={clone.similarity} />)}
          <div className="mt-4 p-4 rounded-xl bg-[#FF8C00]/5 border border-[#FF8C00]/10">
            <p className="text-xs text-[#FF8C00] flex items-center gap-2"><AlertTriangle size={14} /><span className="font-medium">Refactoring Suggestion:</span> Consider extracting shared logic into a reusable utility function.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClonesTab({ repoId }: { repoId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CloneResponse | null>(null);
  const [threshold, setThreshold] = useState(85);
  const [hasScanned, setHasScanned] = useState(false);

  const runDetection = useCallback(async () => {
    setLoading(true); setHasScanned(true);
    try {
      const res = await api.get<CloneResponse>(`/clones/${repoId}`, { params: { threshold: threshold / 100 } });
      if (res.data.success) setResult(res.data);
    } catch (err: any) { toast.error(err.response?.data?.message || "Clone detection failed"); }
    finally { setLoading(false); }
  }, [repoId, threshold]);

  return (
    <div>
      {/* Controls */}
      <div className="mb-8 p-6 rounded-2xl border border-[#1A1A1A] bg-[#0A0A0A]">
        <div className="flex items-end gap-8 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-mono text-[#A3A3A3] block mb-3">Similarity Threshold: <span className="text-[#FF6B00] font-medium">{threshold}%</span></label>
            <input type="range" min={60} max={99} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full h-1 bg-[#1A1A1A] rounded-full appearance-none cursor-pointer accent-[#FF6B00]" />
            <div className="flex justify-between text-[10px] text-[#737373] mt-2 font-mono"><span>60% (loose)</span><span>99% (strict)</span></div>
          </div>
          <button onClick={runDetection} disabled={loading} className="cursor-pointer flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF6B00] hover:bg-[#FF8C00] text-white text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}{loading ? "Scanning..." : "Detect Clones"}
          </button>
        </div>
      </div>

      {/* Stats */}
      {result && !loading && (
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fadeIn">
          {[{ l: "Clone Clusters", v: result.totalClusters, i: Layers, c: "#FF6B00" }, { l: "Total Clones", v: result.totalClones, i: Copy, c: "#FF8C00" }, { l: "Vectors Scanned", v: result.scanStats.pointsScanned, i: BarChart3, c: "#A3A3A3" }, { l: "Time", v: `${(result.scanStats.elapsedMs / 1000).toFixed(1)}s`, i: Zap, c: "#FFA800" }].map(s => (
            <div key={s.l} className="p-5 rounded-2xl bg-[#050505] border border-[#1A1A1A]">
              <div className="flex items-center gap-2 mb-2"><s.i size={14} style={{ color: s.c }} /><span className="text-[10px] font-mono text-[#737373] uppercase tracking-widest">{s.l}</span></div>
              <p className="text-2xl font-medium text-white">{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-24">
            <div className="relative mb-6"><div className="w-12 h-12 border-[2px] border-[#1A1A1A] border-t-[#FF6B00] rounded-full animate-spin" /></div>
            <p className="text-[13px] text-[#A3A3A3]">Scanning vector space for semantic clones...</p>
          </div>
        ) : hasScanned && result && result.clusters.length === 0 ? (
          <div className="flex flex-col items-center py-24 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center mb-6"><GitCompare size={24} className="text-[#FF6B00]" /></div>
            <p className="text-[15px] font-medium text-white mb-2">No semantic clones found!</p>
            <p className="text-[13px] text-[#737373]">Try lowering the similarity threshold.</p>
          </div>
        ) : result?.clusters.map((c, i) => <ClusterCard key={c.id} cluster={c} index={i} />)}
      </div>

      {/* Empty state */}
      {!hasScanned && (
        <div className="flex flex-col items-center justify-center py-24 animate-fadeIn">
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-full bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center"><GitCompare size={32} className="text-[#404040]" /></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#FF6B00] flex items-center justify-center shadow-[0_0_10px_rgba(255,107,0,0.4)]"><Layers size={12} className="text-white" /></div>
          </div>
          <h2 className="text-[16px] font-medium text-white mb-3">Find Hidden Code Clones</h2>
          <p className="text-[13px] text-[#737373] max-w-md text-center mb-6 leading-relaxed">Uses Qdrant vector similarity to find semantically identical code — even with different variable names or formatting.</p>
          <div className="flex items-center gap-4 text-[12px] text-[#A3A3A3]">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#FF4500]" />≥95% Near Identical</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />≥90% High</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#FF8C00]" />≥85% Semantic</span>
          </div>
        </div>
      )}
    </div>
  );
}
