"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { Zap, ChevronRight, ChevronDown, Eye, AlertTriangle, FileCode2 } from "lucide-react";

export default function FunctionList() {
  const {
    analysisData,
    selectedFile,
    expandedCards,
    toggleCard,
    expandedFns,
    toggleFn,
    selectFile,
  } = useCodeflow();

  if (!analysisData || !selectedFile) return null;

  const file = analysisData.files.find((f) => f.path === selectedFile);
  if (!file) return null;

  const isOpen = expandedCards.has("fns");

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg mb-3 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-[#1a1a1a] transition select-none text-xs font-semibold text-[#e5e5e5]"
        onClick={() => toggleCard("fns")}
      >
        {isOpen ? (
          <ChevronDown size={14} className="text-[#737373]" />
        ) : (
          <ChevronRight size={14} className="text-[#737373]" />
        )}
        <Zap size={14} className="text-[#ff6b00]" />
        Functions ({file.functions.length})
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-2 border-t border-[#1a1a1a]/50 mt-1 space-y-1">
          {file.functions.length === 0 ? (
            <div className="text-[10px] text-[#737373] py-4 text-center italic">
              No functions detected
            </div>
          ) : (
            file.functions.map((fn) => {
              const st = analysisData.fnStats[fn.name];
              const isFnOpen = expandedFns.has(fn.name);
              const intCalls = st ? st.internal : 0;
              const extCalls = st ? st.external : 0;

              return (
                <div
                  key={fn.name}
                  className="flex flex-col border border-[#1a1a1a]/30 rounded bg-[#000000] overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between p-2 cursor-pointer hover:bg-[#0a0a0a] select-none"
                    onClick={() => toggleFn(fn.name)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[#ff8c00] font-mono text-[10px] truncate">
                        {fn.name}()
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        className="p-1 text-[#737373] hover:text-[#e5e5e5] bg-[#0a0a0a] rounded"
                        title="View source"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Eye size={10} />
                      </button>
                      <span className="text-[9px] text-[#737373] w-8">L{fn.line}</span>
                      <span
                        className="px-1 py-0.5 text-[8px] bg-[#0a0a0a] text-[#737373] rounded"
                        title="Internal calls (same file)"
                      >
                        {intCalls} int
                      </span>
                      <span
                        className={`px-1 py-0.5 text-[8px] rounded ${extCalls > 10 ? "bg-red-500/10 text-red-400 border border-red-500/20" : extCalls > 0 ? "bg-[#ff6b00]/10 text-[#ff6b00] border border-[#ff6b00]/20" : "bg-[#0a0a0a] text-[#737373]"}`}
                        title="External calls (other files)"
                      >
                        {extCalls} ext
                      </span>
                    </div>
                  </div>

                  {isFnOpen && (
                    <div className="p-2 pt-0 bg-[#050505] border-t border-[#1a1a1a]/30 mt-1">
                      {/* Code Preview */}
                      {fn.code && (
                        <div className="mt-2 p-2 bg-[#000000] border border-[#1a1a1a] rounded text-[9px] font-mono text-[#737373] overflow-x-auto whitespace-pre">
                          {fn.code}
                        </div>
                      )}

                      {/* Callers */}
                      {st && st.callers && st.callers.length > 0 && (
                        <div className="mt-3">
                          <div className="text-[9px] font-semibold text-[#737373] mb-1.5">
                            External callers:
                          </div>
                          <div className="space-y-1">
                            {st.callers.slice(0, 8).map((c, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1.5 text-[9px] text-[#e5e5e5] hover:text-[#ff6b00] cursor-pointer"
                                onClick={() => selectFile(c.file)}
                              >
                                <FileCode2 size={10} className="text-[#737373] shrink-0" />
                                <span className="truncate flex-1">{c.name}</span>
                                <span className="text-[#737373] shrink-0 ml-2">{c.count}×</span>
                              </div>
                            ))}
                            {st.callers.length > 8 && (
                              <div className="text-[9px] text-[#737373] mt-1 italic px-1">
                                +{st.callers.length - 8} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Unused Warning */}
                      {intCalls === 0 && extCalls === 0 && (
                        <div className="mt-3 p-2 bg-[#ff6b00]/10 border border-[#ff6b00]/20 rounded flex items-center justify-center gap-2 text-[9px] text-[#ff6b00]">
                          <AlertTriangle size={12} />
                          This function is never called
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
