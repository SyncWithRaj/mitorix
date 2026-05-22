import React, { useState, useEffect, useRef } from "react";
import api from "@/lib/axios";
import { X, Copy, Check, FileText } from "lucide-react";
import mermaid from "mermaid";

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

  const mermaidRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isOpen) return;

    const fetchDesignDoc = async () => {
      setLoading(true);
      setError(null);
      setMermaidSyntax("");
      try {
        const res = await api.get(`/repos/${repoId}/design-doc`);
        if (res.data.success && res.data.mermaid) {
          let rawMermaid = res.data.mermaid;

          if (
            rawMermaid.includes("RepoLens AI is currently experiencing high load") ||
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
    };

    fetchDesignDoc();
  }, [repoId, isOpen]);

  useEffect(() => {
    if (mermaidSyntax && mermaidRef.current) {
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
  }, [mermaidSyntax]);

  const handleCopy = () => {
    const textToCopy = `\`\`\`mermaid\n${mermaidSyntax}\n\`\`\``;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fadeInUp">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-2">
            <FileText className="text-[#58a6ff]" size={20} />
            <h2 className="text-[#c9d1d9] font-semibold">System Design Architecture</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#ff7b72] transition rounded p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-auto p-6 flex flex-col items-center justify-center relative custom-scrollbar bg-[#010409]">
          {loading ? (
            <div className="flex flex-col items-center justify-center text-[#8b949e]">
              <svg
                className="animate-spin h-10 w-10 text-[#58a6ff] mb-4"
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
              <p className="animate-pulse font-mono text-sm">
                Asking Gemini to generate Mermaid.js diagram...
              </p>
            </div>
          ) : error ? (
            <div className="text-[#ff7b72] bg-[#ff7b72]/10 border border-[#ff7b72]/30 p-4 rounded-lg max-w-md text-center whitespace-pre-wrap font-mono text-sm">
              {error}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              <div className="flex justify-end mb-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs py-1.5 px-3 rounded-md border border-[#30363d] transition-colors"
                >
                  {copied ? <Check size={14} className="text-[#2ea043]" /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy Markdown"}
                </button>
              </div>
              <div className="flex-grow w-full overflow-auto custom-scrollbar bg-[#0d1117] rounded-lg border border-[#30363d] relative p-4">
                <style>{`
                  .mermaid {
                    display: flex;
                    justify-content: center;
                    min-width: min-content;
                  }
                  .mermaid svg {
                    min-width: 800px;
                    width: 100% !important;
                    height: auto !important;
                    max-width: none !important;
                  }
                `}</style>
                <div ref={mermaidRef} className="mermaid" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
