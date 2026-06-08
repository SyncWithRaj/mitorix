"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { X, FileCode2 } from "lucide-react";

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
              className={`w-2.5 h-2.5 rounded-full ${data.type === "critical" ? "bg-red-500" : "bg-[#ff6b00]"}`}
            />
            <h3 className="text-sm font-bold text-[#e5e5e5]">{data.title}</h3>
          </div>
          <p className="text-[10px] text-[#737373] mb-4 leading-relaxed">{data.desc}</p>
          {data.items && data.items.length > 0 && (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {data.items.map((item: any, i: number) => (
                <div
                  key={i}
                  className="bg-[#000000] border border-[#1a1a1a] rounded-md p-3 text-[10px] cursor-pointer hover:border-[#ff6b00]/50 transition"
                  onClick={() => {
                    if (item.file) {
                      selectFile(item.file);
                      setDrillDown(null);
                    }
                  }}
                >
                  <div className="font-semibold text-[#e5e5e5] mb-1">
                    {item.name || item.file || "—"}
                  </div>
                  {item.file && (
                    <div className="flex items-center gap-1 text-[#737373] mb-1">
                      <FileCode2 size={10} /> {item.file}
                      {item.line && <span className="text-[#ff6b00]"> L{item.line}</span>}
                    </div>
                  )}
                  {item.code && (
                    <div className="mt-1.5 p-1.5 bg-[#050505] rounded font-mono text-[8px] text-[#737373] overflow-x-auto whitespace-pre">
                      {item.code}
                    </div>
                  )}
                  {item.suggestion && (
                    <div className="mt-1.5 text-[9px] text-[#ff8c00]">💡 {item.suggestion}</div>
                  )}
                  {item.fns !== undefined && (
                    <span className="text-[#737373]">{item.fns} functions</span>
                  )}
                  {item.lines !== undefined && (
                    <span className="text-[#737373] ml-2">{item.lines} lines</span>
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
            <h3 className="text-sm font-bold text-[#e5e5e5]">{data.name}</h3>
            {data.isAnti && (
              <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[8px] font-bold">
                ANTI-PATTERN
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#737373] mb-4 leading-relaxed">{data.desc}</p>
          {data.files && data.files.length > 0 && (
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {data.files.map((f: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-[#000000] border border-[#1a1a1a] rounded-md p-2.5 text-[10px] cursor-pointer hover:border-[#ff6b00]/50 transition"
                  onClick={() => {
                    selectFile(f.path);
                    setDrillDown(null);
                  }}
                >
                  <FileCode2 size={12} className="text-[#737373] shrink-0" />
                  <span className="text-[#e5e5e5] truncate flex-1">{f.name || f.path}</span>
                  {f.fns !== undefined && (
                    <span className="text-[#737373] text-[9px] shrink-0">{f.fns} fns</span>
                  )}
                  {f.lines !== undefined && (
                    <span className="text-[#737373] text-[9px] shrink-0">{f.lines} lines</span>
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
                    ? "bg-[#ff6b00]"
                    : "bg-blue-500"
              }`}
            />
            <h3 className="text-sm font-bold text-[#e5e5e5]">{data.title}</h3>
            <span
              className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                data.severity === "high"
                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : data.severity === "medium"
                    ? "bg-[#ff6b00]/10 text-[#ff6b00] border-[#ff6b00]/20"
                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
              }`}
            >
              {data.severity}
            </span>
          </div>
          <p className="text-[10px] text-[#737373] mb-3 leading-relaxed">{data.desc}</p>
          <div
            className="bg-[#000000] border border-[#1a1a1a] rounded-md p-3 text-[10px] cursor-pointer hover:border-[#ff6b00]/50 transition"
            onClick={() => {
              if (data.path) {
                selectFile(data.path);
                setDrillDown(null);
              }
            }}
          >
            <div className="flex items-center gap-1.5 text-[#e5e5e5] mb-1.5">
              <FileCode2 size={12} className="text-[#737373]" />
              {data.file || data.path}
              {data.line && <span className="text-[#ff6b00]">:L{data.line}</span>}
            </div>
            {data.code && (
              <div className="p-1.5 bg-[#050505] rounded font-mono text-[8px] text-[#737373] overflow-x-auto whitespace-pre">
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
            <h3 className="text-sm font-bold text-[#e5e5e5]">
              {data.type === "code" ? "Similar Code" : "Same Name"}: {data.name}
            </h3>
          </div>
          {data.suggestion && (
            <p className="text-[10px] text-[#ff8c00] mb-3 leading-relaxed">💡 {data.suggestion}</p>
          )}
          {data.files && data.files.length > 0 && (
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {data.files.map((f: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-[#000000] border border-[#1a1a1a] rounded-md p-2.5 text-[10px] cursor-pointer hover:border-[#ff6b00]/50 transition"
                  onClick={() => {
                    selectFile(f.file);
                    setDrillDown(null);
                  }}
                >
                  <FileCode2 size={12} className="text-[#737373] shrink-0" />
                  <span className="text-[#e5e5e5] truncate flex-1">{f.file}</span>
                  {f.line && <span className="text-[#ff6b00] text-[9px] shrink-0">L{f.line}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <div className="text-[#737373] text-xs">Unknown drill-down type</div>;
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={() => setDrillDown(null)}
    >
      <div
        className="bg-[#050505] border border-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#000000]">
          <span className="text-xs font-bold text-[#e5e5e5] uppercase tracking-wider">
            {type === "issue"
              ? "Issue Details"
              : type === "pattern"
                ? "Pattern Details"
                : type === "security"
                  ? "Security Finding"
                  : "Duplicate Details"}
          </span>
          <button
            className="p-1 hover:bg-[#1a1a1a] rounded text-[#737373] hover:text-[#e5e5e5] transition"
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
