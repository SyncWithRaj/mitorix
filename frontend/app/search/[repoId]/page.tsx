"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
  Search,
  FileCode,
  Loader2,
  ArrowLeft,
  X,
  ChevronDown,
  Zap,
  Box,
  Braces,
  FileText,
  Route,
  Variable,
  Layers,
  Hash,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SearchResult {
  entityId: string;
  name: string;
  type: string;
  filePath: string;
  language: string;
  startLine: number;
  endLine: number;
  content: string;
  score: number;
  vectorScore: number;
  keywordScore: number;
  parameters?: string[];
  returnType?: string;
}

interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  totalFound: number;
  query: string;
  facets: {
    types: Record<string, number>;
    languages: Record<string, number>;
    folders: Record<string, number>;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────
const TYPE_ICONS: Record<string, typeof FileCode> = {
  function: Braces,
  arrow: Braces,
  method: Braces,
  class: Box,
  interface: Layers,
  route: Route,
  variable: Variable,
  enum: Hash,
  export: ArrowUpRight,
  import: ArrowUpRight,
  typeAlias: Layers,
};

const TYPE_COLORS: Record<string, string> = {
  function: "#ff8c00",
  arrow: "#ff8c00",
  method: "#ff8c00",
  class: "#ff6b00",
  interface: "#60a5fa",
  route: "#3b82f6",
  variable: "#2dd4bf",
  enum: "#f59e0b",
  export: "#ffaa00",
  import: "#737373",
  typeAlias: "#ff8c00",
};

// ─── Score Badge ─────────────────────────────────────────────────────────────
function ScoreBadge({
  score,
  vectorScore,
  keywordScore,
}: {
  score: number;
  vectorScore: number;
  keywordScore: number;
}) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 70
      ? "from-[#ff6b00] to-[#ff8c00]"
      : pct >= 45
        ? "from-[#ffaa00] to-[#f59e0b]"
        : "from-[#737373] to-[#555555]";

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#1a1a1a]">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-[#737373] w-8 text-right">
          {pct}%
        </span>
      </div>
      <div className="flex items-center gap-2 text-[9px] font-mono text-[#737373]">
        <span title="Vector similarity">V:{Math.round(vectorScore * 100)}%</span>
        <span title="Keyword relevance">K:{Math.round(keywordScore * 100)}%</span>
      </div>
    </div>
  );
}

// ─── Result Card ─────────────────────────────────────────────────────────────
function ResultCard({
  result,
  index,
  onNavigate,
}: {
  result: SearchResult;
  index: number;
  onNavigate: (result: SearchResult) => void;
}) {
  const Icon = TYPE_ICONS[result.type] || FileText;
  const color = TYPE_COLORS[result.type] || "#737373";
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="group relative rounded-xl border border-[#1a1a1a]/60 bg-[#0a0a0a]/80 backdrop-blur-sm hover:border-[#ff6b00]/30 hover:bg-[#0a0a0a]/90 transition-all duration-300 overflow-hidden animate-fadeInUp cursor-pointer"
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: color }}
      />

      <div className="p-4 pl-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors duration-300"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}30`,
              }}
            >
              <Icon size={15} style={{ color }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#ff6b00] transition-colors">
                  {result.name}
                </h3>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0"
                  style={{
                    color,
                    backgroundColor: `${color}15`,
                  }}
                >
                  {result.type}
                </span>
              </div>
              <p className="text-xs text-[#737373] font-mono truncate mt-0.5">
                {result.filePath}
                <span className="text-[#555555]">
                  :{result.startLine}–{result.endLine}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ScoreBadge
              score={result.score}
              vectorScore={result.vectorScore}
              keywordScore={result.keywordScore}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(result);
              }}
              className="p-1.5 rounded-lg text-[#737373] hover:text-[#ff6b00] hover:bg-[#ff6b00]/10 transition-all opacity-0 group-hover:opacity-100"
              title="Open in Chat IDE"
            >
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Parameters/return type info */}
        {(result.parameters?.length || result.returnType) && (
          <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-[#737373]">
            {result.parameters && result.parameters.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#1a1a1a]/50">
                ({result.parameters.join(", ")})
              </span>
            )}
            {result.returnType && (
              <span className="px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#1a1a1a]/50">
                → {result.returnType}
              </span>
            )}
          </div>
        )}

        {/* Expandable code preview */}
        {expanded && result.content && (
          <div className="mt-3 relative">
            <pre className="text-[11px] font-mono text-[#e5e5e5] bg-[#000000] border border-[#1a1a1a]/50 rounded-lg p-3 overflow-x-auto max-h-[200px] overflow-y-auto custom-scrollbar leading-relaxed whitespace-pre-wrap break-words">
              {result.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Filter Pill ─────────────────────────────────────────────────────────────
function FilterPill({
  label,
  count,
  active,
  onClick,
  color,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
        active
          ? "bg-[#ff6b00]/15 text-[#ff6b00] border-[#ff6b00]/30 font-bold"
          : "bg-[#0a0a0a]/50 text-[#737373] border-[#1a1a1a]/50 hover:text-[#e5e5e5] hover:border-[#ff6b00]/30"
      }`}
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
      <span className="text-[10px] opacity-60">({count})</span>
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SearchPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [facets, setFacets] = useState<SearchResponse["facets"] | null>(null);
  const [totalFound, setTotalFound] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  // Filters
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const performSearch = useCallback(
    async (searchQuery?: string, typeFilter?: string | null, langFilter?: string | null) => {
      const q = searchQuery ?? query;
      if (!q.trim()) return;

      setLoading(true);
      setHasSearched(true);
      const startTime = performance.now();

      try {
        const params: Record<string, string> = { q: q.trim() };
        const type = typeFilter !== undefined ? typeFilter : activeType;
        const lang = langFilter !== undefined ? langFilter : activeLanguage;

        if (type) params.type = type;
        if (lang) params.language = lang;

        const res = await api.get<SearchResponse>(`/search/${repoId}`, {
          params,
        });

        if (res.data.success) {
          setResults(res.data.results);
          setFacets(res.data.facets);
          setTotalFound(res.data.totalFound);
        }
      } catch (err: any) {
        console.error("Search failed:", err);
        toast.error(err.response?.data?.message || "Search failed");
        setResults([]);
      } finally {
        setSearchTime(Math.round(performance.now() - startTime));
        setLoading(false);
      }
    },
    [query, repoId, activeType, activeLanguage]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") performSearch();
  };

  const handleTypeFilter = (type: string) => {
    const newType = activeType === type ? null : type;
    setActiveType(newType);
    if (hasSearched) performSearch(undefined, newType, undefined);
  };

  const handleLangFilter = (lang: string) => {
    const newLang = activeLanguage === lang ? null : lang;
    setActiveLanguage(newLang);
    if (hasSearched) performSearch(undefined, undefined, newLang);
  };

  const clearFilters = () => {
    setActiveType(null);
    setActiveLanguage(null);
    if (hasSearched) performSearch(undefined, null, null);
  };

  const navigateToResult = (result: SearchResult) => {
    router.push(`/mitorixSpace/${repoId}`);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#e5e5e5] pt-32 pb-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[#ff6b00]/8 via-[#ff8c00]/4 to-transparent blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-[#ff6b00]/3 to-transparent blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(`/mitorixSpace/${repoId}`)}
            className="p-2 rounded-xl text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#ff6b00]/20 to-[#ff8c00]/20 border border-[#ff6b00]/20 flex items-center justify-center">
                <Search size={18} className="text-[#ff6b00]" />
              </div>
              Semantic Code Search
            </h1>
            <p className="text-sm text-[#737373] mt-1">
              Search your codebase with natural language — powered by Qdrant
              vector similarity
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-6 group">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff6b00]/10 via-[#ff8c00]/10 to-transparent blur-[20px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative flex items-center gap-3 bg-[#0a0a0a]/90 backdrop-blur-xl border border-[#1a1a1a] rounded-2xl px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] focus-within:border-[#ff6b00]/50 transition-all duration-300">
            <Search
              size={20}
              className="text-[#737373] shrink-0"
            />
            <input
              ref={inputRef}
              type="text"
              placeholder='Try: "authentication middleware", "email validation", "database connection"...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-white placeholder-[#555555] text-sm focus:outline-none"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-lg text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={() => performSearch()}
              disabled={loading || !query.trim()}
              className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin text-white" />
              ) : (
                <Zap size={16} className="text-white" />
              )}
              Search
            </button>
          </div>
        </div>

        {/* Meta info + Filter toggle */}
        {hasSearched && !loading && (
          <div className="flex items-center justify-between mb-4 animate-fadeIn">
            <p className="text-xs text-[#737373] font-mono">
              <span className="text-[#ff6b00] font-semibold">
                {totalFound}
              </span>{" "}
              results in{" "}
              <span className="text-[#737373]">{searchTime}ms</span>
              {(activeType || activeLanguage) && (
                <span className="ml-2">
                  ·{" "}
                  <button
                    onClick={clearFilters}
                    className="text-red-500 hover:underline cursor-pointer"
                  >
                    Clear filters
                  </button>
                </span>
              )}
            </p>
            {facets && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`cursor-pointer flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  showFilters
                    ? "text-[#ff6b00] border-[#ff6b00]/30 bg-[#ff6b00]/10 font-bold"
                    : "text-[#737373] border-[#1a1a1a] hover:text-[#e5e5e5]"
                }`}
              >
                <SlidersHorizontal size={12} className="text-[#ff6b00]" />
                Filters
                <ChevronDown
                  size={12}
                  className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
        )}

        {/* Facet Filters */}
        {showFilters && facets && (
          <div className="mb-6 p-4 rounded-xl border border-[#1a1a1a]/60 bg-[#0a0a0a]/60 backdrop-blur-sm animate-fadeIn space-y-3">
            {/* Type filters */}
            {Object.keys(facets.types).length > 0 && (
              <div>
                <p className="text-[10px] font-mono text-[#737373] uppercase tracking-widest mb-2">
                  Entity Type
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(facets.types)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count]) => (
                      <FilterPill
                        key={type}
                        label={type}
                        count={count}
                        active={activeType === type}
                        onClick={() => handleTypeFilter(type)}
                        color={TYPE_COLORS[type]}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Language filters */}
            {Object.keys(facets.languages).length > 0 && (
              <div>
                <p className="text-[10px] font-mono text-[#737373] uppercase tracking-widest mb-2">
                  Language
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(facets.languages)
                    .sort(([, a], [, b]) => b - a)
                    .map(([lang, count]) => (
                      <FilterPill
                        key={lang}
                        label={lang}
                        count={count}
                        active={activeLanguage === lang}
                        onClick={() => handleLangFilter(lang)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Folder distribution */}
            {Object.keys(facets.folders).length > 0 && (
              <div>
                <p className="text-[10px] font-mono text-[#737373] uppercase tracking-widest mb-2">
                  Folder Distribution
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(facets.folders)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([folder, count]) => (
                      <span
                        key={folder}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#0a0a0a]/50 text-[#737373] border border-[#1a1a1a]/40"
                      >
                        {folder || "(root)"}
                        <span className="text-[10px] opacity-50">{count}</span>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="w-14 h-14 border-[3px] border-[#1a1a1a] border-t-[#ff6b00] rounded-full animate-spin" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#ff6b00]/20 blur-sm" />
              </div>
              <p className="text-sm text-[#737373] font-medium">
                Searching vector space...
              </p>
              <p className="text-xs text-[#737373] mt-1">
                Embedding query and scanning Qdrant
              </p>
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-4">
                <Search size={28} className="text-[#737373]" />
              </div>
              <p className="text-lg font-medium text-white mb-1">
                No results found
              </p>
              <p className="text-sm text-[#737373] max-w-sm text-center">
                Try different keywords or remove filters. Semantic search works
                best with descriptive natural language queries.
              </p>
            </div>
          ) : (
            results.map((result, index) => (
              <ResultCard
                key={result.entityId}
                result={result}
                index={index}
                onNavigate={navigateToResult}
              />
            ))
          )}
        </div>

        {/* Empty state (before first search) */}
        {!hasSearched && (
          <div className="flex flex-col items-center justify-center py-16 animate-fadeIn">
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0a0a0a] to-[#000000] border border-[#1a1a1a] flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <Search size={40} className="text-[#1a1a1a]" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] flex items-center justify-center shadow-lg">
                <Zap size={14} className="text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Search with Natural Language
            </h2>
            <p className="text-sm text-[#737373] max-w-md text-center mb-8">
              Type what you&apos;re looking for in plain English. Qdrant&apos;s
              vector similarity will find semantically relevant code — even if
              the exact words don&apos;t match.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
              {[
                "authentication and login logic",
                "database connection setup",
                "error handling middleware",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    setQuery(example);
                    setTimeout(() => performSearch(example), 50);
                  }}
                  className="cursor-pointer px-4 py-3 rounded-xl bg-[#0a0a0a]/60 border border-[#1a1a1a]/50 text-xs text-[#737373] hover:text-[#ff6b00] hover:border-[#ff6b00]/30 hover:bg-[#ff6b00]/5 transition-all text-left"
                >
                  &ldquo;{example}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
