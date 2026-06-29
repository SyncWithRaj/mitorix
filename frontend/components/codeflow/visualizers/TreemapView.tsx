"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useCodeflow } from "../../../context/CodeflowContext";
import { COLORS } from "../../../lib/codeflow.constants";

export default function TreemapView() {
  const {
    analysisData,
    folderFilter,
    colorMode,
    selectFile,
    selectedFile,
    blastRadius,
    filteredFiles,
  } = useCodeflow();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!analysisData || !containerRef.current) return;

    const container = d3.select(containerRef.current);
    container.selectAll("*").remove();

    const w = containerRef.current.clientWidth || 800;
    const h = containerRef.current.clientHeight || 600;

    const svg = container.append("svg").attr("width", w).attr("height", h).style("cursor", "grab");

    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (e) => {
        g.attr("transform", e.transform);
        svg.style("cursor", e.transform.k > 1 ? "grab" : "default");
      });

    svg.call(zoom);

    const hier: any = { name: "root", children: [] };
    const folderMap: Record<string, any> = {};

    const activeFiles = folderFilter
      ? filteredFiles.filter(
          (f) => f.folder === folderFilter || f.folder.startsWith(folderFilter + "/")
        )
      : filteredFiles;

    activeFiles.forEach((f) => {
      const folder = f.folder || "root";
      if (!folderMap[folder]) folderMap[folder] = { name: folder, children: [] };
      folderMap[folder].children.push({
        name: f.name,
        value: f.lines || 1,
        path: f.path,
        layer: f.layer,
        fns: f.functions?.length || 0,
        folder,
      });
    });

    hier.children = Object.values(folderMap);

    const root = d3
      .hierarchy(hier)
      .sum((d: any) => d.value || 0)
      .sort((a: any, b: any) => b.value - a.value);

    d3
      .treemap()
      .size([w - 20, h - 20])
      .padding(3)
      .round(true)(root);

    const cells = g
      .selectAll("g.treemap-cell")
      .data(root.leaves())
      .join("g")
      .attr("class", "treemap-cell")
      .attr("transform", (d: any) => `translate(${d.x0},${d.y0})`);

    cells
      .append("rect")
      .attr("width", (d: any) => Math.max(0, d.x1 - d.x0))
      .attr("height", (d: any) => Math.max(0, d.y1 - d.y0))
      .attr("fill", (d: any) => {
        const folderIdx = analysisData.folders.indexOf(d.parent?.data.name) || 0;
        return COLORS[folderIdx % COLORS.length] || COLORS[0];
      })
      .attr("opacity", 0.85)
      .attr("rx", 3)
      .attr("stroke", "#000000")
      .attr("stroke-width", 1)
      .style("cursor", "pointer");

    cells
      .filter((d: any) => d.x1 - d.x0 > 45 && d.y1 - d.y0 > 22)
      .append("text")
      .attr("x", 4)
      .attr("y", 14)
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.5)")
      .style("pointer-events", "none")
      .text((d: any) => {
        const n = d.data.name.replace(/\.[^.]+$/, "");
        const maxLen = Math.floor((d.x1 - d.x0 - 8) / 6);
        return n.length > maxLen ? n.slice(0, Math.max(0, maxLen - 1)) + "…" : n;
      });

    const tooltip = container
      .append("div")
      .attr(
        "class",
        "absolute hidden bg-[#050505] border border-[#1a1a1a] rounded-lg p-3 text-xs shadow-2xl z-50 text-[#e5e5e5]"
      )
      .style("pointer-events", "none");

    cells
      .on("mouseenter", function (e, d: any) {
        tooltip
          .html(
            `
        <div class="font-bold text-[#ff6b00] mb-2 border-b border-[#1a1a1a] pb-1 font-mono">${d.data.name}</div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span class="text-[#737373]">Lines</span><span class="text-white font-mono text-right">${d.data.value}</span>
          <span class="text-[#737373]">Functions</span><span class="text-white font-mono text-right">${d.data.fns}</span>
          <span class="text-[#737373]">Folder</span><span class="text-white text-right truncate max-w-[120px] font-mono">${d.data.folder}</span>
        </div>
      `
          )
          .style("display", "block")
          .style("left", `${e.offsetX + 15}px`)
          .style("top", `${e.offsetY + 15}px`);

        d3.select(this)
          .select("rect")
          .transition()
          .duration(150)
          .attr("opacity", 1)
          .attr("stroke", "#ff6b00")
          .attr("stroke-width", 2);
      })
      .on("mousemove", (e) => {
        tooltip.style("left", `${e.offsetX + 15}px`).style("top", `${e.offsetY + 15}px`);
      })
      .on("mouseleave", function (e, d: any) {
        tooltip.style("display", "none");
        const isSelected = d.data.path === selectedFile;
        const isAffected = blastRadius && blastRadius.affected.includes(d.data.path);

        d3.select(this)
          .select("rect")
          .transition()
          .duration(150)
          .attr("opacity", isSelected ? 1 : isAffected ? 0.95 : 0.85)
          .attr("stroke", isSelected ? "#ff5f5f" : isAffected ? "#ff6b00" : "#000000")
          .attr("stroke-width", isSelected || isAffected ? 2 : 1);
      })
      .on("click", (e, d: any) => {
        e.stopPropagation();
        if (d.data.path) selectFile(d.data.path);
      });

    // Custom toolbar events
    const handleZoomIn = () => svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    const handleZoomOut = () =>
      svg
        .transition()
        .duration(300)
        .call(zoom.scaleBy, 1 / 1.3);
    const handleResetZoom = () => svg.transition().duration(300).call(zoom.scaleTo, 1);
    const handleFitView = () => svg.transition().duration(300).call(zoom.scaleTo, 1);

    window.addEventListener("codeflow:zoomIn", handleZoomIn);
    window.addEventListener("codeflow:zoomOut", handleZoomOut);
    window.addEventListener("codeflow:resetZoom", handleResetZoom);
    window.addEventListener("codeflow:fitView", handleFitView);

    return () => {
      window.removeEventListener("codeflow:zoomIn", handleZoomIn);
      window.removeEventListener("codeflow:zoomOut", handleZoomOut);
      window.removeEventListener("codeflow:resetZoom", handleResetZoom);
      window.removeEventListener("codeflow:fitView", handleFitView);
    };
  }, [analysisData, folderFilter, colorMode, selectedFile, blastRadius, selectFile, filteredFiles]);

  return <div ref={containerRef} className="w-full h-full relative bg-transparent" />;
}
