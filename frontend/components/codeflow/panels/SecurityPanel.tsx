"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { Shield, ShieldCheck } from "lucide-react";
import { useDragStore } from "../../../lib/dragStore";
import type { DraggedContextNode } from "../../../lib/dragdrop.types";

export default function SecurityPanel() {
  const { analysisData, setDrillDown } = useCodeflow();

  if (!analysisData) return null;

  const criticalCount = analysisData.securityIssues.filter((i) => i.severity === "critical").length;
  const highCount = analysisData.securityIssues.filter((i) => i.severity === "high").length;
  const mediumCount = analysisData.securityIssues.filter((i) => i.severity === "medium").length;
  const lowCount = analysisData.securityIssues.filter((i) => i.severity === "low").length;

  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold text-[#e5e5e5] mb-4">
        <Shield size={16} className="text-[#ff6b00]" />
        Security Analysis
      </div>

      {analysisData.securityIssues.length === 0 ? (
        <div className="text-center py-10 px-4 animate-fadeIn">
          <ShieldCheck size={48} className="mx-auto text-[#ff8c00] mb-4 opacity-50" />
          <div className="text-[#ff8c00] font-semibold text-sm mb-1">No security issues found!</div>
          <div className="text-[#737373] text-[10px]">Your code passed all security checks</div>
        </div>
      ) : (
        <div>
          {/* Summary Badges */}
          <div className="flex gap-2 mb-4">
            {criticalCount > 0 && (
              <div className="px-2 py-1 bg-red-600/15 border border-red-600/30 text-red-500 rounded text-[10px] font-bold animate-pulse">
                {criticalCount} Critical
              </div>
            )}
            {highCount > 0 && (
              <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[10px] font-bold">
                {highCount} High
              </div>
            )}
            {mediumCount > 0 && (
              <div className="px-2 py-1 bg-[#ff6b00]/10 border border-[#ff6b00]/20 text-[#ff6b00] rounded text-[10px] font-bold">
                {mediumCount} Medium
              </div>
            )}
            {lowCount > 0 && (
              <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded text-[10px] font-bold">
                {lowCount} Low
              </div>
            )}
          </div>

          {/* Issues List */}
          <div className="space-y-3">
            {analysisData.securityIssues.map((issue, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border cursor-pointer transition hover:brightness-110 bg-[#0a0a0a] ${
                  issue.severity === "critical"
                    ? "border-red-600/50 bg-red-950/5"
                    : issue.severity === "high"
                      ? "border-red-500/30"
                      : issue.severity === "medium"
                        ? "border-[#ff6b00]/30"
                        : "border-blue-500/30"
                }`}
                onClick={() => setDrillDown({ type: "security", data: issue })}
                draggable
                onDragStart={(e) => {
                  const payload: DraggedContextNode = {
                    id: `security-${i}-${issue.title}`,
                    type: "SECURITY_ISSUE",
                    name: issue.title,
                    path: issue.file,
                    source: "RIGHT_PANEL",
                    metadata: { severity: issue.severity, desc: issue.desc, code: issue.code || "" },
                  };
                  e.dataTransfer.setData("application/repolens-node", JSON.stringify(payload));
                  e.dataTransfer.effectAllowed = "copy";
                  useDragStore.getState().startDrag(payload);
                }}
                onDragEnd={() => useDragStore.getState().stopDrag()}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      issue.severity === "critical"
                        ? "bg-red-600 animate-pulse"
                        : issue.severity === "high"
                          ? "bg-red-500"
                          : issue.severity === "medium"
                            ? "bg-[#ff6b00]"
                            : "bg-blue-500"
                    }`}
                  />
                  <span className="font-semibold text-xs text-[#e5e5e5]">{issue.title}</span>
                </div>
                <div className="text-[10px] text-[#737373] leading-relaxed line-clamp-3 mb-2">
                  {issue.desc}
                </div>
                {issue.code && (
                  <div className="mt-2 p-1.5 bg-[#000000] border border-[#1a1a1a] rounded text-[8px] font-mono text-[#737373] overflow-hidden whitespace-pre truncate">
                    {issue.code}
                  </div>
                )}
                <div className="text-[9px] text-[#ff6b00] mt-2.5 font-medium">
                  Click for details →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
