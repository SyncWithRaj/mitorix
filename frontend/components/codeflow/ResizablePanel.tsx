"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";

interface ResizablePanelProps {
  children: ReactNode;
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  side: "left" | "right";
  className?: string;
}

export default function ResizablePanel({
  children,
  initialWidth,
  minWidth,
  maxWidth,
  side,
  className = "",
}: ResizablePanelProps) {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      let newWidth = width;

      if (side === "left") {
        newWidth = e.clientX - rect.left;
      } else {
        newWidth = rect.right - e.clientX;
      }

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, width, minWidth, maxWidth, side]);

  return (
    <div
      ref={panelRef}
      style={{ width: `${width}px` }}
      className={`relative flex-shrink-0 flex flex-col bg-[#0d1117] border-[#30363d] ${
        side === "left" ? "border-r" : "border-l"
      } ${className}`}
    >
      {children}

      {/* Resize Handle */}
      <div
        className={`absolute top-0 bottom-0 w-2 cursor-col-resize z-50 hover:bg-[#58a6ff]/20 transition-colors ${
          side === "left" ? "-right-1" : "-left-1"
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
      />
    </div>
  );
}
