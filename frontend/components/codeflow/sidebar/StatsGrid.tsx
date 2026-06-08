"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";

const REAL_CODE_EXTS = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "py",
  "pyw",
  "pyi",
  "java",
  "go",
  "rb",
  "php",
  "rs",
  "c",
  "cpp",
  "cc",
  "h",
  "hpp",
  "cs",
  "swift",
  "kt",
  "kts",
  "scala",
  "ex",
  "exs",
  "lua",
  "sh",
  "bash",
]);

export default function StatsGrid() {
  const {
    analysisData,
    setShowUnusedModal,
    codeFilterMode,
    filteredFiles,
    filteredConnections,
    highlightLinks,
    setHighlightLinks,
    relationFilters,
    setRelationFilters,
  } = useCodeflow();

  if (!analysisData) return null;

  const { stats } = analysisData;

  const filteredLangs = (stats.languages || []).filter((lang: any) =>
    REAL_CODE_EXTS.has(lang.ext.toLowerCase())
  );
  const realLoc = filteredLangs.reduce((sum: number, lang: any) => sum + lang.lines, 0);

  const filesCount = codeFilterMode === "all" ? stats.files : filteredFiles.length;
  const functionsCount =
    codeFilterMode === "all"
      ? stats.functions
      : filteredFiles.reduce((sum, f) => sum + (f.functions?.length || 0), 0);
  const visibleLinksCount = React.useMemo(() => {
    const baseConns = codeFilterMode === "all" ? analysisData.connections : filteredConnections;
    
    return baseConns.filter(c => {
      const t = (c.type || "").toLowerCase();
      if (t.includes("call") && !relationFilters.calls) return false;
      if (t.includes("access") && !relationFilters.accesses) return false;
      if ((t.includes("import") || t.includes("export")) && !relationFilters.imports) return false;
      if (t.includes("handle") && !relationFilters.handles) return false;
      return true;
    }).length;
  }, [analysisData.connections, filteredConnections, codeFilterMode, relationFilters]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 flex flex-col items-center justify-center hover:bg-[#1a1a1a] transition-colors">
          <div className="text-xl font-bold text-[#e5e5e5] font-mono">{filesCount}</div>
          <div className="text-[10px] uppercase text-[#737373] font-bold tracking-wider mt-1">
            Files
          </div>
        </div>
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 flex flex-col items-center justify-center hover:bg-[#1a1a1a] transition-colors">
          <div className="text-xl font-bold text-[#e5e5e5] font-mono">{functionsCount}</div>
          <div className="text-[10px] uppercase text-[#737373] font-bold tracking-wider mt-1">
            Functions
          </div>
        </div>
        <div
          className={`border rounded-lg p-3 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer select-none ${
            highlightLinks
              ? "bg-[#ff6b00]/10 border-[#ff6b00] shadow-[0_0_12px_rgba(255,107,0,0.12)] scale-[1.03]"
              : "bg-[#0a0a0a] border-[#1a1a1a] hover:bg-[#1a1a1a] hover:border-[#ff6b00]/20"
          }`}
          onClick={() => setHighlightLinks(!highlightLinks)}
          title="Click to toggle link highlighting in the graph"
        >
          <div
            className={`text-xl font-bold font-mono transition-colors ${highlightLinks ? "text-[#ff6b00]" : "text-[#e5e5e5]"}`}
          >
            {visibleLinksCount}
          </div>
          <div className="flex flex-col items-center gap-0.5 mt-1">
            <span className="text-[10px] uppercase text-[#737373] font-bold tracking-wider">
              Links
            </span>
            <span
              className={`text-[8px] px-1.5 py-0.5 rounded-full transition-all scale-90 whitespace-nowrap ${
                highlightLinks ? "bg-[#ff6b00]/20 text-[#ff6b00]" : "bg-[#1a1a1a] text-[#737373]"
              }`}
            >
              {highlightLinks ? "Highlighted" : "Click to highlight"}
            </span>
          </div>
        </div>
        <div
          className={`bg-[#0a0a0a] border rounded-lg p-3 flex flex-col items-center justify-center transition-colors ${
            stats.dead > 10
              ? "border-[#ff4500] bg-[rgba(255,69,0,0.05)] hover:bg-[rgba(255,69,0,0.1)]"
              : "border-[#1a1a1a] hover:bg-[#1a1a1a]"
          }`}
          style={{ cursor: stats.dead > 0 ? "pointer" : "default" }}
          onClick={() => {
            console.log("[StatsGrid] Clicked Unused box. stats.dead =", stats.dead);
            if (stats.dead > 0) {
              console.log("[StatsGrid] Setting showUnusedModal to true");
              setShowUnusedModal(true);
            }
          }}
        >
          <div
            className={`text-xl font-bold font-mono ${stats.dead > 10 ? "text-[#ff4500]" : "text-[#e5e5e5]"}`}
          >
            {stats.dead}
          </div>
          <div className="flex flex-col items-center gap-0.5 mt-1">
            <span className="text-[10px] uppercase text-[#737373] font-bold tracking-wider">
              Unused
            </span>
            {stats.dead > 0 && (
              <span className="text-[8px] bg-[#1a1a1a] text-[#e5e5e5] px-1.5 py-0.5 rounded-full whitespace-nowrap scale-90">
                Click to view
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 flex flex-col items-center justify-center hover:bg-[#1a1a1a] transition-colors gap-1">
        <div className="text-2xl font-bold text-[#ff6b00] font-mono">
          {stats.loc ? stats.loc.toLocaleString() : "0"}
        </div>
        <div className="text-[10px] uppercase text-[#737373] font-bold tracking-wider">
          Total Lines of Code
        </div>

        {/* Actual Programming Code Lines */}
        <div className="w-full border-t border-[#1a1a1a] mt-2 pt-2 flex flex-col items-center justify-center">
          <div className="text-lg font-bold text-[#ff8c00] font-mono">
            {realLoc ? realLoc.toLocaleString() : "0"}
          </div>
          <div className="text-[9px] uppercase text-[#737373] font-bold tracking-wider mt-0.5">
            Actual Programming LOC
          </div>
        </div>
      </div>

      {highlightLinks && (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 flex flex-col gap-2 transition-colors mt-2">
          <div className="text-[10px] uppercase text-[#737373] font-bold tracking-wider text-center border-b border-[#1a1a1a] pb-2 mb-1 flex items-center justify-between">
            <span>Filter Relations</span>
            <span className="text-[8px] bg-[#1a1a1a] text-[#737373] px-1.5 py-0.5 rounded-sm">
              Click to toggle
            </span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-1 text-xs font-mono">
            <button
              onClick={() => setRelationFilters((p) => ({ ...p, accesses: !p.accesses }))}
              className={`flex items-center gap-1.5 p-1 rounded transition-colors ${
                relationFilters.accesses ? "hover:bg-[#ef4444]/10" : "opacity-40 hover:opacity-80"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full bg-[#ef4444] ${relationFilters.accesses ? "shadow-[0_0_8px_rgba(239,68,68,0.5)]" : ""}`}></span>
              <span className={relationFilters.accesses ? "text-[#e5e5e5]" : "text-[#737373] line-through"}>Access</span>
            </button>
            <button
              onClick={() => setRelationFilters((p) => ({ ...p, calls: !p.calls }))}
              className={`flex items-center gap-1.5 p-1 rounded transition-colors ${
                relationFilters.calls ? "hover:bg-[#3b82f6]/10" : "opacity-40 hover:opacity-80"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full bg-[#3b82f6] ${relationFilters.calls ? "shadow-[0_0_8px_rgba(59,130,246,0.5)]" : ""}`}></span>
              <span className={relationFilters.calls ? "text-[#e5e5e5]" : "text-[#737373] line-through"}>Call</span>
            </button>
            <button
              onClick={() => setRelationFilters((p) => ({ ...p, imports: !p.imports }))}
              className={`flex items-center gap-1.5 p-1 rounded transition-colors ${
                relationFilters.imports ? "hover:bg-[#22c55e]/10" : "opacity-40 hover:opacity-80"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full bg-[#22c55e] ${relationFilters.imports ? "shadow-[0_0_8px_rgba(34,197,94,0.5)]" : ""}`}></span>
              <span className={relationFilters.imports ? "text-[#e5e5e5]" : "text-[#737373] line-through"}>Import</span>
            </button>
            <button
              onClick={() => setRelationFilters((p) => ({ ...p, handles: !p.handles }))}
              className={`flex items-center gap-1.5 p-1 rounded transition-colors ${
                relationFilters.handles ? "hover:bg-[#eab308]/10" : "opacity-40 hover:opacity-80"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full bg-[#eab308] ${relationFilters.handles ? "shadow-[0_0_8px_rgba(234,179,8,0.5)]" : ""}`}></span>
              <span className={relationFilters.handles ? "text-[#e5e5e5]" : "text-[#737373] line-through"}>Handle</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
