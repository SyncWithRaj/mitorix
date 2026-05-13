"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { Sparkles, Copy, Lightbulb } from "lucide-react";
import { useDragStore } from "../../../lib/dragStore";
import type { DraggedContextNode } from "../../../lib/dragdrop.types";

export default function SuggestionsPanel() {
  const { analysisData, setDrillDown } = useCodeflow();

  if (!analysisData) return null;

  const suggestions = analysisData.suggestions || [];
  const duplicates = analysisData.duplicates || [];

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-l-red-500 bg-red-500/[0.06]";
      case "high":
        return "border-l-orange-500 bg-orange-500/[0.06]";
      default:
        return "border-l-[#00ff9d] bg-[#00ff9d]/[0.06]";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold text-[#c9d1d9] mb-3">
        <Lightbulb size={16} />
        Actionable Suggestions
      </div>

      {suggestions.length === 0 && duplicates.length === 0 ? (
        <div className="text-center py-10 px-4">
          <Sparkles size={48} className="mx-auto text-[#22c55e] mb-4 opacity-50" />
          <div className="text-[#22c55e] font-semibold text-sm mb-1">No issues to address!</div>
          <div className="text-[#8b949e] text-[10px]">Your codebase looks healthy</div>
        </div>
      ) : (
        <div>
          <div className="text-[9px] text-[#8b949e] mb-3">
            Prioritized recommendations based on your codebase analysis
          </div>

          {/* Suggestion Cards */}
          <div className="space-y-2.5">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border-l-2 border border-[#30363d]/50 ${getPriorityStyle(s.priority)}`}
                draggable
                onDragStart={(e) => {
                  const payload: DraggedContextNode = {
                    id: `suggestion-${i}-${s.title}`,
                    type: "SUGGESTION",
                    name: s.title,
                    source: "RIGHT_PANEL",
                    metadata: { priority: s.priority, desc: s.desc, action: s.action, impact: s.impact },
                  };
                  e.dataTransfer.setData("application/repolens-node", JSON.stringify(payload));
                  e.dataTransfer.effectAllowed = "copy";
                  useDragStore.getState().startDrag(payload);
                }}
                onDragEnd={() => useDragStore.getState().stopDrag()}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={14} className="text-[#c9d1d9] shrink-0" />
                  <span className="font-semibold text-[11px] text-[#c9d1d9] flex-1 truncate">
                    {s.title}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border shrink-0 ${getPriorityBadge(s.priority)}`}
                  >
                    {s.priority}
                  </span>
                </div>
                <div className="text-[10px] text-[#8b949e] mb-2 leading-relaxed">{s.desc}</div>
                <div className="text-[9px] bg-[#161b22] p-1.5 rounded mb-1.5 border border-[#30363d]/30">
                  <span className="text-[#8b949e]">Action: </span>
                  <span className="text-[#c9d1d9]">{s.action}</span>
                </div>
                <div className="text-[9px] text-[#22c55e] flex items-center gap-1">
                  <Sparkles size={10} />
                  {s.impact}
                </div>
              </div>
            ))}
          </div>

          {/* Duplicates Section */}
          {duplicates.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#c9d1d9] mb-3">
                <Copy size={14} />
                Duplicate Functions ({duplicates.length})
              </div>
              <div className="space-y-1.5">
                {duplicates.slice(0, 10).map((d, i) => (
                  <div
                    key={i}
                    className="bg-[#0d1117] border border-[#30363d]/50 rounded-md p-2.5 text-[10px] cursor-pointer hover:bg-[#161b22] transition"
                    onClick={() => setDrillDown({ type: "duplicate", data: d })}
                    draggable
                    onDragStart={(e) => {
                      const payload: DraggedContextNode = {
                        id: `duplicate-${i}-${d.name}`,
                        type: "DUPLICATE",
                        name: d.name,
                        source: "RIGHT_PANEL",
                        metadata: { duplicateType: d.type, fileCount: d.files?.length || 0 },
                      };
                      e.dataTransfer.setData("application/repolens-node", JSON.stringify(payload));
                      e.dataTransfer.effectAllowed = "copy";
                      useDragStore.getState().startDrag(payload);
                    }}
                    onDragEnd={() => useDragStore.getState().stopDrag()}
                  >
                    <div
                      className={`font-semibold ${d.type === "code" ? "text-[#a855f7]" : "text-[#ff9f43]"}`}
                    >
                      {d.type === "code" ? "Similar Code" : "Same Name"}: {d.name}
                    </div>
                    <div className="text-[9px] text-[#58a6ff] mt-1 font-medium">
                      Click for details ({d.files.length} locations) →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
