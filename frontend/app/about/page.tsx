import Link from "next/link";
import {
  CheckCircle,
  Blocks,
  Workflow,
  Search,
  TerminalSquare,
  Eye,
  Fingerprint,
  Cpu,
  Zap,
  Activity,
} from "lucide-react";
import Footer from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <div className="flex flex-col flex-grow w-full overflow-hidden bg-[#000000] text-[#e5e5e5] pb-32 selection:bg-[#ff6b00] selection:text-white relative">
      <div
        className="absolute inset-0 opacity-[0.01] pointer-events-none mix-blend-screen"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      ></div>

      {/* Header Section */}
      <section className="relative w-full px-6 pt-32 pb-24 border-b border-[#1a1a1a] bg-gradient-to-b from-[#000000] via-[#050505]/50 to-[#000000] flex flex-col justify-center items-center overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] min-w-[300px] min-h-[300px] bg-[#ff6b00] opacity-[0.03] blur-[150px] rounded-full pointer-events-none animate-pulse-slow"></div>
        <div className="absolute right-[10%] bottom-[10%] w-[30vw] h-[30vw] min-w-[300px] min-h-[300px] bg-[#ff8c00] opacity-[0.03] blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a0a0a] border border-[#1a1a1a] text-xs font-semibold text-[#737373] mb-8 shadow-sm group hover:border-[#ff6b00]/50 hover:text-[#e5e5e5] transition-all cursor-crosshair">
            <Fingerprint
              size={14}
              className="text-[#ff6b00] group-hover:scale-110 transition-transform"
            />
            Architecture Documentation
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter drop-shadow-md pb-2">
            How{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] via-[#ff8c00] to-[#ff6b00]">
              RepoLens Works
            </span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-[#737373] leading-relaxed font-light mt-6">
            RepoLens uses AST extraction, vector embeddings, and interactive visual mapping to help
            you understand large repositories quickly. Open source and built for developers.
          </p>
        </div>
      </section>

      {/* Technical Architecture Deep Dive */}
      <section className="max-w-6xl w-full mx-auto px-6 py-32 relative">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 text-[#ff8c00] font-mono text-sm tracking-widest font-semibold mb-6">
            <Cpu size={16} /> INTERNAL_ENGINE
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Under The Hood
          </h2>
          <p className="text-[#737373] max-w-2xl mx-auto font-light text-xl">
            We don't just grep files. Our telemetry engine leverages advanced AST generation,
            embedded vector models, and intelligent visual mapping algorithms.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10 pl-4 border-l-2 border-[#1a1a1a] bg-gradient-to-b from-transparent via-[#1a1a1a]/10 to-transparent pb-8 pt-8">
            <div className="group relative -ml-[25px] flex items-start gap-6">
              <div className="absolute top-5 -left-1 w-2 h-2 rounded-full bg-[#ff6b00] group-hover:scale-150 transition-transform"></div>
              <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] flex-shrink-0 flex items-center justify-center group-hover:bg-[#ff6b00]/10 group-hover:border-[#ff6b00]/50 transition-all duration-300 shadow-lg">
                <Blocks className="w-8 h-8 text-[#ff6b00] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#ff6b00] transition-colors">
                  Language-Agnostic Tree Parsing
                </h3>
                <p className="text-base text-[#737373] leading-relaxed font-light">
                  Once a repository is ingested, our backend pipeline dynamically spawns AST parsers
                  tailored to the detected language frameworks (React, Python FastAPI, Go, etc.). It
                  shreds files into their discrete functional nodes, tracking precise start and end
                  lines.
                </p>
              </div>
            </div>

            <div className="group relative -ml-[25px] flex items-start gap-6">
              <div className="absolute top-5 -left-1 w-2 h-2 rounded-full bg-[#ff8c00] group-hover:scale-150 transition-transform"></div>
              <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] flex-shrink-0 flex items-center justify-center group-hover:bg-[#ff8c00]/10 group-hover:border-[#ff8c00]/50 transition-all duration-300 shadow-lg">
                <Search className="w-8 h-8 text-[#ff8c00] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#ff8c00] transition-colors">
                  Vector Embedding Store (Qdrant)
                </h3>
                <p className="text-base text-[#737373] leading-relaxed font-light">
                  By feeding extracted logic through the Gemini API, we map semantic vectors into
                  Qdrant indices. This unlocks the ability to query complex logic patterns via RAG.
                </p>
              </div>
            </div>

            <div className="group relative -ml-[25px] flex items-start gap-6">
              <div className="absolute top-5 -left-1 w-2 h-2 rounded-full bg-[#ffa800] group-hover:scale-150 transition-transform"></div>
              <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] flex-shrink-0 flex items-center justify-center group-hover:bg-[#ffa800]/10 group-hover:border-[#ffa800]/50 transition-all duration-300 shadow-lg">
                <Workflow className="w-8 h-8 text-[#ffa800] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#ffa800] transition-colors">
                  Force-Directed Visual Mapping
                </h3>
                <p className="text-base text-[#737373] leading-relaxed font-light">
                  RepoLens translates your directory structure and file dependencies into an
                  interactive stellar map. Hover physics directly interface with Monaco Editor
                  contexts via a localized Editor engine.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#050505] border border-[#1a1a1a] rounded-3xl p-8 shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#ff6b00]/5 to-[#ff8c00]/5 opacity-[0.1] group-hover:opacity-[0.2] transition-opacity duration-700"></div>
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#ff4500]/70"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-[#ff8c00]/70"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-[#ffa800]/70"></div>
              <span className="text-xs font-mono text-[#737373] ml-4 bg-[#000000] px-3 py-1 rounded-md border border-[#1a1a1a]">
                architecture.md
              </span>
            </div>
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#1a1a1a] to-transparent mb-6"></div>

            <code className="block text-[13px] sm:text-[15px] font-mono text-[#e5e5e5] leading-[1.8] relative z-10 w-full overflow-hidden">
              <span className="text-[#ff6b00] font-semibold">async</span>{" "}
              <span className="text-[#ff8c00] font-semibold">processRepo</span>(
              <span className="text-[#e5e5e5]">url</span>:{" "}
              <span className="text-[#ff8c00]">string</span>) {"{"}
              <br />
              &nbsp;&nbsp;
              <span className="text-[#737373] my-1 inline-block">
                // 1. Ephemeral Clone to /tmp
              </span>
              <br />
              &nbsp;&nbsp;<span className="text-[#ff6b00] font-semibold">await</span>{" "}
              <span className="text-[#ff8c00]">cloneRepo</span>(url);
              <br />
              <br />
              &nbsp;&nbsp;
              <span className="text-[#737373] my-1 inline-block">// 2. Parse Code to AST</span>
              <br />
              &nbsp;&nbsp;<span className="text-[#ff6b00] font-semibold">const</span>{" "}
              <span className="text-[#e5e5e5]">astNodes</span> ={" "}
              <span className="text-[#ff6b00] font-semibold">await</span>{" "}
              <span className="text-[#ff8c00]">generateAST</span>();
              <br />
              <br />
              &nbsp;&nbsp;
              <span className="text-[#737373] my-1 inline-block">
                // 3. Store in Vector DB (Qdrant)
              </span>
              <br />
              &nbsp;&nbsp;<span className="text-[#ff6b00] font-semibold">await</span>{" "}
              <span className="text-[#ff8c00]">qdrantClient.upsert</span>(astNodes);
              <br />
              <br />
              &nbsp;&nbsp;
              <span className="text-[#737373] my-1 inline-block">// 4. Destroy Clone Securely</span>
              <br />
              &nbsp;&nbsp;<span className="text-[#ff6b00] font-semibold">await</span>{" "}
              <span className="text-[#ff8c00]">cleanupTmpDir</span>();
              <br />
              {"}"}
            </code>
          </div>
        </div>
      </section>

      {/* Core Values Minimalist Grid */}
      <section className="w-full bg-[#050505]/50 border-y border-[#1a1a1a] py-32 px-6 relative z-10 backdrop-blur-md">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <Zap className="w-10 h-10 text-[#ff8c00] mx-auto mb-6 animate-pulse" />
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Core Project Tenets</h2>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="bg-[#000000] p-8 rounded-2xl border border-[#1a1a1a] hover:border-[#ff6b00]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,0,0.15)] group">
            <CheckCircle className="w-10 h-10 text-[#ff6b00] mb-6 group-hover:scale-110 transition-transform" />
            <h4 className="text-white font-bold text-xl mb-3">Ephemeral Parsing</h4>
            <p className="text-[#737373] text-[15px] leading-relaxed">
              Temporary repository clones are destroyed immediately after generating AST vectors and
              MongoDB models.
            </p>
          </div>

          <div className="bg-[#000000] p-8 rounded-2xl border border-[#1a1a1a] hover:border-[#ff8c00]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,140,0,0.15)] group">
            <Eye className="w-10 h-10 text-[#ff8c00] mb-6 group-hover:scale-110 transition-transform" />
            <h4 className="text-white font-bold text-xl mb-3">Force-Graph Visualization</h4>
            <p className="text-[#737373] text-[15px] leading-relaxed">
              Visualize cyclical dependencies immediately with an interactive generic force-directed
              webgl graph.
            </p>
          </div>

          <div className="bg-[#000000] p-8 rounded-2xl border border-[#1a1a1a] hover:border-[#ffa800]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,168,0,0.15)] group">
            <TerminalSquare className="w-10 h-10 text-[#ffa800] mb-6 group-hover:scale-110 transition-transform" />
            <h4 className="text-white font-bold text-xl mb-3">Integrated Editor</h4>
            <p className="text-[#737373] text-[15px] leading-relaxed">
              Browser IDE powered by Monaco directly highlights retrieved syntax lines to help
              answer your queries.
            </p>
          </div>

          <div className="bg-[#000000] p-8 rounded-2xl border border-[#1a1a1a] hover:border-[#ff6b00]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,0,0.15)] group">
            <Activity className="w-10 h-10 text-[#ff6b00] mb-6 group-hover:scale-110 transition-transform" />
            <h4 className="text-white font-bold text-xl mb-3">Assembly & Murf Voice</h4>
            <p className="text-[#737373] text-[15px] leading-relaxed">
              Converse directly via voice. Uses AssemblyAI for STT transcription and Murf AI for
              realistic TTS.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
