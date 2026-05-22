"use client";

import React, { useMemo } from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { Link as LinkIcon, ChevronRight, ChevronDown, FileCode2, ArrowRight } from "lucide-react";

export default function ConnectionsCard() {
  const { analysisData, selectedFile, expandedCards, toggleCard, selectFile } = useCodeflow();

  const { outgoing, incoming, totalConns } = useMemo(() => {
    if (!analysisData || !selectedFile) return { outgoing: [], incoming: [], totalConns: 0 };

    const connByFile = { out: {} as Record<string, any>, in: {} as Record<string, any> };

    analysisData.connections.forEach((c) => {
      const src = typeof c.source === "object" ? (c.source as any).id : c.source;
      const tgt = typeof c.target === "object" ? (c.target as any).id : c.target;

      if (src === selectedFile) {
        if (!connByFile.out[tgt]) connByFile.out[tgt] = { file: tgt, fns: [] };
        connByFile.out[tgt].fns.push({ name: c.fn, count: c.count });
      }
      if (tgt === selectedFile) {
        if (!connByFile.in[src]) connByFile.in[src] = { file: src, fns: [] };
        connByFile.in[src].fns.push({ name: c.fn, count: c.count });
      }
    });

    const outgoing = Object.values(connByFile.out).sort((a, b) => b.fns.length - a.fns.length);
    const incoming = Object.values(connByFile.in).sort((a, b) => b.fns.length - a.fns.length);

    return { outgoing, incoming, totalConns: outgoing.length + incoming.length };
  }, [analysisData, selectedFile]);

  if (totalConns === 0) return null;

  const isOpen = expandedCards.has("conns");

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg mb-3 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#1f242c] transition select-none"
        onClick={() => toggleCard("conns")}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-[#c9d1d9]">
          {isOpen ? (
            <ChevronDown size={14} className="text-[#8b949e]" />
          ) : (
            <ChevronRight size={14} className="text-[#8b949e]" />
          )}
          <LinkIcon size={14} className="text-[#8b949e]" />
          Connections
        </div>
        <div className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d]">
          {totalConns}
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="border-t border-[#30363d]/50 bg-[#0d1117]">
          {/* Outgoing (Uses) */}
          {outgoing.length > 0 && (
            <div>
              <div className="text-[9px] font-semibold text-[#8b949e] px-3 py-1.5 bg-[#161b22] border-b border-[#30363d]/50">
                Uses ({outgoing.length} files)
              </div>
              <div className="divide-y divide-[#30363d]/30">
                {outgoing.slice(0, 15).map((conn) => {
                  const cardId = `conn-out-${conn.file}`;
                  const isConnOpen = expandedCards.has(cardId);

                  return (
                    <div key={conn.file} className="flex flex-col">
                      <div
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#161b22] select-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCard(cardId);
                        }}
                      >
                        {isConnOpen ? (
                          <ChevronDown size={10} className="text-[#8b949e]" />
                        ) : (
                          <ChevronRight size={10} className="text-[#8b949e]" />
                        )}
                        <FileCode2 size={12} className="text-[#8b949e] shrink-0" />
                        <span className="text-[10px] text-[#c9d1d9] truncate flex-1">
                          {conn.file.split("/").pop()}
                        </span>
                        <span className="text-[9px] text-[#8b949e] bg-[#21262d] px-1 rounded shrink-0">
                          {conn.fns.length} fn{conn.fns.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {isConnOpen && (
                        <div className="pl-8 pr-3 pb-2 bg-[#0a0a0f] space-y-1">
                          {conn.fns.map((fn: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-[10px]">
                              <span className="text-[#58a6ff] font-mono truncate">{fn.name}()</span>
                              <span className="text-[#8b949e] shrink-0 ml-2">{fn.count}×</span>
                            </div>
                          ))}
                          <div
                            className="flex items-center gap-1 text-[9px] text-[#8b949e] hover:text-[#c9d1d9] cursor-pointer mt-1.5 pt-1.5 border-t border-[#30363d]/30"
                            onClick={() => selectFile(conn.file)}
                          >
                            <ArrowRight size={10} /> View {conn.file.split("/").pop()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {outgoing.length > 15 && (
                  <div className="text-[9px] text-[#8b949e] text-center py-2 italic bg-[#0a0a0f]">
                    +{outgoing.length - 15} more files
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Incoming (Used by) */}
          {incoming.length > 0 && (
            <div>
              <div
                className={`text-[9px] font-semibold text-[#8b949e] px-3 py-1.5 bg-[#161b22] border-b border-[#30363d]/50 ${outgoing.length > 0 ? "border-t border-[#30363d]/50" : ""}`}
              >
                Used by ({incoming.length} files)
              </div>
              <div className="divide-y divide-[#30363d]/30">
                {incoming.slice(0, 15).map((conn) => {
                  const cardId = `conn-in-${conn.file}`;
                  const isConnOpen = expandedCards.has(cardId);

                  return (
                    <div key={conn.file} className="flex flex-col">
                      <div
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#161b22] select-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCard(cardId);
                        }}
                      >
                        {isConnOpen ? (
                          <ChevronDown size={10} className="text-[#8b949e]" />
                        ) : (
                          <ChevronRight size={10} className="text-[#8b949e]" />
                        )}
                        <FileCode2 size={12} className="text-[#8b949e] shrink-0" />
                        <span className="text-[10px] text-[#c9d1d9] truncate flex-1">
                          {conn.file.split("/").pop()}
                        </span>
                        <span className="text-[9px] text-[#8b949e] bg-[#21262d] px-1 rounded shrink-0">
                          {conn.fns.length} fn{conn.fns.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {isConnOpen && (
                        <div className="pl-8 pr-3 pb-2 bg-[#0a0a0f] space-y-1">
                          {conn.fns.map((fn: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-[10px]">
                              <span className="text-[#58a6ff] font-mono truncate">{fn.name}()</span>
                              <span className="text-[#8b949e] shrink-0 ml-2">{fn.count}×</span>
                            </div>
                          ))}
                          <div
                            className="flex items-center gap-1 text-[9px] text-[#8b949e] hover:text-[#c9d1d9] cursor-pointer mt-1.5 pt-1.5 border-t border-[#30363d]/30"
                            onClick={() => selectFile(conn.file)}
                          >
                            <ArrowRight size={10} /> View {conn.file.split("/").pop()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {incoming.length > 15 && (
                  <div className="text-[9px] text-[#8b949e] text-center py-2 italic bg-[#0a0a0f]">
                    +{incoming.length - 15} more files
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
