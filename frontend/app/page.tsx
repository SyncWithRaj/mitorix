"use client";

import Link from "next/link";
import BorderGlow from "@/components/ui/BorderGlow";
import { useState, useEffect } from "react";
import Script from "next/script";
import api from "@/lib/axios";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Code2,
  Cpu,
  Database,
  Globe,
  Layout,
  MessageSquare,
  Network,
  Rocket,
  Search,
  Server,
  Shield,
  Smartphone,
  Sparkles,
  Loader2,
  Crown,
  Infinity,
  X,
  Flame,
  CheckCircle2,
  Zap,
  Layers,
  Workflow,
  Bot,
  GitBranch,
  Terminal,
  Activity,
  AlertTriangle,
  LineChart,
} from "lucide-react";
import Footer from "@/components/layout/Footer";
import Silk from "@/components/ui/Silk";
import ScrollVelocity from "@/components/ui/ScrollVelocity";
import Shuffle from "@/components/ui/Shuffle";
import VectorIntelligence from "@/components/ui/VectorIntelligence";
import TimelineSteps from "@/components/ui/TimelineSteps";
import { SiTypescript, SiJavascript, SiPython, SiGo, SiRust, SiCplusplus, SiRuby, SiPhp } from 'react-icons/si';
import { FaJava } from 'react-icons/fa';
import { TbBrandCSharp } from 'react-icons/tb';

const LiveChatMock = () => {
  const [hasSent, setHasSent] = useState(false);
  const [inputValue, setInputValue] = useState("Where do we initialize the vector database client and index semantic chunks?");
  const [sentMessage, setSentMessage] = useState("");
  
  const [displayedText, setDisplayedText] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [showTip, setShowTip] = useState(false);
  
  const fullText = "The vector DB is initialized inside qdrant.service.ts. Chunks are ingested asynchronously:";
  
  useEffect(() => {
    if (!hasSent) return;
    
    let i = 0;
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedText(fullText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        setTimeout(() => setShowCode(true), 400);
        setTimeout(() => setShowTip(true), 1200);
      }
    }, 25);
    return () => clearInterval(timer);
  }, [hasSent]);

  const handleSend = () => {
    if (inputValue.trim()) {
      setSentMessage(inputValue);
      setInputValue("");
      setHasSent(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      <div className="space-y-4 overflow-y-auto max-h-[340px] pr-2 custom-scrollbar">
        {hasSent ? (
          <>
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[10px] font-bold text-white shrink-0 border border-[#ff8c00]/30 shadow-md">
                UR
              </div>
              <div className="bg-[#050505] border border-[#1a1a1a] rounded-2xl p-4 text-sm max-w-[85%] text-[#e5e5e5] animate-fadeIn">
                {sentMessage}
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#ff6b00] flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-md shadow-[#ff6b00]/20 animate-fadeIn" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                RL
              </div>
              <div className="bg-[#0a0a0a] border border-[#ff6b00]/10 rounded-2xl p-4 text-sm max-w-[85%] space-y-3 animate-fadeIn w-full" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                <p className="text-[#e5e5e5] min-h-[20px]">
                  {displayedText}
                  {displayedText.length < fullText.length && <span className="inline-block w-1.5 h-3.5 bg-[#ff6b00] ml-1 animate-pulse align-middle"></span>}
                </p>
                {showCode && (
                  <pre className="text-xs font-mono bg-[#030303] border border-[#1a1a1a] p-3 rounded-lg text-[#ffaa00] overflow-x-auto animate-fadeIn">
                    {`// Initialize Qdrant Client
const client = new QdrantClient({
  url: process.env.QDRANT_URL
});
// Upsert embedded code nodes
await client.upsert(collectionName, {
  points: pointsData
});`}
                  </pre>
                )}
                {showTip && (
                  <p className="text-[#737373] text-xs animate-fadeIn">
                    💡 Cloned files are parsed with Tree-sitter and deleted immediately after embedding.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#737373] text-sm space-y-4 pt-10 animate-fadeIn">
            <div className="w-12 h-12 rounded-full border border-[#1a1a1a] bg-[#050505] flex items-center justify-center">
              <MessageSquare size={20} className="text-[#a3a3a3]" />
            </div>
            <p>Ask anything about your codebase architecture.</p>
          </div>
        )}
      </div>
      
      {/* Fake prompt input */}
      <div className="relative mt-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          disabled={hasSent}
          placeholder="Search MitorixSpace index or query architecture..."
          className="w-full bg-[#050505] border border-[#1a1a1a] rounded-xl px-4 py-3 text-xs text-[#a3a3a3] outline-none focus:border-[#ff6b00]/50 transition-colors"
        />
        <button 
          onClick={handleSend}
          disabled={hasSent || !inputValue.trim()}
          className={`absolute right-2 top-2 p-1.5 rounded-lg flex items-center justify-center transition-all duration-300 ${
            hasSent 
              ? "bg-[#1a1a1a] text-[#ff6b00]"
              : inputValue.trim()
                ? "bg-[#ff6b00] text-white hover:bg-[#ff8c00] hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(255,107,0,0.3)]"
                : "bg-[#1a1a1a] text-[#737373]"
          }`}
        >
          {hasSent ? (
            <CheckCircle2 size={16} />
          ) : (
            <ArrowUpRight size={16} className={`transition-transform duration-300 ${inputValue.trim() ? "translate-x-0.5 -translate-y-0.5" : ""}`} />
          )}
        </button>
      </div>
    </div>
  );
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "graph" | "blast" | "security" | "voice">("chat");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data.success && res.data.user) {
          setUserTier(res.data.user.subscriptionTier || "FREE");
        }
      } catch (err) {
        // User not logged in, ignore
      }
    };
    checkAuth();
  }, []);

  const handlePayment = async (planName: string, amountInPaise: number) => {
    if (!userTier) {
      alert("Please sign in first to upgrade.");
      return;
    }

    setLoadingPlan(planName);
    try {
      const createOrderRes = await api.post("/payments/create-subscription", {
        planId: planName.toUpperCase(),
      });

      if (!createOrderRes.data.success) {
        throw new Error(createOrderRes.data.error?.message || "Failed to create order");
      }

      const orderData = createOrderRes.data;
      const keyId = orderData.key_id;

      if (!keyId) {
        throw new Error("Razorpay Key ID is not returned from the server.");
      }

      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: `Mitorix ${planName}`,
        description: `${planName} Plan Subscription`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            const verifyRes = await api.post("/payments/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: planName.toUpperCase(),
            });

            if (verifyRes.data.success) {
              alert("Payment successful! Your subscription is now active.");
              setUserTier(planName.toUpperCase());
            } else {
              alert("Payment verification failed.");
            }
          } catch (err) {
            console.error("Verification Error:", err);
            alert("Payment verification failed.");
          }
        },
        prefill: {
          name: "User", // Should dynamically come from auth if available
        },
        theme: {
          color: planName === "Pro" ? "#ffa800" : "#ff6b00",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Failed to initialize payment.");
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
    <div className="flex flex-col flex-grow items-center w-full overflow-hidden selection:bg-[#ff6b00] selection:text-white bg-transparent text-[#e5e5e5]">
      {/* Silk Animated Background - Fixed to viewport */}
      <div className="fixed inset-0 z-0 opacity-[0.25] pointer-events-none">
        <Silk color="#ff6b00" speed={4} scale={1.5} noiseIntensity={2} />
      </div>

      {/* Hero Section */}
      <section className="relative w-full min-h-[95vh] flex flex-col items-center justify-center pt-36 pb-24 px-6 overflow-hidden z-10">
        {/* Noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
        ></div>
        {/* Tech Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_20%,transparent_100%)] pointer-events-none"></div>

        <div className="max-w-[1600px] w-full text-center relative z-10 flex flex-col items-center px-2 sm:px-4">
          

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.05] pb-2 text-white flex flex-col items-center w-full max-w-[1600px]">
            <Shuffle text="Turn your entire codebase" />
            <Shuffle 
              text="into a searchable brain." 
              className="text-[#ff6b00] drop-shadow-[0_0_35px_rgba(255,107,0,0.25)]" 
            />
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-2xl text-[#a3a3a3] mb-12 max-w-4xl leading-relaxed font-light px-4">
            Mitorix is your ultimate architectural copilot. We instantly parse your codebase into a high-fidelity vector space via <span className="text-[#ffa800] font-medium">MitorixLabs</span> to map out every semantic relationship. Jump into <span className="text-[#ff6b00] font-medium">MitorixSpace</span> to explore an interactive dependency graph, or interrogate your architecture directly through natural language.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-6 sm:w-auto mb-16">
            <Link
              href="/dashboard"
              className="group/btn relative flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl bg-[#ff6b00] text-white overflow-hidden transition-all duration-300 active:scale-[0.98] w-full sm:w-64 shadow-[0_0_25px_rgba(255,107,0,0.25)] hover:shadow-[0_0_40px_rgba(255,255,255,0.45)] border border-[#ff8c00]/30 hover:border-white"
            >
              <div className="absolute inset-0 bg-white origin-bottom scale-y-0 group-hover/btn:scale-y-100 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] z-0"></div>
              <span className="relative z-10 flex items-center gap-2 group-hover/btn:text-black transition-colors duration-500">
                Launch MitorixSpace
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              href="/about"
              className="group relative flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl bg-[#080808] text-[#e5e5e5] border border-[#1a1a1a] hover:border-[#ff6b00] overflow-hidden transition-all duration-300 active:scale-[0.98] w-full sm:w-64 shadow-md hover:shadow-[0_0_40px_rgba(255,107,0,0.45)]"
            >
              <div className="absolute inset-0 bg-[#ff6b00] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
              <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                System Architecture
              </span>
            </Link>
          </div>

          {/* Premium UI Mockup Mock Preview */}
          <div className="w-full max-w-5xl mx-auto border border-[#1a1a1a] rounded-2xl bg-[#030303]/40 backdrop-blur-md shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-500 hover:border-[#ff6b00]/20">
            {/* Header / Tab Selector */}
            <div className="bg-[#050505] border-b border-[#1a1a1a] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-4">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#ff4500]/60"></span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#ff8c00]/60"></span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#ffa800]/60"></span>
                </div>
                <div className="h-4 w-[1px] bg-[#1a1a1a] hidden sm:block"></div>
                <span className="text-xs font-mono text-[#737373] hidden sm:block">MITORIXSPACE_SANDBOX</span>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-0.5 overflow-x-auto custom-scrollbar">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === "chat"
                      ? "bg-[#ff6b00] text-white shadow-md"
                      : "text-[#737373] hover:text-[#e5e5e5]"
                    }`}
                >
                  <MessageSquare size={13} />
                  Codebase Chat
                </button>
                <button
                  onClick={() => setActiveTab("graph")}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === "graph"
                      ? "bg-[#ff6b00] text-white shadow-md"
                      : "text-[#737373] hover:text-[#e5e5e5]"
                    }`}
                >
                  <Network size={13} />
                  Force-Graph
                </button>
                <button
                  onClick={() => setActiveTab("blast")}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === "blast"
                      ? "bg-[#ff6b00] text-white shadow-md"
                      : "text-[#737373] hover:text-[#e5e5e5]"
                    }`}
                >
                  <Flame size={13} />
                  Blast Radius
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === "security"
                      ? "bg-[#ff6b00] text-white shadow-md"
                      : "text-[#737373] hover:text-[#e5e5e5]"
                    }`}
                >
                  <Shield size={13} />
                  Security Scan
                </button>
                <button
                  onClick={() => setActiveTab("voice")}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === "voice"
                      ? "bg-[#ff6b00] text-white shadow-md"
                      : "text-[#737373] hover:text-[#e5e5e5]"
                    }`}
                >
                  <Bot size={13} />
                  Voice Copilot
                </button>
              </div>
            </div>

            {/* Sandbox Body Content */}
            <div className="h-[460px] bg-[#000000] relative flex overflow-hidden text-left">
              {activeTab === "chat" && (
                <div className="flex-1 flex flex-col md:flex-row h-full animate-fadeIn">
                  {/* File tree */}
                  <div className="w-1/3 border-r border-[#1a1a1a] bg-[#030303] p-4 hidden md:block">
                    <span className="text-[10px] font-bold text-[#737373] uppercase tracking-widest block mb-4">MITORIXSPACE FILES</span>
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
                  <LiveChatMock />
                </div>
              )}

              {activeTab === "graph" && (
                <div className="flex-1 relative bg-[#010101] overflow-hidden flex items-center justify-center p-6 animate-fadeIn">
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
                <div className="flex-1 flex flex-col md:flex-row h-full animate-fadeIn">
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
              
              {activeTab === "security" && (
                <div className="flex-1 flex flex-col p-6 animate-fadeIn h-full bg-[#030303]/40 backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="text-[#ff8c00]" size={20} />
                    <h4 className="text-lg font-bold text-white">Vulnerability Scan Results</h4>
                  </div>
                  <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
                    <div className="border border-[#ff4500]/30 bg-[#ff4500]/5 rounded-xl p-4 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] bg-[#ff4500] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">High</span>
                          <span className="text-white font-semibold text-sm">Hardcoded JWT Secret</span>
                        </div>
                        <p className="text-xs text-[#a3a3a3] font-mono">auth.service.ts : Line 45</p>
                      </div>
                      <button className="text-[10px] bg-[#1a1a1a] hover:bg-[#262626] border border-[#333] text-white px-3 py-1.5 rounded transition-colors">Fix with AI</button>
                    </div>
                    <div className="border border-[#ffa800]/30 bg-[#ffa800]/5 rounded-xl p-4 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] bg-[#ffa800] text-black px-2 py-0.5 rounded font-bold uppercase tracking-wider">Medium</span>
                          <span className="text-white font-semibold text-sm">Missing Rate Limiting</span>
                        </div>
                        <p className="text-xs text-[#a3a3a3] font-mono">user.routes.ts : Line 12</p>
                      </div>
                      <button className="text-[10px] bg-[#1a1a1a] hover:bg-[#262626] border border-[#333] text-white px-3 py-1.5 rounded transition-colors">Fix with AI</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "voice" && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fadeIn h-full relative overflow-hidden bg-[#030303]/40 backdrop-blur-md">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="w-64 h-64 bg-[#ff6b00] rounded-full blur-[100px] animate-pulse"></div>
                  </div>
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border-2 border-[#ff6b00] flex items-center justify-center mb-6 relative">
                      <div className="absolute inset-0 rounded-full border border-[#ff6b00] animate-ping opacity-25"></div>
                      <Bot className="w-10 h-10 text-[#ff6b00]" />
                    </div>
                    
                    <div className="text-center space-y-2 mb-8">
                      <h4 className="text-xl font-bold text-white">Listening...</h4>
                      <p className="text-sm text-[#737373]">"Explain the authentication flow in auth.service.ts"</p>
                    </div>
                    
                    <div className="flex items-center gap-1 h-8">
                      {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                        <div key={i} className="w-1.5 bg-[#ff6b00] rounded-full animate-bounce" style={{ height: `${h * 6}px`, animationDelay: `${i * 0.1}s` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Ephemeral Architecture Lifecycle Timeline (Scroll-Animated) */}
      <section className="w-full border-y border-[#1a1a1a] py-32 px-6 relative z-10 bg-transparent">
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/30 text-[#ff6b00] text-xs font-mono uppercase tracking-wider mb-6">
              Pipeline Flow
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
              The Ephemeral Parsing Lifecycle
            </h2>
            <p className="text-[#a3a3a3] max-w-2xl mx-auto text-lg font-light">
              Mitorix clones repositories asynchronously, extracts AST architecture matrices, embeds code blocks, and securely deletes the disk clone instantly.
            </p>
          </div>

          <TimelineSteps />
        </div>
      </section>

      {/* Feature Section: Static Telemetry (Glassmorphism Grid) */}
      <section className="w-full py-32 px-6 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#ff6b00]/10 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#ff6b00] text-xs font-mono uppercase tracking-wider mb-6 backdrop-blur-md">
              Static Analysis Telemetry
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter text-white">
              Architecture Intelligence
            </h2>
            <p className="text-[#a3a3a3] max-w-2xl mx-auto text-lg font-light leading-relaxed">
              Mitorix doesn't just read code; it analyzes architectural safety, identifies structural pattern classes, and monitors coupling complexity in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <BorderGlow className="h-full w-full" backgroundColor="#050505" glowColor="33 100 50" borderRadius={32} colors={['#ff6b00', '#ff8c00', '#ffa800']}>
              <div className="p-8 flex flex-col h-full">
                <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                  <Cpu className="w-7 h-7 text-[#ff6b00]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Cyclomatic Complexity</h3>
                <p className="text-[#888] text-sm leading-relaxed">We count branches, loops, and conditionals. The system logs critical warnings if function scores exceed threshold boundaries.</p>
              </div>
            </BorderGlow>

            {/* Card 2 */}
            <BorderGlow className="h-full w-full" backgroundColor="#050505" glowColor="33 100 50" borderRadius={32} colors={['#ff6b00', '#ff8c00', '#ffa800']}>
              <div className="p-8 flex flex-col h-full">
                <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                  <AlertTriangle className="w-7 h-7 text-[#ff8c00]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Vulnerability Scan</h3>
                <p className="text-[#888] text-sm leading-relaxed">Automated rules trace security threats: hardcoded credentials, SQL injection, path traversals, and outdated cryptographic algorithms.</p>
              </div>
            </BorderGlow>

            {/* Card 3 */}
            <BorderGlow className="h-full w-full" backgroundColor="#050505" glowColor="33 100 50" borderRadius={32} colors={['#ff6b00', '#ff8c00', '#ffa800']}>
              <div className="p-8 flex flex-col h-full">
                <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                  <Layers className="w-7 h-7 text-[#ffa800]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Architectural Layers</h3>
                <p className="text-[#888] text-sm leading-relaxed">Auto-indexes logic zones (Model, View, Controller) and actively warns developers on architectural boundary violations.</p>
              </div>
            </BorderGlow>

            {/* Card 4 */}
            <BorderGlow className="h-full w-full" backgroundColor="#050505" glowColor="33 100 50" borderRadius={32} colors={['#ff6b00', '#ff8c00', '#ffa800']}>
              <div className="p-8 flex flex-col h-full">
                <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                  <Bot className="w-7 h-7 text-[#ff6b00]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Voice Exploration</h3>
                <p className="text-[#888] text-sm leading-relaxed">Query code hands-free. We integrate a full speech pipeline via AssemblyAI and Murf AI for accessibility and fast lookups.</p>
              </div>
            </BorderGlow>

            {/* Card 5 */}
            <BorderGlow className="h-full w-full" backgroundColor="#050505" glowColor="33 100 50" borderRadius={32} colors={['#ff6b00', '#ff8c00', '#ffa800']}>
              <div className="p-8 flex flex-col h-full">
                <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                  <Sparkles className="w-7 h-7 text-[#ff8c00]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Pattern Search</h3>
                <p className="text-[#888] text-sm leading-relaxed">Scan directory schemas to locate implementations of design patterns and identify architectural anti-patterns like God Objects.</p>
              </div>
            </BorderGlow>

            {/* Card 6 */}
            <BorderGlow className="h-full w-full" backgroundColor="#050505" glowColor="33 100 50" borderRadius={32} colors={['#ff6b00', '#ff8c00', '#ffa800']}>
              <div className="p-8 flex flex-col h-full">
                <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                  <Activity className="w-7 h-7 text-[#ffa800]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Unified Repo Health</h3>
                <p className="text-[#888] text-sm leading-relaxed">Consolidates indices to output a 0-100 overall health grade. Scoring deducts points for circular dependencies and dead code.</p>
              </div>
            </BorderGlow>
          </div>
        </div>
      </section>

      {/* Feature Section: Vector Intelligence — Horizontal Accordion */}
      <VectorIntelligence />

      {/* Language Support Matrix Grid */}
      <section className="w-full border-y border-[#1a1a1a] py-32 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff8c00]/10 border border-[#ff8c00]/30 text-[#ff8c00] text-xs font-mono uppercase tracking-wider mb-6">
              Language Matrix
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
              Multi-Language High-Fidelity AST Support
            </h2>
            <p className="text-[#a3a3a3] max-w-2xl mx-auto text-lg font-light">
              Mitorix bypasses fragile regex code matching by compiling high-fidelity ASTs using dedicated language parsers.
            </p>
          </div>
        </div>

        <div className="mt-8 w-full overflow-hidden">
          <ScrollVelocity
            texts={[
              <div key="row1" className="flex items-center gap-12 px-6">
                <div className="flex items-center gap-4"><SiTypescript className="w-12 h-12 sm:w-16 sm:h-16 text-[#3178C6]" /> <span>TypeScript</span></div>
                <div className="flex items-center gap-4"><SiJavascript className="w-12 h-12 sm:w-16 sm:h-16 text-[#F7DF1E]" /> <span>JavaScript</span></div>
                <div className="flex items-center gap-4"><SiPython className="w-12 h-12 sm:w-16 sm:h-16 text-[#3776AB]" /> <span>Python</span></div>
                <div className="flex items-center gap-4"><SiGo className="w-12 h-12 sm:w-16 sm:h-16 text-[#00ADD8]" /> <span>Go</span></div>
                <div className="flex items-center gap-4"><SiRust className="w-12 h-12 sm:w-16 sm:h-16 text-white" /> <span>Rust</span></div>
              </div>,
              <div key="row2" className="flex items-center gap-12 px-6">
                <div className="flex items-center gap-4"><FaJava className="w-12 h-12 sm:w-16 sm:h-16 text-[#E76F00]" /> <span>Java</span></div>
                <div className="flex items-center gap-4"><SiCplusplus className="w-12 h-12 sm:w-16 sm:h-16 text-[#00599C]" /> <span>C/C++</span></div>
                <div className="flex items-center gap-4"><TbBrandCSharp className="w-12 h-12 sm:w-16 sm:h-16 text-[#239120]" /> <span>C#</span></div>
                <div className="flex items-center gap-4"><SiRuby className="w-12 h-12 sm:w-16 sm:h-16 text-[#CC342D]" /> <span>Ruby</span></div>
                <div className="flex items-center gap-4"><SiPhp className="w-12 h-12 sm:w-16 sm:h-16 text-[#777BB3]" /> <span>PHP</span></div>
              </div>
            ]}
            velocity={40}
            className="text-white"
            numCopies={6}
          />
        </div>
      </section>

      {/* Comparative Matrix Section */}
      <section className="w-full max-w-6xl mx-auto py-32 px-6 relative">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffaa00]/10 border border-[#ffaa00]/30 text-[#ffaa00] text-xs font-mono uppercase tracking-wider mb-6">
            Compare Stack
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
            Why Mitorix is Different
          </h2>
          <p className="text-[#a3a3a3] max-w-2xl mx-auto text-lg font-light">
            Traditional searches and standard LLMs fail when tackling large codebase dependency linkages. Here is how we compare.
          </p>
        </div>

        <div className="overflow-x-auto border border-[#1a1a1a] rounded-2xl bg-[#030303]/40 backdrop-blur-md">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a] bg-[#050505] text-[#737373] font-mono text-xs uppercase">
                <th className="p-6">Analysis Capabilities</th>
                <th className="p-6">Legacy Regex Grep</th>
                <th className="p-6">Standard AI Chat</th>
                <th className="p-6 text-white font-bold bg-[#ff6b00]/10 border-x border-[#ff6b00]/20">Mitorix Engine</th>
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
          <div className="bg-[#030303]/40 backdrop-blur-md border border-[#1a1a1a] rounded-3xl p-8 lg:p-10 flex flex-col hover:border-[#ff6b00]/20 transition-all duration-500 relative group overflow-hidden">
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
                <div className="text-2xl font-black text-white">1</div>
                <div className="text-[10px] text-[#737373] font-medium uppercase tracking-wider">Repo</div>
              </div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-white">5</div>
                <div className="text-[10px] text-[#737373] font-medium uppercase tracking-wider">Msg/Day</div>
              </div>
            </div>

            <ul className="space-y-3.5 mb-10 flex-1 relative z-10">
              <li className="flex items-start gap-3 text-sm text-[#a3a3a3]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#737373] shrink-0" />
                <span>Basic Codebase Analysis</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#a3a3a3]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#737373] shrink-0" />
                <span>AI Chat — <span className="text-white font-medium">5 msg/day</span></span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#a3a3a3]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#737373] shrink-0" />
                <span>Force-Graph & Semantic Search</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#a3a3a3]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#737373] shrink-0" />
                <span>Security & Architecture Scans</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#a3a3a3]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#737373] shrink-0" />
                <span>Unused Function Detection</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#525252]">
                <X className="w-4 h-4 mt-0.5 text-[#333] shrink-0" />
                <span>Local Folder/ZIP Upload</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#525252]">
                <X className="w-4 h-4 mt-0.5 text-[#333] shrink-0" />
                <span>Blast Radius & Export Data</span>
              </li>
            </ul>

            {!userTier ? (
              <a href="http://localhost:5000/api/v1/auth/github" className="w-full py-4 px-6 rounded-xl font-semibold bg-[#0a0a0a] hover:bg-[#121212] text-[#e5e5e5] border border-[#1a1a1a] hover:border-[#ff6b00]/40 transition-all text-center block shadow-md">
                Start for Free
              </a>
            ) : userTier === "FREE" ? (
              <button disabled className="w-full py-4 px-6 rounded-xl font-semibold bg-[#0a0a0a] text-[#ff6b00] cursor-not-allowed border border-[#ff6b00]/20 transition-all shadow-[inset_0_0_15px_rgba(255,107,0,0.1)]">
                Current Plan
              </button>
            ) : (
              <button disabled className="w-full py-4 px-6 rounded-xl font-semibold bg-[#050505] text-[#525252] cursor-not-allowed border border-[#1a1a1a] transition-all">
                Included in your plan
              </button>
            )}
          </div>

          {/* ─── BASIC TIER (₹99) — MOST POPULAR ─── */}
          <div className="bg-gradient-to-b from-[#ff6b00]/10 to-[#030303]/40 backdrop-blur-md border border-[#ff6b00]/30 rounded-3xl p-8 lg:p-10 flex flex-col relative hover:border-[#ff6b00]/50 transition-all duration-500 shadow-[0_0_30px_rgba(255,107,0,0.1)] overflow-hidden group">
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
            <p className="text-sm text-[#ff8c00] mb-8 font-medium">Local uploads, deep scans, and more context.</p>

            {/* Limits highlight */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-[#0a0a0a]/80 border border-[#ff6b00]/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-white">5</div>
                <div className="text-[10px] text-[#ff8c00]/70 font-medium uppercase tracking-wider">Repos</div>
              </div>
              <div className="bg-[#0a0a0a]/80 border border-[#ff6b00]/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-white">50</div>
                <div className="text-[10px] text-[#ff8c00]/70 font-medium uppercase tracking-wider">Msg/Day</div>
              </div>
            </div>

            <ul className="space-y-3.5 mb-10 flex-1 relative z-10">
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ff6b00] shrink-0" />
                <span>Everything in FREE</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ff6b00] shrink-0" />
                <span>Local Folder/ZIP Upload</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ff6b00] shrink-0" />
                <span>All 8 Visualizations</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ff6b00] shrink-0" />
                <span>Blast Radius & Action Items</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ff6b00] shrink-0" />
                <span>Export Analysis Data</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#525252]">
                <X className="w-4 h-4 mt-0.5 text-[#333] shrink-0" />
                <span>Voice Chat & Docs Generation</span>
              </li>
            </ul>

            {!userTier ? (
              <a href="http://localhost:5000/api/v1/auth/github" className="w-full py-4 px-6 rounded-xl font-bold bg-[#1a1a1a] text-white hover:bg-[#262626] transition-all text-center block border border-[#333]">
                Sign in to Upgrade
              </a>
            ) : userTier === "BASIC" ? (
              <button disabled className="w-full py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-[#ff6b00]/10 to-[#ff8c00]/10 text-[#ff6b00] cursor-not-allowed border border-[#ff6b00]/30 transition-all shadow-[inset_0_0_15px_rgba(255,107,0,0.15)]">
                Current Plan
              </button>
            ) : userTier === "PRO" ? (
              <button disabled className="w-full py-4 px-6 rounded-xl font-semibold bg-[#050505] text-[#525252] cursor-not-allowed border border-[#1a1a1a] transition-all">
                Included in your plan
              </button>
            ) : (
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
            )}
          </div>

          {/* ─── PRO TIER (₹199) ─── */}
          <div className="bg-[#030303]/40 backdrop-blur-md border border-[#1a1a1a] rounded-3xl p-8 lg:p-10 flex flex-col hover:border-[#ffa800]/30 transition-all duration-500 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ffa800]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            {/* Subtle sparkle */}
            <Sparkles className="absolute bottom-6 right-6 text-[#ffa800]/20 w-20 h-20 -z-10 group-hover:scale-110 transition-transform duration-700" strokeWidth={1} />

            {/* Tier badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffa800]/10 border border-[#ffa800]/30 text-[#ffa800] text-[10px] font-bold uppercase tracking-widest mb-5 w-fit">
              <Sparkles size={12} />
              Enterprise
            </div>

            <h2 className="text-2xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-[#ffa800] to-[#ffc85a]">Enterprise</h2>

            <div className="text-5xl font-extrabold mb-1 text-white">
              ₹299 <span className="text-xl text-[#737373] font-medium">/month</span>
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
                <div className="text-[10px] text-[#ffa800]/60 font-medium uppercase tracking-wider mt-1">Msg/Day</div>
              </div>
            </div>

            <ul className="space-y-3.5 mb-10 flex-1 relative z-10">
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ffa800] shrink-0" />
                <span>Everything in BASIC</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ffa800] shrink-0" />
                <span>System Design & Onboarding Docs</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ffa800] shrink-0" />
                <span>PR Risk Analysis</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ffa800] shrink-0" />
                <span>Voice Call Mode (STT + TTS)</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ffa800] shrink-0" />
                <span>Semantic Clone Detection</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#ffa800] shrink-0" />
                <span>Codebase Drift Detection</span>
              </li>
            </ul>

            {!userTier ? (
              <a href="http://localhost:5000/api/v1/auth/github" className="w-full py-4 px-6 rounded-xl font-bold bg-[#1a1a1a] text-white hover:bg-[#262626] transition-all text-center block border border-[#333]">
                Sign in to Upgrade
              </a>
            ) : userTier === "PRO" ? (
              <button disabled className="w-full py-4 px-6 rounded-xl font-semibold bg-[#ffa800]/10 text-[#ffa800] cursor-not-allowed border border-[#ffa800]/30 transition-all shadow-[inset_0_0_15px_rgba(255,168,0,0.15)]">
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handlePayment("Pro", 29900)}
                disabled={loadingPlan === "Pro"}
                className="w-full py-4 px-6 rounded-xl font-bold bg-[#0a0a0a] hover:bg-[#121212] text-[#ffa800] border border-[#ffa800]/30 hover:border-[#ffa800]/60 transition-all duration-300 shadow-md hover:shadow-[0_0_30px_rgba(255,168,0,0.15)] flex justify-center items-center active:scale-[0.98] relative overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-[#ffa800]/10 translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {loadingPlan === "Pro" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Upgrade to Pro"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Pricing footnote */}
        <div className="text-center mt-12 relative z-10">
          <p className="text-xs text-[#525252] max-w-xl mx-auto">
            All plans include access to the core Mitorix engine. Prices are in INR and billed monthly via Razorpay. Cancel anytime.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-32 px-6 text-center relative overflow-hidden border-t border-[#1a1a1a] z-10">
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
              className="group/btn relative overflow-hidden flex justify-center items-center gap-2 px-10 py-5 bg-[#ff6b00] text-white font-bold text-lg rounded-xl transition-all duration-300 active:scale-[0.98] shadow-[0_0_30px_rgba(255,107,0,0.25)] hover:shadow-[0_0_40px_rgba(255,107,0,0.55)] border border-[#ff8c00]/30"
            >
              <div className="absolute inset-0 bg-white origin-bottom scale-y-0 group-hover/btn:scale-y-100 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] z-0"></div>
              <span className="relative z-10 flex items-center gap-2 group-hover/btn:text-black transition-colors duration-500">
                Analyze Your Repository
                <ChevronRight className="w-5 h-5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
