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
      <div className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">
        Color By
      </div>
      <div className="flex bg-[#010409] border border-[#30363d] rounded-lg p-1">
        {modes.map((mode) => {
          const active = colorMode === mode.id;
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => setColorMode(mode.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                active 
                  ? "bg-[#21262d] text-white shadow-sm border border-[#30363d]" 
                  : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[rgba(255,255,255,0.05)] border border-transparent"
              }`}
            >
              <Icon size={14} className={active ? "text-[#58a6ff]" : ""} />
              {mode.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
