"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { X, FileCode2, AlertTriangle } from "lucide-react";

export default function DrillDownModal() {
  const { drillDown, setDrillDown, selectFile } = useCodeflow();

  if (!drillDown) return null;

  const { type, data } = drillDown;

  const renderContent = () => {
    if (type === "issue") {
      return (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-2.5 h-2.5 rounded-full ${data.type === "critical" ? "bg-red-500" : "bg-orange-500"}`}
            />
            <h3 className="text-sm font-bold text-[#c9d1d9]">{data.title}</h3>
          </div>
          <p className="text-[10px] text-[#8b949e] mb-4 leading-relaxed">{data.desc}</p>
          {data.items && data.items.length > 0 && (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {data.items.map((item: any, i: number) => (
                <div
                  key={i}
                  className="bg-[#0d1117] border border-[#30363d] rounded-md p-3 text-[10px] cursor-pointer hover:border-[#58a6ff]/50 transition"
                  onClick={() => {
                    if (item.file) {
                      selectFile(item.file);
                      setDrillDown(null);
                    }
                  }}
                >
                  <div className="font-semibold text-[#c9d1d9] mb-1">
                    {item.name || item.file || "—"}
                  </div>
                  {item.file && (
                    <div className="flex items-center gap-1 text-[#8b949e] mb-1">
                      <FileCode2 size={10} /> {item.file}
                      {item.line && <span className="text-[#58a6ff]"> L{item.line}</span>}
                    </div>
                  )}
                  {item.code && (
                    <div className="mt-1.5 p-1.5 bg-[#010409] rounded font-mono text-[8px] text-[#8b949e] overflow-x-auto whitespace-pre">
                      {item.code}
                    </div>
                  )}
                  {item.suggestion && (
                    <div className="mt-1.5 text-[9px] text-[#22c55e]">💡 {item.suggestion}</div>
                  )}
                  {item.fns !== undefined && (
                    <span className="text-[#8b949e]">{item.fns} functions</span>
                  )}
                  {item.lines !== undefined && (
                    <span className="text-[#8b949e] ml-2">{item.lines} lines</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (type === "pattern") {
      return (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-[#c9d1d9]">{data.name}</h3>
            {data.isAnti && (
              <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[8px] font-bold">
                ANTI-PATTERN
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#8b949e] mb-4 leading-relaxed">{data.desc}</p>
          {data.files && data.files.length > 0 && (
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {data.files.map((f: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-md p-2.5 text-[10px] cursor-pointer hover:border-[#58a6ff]/50 transition"
                  onClick={() => {
                    selectFile(f.path);
                    setDrillDown(null);
                  }}
                >
                  <FileCode2 size={12} className="text-[#8b949e] shrink-0" />
                  <span className="text-[#c9d1d9] truncate flex-1">{f.name || f.path}</span>
                  {f.fns !== undefined && (
                    <span className="text-[#8b949e] text-[9px] shrink-0">{f.fns} fns</span>
                  )}
                  {f.lines !== undefined && (
                    <span className="text-[#8b949e] text-[9px] shrink-0">{f.lines} lines</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (type === "security") {
      return (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                data.severity === "high"
                  ? "bg-red-500"
                  : data.severity === "medium"
                    ? "bg-orange-500"
                    : "bg-blue-500"
              }`}
            />
            <h3 className="text-sm font-bold text-[#c9d1d9]">{data.title}</h3>
            <span
              className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                data.severity === "high"
                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : data.severity === "medium"
                    ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
              }`}
            >
              {data.severity}
            </span>
          </div>
          <p className="text-[10px] text-[#8b949e] mb-3 leading-relaxed">{data.desc}</p>
          <div
            className="bg-[#0d1117] border border-[#30363d] rounded-md p-3 text-[10px] cursor-pointer hover:border-[#58a6ff]/50 transition"
            onClick={() => {
              if (data.path) {
                selectFile(data.path);
                setDrillDown(null);
              }
            }}
          >
            <div className="flex items-center gap-1.5 text-[#c9d1d9] mb-1.5">
              <FileCode2 size={12} className="text-[#8b949e]" />
              {data.file || data.path}
              {data.line && <span className="text-[#58a6ff]">:L{data.line}</span>}
            </div>
            {data.code && (
              <div className="p-1.5 bg-[#010409] rounded font-mono text-[8px] text-[#8b949e] overflow-x-auto whitespace-pre">
                {data.code}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (type === "duplicate") {
      return (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-[#c9d1d9]">
              {data.type === "code" ? "Similar Code" : "Same Name"}: {data.name}
            </h3>
          </div>
          {data.suggestion && (
            <p className="text-[10px] text-[#22c55e] mb-3 leading-relaxed">💡 {data.suggestion}</p>
          )}
          {data.files && data.files.length > 0 && (
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {data.files.map((f: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-md p-2.5 text-[10px] cursor-pointer hover:border-[#58a6ff]/50 transition"
                  onClick={() => {
                    selectFile(f.file);
                    setDrillDown(null);
                  }}
                >
                  <FileCode2 size={12} className="text-[#8b949e] shrink-0" />
                  <span className="text-[#c9d1d9] truncate flex-1">{f.file}</span>
                  {f.line && <span className="text-[#58a6ff] text-[9px] shrink-0">L{f.line}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <div className="text-[#8b949e] text-xs">Unknown drill-down type</div>;
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setDrillDown(null)}
    >
      <div
        className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#0d1117]">
          <span className="text-xs font-bold text-[#c9d1d9] uppercase tracking-wider">
            {type === "issue"
              ? "Issue Details"
              : type === "pattern"
                ? "Pattern Details"
                : type === "security"
                  ? "Security Finding"
                  : "Duplicate Details"}
          </span>
          <button
            className="p-1 hover:bg-[#30363d] rounded text-[#8b949e] hover:text-[#c9d1d9] transition"
            onClick={() => setDrillDown(null)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">{renderContent()}</div>
      </div>
    </div>
  );
}
