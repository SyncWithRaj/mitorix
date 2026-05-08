"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { COLORS } from "../../../lib/codeflow.constants";

const REAL_CODE_EXTS = new Set([
  "js", "jsx", "ts", "tsx", "mjs", "cjs",
  "py", "pyw", "pyi",
  "java", "go", "rb", "php", "rs",
  "c", "cpp", "cc", "h", "hpp", "cs",
  "swift", "kt", "kts", "scala",
  "ex", "exs", "lua", "sh", "bash"
]);

export default function LanguageBar() {
  const { analysisData } = useCodeflow();

  if (!analysisData?.stats?.languages || analysisData.stats.languages.length === 0) {
    return null;
  }

  const { languages } = analysisData.stats;

  // Compute actual main programming code metrics
  const filteredLangs = languages.filter(lang => 
    REAL_CODE_EXTS.has(lang.ext.toLowerCase())
  );

  const realLoc = filteredLangs.reduce((sum, lang) => sum + lang.lines, 0);

  const realLanguages = filteredLangs.map(lang => ({
    ext: lang.ext,
    lines: lang.lines,
    pct: realLoc ? Math.round((lang.lines / realLoc) * 100) : 0
  })).sort((a, b) => b.lines - a.lines);

  return (
    <div className="flex flex-col gap-4 mt-2">
      {/* Global Languages Section */}
      <div className="flex flex-col gap-2">
        <div className="text-[9px] text-[#8b949e] font-bold uppercase tracking-wider mb-1">
          All Repo Files Ratio
        </div>
        
        {/* Language Stacked Bar */}
        <div className="h-2 w-full rounded-full flex overflow-hidden bg-[#21262d]">
          {languages.slice(0, 6).map((lang, idx) => (
            <div 
              key={lang.ext} 
              style={{ 
                width: `${lang.pct}%`, 
                backgroundColor: COLORS[idx % COLORS.length] 
              }} 
              title={`${lang.ext}: ${lang.pct}%`}
            />
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
          {languages.slice(0, 6).map((lang, idx) => (
            <div key={lang.ext} className="flex items-center gap-1.5 text-xs text-[#8b949e]">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
              />
              <span className="uppercase font-mono text-[10px]">{lang.ext} {lang.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actual Main Programming Code Section */}
      {realLanguages.length > 0 && (
        <div className="border-t border-[#30363d]/50 pt-4 flex flex-col gap-2">
          <div className="flex justify-between items-center text-[9px] text-[#8b949e] font-bold uppercase tracking-wider mb-1">
            <span>Programming Code</span>
            <span className="text-[#58a6ff] font-mono text-[10px]">{realLoc.toLocaleString()} LOC</span>
          </div>
          
          {/* Real Code Language Stacked Bar */}
          <div className="h-2 w-full rounded-full flex overflow-hidden bg-[#21262d]">
            {realLanguages.slice(0, 6).map((lang, idx) => (
              <div 
                key={lang.ext} 
                style={{ 
                  width: `${lang.pct}%`, 
                  backgroundColor: COLORS[(idx + 2) % COLORS.length] 
                }} 
                title={`${lang.ext}: ${lang.pct}%`}
              />
            ))}
          </div>
          
          {/* Real Code Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {realLanguages.slice(0, 6).map((lang, idx) => (
              <div key={lang.ext} className="flex items-center gap-1.5 text-xs text-[#8b949e]">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: COLORS[(idx + 2) % COLORS.length] }} 
                />
                <span className="uppercase font-mono text-[10px]">{lang.ext} {lang.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
