"use client";

import { useState, useCallback, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
  ArrowLeft,
  Loader2,
  GitBranch,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Trash2,
  RefreshCw,
  Zap,
  BarChart3,
  FileCode,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────
interface DriftEntity {
  name: string;
  filePath: string;
  type: string;
  startLine: number;
  endLine: number;
}

interface DriftItem {
  entity: DriftEntity;
  driftScore: number;
  status: "modified" | "deleted" | "new";
  matchScore?: number;
}

interface FileDriftSummary {
  filePath: string;
  avgDrift: number;
  entityCount: number;
  maxDrift: number;
}

interface DriftReport {
  items: DriftItem[];
  fileSummaries: FileDriftSummary[];
  overallDrift: number;
  stats: {
    totalOldEntities: number;
    totalNewEntities: number;
    modified: number;
    deleted: number;
    added: number;
    unchanged: number;
    elapsedMs: number;
  };
  versions: {
    old: string;
    new: string;
  };
}

// ─── Drift Gauge ─────────────────────────────────────────────────────────────
function DriftGauge({ value }: { value: number }) {
  const radius = 40;
  const circumference = Math.PI * radius; // Half circle
  const offset = circumference - (value / 100) * circumference;
  const color =
    value >= 60
      ? "#da3633"
      : value >= 30
        ? "#f0883e"
        : value >= 10
          ? "#d29922"
          : "#2ea043";

  return (
    <div className="relative w-28 h-16">
      <svg className="w-28 h-16" viewBox="0 0 100 55">
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#21262d"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: DriftItem["status"] }) {
  const config = {
    modified: {
      icon: RefreshCw,
      label: "MODIFIED",
      color: "#f0883e",
      bg: "rgba(240,136,62,0.1)",
    },
    deleted: {
      icon: XCircle,
      label: "DELETED",
      color: "#da3633",
      bg: "rgba(218,54,51,0.1)",
    },
    new: {
      icon: Plus,
      label: "NEW",
      color: "#2ea043",
      bg: "rgba(46,160,67,0.1)",
    },
  }[status];

  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider"
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      <Icon size={10} />
      {config.label}
    </span>
  );
}

// ─── File Drift Bar ──────────────────────────────────────────────────────────
function FileDriftBar({ summary }: { summary: FileDriftSummary }) {
  const color =
    summary.avgDrift >= 60
      ? "#da3633"
      : summary.avgDrift >= 30
        ? "#f0883e"
        : summary.avgDrift >= 10
          ? "#d29922"
          : "#2ea043";

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#161b22]/50 transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-[#c9d1d9] truncate group-hover:text-[#58a6ff] transition-colors">
          {summary.filePath}
        </p>
        <p className="text-[10px] text-[#6e7681]">
          {summary.entityCount} entities · max {summary.maxDrift}% drift
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-20 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${summary.avgDrift}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <span
          className="text-[11px] font-mono font-semibold w-10 text-right"
          style={{ color }}
        >
          {summary.avgDrift}%
        </span>
      </div>
    </div>
  );
}

// ─── Drift Item Row ──────────────────────────────────────────────────────────
function DriftItemRow({
  item,
  index,
}: {
  item: DriftItem;
  index: number;
}) {
  const driftColor =
    item.driftScore >= 60
      ? "#da3633"
      : item.driftScore >= 30
        ? "#f0883e"
        : item.driftScore >= 10
          ? "#d29922"
          : "#2ea043";

  return (
    <div
      className="flex items-center gap-4 p-3 rounded-xl border border-[#30363d]/40 bg-[#0d1117]/60 hover:border-[#484f58] transition-all animate-fadeInUp"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Drift score circle */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border"
        style={{
          color: driftColor,
          borderColor: `${driftColor}40`,
          backgroundColor: `${driftColor}10`,
        }}
      >
        {item.driftScore}
      </div>

      {/* Entity info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white truncate">
            {item.entity.name.substring(0, 60)}
          </p>
          <StatusBadge status={item.status} />
        </div>
        <p className="text-[11px] font-mono text-[#6e7681] truncate">
          {item.entity.filePath}
          {item.entity.startLine > 0 && (
            <span>
              :{item.entity.startLine}–{item.entity.endLine}
            </span>
          )}
        </p>
      </div>

      {/* Match score */}
      {item.matchScore !== undefined && (
        <div className="text-right shrink-0">
          <p className="text-[10px] text-[#6e7681] uppercase tracking-wider">
            Match
          </p>
          <p className="text-sm font-mono text-[#8b949e]">{item.matchScore}%</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DriftPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);
  const router = useRouter();

  const [loadingVersions, setLoadingVersions] = useState(true);
  const [fingerprints, setFingerprints] = useState<string[]>([]);
  const [currentFingerprint, setCurrentFingerprint] = useState("");
  const [oldVersion, setOldVersion] = useState("");
  const [newVersion, setNewVersion] = useState("");

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DriftReport | null>(null);
  const [hasCompared, setHasCompared] = useState(false);

  const [activeTab, setActiveTab] = useState<"items" | "files">("items");

  // Load available versions
  useEffect(() => {
    const loadVersions = async () => {
      try {
        const res = await api.get(`/drift/${repoId}/versions`);
        if (res.data.success) {
          setFingerprints(res.data.fingerprints);
          setCurrentFingerprint(res.data.currentFingerprint);
          // Auto-select if exactly 2 versions
          if (res.data.fingerprints.length >= 2) {
            setOldVersion(res.data.fingerprints[0]);
            setNewVersion(
              res.data.fingerprints[res.data.fingerprints.length - 1]
            );
          }
        }
      } catch (err: any) {
        console.error("Failed to load versions:", err);
        toast.error("Failed to load version history");
      } finally {
        setLoadingVersions(false);
      }
    };
    loadVersions();
  }, [repoId]);

  const runComparison = useCallback(async () => {
    if (!oldVersion || !newVersion) {
      toast.error("Select both versions to compare");
      return;
    }
    if (oldVersion === newVersion) {
      toast.error("Select two different versions");
      return;
    }

    setLoading(true);
    setHasCompared(true);

    try {
      const res = await api.get(`/drift/${repoId}/compare`, {
        params: { old: oldVersion, new: newVersion },
      });

      if (res.data.success) {
        setReport(res.data);
      }
    } catch (err: any) {
      console.error("Drift comparison failed:", err);
      toast.error(
        err.response?.data?.message || "Drift comparison failed"
      );
    } finally {
      setLoading(false);
    }
  }, [repoId, oldVersion, newVersion]);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#c9d1d9] pt-24 pb-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-[#a371f7]/5 via-[#58a6ff]/3 to-transparent blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-[#d29922]/5 to-transparent blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(`/dashboard`)}
            className="p-2 rounded-xl text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#a371f7]/20 to-[#d29922]/20 border border-[#a371f7]/20 flex items-center justify-center">
                <Activity size={18} className="text-[#a371f7]" />
              </div>
              Codebase Drift Detector
            </h1>
            <p className="text-sm text-[#8b949e] mt-1">
              Compare code semantics across versions — detect drift that git
              diff can&apos;t see
            </p>
          </div>
        </div>

        {/* Version Selector */}
        <div className="mb-8 p-6 rounded-2xl border border-[#30363d]/60 bg-[#161b22]/40 backdrop-blur-sm">
          {loadingVersions ? (
            <div className="flex items-center justify-center py-4 gap-3">
              <Loader2 size={16} className="animate-spin text-[#8b949e]" />
              <span className="text-sm text-[#8b949e]">
                Loading version history from Qdrant...
              </span>
            </div>
          ) : fingerprints.length < 2 ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-[#21262d] border border-[#30363d] flex items-center justify-center mx-auto mb-4">
                <GitBranch size={24} className="text-[#484f58]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Not Enough Versions
              </h3>
              <p className="text-sm text-[#8b949e] max-w-md mx-auto">
                Drift detection requires at least 2 indexed versions of your
                repository. Re-index your repo after making changes to create a
                new version snapshot in Qdrant.
              </p>
              <p className="text-xs text-[#6e7681] mt-3 font-mono">
                Current versions found: {fingerprints.length} ·
                Current fingerprint: {currentFingerprint.substring(0, 12)}...
              </p>
            </div>
          ) : (
            <div className="flex items-end gap-4 flex-wrap">
              {/* Old version */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-mono text-[#6e7681] uppercase tracking-widest block mb-2">
                  Old Version
                </label>
                <div className="relative">
                  <select
                    value={oldVersion}
                    onChange={(e) => setOldVersion(e.target.value)}
                    className="w-full appearance-none bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 pr-10 text-sm text-white font-mono focus:outline-none focus:border-[#58a6ff] transition-colors cursor-pointer"
                  >
                    <option value="">Select version...</option>
                    {fingerprints.map((fp) => (
                      <option key={fp} value={fp}>
                        {fp.substring(0, 16)}...
                        {fp === currentFingerprint ? " (current)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6e7681] pointer-events-none"
                  />
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center w-10 h-10 text-[#6e7681] pb-1">
                →
              </div>

              {/* New version */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-mono text-[#6e7681] uppercase tracking-widest block mb-2">
                  New Version
                </label>
                <div className="relative">
                  <select
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    className="w-full appearance-none bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 pr-10 text-sm text-white font-mono focus:outline-none focus:border-[#58a6ff] transition-colors cursor-pointer"
                  >
                    <option value="">Select version...</option>
                    {fingerprints.map((fp) => (
                      <option key={fp} value={fp}>
                        {fp.substring(0, 16)}...
                        {fp === currentFingerprint ? " (current)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6e7681] pointer-events-none"
                  />
                </div>
              </div>

              {/* Compare button */}
              <button
                onClick={runComparison}
                disabled={loading || !oldVersion || !newVersion}
                className="cursor-pointer flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#a371f7] to-[#8957e5] text-white text-sm font-bold transition-all hover:shadow-[0_0_25px_rgba(163,113,247,0.3)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Zap size={16} />
                )}
                {loading ? "Comparing..." : "Compare Versions"}
              </button>
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="w-14 h-14 border-[3px] border-[#30363d] border-t-[#a371f7] rounded-full animate-spin" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#a371f7]/20 blur-sm" />
            </div>
            <p className="text-sm text-[#8b949e] font-medium">
              Computing semantic drift across versions...
            </p>
            <p className="text-xs text-[#6e7681] mt-1">
              Comparing vectors in Qdrant to detect meaning changes
            </p>
          </div>
        )}

        {/* Results */}
        {report && !loading && (
          <div className="animate-fadeIn space-y-6">
            {/* Overall drift gauge + stats */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {/* Gauge */}
              <div className="sm:col-span-2 p-6 rounded-2xl border border-[#30363d]/60 bg-[#161b22]/40 flex flex-col items-center justify-center">
                <p className="text-[10px] font-mono text-[#6e7681] uppercase tracking-widest mb-3">
                  Overall Semantic Drift
                </p>
                <DriftGauge value={report.overallDrift} />
                <p className="text-xs text-[#8b949e] mt-3 text-center">
                  {report.overallDrift < 10
                    ? "Codebase is stable — minimal semantic changes"
                    : report.overallDrift < 30
                      ? "Moderate drift — some functions have evolved"
                      : report.overallDrift < 60
                        ? "Significant drift — major semantic changes detected"
                        : "High drift — codebase has substantially changed"}
                </p>
              </div>

              {/* Stats */}
              <div className="sm:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: "Modified",
                    value: report.stats.modified,
                    icon: RefreshCw,
                    color: "#f0883e",
                  },
                  {
                    label: "Deleted",
                    value: report.stats.deleted,
                    icon: Trash2,
                    color: "#da3633",
                  },
                  {
                    label: "Added",
                    value: report.stats.added,
                    icon: Plus,
                    color: "#2ea043",
                  },
                  {
                    label: "Unchanged",
                    value: report.stats.unchanged,
                    icon: CheckCircle,
                    color: "#8b949e",
                  },
                  {
                    label: "Old Entities",
                    value: report.stats.totalOldEntities,
                    icon: BarChart3,
                    color: "#58a6ff",
                  },
                  {
                    label: "Time",
                    value: `${(report.stats.elapsedMs / 1000).toFixed(1)}s`,
                    icon: Clock,
                    color: "#a371f7",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-3 rounded-xl bg-[#0d1117]/60 border border-[#30363d]/40"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <stat.icon size={12} style={{ color: stat.color }} />
                      <span className="text-[9px] font-mono text-[#6e7681] uppercase tracking-widest">
                        {stat.label}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-[#161b22]/60 rounded-xl border border-[#30363d]/40 w-fit">
              {[
                { key: "items" as const, label: "Drift Items", count: report.items.length },
                { key: "files" as const, label: "By File", count: report.fileSummaries.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`cursor-pointer px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.key
                      ? "bg-[#30363d] text-white shadow-sm"
                      : "text-[#8b949e] hover:text-[#c9d1d9]"
                  }`}
                >
                  {tab.label}{" "}
                  <span className="opacity-50">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* Content */}
            {activeTab === "items" ? (
              <div className="space-y-2">
                {report.items.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle
                      size={32}
                      className="text-[#2ea043] mx-auto mb-3"
                    />
                    <p className="text-lg font-medium text-white">
                      No significant drift detected
                    </p>
                    <p className="text-sm text-[#8b949e]">
                      The codebase semantics are stable between these versions
                    </p>
                  </div>
                ) : (
                  report.items.map((item, index) => (
                    <DriftItemRow
                      key={`${item.entity.filePath}-${item.entity.startLine}-${index}`}
                      item={item}
                      index={index}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-[#30363d]/60 bg-[#0d1117]/60 overflow-hidden">
                {report.fileSummaries.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle
                      size={32}
                      className="text-[#2ea043] mx-auto mb-3"
                    />
                    <p className="text-sm text-[#8b949e]">
                      No per-file drift data available
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#30363d]/30">
                    {report.fileSummaries.map((summary) => (
                      <FileDriftBar key={summary.filePath} summary={summary} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state (before comparison, only if versions exist) */}
        {!hasCompared && !loadingVersions && fingerprints.length >= 2 && (
          <div className="flex flex-col items-center justify-center py-16 animate-fadeIn">
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-[#30363d] flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <Activity size={40} className="text-[#30363d]" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#a371f7] to-[#d29922] flex items-center justify-center shadow-lg">
                <Clock size={14} className="text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Track Semantic Evolution
            </h2>
            <p className="text-sm text-[#8b949e] max-w-md text-center mb-4">
              Select two version fingerprints to compare. Qdrant will compute
              vector distances between the same entities across time, revealing
              semantic changes that text diffs can&apos;t capture.
            </p>
            <div className="flex items-center gap-6 text-xs text-[#6e7681]">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#da3633]" />
                High Drift (≥60%)
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#f0883e]" />
                Moderate (30-59%)
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#d29922]" />
                Low (10-29%)
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#2ea043]" />
                Stable (&lt;10%)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
