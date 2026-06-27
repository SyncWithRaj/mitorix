"use client";

import { useState } from "react";
import { Search, GitBranch, Activity, ArrowRight } from "lucide-react";

const features = [
  {
    id: "search",
    icon: Search,
    title: "Natural Language Search",
    shortTitle: "NL Search",
    description:
      "Stop guessing variable names. Search your codebase using plain English queries. Qdrant's Cosine similarity matching retrieves semantically relevant AST blocks even if exact keywords are absent.",
    accentColor: "#ff8c00",
    tags: ["Qdrant Cosine", "Semantic RAG"],
  },
  {
    id: "clone",
    icon: GitBranch,
    title: "Semantic Clone Detection",
    shortTitle: "Clone Detect",
    description:
      "Find hidden code duplication. Our clustering algorithm scans the entire vector space to identify blocks of code that perform identical logic, even across different languages.",
    accentColor: "#ff6b00",
    tags: ["Vector Clustering", "Cross-Lang"],
  },
  {
    id: "drift",
    icon: Activity,
    title: "Version Drift Tracking",
    shortTitle: "Drift Track",
    description:
      "By computing vector distances between indexed versions, RepoLabs highlights true behavioral drift and structural deviations that standard text diffs miss entirely.",
    accentColor: "#ffa800",
    tags: ["Drift Analysis", "Vector Delta"],
  },
];

export default function VectorIntelligence() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="w-full py-32 px-6 relative z-10 overflow-hidden">
      {/* Background ambient — static, no animation cost */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#ff8c00]/[0.06] blur-[200px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#ff6b00]/[0.04] blur-[180px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff8c00]/10 border border-[#ff8c00]/30 text-[#ff8c00] text-xs font-mono uppercase tracking-wider mb-6">
            Vector Intelligence
          </div>
          <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter text-white">
            RepoLabs: Beyond Grep
          </h2>
          <p className="text-[#a3a3a3] max-w-2xl mx-auto text-lg font-light">
            We repurpose the Qdrant vector embeddings generated during ingestion
            to unlock deep semantic codebase intelligence features.
          </p>
        </div>

        {/* Horizontal Accordion — desktop */}
        <div className="hidden md:flex gap-2 h-[520px]">
          {features.map((feature, index) => {
            const isActive = activeIndex === index;
            const Icon = feature.icon;

            return (
              <div
                key={feature.id}
                onMouseEnter={() => setActiveIndex(index)}
                className="relative rounded-[1.5rem] overflow-hidden cursor-pointer border"
                style={{
                  flex: isActive ? 5 : 1,
                  transition: "flex 450ms cubic-bezier(0.22, 1, 0.36, 1), border-color 250ms ease",
                  borderColor: isActive ? `${feature.accentColor}50` : "#1a1a1a",
                  background: "#030303",
                  willChange: "flex",
                }}
              >
                {/* Ambient glow — opacity only */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 70% 50% at 50% 40%, ${feature.accentColor} 0%, transparent 70%)`,
                    opacity: isActive ? 0.07 : 0,
                    transition: "opacity 350ms ease",
                  }}
                />

                {/* ═══ COLLAPSED ═══ */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-3 z-10"
                  style={{
                    opacity: isActive ? 0 : 1,
                    transition: "opacity 200ms ease",
                    pointerEvents: isActive ? "none" : "auto",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0"
                    style={{
                      borderColor: `${feature.accentColor}30`,
                      background: `${feature.accentColor}10`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feature.accentColor }} />
                  </div>
                  <span className="[writing-mode:vertical-lr] rotate-180 text-sm font-semibold text-[#888] tracking-tight whitespace-nowrap">
                    {feature.title}
                  </span>
                </div>

                {/* ═══ EXPANDED ═══ */}
                <div
                  className="absolute inset-0 flex flex-col z-10"
                  style={{
                    opacity: isActive ? 1 : 0,
                    transition: "opacity 300ms ease 80ms",
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                >
                  {/* Illustration */}
                  <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                    {index === 0 && <SearchVisual color={feature.accentColor} />}
                    {index === 1 && <CloneVisual color={feature.accentColor} />}
                    {index === 2 && <DriftVisual color={feature.accentColor} />}
                  </div>

                  {/* Info bar */}
                  <div className="border-t border-[#1a1a1a] px-7 py-5 bg-[#020202]">
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-white mb-1.5 tracking-tight">
                          {feature.title}
                        </h3>
                        <p className="text-[#666] text-[13px] leading-relaxed line-clamp-2">
                          {feature.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        {feature.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded-md text-[10px] font-mono border"
                            style={{
                              borderColor: `${feature.accentColor}20`,
                              background: `${feature.accentColor}08`,
                              color: feature.accentColor,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile stacked cards */}
        <div className="flex flex-col gap-4 md:hidden">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.id} className="rounded-2xl border border-[#1a1a1a] bg-[#030303] overflow-hidden">
                <div className="p-6 flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center border shrink-0"
                    style={{ borderColor: `${feature.accentColor}30`, background: `${feature.accentColor}10` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feature.accentColor }} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">{feature.title}</h3>
                    <p className="text-[#666] text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────
   Illustrations
   ──────────────────────────────── */

function SearchVisual({ color }: { color: string }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center px-10">
      {/* Static floating code text — using CSS animation, zero JS */}
      {[
        { t: "findAuthMiddleware()", top: "14%", left: "8%", o: 0.18 },
        { t: "verifyJWT(token)", top: "26%", right: "10%", o: 0.14 },
        { t: "hashPassword(salt)", bottom: "32%", left: "10%", o: 0.12 },
        { t: "parseAST(node)", bottom: "20%", right: "14%", o: 0.16 },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute text-[11px] font-mono animate-float"
          style={{
            color, opacity: p.o,
            top: p.top, left: p.left, right: p.right, bottom: p.bottom,
            animationDuration: `${6 + i}s`,
            animationDelay: `${i * 0.8}s`,
          }}
        >
          {p.t}
        </div>
      ))}

      <div className="relative z-10 w-full max-w-lg">
        {/* Search bar */}
        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl px-5 py-4 flex items-center gap-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
            style={{ background: `${color}12`, borderColor: `${color}20` }}>
            <Search className="w-4 h-4" style={{ color }} />
          </div>
          <span className="text-[15px] text-white/80 font-light tracking-wide flex-1">
            Where is the JWT token verified?
          </span>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: color, boxShadow: `0 0 16px ${color}50` }}>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Result tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["auth.service.ts:45", "middleware/jwt.ts:12", "routes/auth.ts:88"].map((r) => (
            <span key={r} className="text-[10px] font-mono px-2.5 py-1 rounded-full border"
              style={{ background: `${color}08`, borderColor: `${color}18`, color }}>
              {r}
            </span>
          ))}
        </div>

        {/* Relevance bars */}
        <div className="mt-5 space-y-2.5">
          {[
            { file: "auth.service.ts", score: 98 },
            { file: "jwt.middleware.ts", score: 91 },
            { file: "auth.routes.ts", score: 85 },
          ].map((item) => (
            <div key={item.file} className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-[#444] w-28 shrink-0 truncate">{item.file}</span>
              <div className="flex-1 h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${item.score}%`, background: color }} />
              </div>
              <span className="text-[10px] font-mono w-8 text-right shrink-0" style={{ color }}>{item.score}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CloneVisual({ color }: { color: string }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center px-8">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_30%,transparent_100%)]" />

      <div className="relative z-10 flex items-center gap-5">
        {/* Block A */}
        <CodeBlock filename="utils/hash.ts" color={color} highlighted={[1, 2, 3]} />

        {/* Center nexus */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div
            className="w-14 h-14 rounded-full flex flex-col items-center justify-center border"
            style={{
              borderColor: `${color}35`,
              background: `${color}0c`,
              boxShadow: `0 0 20px ${color}18`,
            }}
          >
            <GitBranch className="w-4 h-4 mb-0.5" style={{ color }} />
            <span className="text-[11px] font-black" style={{ color }}>94%</span>
          </div>
          <span className="text-[9px] font-mono text-[#555]">semantic match</span>
        </div>

        {/* Block B */}
        <CodeBlock filename="lib/crypto.ts" color={color} highlighted={[1, 2, 3]} />
      </div>
    </div>
  );
}

function CodeBlock({ filename, color, highlighted }: { filename: string; color: string; highlighted: number[] }) {
  const widths = [75, 100, 83, 67, 100, 50];
  return (
    <div className="w-36 bg-[#080808] border border-[#1a1a1a] rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-[9px] font-mono text-[#555] uppercase tracking-wider">{filename}</span>
      </div>
      {widths.map((w, i) => (
        <div
          key={i}
          className="h-1.5 rounded"
          style={{
            width: `${w}%`,
            background: highlighted.includes(i) ? `${color}30` : "#1a1a1a",
          }}
        />
      ))}
    </div>
  );
}

function DriftVisual({ color }: { color: string }) {
  const versions = [
    { time: "6 months ago", ver: "v1.0.0", label: "Legacy Auth · Basic JWT", drift: null },
    { time: "2 months ago", ver: "v1.1.0", label: "OAuth2.0 · RBAC", drift: 65 },
    { time: "Current", ver: "v2.0.0", label: "Passkey + SSO · Full rewrite", drift: 92 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center px-6 py-6">
      {/* Ambient glow */}
      <div
        className="absolute top-[10%] right-[5%] w-40 h-40 blur-[80px] rounded-full pointer-events-none"
        style={{ background: `${color}0d` }}
      />

      <div className="relative z-10 w-full max-w-[280px]">
        {/* Timeline with exact pixel alignment */}
        <div className="relative pl-10">
          {/* Vertical line: 19px from left edge, 2px wide => center is 20px */}
          <div
            className="absolute top-2 bottom-2 left-[19px] w-[2px] rounded-full"
            style={{
              background: `linear-gradient(to bottom, #252525, ${color}40, ${color})`,
            }}
          />

          {versions.map((v, i) => {
            const isLast = i === versions.length - 1;
            const hasDrift = v.drift !== null;

            return (
              <div key={v.ver} className={`relative ${!isLast ? "pb-5" : ""}`}>
                {/* Dot: Content box starts at 40px (pl-10). 
                    Dot is -26px from content => 14px from left edge.
                    Dot is 12px wide (w-3) => center is 14 + 6 = 20px. 
                    Aligned perfectly with the line center (20px). */}
                <div
                  className="absolute top-2.5 -left-[26px] w-3 h-3 rounded-full"
                  style={{
                    ...(i === 0
                      ? { background: "#0a0a0a", border: "2.5px solid #444" }
                      : isLast
                        ? { background: color, boxShadow: `0 0 10px ${color}` }
                        : { background: "#0a0a0a", border: `2.5px solid ${color}60` }),
                  }}
                />

                {/* Card */}
                <div
                  className="rounded-xl px-4 py-3 border"
                  style={{
                    background: isLast ? `${color}0c` : "#080808",
                    borderColor: isLast ? `${color}30` : hasDrift ? `${color}18` : "#1a1a1a",
                  }}
                >
                  <div className="text-[10px] font-mono text-[#444] mb-0.5">{v.time}</div>
                  <div
                    className="text-sm font-mono font-semibold"
                    style={{ color: i === 0 ? "#777" : isLast ? "#fff" : color }}
                  >
                    {v.ver}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: isLast ? color : "#555" }}>
                    {v.label}
                  </div>
                  {hasDrift && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="h-1 flex-1 rounded" style={{ background: `${color}25` }}>
                        <div className="h-full rounded" style={{ width: `${v.drift}%`, background: color }} />
                      </div>
                      <span className="text-[9px] font-mono" style={{ color }}>{v.drift}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
