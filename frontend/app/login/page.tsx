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
    <div className="flex-grow flex items-center justify-center bg-[#000000] text-[#e5e5e5] relative overflow-hidden -mt-[73px]">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#ff6b00]/5 to-[#ff8c00]/5 blur-[150px] rounded-full pointer-events-none mix-blend-screen animate-pulse-slow"></div>
      <div
        className="absolute inset-0 opacity-[0.01] pointer-events-none"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      ></div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-[#050505]/80 backdrop-blur-2xl p-10 sm:p-12 rounded-3xl text-center border border-[#1a1a1a] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center group relative overflow-hidden">
          {/* Hover Glow inside card */}
          <div className="absolute -top-[100px] -right-[100px] w-[200px] h-[200px] bg-[#ff6b00]/10 blur-3xl rounded-full group-hover:bg-[#ff6b00]/20 transition-colors duration-700"></div>

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#050505] flex items-center justify-center mb-8 border border-[#1a1a1a] shadow-inner relative group-hover:border-[#ff6b00]/50 group-hover:shadow-[0_0_20px_rgba(255,107,0,0.15)] transition-all duration-500">
            <Fingerprint
              size={36}
              className="text-[#ff6b00] absolute opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
            />
            <Github
              size={36}
              className="text-[#e5e5e5] group-hover:opacity-0 transition-opacity duration-500"
            />
          </div>

          <h1 className="text-4xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e5e5e5] tracking-tight">
            Access RepoLens
          </h1>
          <p className="mb-10 text-[15px] font-medium text-[#737373] leading-relaxed max-w-[280px]">
            Authenticate securely to access your isolated vector workspaces.
          </p>

          <button
            onClick={loginWithGithub}
            className="w-full bg-[#ff6b00] hover:bg-[#ff8c00] text-white font-semibold text-[15px] px-6 py-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,107,0,0.2)] hover:shadow-[0_0_30px_rgba(255,107,0,0.4)] flex items-center justify-center gap-3 border border-transparent hover:border-[#ff6b00]/50 group/btn"
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
              className="w-full mt-3 bg-[#0a0a0a] hover:bg-[#1a1a1a] text-[#ff6b00] font-semibold text-[14px] px-6 py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 border border-[#1a1a1a] hover:border-[#ff6b00]/30 hover:shadow-[0_0_20px_rgba(255,107,0,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FlaskConical size={18} />
              {devLoading ? "Logging in..." : "Dev Login (Seeded User)"}
            </button>
          )}

          <div className="mt-8 text-xs font-mono text-[#737373] flex items-center justify-center gap-2 bg-[#000000]/50 px-4 py-2 rounded-lg border border-[#1a1a1a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b00] animate-pulse"></span>
            Secure OAuth 2.0 Connection
          </div>
        </div>
      </div>
    </div>
  );
}
