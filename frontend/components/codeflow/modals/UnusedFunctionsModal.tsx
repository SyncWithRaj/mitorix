"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { X, Trash2, FileCode } from "lucide-react";

export default function UnusedFunctionsModal() {
  const { analysisData, showUnusedModal, setShowUnusedModal, setSelectedFile, setRightTab } = useCodeflow();

  if (!showUnusedModal || !analysisData) return null;

  const deadFns = analysisData.deadFunctions || [];

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-5 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f85149]/10 border border-[#f85149]/30 flex items-center justify-center text-[#f85149]">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#c9d1d9]">Unused Functions ({deadFns.length})</h2>
              <p className="text-xs text-[#8b949e]">These functions are never called and may be dead code</p>
            </div>
          </div>
          <button 
            className="p-2 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] rounded-md transition"
            onClick={() => setShowUnusedModal(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[#0d1117] space-y-4">
          {deadFns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#8b949e]">
              <Trash2 className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">No unused functions detected in the repository.</p>
              <p className="text-xs opacity-60 mt-1">Excellent work keeping the codebase clean!</p>
            </div>
          ) : (
            deadFns.map((fn, idx) => (
              <div key={`${fn.file}-${fn.line}-${idx}`} className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
                <div className="p-3 border-b border-[#30363d] bg-[#21262d]/50 flex justify-between items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-sm font-bold text-[#f85149] truncate">{fn.name}()</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-[#8b949e] uppercase px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d]">
                      {fn.codeLines} lines
                    </span>
                    <button 
                      className="p-1 text-[#8b949e] hover:text-[#58a6ff] hover:bg-[#0d1117] rounded border border-[#30363d] transition flex items-center gap-1"
                      onClick={() => {
                        setShowUnusedModal(false);
                        setSelectedFile(fn.file);
                        setRightTab("code");
                      }}
                      title="View in Monaco Editor"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span className="text-[10px] hidden sm:block">View</span>
                    </button>
                  </div>
                </div>
                
                <div className="p-2.5 px-3 flex items-center gap-1.5 text-xs text-[#8b949e] border-b border-[#30363d] bg-[#0d1117]">
                  <span className="truncate">{fn.file}</span>
                  <span className="shrink-0 text-[#58a6ff]">Line {fn.line}</span>
                </div>

                {fn.code && (
                  <div className="p-3 bg-[#010409] overflow-x-auto custom-scrollbar">
                    <pre className="font-mono text-[11px] text-[#c9d1d9] leading-relaxed">
                      <code>{fn.code}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
