"use client";

import React, { useEffect, useState } from "react";
import { useDragStore } from "@/lib/dragStore";
import { entityIcons } from "@/lib/dragdrop.types";

export default function DragGhost() {
  const { isDragging, draggedItem } = useDragStore();
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent | PointerEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("pointermove", handleMouseMove, true);
    window.addEventListener("mousemove", handleMouseMove, true);
    return () => {
      window.removeEventListener("pointermove", handleMouseMove, true);
      window.removeEventListener("mousemove", handleMouseMove, true);
    };
  }, [isDragging]);

  // The user requested to remove the name tag tooltip while holding a node
  return null;
}
