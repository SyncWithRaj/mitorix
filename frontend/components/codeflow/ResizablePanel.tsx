"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";

interface ResizablePanelProps {
  children: ReactNode;
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  side: "left" | "right";
  className?: string;
  onWidthChange?: (width: number) => void;
}

export default function ResizablePanel({
  children,
  initialWidth,
  minWidth,
  maxWidth,
  side,
  className = "",
  onWidthChange,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onWidthChange?.(width);
  }, [width, onWidthChange]);

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
      className={`relative flex-shrink-0 flex flex-col ${className}`}
    >
      {children}

      {/* Resize Handle */}
      <div
        className={`absolute top-0 bottom-0 w-1.5 cursor-col-resize z-50 flex items-center justify-center group ${
          side === "left" ? "-right-1.5" : "-left-1.5"
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
      >
        {/* Visual Pill */}
        <div className="w-1 h-12 rounded-full bg-[#ff6b00]/60 group-hover:bg-[#ff6b00] transition-colors shadow-sm" />
      </div>
    </div>
  );
}
