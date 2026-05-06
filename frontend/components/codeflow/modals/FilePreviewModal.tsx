"use client";

import React, { useEffect, useState } from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { X, Code, Loader2 } from "lucide-react";
import api from "../../../lib/axios";

export default function FilePreviewModal() {
  const { filePreview, setFilePreview } = useCodeflow();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (filePreview && !filePreview.content) {
      setLoading(true);
      // Assuming repoId is available globally or we can extract it from URL.
      // Wait, we don't have repoId here directly. Let's get it from the URL or AnalysisData.
      const repoId = window.location.pathname.split("/").pop();
      if (repoId) {
        api.get(`/files/content`, { params: { repoId, path: filePreview.path } })
          .then(res => {
            setFilePreview({ ...filePreview, content: res.data.content });
          })
          .catch(err => {
            console.error("Failed to load preview", err);
            setFilePreview({ ...filePreview, content: "// Failed to load source code from server." });
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [filePreview, setFilePreview]);

  if (!filePreview) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-4 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-2 min-w-0">
            <Code className="w-5 h-5 text-[#58a6ff] shrink-0" />
            <h2 className="text-sm font-bold text-[#c9d1d9] truncate font-mono">{filePreview.path}</h2>
          </div>
          <button 
            className="p-1.5 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] rounded-md transition ml-4 shrink-0"
            onClick={() => setFilePreview(null)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#010409] custom-scrollbar p-4 relative">
          {loading ? (
            <div className="flex h-full items-center justify-center text-[#8b949e]">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading source code...
            </div>
          ) : (
            <pre className="font-mono text-xs text-[#c9d1d9] leading-relaxed">
              <code>{filePreview.content || "// Source code not available."}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
