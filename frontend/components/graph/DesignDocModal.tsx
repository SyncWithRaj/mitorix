import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/axios";
import { X, Copy, Check, FileText, ZoomIn, ZoomOut, Maximize, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import mermaid from "mermaid";
import BorderGlow from "@/components/ui/BorderGlow";
import { useSubscription } from "@/context/SubscriptionContext";

interface DesignDocModalProps {
  repoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DesignDocModal({ repoId, isOpen, onClose }: DesignDocModalProps) {
  const [loading, setLoading] = useState(true);
  const [mermaidSyntax, setMermaidSyntax] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pan and Zoom states
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const mermaidRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // Prevent browser scroll/zoom and only zoom the diagram
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setScale(s => Math.min(Math.max(0.1, s * zoomFactor), 10));
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleNativeWheel);
  }, [loading, error, mermaidSyntax]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        fontSize: "16px",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      },
    });
  }, []);

  const { hasFeature } = useSubscription();

  const fetchDesignDoc = useCallback(async (force = false) => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setMermaidSyntax("");
    try {
      const res = await api.get(`/repos/${repoId}/design-doc${force ? "?force=true" : ""}`);
      if (res.data.success && res.data.mermaid) {
        let rawMermaid = res.data.mermaid;

        if (
          rawMermaid.includes("Mitorix AI is currently experiencing high load") ||
          (!rawMermaid.includes("```") &&
            !rawMermaid.trim().startsWith("graph") &&
            !rawMermaid.trim().startsWith("flowchart"))
        ) {
          setError(rawMermaid);
          setLoading(false);
          return;
        }

        if (rawMermaid.includes("```mermaid")) {
          rawMermaid = rawMermaid.split("```mermaid")[1].split("```")[0].trim();
        } else if (rawMermaid.includes("```")) {
          rawMermaid = rawMermaid.split("```")[1].trim();
          if (rawMermaid.startsWith("mermaid")) {
            rawMermaid = rawMermaid.substring(7).trim();
          }
        }
        setMermaidSyntax(rawMermaid);
      } else {
        setError("Failed to generate design doc format.");
      }
    } catch (err: any) {
      console.error("Error generating design doc:", err);
      setError("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [repoId, isOpen]);

  useEffect(() => {
    fetchDesignDoc();
  }, [fetchDesignDoc]);

  const handleRegenerate = () => {
    if (!hasFeature('repo:design-doc')) {
      toast.error("🔒 Regenerating requires the PRO plan. Upgrade to unlock.");
      return;
    }
    fetchDesignDoc(true);
  };

  useEffect(() => {
    if (isOpen && !loading && !error && mermaidSyntax && mermaidRef.current) {
      const uniqueId = `mermaid-render-${Math.floor(Math.random() * 100000)}`;
      try {
        mermaid
          .render(uniqueId, mermaidSyntax)
          .then(({ svg }) => {
            if (mermaidRef.current) {
              mermaidRef.current.innerHTML = svg;
            }
          })
          .catch((err) => {
            console.error("Mermaid rendering error:", err);
            setError("Failed to render the diagram. The generated syntax might be invalid.");
          });
      } catch (err) {
        console.error("Mermaid synchronous rendering error:", err);
        setError("Failed to render the diagram. The generated syntax might be invalid.");
      }
    }
  }, [mermaidSyntax, isOpen, loading, error]);

  const handleCopy = () => {
    const textToCopy = `\`\`\`mermaid\n${mermaidSyntax}\n\`\`\``;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 sm:p-6 transition-all">
      <BorderGlow
        className="w-full max-w-5xl h-[85vh] shadow-2xl animate-fadeInUp"
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
          <div className="flex items-center gap-3">
            <FileText className="text-[#ff6b00]" size={20} />
            <h2 className="text-gray-100 font-semibold tracking-wide">System Design Architecture</h2>
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
        <div className="flex-grow overflow-auto p-6 flex flex-col items-center justify-center relative custom-scrollbar bg-transparent">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="relative flex items-center justify-center w-24 h-24">
                <div className="absolute inset-0 border-2 border-[#ff6b00]/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                <div className="absolute inset-2 border-2 border-[#ff6b00]/40 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
                <div className="absolute inset-4 border-2 border-[#ff6b00]/60 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                <div className="absolute inset-6 bg-[#ff6b00]/20 rounded-full blur-sm animate-pulse"></div>
                <div className="relative z-10 w-10 h-10 bg-black/80 rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,107,0,0.5)]">
                  <FileText className="text-[#ff6b00]" size={18} />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <h3 className="text-gray-200 font-semibold text-lg tracking-wide mb-2">MitorixAI is generating...</h3>
                <p className="text-gray-500 text-sm animate-pulse">Analyzing repository architecture</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-red-400 bg-red-400/10 border border-red-400/30 p-4 rounded-xl max-w-md text-center whitespace-pre-wrap font-mono text-sm shadow-sm">
              {error}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              <div className="flex items-center justify-between mb-3 w-full">
                <div className="flex items-center gap-2">
                  <button onClick={() => setScale(s => Math.max(0.1, s * 0.8))} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Zoom Out">
                    <ZoomOut size={16} />
                  </button>
                  <button onClick={resetZoom} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Reset Zoom">
                    <Maximize size={16} />
                  </button>
                  <button onClick={() => setScale(s => Math.min(10, s * 1.2))} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Zoom In">
                    <ZoomIn size={16} />
                  </button>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-200 text-xs py-1.5 px-3 rounded-md border border-white/10 transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy Markdown"}
                </button>
              </div>
              <div 
                ref={containerRef}
                className="flex-grow w-full overflow-hidden bg-black/40 rounded-xl border border-white/10 relative p-4 cursor-grab active:cursor-grabbing"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <style>{`
                  .mermaid {
                    display: flex;
                    justify-content: center;
                    min-width: min-content;
                    transform-origin: center;
                  }
                  .mermaid svg {
                    min-width: 800px;
                    width: 100% !important;
                    height: auto !important;
                    max-width: none !important;
                  }
                `}</style>
                <div 
                  style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}
                  className="w-full h-full flex items-center justify-center origin-center"
                >
                  <div ref={mermaidRef} className="mermaid" />
                </div>
              </div>
            </div>
          )}
        </div>
      </BorderGlow>
    </div>
  );
}
