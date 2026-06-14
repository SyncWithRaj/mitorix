"use client";

import Link from "next/link";
import { useState } from "react";
import Script from "next/script";
import {
  ArrowRight,
  ArrowUpRight,
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
  Cpu,
  GitBranch,
  Terminal,
  Flame,
  Activity,
  CheckCircle2,
  AlertTriangle,
  LineChart,
  Search,
  Sparkles,
  Loader2,
  Crown,
  Infinity,
  X,
} from "lucide-react";
import Footer from "@/components/layout/Footer";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "graph" | "blast">("chat");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePayment = async (planName: string, amountInPaise: number) => {
    setLoadingPlan(planName);
    try {
      const createOrderRes = await fetch("http://localhost:5000/api/v1/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountInPaise, currency: "INR" }),
      });

      if (!createOrderRes.ok) {
        const errText = await createOrderRes.text();
        throw new Error(`Failed to create order: ${errText}`);
      }

      const orderData = await createOrderRes.json();
      const keyId = orderData.key_id;
      
      if (!keyId) {
        throw new Error("Razorpay Key ID is not returned from the server.");
      }

      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: `RepoLens ${planName}`,
        description: `${planName} Plan Subscription`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          const verifyRes = await fetch("http://localhost:5000/api/v1/payments/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert("Payment successful!");
          } else {
            alert("Payment verification failed.");
          }
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#ff6b00",
        },
      };

      if (!(window as any).Razorpay) {
        throw new Error("Razorpay script not loaded. Please check your internet connection.");
      }
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        alert("Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (error: any) {
      console.error(error);
      alert("Error: " + (error.message || "Something went wrong!"));
    } finally {
      setLoadingPlan(null);
    }
  };

  const languages = [
    { name: "TypeScript", ext: ".ts / .tsx", color: "from-[#3178c6] to-[#235a97]", text: "white" },
    { name: "JavaScript", ext: ".js / .jsx", color: "from-[#f7df1e] to-[#d6c010]", text: "black" },
    { name: "Python", ext: ".py", color: "from-[#3776ab] to-[#255075]", text: "white" },
    { name: "Go Lang", ext: ".go", color: "from-[#00add8] to-[#007ca0]", text: "white" },
    { name: "Rust", ext: ".rs", color: "from-[#ce412b] to-[#962a1b]", text: "white" },
    { name: "Java", ext: ".java", color: "from-[#5382a1] to-[#f89820]", text: "white" },
    { name: "C / C++", ext: ".c / .cpp", color: "from-[#00599c] to-[#004478]", text: "white" },
    { name: "C#", ext: ".cs", color: "from-[#178600] to-[#106000]", text: "white" },
    { name: "Ruby", ext: ".rb", color: "from-[#701516] to-[#cc342d]", text: "white" },
    { name: "PHP", ext: ".php", color: "from-[#777bb4] to-[#595d90]", text: "white" },
    { name: "VBA", ext: ".vba", color: "from-[#86309b] to-[#601c70]", text: "white" },
  ];

  return (
    <div className="flex flex-col flex-grow items-center w-full overflow-hidden selection:bg-[#ff6b00] selection:text-white bg-[#000000] text-[#e5e5e5]">
      {/* Hero Section */}
      <section className="relative w-full min-h-[95vh] flex flex-col items-center justify-center pt-36 pb-24 px-6 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-[-10%] left-[-5%] w-[70vw] h-[70vw] max-w-[900px] bg-gradient-to-br from-[#ff6b00] to-[#ff4500] opacity-[0.07] blur-[140px] rounded-full pointer-events-none mix-blend-screen animate-glow-pulse"></div>
        <div className="absolute bottom-[5%] right-[-5%] w-[50vw] h-[50vw] max-w-[700px] bg-gradient-to-tl from-[#ff8c00] to-[#ffa800] opacity-[0.06] blur-[150px] rounded-full pointer-events-none mix-blend-screen animate-float"></div>
        <div className="absolute top-[30%] right-[15%] w-[350px] h-[350px] bg-[#ffaa00] opacity-[0.04] blur-[100px] rounded-full pointer-events-none animate-pulse-slow"></div>

        {/* Noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
        ></div>
        {/* Tech Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_20%,transparent_100%)] pointer-events-none"></div>

        <div className="max-w-6xl w-full text-center relative z-10 flex flex-col items-center">
          {/* Version badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#050505] border border-[#1a1a1a] text-xs font-semibold text-[#737373] mb-8 shadow-sm hover:border-[#ff6b00]/50 hover:text-[#e5e5e5] transition-all cursor-pointer group">
            <span className="flex h-2 w-2 rounded-full bg-[#ff6b00] animate-pulse"></span>
            <span>RepoLens AI v2.5: Qdrant Vector & Tree-sitter AST Core</span>
            <ArrowRight className="w-3 h-3 ml-1 text-[#737373] group-hover:text-white transform group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.05] pb-2 text-white">
            Understand your codebase. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] via-[#ffaa00] to-[#ff4500] drop-shadow-[0_0_35px_rgba(255,107,0,0.25)]">
              Faster than ever.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-2xl text-[#a3a3a3] mb-12 max-w-4xl leading-relaxed font-light px-4">
            RepoLens is an AI-powered architectural copilot. We parse your repository’s AST, index semantic relationships in a <span className="text-white font-medium">Qdrant vector space</span>, and render an interactive <span className="text-[#ff6b00] font-medium">dependency force-graph</span>. Converse with your code through natural language chat or voice calls.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-6 sm:w-auto mb-16">
            <Link
              href="/dashboard"
              className="group relative flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff8c00] hover:to-[#ffa200] text-white overflow-hidden transition-all duration-300 active:scale-[0.98] w-full sm:w-64 shadow-[0_0_25px_rgba(255,107,0,0.25)] hover:shadow-[0_0_40px_rgba(255,107,0,0.45)] border border-[#ff8c00]/30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative z-10 flex items-center gap-2">
                Launch RepoSpace
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              href="/about"
              className="group flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl bg-[#080808] hover:bg-[#121212] text-[#e5e5e5] border border-[#1a1a1a] hover:border-[#ff6b00]/40 transition-all duration-300 active:scale-[0.98] w-full sm:w-56 shadow-md"
            >
              System Architecture
            </Link>
          </div>

          {/* Premium UI Mockup Mock Preview */}
          <div className="w-full max-w-5xl mx-auto border border-[#1a1a1a] rounded-2xl bg-[#030303] shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-500 hover:border-[#ff6b00]/20">
            {/* Header / Tab Selector */}
            <div className="bg-[#050505] border-b border-[#1a1a1a] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-4">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#ff4500]/60"></span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#ff8c00]/60"></span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#ffa800]/60"></span>
                </div>
                <div className="h-4 w-[1px] bg-[#1a1a1a] hidden sm:block"></div>
                <span className="text-xs font-mono text-[#737373] hidden sm:block">REPOSPACE_SANDBOX</span>
              </div>
              <div className="flex bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-0.5">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "chat"
                      ? "bg-[#ff6b00] text-white shadow-md"
                      : "text-[#737373] hover:text-[#e5e5e5]"
                  }`}
                >
                  <MessageSquare size={13} />
                  Codebase Chat
                </button>
                <button
                  onClick={() => setActiveTab("graph")}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "graph"
                      ? "bg-[#ff6b00] text-white shadow-md"
                      : "text-[#737373] hover:text-[#e5e5e5]"
                  }`}
                >
                  <Network size={13} />
                  Force-Graph
                </button>
                <button
                  onClick={() => setActiveTab("blast")}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "blast"
                      ? "bg-[#ff6b00] text-white shadow-md"
                      : "text-[#737373] hover:text-[#e5e5e5]"
                  }`}
                >
                  <Flame size={13} />
                  Blast Radius
                </button>
              </div>
            </div>

            {/* Sandbox Body Content */}
            <div className="h-[460px] bg-[#000000] relative flex overflow-hidden text-left">
              {activeTab === "chat" && (
                <div className="flex-1 flex flex-col md:flex-row h-full">
                  {/* File tree */}
                  <div className="w-1/3 border-r border-[#1a1a1a] bg-[#030303] p-4 hidden md:block">
                    <span className="text-[10px] font-bold text-[#737373] uppercase tracking-widest block mb-4">REPOSPACE FILES</span>
                    <div className="space-y-2 text-xs font-mono text-[#a3a3a3]">
                      <div className="flex items-center gap-2 py-1 px-2 hover:bg-[#0a0a0a] rounded cursor-pointer">
                        <Code2 size={13} className="text-[#ff6b00]" />
                        <span>auth.controller.ts</span>
                      </div>
                      <div className="flex items-center gap-2 py-1 px-2 hover:bg-[#0a0a0a] rounded cursor-pointer text-white border-l border-[#ff6b00] bg-[#ff6b00]/5">
                        <Code2 size={13} className="text-[#ff8c00]" />
                        <span>rag.service.ts</span>
                      </div>
                      <div className="flex items-center gap-2 py-1 px-2 hover:bg-[#0a0a0a] rounded cursor-pointer">
                        <Code2 size={13} className="text-[#ffa800]" />
                        <span>qdrant.service.ts</span>
                      </div>
                      <div className="flex items-center gap-2 py-1 px-2 hover:bg-[#0a0a0a] rounded cursor-pointer">
                        <Code2 size={13} className="text-[#737373]" />
                        <span>server.ts</span>
                      </div>
                    </div>
                  </div>
                  {/* Chat messages */}
                  <div className="flex-1 flex flex-col justify-between p-6">
                    <div className="space-y-4 overflow-y-auto max-h-[340px] pr-2 custom-scrollbar">
                      <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[10px] font-bold text-white shrink-0 border border-[#ff8c00]/30 shadow-md">
                          UR
                        </div>
                        <div className="bg-[#050505] border border-[#1a1a1a] rounded-2xl p-4 text-sm max-w-[85%] text-[#e5e5e5]">
                          Where do we initialize the vector database client and index semantic chunks?
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#ff6b00] flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-md shadow-[#ff6b00]/20">
                          RL
                        </div>
                        <div className="bg-[#0a0a0a] border border-[#ff6b00]/10 rounded-2xl p-4 text-sm max-w-[85%] space-y-3">
                          <p className="text-[#e5e5e5]">
                            The vector DB is initialized inside <code className="text-[#ff8c00] font-mono bg-[#1a1a1a] px-1 py-0.5 rounded text-xs">qdrant.service.ts</code>. Chunks are ingested asynchronously:
                          </p>
                          <pre className="text-xs font-mono bg-[#030303] border border-[#1a1a1a] p-3 rounded-lg text-[#ffaa00] overflow-x-auto">
{`// Initialize Qdrant Client
const client = new QdrantClient({
  url: process.env.QDRANT_URL
});
// Upsert embedded code nodes
await client.upsert(collectionName, {
  points: pointsData
});`}
                          </pre>
                          <p className="text-[#737373] text-xs">
                            💡 Cloned files are parsed with Tree-sitter and deleted immediately after embedding.
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Fake prompt input */}
                    <div className="relative mt-4">
                      <input
                        type="text"
                        disabled
                        placeholder="Search RepoSpace index or query architecture..."
                        className="w-full bg-[#050505] border border-[#1a1a1a] rounded-xl px-4 py-3 text-xs text-[#a3a3a3] outline-none"
                      />
                      <div className="absolute right-3 top-2.5 flex items-center gap-2">
                        <span className="text-[10px] text-[#737373] bg-[#1a1a1a] px-2 py-1 rounded border border-[#1a1a1a]">Enter</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "graph" && (
                <div className="flex-1 relative bg-[#010101] overflow-hidden flex items-center justify-center p-6">
                  {/* Glowing core */}
                  <div className="absolute w-[200px] h-[200px] bg-[#ff6b00]/10 rounded-full blur-[80px]"></div>
                  
                  {/* SVG Mock Graph */}
                  <svg className="w-full h-full max-w-[600px] max-h-[350px] relative z-10" viewBox="0 0 600 350">
                    <line x1="150" y1="120" x2="300" y2="175" stroke="#ff6b00" strokeWidth="2" strokeDasharray="4 2" opacity="0.7" />
                    <line x1="220" y1="80" x2="300" y2="175" stroke="#ff8c00" strokeWidth="1.5" opacity="0.6" />
                    <line x1="450" y1="110" x2="300" y2="175" stroke="#ffa800" strokeWidth="2" strokeDasharray="3 3" opacity="0.7" />
                    <line x1="380" y1="260" x2="300" y2="175" stroke="#ff6b00" strokeWidth="1.5" opacity="0.5" />
                    <line x1="180" y1="240" x2="300" y2="175" stroke="#ff4500" strokeWidth="2" opacity="0.8" />
                    <line x1="150" y1="120" x2="220" y2="80" stroke="#1a1a1a" strokeWidth="1" />
                    <line x1="380" y1="260" x2="450" y2="110" stroke="#1a1a1a" strokeWidth="1" />

                    {/* Nodes */}
                    <circle cx="300" cy="175" r="16" fill="#ff6b00" className="animate-pulse shadow-lg shadow-[#ff6b00]" />
                    <circle cx="150" cy="120" r="10" fill="#ff8c00" />
                    <circle cx="220" cy="80" r="8" fill="#ffa800" />
                    <circle cx="450" cy="110" r="11" fill="#ffa800" />
                    <circle cx="380" cy="260" r="9" fill="#ff6b00" />
                    <circle cx="180" cy="240" r="10" fill="#ff4500" />

                    {/* Node labels */}
                    <text x="300" y="205" fill="#white" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">qdrant.service.ts</text>
                    <text x="150" y="142" fill="#737373" fontSize="9" fontFamily="monospace" textAnchor="middle">astParser.ts</text>
                    <text x="220" y="65" fill="#737373" fontSize="9" fontFamily="monospace" textAnchor="middle">complexity.service.ts</text>
                    <text x="450" y="93" fill="#737373" fontSize="9" fontFamily="monospace" textAnchor="middle">rag.service.ts</text>
                    <text x="380" y="282" fill="#737373" fontSize="9" fontFamily="monospace" textAnchor="middle">db.model.ts</text>
                    <text x="180" y="260" fill="#737373" fontSize="9" fontFamily="monospace" textAnchor="middle">server.ts</text>
                  </svg>

                  {/* Panel info overlay */}
                  <div className="absolute bottom-4 left-4 bg-[#050505]/95 border border-[#1a1a1a] rounded-lg p-3 text-[10px] font-mono text-[#a3a3a3] max-w-[220px]">
                    <div className="text-white font-bold mb-1">INTERACTIVE FORCE MODE</div>
                    <div>Nodes: <span className="text-[#ff6b00]">6 Files</span></div>
                    <div>Edges: <span className="text-[#ff8c00]">5 Calls</span></div>
                    <div className="mt-1 text-[9px] text-[#737373]">Hover any node to trace caller-callee bindings.</div>
                  </div>
                </div>
              )}

              {activeTab === "blast" && (
                <div className="flex-1 flex flex-col md:flex-row h-full">
                  {/* Left list */}
                  <div className="w-1/3 border-r border-[#1a1a1a] bg-[#030303] p-4 hidden md:block">
                    <span className="text-[10px] font-bold text-[#737373] uppercase tracking-widest block mb-4">CRITICAL IMPACT FILES</span>
                    <div className="space-y-1">
                      <div className="p-2 rounded bg-[#ff4500]/10 border border-[#ff4500]/20 text-xs text-white">
                        <div className="font-bold flex items-center justify-between">
                          <span>auth.service.ts</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-[#ff4500] text-white rounded font-mono">CRITICAL</span>
                        </div>
                        <div className="text-[10px] text-[#737373] mt-1">Impact depth: 3, Centrality: 82%</div>
                      </div>
                      <div className="p-2 rounded hover:bg-[#0a0a0a] text-xs text-[#a3a3a3] cursor-pointer">
                        <div className="font-bold">db.model.ts</div>
                        <div className="text-[10px] text-[#737373] mt-0.5">Impact depth: 2, Centrality: 58%</div>
                      </div>
                    </div>
                  </div>
                  {/* Visualizer blast radius details */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="text-[#ff4500]" size={20} />
                        <h4 className="text-lg font-bold text-white">Impact Blast Radius (BFS Depth 3)</h4>
                      </div>
                      <p className="text-xs text-[#a3a3a3] leading-relaxed">
                        Simulating modification risk analysis for <code className="text-white bg-[#1a1a1a] px-1 rounded">auth.service.ts</code>. The modification modifies security tokens and user metadata, propagating changes to downstream components.
                      </p>
                      
                      {/* Downstream tree visual */}
                      <div className="border border-[#1a1a1a] rounded-xl p-4 bg-[#030303] space-y-3 font-mono text-xs">
                        <div className="flex items-center gap-2 text-white">
                          <span className="text-[#ff4500]">●</span>
                          <span>auth.service.ts</span>
                          <span className="text-[#737373] text-[10px]">(Trigger point)</span>
                        </div>
                        <div className="pl-4 border-l border-[#1a1a1a] ml-1.5 space-y-2">
                          <div className="flex items-center gap-2 text-[#e5e5e5]">
                            <span className="text-[#ff8c00]">↳</span>
                            <span>auth.controller.ts</span>
                            <span className="text-[#ff4500] text-[9px] px-1 rounded bg-[#ff4500]/10 border border-[#ff4500]/20 font-sans">Direct</span>
                          </div>
                          <div className="pl-4 border-l border-[#1a1a1a] ml-1.5">
                            <div className="flex items-center gap-2 text-[#a3a3a3]">
                              <span>↳</span>
                              <span>server.ts</span>
                              <span className="text-[#ffa800] text-[9px] px-1 rounded bg-[#ffa800]/10 border border-[#ffa800]/20 font-sans">Depth 2</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[#e5e5e5]">
                            <span className="text-[#ff8c00]">↳</span>
                            <span>user.routes.ts</span>
                            <span className="text-[#ff4500] text-[9px] px-1 rounded bg-[#ff4500]/10 border border-[#ff4500]/20 font-sans">Direct</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-[#737373] bg-[#050505] p-3 rounded-lg border border-[#1a1a1a] flex justify-between items-center">
                      <span>Total blast impact: <b>4 files affected</b></span>
                      <span className="text-[#ff6b00] font-bold">Risk Level: High</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Ephemeral Architecture Lifecycle Timeline */}
      <section className="w-full bg-[#050505] border-y border-[#1a1a1a] py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/30 text-[#ff6b00] text-xs font-mono uppercase tracking-wider mb-6">
              Pipeline Flow
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
              The Ephemeral Parsing Lifecycle
            </h2>
            <p className="text-[#a3a3a3] max-w-2xl mx-auto text-lg font-light">
              RepoLens clones repositories asynchronously, extracts AST architecture matrices, embeds code blocks, and securely deletes the disk clone instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {/* Steps line */}
            <div className="hidden md:block absolute top-[40px] left-[12%] right-[12%] h-[1px] bg-gradient-to-r from-transparent via-[#1a1a1a] to-transparent -z-10"></div>

            {/* Step 1 */}
            <div className="group flex flex-col items-center text-center p-4 bg-black/40 border border-[#1a1a1a] rounded-2xl hover:border-[#ff6b00]/40 transition-all duration-300">
              <div className="w-20 h-20 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform group-hover:shadow-[0_0_20px_rgba(255,107,0,0.15)] relative">
                <Terminal className="text-[#ff6b00] w-8 h-8" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#ff6b00] text-[10px] font-bold text-white flex items-center justify-center border border-black shadow">01</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Queue & Clone</h4>
              <p className="text-[#737373] text-sm leading-relaxed">
                BullMQ + Redis dispatches a job to clone the repository to an isolated <code className="text-[11px] font-mono px-1 py-0.2 bg-[#1a1a1a] text-white">/tmp</code> directory, checking GitHub credentials.
              </p>
            </div>

            {/* Step 2 */}
            <div className="group flex flex-col items-center text-center p-4 bg-black/40 border border-[#1a1a1a] rounded-2xl hover:border-[#ff8c00]/40 transition-all duration-300">
              <div className="w-20 h-20 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform group-hover:shadow-[0_0_20px_rgba(255,140,0,0.15)] relative">
                <Cpu className="text-[#ff8c00] w-8 h-8" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#ff8c00] text-[10px] font-bold text-white flex items-center justify-center border border-black shadow">02</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">AST Extraction</h4>
              <p className="text-[#737373] text-sm leading-relaxed">
                High-fidelity parsing via **Tree-sitter** spans 11 languages to resolve scopes, functions, parameters, layers, and cyclic dependency calls.
              </p>
            </div>

            {/* Step 3 */}
            <div className="group flex flex-col items-center text-center p-4 bg-black/40 border border-[#1a1a1a] rounded-2xl hover:border-[#ffa800]/40 transition-all duration-300">
              <div className="w-20 h-20 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform group-hover:shadow-[0_0_20px_rgba(255,168,0,0.15)] relative">
                <Database className="text-[#ffa800] w-8 h-8" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#ffa800] text-[10px] font-bold text-white flex items-center justify-center border border-black shadow">03</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Qdrant Embeddings</h4>
              <p className="text-[#737373] text-sm leading-relaxed">
                Code fragments are converted into high-dimensional vectors via Google Gemini and indexed inside **Qdrant DB** for semantic RAG search context.
              </p>
            </div>

            {/* Step 4 */}
            <div className="group flex flex-col items-center text-center p-4 bg-black/40 border border-[#1a1a1a] rounded-2xl hover:border-[#ff6b00]/40 transition-all duration-300">
              <div className="w-20 h-20 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform group-hover:shadow-[0_0_20px_rgba(255,107,0,0.15)] relative">
                <Shield className="text-[#ff6b00] w-8 h-8" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#ff6b00] text-[10px] font-bold text-white flex items-center justify-center border border-black shadow">04</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Wipe & Unlock</h4>
              <p className="text-[#737373] text-sm leading-relaxed">
                Physical folders are wiped securely. Downstream vector indices and MongoDB metadata are cached to unlock immediate user exploration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section: Static Telemetry and Codeflow Analysis */}
      <section className="w-full max-w-6xl mx-auto py-32 px-6 relative">
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/30 text-[#ff6b00] text-xs font-mono uppercase tracking-wider mb-6">
            Static Analysis Telemetry
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
            Architecture Intelligence Under the Hood
          </h2>
          <p className="text-[#a3a3a3] max-w-2xl mx-auto text-lg font-light">
            RepoLens doesn't just read code; it analyzes architectural safety, identifies structural pattern classes, and monitors coupling complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="group bg-[#030303] border border-[#1a1a1a] p-8 rounded-2xl hover:border-[#ff6b00]/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <Code2 size={130} className="text-[#ff6b00]" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-6 group-hover:border-[#ff6b00]/40 transition-colors">
              <Activity className="text-[#ff6b00] w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Cyclomatic Complexity</h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              We count branches, loops, case triggers, and conditionals. The system logs critical warnings if function scores exceed threshold boundaries (low 0-15, medium 16-30, critical 30+).
            </p>
          </div>

          {/* Card 2 */}
          <div className="group bg-[#030303] border border-[#1a1a1a] p-8 rounded-2xl hover:border-[#ff8c00]/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <Shield size={130} className="text-[#ff8c00]" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-6 group-hover:border-[#ff8c00]/40 transition-colors">
              <AlertTriangle className="text-[#ff8c00] w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Vulnerability Scan</h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              Automated rules trace security threats: hardcoded credentials, SQL injection attempts, unescaped XSS injections, path traversals, unsafe eval usage, and outdated cryptographic algorithms.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group bg-[#030303] border border-[#1a1a1a] p-8 rounded-2xl hover:border-[#ffa800]/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <Layers size={130} className="text-[#ffa800]" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-6 group-hover:border-[#ffa800]/40 transition-colors">
              <Workflow className="text-[#ffa800] w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Architectural Layers</h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              Automatically indexes RepoSpace structures into logic zones: Controller, Service, Model, View, and Utils. Warns when dependencies violate boundary patterns (e.g. Model referencing Controller).
            </p>
          </div>

          {/* Card 4 */}
          <div className="group bg-[#030303] border border-[#1a1a1a] p-8 rounded-2xl hover:border-[#ffa800]/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <Bot size={130} className="text-[#ffa800]" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-6 group-hover:border-[#ffa800]/40 transition-colors">
              <Bot className="text-[#ffa800] w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Voice-Driven Exploration</h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              Query codehands-free. A full speech pipeline converts your audio via AssemblyAI (STT) ➔ reasons with codebase vector context via Gemini ➔ and reads replies via Murf AI (TTS) voice streams.
            </p>
          </div>

          {/* Card 5 */}
          <div className="group bg-[#030303] border border-[#1a1a1a] p-8 rounded-2xl hover:border-[#ff6b00]/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <Sparkles size={130} className="text-[#ff6b00]" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-6 group-hover:border-[#ff6b00]/40 transition-colors">
              <Sparkles className="text-[#ff6b00] w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Pattern & Anti-Pattern Search</h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              Scan directory schemas to locate implementations of design patterns (Singleton, Factory, Observer, Repository, MVC) and identify anti-patterns (God Objects, Long Files, Feature Envy).
            </p>
          </div>

          {/* Card 6 */}
          <div className="group bg-[#030303] border border-[#1a1a1a] p-8 rounded-2xl hover:border-[#ff8c00]/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <LineChart size={130} className="text-[#ff8c00]" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-6 group-hover:border-[#ff8c00]/40 transition-colors">
              <CheckCircle2 className="text-[#ff8c00] w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Unified Repository Health</h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              Consolidates indices to output a 0-100 overall health grade. Scoring deducts points for circular dependencies, dead code structures, God files, high coupling ratio, and high-severity security leaks.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Section: RepoLabs Intelligence */}
      <section className="w-full max-w-6xl mx-auto pb-32 px-6 relative">
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff8c00]/10 border border-[#ff8c00]/30 text-[#ff8c00] text-xs font-mono uppercase tracking-wider mb-6">
            Vector Intelligence
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
            RepoLabs: Beyond Traditional Grep
          </h2>
          <p className="text-[#a3a3a3] max-w-2xl mx-auto text-lg font-light">
            We repurpose the Qdrant vector embeddings generated during ingestion to unlock deep semantic codebase intelligence features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group bg-[#050505] border border-[#1a1a1a] p-8 rounded-2xl hover:border-[#ff8c00]/40 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <Search size={120} className="text-[#ff8c00]" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-6 group-hover:border-[#ff8c00]/40 transition-colors shadow-lg">
              <Search className="text-[#ff8c00] w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Natural Language Search</h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              Stop guessing variable names. Search your codebase using plain English queries. Qdrant’s Cosine similarity matching retrieves semantically relevant AST blocks even if exact keywords are absent.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group bg-[#050505] border border-[#1a1a1a] p-8 rounded-2xl hover:border-[#ff6b00]/40 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <Layers size={120} className="text-[#ff6b00]" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-6 group-hover:border-[#ff6b00]/40 transition-colors shadow-lg">
              <GitBranch className="text-[#ff6b00] w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Semantic Clone Detection</h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              Find hidden code duplication. Our clustering algorithm scans the entire vector space to identify blocks of code that perform identical logic, bypassing differences in formatting or variable nomenclature.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group bg-[#050505] border border-[#1a1a1a] p-8 rounded-2xl hover:border-[#ffa800]/40 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <Activity size={120} className="text-[#ffa800]" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-6 group-hover:border-[#ffa800]/40 transition-colors shadow-lg">
              <Activity className="text-[#ffa800] w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Version Drift Tracking</h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              Track semantic evolution across time. By computing vector distances between indexed versions, RepoLabs highlights true behavioral drift and structural deviations that standard text diffs completely miss.
            </p>
          </div>
        </div>
      </section>

      {/* Language Support Matrix Grid */}
      <section className="w-full bg-[#050505] border-y border-[#1a1a1a] py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff8c00]/10 border border-[#ff8c00]/30 text-[#ff8c00] text-xs font-mono uppercase tracking-wider mb-6">
              Language Matrix
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
              Multi-Language High-Fidelity AST Support
            </h2>
            <p className="text-[#a3a3a3] max-w-2xl mx-auto text-lg font-light">
              RepoLens bypasses fragile regex code matching by compiling high-fidelity ASTs using dedicated language parsers.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {languages.map((lang, idx) => (
              <div
                key={idx}
                className="group relative bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-xl hover:border-[#ff6b00]/35 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(255,107,0,0.1)] flex flex-col justify-between items-center text-center overflow-hidden"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${lang.color} flex items-center justify-center font-bold text-xs shadow-md shrink-0 mb-3`} style={{ color: lang.text }}>
                  {lang.name.substring(0, 2)}
                </div>
                <div className="text-sm font-bold text-white group-hover:text-[#ff8c00] transition-colors">{lang.name}</div>
                <div className="text-[10px] text-[#737373] mt-1 font-mono">{lang.ext}</div>
              </div>
            ))}
            <div className="group bg-[#030303] border border-dashed border-[#262626] p-5 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-xs text-[#737373] font-medium uppercase tracking-widest mb-1">Coming Soon</span>
              <span className="text-[11px] text-[#525252] font-mono">Scala, Swift, Kotlin</span>
            </div>
          </div>
        </div>
      </section>

      {/* Comparative Matrix Section */}
      <section className="w-full max-w-6xl mx-auto py-32 px-6 relative">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffaa00]/10 border border-[#ffaa00]/30 text-[#ffaa00] text-xs font-mono uppercase tracking-wider mb-6">
            Compare Stack
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
            Why RepoLens is Different
          </h2>
          <p className="text-[#a3a3a3] max-w-2xl mx-auto text-lg font-light">
            Traditional searches and standard LLMs fail when tackling large codebase dependency linkages. Here is how we compare.
          </p>
        </div>

        <div className="overflow-x-auto border border-[#1a1a1a] rounded-2xl bg-[#030303]">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a] bg-[#050505] text-[#737373] font-mono text-xs uppercase">
                <th className="p-6">Analysis Capabilities</th>
                <th className="p-6">Legacy Regex Grep</th>
                <th className="p-6">Standard AI Chat</th>
                <th className="p-6 text-white font-bold bg-[#ff6b00]/10 border-x border-[#ff6b00]/20">RepoLens Engine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a] text-[#a3a3a3]">
              <tr>
                <td className="p-6 font-bold text-white">Codebase Ingestion</td>
                <td className="p-6">Instant (Local index only)</td>
                <td className="p-6">File-by-file copy-paste</td>
                <td className="p-6 text-white bg-[#ff6b00]/5 border-x border-[#ff6b00]/10">Asynchronous via Git URL (BullMQ Queue)</td>
              </tr>
              <tr>
                <td className="p-6 font-bold text-white">Semantic Search Basis</td>
                <td className="p-6">Exact word matches only</td>
                <td className="p-6">General model reasoning</td>
                <td className="p-6 text-white bg-[#ff6b00]/5 border-x border-[#ff6b00]/10">High-dimensional Qdrant Vector embeddings</td>
              </tr>
              <tr>
                <td className="p-6 font-bold text-white">AST Relationship Maps</td>
                <td className="p-6">None</td>
                <td className="p-6">Inferred from file text</td>
                <td className="p-6 text-white bg-[#ff6b00]/5 border-x border-[#ff6b00]/10">Full parsing across 11 Tree-sitter compilers</td>
              </tr>
              <tr>
                <td className="p-6 font-bold text-white">Blast Radius Trace</td>
                <td className="p-6">Manual reference matching</td>
                <td className="p-6">Imprecise guesses</td>
                <td className="p-6 text-white bg-[#ff6b00]/5 border-x border-[#ff6b00]/10">D3 BFS dependency graphs (Depth 3 traversal)</td>
              </tr>
              <tr>
                <td className="p-6 font-bold text-white">Security & Churn Scans</td>
                <td className="p-6">Static regex files</td>
                <td className="p-6">General code safety</td>
                <td className="p-6 text-white bg-[#ff6b00]/5 border-x border-[#ff6b00]/10">Vulnerability scanning & circular dep detectors</td>
              </tr>
              <tr>
                <td className="p-6 font-bold text-white">Code Disk Persistence</td>
                <td className="p-6">Persistent storage</td>
                <td className="p-6">Cached prompts on vendor disk</td>
                <td className="p-6 text-white bg-[#ff6b00]/5 border-x border-[#ff6b00]/10"><b>Zero disk footprint</b> (Ephemeral deletes)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full max-w-7xl mx-auto py-32 px-6 relative border-t border-[#1a1a1a]">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        
        {/* Glow effects for pricing */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[60vw] max-w-[800px] h-[300px] bg-[#ff6b00] opacity-[0.05] blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[30vw] max-w-[400px] h-[200px] bg-[#ff8c00] opacity-[0.04] blur-[100px] rounded-full pointer-events-none"></div>

        <div className="text-center mb-20 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/30 text-[#ff6b00] text-xs font-mono uppercase tracking-wider mb-6">
            Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
            Pick Your Analysis Tier
          </h2>
          <p className="text-[#a3a3a3] max-w-xl mx-auto text-lg font-light leading-relaxed">
            Start free with 2 repos. Scale up as your codebase grows — no hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto relative z-10">

          {/* ─── FREE TIER ─── */}
          <div className="bg-[#030303]/80 backdrop-blur-xl border border-[#1a1a1a] rounded-3xl p-8 lg:p-10 flex flex-col hover:border-[#ff6b00]/20 transition-all duration-500 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Tier badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#262626] text-[#737373] text-[10px] font-bold uppercase tracking-widest mb-5 w-fit">
              <Zap size={12} />
              Starter
            </div>

            <h2 className="text-2xl font-bold mb-1 text-white/90">Free</h2>
            <div className="text-5xl font-extrabold mb-1 text-white">₹0 <span className="text-xl text-[#737373] font-medium">/month</span></div>
            <p className="text-sm text-[#737373] mb-8 font-light">Perfect for exploring the platform.</p>

            {/* Limits highlight */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-white">2</div>
                <div className="text-[10px] text-[#737373] font-medium uppercase tracking-wider">Repos</div>
              </div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-white">1K</div>
                <div className="text-[10px] text-[#737373] font-medium uppercase tracking-wider">Msg/Month</div>
              </div>
            </div>

            <ul className="space-y-3.5 mb-10 flex-1 relative z-10">
              <li className="flex items-start gap-3 text-sm text-[#a3a3a3]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#737373] shrink-0" />
                <span>Basic Codebase Analysis</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#a3a3a3]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#737373] shrink-0" />
                <span>AI Chat — <span className="text-white font-medium">2 msg/min</span> rate limit</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#a3a3a3]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#737373] shrink-0" />
                <span>Force-Graph Visualization</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#a3a3a3]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#737373] shrink-0" />
                <span>Community Support</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#525252]">
                <X className="w-4 h-4 mt-0.5 text-[#333] shrink-0" />
                <span>Advanced Blast Radius Scans</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#525252]">
                <X className="w-4 h-4 mt-0.5 text-[#333] shrink-0" />
                <span>Priority Support</span>
              </li>
            </ul>

            <button disabled className="w-full py-4 px-6 rounded-xl font-semibold bg-[#0a0a0a] text-[#737373] cursor-not-allowed border border-[#1a1a1a] transition-all">
              Current Plan
            </button>
          </div>

          {/* ─── BASIC TIER (₹99) — MOST POPULAR ─── */}
          <div className="bg-gradient-to-b from-[#ff6b00]/10 to-[#030303] border border-[#ff6b00]/30 rounded-3xl p-8 lg:p-10 flex flex-col relative hover:border-[#ff6b00]/50 transition-all duration-500 shadow-[0_0_30px_rgba(255,107,0,0.1)] overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            {/* Most Popular + Tier badge */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-[10px] font-bold text-white uppercase tracking-wider">
                Most Popular
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">Basic</h2>
            <div className="text-5xl font-extrabold mb-1 text-white">
              ₹99 <span className="text-xl text-[#737373] font-medium">/month</span>
            </div>
            <p className="text-sm text-[#ff8c00] mb-8 font-medium">10x more repos, 10x more messages.</p>

            {/* Limits highlight */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-[#0a0a0a]/80 border border-[#ff6b00]/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-white">10</div>
                <div className="text-[10px] text-[#ff8c00]/70 font-medium uppercase tracking-wider">Repos</div>
              </div>
              <div className="bg-[#0a0a0a]/80 border border-[#ff6b00]/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-white">10K</div>
                <div className="text-[10px] text-[#ff8c00]/70 font-medium uppercase tracking-wider">Msg/Month</div>
              </div>
            </div>
            
            <ul className="space-y-3.5 mb-10 flex-1 relative z-10">
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ff6b00] shrink-0" />
                <span>Full Codebase Analysis</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ff6b00] shrink-0" />
                <span>AI Chat — <span className="text-[#ff8c00] font-semibold">No rate limit</span></span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ff6b00] shrink-0" />
                <span>Advanced Force-Graph Visualizations</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ff6b00] shrink-0" />
                <span>Blast Radius & Vulnerability Scans</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ff6b00] shrink-0" />
                <span>Standard Support</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#525252]">
                <X className="w-4 h-4 mt-0.5 text-[#333] shrink-0" />
                <span>Voice-Driven Exploration</span>
              </li>
            </ul>

            <button 
              onClick={() => handlePayment("Basic", 9900)}
              disabled={loadingPlan === "Basic"}
              className="w-full py-4 px-6 rounded-xl font-bold bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff8c00] hover:to-[#ffa200] text-white transition-all duration-300 shadow-[0_0_25px_rgba(255,107,0,0.35)] hover:shadow-[0_0_40px_rgba(255,107,0,0.5)] flex justify-center items-center active:scale-[0.98] border border-[#ff8c00]/30 relative overflow-hidden group/btn"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <span className="relative z-10 flex items-center gap-2">
                {loadingPlan === "Basic" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Upgrade to Basic"}
              </span>
            </button>
          </div>

          {/* ─── PRO TIER (₹199) ─── */}
          <div className="bg-[#030303]/80 backdrop-blur-xl border border-[#1a1a1a] rounded-3xl p-8 lg:p-10 flex flex-col hover:border-[#ffa800]/30 transition-all duration-500 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ffa800]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            {/* Subtle sparkle */}
            <Sparkles className="absolute bottom-6 right-6 text-[#ffa800]/20 w-20 h-20 -z-10 group-hover:scale-110 transition-transform duration-700" strokeWidth={1} />

            {/* Tier badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffa800]/10 border border-[#ffa800]/30 text-[#ffa800] text-[10px] font-bold uppercase tracking-widest mb-5 w-fit">
              <Sparkles size={12} />
              Enterprise
            </div>

            <h2 className="text-2xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-[#ffa800] to-[#ff8c00]">Pro</h2>
            <div className="text-5xl font-extrabold mb-1 text-white">
              ₹199 <span className="text-xl text-[#737373] font-medium">/month</span>
            </div>
            <p className="text-sm text-[#ffa800]/80 mb-8 font-medium">Unlimited everything. No limits.</p>

            {/* Limits highlight */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-[#0a0a0a] border border-[#ffa800]/15 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center">
                  <Infinity className="w-7 h-7 text-[#ffa800]" />
                </div>
                <div className="text-[10px] text-[#ffa800]/60 font-medium uppercase tracking-wider mt-1">Repos</div>
              </div>
              <div className="bg-[#0a0a0a] border border-[#ffa800]/15 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center">
                  <Infinity className="w-7 h-7 text-[#ffa800]" />
                </div>
                <div className="text-[10px] text-[#ffa800]/60 font-medium uppercase tracking-wider mt-1">Msg/Month</div>
              </div>
            </div>

            <ul className="space-y-3.5 mb-10 flex-1 relative z-10">
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ffa800] shrink-0" />
                <span>Unlimited Codebase Analysis</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ffa800] shrink-0" />
                <span>AI Chat — <span className="text-[#ffa800] font-semibold">Unlimited, no rate limit</span></span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ffa800] shrink-0" />
                <span>Advanced Force-Graph Visualizations</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ffa800] shrink-0" />
                <span>Blast Radius & Vulnerability Scans</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ffa800] shrink-0" />
                <span>Voice-Driven Exploration</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ffa800] shrink-0" />
                <span>Priority 24/7 Support</span>
              </li>
            </ul>

            <button 
              onClick={() => handlePayment("Pro", 19900)}
              disabled={loadingPlan === "Pro"}
              className="w-full py-4 px-6 rounded-xl font-bold bg-[#0a0a0a] hover:bg-[#121212] text-[#ffa800] border border-[#ffa800]/30 hover:border-[#ffa800]/60 transition-all duration-300 shadow-md hover:shadow-[0_0_30px_rgba(255,168,0,0.15)] flex justify-center items-center active:scale-[0.98] relative overflow-hidden group/btn"
            >
              <div className="absolute inset-0 bg-[#ffa800]/10 translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <span className="relative z-10 flex items-center gap-2">
                {loadingPlan === "Pro" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Upgrade to Pro"}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing footnote */}
        <div className="text-center mt-12 relative z-10">
          <p className="text-xs text-[#525252] max-w-xl mx-auto">
            All plans include access to the core RepoLens engine. Prices are in INR and billed monthly via Razorpay. Cancel anytime.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-[#050505] py-32 px-6 text-center relative overflow-hidden border-t border-[#1a1a1a]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-gradient-to-b from-[#ff6b00]/10 to-transparent blur-[110px] pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-8 tracking-tighter">
            Stop reading code. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ffa800]">Start maps exploration.</span>
          </h2>
          <p className="text-lg md:text-xl text-[#737373] mb-12 font-light max-w-2xl mx-auto leading-relaxed">
            Gain immediate spatial clarity over your codebase, debug downstream integration issues, and onboard engineers in minutes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-sm mx-auto">
            <Link
              href="/dashboard"
              className="flex justify-center items-center gap-2 px-10 py-5 bg-[#ff6b00] hover:bg-[#ff8c00] text-white font-bold text-lg rounded-xl transition-all duration-300 active:scale-[0.98] shadow-[0_0_30px_rgba(255,107,0,0.25)] hover:shadow-[0_0_40px_rgba(255,107,0,0.55)] border border-[#ff8c00]/30"
            >
              Analyze Your Repository
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
