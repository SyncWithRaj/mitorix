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
  function: "#FF6B00", arrow: "#FF6B00", method: "#FF6B00", class: "#FF8C00",
  interface: "#FFA800", route: "#E5E5E5", variable: "#A3A3A3", enum: "#737373",
  export: "#E5E5E5", import: "#737373", typeAlias: "#FFA800",
};

function ResultCard({ result, index }: { result: SearchResult; index: number }) {
  const Icon = TYPE_ICONS[result.type] || FileText;
  const color = TYPE_COLORS[result.type] || "#8b949e";
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round(result.score * 100);
  const barColor = pct >= 70 ? "from-[#FF6B00] to-[#FF8C00]" : pct >= 45 ? "from-[#A3A3A3] to-[#737373]" : "from-[#404040] to-[#262626]";

  return (
    <div className="group relative rounded-2xl border border-[#1A1A1A] bg-[#0A0A0A] hover:border-[#FF6B00]/40 transition-all duration-300 overflow-hidden animate-fadeInUp cursor-pointer"
      style={{ animationDelay: `${index * 40}ms` }} onClick={() => setExpanded(!expanded)}>
      <div className="absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: color }} />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}>
              <Icon size={15} style={{ color }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-[#E5E5E5] truncate group-hover:text-[#FF6B00] transition-colors">{result.name}</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0" style={{ color, backgroundColor: `${color}10` }}>{result.type}</span>
              </div>
              <p className="text-[11px] text-[#A3A3A3] font-mono truncate mt-1">{result.filePath}<span className="text-[#737373]">:{result.startLine}–{result.endLine}</span></p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-16 h-1 bg-[#1A1A1A] rounded-full overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} /></div>
              <span className="text-[10px] font-mono text-[#A3A3A3] w-8 text-right">{pct}%</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#737373]">
              <span title="Vector similarity">V:{Math.round(result.vectorScore * 100)}%</span>
              <span title="Keyword relevance">K:{Math.round(result.keywordScore * 100)}%</span>
            </div>
          </div>
        </div>
        {(result.parameters?.length || result.returnType) && (
          <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-[#737373]">
            {result.parameters && result.parameters.length > 0 && <span className="px-1.5 py-0.5 rounded bg-[#0A0A0A] border border-[#1A1A1A]">({result.parameters.join(", ")})</span>}
            {result.returnType && <span className="px-1.5 py-0.5 rounded bg-[#0A0A0A] border border-[#1A1A1A]">→ {result.returnType}</span>}
          </div>
        )}
        {expanded && result.content && (
          <div className="mt-4"><pre className="text-[12px] font-mono text-[#A3A3A3] bg-[#050505] border border-[#1A1A1A] rounded-xl p-4 overflow-x-auto max-h-[250px] overflow-y-auto leading-relaxed whitespace-pre-wrap break-words">{result.content}</pre></div>
        )}
      </div>
    </div>
  );
}

function FilterPill({ label, count, active, onClick, color }: { label: string; count: number; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${active ? "bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/30" : "bg-transparent text-[#737373] border-[#1A1A1A] hover:text-[#E5E5E5] hover:border-[#404040]"}`}>
      {color && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />}
      {label}<span className="text-[10px] opacity-50">({count})</span>
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
      <div className="relative mb-8 group">
        <div className="absolute inset-0 rounded-2xl bg-[#FF6B00]/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative flex items-center gap-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl px-5 py-4 focus-within:border-[#FF6B00]/40 transition-all duration-300">
          <Search size={18} className="text-[#737373] shrink-0" />
          <input ref={inputRef} type="text" placeholder='Try: "authentication logic", "database connection"...'
            value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && performSearch()}
            className="flex-1 bg-transparent text-[#E5E5E5] placeholder-[#737373] text-[15px] focus:outline-none" />
          {query && <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="p-1 rounded-full text-[#737373] hover:text-white hover:bg-[#1A1A1A] transition-all cursor-pointer"><X size={16} /></button>}
          <button onClick={() => performSearch()} disabled={loading || !query.trim()}
            className="cursor-pointer flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF8C00] text-white text-sm font-medium transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}Search
          </button>
        </div>
      </div>

      {/* Meta + filters toggle */}
      {hasSearched && !loading && (
        <div className="flex items-center justify-between mb-6 animate-fadeIn">
          <p className="text-xs text-[#737373] font-mono">
            <span className="text-[#FF6B00] font-medium">{totalFound}</span> results in <span>{searchTime}ms</span>
            {(activeType || activeLanguage) && <span className="ml-2">· <button onClick={clearFilters} className="text-[#FF6B00] hover:underline cursor-pointer">Clear filters</button></span>}
          </p>
          {facets && (
            <button onClick={() => setShowFilters(!showFilters)} className={`cursor-pointer flex items-center gap-2 text-xs px-4 py-2 rounded-full border transition-all ${showFilters ? "text-[#FF6B00] border-[#FF6B00]/30 bg-[#FF6B00]/5" : "text-[#A3A3A3] border-[#1A1A1A] hover:text-white"}`}>
              <SlidersHorizontal size={14} />Filters<ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      )}

      {/* Facets */}
      {showFilters && facets && (
        <div className="mb-8 p-6 rounded-2xl border border-[#1A1A1A] bg-[#050505] animate-fadeIn space-y-5">
          {Object.keys(facets.types).length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-[#737373] uppercase tracking-widest mb-3">Entity Type</p>
              <div className="flex flex-wrap gap-2">{Object.entries(facets.types).sort(([,a],[,b]) => b-a).map(([t,c]) => <FilterPill key={t} label={t} count={c} active={activeType===t} onClick={() => handleTypeFilter(t)} color={TYPE_COLORS[t]} />)}</div>
            </div>
          )}
          {Object.keys(facets.languages).length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-[#737373] uppercase tracking-widest mb-3">Language</p>
              <div className="flex flex-wrap gap-2">{Object.entries(facets.languages).sort(([,a],[,b]) => b-a).map(([l,c]) => <FilterPill key={l} label={l} count={c} active={activeLanguage===l} onClick={() => handleLangFilter(l)} />)}</div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative mb-6"><div className="w-12 h-12 border-[2px] border-[#1A1A1A] border-t-[#FF6B00] rounded-full animate-spin" /></div>
            <p className="text-[13px] text-[#A3A3A3]">Searching vector space...</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="flex flex-col items-center py-24 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center mb-6"><Search size={24} className="text-[#404040]" /></div>
            <p className="text-[15px] text-[#E5E5E5] mb-2">No results found</p>
            <p className="text-[13px] text-[#737373]">Try different keywords or remove filters.</p>
          </div>
        ) : results.map((r, i) => <ResultCard key={r.entityId} result={r} index={i} />)}
      </div>

      {/* Empty state */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center py-24 animate-fadeIn">
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-full bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center"><Search size={32} className="text-[#404040]" /></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#FF6B00] flex items-center justify-center shadow-[0_0_10px_rgba(255,107,0,0.4)]"><Zap size={12} className="text-white" /></div>
          </div>
          <h2 className="text-[16px] font-medium text-white mb-3">Natural Language Search</h2>
          <p className="text-[13px] text-[#737373] max-w-sm text-center mb-10 leading-relaxed">Type what you&apos;re looking for in plain English. We&apos;ll find the most relevant code instantly.</p>
          <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl">
            {["authentication flow", "database connection", "error middleware"].map((ex) => (
              <button key={ex} onClick={() => { setQuery(ex); setTimeout(() => performSearch(ex), 50); }}
                className="cursor-pointer px-5 py-2.5 rounded-full bg-transparent border border-[#1A1A1A] text-[12px] text-[#737373] hover:text-[#FF6B00] hover:border-[#FF6B00]/40 transition-all">&ldquo;{ex}&rdquo;</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
