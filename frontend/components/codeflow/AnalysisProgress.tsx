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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="animate-spin text-[#58a6ff]" size={24} />
          <h3 className="text-[#c9d1d9] font-bold text-lg">Analyzing Repository</h3>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#238636] to-[#2ea043] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Progress Text */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#8b949e]">{message}</span>
          <span className="text-[#c9d1d9] font-mono font-bold">{progress}%</span>
        </div>

        {/* Stage Indicators */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          {[
            { label: 'Graph', threshold: 20 },
            { label: 'Deps', threshold: 40 },
            { label: 'Patterns', threshold: 60 },
            { label: 'Quality', threshold: 80 },
            { label: 'Final', threshold: 100 },
          ].map((stage, idx) => (
            <div key={idx} className="text-center">
              <div
                className={`h-1 rounded-full mb-1 transition-colors ${
                  progress >= stage.threshold
                    ? 'bg-[#238636]'
                    : progress >= stage.threshold - 20
                    ? 'bg-[#58a6ff]'
                    : 'bg-[#21262d]'
                }`}
              />
              <span
                className={`text-[10px] font-mono ${
                  progress >= stage.threshold ? 'text-[#22c55e]' : 'text-[#8b949e]'
                }`}
              >
                {stage.label}
              </span>
            </div>
          ))}
        </div>

        {/* Info Text */}
        <p className="mt-4 text-xs text-[#8b949e] text-center">
          Large repository detected. Using Web Worker for optimal performance.
        </p>
      </div>
    </div>
  );
}
