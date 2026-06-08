"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { Search, Sparkles } from "lucide-react";
import { useDragStore } from "../../../lib/dragStore";
import type { DraggedContextNode } from "../../../lib/dragdrop.types";

export default function IssuesPanel() {
  const { analysisData, setDrillDown, setShowUnusedModal } = useCodeflow();

  if (!analysisData) return null;

  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold text-[#e5e5e5] mb-4">
        <Search size={16} className="text-[#ff6b00]" />
        Architecture Issues ({analysisData.issues.length})
      </div>

      {analysisData.issues.length === 0 ? (
        <div className="text-center py-10 px-4 animate-fadeIn">
          <Sparkles size={48} className="mx-auto text-[#1a1a1a] mb-4 opacity-50" />
          <div className="text-[#ff8c00] font-semibold text-sm mb-1">No issues detected!</div>
          <div className="text-[#737373] text-[10px]">Your architecture is looking clean.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {analysisData.issues.map((issue, i) => {
            const isUnused = issue.title.toLowerCase().includes("unused functions");
            return (
              <div
                key={i}
                className={`p-3 rounded-lg border cursor-pointer transition hover:brightness-110 bg-[#0a0a0a] ${
                  issue.type === "critical"
                    ? "border-red-500/20"
                    : issue.type === "warning"
                      ? "border-[#ff6b00]/20"
                      : "border-blue-500/20"
                }`}
                onClick={() => {
                  if (isUnused) {
                    setShowUnusedModal(true);
                  } else {
                    setDrillDown({ type: "issue", data: issue });
                  }
                }}
                draggable
                onDragStart={(e) => {
                  const payload: DraggedContextNode = {
                    id: `issue-${i}-${issue.title}`,
                    type: "ARCHITECTURE_ISSUE",
                    name: issue.title,
                    source: "RIGHT_PANEL",
                    metadata: { issueType: issue.type, desc: issue.desc, itemCount: issue.items?.length || 0 },
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
                      issue.type === "critical"
                        ? "bg-red-500 animate-pulse"
                        : issue.type === "warning"
                          ? "bg-[#ff6b00]"
                          : "bg-blue-500"
                    }`}
                  />
                  <span className="font-semibold text-xs text-[#e5e5e5]">{issue.title}</span>
                </div>
                <div className="text-[10px] text-[#737373] leading-relaxed line-clamp-3">
                  {issue.desc}
                </div>
                <div className="text-[9px] text-[#ff6b00] mt-2.5 font-medium">
                  Click for details ({issue.items ? issue.items.length : 0} items) →
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
