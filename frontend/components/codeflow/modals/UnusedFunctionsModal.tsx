"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { X, Trash2, FileCode } from "lucide-react";

export default function UnusedFunctionsModal() {
  const { analysisData, showUnusedModal, setShowUnusedModal, setSelectedFile, setRightTab } =
    useCodeflow();

  if (!showUnusedModal || !analysisData) return null;

  const deadFns = analysisData.deadFunctions || [];

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-[#000000] border border-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a] bg-[#050505]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/30 flex items-center justify-center text-[#ff6b00]">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#e5e5e5]">
                Unused Functions ({deadFns.length})
              </h2>
              <p className="text-xs text-[#737373]">
                These functions are never called and may be dead code
              </p>
            </div>
          </div>
          <button
            className="p-2 text-[#737373] hover:text-[#e5e5e5] hover:bg-[#1a1a1a] rounded-md transition"
            onClick={() => setShowUnusedModal(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[#000000] space-y-4">
          {deadFns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#737373]">
              <Trash2 className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">No unused functions detected in the repository.</p>
              <p className="text-xs opacity-60 mt-1">Excellent work keeping the codebase clean!</p>
            </div>
          ) : (
            deadFns.map((fn, idx) => (
              <div
                key={`${fn.file}-${fn.line}-${idx}`}
                className="bg-[#050505] border border-[#1a1a1a] rounded-lg overflow-hidden"
              >
                <div className="p-3 border-b border-[#1a1a1a] bg-[#0a0a0a]/50 flex justify-between items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-sm font-bold text-[#ff6b00] truncate">
                      {fn.name}()
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-[#737373] uppercase px-2 py-0.5 rounded bg-[#000000] border border-[#1a1a1a]">
                      {fn.codeLines} lines
                    </span>
                    <button
                      className="p-1 text-[#737373] hover:text-[#ff6b00] hover:bg-[#000000] rounded border border-[#1a1a1a] transition flex items-center gap-1"
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

                <div className="p-2.5 px-3 flex items-center gap-1.5 text-xs text-[#737373] border-b border-[#1a1a1a] bg-[#000000]">
                  <span className="truncate">{fn.file}</span>
                  <span className="shrink-0 text-[#ff6b00]">Line {fn.line}</span>
                </div>

                {fn.code && (
                  <div className="p-3 bg-[#000000] overflow-x-auto custom-scrollbar">
                    <pre className="font-mono text-[11px] text-[#e5e5e5] leading-relaxed">
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
