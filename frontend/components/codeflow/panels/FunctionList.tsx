"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { Zap, ChevronRight, ChevronDown, Eye, AlertTriangle, FileCode2 } from "lucide-react";

export default function FunctionList() {
  const { analysisData, selectedFile, expandedCards, toggleCard, expandedFns, toggleFn, selectFile } = useCodeflow();

  if (!analysisData || !selectedFile) return null;

  const file = analysisData.files.find(f => f.path === selectedFile);
  if (!file) return null;

  const isOpen = expandedCards.has("fns");

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg mb-3 overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-[#1f242c] transition select-none text-xs font-semibold text-[#c9d1d9]"
        onClick={() => toggleCard("fns")}
      >
        {isOpen ? <ChevronDown size={14} className="text-[#8b949e]" /> : <ChevronRight size={14} className="text-[#8b949e]" />}
        <Zap size={14} className="text-[#ff9f43]" />
        Functions ({file.functions.length})
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-2 border-t border-[#30363d]/50 mt-1 space-y-1">
          {file.functions.length === 0 ? (
            <div className="text-[10px] text-[#8b949e] py-4 text-center italic">No functions detected</div>
          ) : (
            file.functions.map(fn => {
              const st = analysisData.fnStats[fn.name];
              const isFnOpen = expandedFns.has(fn.name);
              const intCalls = st ? st.internal : 0;
              const extCalls = st ? st.external : 0;

              return (
                <div key={fn.name} className="flex flex-col border border-[#30363d]/30 rounded bg-[#0d1117] overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-2 cursor-pointer hover:bg-[#161b22] select-none"
                    onClick={() => toggleFn(fn.name)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[#58a6ff] font-mono text-[10px] truncate">{fn.name}()</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button 
                        className="p-1 text-[#8b949e] hover:text-[#c9d1d9] bg-[#21262d] rounded" 
                        title="View source"
                        onClick={(e) => { e.stopPropagation(); /* TODO: open file preview modal */ }}
                      >
                        <Eye size={10} />
                      </button>
                      <span className="text-[9px] text-[#8b949e] w-8">L{fn.line}</span>
                      <span className="px-1 py-0.5 text-[8px] bg-[#21262d] text-[#8b949e] rounded" title="Internal calls (same file)">
                        {intCalls} int
                      </span>
                      <span className={`px-1 py-0.5 text-[8px] rounded ${extCalls > 10 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : extCalls > 0 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-[#21262d] text-[#8b949e]'}`} title="External calls (other files)">
                        {extCalls} ext
                      </span>
                    </div>
                  </div>

                  {isFnOpen && (
                    <div className="p-2 pt-0 bg-[#0a0a0f] border-t border-[#30363d]/30 mt-1">
                      {/* Code Preview */}
                      {fn.code && (
                        <div className="mt-2 p-2 bg-[#010409] border border-[#30363d] rounded text-[9px] font-mono text-[#8b949e] overflow-x-auto whitespace-pre">
                          {fn.code}
                        </div>
                      )}

                      {/* Callers */}
                      {st && st.callers && st.callers.length > 0 && (
                        <div className="mt-3">
                          <div className="text-[9px] font-semibold text-[#8b949e] mb-1.5">External callers:</div>
                          <div className="space-y-1">
                            {st.callers.slice(0, 8).map((c, i) => (
                              <div 
                                key={i}
                                className="flex items-center gap-1.5 text-[9px] text-[#c9d1d9] hover:text-[#58a6ff] cursor-pointer"
                                onClick={() => selectFile(c.file)}
                              >
                                <FileCode2 size={10} className="text-[#8b949e] shrink-0" />
                                <span className="truncate flex-1">{c.name}</span>
                                <span className="text-[#8b949e] shrink-0 ml-2">{c.count}×</span>
                              </div>
                            ))}
                            {st.callers.length > 8 && (
                              <div className="text-[9px] text-[#8b949e] mt-1 italic px-1">
                                +{st.callers.length - 8} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Unused Warning */}
                      {intCalls === 0 && extCalls === 0 && (
                        <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/20 rounded flex items-center justify-center gap-2 text-[9px] text-orange-400">
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
