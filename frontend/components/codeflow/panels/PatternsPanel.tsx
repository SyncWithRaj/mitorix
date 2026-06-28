"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { Puzzle, Sparkles } from "lucide-react";
import { useDragStore } from "../../../lib/dragStore";
import type { DraggedContextNode } from "../../../lib/dragdrop.types";

// Helper to render icon by name
const IconByName = ({
  name,
  size = 16,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) => {
  return <Puzzle size={size} className={className} />;
};

export default function PatternsPanel() {
  const { analysisData, setDrillDown } = useCodeflow();

  if (!analysisData) return null;

  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold text-[#e5e5e5] mb-4">
        <Puzzle size={16} className="text-[#ff6b00]" />
        Design Patterns & Anti-Patterns
      </div>

      {analysisData.patterns.length === 0 ? (
        <div className="text-center py-10 px-4 animate-fadeIn">
          <Sparkles size={48} className="mx-auto text-[#1a1a1a] mb-4 opacity-50" />
          <div className="text-[#737373] font-semibold text-sm mb-1">No patterns detected</div>
          <div className="text-[#737373] text-[10px] opacity-70">
            Patterns are detected based on code structure
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {analysisData.patterns.map((p, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border cursor-pointer transition hover:brightness-110 bg-[#0a0a0a] ${
                p.isAnti ? "border-red-500/20" : "border-[#ff6b00]/20"
              }`}
              onClick={() => setDrillDown({ type: "pattern", data: p })}
              draggable
              onDragStart={(e) => {
                const payload: DraggedContextNode = {
                  id: `pattern-${i}-${p.name}`,
                  type: "PATTERN",
                  name: p.name,
                  source: "RIGHT_PANEL",
                  metadata: { isAnti: p.isAnti, desc: p.desc, fileCount: p.files?.length || 0 },
                };
                e.dataTransfer.setData("application/mitorix-node", JSON.stringify(payload));
                e.dataTransfer.effectAllowed = "copy";
                useDragStore.getState().startDrag(payload);
              }}
              onDragEnd={() => useDragStore.getState().stopDrag()}
            >
              <div className="flex items-center gap-2 mb-2">
                <IconByName
                  name={p.icon}
                  size={14}
                  className={p.isAnti ? "text-red-400" : "text-[#ff6b00]"}
                />
                <span className="font-semibold text-xs text-[#e5e5e5]">{p.name}</span>
                {p.isAnti && (
                  <span className="px-1.5 py-0.5 ml-auto bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[8px] font-bold uppercase">
                    Anti-pattern
                  </span>
                )}
              </div>
              <div className="text-[10px] text-[#737373] leading-relaxed line-clamp-3">
                {p.desc}
              </div>
              <div className="text-[9px] text-[#ff6b00] mt-2.5 font-medium">
                Click for details ({p.files.length} files) →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
