"use client";

import React, { useState } from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { X, Ban, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function ExcludePatternsModal() {
  const {
    showExcludeModal,
    setShowExcludeModal,
    folderFilter,
    setFolderFilter,
    excludePatterns,
    setExcludePatterns,
    triggerAnalysis,
  } = useCodeflow();

  if (!showExcludeModal) return null;

  const handleSave = () => {
    toast.success("Filters applied!");
    triggerAnalysis();
    setShowExcludeModal(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#000000] border border-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a] bg-[#050505]">
          <div className="flex items-center gap-2 text-[#e5e5e5]">
            <Ban className="w-5 h-5 text-[#ff6b00]" />
            <h2 className="text-lg font-bold">Exclude Patterns</h2>
          </div>
          <button
            className="text-[#737373] hover:text-[#e5e5e5] transition"
            onClick={() => setShowExcludeModal(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div>
            <label className="text-sm font-bold text-[#e5e5e5] block mb-1">Global Excludes</label>
            <p className="text-xs text-[#737373] mb-2">
              Paths matching these patterns will be ignored during analysis. One pattern per line.
            </p>
            <textarea
              className="w-full bg-[#050505] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-[#e5e5e5] focus:border-[#ff6b00] focus:outline-none custom-scrollbar font-mono h-32"
              value={excludePatterns}
              onChange={(e) => setExcludePatterns(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-[#e5e5e5] block mb-1">
              Folder Focus Filter
            </label>
            <p className="text-xs text-[#737373] mb-2">
              Only show files inside this specific folder prefix.
            </p>
            <input
              type="text"
              placeholder="e.g. src/components"
              className="w-full bg-[#050505] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-[#e5e5e5] focus:border-[#ff6b00] focus:outline-none font-mono"
              value={folderFilter || ""}
              onChange={(e) => setFolderFilter(e.target.value || null)}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-[#1a1a1a] rounded-md transition text-[#e5e5e5] font-medium text-sm"
              onClick={() => setShowExcludeModal(false)}
            >
              Cancel
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-[#ff6b00] hover:bg-[#ff8c00] rounded-md font-bold text-sm text-white transition border border-[rgba(240,246,252,0.1)]"
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
