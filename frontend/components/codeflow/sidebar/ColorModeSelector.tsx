"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { Folder, Layers, Activity } from "lucide-react";

export default function ColorModeSelector() {
  const { colorMode, setColorMode } = useCodeflow();

  const modes = [
    { id: "folder", label: "Folder", icon: Folder },
    { id: "layer", label: "Layer", icon: Layers },
    { id: "churn", label: "Churn", icon: Activity },
  ] as const;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Color By</div>
      <div className="flex bg-[#000000] border border-[#1a1a1a] rounded-lg p-1">
        {modes.map((mode) => {
          const active = colorMode === mode.id;
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => setColorMode(mode.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                active
                  ? "bg-[#0a0a0a] text-white shadow-sm border border-[#ff6b00]/30"
                  : "text-[#737373] hover:text-[#e5e5e5] hover:bg-[rgba(255,255,255,0.02)] border border-transparent"
              }`}
            >
              <Icon size={14} className={active ? "text-[#ff6b00]" : ""} />
              {mode.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
