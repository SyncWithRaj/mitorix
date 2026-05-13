"use client";

import React, { useEffect, useState } from "react";
import { useDragStore } from "@/lib/dragStore";
import { entityIcons } from "@/lib/dragdrop.types";

export default function DragGhost() {
  const { isDragging, draggedItem } = useDragStore();
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isDragging]);

  if (!isDragging || !draggedItem) return null;

  // Only show for non-native drags (Graph/Canvas) 
  // Native drags (Explorer) already have their own browser ghost
  if (draggedItem.source !== "GRAPH_VIEW" && draggedItem.source !== "FORCE_GRAPH") return null;

  return (
    <div
      className="fixed pointer-events-none z-[9999] flex items-center gap-2 px-3 py-1.5 bg-[#1f6feb]/90 backdrop-blur-md text-white rounded-lg shadow-[0_0_20px_rgba(31,111,235,0.4)] border border-white/20 animate-in fade-in zoom-in duration-100"
      style={{
        left: coords.x + 15,
        top: coords.y + 15,
      }}
    >
      <div className="absolute inset-0 bg-[#1f6feb] blur-md -z-10 opacity-30 rounded-lg"></div>
      <span className="text-xs opacity-90">{entityIcons[draggedItem.type] || "📎"}</span>
      <span className="text-[11px] font-bold font-mono whitespace-nowrap tracking-tight">
        {draggedItem.name}
      </span>
      <div className="ml-1 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white] animate-pulse" />
    </div>
  );
}
