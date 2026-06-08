"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface AnalysisProgressProps {
  progress: number;
  message: string;
  isVisible: boolean;
}

/**
 * Analysis Progress Indicator
 *
 * Shows progress when analysis is running in Web Worker.
 * Displays progress bar and current stage message.
 */
export default function AnalysisProgress({ progress, message, isVisible }: AnalysisProgressProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md">
      <div className="bg-[#050505] border border-[#1a1a1a] rounded-2xl p-8 w-full max-w-md mx-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#ff6b00]/5 blur-2xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Loader2 className="animate-spin text-[#ff6b00]" size={22} />
          <h3 className="text-white font-bold text-lg tracking-tight">Analyzing Repository</h3>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-2 bg-[#000000] rounded-full overflow-hidden border border-[#1a1a1a]">
            <div
              className="h-full bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Progress Text */}
        <div className="flex items-center justify-between text-xs font-mono font-medium tracking-wide">
          <span className="text-[#737373]">{message}</span>
          <span className="text-[#ff6b00] font-bold">{progress}%</span>
        </div>

        {/* Stage Indicators */}
        <div className="mt-6 grid grid-cols-5 gap-2">
          {[
            { label: "Graph", threshold: 20 },
            { label: "Deps", threshold: 40 },
            { label: "Patterns", threshold: 60 },
            { label: "Quality", threshold: 80 },
            { label: "Final", threshold: 100 },
          ].map((stage, idx) => {
            const isCompleted = progress >= stage.threshold;
            const isActive = !isCompleted && progress >= stage.threshold - 20;

            return (
              <div key={idx} className="text-center">
                <div
                  className={`h-1.5 rounded-full mb-2 transition-all duration-300 ${
                    isCompleted
                      ? "bg-[#ff6b00]"
                      : isActive
                        ? "bg-[#ff8c00] animate-pulse"
                        : "bg-[#0a0a0a] border border-[#1a1a1a]"
                  }`}
                />
                <span
                  className={`text-[10px] font-mono tracking-tight font-medium ${
                    isCompleted
                      ? "text-[#ff6b00] font-bold"
                      : isActive
                        ? "text-[#ff8c00]"
                        : "text-[#737373]"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Info Text */}
        <p className="mt-6 text-xs text-[#737373] text-center leading-relaxed font-sans">
          Large repository detected. Using Web Worker for optimal performance.
        </p>
      </div>
    </div>
  );
}
