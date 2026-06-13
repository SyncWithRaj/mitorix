"use client";

import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Github, Fingerprint, ChevronRight, FlaskConical, ShieldAlert, Cpu } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [devLoading, setDevLoading] = useState(false);

  const loginWithGithub = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    window.location.href = `${baseUrl}/auth/github`;
  };

  const loginAsDev = async () => {
    setDevLoading(true);
    try {
      const res = await api.post("/auth/dev-login");
      if (res.data.success) {
        toast.success("Dev login successful");
        router.replace("/dashboard");
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.error("Demo user not found. Please run 'npm run seed' in the backend first.");
      } else {
        console.error("Dev login failed:", err);
        toast.error(err.response?.data?.message || "Dev login failed");
      }
      setDevLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/auth/me");
        router.push("/");
      } catch (err) {
        // Not authenticated
      }
    };
    checkAuth();
  }, []);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex-grow flex items-center justify-center bg-[#000000] text-[#e5e5e5] relative overflow-hidden pt-32 pb-20 px-6">
      {/* Immersive Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#ff6b00]/10 to-[#ffa800]/5 blur-[160px] rounded-full pointer-events-none mix-blend-screen animate-pulse-slow"></div>
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      ></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_20%,transparent_100%)] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row items-stretch justify-center gap-8 lg:gap-16">
        
        {/* Left Side: Features / Tech Context */}
        <div className="flex-1 flex flex-col justify-center space-y-8 max-w-lg hidden md:flex">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/30 text-[#ff6b00] text-xs font-mono uppercase tracking-wider mb-6">
              Authentication Node
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-4 leading-tight">
              Unlock Your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ffa800]">Vector RepoSpace</span>
            </h2>
            <p className="text-[#a3a3a3] leading-relaxed font-light text-lg">
              Securely authenticate to begin indexing your GitHub repositories into our Qdrant vector space. Explore architectural force-graphs, calculate structural complexity, and run deep AST dependency traces.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-4 flex flex-col items-start gap-3">
              <Cpu className="text-[#ff6b00]" size={20} />
              <div className="text-sm font-bold text-white">Ephemeral Cloning</div>
              <div className="text-xs text-[#737373]">Code deleted instantly post-parse</div>
            </div>
            <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-4 flex flex-col items-start gap-3">
              <ShieldAlert className="text-[#ff8c00]" size={20} />
              <div className="text-sm font-bold text-white">OAuth 2.0 Secure</div>
              <div className="text-xs text-[#737373]">Authorized Github Application</div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-md flex flex-col justify-center">
          <div className="bg-[#030303]/80 backdrop-blur-2xl p-10 sm:p-12 rounded-[2rem] text-center border border-[#1a1a1a] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center group relative overflow-hidden">
            {/* Hover Glow inside card */}
            <div className="absolute -top-[100px] -right-[100px] w-[250px] h-[250px] bg-[#ff6b00]/10 blur-3xl rounded-full group-hover:bg-[#ff6b00]/20 transition-colors duration-700"></div>

            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0a0a0a] to-[#030303] flex items-center justify-center mb-8 border border-[#1a1a1a] shadow-inner relative group-hover:border-[#ff6b00]/50 group-hover:shadow-[0_0_25px_rgba(255,107,0,0.2)] transition-all duration-500">
              <Fingerprint
                size={42}
                className="text-[#ff6b00] absolute opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
              />
              <Github
                size={42}
                className="text-[#e5e5e5] group-hover:opacity-0 transition-opacity duration-500"
              />
            </div>

            <h1 className="text-3xl font-bold mb-3 text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="mb-10 text-sm font-medium text-[#737373] leading-relaxed max-w-[280px]">
              Access your personalized RepoSpace dashboards and repositories.
            </p>

            <button
              onClick={loginWithGithub}
              className="w-full bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff8c00] hover:to-[#ffa200] text-white font-semibold text-[15px] px-6 py-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,107,0,0.25)] hover:shadow-[0_0_35px_rgba(255,107,0,0.4)] flex items-center justify-center gap-3 border border-transparent hover:border-[#ff8c00]/50 group/btn relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/btn:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
              <Github
                size={20}
                className="group-hover/btn:-rotate-12 transition-transform duration-300 relative z-10"
              />
              <span className="relative z-10">Continue with GitHub</span>
              <ChevronRight
                size={18}
                className="absolute right-6 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-2 transition-all duration-300 text-white"
              />
            </button>

            {/* Dev Login — only visible in development */}
            {isDev && (
              <button
                onClick={loginAsDev}
                disabled={devLoading}
                className="w-full mt-4 bg-[#0a0a0a] hover:bg-[#121212] text-[#ff6b00] font-semibold text-[14px] px-6 py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 border border-[#1a1a1a] hover:border-[#ff6b00]/30 hover:shadow-[0_0_20px_rgba(255,107,0,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FlaskConical size={18} />
                {devLoading ? "Authenticating..." : "Dev Login (Seeded Bypass)"}
              </button>
            )}

            <div className="mt-8 text-[11px] font-mono text-[#737373] flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b00] animate-pulse"></span>
              Encrypted Session Tokens
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
