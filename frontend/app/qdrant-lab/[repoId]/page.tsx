"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Search, GitCompare, Activity, ArrowLeft, Sparkles } from "lucide-react";
import SearchTab from "./SearchTab";
import ClonesTab from "./ClonesTab";
import DriftTab from "./DriftTab";

const TABS = [
  { key: "search", label: "Semantic Search", icon: Search, color: "#58a6ff", desc: "Natural language code search" },
  { key: "clones", label: "Clone Detection", icon: GitCompare, color: "#f0883e", desc: "Find semantic duplicates" },
  { key: "drift", label: "Drift Detector", icon: Activity, color: "#a371f7", desc: "Track code evolution" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function QdrantLabPage({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("search");

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#c9d1d9] pt-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#58a6ff]/4 via-[#a371f7]/3 to-transparent blur-[120px] rounded-full pointer-events-none" />

      {/* Header + Tabs */}
      <div className="sticky top-[73px] z-30 bg-[#0a0c10]/80 backdrop-blur-xl border-b border-[#30363d]/50">
        <div className="max-w-6xl mx-auto px-6">
          {/* Title row */}
          <div className="flex items-center gap-4 py-4">
            <button onClick={() => router.push("/dashboard")} className="p-2 rounded-xl text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#58a6ff]/20 via-[#a371f7]/20 to-[#f0883e]/20 border border-[#58a6ff]/20 flex items-center justify-center">
                <Sparkles size={18} className="text-[#58a6ff]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Qdrant Lab</h1>
                <p className="text-[11px] text-[#6e7681]">Vector-powered intelligence beyond RAG</p>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 pb-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`cursor-pointer group flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200 border-b-2 rounded-t-lg ${
                    isActive
                      ? "text-white border-current bg-[#161b22]/50"
                      : "text-[#8b949e] border-transparent hover:text-[#c9d1d9] hover:bg-[#161b22]/30"
                  }`}
                  style={isActive ? { color: tab.color, borderColor: tab.color } : {}}
                >
                  <Icon size={16} className={isActive ? "" : "opacity-60 group-hover:opacity-100"} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === "search" && <SearchTab repoId={repoId} />}
        {activeTab === "clones" && <ClonesTab repoId={repoId} />}
        {activeTab === "drift" && <DriftTab repoId={repoId} />}
      </div>
    </div>
  );
}
