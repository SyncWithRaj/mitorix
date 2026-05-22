"use client";

import { useState, useCallback, useEffect } from "react";
import api from "@/lib/axios";
import { Loader2, GitBranch, RefreshCw, Plus, Trash2, Zap, BarChart3, Clock, CheckCircle, XCircle, ChevronDown, Activity } from "lucide-react";
import toast from "react-hot-toast";

interface DriftEntity { name: string; filePath: string; type: string; startLine: number; endLine: number; }
interface DriftItem { entity: DriftEntity; driftScore: number; status: "modified" | "deleted" | "new"; matchScore?: number; }
interface FileDriftSummary { filePath: string; avgDrift: number; entityCount: number; maxDrift: number; }
interface DriftReport {
  items: DriftItem[]; fileSummaries: FileDriftSummary[]; overallDrift: number;
  stats: { totalOldEntities: number; totalNewEntities: number; modified: number; deleted: number; added: number; unchanged: number; elapsedMs: number };
  versions: { old: string; new: string };
}

function DriftGauge({ value }: { value: number }) {
  const r = 40, c = Math.PI * r, o = c - (value / 100) * c;
  const color = value >= 60 ? "#da3633" : value >= 30 ? "#f0883e" : value >= 10 ? "#d29922" : "#2ea043";
  return (
    <div className="relative w-28 h-16">
      <svg className="w-28 h-16" viewBox="0 0 100 55">
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#21262d" strokeWidth="6" strokeLinecap="round" />
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={o} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center"><span className="text-2xl font-bold" style={{ color }}>{value}%</span></div>
    </div>
  );
}

function StatusBadge({ status }: { status: DriftItem["status"] }) {
  const cfg = { modified: { icon: RefreshCw, label: "MODIFIED", color: "#f0883e" }, deleted: { icon: XCircle, label: "DELETED", color: "#da3633" }, new: { icon: Plus, label: "NEW", color: "#2ea043" } }[status];
  const Icon = cfg.icon;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider" style={{ color: cfg.color, backgroundColor: `${cfg.color}15` }}><Icon size={10} />{cfg.label}</span>;
}

function FileDriftBar({ summary }: { summary: FileDriftSummary }) {
  const color = summary.avgDrift >= 60 ? "#da3633" : summary.avgDrift >= 30 ? "#f0883e" : summary.avgDrift >= 10 ? "#d29922" : "#2ea043";
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#161b22]/50 transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-[#c9d1d9] truncate group-hover:text-[#58a6ff] transition-colors">{summary.filePath}</p>
        <p className="text-[10px] text-[#6e7681]">{summary.entityCount} entities · max {summary.maxDrift}% drift</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-20 h-1.5 bg-[#21262d] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${summary.avgDrift}%`, backgroundColor: color }} /></div>
        <span className="text-[11px] font-mono font-semibold w-10 text-right" style={{ color }}>{summary.avgDrift}%</span>
      </div>
    </div>
  );
}

function DriftItemRow({ item, index }: { item: DriftItem; index: number }) {
  const c = item.driftScore >= 60 ? "#da3633" : item.driftScore >= 30 ? "#f0883e" : item.driftScore >= 10 ? "#d29922" : "#2ea043";
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl border border-[#30363d]/40 bg-[#0d1117]/60 hover:border-[#484f58] transition-all animate-fadeInUp" style={{ animationDelay: `${index * 30}ms` }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border" style={{ color: c, borderColor: `${c}40`, backgroundColor: `${c}10` }}>{item.driftScore}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2"><p className="text-sm font-medium text-white truncate">{item.entity.name.substring(0, 60)}</p><StatusBadge status={item.status} /></div>
        <p className="text-[11px] font-mono text-[#6e7681] truncate">{item.entity.filePath}{item.entity.startLine > 0 && <span>:{item.entity.startLine}–{item.entity.endLine}</span>}</p>
      </div>
      {item.matchScore !== undefined && <div className="text-right shrink-0"><p className="text-[10px] text-[#6e7681] uppercase">Match</p><p className="text-sm font-mono text-[#8b949e]">{item.matchScore}%</p></div>}
    </div>
  );
}

export default function DriftTab({ repoId }: { repoId: string }) {
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [fingerprints, setFingerprints] = useState<string[]>([]);
  const [currentFingerprint, setCurrentFingerprint] = useState("");
  const [crossRepoTargets, setCrossRepoTargets] = useState<Array<{repoId: string, repoName: string, fingerprint: string}>>([]);
  const [oldVersion, setOldVersion] = useState("");
  const [newVersion, setNewVersion] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DriftReport | null>(null);
  const [hasCompared, setHasCompared] = useState(false);
  const [activeView, setActiveView] = useState<"items" | "files">("items");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/drift/${repoId}/versions`);
        if (res.data.success) {
          setFingerprints(res.data.fingerprints);
          setCurrentFingerprint(res.data.currentFingerprint);
          setCrossRepoTargets(res.data.crossRepoTargets || []);
          if (res.data.fingerprints.length >= 2) { 
            setOldVersion(res.data.fingerprints[0]); 
            setNewVersion(res.data.fingerprints[res.data.fingerprints.length - 1]); 
          } else if (res.data.fingerprints.length === 1 && (res.data.crossRepoTargets || []).length > 0) {
            setOldVersion(res.data.fingerprints[0]);
            setNewVersion(`cross_${res.data.crossRepoTargets[0].repoId}_${res.data.crossRepoTargets[0].fingerprint}`);
          }
        }
      } catch { toast.error("Failed to load version history"); }
      finally { setLoadingVersions(false); }
    })();
  }, [repoId]);

  const runComparison = useCallback(async () => {
    if (!oldVersion || !newVersion) { toast.error("Select both versions"); return; }
    if (oldVersion === newVersion) { toast.error("Select two different versions"); return; }
    setLoading(true); setHasCompared(true);
    try {
      let queryNew = newVersion;
      let compareRepoId = undefined;
      
      if (newVersion.startsWith("cross_")) {
        const parts = newVersion.replace("cross_", "").split("_");
        compareRepoId = parts[0];
        queryNew = parts.slice(1).join("_");
      }

      const res = await api.get(`/drift/${repoId}/compare`, { params: { old: oldVersion, new: queryNew, compareRepoId } });
      if (res.data.success) setReport(res.data);
    } catch (err: any) { toast.error(err.response?.data?.message || "Drift comparison failed"); }
    finally { setLoading(false); }
  }, [repoId, oldVersion, newVersion]);

  return (
    <div>
      {/* How it works info */}
      <div className="mb-6 p-4 rounded-xl border border-[#a371f7]/20 bg-[#a371f7]/5">
        <p className="text-xs text-[#c9d1d9]"><span className="text-[#a371f7] font-semibold">How it works:</span> Index your repo → make code changes → re-index (re-process from dashboard). Each index creates a version fingerprint in Qdrant. Then compare two versions to see which functions semantically changed — even if git diff shows minor edits.</p>
      </div>

      {/* Version Selector */}
      <div className="mb-8 p-6 rounded-2xl border border-[#30363d]/60 bg-[#161b22]/40">
        {loadingVersions ? (
          <div className="flex items-center justify-center py-4 gap-3"><Loader2 size={16} className="animate-spin text-[#8b949e]" /><span className="text-sm text-[#8b949e]">Loading version history...</span></div>
        ) : fingerprints.length < 2 && crossRepoTargets.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-[#21262d] border border-[#30363d] flex items-center justify-center mx-auto mb-4"><GitBranch size={24} className="text-[#484f58]" /></div>
            <h3 className="text-lg font-semibold text-white mb-2">Not Enough Versions</h3>
            <p className="text-sm text-[#8b949e] max-w-md mx-auto">Drift detection requires at least 2 indexed versions. Re-process your repo from the dashboard after making code changes to create a new version.</p>
            <p className="text-xs text-[#6e7681] mt-3 font-mono">Versions found: {fingerprints.length} · Current: {currentFingerprint.substring(0, 12)}...</p>
          </div>
        ) : (
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-mono text-[#6e7681] uppercase tracking-widest block mb-2">Old Version</label>
              <div className="relative">
                <select value={oldVersion} onChange={(e) => setOldVersion(e.target.value)} className="w-full appearance-none bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 pr-10 text-sm text-white font-mono focus:outline-none focus:border-[#58a6ff] cursor-pointer">
                  <option value="">Select...</option>
                  {fingerprints.map(fp => <option key={fp} value={fp}>{fp.substring(0, 16)}...{fp === currentFingerprint ? " (current)" : ""}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6e7681] pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center justify-center w-10 h-10 text-[#6e7681] pb-1">→</div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-mono text-[#6e7681] uppercase tracking-widest block mb-2">New Version</label>
              <div className="relative">
                <select value={newVersion} onChange={(e) => setNewVersion(e.target.value)} className="w-full appearance-none bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 pr-10 text-sm text-white font-mono focus:outline-none focus:border-[#58a6ff] cursor-pointer">
                  <option value="">Select...</option>
                  {fingerprints.length > 0 && (
                    <optgroup label="This Repository">
                      {fingerprints.map(fp => <option key={fp} value={fp}>{fp.substring(0, 16)}...{fp === currentFingerprint ? " (current)" : ""}</option>)}
                    </optgroup>
                  )}
                  {crossRepoTargets.length > 0 && (
                    <optgroup label="Other Repositories (Cross-Repo Compare)">
                      {crossRepoTargets.map(t => (
                        <option key={`cross_${t.repoId}_${t.fingerprint}`} value={`cross_${t.repoId}_${t.fingerprint}`}>
                          {t.repoName} ({t.fingerprint.substring(0, 8)}...)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6e7681] pointer-events-none" />
              </div>
            </div>
            <button onClick={runComparison} disabled={loading || !oldVersion || !newVersion}
              className="cursor-pointer flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#a371f7] to-[#8957e5] text-white text-sm font-bold transition-all hover:shadow-[0_0_25px_rgba(163,113,247,0.3)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}{loading ? "Comparing..." : "Compare Versions"}
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-20">
          <div className="relative mb-6"><div className="w-14 h-14 border-[3px] border-[#30363d] border-t-[#a371f7] rounded-full animate-spin" /></div>
          <p className="text-sm text-[#8b949e]">Computing semantic drift across versions...</p>
        </div>
      )}

      {/* Results */}
      {report && !loading && (
        <div className="animate-fadeIn space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="sm:col-span-2 p-6 rounded-2xl border border-[#30363d]/60 bg-[#161b22]/40 flex flex-col items-center justify-center">
              <p className="text-[10px] font-mono text-[#6e7681] uppercase tracking-widest mb-3">Overall Semantic Drift</p>
              <DriftGauge value={report.overallDrift} />
              <p className="text-xs text-[#8b949e] mt-3 text-center">
                {report.overallDrift < 10 ? "Codebase is stable" : report.overallDrift < 30 ? "Moderate drift detected" : report.overallDrift < 60 ? "Significant semantic changes" : "High drift — major changes"}
              </p>
            </div>
            <div className="sm:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[{ l: "Modified", v: report.stats.modified, i: RefreshCw, c: "#f0883e" }, { l: "Deleted", v: report.stats.deleted, i: Trash2, c: "#da3633" }, { l: "Added", v: report.stats.added, i: Plus, c: "#2ea043" },
                { l: "Unchanged", v: report.stats.unchanged, i: CheckCircle, c: "#8b949e" }, { l: "Old Entities", v: report.stats.totalOldEntities, i: BarChart3, c: "#58a6ff" }, { l: "Time", v: `${(report.stats.elapsedMs / 1000).toFixed(1)}s`, i: Clock, c: "#a371f7" }
              ].map(s => (
                <div key={s.l} className="p-3 rounded-xl bg-[#0d1117]/60 border border-[#30363d]/40">
                  <div className="flex items-center gap-1.5 mb-1"><s.i size={12} style={{ color: s.c }} /><span className="text-[9px] font-mono text-[#6e7681] uppercase tracking-widest">{s.l}</span></div>
                  <p className="text-lg font-bold text-white">{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-1 p-1 bg-[#161b22]/60 rounded-xl border border-[#30363d]/40 w-fit">
            {[{ k: "items" as const, l: "Drift Items", c: report.items.length }, { k: "files" as const, l: "By File", c: report.fileSummaries.length }].map(t => (
              <button key={t.k} onClick={() => setActiveView(t.k)} className={`cursor-pointer px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeView === t.k ? "bg-[#30363d] text-white shadow-sm" : "text-[#8b949e] hover:text-[#c9d1d9]"}`}>
                {t.l} <span className="opacity-50">({t.c})</span>
              </button>
            ))}
          </div>

          {activeView === "items" ? (
            <div className="space-y-2">
              {report.items.length === 0 ? <div className="text-center py-12"><CheckCircle size={32} className="text-[#2ea043] mx-auto mb-3" /><p className="text-lg font-medium text-white">No significant drift</p></div>
                : report.items.map((item, i) => <DriftItemRow key={`${item.entity.filePath}-${i}`} item={item} index={i} />)}
            </div>
          ) : (
            <div className="rounded-xl border border-[#30363d]/60 bg-[#0d1117]/60 overflow-hidden">
              {report.fileSummaries.length === 0 ? <div className="text-center py-12"><p className="text-sm text-[#8b949e]">No per-file drift data</p></div>
                : <div className="divide-y divide-[#30363d]/30">{report.fileSummaries.map(s => <FileDriftBar key={s.filePath} summary={s} />)}</div>}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasCompared && !loadingVersions && (fingerprints.length >= 2 || crossRepoTargets.length > 0) && (
        <div className="flex flex-col items-center py-16 animate-fadeIn">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-[#30363d] flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]"><Activity size={40} className="text-[#30363d]" /></div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#a371f7] to-[#d29922] flex items-center justify-center shadow-lg"><Clock size={14} className="text-white" /></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Track Semantic Evolution</h2>
          <p className="text-sm text-[#8b949e] max-w-md text-center">Select two version fingerprints above. Qdrant will compute vector distances to reveal semantic changes that text diffs can&apos;t capture.</p>
        </div>
      )}
    </div>
  );
}
