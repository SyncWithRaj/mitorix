import React, { useState, useEffect } from "react";
import api from "@/lib/axios";
import {
  X,
  BookOpen,
  Database,
  Layout,
  FileCode2,
  Map,
  ListOrdered,
  ChevronRight,
  Globe,
  Cog,
  Shapes,
  FlaskConical,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import BorderGlow from "@/components/ui/BorderGlow";
import { useSubscription } from "@/context/SubscriptionContext";

interface SectionItem {
  name: string;
  file: string;
  description: string;
}

interface GuideSection {
  key: string;
  title: string;
  icon: string;
  items: SectionItem[];
}

// New dynamic format
interface DynamicGuideData {
  sections: GuideSection[];
  readingList: { order: number; file: string; reason: string }[];
}

// Legacy format for backward compat
interface LegacyGuideData {
  entryPoints?: { file: string; description: string }[];
  mainSchemas?: { name: string; file: string; description: string }[];
  coreUIComponents?: { name: string; file: string; description: string }[];
  readingList?: { order: number; file: string; reason: string }[];
}

interface OnboardingModalProps {
  repoId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Icon component mapper
const ICON_MAP: Record<string, React.ReactNode> = {
  entry: <FileCode2 size={18} className="text-[#d2a8ff]" />,
  data: <Database size={18} className="text-[#3fb950]" />,
  ui: <Layout size={18} className="text-[#ff7b72]" />,
  api: <Globe size={18} className="text-[#f0883e]" />,
  services: <Cog size={18} className="text-[#58a6ff]" />,
  abstractions: <Shapes size={18} className="text-[#d2a8ff]" />,
  test: <FlaskConical size={18} className="text-[#79c0ff]" />,
};

const formatPath = (fullPath: string) => {
  if (!fullPath) return "";
  return fullPath.replace(/^\/tmp\/mitorix-repos\/[^\/]+\/[^\/]+\//, "");
};

// Convert legacy format to the new dynamic format
function normalizeLegacyGuide(raw: any): DynamicGuideData {
  // Already new format
  if (raw.sections && Array.isArray(raw.sections)) {
    return raw as DynamicGuideData;
  }

  // Convert legacy keys to sections array
  const sections: GuideSection[] = [];

  if (raw.entryPoints?.length) {
    sections.push({
      key: "entryPoints",
      title: "Entry Points",
      icon: "entry",
      items: raw.entryPoints.map((ep: any) => ({
        name: formatPath(ep.file),
        file: ep.file,
        description: ep.description,
      })),
    });
  }

  if (raw.mainSchemas?.length) {
    sections.push({
      key: "dataModels",
      title: "Main Schemas & Models",
      icon: "data",
      items: raw.mainSchemas.map((ms: any) => ({
        name: ms.name,
        file: ms.file,
        description: ms.description,
      })),
    });
  }

  if (raw.coreUIComponents?.length) {
    sections.push({
      key: "uiComponents",
      title: "Core UI Components",
      icon: "ui",
      items: raw.coreUIComponents.map((ui: any) => ({
        name: ui.name,
        file: ui.file,
        description: ui.description,
      })),
    });
  }

  return {
    sections,
    readingList: raw.readingList || [],
  };
}

export default function OnboardingModal({ repoId, isOpen, onClose }: OnboardingModalProps) {
  const [loading, setLoading] = useState(true);
  const [guide, setGuide] = useState<DynamicGuideData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "walkthrough">("overview");

  const { hasFeature } = useSubscription();

  const fetchGuide = React.useCallback(async (force = false) => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    if (force) setGuide(null);
    try {
      const res = await api.get(`/repos/${repoId}/onboarding${force ? "?force=true" : ""}`);
      if (res.data.success && res.data.guide) {
        // Normalize legacy or new format
        const normalized = normalizeLegacyGuide(res.data.guide);
        setGuide(normalized);
      } else {
        setError("Failed to parse guide data.");
      }
    } catch (err: any) {
      console.error("Error generating onboarding guide:", err);
      setError(err.response?.data?.message || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [repoId, isOpen]);

  useEffect(() => {
    fetchGuide();
  }, [fetchGuide]);

  const handleRegenerate = () => {
    if (!hasFeature('repo:onboarding')) {
      toast.error("🔒 Regenerating requires the PRO plan. Upgrade to unlock.");
      return;
    }
    fetchGuide(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 sm:p-6 transition-all">
      <BorderGlow
        className="w-full max-w-6xl h-[85vh] shadow-2xl animate-fadeInUp"
        borderRadius={16}
        backgroundColor="#050505"
        colors={['#ff6b00', '#ff8c00', '#ffa800']}
        glowColor="24 100 50"
        glowRadius={15}
        glowIntensity={0.6}
        coneSpread={12}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-[#ff6b00]/10 rounded-xl border border-[#ff6b00]/20 shadow-[0_0_15px_rgba(255,107,0,0.2)]">
              <Map className="text-[#ff6b00]" size={22} />
            </div>
            <div>
              <h2 className="text-gray-100 font-semibold text-lg tracking-wide">Onboarding Guide</h2>
              <p className="text-xs text-gray-400 mt-0.5">AI-generated repository walkthrough</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#ff6b00] transition rounded-lg px-2.5 py-1.5 hover:bg-white/5 border border-transparent hover:border-[#ff6b00]/30"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-[#ff6b00]" : ""} />
              {loading ? "Regenerating..." : "Regenerate"}
            </button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition rounded-lg p-1.5 hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow flex flex-col overflow-hidden bg-transparent">
          {loading ? (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
              <svg
                className="animate-spin h-10 w-10 text-[#ff6b00] mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="animate-pulse font-mono text-sm tracking-wider">
                Analyzing architecture & generating guide...
              </p>
            </div>
          ) : error ? (
            <div className="flex-grow flex items-center justify-center p-6">
              <div className="text-red-400 bg-red-400/10 border border-red-400/30 p-4 rounded-xl max-w-md text-center whitespace-pre-wrap font-mono text-sm shadow-[0_0_15px_rgba(248,113,113,0.1)]">
                {error}
              </div>
            </div>
          ) : guide ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Top Tabs */}
              <div className="flex bg-white/5 border-b border-white/10 px-6 pt-5 gap-8">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === "overview"
                      ? "border-[#ff6b00] text-[#ff6b00]"
                      : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500"
                  }`}
                >
                  <BookOpen size={16} />
                  Architecture Overview
                </button>
                <button
                  onClick={() => setActiveTab("walkthrough")}
                  className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === "walkthrough"
                      ? "border-[#ff6b00] text-[#ff6b00]"
                      : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500"
                  }`}
                >
                  <ListOrdered size={16} />
                  Step-by-Step Tour
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-grow overflow-auto p-6 sm:p-8 custom-scrollbar">
                {activeTab === "overview" && (
                  <div className="space-y-10 animate-fadeIn">
                    {guide.sections.length === 0 ? (
                      <div className="text-center text-gray-500 py-16">
                        <BookOpen className="mx-auto mb-5 opacity-40" size={56} />
                        <p className="text-base">
                          No architectural sections detected for this repository.
                        </p>
                        <p className="text-sm mt-2">
                          Try the Step-by-Step Tour tab for a reading guide.
                        </p>
                      </div>
                    ) : (
                      guide.sections.map((section, sIdx) => (
                        <section key={section.key || sIdx}>
                          <h3 className="flex items-center gap-2 text-gray-100 font-medium text-lg mb-5 pb-3 border-b border-white/10">
                            {ICON_MAP[section.icon] || (
                              <FileCode2 size={20} className="text-gray-500" />
                            )}
                            {section.title}
                            <span className="ml-auto text-xs text-gray-500 font-normal bg-white/5 px-2 py-1 rounded-md">
                              {section.items.length} items
                            </span>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {section.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:border-[#ff6b00]/50 hover:bg-white/10 transition-all duration-300 group shadow-sm hover:shadow-[0_4px_20px_rgba(255,107,0,0.1)]"
                              >
                                <h4 className="font-semibold text-sm text-gray-200 mb-1.5 group-hover:text-[#ff6b00] transition-colors">
                                  {item.name}
                                </h4>
                                <h5 className="font-mono text-xs text-gray-400 mb-3 break-all">
                                  {formatPath(item.file)}
                                </h5>
                                <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "walkthrough" && (
                  <div className="animate-fadeIn max-w-4xl mx-auto py-4">
                    <div className="mb-8">
                      <h3 className="text-gray-100 text-xl font-semibold tracking-wide">
                        Recommended Reading Order
                      </h3>
                      <p className="text-gray-400 text-sm mt-1.5">
                        Follow this sequence to understand the codebase efficiently.
                      </p>
                    </div>

                    <div className="space-y-6 relative ml-2">
                      <div className="absolute left-[21px] top-5 bottom-5 w-px bg-white/10 z-0"></div>

                      {guide.readingList
                        .sort((a, b) => a.order - b.order)
                        .map((item, idx) => (
                          <div key={idx} className="relative z-10 flex gap-6 items-start">
                            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-black border-2 border-[#ff6b00] text-[#ff6b00] flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,107,0,0.3)] mt-0.5">
                              {item.order}
                            </div>
                            <div className="flex-grow bg-white/5 border border-white/10 p-5 rounded-2xl hover:border-[#ff6b00]/50 hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-[0_4px_20px_rgba(255,107,0,0.1)]">
                              <h4 className="font-mono text-sm text-[#ff6b00] mb-2.5 break-all">
                                {formatPath(item.file)}
                              </h4>
                              <p className="text-sm text-gray-300 leading-relaxed">{item.reason}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </BorderGlow>
    </div>
  );
}
