"use client";

import React, { useState } from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { ZoomIn, ZoomOut, RotateCcw, Maximize, Settings } from "lucide-react";
import { ViewMode } from "../../../lib/codeflow.types";

export default function CanvasToolbar() {
  const { graphConfig, setGraphConfig } = useCodeflow();
  const [showSettings, setShowSettings] = useState(false);

  // Dispatch custom events for the D3 graphs to listen to
  const handleZoomIn = () => window.dispatchEvent(new CustomEvent("codeflow:zoomIn"));
  const handleZoomOut = () => window.dispatchEvent(new CustomEvent("codeflow:zoomOut"));
  const handleResetZoom = () => window.dispatchEvent(new CustomEvent("codeflow:resetZoom"));
  const handleFitView = () => window.dispatchEvent(new CustomEvent("codeflow:fitView"));

  const viewModes: { id: ViewMode; label: string }[] = [
    { id: "force", label: "Force" },
    { id: "radial", label: "Radial" },
    { id: "hierarchical", label: "Layers" },
    { id: "grid", label: "Grid" },
    { id: "metro", label: "Metro" },
  ];

  if (graphConfig.vizType !== "force") {
    // Only show toolbar for the main graph for now, or you could extend it
    return null;
  }

  return (
    <>
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-1.5">
        <div className="flex flex-col bg-[rgba(22,27,34,0.85)] backdrop-blur-md border border-[#30363d] rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="p-2 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] transition-colors border-b border-[#30363d]"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] transition-colors border-b border-[#30363d]"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] transition-colors border-b border-[#30363d]"
            title="Reset Zoom"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handleFitView}
            className="p-2 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] transition-colors border-b border-[#30363d]"
            title="Fit View"
          >
            <Maximize size={16} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 transition-colors ${showSettings ? "bg-[#58a6ff]/10 text-[#58a6ff]" : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d]"}`}
            title="Graph Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="absolute bottom-6 right-20 z-20 w-64 bg-[rgba(22,27,34,0.95)] backdrop-blur-md border border-[#30363d] rounded-lg shadow-xl p-4 flex flex-col gap-4">
          {/* Layout Mode */}
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">
              Layout
            </div>
            <div className="flex flex-wrap gap-1">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setGraphConfig({ ...graphConfig, viewMode: mode.id })}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    graphConfig.viewMode === mode.id
                      ? "bg-[#21262d] text-white border border-[#30363d]"
                      : "text-[#8b949e] hover:text-white border border-transparent"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Spacing Controls */}
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">
              Spacing
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#8b949e] w-12">Spread</span>
              <input
                type="range"
                min="50"
                max="500"
                value={graphConfig.spacing}
                onChange={(e) =>
                  setGraphConfig({ ...graphConfig, spacing: parseInt(e.target.value) })
                }
                className="flex-1 accent-[#58a6ff]"
              />
              <span className="text-xs text-white font-mono w-8 text-right">
                {graphConfig.spacing}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#8b949e] w-12">Links</span>
              <input
                type="range"
                min="30"
                max="200"
                value={graphConfig.linkDist}
                onChange={(e) =>
                  setGraphConfig({ ...graphConfig, linkDist: parseInt(e.target.value) })
                }
                className="flex-1 accent-[#58a6ff]"
              />
              <span className="text-xs text-white font-mono w-8 text-right">
                {graphConfig.linkDist}
              </span>
            </div>
          </div>

          {/* Display Toggles */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#30363d]">
            <div className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">
              Display
            </div>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={graphConfig.showLabels}
                onChange={(e) => setGraphConfig({ ...graphConfig, showLabels: e.target.checked })}
                className="accent-[#58a6ff] cursor-pointer"
              />
              <span className="text-xs text-[#c9d1d9] group-hover:text-white transition-colors">
                Show labels
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={graphConfig.curvedLinks}
                onChange={(e) => setGraphConfig({ ...graphConfig, curvedLinks: e.target.checked })}
                className="accent-[#58a6ff] cursor-pointer"
              />
              <span className="text-xs text-[#c9d1d9] group-hover:text-white transition-colors">
                Curved links
              </span>
            </label>
          </div>
        </div>
      )}
    </>
  );
}
