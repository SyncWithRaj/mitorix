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
  Bot,
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
            RepoLens AI Engine v2.0 is now live
            <ArrowRight className="w-3 h-3 ml-1 text-[#737373] group-hover:text-[#e5e5e5] transform group-hover:translate-x-0.5 transition-transform" />
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-[#737373] leading-[1.1] pb-2 drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">
            Understand your codebase. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] via-[#ff8c00] to-[#ff6b00] bg-[length:200%_auto] animate-shimmer drop-shadow-[0_0_30px_rgba(255,107,0,0.3)]">
              Faster than ever.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-[#737373] mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            RepoLens parses your repository into a visual force-graph and lets you talk directly to
            your code via chat or native voice calls powered by Murf AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="group relative flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl bg-[#ff6b00] hover:bg-[#ff8c00] text-white overflow-hidden transition-all duration-300 active:scale-[0.98] w-full sm:w-auto shadow-[0_0_20px_rgba(255,107,0,0.2)] hover:shadow-[0_0_35px_rgba(255,107,0,0.4)] border border-[#ff8c00]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <span className="relative z-10 flex items-center gap-2">
                Start Exploring
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              href="/about"
              className="group flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl bg-[#0a0a0a] hover:bg-[#1a1a1a] text-[#e5e5e5] border border-[#1a1a1a] hover:border-[#ff6b00]/40 transition-all duration-300 active:scale-[0.98] w-full sm:w-auto shadow-sm"
            >
              Read the Docs
            </Link>
          </div>
        </div>

        {/* Floating Code UI Preview Decoration */}
        <div className="mt-20 relative w-full max-w-5xl mx-auto hidden md:block perspective-[2000px]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent z-20 h-full w-full pointer-events-none"></div>
          <div className="w-full aspect-video rounded-t-2xl border-t border-x border-[#1a1a1a] bg-[#050505] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden rotate-x-[15deg] transform-origin-top hover:rotate-x-[5deg] transition-transform duration-700">
            {/* Fake Mac Header */}
            <div className="h-10 bg-[#000000] border-b border-[#1a1a1a] flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff4500]/70"></div>
              <div className="w-3 h-3 rounded-full bg-[#ff8c00]/70"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffa800]/70"></div>
            </div>
            {/* Fake Content area */}
            <div
              className="flex-1 opacity-[0.07]"
              style={{
                backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')",
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
              10M+
            </span>
            <span className="text-sm font-semibold tracking-wide uppercase text-[#737373]">
              Lines Indexed
            </span>
          </div>
          <div className="flex flex-col gap-1 transition-transform hover:-translate-y-1 duration-300">
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e5e5e5]">
              50k+
            </span>
            <span className="text-sm font-semibold tracking-wide uppercase text-[#737373]">
              Queries Answered
            </span>
          </div>
          <div className="flex flex-col gap-1 transition-transform hover:-translate-y-1 duration-300">
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e5e5e5]">
              99.9%
            </span>
            <span className="text-sm font-semibold tracking-wide uppercase text-[#737373]">
              Uptime SLA
            </span>
          </div>
          <div className="flex flex-col gap-1 transition-transform hover:-translate-y-1 duration-300">
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e5e5e5]">
              &lt;200ms
            </span>
            <span className="text-sm font-semibold tracking-wide uppercase text-[#737373]">
              Avg Response
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
            Powerful capabilities out of the box
          </h2>
          <p className="text-[#737373] max-w-2xl mx-auto text-xl font-light">
            Everything you need to navigate, analyze, and comprehend massive codebases without
            opening a single IDE window.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Feature 1 */}
          <div className="group glass-panel p-8 rounded-2xl transition-all duration-500 overflow-hidden relative cursor-crosshair hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] hover:border-[#ff6b00]/40">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 transform group-hover:scale-110">
              <Database size={150} className="text-[#ff6b00]" />
            </div>
            <div className="w-14 h-14 rounded-xl bg-[#0a0a0a] flex items-center justify-center mb-8 border border-[#1a1a1a] group-hover:bg-[#ff6b00]/10 group-hover:border-[#ff6b00]/50 transition-colors shadow-inner">
              <Database className="w-7 h-7 text-[#ff6b00]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
              Intelligent Indexing
            </h3>
            <p className="text-base text-[#737373] leading-relaxed relative z-10">
              Paste your repository URL and let our cluster extract, parse, and embed every function
              and structure using state-of-the-art vector stores.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group glass-panel p-8 rounded-2xl transition-all duration-500 overflow-hidden relative cursor-crosshair hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] hover:border-[#ff8c00]/40 md:translate-y-8">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 transform group-hover:scale-110">
              <MessageSquare size={150} className="text-[#ff8c00]" />
            </div>
            <div className="w-14 h-14 rounded-xl bg-[#0a0a0a] flex items-center justify-center mb-8 border border-[#1a1a1a] group-hover:bg-[#ff8c00]/10 group-hover:border-[#ff8c00]/50 transition-colors shadow-inner">
              <MessageSquare className="w-7 h-7 text-[#ff8c00]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4 tracking-tight">
              Contextual Chat AI
            </h3>
            <p className="text-base text-[#737373] leading-relaxed relative z-10">
              Ask natural language questions like "Where is the authentication logic?" and get exact
              code snippets, file references, and architectural explanations.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group glass-panel p-8 rounded-2xl transition-all duration-500 overflow-hidden relative cursor-crosshair hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] hover:border-[#ffa800]/40">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 transform group-hover:scale-110">
              <Layers size={150} className="text-[#ffa800]" />
            </div>
            <div className="w-14 h-14 rounded-xl bg-[#0a0a0a] flex items-center justify-center mb-8 border border-[#1a1a1a] group-hover:bg-[#ffa800]/10 group-hover:border-[#ffa800]/50 transition-colors shadow-inner">
              <Layers className="w-7 h-7 text-[#ffa800]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4 tracking-tight">
              Unified Workspace
            </h3>
            <p className="text-base text-[#737373] leading-relaxed relative z-10">
              Visualize your codebase as an interconnected force-graph. Slide open the integrated
              editor, file browser, and chat to navigate seamlessly.
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
              How RepoLens Works
            </h2>
            <p className="text-[#737373] max-w-2xl mx-auto text-xl font-light">
              A seamless pipeline from Git clone to intelligent contextual answers.
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
              <h4 className="text-lg font-bold text-white mb-2">Clone</h4>
              <p className="text-[#737373] text-sm">
                Input your GitHub URL. We securely clone it into our temporary isolated environment.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#000000] border-4 border-[#050505] shadow-[0_0_0_2px_#1a1a1a] flex items-center justify-center text-xl font-bold text-[#e5e5e5] mb-6 relative group hover:border-[#ff8c00] hover:shadow-[0_0_20px_rgba(255,140,0,0.3)] transition-all">
                2
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Parse</h4>
              <p className="text-[#737373] text-sm">
                We generate Abstract Syntax Trees (ASTs) for every file to understand the
                architecture deeply.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#000000] border-4 border-[#050505] shadow-[0_0_0_2px_#1a1a1a] flex items-center justify-center text-xl font-bold text-[#e5e5e5] mb-6 relative group hover:border-[#ffa800] hover:shadow-[0_0_20px_rgba(255,168,0,0.3)] transition-all">
                3
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Embed</h4>
              <p className="text-[#737373] text-sm">
                Nodes and functions are embedded into high-dimensional vectors stored in Pinecone/Qdrant.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#000000] border-4 border-[#050505] shadow-[0_0_0_2px_#1a1a1a] flex items-center justify-center text-xl font-bold text-[#e5e5e5] mb-6 relative group hover:border-[#ff6b00] hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] transition-all">
                4
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Chat</h4>
              <p className="text-[#737373] text-sm">
                Ask anything via the unified workspace and receive accurate, precise answers backed
                by code references.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Code / Arch Section */}
      <section className="w-full bg-[#000000] py-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#ff6b00]/5 to-[#ffa800]/5 blur-[150px] rounded-full pointer-events-none mix-blend-screen"></div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-16 items-center relative z-10">
          <div className="order-2 xl:order-1 relative group">
            {/* Background glowing border effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>

            <div className="relative bg-[#000000] border border-[#1a1a1a] rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] bg-[#050505]">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#ff4500]/70"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-[#ff8c00]/70"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-[#ffa800]/70"></div>
                  </div>
                  <div className="h-4 w-[1px] bg-[#1a1a1a]"></div>
                  <span className="text-xs font-medium text-[#737373]">query_rag.py</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#737373] bg-[#0a0a0a] py-1 px-2 rounded font-mono">
                    Python 3.12
                  </span>
                </div>
              </div>
              <div className="p-8 overflow-x-auto text-[14px] font-mono leading-loose text-[#e5e5e5] bg-[#000000] custom-scrollbar">
                <span className="text-[#ff6b00]">import</span>{" "}
                <span className="text-[#e5e5e5]">qdrant</span>
                <br />
                <span className="text-[#ff6b00]">from</span>{" "}
                <span className="text-[#e5e5e5]">openai</span>{" "}
                <span className="text-[#ff6b00]">import</span>{" "}
                <span className="text-[#e5e5e5]">OpenAI</span>
                <br />
                <br />
                <span className="text-[#ff6b00]">def</span>{" "}
                <span className="text-[#ffa800]">analyze_architecture</span>(
                <span className="text-[#e5e5e5]">repo_id</span>:{" "}
                <span className="text-[#ff6b00]">str</span>,{" "}
                <span className="text-[#e5e5e5]">question</span>:{" "}
                <span className="text-[#ff6b00]">str</span>):
                <br />
                <span className="text-[#737373] italic block border-l-2 border-[#ff6b00]/30 pl-4 my-2">
                  """Embeds query and retrieves exact architectural context."""
                </span>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <span className="text-[#737373]"># 1. Embed user query</span>
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#e5e5e5]">vector</span> ={" "}
                <span className="text-[#ffa800]">embed_text</span>(question)
                <br />
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;
                <span className="text-[#737373]">
                  # 2. Retrieve top-k semantic AST nodes from fast vector store
                </span>
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#e5e5e5]">context</span> ={" "}
                <span className="text-[#e5e5e5]">qdrant_client</span>.
                <span className="text-[#ffa800]">query</span>(<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <span className="text-[#e5e5e5]">vector</span>=vector,
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <span className="text-[#e5e5e5]">top_k</span>=
                <span className="text-[#ffa800]">15</span>,<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <span className="text-[#e5e5e5]">filter</span>={"{"}
                <span className="text-[#e5e5e5]">"repo_id"</span>: repo_id{"}"}
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;)
                <br />
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;
                <span className="text-[#737373]"># 3. Stream factual synthesis to the UI</span>
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#ff6b00]">return</span>{" "}
                <span className="text-[#e5e5e5]">llm</span>.
                <span className="text-[#ffa800]">generate_stream</span>(context, question)
                <br />
              </div>
            </div>
          </div>

          <div className="order-1 xl:order-2 space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Code Search,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff8c00]">
                Evolved.
              </span>
            </h2>
            <p className="text-xl text-[#737373] leading-relaxed font-light">
              We replace legacy regex and raw text indexing with a high-dimensional vector space.
              RepoLens understands the{" "}
              <em className="text-white font-medium not-italic drop-shadow-md">intent</em> behind
              the code, instantly leaping across modules and microservices to give you architectural
              answers.
            </p>
            <ul className="space-y-6 pt-4">
              <li className="flex items-start text-[#e5e5e5]">
                <div className="w-10 h-10 rounded-full bg-[#ff6b00]/10 text-[#ff6b00] flex items-center justify-center mr-5 border border-[#ff6b00]/30 shrink-0 font-bold shadow-sm">
                  1
                </div>
                <div>
                  <strong className="block text-white mb-1">Syntax Trees</strong>
                  <span className="text-[#737373]">
                    Generates precise ASTs separating components, functions, and classes.
                  </span>
                </div>
              </li>
              <li className="flex items-start text-[#e5e5e5]">
                <div className="w-10 h-10 rounded-full bg-[#ff8c00]/10 text-[#ff8c00] flex items-center justify-center mr-5 border border-[#ff8c00]/30 shrink-0 font-bold shadow-sm">
                  2
                </div>
                <div>
                  <strong className="block text-white mb-1">Vector Storage</strong>
                  <span className="text-[#737373]">
                    Embeds vast amounts of logic into millisecond-accessible clusters.
                  </span>
                </div>
              </li>
              <li className="flex items-start text-[#e5e5e5]">
                <div className="w-10 h-10 rounded-full bg-[#ffa800]/10 text-[#ffa800] flex items-center justify-center mr-5 border border-[#ffa800]/30 shrink-0 font-bold shadow-sm">
                  3
                </div>
                <div>
                  <strong className="block text-white mb-1">RAG Synthesis</strong>
                  <span className="text-[#737373]">
                    Synthesizes RAG context on the fly to directly answer prompt intentions.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Target Audience / Use Cases */}
      <section className="w-full bg-[#050505] py-32 px-6 border-y border-[#1a1a1a] relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
              Built for High-Velocity Teams
            </h2>
            <p className="text-[#737373] max-w-2xl mx-auto text-xl font-light">
              Whether you're exploring a legacy monolith or onboarding to a new microservice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel glass-panel-hover p-8 rounded-2xl transition-all duration-500 group/card">
              <div className="mb-6 bg-[#0a0a0a] w-14 h-14 rounded-lg flex items-center justify-center border border-[#1a1a1a] shadow-inner group-hover/card:border-[#ff6b00]/50 transition-colors">
                <Code2
                  className="text-[#ff6b00] group-hover/card:scale-110 transition-transform duration-300"
                  size={28}
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Semantic Code Chat</h3>
              <p className="text-[#737373] leading-relaxed">
                Stop using basic text search. Ask "where is the authentication logic?" and get exact
                snippets via Retrieval-Augmented Generation.
              </p>
            </div>
            <div className="glass-panel glass-panel-hover p-8 rounded-2xl transition-all duration-500 group/card">
              <div className="mb-6 bg-[#0a0a0a] w-14 h-14 rounded-lg flex items-center justify-center border border-[#1a1a1a] shadow-inner group-hover/card:border-[#ff8c00]/50 transition-colors">
                <Workflow
                  className="text-[#ff8c00] group-hover/card:scale-110 transition-transform duration-300"
                  size={28}
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">2D Code Mapping</h3>
              <p className="text-[#737373] leading-relaxed">
                Visualize your repository as an interconnected Force-Graph. Click on nodes to
                instantly open files in the built-in Monaco Editor.
              </p>
            </div>
            <div className="glass-panel glass-panel-hover p-8 rounded-2xl transition-all duration-500 group/card">
              <div className="mb-6 bg-[#0a0a0a] w-14 h-14 rounded-lg flex items-center justify-center border border-[#1a1a1a] shadow-inner group-hover/card:border-[#ffa800]/50 transition-colors">
                <Bot
                  className="text-[#ffa800] group-hover/card:scale-110 transition-transform duration-300"
                  size={28}
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Voice Conversations</h3>
              <p className="text-[#737373] leading-relaxed">
                Call your codebase directly from the browser. Built with AssemblyAI speech-to-text
                and Murf AI text-to-speech for hands-free coding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Extended Details / Security Section */}
      <section className="w-full bg-[#000000] py-24 px-6 border-b border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-[#050505] to-[#000000] border border-[#1a1a1a] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden group">
            <div
              className="absolute inset-0 opacity-[0.03] mix-blend-screen"
              style={{
                backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')",
              }}
            ></div>

            <div className="max-w-lg relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/30 text-xs font-semibold text-[#ff6b00] mb-6">
                <Shield size={14} /> Safe & Ephemeral
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
                Optimized Repository Parsing
              </h3>
              <p className="text-[#737373] mb-6 text-lg leading-relaxed font-light">
                Your code isn't left lying around. We utilize an ephemeral cloning pipeline that
                parses ASTs, saves structural data to MongoDB, embeds logic into Qdrant, and
                immediately destroys the physical clone.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-[#e5e5e5]">
                  <Shield className="text-[#ff6b00] w-5 h-5 flex-shrink-0" />{" "}
                  <span className="text-sm">No persistent raw code on server disk</span>
                </li>
                <li className="flex items-center gap-3 text-[#e5e5e5]">
                  <Database className="text-[#ff8c00] w-5 h-5 flex-shrink-0" />{" "}
                  <span className="text-sm">Highly efficient MongoDB & Qdrant integration</span>
                </li>
                <li className="flex items-center gap-3 text-[#e5e5e5]">
                  <Globe className="text-[#ffa800] w-5 h-5 flex-shrink-0" />{" "}
                  <span className="text-sm">Supports JS, TS, HTML, and CSS environments</span>
                </li>
              </ul>
            </div>

            <div className="w-full md:w-1/2 flex justify-center relative z-10">
              <div className="relative w-full max-w-md aspect-square glass-panel rounded-2xl overflow-hidden flex flex-col items-center justify-center p-8 group-hover:border-[rgba(255,255,255,0.05)] transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-t from-[#ff6b00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#ff6b00] to-[#ffa800] blur-3xl opacity-10 group-hover:opacity-30 transition-opacity duration-700 absolute"></div>
                <Network
                  size={100}
                  className="text-[#e5e5e5] relative z-10 animate-[spin_30s_linear_infinite]"
                  strokeWidth={1}
                />
                <div className="mt-8 text-center relative z-10 bg-[#050505]/80 backdrop-blur-md px-6 py-3 rounded-xl border border-[#1a1a1a]">
                  <p className="font-mono text-sm text-[#ff6b00] mb-1 font-bold tracking-widest flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#ff6b00] animate-pulse"></span>
                    SYSTEM_STATUS
                  </p>
                  <p className="text-sm text-[#737373] font-medium">Core Graph Engine Online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-[#050505] py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-gradient-to-b from-[#ff6b00]/5 to-transparent blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-8 tracking-tighter drop-shadow-sm">
            Ready to dive in?
          </h2>
          <p className="text-xl text-[#737373] mb-12 font-light">
            Join the next generation of developers understanding massive architectures at light
            speed.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/dashboard"
              className="flex justify-center items-center gap-2 px-10 py-5 bg-[#ff6b00] hover:bg-[#ff8c00] text-white font-bold text-lg rounded-xl transition-all duration-300 active:scale-[0.98] shadow-[0_0_30px_rgba(255,107,0,0.2)] hover:shadow-[0_0_40px_rgba(255,107,0,0.4)]"
            >
              Start Building Free
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
