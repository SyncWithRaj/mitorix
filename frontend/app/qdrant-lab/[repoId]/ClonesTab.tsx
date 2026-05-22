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
  const color = value >= 95 ? "#da3633" : value >= 90 ? "#f0883e" : value >= 85 ? "#d29922" : "#2ea043";
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#21262d" strokeWidth="3" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" className="transition-all duration-700 ease-out" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color }}>{value}%</span>
    </div>
  );
}

function EntityCard({ entity, similarity, isAnchor }: { entity: CloneEntity; similarity?: number; isAnchor?: boolean }) {
  const [showCode, setShowCode] = useState(false);
  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${isAnchor ? "bg-[#161b22]/80 border-[#58a6ff]/20" : "bg-[#0d1117]/60 border-[#30363d]/50 hover:border-[#484f58]"}`}>
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setShowCode(!showCode)}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isAnchor ? "bg-[#58a6ff]/15 border border-[#58a6ff]/30" : "bg-[#f0883e]/15 border border-[#f0883e]/30"}`}>
            {isAnchor ? <Target size={12} className="text-[#58a6ff]" /> : <Copy size={12} className="text-[#f0883e]" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate">{entity.name}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] uppercase">{entity.type}</span>
              {isAnchor && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#58a6ff]/10 text-[#58a6ff]">ANCHOR</span>}
            </div>
            <p className="text-[11px] font-mono text-[#6e7681] truncate">{entity.filePath}:{entity.startLine}–{entity.endLine}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {similarity !== undefined && <span className="text-xs font-mono text-[#f0883e] font-semibold">{similarity}% match</span>}
          <ChevronDown size={14} className={`text-[#6e7681] transition-transform ${showCode ? "rotate-180" : ""}`} />
        </div>
      </div>
      {showCode && entity.content && <div className="border-t border-[#30363d]/30"><pre className="text-[11px] font-mono text-[#c9d1d9] bg-[#010409] p-3 overflow-x-auto max-h-[180px] overflow-y-auto whitespace-pre-wrap break-words">{entity.content}</pre></div>}
    </div>
  );
}

function ClusterCard({ cluster, index }: { cluster: CloneCluster; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const severity = cluster.avgSimilarity >= 95 ? { label: "NEAR IDENTICAL", cls: "bg-[#da3633]/10 text-[#da3633] border-[#da3633]/20" }
    : cluster.avgSimilarity >= 90 ? { label: "HIGH SIMILARITY", cls: "bg-[#f0883e]/10 text-[#f0883e] border-[#f0883e]/20" }
    : { label: "SEMANTIC CLONE", cls: "bg-[#d29922]/10 text-[#d29922] border-[#d29922]/20" };

  return (
    <div className="rounded-2xl border border-[#30363d]/60 bg-[#0d1117]/80 overflow-hidden animate-fadeInUp transition-all hover:border-[#484f58]" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#161b22]/50 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <SimilarityRing value={cluster.avgSimilarity} />
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><GitCompare size={14} className="text-[#f0883e]" />{cluster.anchor.name}<span className="text-[#8b949e] font-normal">has {cluster.cloneCount} semantic {cluster.cloneCount === 1 ? "clone" : "clones"}</span></h3>
            <p className="text-xs text-[#6e7681] font-mono mt-0.5">{cluster.anchor.filePath} → {cluster.clones.map(c => c.filePath).join(", ")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-mono px-2 py-1 rounded-lg border ${severity.cls}`}>{severity.label}</span>
          <ChevronRight size={16} className={`text-[#6e7681] transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>
      {expanded && (
        <div className="border-t border-[#30363d]/30 p-4 space-y-3 bg-[#0d1117]/50">
          <p className="text-[10px] font-mono text-[#6e7681] uppercase tracking-widest">Anchor (Original)</p>
          <EntityCard entity={cluster.anchor} isAnchor />
          <div className="flex items-center gap-2 py-1"><div className="flex-1 h-px bg-[#30363d]/50" /><span className="text-[10px] font-mono text-[#6e7681]">CLONES ({cluster.cloneCount})</span><div className="flex-1 h-px bg-[#30363d]/50" /></div>
          {cluster.clones.map((clone, i) => <EntityCard key={`${clone.mongoId}-${i}`} entity={clone} similarity={clone.similarity} />)}
          <div className="mt-3 p-3 rounded-lg bg-[#d29922]/5 border border-[#d29922]/15">
            <p className="text-xs text-[#d29922] flex items-center gap-2"><AlertTriangle size={12} /><span className="font-semibold">Refactoring Suggestion:</span> Consider extracting shared logic into a reusable utility function.</p>
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
      <div className="mb-8 p-6 rounded-2xl border border-[#30363d]/60 bg-[#161b22]/40">
        <div className="flex items-end gap-6 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-mono text-[#8b949e] block mb-2">Similarity Threshold: <span className="text-[#f0883e] font-semibold">{threshold}%</span></label>
            <input type="range" min={60} max={99} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full h-1.5 bg-[#21262d] rounded-full appearance-none cursor-pointer accent-[#f0883e]" />
            <div className="flex justify-between text-[10px] text-[#6e7681] mt-1 font-mono"><span>60% (loose)</span><span>99% (strict)</span></div>
          </div>
          <button onClick={runDetection} disabled={loading} className="cursor-pointer flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#f0883e] to-[#da3633] text-white text-sm font-bold transition-all hover:shadow-[0_0_25px_rgba(240,136,62,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}{loading ? "Scanning..." : "Detect Clones"}
          </button>
        </div>
      </div>

      {/* Stats */}
      {result && !loading && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fadeIn">
          {[{ l: "Clone Clusters", v: result.totalClusters, i: Layers, c: "#f0883e" }, { l: "Total Clones", v: result.totalClones, i: Copy, c: "#da3633" }, { l: "Vectors Scanned", v: result.scanStats.pointsScanned, i: BarChart3, c: "#58a6ff" }, { l: "Time", v: `${(result.scanStats.elapsedMs / 1000).toFixed(1)}s`, i: Zap, c: "#2ea043" }].map(s => (
            <div key={s.l} className="p-4 rounded-xl bg-[#161b22]/60 border border-[#30363d]/40">
              <div className="flex items-center gap-2 mb-1"><s.i size={14} style={{ color: s.c }} /><span className="text-[10px] font-mono text-[#6e7681] uppercase tracking-widest">{s.l}</span></div>
              <p className="text-xl font-bold text-white">{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="relative mb-6"><div className="w-14 h-14 border-[3px] border-[#30363d] border-t-[#f0883e] rounded-full animate-spin" /></div>
            <p className="text-sm text-[#8b949e]">Scanning vector space for semantic clones...</p>
          </div>
        ) : hasScanned && result && result.clusters.length === 0 ? (
          <div className="flex flex-col items-center py-20 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-4"><GitCompare size={28} className="text-[#2ea043]" /></div>
            <p className="text-lg font-medium text-white mb-1">No semantic clones found! 🎉</p>
            <p className="text-sm text-[#8b949e]">Try lowering the similarity threshold.</p>
          </div>
        ) : result?.clusters.map((c, i) => <ClusterCard key={c.id} cluster={c} index={i} />)}
      </div>

      {/* Empty state */}
      {!hasScanned && (
        <div className="flex flex-col items-center py-16 animate-fadeIn">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-[#30363d] flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]"><GitCompare size={40} className="text-[#30363d]" /></div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#f0883e] to-[#da3633] flex items-center justify-center shadow-lg"><Layers size={14} className="text-white" /></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Find Hidden Code Clones</h2>
          <p className="text-sm text-[#8b949e] max-w-md text-center mb-4">Uses Qdrant vector similarity to find semantically identical code — even with different variable names or formatting.</p>
          <div className="flex items-center gap-3 text-xs text-[#6e7681]">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#da3633]" />≥95% Near Identical</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f0883e]" />≥90% High</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#d29922]" />≥85% Semantic</span>
          </div>
        </div>
      )}
    </div>
  );
}
