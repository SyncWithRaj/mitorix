import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Database,
  MessageSquare,
  Zap,
  Shield,
  Globe,
  Network,
  ChevronRight,
  Layers,
  Workflow,
  Copy,
  Activity,
  Search,
} from "lucide-react";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="flex flex-col flex-grow items-center w-full overflow-hidden selection:bg-[#ff6b00] selection:text-white bg-[#000000]">
      {/* Hero Section */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-24 px-6 overflow-hidden">
        {/* Advanced Abstract Background Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-[#ff6b00] to-[#ff4500] opacity-[0.08] blur-[150px] rounded-full pointer-events-none mix-blend-screen animate-glow-pulse"></div>
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tl from-[#ff8c00] to-[#ffa800] opacity-[0.08] blur-[150px] rounded-full pointer-events-none mix-blend-screen animate-glow-pulse max-md:hidden"
          style={{ animationDelay: "2s" }}
        ></div>
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-gradient-to-br from-[#ffa200] to-[#ff6b00] opacity-[0.05] blur-[120px] rounded-full pointer-events-none mix-blend-screen animate-float"></div>

        {/* Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
        ></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_20%,transparent_100%)] pointer-events-none"></div>

        <div className="max-w-5xl w-full text-center relative z-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#050505] border border-[#1a1a1a] text-xs font-semibold text-[#737373] mb-8 shadow-sm hover:border-[#ff6b00]/50 hover:text-[#e5e5e5] transition-all cursor-pointer group">
            <span className="flex h-2 w-2 rounded-full bg-[#ff6b00] group-hover:shadow-[0_0_8px_#ff6b00] transition-shadow"></span>
            RepoLens v2.0 - Powered by Qdrant Vector Intelligence
            <ArrowRight className="w-3 h-3 ml-1 text-[#737373] group-hover:text-[#e5e5e5] transform group-hover:translate-x-0.5 transition-transform" />
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-[#737373] leading-[1.1] pb-2 drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">
            Explore your codebase. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] via-[#ff8c00] to-[#ff6b00] bg-[length:200%_auto] animate-shimmer drop-shadow-[0_0_30px_rgba(255,107,0,0.3)]">
              Semantically.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-[#737373] mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            RepoLens translates repository directories into interactive dependency canvases. Execute natural language searches, track code drift, and isolate logic duplicates using Qdrant vector database similarity indices.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="group relative flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl bg-[#ff6b00] hover:bg-[#ff8c00] text-white overflow-hidden transition-all duration-300 active:scale-[0.98] w-full sm:w-auto shadow-[0_0_20px_rgba(255,107,0,0.2)] hover:shadow-[0_0_35px_rgba(255,107,0,0.4)] border border-[#ff8c00]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <span className="relative z-10 flex items-center gap-2">
                Launch Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              href="/about"
              className="group flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl bg-[#0a0a0a] hover:bg-[#1a1a1a] text-[#e5e5e5] border border-[#1a1a1a] hover:border-[#ff6b00]/40 transition-all duration-300 active:scale-[0.98] w-full sm:w-auto shadow-sm"
            >
              How It Works
            </Link>
          </div>
        </div>

        {/* Floating Code UI Preview Decoration */}
        <div className="mt-20 w-full max-w-5xl mx-auto hidden md:block perspective-[2000px] relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent z-20 h-full w-full pointer-events-none"></div>
          <div className="w-full aspect-video rounded-t-2xl border-t border-x border-[#1a1a1a] bg-[#050505] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden rotate-x-[15deg] transform-origin-top hover:rotate-x-[5deg] transition-transform duration-700">
            {/* Fake Mac Header */}
            <div className="h-10 bg-[#000000] border-b border-[#1a1a1a] flex items-center px-4 justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff4500]/70"></div>
                <div className="w-3 h-3 rounded-full bg-[#ff8c00]/70"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffa800]/70"></div>
              </div>
              <span className="text-xs text-[#737373] font-mono">repolens-canvas</span>
              <div className="w-12"></div>
            </div>
            {/* Visualizer Background */}
            <div
              className="flex-1 opacity-[0.07] bg-cover bg-center"
              style={{
                backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')",
              }}
            ></div>
          </div>
        </div>
      </section>

      {/* Stats Section / Social Proof */}
      <section className="w-full border-y border-[#1a1a1a] bg-[#050505]/50 backdrop-blur-md py-12 z-10 relative">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-[#737373]">
          <div className="flex flex-col gap-1 transition-transform hover:-translate-y-1 duration-300">
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e5e5e5]">
              100%
            </span>
            <span className="text-sm font-semibold tracking-wide uppercase text-[#737373]">
              Qdrant Vector Powered
            </span>
          </div>
          <div className="flex flex-col gap-1 transition-transform hover:-translate-y-1 duration-300">
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e5e5e5]">
              6+
            </span>
            <span className="text-sm font-semibold tracking-wide uppercase text-[#737373]">
              Canvas Visualizers
            </span>
          </div>
          <div className="flex flex-col gap-1 transition-transform hover:-translate-y-1 duration-300">
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e5e5e5]">
              &lt;50ms
            </span>
            <span className="text-sm font-semibold tracking-wide uppercase text-[#737373]">
              Similarity Lookup
            </span>
          </div>
          <div className="flex flex-col gap-1 transition-transform hover:-translate-y-1 duration-300">
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e5e5e5]">
              100%
            </span>
            <span className="text-sm font-semibold tracking-wide uppercase text-[#737373]">
              Ephemeral Storage
            </span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="w-full max-w-6xl mx-auto py-32 px-6 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/30 text-[#ff6b00] text-xs font-semibold uppercase tracking-wider mb-6">
            Features
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#e5e5e5]">
            Engineered for Code Intelligence
          </h2>
          <p className="text-[#737373] max-w-2xl mx-auto text-xl font-light">
            Go beyond standard text search. Discover dependencies, identify duplicate logic, and observe how your code evolves.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Feature 1 */}
          <div className="group bg-[#050505] border border-[#1a1a1a] p-8 rounded-2xl transition-all duration-500 overflow-hidden relative cursor-crosshair hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] hover:border-[#ff6b00]/40">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 transform group-hover:scale-110">
              <Search size={150} className="text-[#ff6b00]" />
            </div>
            <div className="w-14 h-14 rounded-xl bg-[#0a0a0a] flex items-center justify-center mb-8 border border-[#1a1a1a] group-hover:bg-[#ff6b00]/10 group-hover:border-[#ff6b00]/50 transition-colors shadow-inner">
              <Search className="w-7 h-7 text-[#ff6b00]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
              Semantic Search
            </h3>
            <p className="text-base text-[#737373] leading-relaxed relative z-10">
              Query code components using natural language prompts. Qdrant matches similarity hashes to reveal matching files, lines, and structures.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group bg-[#050505] border border-[#1a1a1a] p-8 rounded-2xl transition-all duration-500 overflow-hidden relative cursor-crosshair hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] hover:border-[#ff8c00]/40 md:translate-y-8">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 transform group-hover:scale-110">
              <Copy size={150} className="text-[#ff8c00]" />
            </div>
            <div className="w-14 h-14 rounded-xl bg-[#0a0a0a] flex items-center justify-center mb-8 border border-[#1a1a1a] group-hover:bg-[#ff8c00]/10 group-hover:border-[#ff8c00]/50 transition-colors shadow-inner">
              <Copy className="w-7 h-7 text-[#ff8c00]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
              Semantic Clone Finder
            </h3>
            <p className="text-base text-[#737373] leading-relaxed relative z-10">
              Detect duplicate and redundant logic implementations across isolated folders using similarity ranges that go beyond syntax text patterns.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group bg-[#050505] border border-[#1a1a1a] p-8 rounded-2xl transition-all duration-500 overflow-hidden relative cursor-crosshair hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] hover:border-[#ffa800]/40">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 transform group-hover:scale-110">
              <Activity size={150} className="text-[#ffa800]" />
            </div>
            <div className="w-14 h-14 rounded-xl bg-[#0a0a0a] flex items-center justify-center mb-8 border border-[#1a1a1a] group-hover:bg-[#ffa800]/10 group-hover:border-[#ffa800]/50 transition-colors shadow-inner">
              <Activity className="w-7 h-7 text-[#ffa800]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
              Codebase Drift Detection
            </h3>
            <p className="text-base text-[#737373] leading-relaxed relative z-10">
              Track codebase evolutionary paths. Compare multiple snapshots in Qdrant collections to isolate files and classes showing critical design drift.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works / Workflow Section */}
      <section className="w-full bg-[#050505] py-32 border-y border-[#1a1a1a] relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff8c00]/10 border border-[#ff8c00]/30 text-[#ff8c00] text-xs font-semibold uppercase tracking-wider mb-6">
              Workflow
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
              The Code Ingestion Pipeline
            </h2>
            <p className="text-[#737373] max-w-2xl mx-auto text-xl font-light">
              Securely parsing repositories into high-dimensional vector spaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[40px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-[#1a1a1a] to-transparent -z-10"></div>

            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#000000] border-4 border-[#050505] shadow-[0_0_0_2px_#1a1a1a] flex items-center justify-center text-xl font-bold text-[#e5e5e5] mb-6 relative group hover:border-[#ff6b00] hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] transition-all">
                1
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Ingest</h4>
              <p className="text-[#737373] text-sm px-2">
                Securely fetch your codebase snapshot from Git and checkout source scopes dynamically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#000000] border-4 border-[#050505] shadow-[0_0_0_2px_#1a1a1a] flex items-center justify-center text-xl font-bold text-[#e5e5e5] mb-6 relative group hover:border-[#ff8c00] hover:shadow-[0_0_20px_rgba(255,140,0,0.3)] transition-all">
                2
              </div>
              <h4 className="text-lg font-bold text-white mb-2">AST Extraction</h4>
              <p className="text-[#737373] text-sm px-2">
                Extract syntax trees, structural hierarchies, component definitions, and dependency hooks.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#000000] border-4 border-[#050505] shadow-[0_0_0_2px_#1a1a1a] flex items-center justify-center text-xl font-bold text-[#e5e5e5] mb-6 relative group hover:border-[#ffa800] hover:shadow-[0_0_20px_rgba(255,168,0,0.3)] transition-all">
                3
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Embed & Vectorize</h4>
              <p className="text-[#737373] text-sm px-2">
                Vectorize AST nodes using embeddings models, indexing functional points into Qdrant.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#000000] border-4 border-[#050505] shadow-[0_0_0_2px_#1a1a1a] flex items-center justify-center text-xl font-bold text-[#e5e5e5] mb-6 relative group hover:border-[#ff6b00] hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] transition-all">
                4
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Clean and Serve</h4>
              <p className="text-[#737373] text-sm px-2">
                Instantly destroy physical raw files on disk. Serve visual dependency canvases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience / Use Cases */}
      <section className="w-full bg-[#000000] py-32 px-6 border-b border-[#1a1a1a] relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
              Visual Workspace Exploration
            </h2>
            <p className="text-[#737373] max-w-2xl mx-auto text-xl font-light">
              Interactive structural visualizers designed for engineering clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#050505] border border-[#1a1a1a] p-8 rounded-2xl transition-all duration-500 group/card hover:border-[#ff6b00]/50">
              <div className="mb-6 bg-[#0a0a0a] w-14 h-14 rounded-lg flex items-center justify-center border border-[#1a1a1a] shadow-inner group-hover/card:border-[#ff6b00]/50 transition-colors">
                <Network
                  className="text-[#ff6b00] group-hover/card:scale-110 transition-transform duration-300"
                  size={28}
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">6 Specialized Visuals</h3>
              <p className="text-[#737373] leading-relaxed">
                Toggle seamlessly between Network ForceGraphs, Sankey Flows, Treemaps, circular dependency Bundles, Dendrograms, and Matrix tables.
              </p>
            </div>
            <div className="bg-[#050505] border border-[#1a1a1a] p-8 rounded-2xl transition-all duration-500 group/card hover:border-[#ff8c00]/50">
              <div className="mb-6 bg-[#0a0a0a] w-14 h-14 rounded-lg flex items-center justify-center border border-[#1a1a1a] shadow-inner group-hover/card:border-[#ff8c00]/50 transition-colors">
                <Workflow
                  className="text-[#ff8c00] group-hover/card:scale-110 transition-transform duration-300"
                  size={28}
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Interactive Highlighting</h3>
              <p className="text-[#737373] leading-relaxed">
                Highlight dependent loops. Click visualizer elements to instantly open isolated node properties or pull up code scopes.
              </p>
            </div>
            <div className="bg-[#050505] border border-[#1a1a1a] p-8 rounded-2xl transition-all duration-500 group/card hover:border-[#ffa800]/50">
              <div className="mb-6 bg-[#0a0a0a] w-14 h-14 rounded-lg flex items-center justify-center border border-[#1a1a1a] shadow-inner group-hover/card:border-[#ffa800]/50 transition-colors">
                <Code2
                  className="text-[#ffa800] group-hover/card:scale-110 transition-transform duration-300"
                  size={28}
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Embedded Code Editor</h3>
              <p className="text-[#737373] leading-relaxed">
                Browse, read, and inspect source references within an embedded Monaco code editor synchronized with selected visualizer scopes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Extended Details / Security Section */}
      <section className="w-full bg-[#050505] py-24 px-6 border-b border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl bg-[#000000] border border-[#1a1a1a] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden group">
            <div
              className="absolute inset-0 opacity-[0.03] mix-blend-screen"
              style={{
                backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')",
              }}
            ></div>

            <div className="max-w-lg relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/30 text-xs font-semibold text-[#ff6b00] mb-6">
                <Shield size={14} /> Ephemeral Processing
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
                Secure & Ephemeral Isolation
              </h3>
              <p className="text-[#737373] mb-6 text-lg leading-relaxed font-light">
                Your code is never stored persistently. We securely ingest, generate AST tree relationships, vectorize contents into Qdrant, and instantly destroy raw source directories.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-[#e5e5e5]">
                  <Shield className="text-[#ff6b00] w-5 h-5 flex-shrink-0" />{" "}
                  <span className="text-sm">Zero persistent raw code on disk storage</span>
                </li>
                <li className="flex items-center gap-3 text-[#e5e5e5]">
                  <Database className="text-[#ff8c00] w-5 h-5 flex-shrink-0" />{" "}
                  <span className="text-sm">Highly optimized Qdrant collections</span>
                </li>
                <li className="flex items-center gap-3 text-[#e5e5e5]">
                  <Globe className="text-[#ffa800] w-5 h-5 flex-shrink-0" />{" "}
                  <span className="text-sm">Full client workspace data integration</span>
                </li>
              </ul>
            </div>

            <div className="w-full md:w-1/2 flex justify-center relative z-10">
              <div className="relative w-full max-w-md aspect-square bg-[#050505] border border-[#1a1a1a] rounded-2xl overflow-hidden flex flex-col items-center justify-center p-8 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-t from-[#ff6b00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#ff6b00] to-[#ffa800] blur-3xl opacity-10 group-hover:opacity-30 transition-opacity duration-700 absolute"></div>
                <Network
                  size={100}
                  className="text-[#e5e5e5] relative z-10 animate-[spin_30s_linear_infinite]"
                  strokeWidth={1}
                />
                <div className="mt-8 text-center relative z-10 bg-[#000000] px-6 py-3 rounded-xl border border-[#1a1a1a]">
                  <p className="font-mono text-sm text-[#ff6b00] mb-1 font-bold tracking-widest flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#ff6b00] animate-pulse"></span>
                    ENGINE_STATUS
                  </p>
                  <p className="text-sm text-[#737373] font-medium">Qdrant Node Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-[#000000] py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-gradient-to-b from-[#ff6b00]/5 to-transparent blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-8 tracking-tighter drop-shadow-sm">
            Explore your workspace now
          </h2>
          <p className="text-xl text-[#737373] mb-12 font-light">
            Understand massive codebase architectures and code structures in real-time.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/dashboard"
              className="flex justify-center items-center gap-2 px-10 py-5 bg-[#ff6b00] hover:bg-[#ff8c00] text-white font-bold text-lg rounded-xl transition-all duration-300 active:scale-[0.98] shadow-[0_0_30px_rgba(255,107,0,0.2)] hover:shadow-[0_0_40px_rgba(255,107,0,0.4)]"
            >
              Start Exploring
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
