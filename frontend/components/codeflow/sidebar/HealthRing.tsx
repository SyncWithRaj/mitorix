"use client";

import React from "react";

interface HealthRingProps {
  score: number;
  grade: string;
}

export default function HealthRing({ score, grade }: HealthRingProps) {
  const r = 28;
  const c = Math.PI * (r * 2);
  const dash = ((100 - score) / 100) * c;
  
  const getColor = () => {
    if (score >= 80) return "#2ea043"; // green
    if (score >= 60) return "#d29922"; // orange
    return "#f85149"; // red
  };
  
  const color = getColor();

  return (
    <div className="flex items-center gap-4">
      <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
        <circle 
          cx="32" cy="32" r={r} 
          fill="none" 
          stroke="var(--color-gh-border)" 
          strokeWidth="6" 
        />
        <circle 
          cx="32" cy="32" r={r} 
          fill="none" 
          stroke={color} 
          strokeWidth="6" 
          strokeDasharray={c} 
          strokeDashoffset={dash} 
          strokeLinecap="round" 
          transform="rotate(-90 32 32)" 
          className="transition-all duration-1000 ease-out"
        />
        <text 
          x="32" y="32" 
          textAnchor="middle" 
          dy=".3em" 
          fill={color}
          className="text-2xl font-bold font-mono"
        >
          {grade}
        </text>
      </svg>
      <div className="flex flex-col">
        <div className="text-xl font-bold" style={{ color }}>
          {score}<span className="text-gh-text-muted text-sm font-normal">/100</span>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-gh-text-muted font-bold">
          Health Score
        </div>
      </div>
    </div>
  );
}
