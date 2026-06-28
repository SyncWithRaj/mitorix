"use client";

import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Github, Fingerprint, FlaskConical, ShieldCheck, Box, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Silk from "@/components/ui/Silk";

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
  }, [router]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="w-full h-screen overflow-hidden bg-black text-[#e5e5e5] relative flex">
      {/* Backgrounds spanning the whole page */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <Silk color="#ff6b00" speed={4} scale={1.5} noiseIntensity={2} />
      </div>
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none z-0"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      ></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_20%,transparent_100%)] pointer-events-none z-0"></div>

      {/* Floating Back Button */}
      <Link 
        href="/" 
        className="fixed top-8 left-8 z-50 w-12 h-12 rounded-full bg-[#ff6b00] text-black shadow-[0_0_15px_rgba(255,107,0,0.4)] hover:shadow-[0_0_25px_rgba(255,107,0,0.6)] overflow-hidden group flex items-center justify-center transition-all duration-300 hover:-translate-y-1 animate-in fade-in zoom-in duration-1000"
        title="Back to Home"
      >
        <div className="absolute inset-0 bg-white origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] z-0"></div>
        <ArrowLeft className="relative z-10 w-5 h-5 group-hover:text-black transition-colors duration-500" />
      </Link>

      {/* Split Grid Layout */}
      <div className="relative z-10 w-full h-full grid lg:grid-cols-2">
        
        {/* Left Column - Brand & Info */}
        <div className="hidden lg:flex flex-col justify-between p-12 xl:p-20 border-r border-white/5 bg-black/20 backdrop-blur-sm items-end pr-16 xl:pr-32">
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-8 duration-1000 w-full max-w-md xl:max-w-lg text-left">
          </div>

          <div className="w-full max-w-md xl:max-w-lg text-left">
            <h1 className="text-5xl xl:text-6xl font-black text-white tracking-tighter mb-6 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
              AI-Powered <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ffa800]">Code Intelligence</span>
            </h1>
            <p className="text-[#a3a3a3] leading-relaxed font-light text-lg mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
              Connect your GitHub account to instantly map, visualize, and understand your codebases. Break down architecture and uncover hidden structural insights with ease.
            </p>

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700 fill-mode-both">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#ff6b00]">
                  <Box size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white mb-1">Deep Analysis</div>
                  <div className="text-sm text-[#737373] leading-relaxed">Instantly ingest and understand entire codebases at a structural level.</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#ff6b00]">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white mb-1">Secure Access</div>
                  <div className="text-sm text-[#737373] leading-relaxed">Safe, encrypted authentication directly via GitHub OAuth 2.0.</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full max-w-md xl:max-w-lg text-left text-xs font-mono text-[#52525b] animate-in fade-in duration-1000 delay-1000 fill-mode-both">
            © {new Date().getFullYear()} RepoLens Inc.
          </div>
        </div>

        {/* Right Column - Login */}
        <div className="flex flex-col justify-center items-center p-8 lg:p-16 relative pl-16 xl:pl-32 items-start">
          <div className="w-full max-w-[420px] xl:max-w-[480px]">
            <div className="bg-black/60 backdrop-blur-3xl py-16 px-12 rounded-[2.5rem] text-center border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center min-h-[450px] group relative overflow-hidden animate-in fade-in zoom-in-95 duration-1000 delay-500 fill-mode-both">
              {/* Glow */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#ff6b00]/15 blur-3xl rounded-full group-hover:bg-[#ff6b00]/25 transition-colors duration-700 pointer-events-none"></div>
              
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-black flex items-center justify-center mb-6 border border-white/10 shadow-inner relative group-hover:border-[#ff6b00]/50 group-hover:shadow-[0_0_30px_rgba(255,107,0,0.2)] transition-all duration-500">
                <Fingerprint size={36} className="text-[#ff6b00] absolute opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                <Github size={36} className="text-white group-hover:opacity-0 transition-opacity duration-500" />
              </div>

              <h2 className="text-2xl font-bold mb-2 text-white tracking-tight">Welcome Back</h2>
              <p className="mb-8 text-sm text-[#737373]">Access your personalized RepoSpace.</p>

              <button
                onClick={loginWithGithub}
                className="w-full bg-[#ff6b00] text-white font-semibold text-sm px-6 py-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,107,0,0.25)] hover:shadow-[0_0_35px_rgba(255,107,0,0.4)] flex items-center justify-center gap-3 group/btn relative overflow-hidden border border-[#ff8c00]/30"
              >
                <div className="absolute inset-0 bg-white origin-bottom scale-y-0 group-hover/btn:scale-y-100 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] z-0 cursor-pointer"></div>
                <Github size={18} className="relative z-10 group-hover/btn:text-black transition-colors duration-500" />
                <span className="relative z-10 group-hover/btn:text-black transition-colors duration-500 ">Continue with GitHub</span>
              </button>

              {isDev && (
                <button
                  onClick={loginAsDev}
                  disabled={devLoading}
                  className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm px-6 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-white/10 disabled:opacity-50 cursor-pointer"
                >
                  <FlaskConical size={16} className="text-[#ff6b00]" />
                  {devLoading ? "Authenticating..." : "Dev Login"}
                </button>
              )}

              <div className="mt-8 text-xs font-medium text-[#52525b] flex items-center justify-center gap-1.5">
                <ShieldCheck size={12} className="text-[#ff6b00]" />
                Secure Session
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
