"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Blocks,
  Workflow,
  Search,
  Terminal,
  Eye,
  Fingerprint,
  Cpu,
  Zap,
  Activity,
  Shield,
  Database,
  Volume2,
  Bot,
  Layers,
  Flame,
  ArrowLeft,
  AlertTriangle,
  Settings,
  Code,
  Info,
  Server,
  FileCode,
} from "lucide-react";
import Footer from "@/components/layout/Footer";
import Silk from "@/components/ui/Silk";

export default function AboutPage() {
  return (
    <div className="flex flex-col flex-grow w-full bg-transparent text-[#e5e5e5] pb-0 selection:bg-[#ff6b00] selection:text-white relative">
      {/* Background patterns */}
      <div className="fixed inset-0 z-0 opacity-[0.25] pointer-events-none">
        <Silk color="#ff6b00" speed={4} scale={1.5} noiseIntensity={2} />
      </div>
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none z-0 mix-blend-screen"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      ></div>
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_20%,transparent_100%)] pointer-events-none z-0"></div>

      {/* Header Section */}
      <section className="relative w-full px-6 pt-36 pb-24 border-b border-white/10 bg-black/40 backdrop-blur-sm flex flex-col justify-center items-center overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-[45vw] h-[45vw] min-w-[300px] min-h-[300px] bg-gradient-to-br from-[#ff6b00] to-transparent opacity-[0.08] blur-[130px] rounded-full pointer-events-none animate-pulse-slow"></div>
        <div className="absolute right-[5%] bottom-[10%] w-[35vw] h-[35vw] min-w-[300px] min-h-[300px] bg-gradient-to-tr from-[#ffa800] to-transparent opacity-[0.06] blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a0a0a] border border-[#1a1a1a] text-xs font-semibold text-[#737373] mb-8 shadow-sm group hover:border-[#ff6b00]/50 hover:text-white transition-all cursor-pointer">
            <Fingerprint size={14} className="text-[#ff6b00] group-hover:scale-110 transition-transform" />
            <span>Developer Reference Specs v2.5</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter drop-shadow-md pb-2">
            Inside the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] via-[#ffa800] to-[#ff4500]">
              RepoLens Engine
            </span>
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-[#a3a3a3] leading-relaxed font-light mt-6">
            RepoLens is built on the principle that codebases are multidimensional spatial structures. This document details our parsing, vector-indexing, telemetry, and rendering engines.
          </p>
        </div>
      </section>

      {/* Main Spec Content */}
      <div className="max-w-6xl w-full mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 hidden lg:block sticky top-24 h-fit space-y-2 border-r border-[#1a1a1a] pr-6">
          <span className="text-[10px] font-bold text-[#737373] uppercase tracking-widest block mb-4">SPECIFICATIONS</span>
          <a href="#pipeline" className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-[#a3a3a3] hover:text-[#ff8c00] hover:bg-[#050505] transition-all">
            <Server size={14} /> Ingestion Pipeline
          </a>
          <a href="#ast-specs" className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-[#a3a3a3] hover:text-[#ff8c00] hover:bg-[#050505] transition-all">
            <Code size={14} /> Tree-sitter AST Specs
          </a>
          <a href="#vector" className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-[#a3a3a3] hover:text-[#ff8c00] hover:bg-[#050505] transition-all">
            <Database size={14} /> Vector Store & RAG
          </a>
          <a href="#visualizations" className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-[#a3a3a3] hover:text-[#ff8c00] hover:bg-[#050505] transition-all">
            <Workflow size={14} /> 7 D3 Visual Layouts
          </a>
          <a href="#algorithms" className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-[#a3a3a3] hover:text-[#ff8c00] hover:bg-[#050505] transition-all">
            <Activity size={14} /> Telemetry Algorithms
          </a>
          <a href="#speech" className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-[#a3a3a3] hover:text-[#ff8c00] hover:bg-[#050505] transition-all">
            <Volume2 size={14} /> Voice Call Architecture
          </a>
          <a href="#infrastructure" className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-[#a3a3a3] hover:text-[#ff8c00] hover:bg-[#050505] transition-all">
            <Settings size={14} /> Production Infra Stack
          </a>
          <a href="#repolabs" className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-[#a3a3a3] hover:text-[#ff8c00] hover:bg-[#050505] transition-all">
            <Search size={14} /> Vector RepoLabs
          </a>
        </aside>

        {/* Core Technical Specifications Details */}
        <main className="lg:col-span-9 space-y-24">
          
          {/* Ingestion Pipeline */}
          <section id="pipeline" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ff6b00]/10 border border-[#ff6b00]/25 flex items-center justify-center">
                <Server className="text-[#ff6b00]" size={20} />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">1. Asynchronous Ingestion & Sandbox Lifecycle</h2>
            </div>
            <p className="text-[#a3a3a3] leading-relaxed font-light text-base">
              The onboarding of a repository initiates an event-driven flow managed by **BullMQ** and backed by a **Redis** job queue. Because loading massive code structures blocks standard thread loops, ingestion returns an immediate HTTP status <code className="text-xs font-mono bg-[#1a1a1a] text-[#ff8c00] px-1.5 py-0.5 rounded">202 Accepted</code>, shifting the execution to specialized background processes.
            </p>
            
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg rounded-2xl p-6 space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider">Engine Process Sequence:</h4>
              <ul className="space-y-4 text-sm text-[#737373]">
                <li className="flex gap-3">
                  <span className="font-bold text-white font-mono shrink-0">A.</span>
                  <div>
                    <strong className="text-white">Validation & Authentication:</strong>
                    <p className="mt-1">Passport.js maps GitHub OAuth scopes to retrieve active personal access tokens. Private integrations authenticate using a server-side JSON Web Token keyed to a registered GitHub App client.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-white font-mono shrink-0">B.</span>
                  <div>
                    <strong className="text-white">Isolated Sandbox Disk Mount:</strong>
                    <p className="mt-1">The worker mounts a short-lived storage volume to the host filesystem directory path <code className="text-xs font-mono bg-[#1a1a1a] text-white px-1 py-0.5 rounded">/tmp/repolens-&lt;repo_id&gt;</code> and performs a shallow git clone with depth limit of 1.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-white font-mono shrink-0">C.</span>
                  <div>
                    <strong className="text-white">Telemetry & Analysis Dispatch:</strong>
                    <p className="mt-1">Codeflow scanners index all file structures, triggering language compilers to process Abstract Syntax Trees and generate coordinate vector embeds.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-white font-mono shrink-0">D.</span>
                  <div>
                    <strong className="text-white">Secure Wipe Sequence:</strong>
                    <p className="mt-1">Once vectors are upserted into Qdrant and schemas cached in MongoDB, the script initiates a cleanup utility. The directory path is entirely expunged from the physical disk, maintaining zero local codebase storage.</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* AST Specs */}
          <section id="ast-specs" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ff8c00]/10 border border-[#ff8c00]/25 flex items-center justify-center">
                <Code className="text-[#ff8c00]" size={20} />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">2. Tree-sitter AST Structural Deconstruction</h2>
            </div>
            <p className="text-[#a3a3a3] leading-relaxed font-light text-base">
              RepoLens bypasses flat, regex-based patterns to parse scope boundaries. We utilize **Tree-sitter WASM modules** compiled directly to native code blocks. Tree-sitter parses the repository's syntax structures into node streams representing classes, function bodies, imports, exports, and call parameters.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-5 rounded-xl space-y-2">
                <span className="text-[#ff6b00] font-bold block mb-2">RESOLVED AST SCHEMAS (11 Languages)</span>
                <div className="grid grid-cols-2 gap-2 text-[#737373]">
                  <div>● TypeScript (.ts, .tsx)</div>
                  <div>● JavaScript (.js, .jsx)</div>
                  <div>● Python (.py)</div>
                  <div>● Go Lang (.go)</div>
                  <div>● Rust (.rs)</div>
                  <div>● Java (.java)</div>
                  <div>● C / C++ (.c, .cpp)</div>
                  <div>● C# (.cs)</div>
                  <div>● Ruby (.rb)</div>
                  <div>● PHP (.php)</div>
                  <div>● VBA (.vba)</div>
                </div>
              </div>
              <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-5 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[#ff8c00] font-bold block mb-2">SCOPED AST NODE ENTITIES</span>
                  <p className="text-[#737373] leading-relaxed">
                    Nodes represent specific definitions: classes, function blocks, variable declarations, and dependency connections. Lines are indexed by start/end coordinates so users can jump straight to scopes within Monaco.
                  </p>
                </div>
                <div className="text-[10px] text-[#525252] border-t border-[#1a1a1a] pt-2 mt-2">
                  *Fallback parses use lightweight Regex algorithms for files outside primary models.
                </div>
              </div>
            </div>
          </section>

          {/* Vector DB */}
          <section id="vector" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ffa800]/10 border border-[#ffa800]/25 flex items-center justify-center">
                <Database className="text-[#ffa800]" size={20} />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">3. Qdrant Vector DB & RAG Pipeline</h2>
            </div>
            <p className="text-[#a3a3a3] leading-relaxed font-light text-base">
              Semantic lookup queries utilize the **Qdrant Vector Database**. RepoLens breaks functions and classes into discrete code blocks. We feed these blocks through **Nomic-embed-text** (running locally via **Ollama**) to generate 768-dimensional vectors representing semantic context — fully local, zero API cost, and zero data leakage.
            </p>
            
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg rounded-2xl p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="text-lg font-bold text-white font-mono">768</div>
                  <div className="text-xs text-[#737373]">Vector Dimensionality (Nomic)</div>
                </div>
                <div className="space-y-2 border-y md:border-y-0 md:border-x border-[#1a1a1a] py-4 md:py-0">
                  <div className="text-lg font-bold text-white font-mono">Cosine Similarity</div>
                  <div className="text-xs text-[#737373]">Distance Metric</div>
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-bold text-white font-mono">HNSW Graph</div>
                  <div className="text-xs text-[#737373]">Vector Search Index</div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#1a1a1a] text-sm leading-relaxed">
                <strong className="text-white block">Payload Filtering Rules:</strong>
                <p className="text-[#737373]">
                  To isolate lookups per RepoSpace and prevent bleed, Qdrant vectors store metadata payloads. The API enforces strict field matching checks for <code className="text-xs font-mono bg-[#1a1a1a] text-white px-1">repo_id</code> on every query.
                </p>
                <p className="text-[#737373]">
                  When a user asks a question, we embed the query text locally via Nomic, retrieve the top 15 matching AST code blocks, and combine them with MongoDB file metadata to construct the RAG prompt for Google Gemini LLM, generating exact codebase references.
                </p>
              </div>
            </div>
          </section>

          {/* D3.js Visualizations */}
          <section id="visualizations" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ff6b00]/10 border border-[#ff6b00]/25 flex items-center justify-center">
                <Workflow className="text-[#ff6b00]" size={20} />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">4. 7 D3.js Graphic Visualization Modes</h2>
            </div>
            <p className="text-[#a3a3a3] leading-relaxed font-light text-base">
              The CodeFlow engine translates AST entities and caller connections into interactive visualizations. D3.js scales vectors, handles canvas rendering, and coordinates hover logic with the Monaco Editor.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4 bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-6 rounded-2xl">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b00]"></span>
                  1. Force-Directed Node Graph
                </h4>
                <p className="text-xs text-[#737373] leading-relaxed">
                  Maps files as nodes and caller-callee loops as directed edges. Includes 5 customized layout algorithms: Force-Directed, Radial spreads, Hierarchical trees, strict Grid coordinates, and Metro lines.
                </p>
              </div>

              <div className="space-y-4 bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-6 rounded-2xl">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff8c00]"></span>
                  2. Treemap View (d3-hierarchy)
                </h4>
                <p className="text-xs text-[#737373] leading-relaxed">
                  Calculates nested directories as mosaic grids. Individual node rectangles represent files, with dimensions mapped to Lines of Code (LOC) and colors indicating folder structures.
                </p>
              </div>

              <div className="space-y-4 bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-6 rounded-2xl">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffa800]"></span>
                  3. Adjacency Dependency Matrix
                </h4>
                <p className="text-xs text-[#737373] leading-relaxed">
                  Renders a grid matrix identifying imports and functions. Columns and rows represent files. Deep colored intersections flag dense coupling zones.
                </p>
              </div>

              <div className="space-y-4 bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-6 rounded-2xl">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b00]"></span>
                  4. Hierarchical Dendrogram
                </h4>
                <p className="text-xs text-[#737373] leading-relaxed">
                  Extracts namespace mappings and projects them as horizontal node clusters. Smooth Bezier lines link folders to files, highlighting hierarchy.
                </p>
              </div>

              <div className="space-y-4 bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-6 rounded-2xl">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff8c00]"></span>
                  5. Sankey Flow Diagrams
                </h4>
                <p className="text-xs text-[#737373] leading-relaxed">
                  Rolls up call streams into path flows between directories. Displays width scales mapped directly to the volume of inter-folder function call references.
                </p>
              </div>

              <div className="space-y-4 bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-6 rounded-2xl">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffa800]"></span>
                  6. Disjoint Clusters View
                </h4>
                <p className="text-xs text-[#737373] leading-relaxed">
                  Groups files into distinct force boundaries based on folders. Surrounds components with bounding hulls to reveal inter-module connections.
                </p>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-6 rounded-2xl text-sm space-y-3">
              <h4 className="text-white font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b00]"></span>
                7. Circular Edge Bundling Layout
              </h4>
              <p className="text-xs text-[#737373] leading-relaxed">
                Positions active code files in a radial coordinate circle. Files are grouped by parent folders. Quadratic bezier arcs curve inside the circle to connect caller nodes, tracing cyclic bindings.
              </p>
              <div className="text-xs text-[#737373] bg-[#050505] p-3 rounded-lg border border-[#1a1a1a] flex flex-wrap gap-4 mt-2">
                <span><b>Render Limits:</b></span>
                <span>Matrix: Max 40 files</span>
                <span>Dendrogram: Max 80 files</span>
                <span>Bundle: Max 70 files</span>
                <span>Disjoint: Max 100 files</span>
              </div>
            </div>
          </section>

          {/* Algorithms */}
          <section id="algorithms" className="space-y-8 scroll-mt-24">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ffa800]/10 border border-[#ffa800]/25 flex items-center justify-center">
                <Activity className="text-[#ffa800]" size={20} />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">5. Telemetry & Analytics Algorithms</h2>
            </div>
            
            <div className="space-y-6">
              {/* Complexity */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-[#ff6b00]">■</span> Cyclomatic Complexity
                </h3>
                <p className="text-[#a3a3a3] font-light leading-relaxed text-sm">
                  Evaluates cognitive complexity by traversing AST node types. It sums decision points by matching branch controls: <code className="text-xs font-mono bg-[#1a1a1a] text-white px-1">if</code>, <code className="text-xs font-mono bg-[#1a1a1a] text-white px-1">else</code>, <code className="text-xs font-mono bg-[#1a1a1a] text-white px-1">for</code>, <code className="text-xs font-mono bg-[#1a1a1a] text-white px-1">while</code>, <code className="text-xs font-mono bg-[#1a1a1a] text-white px-1">switch</code>, <code className="text-xs font-mono bg-[#1a1a1a] text-white px-1">catch</code>, as well as logical operations <code className="text-xs font-mono bg-[#1a1a1a] text-white px-1">&&</code>, <code className="text-xs font-mono bg-[#1a1a1a] text-white px-1">||</code>, and ternary operators.
                </p>
              </div>

              {/* Health Score */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-[#ff8c00]">■</span> Dynamic Health Score Engine
                </h3>
                <p className="text-[#a3a3a3] font-light leading-relaxed text-sm">
                  Calculations start at a baseline of 100 points, applying deductions based on code quality and complexity metrics:
                </p>
                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-4 rounded-xl text-xs font-mono text-[#737373] space-y-2">
                  <div className="flex justify-between border-b border-[#1a1a1a] pb-1.5"><span className="text-white">Rule Metric Trigger</span><span className="text-white">Maximum Deduction Impact</span></div>
                  <div className="flex justify-between"><span>Vulnerability Leaks (SQL Injection, Credentials, XSS)</span><span className="text-[#ff4500]">-20 points total (-5 per issue)</span></div>
                  <div className="flex justify-between"><span>Circular/Cyclic Dependency Loops</span><span className="text-[#ff4500]">-20 points total (-5 per link)</span></div>
                  <div className="flex justify-between"><span>God Files (Files containing &gt;15 distinct functions)</span><span className="text-[#ffa800]">-15 points total (-3 per file)</span></div>
                  <div className="flex justify-between"><span>Coupling Density (Input-Output ratio imbalances)</span><span className="text-[#ffa800]">-15 points max</span></div>
                  <div className="flex justify-between"><span>Dead Code Blocks (Percentage of unused functions)</span><span className="text-white">-20 points max</span></div>
                </div>
              </div>

              {/* Blast Radius BFS */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-[#ffa800]">■</span> Blast Radius BFS Traversal
                </h3>
                <p className="text-[#a3a3a3] font-light leading-relaxed text-sm">
                  Computes structural risk coordinates when a file is modified. The algorithm triggers a **Breadth-First Search (BFS)** across the dependency graph:
                </p>
                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-5 rounded-xl text-xs font-mono text-[#737373] space-y-2 leading-relaxed">
                  <p className="text-[#ff8c00]">BFS Propagation Equation Parameters:</p>
                  <div>1. Identifies files directly importing the modified module (Depth 1).</div>
                  <div>2. Propagates downstream relationships up to Depth 3, applying a decay weight multiplier of <code className="text-white bg-[#1a1a1a] px-1 rounded">1 / Depth</code> to transitive links.</div>
                  <div>3. Counts exported functions and traces incoming call counts to calculate centrality.</div>
                  <div>4. Sets the severity rating: **Critical** (≥8 direct links or ≥5 functions), **High** (≥4 links or ≥3 functions), **Medium** (≥2 links), or **Low**.</div>
                </div>
              </div>

              {/* PR Risk */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-[#ff6b00]">■</span> Pull Request Risk Scoring
                </h3>
                <p className="text-[#a3a3a3] font-light leading-relaxed text-sm">
                  Evaluates codebase risk for branch merges. The score ranges from 0 to 100 based on several factors:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-2">
                  <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-4 rounded-xl">
                    <div className="text-white font-bold text-sm">+30 Max</div>
                    <div className="text-[10px] text-[#737373] mt-1">Blast Radius Impact</div>
                  </div>
                  <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-4 rounded-xl">
                    <div className="text-white font-bold text-sm">+25 Max</div>
                    <div className="text-[10px] text-[#737373] mt-1">Lines of Code Altered</div>
                  </div>
                  <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-4 rounded-xl">
                    <div className="text-white font-bold text-sm">+20 Max</div>
                    <div className="text-[10px] text-[#737373] mt-1">Number of Files Modified</div>
                  </div>
                  <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-4 rounded-xl">
                    <div className="text-white font-bold text-sm">+25 Max</div>
                    <div className="text-[10px] text-[#737373] mt-1">Core & Configuration Edits</div>
                  </div>
                </div>
              </div>

              {/* Pattern Rules & Vulns */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-[#ff8c00]">■</span> Design Pattern & Security Rules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                  <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-5 rounded-xl space-y-3">
                    <span className="text-white font-bold block border-b border-[#1a1a1a] pb-2">PATTERN RULES</span>
                    <ul className="space-y-2 text-[#737373]">
                      <li><b className="text-white">Singleton:</b> Detects <code className="text-[#ff6b00] bg-black px-1 rounded">getInstance</code> methods and static instance markers.</li>
                      <li><b className="text-white">Factory:</b> Matches files named <code className="text-[#ff6b00] bg-black px-1 rounded">*factory*</code> or containing `create` methods.</li>
                      <li><b className="text-white">Observer:</b> Traces event handler binds, calls to <code className="text-[#ff6b00] bg-black px-1">addEventListener</code>, <code className="text-[#ff6b00] bg-black px-1">emit</code>, or subscriptions.</li>
                      <li><b className="text-white">Repository:</b> Matches <code className="text-[#ff6b00] bg-black px-1 rounded">*repo*</code> structures containing database actions.</li>
                    </ul>
                  </div>
                  <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-5 rounded-xl space-y-3">
                    <span className="text-white font-bold block border-b border-[#1a1a1a] pb-2">SECURITY SCANNER REGEXES</span>
                    <ul className="space-y-2 text-[#737373]">
                      <li><b className="text-white">SQL Injection:</b> Detects SQL queries built with string concatenation.</li>
                      <li><b className="text-white">XSS Injection:</b> Matches usages of <code className="text-[#ff6b00] bg-black px-1">innerHTML</code> and <code className="text-[#ff6b00] bg-black px-1">dangerouslySetInnerHTML</code>.</li>
                      <li><b className="text-white">Secrets:</b> Traces variable keys matching <code className="text-[#ff6b00] bg-black px-1">API_KEY</code>, <code className="text-[#ff6b00] bg-black px-1">PASSWORD</code>, or <code className="text-[#ff6b00] bg-black px-1">TOKEN</code>.</li>
                      <li><b className="text-white">Weak Cryptography:</b> Flags implementations using outdated algorithms like md5 or sha1.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Voice Call Specs */}
          <section id="speech" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ffa800]/10 border border-[#ffa800]/25 flex items-center justify-center">
                <Volume2 className="text-[#ffa800]" size={20} />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">6. Hands-Free Speech Pipeline</h2>
            </div>
            <p className="text-[#a3a3a3] leading-relaxed font-light text-base">
              The hands-free voice feature operates a sequential audio pipeline to capture, analyze, and reply to queries in real-time.
            </p>

            <div className="border border-white/10 rounded-2xl bg-black/40 backdrop-blur-2xl shadow-lg p-6 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-stretch gap-4 text-center text-xs font-mono">
                <div className="flex-1 bg-black border border-[#1a1a1a] p-4 rounded-xl flex flex-col justify-between items-center">
                  <div className="text-[#ff6b00] font-bold">1. CAPTURE (STT)</div>
                  <div className="text-[10px] text-[#737373] mt-2">AssemblyAI stream API processes audio inputs into plain text.</div>
                </div>
                <div className="flex items-center justify-center text-[#ff6b00] text-lg font-bold rotate-90 md:rotate-0">➔</div>
                <div className="flex-1 bg-black border border-[#1a1a1a] p-4 rounded-xl flex flex-col justify-between items-center">
                  <div className="text-[#ff8c00] font-bold">2. REASON (RAG)</div>
                  <div className="text-[10px] text-[#737373] mt-2">Nomic-embed-text (Ollama) matches query embeddings with indexed files in Qdrant. Gemini LLM generates the answer.</div>
                </div>
                <div className="flex items-center justify-center text-[#ff8c00] text-lg font-bold rotate-90 md:rotate-0">➔</div>
                <div className="flex-1 bg-black border border-[#1a1a1a] p-4 rounded-xl flex flex-col justify-between items-center">
                  <div className="text-[#ffa800] font-bold">3. SYNTHESIS (TTS)</div>
                  <div className="text-[10px] text-[#737373] mt-2">Murf AI converts Gemini's output into natural speech streams.</div>
                </div>
              </div>
            </div>
          </section>

          {/* Production Infra */}
          <section id="infrastructure" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ff6b00]/10 border border-[#ff6b00]/25 flex items-center justify-center">
                <Settings className="text-[#ff6b00]" size={20} />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">7. Production Infrastructure Stack</h2>
            </div>
            <p className="text-[#a3a3a3] leading-relaxed font-light text-base">
              RepoLens is structured as a scalable, multi-container architecture.
            </p>

            <div className="border border-white/10 rounded-2xl bg-black/40 backdrop-blur-2xl shadow-lg overflow-hidden text-sm">
              <div className="bg-[#050505] p-4 border-b border-[#1a1a1a] font-mono text-xs text-white">CONTAINER DEFINITION SPECIFICATIONS</div>
              <div className="p-6 space-y-4">
                <div className="flex gap-4">
                  <Shield className="text-[#ff6b00] shrink-0 mt-1" size={16} />
                  <div>
                    <strong className="text-white">Nginx Reverse Proxy:</strong>
                    <p className="text-xs text-[#737373] mt-1">Listens on port 80, serving built Next.js frontend pages and proxying API calls to the Express application backend.</p>
                  </div>
                </div>
                <div className="flex gap-4 border-t border-[#1a1a1a] pt-4">
                  <Database className="text-[#ff8c00] shrink-0 mt-1" size={16} />
                  <div>
                    <strong className="text-white">Database Engines:</strong>
                    <p className="text-xs text-[#737373] mt-1">MongoDB persists user metadata, file paths, and conversation logs. Redis manages BullMQ queues, while Qdrant stores high-dimensional semantic code vectors.</p>
                  </div>
                </div>
                <div className="flex gap-4 border-t border-[#1a1a1a] pt-4">
                  <CheckCircle2 className="text-[#ffa800] shrink-0 mt-1" size={16} />
                  <div>
                    <strong className="text-white">Environment Staging:</strong>
                    <p className="text-xs text-[#737373] mt-1">Backend parameters are isolated within environment variables, securing API keys for Gemini LLM, AssemblyAI, and Murf AI, alongside JWT secrets. Embeddings run locally via Ollama — no API key needed.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RepoLabs: Clone & Drift */}
          <section id="repolabs" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ff8c00]/10 border border-[#ff8c00]/25 flex items-center justify-center">
                <Search className="text-[#ff8c00]" size={20} />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">8. Vector RepoLabs: Clone & Drift Telemetry</h2>
            </div>
            <p className="text-[#a3a3a3] leading-relaxed font-light text-base">
              The RepoLabs module repurposes Qdrant embeddings to unlock deep codebase intelligence algorithms that transcend traditional text-matching engines.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-6 rounded-2xl space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-[#ff6b00]">■</span> Semantic Clone Detection
                </h3>
                <p className="text-[#737373] leading-relaxed text-xs">
                  A high-performance clustering algorithm scans the vector space comparing the Cosine distances of all AST fragments within the repository. It identifies hidden duplication where code logic is semantically identical, regardless of variable renaming or syntax formatting. 
                </p>
                <div className="bg-[#050505] border border-[#1a1a1a] p-3 rounded-lg text-[11px] font-mono text-[#a3a3a3] space-y-1">
                  <div><span className="text-[#ff4500]">≥95%</span> Near Identical Match</div>
                  <div><span className="text-[#ff6b00]">≥90%</span> High Similarity Clone</div>
                  <div><span className="text-[#ff8c00]">≥85%</span> Semantic Clone Boundary</div>
                </div>
              </div>

              <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg p-6 rounded-2xl space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-[#ffa800]">■</span> Version Drift Tracking
                </h3>
                <p className="text-[#737373] leading-relaxed text-xs">
                  When a codebase is re-indexed, RepoLens computes the vector distance between the old fingerprint and the new fingerprint mappings. This reveals semantic code drift that standard git text diffs fail to capture.
                </p>
                <div className="bg-[#050505] border border-[#1a1a1a] p-3 rounded-lg text-[11px] font-mono text-[#a3a3a3] space-y-1">
                  <div>Computes % Drift per AST Entity</div>
                  <div>Rolls up average drift per File Path</div>
                  <div>Cross-Repository version diffing</div>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>

      <div className="mt-32 relative z-10 w-full bg-black/40 backdrop-blur-md border-t border-white/5">
        <Footer />
      </div>
    </div>
  );
}
