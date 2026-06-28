"use client";

import React, { useEffect, useState } from "react";
import { Hexagon, Cpu, Network, Zap, CheckCircle2 } from "lucide-react";
import Silk from "@/components/ui/Silk";

interface AnalysisProgressProps {
  progress: number;
  message: string;
  isVisible: boolean;
}

export default function AnalysisProgress({ progress, message, isVisible }: AnalysisProgressProps) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const stages = [
    { label: "AST Graph", threshold: 20, icon: Network },
    { label: "Dependencies", threshold: 40, icon: Hexagon },
    { label: "Patterns", threshold: 60, icon: Cpu },
    { label: "Quality", threshold: 80, icon: Zap },
    { label: "Finalizing", threshold: 100, icon: CheckCircle2 },
  ];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-2xl">
      {/* Background Silk & Glow */}
      <div className="absolute inset-0 z-0 opacity-[0.25] pointer-events-none">
        <Silk color="#ff6b00" speed={4} scale={1.5} noiseIntensity={2} />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.15)_0%,transparent_50%)] pointer-events-none z-0" />
      
      <div className="w-full max-w-xl mx-4 bg-[#050505]/80 backdrop-blur-xl border border-white/10 p-1 rounded-[2rem] shadow-[0_0_50px_rgba(255,107,0,0.2)] relative overflow-hidden group z-10">
        
        {/* Animated gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ff6b00]/30 to-transparent -translate-x-[100%] animate-[shimmer_2.5s_infinite] pointer-events-none" />

        <div className="bg-[#0a0a0c] rounded-[1.8rem] p-8 relative z-10 overflow-hidden border border-white/5">
          {/* Subtle noise and grid */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Top Section */}
          <div className="flex flex-col items-center mb-10 relative">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute w-28 h-28 border border-[#ff6b00]/20 rounded-full animate-[spin_4s_linear_infinite]" />
              <div className="absolute w-20 h-20 border border-[#ffa800]/40 rounded-full animate-[spin_3s_linear_infinite_reverse] border-dashed" />
              <div className={`w-12 h-12 bg-[#ff6b00]/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,107,0,0.6)] ${pulse ? 'scale-110' : 'scale-100'} transition-transform duration-700`}>
                <Network className="text-[#ff6b00]" size={22} />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">Synthesizing Codebase</h3>
            <p className="text-[#ff6b00] font-mono text-xs mt-2 uppercase tracking-[0.2em] animate-pulse">
              {message}
            </p>
          </div>

          {/* Unique Progress Visualization */}
          <div className="relative w-full h-3 bg-black rounded-full overflow-hidden border border-white/10 mb-10 shadow-inner">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#ff6b00] via-[#ff8c00] to-[#ffa800] rounded-full transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:1rem_1rem] animate-[shimmer_1s_linear_infinite]" />
            </div>
            {/* The laser head */}
            <div 
              className="absolute top-0 h-full w-10 bg-white/50 blur-[4px] -ml-5 transition-all duration-700"
              style={{ left: `${progress}%` }}
            />
          </div>

          {/* Interactive Nodes Timeline */}
          <div className="flex justify-between relative mt-4 mb-2 px-2">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/5 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-4 h-0.5 bg-[#ff6b00]/50 -translate-y-1/2 z-0 transition-all duration-700" 
              style={{ width: `calc(${progress}% - 2rem)` }} 
            />

            {stages.map((stage, idx) => {
              const isCompleted = progress >= stage.threshold;
              const isActive = !isCompleted && progress >= stage.threshold - 20;
              const Icon = stage.icon;

              return (
                <div key={idx} className="relative z-10 flex flex-col items-center gap-3 group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 border ${
                    isCompleted 
                      ? "bg-[#ff6b00] border-[#ff8c00] shadow-[0_0_15px_rgba(255,107,0,0.4)] scale-100" 
                      : isActive 
                        ? "bg-[#2a1200] border-[#ff6b00] shadow-[0_0_20px_rgba(255,107,0,0.6)] scale-110" 
                        : "bg-black border-white/10 scale-90 opacity-50"
                  }`}>
                    <Icon size={16} className={isCompleted ? "text-white" : isActive ? "text-[#ff6b00] animate-pulse" : "text-[#555]"} />
                  </div>
                  <span className={`absolute -bottom-6 whitespace-nowrap text-[9px] font-bold font-mono tracking-wider uppercase transition-colors duration-300 ${
                    isCompleted ? "text-white" : isActive ? "text-[#ff6b00]" : "text-[#555]"
                  }`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex justify-between items-end border-t border-white/5 pt-5">
             <div className="flex flex-col">
               <span className="text-[10px] text-[#555] font-mono uppercase tracking-widest mb-1">Status</span>
               <span className="text-xs text-[#a3a3a3] font-medium flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b00] animate-ping" />
                 Deep AST Parsing Active
               </span>
             </div>
             <div className="text-right">
               <span className="text-[10px] text-[#555] font-mono uppercase tracking-widest block mb-1">Progress</span>
               <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#a3a3a3] leading-none">
                 {progress.toFixed(0)}<span className="text-[#ff6b00] text-xl">%</span>
               </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
