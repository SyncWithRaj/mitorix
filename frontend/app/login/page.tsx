"use client";

import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Github, Fingerprint, ChevronRight, FlaskConical } from "lucide-react";

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
        router.replace("/dashboard");
      }
    } catch (err) {
      console.error("Dev login failed:", err);
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
    <div className="flex-grow flex items-center justify-center bg-[#0d1117] text-[#c9d1d9] relative overflow-hidden -mt-[73px]">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#58a6ff]/10 to-[#2ea043]/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen animate-pulse-slow"></div>
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      ></div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-[#161b22]/80 backdrop-blur-2xl p-10 sm:p-12 rounded-3xl text-center border border-[#30363d]/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center group relative overflow-hidden">
          {/* Hover Glow inside card */}
          <div className="absolute -top-[100px] -right-[100px] w-[200px] h-[200px] bg-[#58a6ff]/20 blur-3xl rounded-full group-hover:bg-[#58a6ff]/30 transition-colors duration-700"></div>

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#21262d] to-[#161b22] flex items-center justify-center mb-8 border border-[#30363d] shadow-inner relative group-hover:border-[#58a6ff]/50 group-hover:shadow-[0_0_20px_rgba(88,166,255,0.2)] transition-all duration-500">
            <Fingerprint
              size={36}
              className="text-[#a371f7] absolute opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
            />
            <Github
              size={36}
              className="text-white group-hover:opacity-0 transition-opacity duration-500"
            />
          </div>

          <h1 className="text-4xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-b from-white to-[#c9d1d9] tracking-tight">
            Access RepoLens
          </h1>
          <p className="mb-10 text-[15px] font-medium text-[#8b949e] leading-relaxed max-w-[280px]">
            Authenticate securely to access your isolated vector workspaces.
          </p>

          <button
            onClick={loginWithGithub}
            className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-semibold text-[15px] px-6 py-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(35,134,54,0.3)] hover:shadow-[0_0_30px_rgba(46,160,67,0.5)] flex items-center justify-center gap-3 border border-transparent hover:border-[#3fb950]/50 group/btn"
          >
            <Github
              size={20}
              className="group-hover/btn:-rotate-12 transition-transform duration-300"
            />
            Continue with GitHub
            <ChevronRight
              size={18}
              className="absolute right-10 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-2 transition-all duration-300"
            />
          </button>

          {/* Dev Login — only visible in development */}
          {isDev && (
            <button
              onClick={loginAsDev}
              disabled={devLoading}
              className="w-full mt-3 bg-[#1f1d2e] hover:bg-[#2d2b3d] text-[#a371f7] font-semibold text-[14px] px-6 py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 border border-[#a371f7]/20 hover:border-[#a371f7]/50 hover:shadow-[0_0_20px_rgba(163,113,247,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FlaskConical size={18} />
              {devLoading ? "Logging in..." : "Dev Login (Seeded User)"}
            </button>
          )}

          <div className="mt-8 text-xs font-mono text-[#8b949e] flex items-center justify-center gap-2 bg-[#0d1117]/50 px-4 py-2 rounded-lg border border-[#30363d]/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ea043] animate-pulse"></span>
            Secure OAuth 2.0 Connection
          </div>
        </div>
      </div>
    </div>
  );
}
