"use client";

import React, { useState } from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { X, Ban, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function ExcludePatternsModal() {
  const { showExcludeModal, setShowExcludeModal, folderFilter, setFolderFilter, excludePatterns, setExcludePatterns, triggerAnalysis } = useCodeflow();

  if (!showExcludeModal) return null;

  const handleSave = () => {
    toast.success("Filters applied!");
    triggerAnalysis();
    setShowExcludeModal(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-4 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-2 text-[#c9d1d9]">
            <Ban className="w-5 h-5 text-[#ff9f43]" />
            <h2 className="text-lg font-bold">Exclude Patterns</h2>
          </div>
          <button 
            className="text-[#8b949e] hover:text-[#c9d1d9] transition"
            onClick={() => setShowExcludeModal(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div>
            <label className="text-sm font-bold text-[#c9d1d9] block mb-1">Global Excludes</label>
            <p className="text-xs text-[#8b949e] mb-2">Paths matching these patterns will be ignored during analysis. One pattern per line.</p>
            <textarea 
              className="w-full bg-[#010409] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none custom-scrollbar font-mono h-32"
              value={excludePatterns}
              onChange={(e) => setExcludePatterns(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-[#c9d1d9] block mb-1">Folder Focus Filter</label>
            <p className="text-xs text-[#8b949e] mb-2">Only show files inside this specific folder prefix.</p>
            <input 
              type="text"
              placeholder="e.g. src/components"
              className="w-full bg-[#010409] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none font-mono"
              value={folderFilter || ""}
              onChange={(e) => setFolderFilter(e.target.value || null)}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button 
              className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md transition text-[#c9d1d9] font-medium text-sm"
              onClick={() => setShowExcludeModal(false)}
            >
              Cancel
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] rounded-md font-bold text-sm text-white transition border border-[rgba(240,246,252,0.1)]"
              onClick={handleSave}
            >
              <Save className="w-4 h-4" /> Save Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
