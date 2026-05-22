"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Search, GitCompare, Activity, ArrowLeft, Sparkles } from "lucide-react";
import SearchTab from "./SearchTab";
import ClonesTab from "./ClonesTab";
import DriftTab from "./DriftTab";

const TABS = [
  { key: "search", label: "Semantic Search", icon: Search, desc: "Natural language code search" },
  { key: "clones", label: "Clone Detection", icon: GitCompare, desc: "Find semantic duplicates" },
  { key: "drift", label: "Drift Detector", icon: Activity, desc: "Track code evolution" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function QdrantLabPage({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("search");

  return (
    <div className="min-h-screen bg-[#000000] text-[#E5E5E5] pt-20 relative selection:bg-[#FF6B00]/30 selection:text-white">
      {/* Subtle ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF6B00]/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Header + Tabs */}
      <div className="sticky top-[73px] z-30 bg-[#000000]/80 backdrop-blur-xl border-b border-[#1A1A1A]">
        <div className="max-w-5xl mx-auto px-6">
          {/* Title row */}
          <div className="flex items-center gap-6 py-6">
            <button onClick={() => router.push("/dashboard")} className="group p-2 -ml-2 rounded-full text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A] transition-all duration-300 cursor-pointer">
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6B00]/20 to-[#FF8C00]/5 border border-[#FF6B00]/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,107,0,0.1)]">
                <Sparkles size={18} className="text-[#FF6B00]" />
              </div>
              <div>
                <h1 className="text-xl font-medium tracking-tight text-white">Qdrant Lab</h1>
                <p className="text-[12px] text-[#A3A3A3] tracking-wide mt-0.5">Vector-powered codebase intelligence</p>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-6 pb-0">
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
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] rounded-t-full shadow-[0_-2px_10px_rgba(255,107,0,0.3)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {activeTab === "search" && <SearchTab repoId={repoId} />}
        {activeTab === "clones" && <ClonesTab repoId={repoId} />}
        {activeTab === "drift" && <DriftTab repoId={repoId} />}
      </div>
    </div>
  );
}
