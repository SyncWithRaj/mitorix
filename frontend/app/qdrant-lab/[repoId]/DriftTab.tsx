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
  const color = value >= 60 ? "#FF4500" : value >= 30 ? "#FF6B00" : value >= 10 ? "#FF8C00" : "#FFA800";
  return (
    <div className="relative w-28 h-16">
      <svg className="w-28 h-16" viewBox="0 0 100 55">
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" />
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={o} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center"><span className="text-2xl font-bold" style={{ color }}>{value}%</span></div>
    </div>
  );
}

function StatusBadge({ status }: { status: DriftItem["status"] }) {
  const cfg = { modified: { icon: RefreshCw, label: "MODIFIED", color: "#FF8C00" }, deleted: { icon: XCircle, label: "DELETED", color: "#FF4500" }, new: { icon: Plus, label: "NEW", color: "#FF6B00" } }[status];
  const Icon = cfg.icon;
  return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider" style={{ color: cfg.color, backgroundColor: `${cfg.color}15` }}><Icon size={10} />{cfg.label}</span>;
}

function FileDriftBar({ summary }: { summary: FileDriftSummary }) {
  const color = summary.avgDrift >= 60 ? "#FF4500" : summary.avgDrift >= 30 ? "#FF6B00" : summary.avgDrift >= 10 ? "#FF8C00" : "#FFA800";
  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-[#0A0A0A] transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-[#E5E5E5] truncate group-hover:text-[#FF6B00] transition-colors">{summary.filePath}</p>
        <p className="text-[10px] text-[#737373] mt-0.5">{summary.entityCount} entities · max {summary.maxDrift}% drift</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-24 h-1 bg-[#1A1A1A] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${summary.avgDrift}%`, backgroundColor: color }} /></div>
        <span className="text-[11px] font-mono font-medium w-8 text-right" style={{ color }}>{summary.avgDrift}%</span>
      </div>
    </div>
  );
}

function DriftItemRow({ item, index }: { item: DriftItem; index: number }) {
  const c = item.driftScore >= 60 ? "#FF4500" : item.driftScore >= 30 ? "#FF6B00" : item.driftScore >= 10 ? "#FF8C00" : "#FFA800";
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-[#1A1A1A] bg-[#050505] hover:border-[#FF6B00]/30 transition-all animate-fadeInUp" style={{ animationDelay: `${index * 30}ms` }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-medium shrink-0 border" style={{ color: c, borderColor: `${c}30`, backgroundColor: `${c}10` }}>{item.driftScore}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1"><p className="text-[14px] font-medium text-[#E5E5E5] truncate">{item.entity.name.substring(0, 60)}</p><StatusBadge status={item.status} /></div>
        <p className="text-[11px] font-mono text-[#737373] truncate">{item.entity.filePath}{item.entity.startLine > 0 && <span>:{item.entity.startLine}–{item.entity.endLine}</span>}</p>
      </div>
      {item.matchScore !== undefined && <div className="text-right shrink-0"><p className="text-[9px] text-[#A3A3A3] uppercase tracking-widest mb-0.5">Match</p><p className="text-[13px] font-mono text-[#737373]">{item.matchScore}%</p></div>}
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
      <div className="mb-6 p-4 rounded-xl border border-[#FF6B00]/20 bg-[#FF6B00]/5">
        <p className="text-[12px] text-[#A3A3A3]"><span className="text-[#FF6B00] font-medium">How it works:</span> Index your repo → make code changes → re-index (re-process from dashboard). Each index creates a version fingerprint in Qdrant. Then compare two versions to see which functions semantically changed — even if git diff shows minor edits.</p>
      </div>

      {/* Version Selector */}
      <div className="mb-8 p-6 rounded-2xl border border-[#1A1A1A] bg-[#0A0A0A]">
        {loadingVersions ? (
          <div className="flex items-center justify-center py-4 gap-3"><Loader2 size={16} className="animate-spin text-[#737373]" /><span className="text-sm text-[#737373]">Loading version history...</span></div>
        ) : fingerprints.length < 2 && crossRepoTargets.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-[#050505] border border-[#1A1A1A] flex items-center justify-center mx-auto mb-4"><GitBranch size={24} className="text-[#404040]" /></div>
            <h3 className="text-lg font-medium text-white mb-2">Not Enough Versions</h3>
            <p className="text-[13px] text-[#737373] max-w-md mx-auto">Drift detection requires at least 2 indexed versions. Re-process your repo from the dashboard after making code changes to create a new version.</p>
            <p className="text-[11px] text-[#404040] mt-4 font-mono">Versions found: {fingerprints.length} · Current: {currentFingerprint.substring(0, 12)}...</p>
          </div>
        ) : (
          <div className="flex items-end gap-6 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-mono text-[#737373] uppercase tracking-widest block mb-3">Old Version</label>
              <div className="relative">
                <select value={oldVersion} onChange={(e) => setOldVersion(e.target.value)} className="w-full appearance-none bg-[#050505] border border-[#1A1A1A] rounded-xl px-4 py-3.5 pr-10 text-[13px] text-[#E5E5E5] font-mono focus:outline-none focus:border-[#FF6B00] transition-colors cursor-pointer">
                  <option value="">Select...</option>
                  {fingerprints.map(fp => <option key={fp} value={fp}>{fp.substring(0, 16)}...{fp === currentFingerprint ? " (current)" : ""}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373] pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1A1A] text-[#737373] mb-2 shrink-0">→</div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-mono text-[#737373] uppercase tracking-widest block mb-3">New Version</label>
              <div className="relative">
                <select value={newVersion} onChange={(e) => setNewVersion(e.target.value)} className="w-full appearance-none bg-[#050505] border border-[#1A1A1A] rounded-xl px-4 py-3.5 pr-10 text-[13px] text-[#E5E5E5] font-mono focus:outline-none focus:border-[#FF6B00] transition-colors cursor-pointer">
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
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373] pointer-events-none" />
              </div>
            </div>
            <button onClick={runComparison} disabled={loading || !oldVersion || !newVersion}
              className="cursor-pointer flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF8C00] text-white text-[13px] font-medium transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed min-w-[180px]">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}{loading ? "Comparing..." : "Compare Versions"}
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-24">
          <div className="relative mb-6"><div className="w-12 h-12 border-[2px] border-[#1A1A1A] border-t-[#FF6B00] rounded-full animate-spin" /></div>
          <p className="text-[13px] text-[#A3A3A3]">Computing semantic drift across versions...</p>
        </div>
      )}

      {/* Results */}
      {report && !loading && (
        <div className="animate-fadeIn space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
            <div className="sm:col-span-2 p-8 rounded-2xl border border-[#1A1A1A] bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B00]/5 blur-3xl rounded-full pointer-events-none" />
              <p className="text-[10px] font-mono text-[#737373] uppercase tracking-widest mb-6 relative z-10">Overall Semantic Drift</p>
              <DriftGauge value={report.overallDrift} />
              <p className="text-[13px] text-[#A3A3A3] mt-4 text-center relative z-10">
                {report.overallDrift < 10 ? "Codebase is stable" : report.overallDrift < 30 ? "Moderate drift detected" : report.overallDrift < 60 ? "Significant semantic changes" : "High drift — major changes"}
              </p>
            </div>
            <div className="sm:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[{ l: "Modified", v: report.stats.modified, i: RefreshCw, c: "#FF6B00" }, { l: "Deleted", v: report.stats.deleted, i: Trash2, c: "#FF4500" }, { l: "Added", v: report.stats.added, i: Plus, c: "#FF8C00" },
                { l: "Unchanged", v: report.stats.unchanged, i: CheckCircle, c: "#A3A3A3" }, { l: "Old Entities", v: report.stats.totalOldEntities, i: BarChart3, c: "#737373" }, { l: "Time", v: `${(report.stats.elapsedMs / 1000).toFixed(1)}s`, i: Clock, c: "#FFA800" }
              ].map(s => (
                <div key={s.l} className="p-4 rounded-xl bg-[#050505] border border-[#1A1A1A]">
                  <div className="flex items-center gap-2 mb-2"><s.i size={12} style={{ color: s.c }} /><span className="text-[10px] font-mono text-[#737373] uppercase tracking-widest">{s.l}</span></div>
                  <p className="text-xl font-medium text-white">{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 p-1.5 bg-[#050505] rounded-xl border border-[#1A1A1A] w-fit">
            {[{ k: "items" as const, l: "Drift Items", c: report.items.length }, { k: "files" as const, l: "By File", c: report.fileSummaries.length }].map(t => (
              <button key={t.k} onClick={() => setActiveView(t.k)} className={`cursor-pointer px-5 py-2 rounded-lg text-[13px] font-medium transition-all ${activeView === t.k ? "bg-[#1A1A1A] text-white shadow-sm" : "text-[#737373] hover:text-[#E5E5E5]"}`}>
                {t.l} <span className="opacity-50">({t.c})</span>
              </button>
            ))}
          </div>

          {activeView === "items" ? (
            <div className="space-y-3">
              {report.items.length === 0 ? <div className="text-center py-16"><CheckCircle size={32} className="text-[#FF8C00] mx-auto mb-4" /><p className="text-[16px] font-medium text-white">No significant drift</p></div>
                : report.items.map((item, i) => <DriftItemRow key={`${item.entity.filePath}-${i}`} item={item} index={i} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#1A1A1A] bg-[#050505] overflow-hidden">
              {report.fileSummaries.length === 0 ? <div className="text-center py-16"><p className="text-[13px] text-[#A3A3A3]">No per-file drift data</p></div>
                : <div className="divide-y divide-[#1A1A1A] p-2">{report.fileSummaries.map(s => <FileDriftBar key={s.filePath} summary={s} />)}</div>}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasCompared && !loadingVersions && (fingerprints.length >= 2 || crossRepoTargets.length > 0) && (
        <div className="flex flex-col items-center justify-center py-24 animate-fadeIn">
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-full bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center"><Activity size={32} className="text-[#404040]" /></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#FF6B00] flex items-center justify-center shadow-[0_0_10px_rgba(255,107,0,0.4)]"><Clock size={12} className="text-white" /></div>
          </div>
          <h2 className="text-[16px] font-medium text-white mb-3">Track Semantic Evolution</h2>
          <p className="text-[13px] text-[#737373] max-w-md text-center leading-relaxed">Select two version fingerprints above. Qdrant will compute vector distances to reveal semantic changes that text diffs can&apos;t capture.</p>
        </div>
      )}
    </div>
  );
}
