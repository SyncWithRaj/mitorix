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
      const repoId = window.location.pathname.split("/").pop();
      if (repoId) {
        api
          .get(`/files/content`, { params: { repoId, path: filePreview.path } })
          .then((res) => {
            setFilePreview({ ...filePreview, content: res.data.content });
          })
          .catch((err) => {
            console.error("Failed to load preview", err);
            setFilePreview({
              ...filePreview,
              content: "// Failed to load source code from server.",
            });
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [filePreview, setFilePreview]);

  if (!filePreview) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-[#000000] border border-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a] bg-[#050505]">
          <div className="flex items-center gap-2 min-w-0">
            <Code className="w-5 h-5 text-[#ff6b00] shrink-0" />
            <h2 className="text-sm font-bold text-[#e5e5e5] truncate font-mono">
              {filePreview.path}
            </h2>
          </div>
          <button
            className="p-1.5 text-[#737373] hover:text-[#e5e5e5] hover:bg-[#1a1a1a] rounded-md transition ml-4 shrink-0"
            onClick={() => setFilePreview(null)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#000000] custom-scrollbar p-4 relative">
          {loading ? (
            <div className="flex h-full items-center justify-center text-[#737373]">
              <Loader2 className="w-6 h-6 animate-spin mr-2 text-[#ff6b00]" />
              Loading source code...
            </div>
          ) : (
            <pre className="font-mono text-xs text-[#e5e5e5] leading-relaxed">
              <code>{filePreview.content || "// Source code not available."}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
