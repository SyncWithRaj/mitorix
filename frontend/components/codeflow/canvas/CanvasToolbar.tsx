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
        <div className="flex flex-col bg-[rgba(10,10,10,0.85)] backdrop-blur-md border border-[#1a1a1a] rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="p-2 text-[#737373] hover:text-[#e5e5e5] hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a]"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-[#737373] hover:text-[#e5e5e5] hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a]"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 text-[#737373] hover:text-[#e5e5e5] hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a]"
            title="Reset Zoom"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handleFitView}
            className="p-2 text-[#737373] hover:text-[#e5e5e5] hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a]"
            title="Fit View"
          >
            <Maximize size={16} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 transition-colors ${showSettings ? "bg-[#ff6b00]/10 text-[#ff6b00]" : "text-[#737373] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]"}`}
            title="Graph Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="absolute bottom-6 right-20 z-20 w-64 bg-[rgba(5,5,5,0.95)] backdrop-blur-md border border-[#1a1a1a] rounded-lg shadow-xl p-4 flex flex-col gap-4 animate-fadeIn">
          {/* Layout Mode */}
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
              Layout
            </div>
            <div className="flex flex-wrap gap-1">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setGraphConfig({ ...graphConfig, viewMode: mode.id })}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    graphConfig.viewMode === mode.id
                      ? "bg-[#0a0a0a] text-white border border-[#ff6b00]/30 shadow-sm"
                      : "text-[#737373] hover:text-white border border-transparent"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Spacing Controls */}
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
              Spacing
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#737373] w-12">Spread</span>
              <input
                type="range"
                min="50"
                max="500"
                value={graphConfig.spacing}
                onChange={(e) =>
                  setGraphConfig({ ...graphConfig, spacing: parseInt(e.target.value) })
                }
                className="flex-1 accent-[#ff6b00] cursor-pointer"
              />
              <span className="text-xs text-white font-mono w-8 text-right">
                {graphConfig.spacing}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#737373] w-12">Links</span>
              <input
                type="range"
                min="30"
                max="200"
                value={graphConfig.linkDist}
                onChange={(e) =>
                  setGraphConfig({ ...graphConfig, linkDist: parseInt(e.target.value) })
                }
                className="flex-1 accent-[#ff6b00] cursor-pointer"
              />
              <span className="text-xs text-white font-mono w-8 text-right">
                {graphConfig.linkDist}
              </span>
            </div>
          </div>

          {/* Display Toggles */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#1a1a1a]">
            <div className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
              Display
            </div>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={graphConfig.showLabels}
                onChange={(e) => setGraphConfig({ ...graphConfig, showLabels: e.target.checked })}
                className="accent-[#ff6b00] cursor-pointer"
              />
              <span className="text-xs text-[#e5e5e5] group-hover:text-white transition-colors">
                Show labels
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={graphConfig.curvedLinks}
                onChange={(e) => setGraphConfig({ ...graphConfig, curvedLinks: e.target.checked })}
                className="accent-[#ff6b00] cursor-pointer"
              />
              <span className="text-xs text-[#e5e5e5] group-hover:text-white transition-colors">
                Curved links
              </span>
            </label>
          </div>
        </div>
      )}
    </>
  );
}
