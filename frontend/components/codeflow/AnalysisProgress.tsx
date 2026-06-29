"use client";

import React from "react";
import { Hexagon, Cpu, Network, Zap, CheckCircle2, Loader2 } from "lucide-react";

interface AnalysisProgressProps {
  progress: number;
  message: string;
  isVisible: boolean;
}

export default function AnalysisProgress({ progress, message, isVisible }: AnalysisProgressProps) {
  if (!isVisible) return null;

  const stages = [
    { label: "AST Graph", threshold: 20, icon: Network },
    { label: "Dependencies", threshold: 40, icon: Hexagon },
    { label: "Patterns", threshold: 60, icon: Cpu },
    { label: "Quality", threshold: 80, icon: Zap },
    { label: "Finalizing", threshold: 100, icon: CheckCircle2 },
  ];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-lg mx-4 bg-black/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {/* Top Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[#ff6b00]/10 border border-[#ff6b00]/20 flex items-center justify-center mb-6 shadow-inner relative">
            <Loader2 className="absolute text-[#ff6b00]/20 w-10 h-10 animate-spin" />
            <Network className="text-[#ff6b00] w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Synthesizing Codebase</h3>
          <p className="text-[#a1a1aa] text-sm mt-2 font-medium">
            {message || "Processing repository data..."}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-2 bg-[#141414] rounded-full overflow-hidden border border-[#222222] mb-10">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#ff6b00] via-[#ff8c00] to-[#ffa800] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stages Timeline */}
        <div className="flex justify-between relative mt-2 mb-2 px-2">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-4 right-4 h-[1px] bg-[#27272a] -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-4 h-[1px] bg-[#ff6b00]/50 -translate-y-1/2 z-0 transition-all duration-700" 
            style={{ width: `calc(${progress}% - 2rem)` }} 
          />

          {stages.map((stage, idx) => {
            const isCompleted = progress >= stage.threshold;
            const isActive = !isCompleted && progress >= stage.threshold - 20;
            const Icon = stage.icon;

            return (
              <div key={idx} className="relative z-10 flex flex-col items-center gap-2 group">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 border ${
                  isCompleted 
                    ? "bg-[#ff6b00] border-[#ff8c00] text-black scale-100" 
                    : isActive 
                      ? "bg-[#18181b] border-[#ff6b00] text-[#ff6b00] scale-110 shadow-[0_0_15px_rgba(255,107,0,0.2)]" 
                      : "bg-[#09090b] border-[#27272a] text-[#52525b] scale-90"
                }`}>
                  <Icon size={14} className={isActive ? "animate-pulse" : ""} />
                </div>
                <span className={`absolute -bottom-6 whitespace-nowrap text-[10px] font-semibold tracking-wide transition-colors duration-300 ${
                  isCompleted ? "text-[#e4e4e7]" : isActive ? "text-[#ff6b00]" : "text-[#52525b]"
                }`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer Stats */}
        <div className="mt-12 flex justify-between items-end">
           <div className="flex flex-col">
             <span className="text-xs text-[#71717a] font-medium mb-1">Status</span>
             <span className="text-sm text-[#e4e4e7] font-semibold flex items-center gap-2">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff6b00] opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff6b00]"></span>
               </span>
               Deep AST Parsing Active
             </span>
           </div>
           <div className="text-right">
             <span className="text-xs text-[#71717a] font-medium block mb-1">Overall Progress</span>
             <span className="text-2xl font-bold text-white leading-none">
               {progress.toFixed(0)}<span className="text-[#ff6b00]">%</span>
             </span>
           </div>
        </div>
      </div>
    </div>
  );
}
