"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Search, GitCompare, Activity, ArrowLeft, Sparkles, Github } from "lucide-react";
import api from "@/lib/axios";
import SearchTab from "./SearchTab";
import ClonesTab from "./ClonesTab";
import DriftTab from "./DriftTab";
import AuthGuard from "../../../components/auth/AuthGuard";

const TABS = [
  { key: "search", label: "Semantic Search", icon: Search, desc: "Natural language code search" },
  { key: "clones", label: "Clone Detection", icon: GitCompare, desc: "Find semantic duplicates" },
  { key: "drift", label: "Drift Detector", icon: Activity, desc: "Track code evolution" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface RepoInfo {
  name: string;
  githubUrl: string;
}

export default function MitorixLabsPage({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("search");
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);

  // Fetch repository info on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/repos/${repoId}`);
        if (res.data?.repo) {
          setRepoInfo({
            name: res.data.repo.name,
            githubUrl: res.data.repo.githubUrl,
          });
        }
      } catch {
        // Silently fail — header will just show "MitorixLabs" without repo name
      }
    })();
  }, [repoId]);

  return (
    <AuthGuard>
    <div className="w-full min-h-screen bg-transparent flex flex-col pt-32 pb-24 relative selection:bg-[#ff6b00] selection:text-white overflow-hidden text-[#e5e5e5]">
      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")" }}
      ></div>
      {/* Tech Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_20%,transparent_100%)] pointer-events-none z-0"></div>

      {/* Subtle ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF6B00]/5 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto w-full px-6 flex-grow relative z-10 flex flex-col space-y-6">
        
        {/* Floating Header Card */}
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 md:pt-6 md:px-7 md:pb-0 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          {/* Title row */}
          <div className="flex items-center gap-6 mb-6">
            <button onClick={() => router.push("/dashboard")} className="group p-2 -ml-2 rounded-full text-[#A3A3A3] hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer">
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6B00]/20 to-[#FF8C00]/5 border border-[#FF6B00]/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,107,0,0.1)]">
                <Sparkles size={18} className="text-[#FF6B00]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-medium tracking-tight text-white">MitorixLabs</h1>
                  {repoInfo && (
                    <>
                      <span className="text-[#404040] text-lg font-light">/</span>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                        <Github size={13} className="text-[#FF6B00] shrink-0" />
                        <span className="text-[13px] font-medium text-[#E5E5E5] truncate max-w-[300px]">{repoInfo.name}</span>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-[12px] text-[#A3A3A3] tracking-wide mt-0.5">
                  {repoInfo
                    ? <span className="truncate block max-w-[400px]">{repoInfo.githubUrl}</span>
                    : "Vector-powered codebase intelligence"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-6 border-b border-white/5 pb-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`cursor-pointer group flex items-center gap-2.5 pb-4 text-[13px] font-medium transition-all duration-300 relative ${
                    isActive
                      ? "text-white"
                      : "text-[#737373] hover:text-[#A3A3A3]"
                  }`}
                >
                  <Icon size={14} className={isActive ? "text-[#FF6B00]" : "opacity-70 group-hover:opacity-100 transition-opacity"} />
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] rounded-t-full shadow-[0_-2px_10px_rgba(255,107,0,0.3)] translate-y-[1px]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex-grow flex flex-col">
          {activeTab === "search" && <SearchTab repoId={repoId} />}
          {activeTab === "clones" && <ClonesTab repoId={repoId} />}
          {activeTab === "drift" && <DriftTab repoId={repoId} />}
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}

