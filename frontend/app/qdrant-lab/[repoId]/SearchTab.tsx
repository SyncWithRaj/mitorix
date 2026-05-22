"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import api from "@/lib/axios";
import {
  Search, FileCode, Loader2, X, ChevronDown, Zap, Box, Braces,
  FileText, Route, Variable, Layers, Hash, ArrowUpRight, SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";

interface SearchResult {
  entityId: string; name: string; type: string; filePath: string;
  language: string; startLine: number; endLine: number; content: string;
  score: number; vectorScore: number; keywordScore: number;
  parameters?: string[]; returnType?: string;
}

interface SearchResponse {
  success: boolean; results: SearchResult[]; totalFound: number; query: string;
  facets: { types: Record<string, number>; languages: Record<string, number>; folders: Record<string, number> };
}

const TYPE_ICONS: Record<string, typeof FileCode> = {
  function: Braces, arrow: Braces, method: Braces, class: Box,
  interface: Layers, route: Route, variable: Variable, enum: Hash,
  export: ArrowUpRight, import: ArrowUpRight, typeAlias: Layers,
};

const TYPE_COLORS: Record<string, string> = {
  function: "#58a6ff", arrow: "#58a6ff", method: "#58a6ff", class: "#f0883e",
  interface: "#a371f7", route: "#2ea043", variable: "#79c0ff", enum: "#d29922",
  export: "#2ea043", import: "#8b949e", typeAlias: "#a371f7",
};

function ResultCard({ result, index }: { result: SearchResult; index: number }) {
  const Icon = TYPE_ICONS[result.type] || FileText;
  const color = TYPE_COLORS[result.type] || "#8b949e";
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round(result.score * 100);
  const barColor = pct >= 70 ? "from-[#2ea043] to-[#238636]" : pct >= 45 ? "from-[#d29922] to-[#bb8009]" : "from-[#8b949e] to-[#6e7681]";

  return (
    <div className="group relative rounded-xl border border-[#30363d]/60 bg-[#0d1117]/80 hover:border-[#58a6ff]/40 hover:bg-[#161b22]/90 transition-all duration-300 overflow-hidden animate-fadeInUp cursor-pointer"
      style={{ animationDelay: `${index * 40}ms` }} onClick={() => setExpanded(!expanded)}>
      <div className="absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: color }} />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}>
              <Icon size={15} style={{ color }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#58a6ff] transition-colors">{result.name}</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0" style={{ color, backgroundColor: `${color}15` }}>{result.type}</span>
              </div>
              <p className="text-xs text-[#8b949e] font-mono truncate mt-0.5">{result.filePath}<span className="text-[#6e7681]">:{result.startLine}–{result.endLine}</span></p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-[#21262d] rounded-full overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} /></div>
              <span className="text-[10px] font-mono text-[#8b949e] w-8 text-right">{pct}%</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-[#6e7681]">
              <span title="Vector similarity">V:{Math.round(result.vectorScore * 100)}%</span>
              <span title="Keyword relevance">K:{Math.round(result.keywordScore * 100)}%</span>
            </div>
          </div>
        </div>
        {(result.parameters?.length || result.returnType) && (
          <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-[#6e7681]">
            {result.parameters && result.parameters.length > 0 && <span className="px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d]/50">({result.parameters.join(", ")})</span>}
            {result.returnType && <span className="px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d]/50">→ {result.returnType}</span>}
          </div>
        )}
        {expanded && result.content && (
          <div className="mt-3"><pre className="text-[11px] font-mono text-[#c9d1d9] bg-[#010409] border border-[#30363d]/50 rounded-lg p-3 overflow-x-auto max-h-[200px] overflow-y-auto leading-relaxed whitespace-pre-wrap break-words">{result.content}</pre></div>
        )}
      </div>
    </div>
  );
}

function FilterPill({ label, count, active, onClick, color }: { label: string; count: number; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${active ? "bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30" : "bg-[#21262d]/50 text-[#8b949e] border-[#30363d]/50 hover:text-[#c9d1d9] hover:border-[#484f58]"}`}>
      {color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
      {label}<span className="text-[10px] opacity-60">({count})</span>
    </button>
  );
}

export default function SearchTab({ repoId }: { repoId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [facets, setFacets] = useState<SearchResponse["facets"] | null>(null);
  const [totalFound, setTotalFound] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const performSearch = useCallback(async (sq?: string, tf?: string | null, lf?: string | null) => {
    const q = sq ?? query;
    if (!q.trim()) return;
    setLoading(true); setHasSearched(true);
    const start = performance.now();
    try {
      const p: Record<string, string> = { q: q.trim() };
      const t = tf !== undefined ? tf : activeType;
      const l = lf !== undefined ? lf : activeLanguage;
      if (t) p.type = t; if (l) p.language = l;
      const res = await api.get<SearchResponse>(`/search/${repoId}`, { params: p });
      if (res.data.success) { setResults(res.data.results); setFacets(res.data.facets); setTotalFound(res.data.totalFound); }
    } catch (err: any) { toast.error(err.response?.data?.message || "Search failed"); setResults([]); }
    finally { setSearchTime(Math.round(performance.now() - start)); setLoading(false); }
  }, [query, repoId, activeType, activeLanguage]);

  const handleTypeFilter = (t: string) => { const v = activeType === t ? null : t; setActiveType(v); if (hasSearched) performSearch(undefined, v, undefined); };
  const handleLangFilter = (l: string) => { const v = activeLanguage === l ? null : l; setActiveLanguage(v); if (hasSearched) performSearch(undefined, undefined, v); };
  const clearFilters = () => { setActiveType(null); setActiveLanguage(null); if (hasSearched) performSearch(undefined, null, null); };

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-6 group">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#58a6ff]/10 via-[#a371f7]/10 to-[#2ea043]/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative flex items-center gap-3 bg-[#0d1117]/90 backdrop-blur-xl border border-[#30363d] rounded-2xl px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] focus-within:border-[#58a6ff]/50 transition-all duration-300">
          <Search size={20} className="text-[#8b949e] shrink-0" />
          <input ref={inputRef} type="text" placeholder='Try: "authentication middleware", "email validation", "database connection"...'
            value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && performSearch()}
            className="flex-1 bg-transparent text-white placeholder-[#484f58] text-sm focus:outline-none" />
          {query && <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="p-1 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all cursor-pointer"><X size={16} /></button>}
          <button onClick={() => performSearch()} disabled={loading || !query.trim()}
            className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#238636] to-[#2ea043] text-white text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(46,160,67,0.3)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}Search
          </button>
        </div>
      </div>

      {/* Meta + filters toggle */}
      {hasSearched && !loading && (
        <div className="flex items-center justify-between mb-4 animate-fadeIn">
          <p className="text-xs text-[#8b949e] font-mono">
            <span className="text-[#58a6ff] font-semibold">{totalFound}</span> results in <span>{searchTime}ms</span>
            {(activeType || activeLanguage) && <span className="ml-2">· <button onClick={clearFilters} className="text-[#da3633] hover:underline cursor-pointer">Clear filters</button></span>}
          </p>
          {facets && (
            <button onClick={() => setShowFilters(!showFilters)} className={`cursor-pointer flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${showFilters ? "text-[#58a6ff] border-[#58a6ff]/30 bg-[#58a6ff]/10" : "text-[#8b949e] border-[#30363d] hover:text-[#c9d1d9]"}`}>
              <SlidersHorizontal size={12} />Filters<ChevronDown size={12} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      )}

      {/* Facets */}
      {showFilters && facets && (
        <div className="mb-6 p-4 rounded-xl border border-[#30363d]/60 bg-[#161b22]/60 animate-fadeIn space-y-3">
          {Object.keys(facets.types).length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-[#6e7681] uppercase tracking-widest mb-2">Entity Type</p>
              <div className="flex flex-wrap gap-2">{Object.entries(facets.types).sort(([,a],[,b]) => b-a).map(([t,c]) => <FilterPill key={t} label={t} count={c} active={activeType===t} onClick={() => handleTypeFilter(t)} color={TYPE_COLORS[t]} />)}</div>
            </div>
          )}
          {Object.keys(facets.languages).length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-[#6e7681] uppercase tracking-widest mb-2">Language</p>
              <div className="flex flex-wrap gap-2">{Object.entries(facets.languages).sort(([,a],[,b]) => b-a).map(([l,c]) => <FilterPill key={l} label={l} count={c} active={activeLanguage===l} onClick={() => handleLangFilter(l)} />)}</div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6"><div className="w-14 h-14 border-[3px] border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin" /><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#58a6ff]/20 blur-sm" /></div>
            <p className="text-sm text-[#8b949e]">Searching vector space...</p>
            <p className="text-xs text-[#6e7681] mt-1">Embedding query → Qdrant search → Hybrid re-ranking</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="flex flex-col items-center py-20 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-4"><Search size={28} className="text-[#484f58]" /></div>
            <p className="text-lg font-medium text-white mb-1">No results found</p>
            <p className="text-sm text-[#8b949e] max-w-sm text-center">Try different keywords or remove filters.</p>
          </div>
        ) : results.map((r, i) => <ResultCard key={r.entityId} result={r} index={i} />)}
      </div>

      {/* Empty state */}
      {!hasSearched && (
        <div className="flex flex-col items-center py-16 animate-fadeIn">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-[#30363d] flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]"><Search size={40} className="text-[#30363d]" /></div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center shadow-lg"><Zap size={14} className="text-white" /></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Search with Natural Language</h2>
          <p className="text-sm text-[#8b949e] max-w-md text-center mb-8">Type what you&apos;re looking for in plain English. Qdrant&apos;s vector similarity + keyword re-ranking finds the most relevant code.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
            {["authentication and login logic", "database connection setup", "error handling middleware"].map((ex) => (
              <button key={ex} onClick={() => { setQuery(ex); setTimeout(() => performSearch(ex), 50); }}
                className="cursor-pointer px-4 py-3 rounded-xl bg-[#161b22]/60 border border-[#30363d]/50 text-xs text-[#8b949e] hover:text-[#58a6ff] hover:border-[#58a6ff]/30 hover:bg-[#58a6ff]/5 transition-all text-left">&ldquo;{ex}&rdquo;</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
