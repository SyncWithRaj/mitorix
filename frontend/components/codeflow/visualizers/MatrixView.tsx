"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useCodeflow } from "../../../context/CodeflowContext";

export default function MatrixView() {
  const { analysisData, folderFilter, selectFile, filteredFiles, filteredConnections } =
    useCodeflow();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!analysisData || !containerRef.current) return;

    const container = d3.select(containerRef.current);
    container.selectAll("*").remove();

    const w = containerRef.current.clientWidth || 800;
    const h = containerRef.current.clientHeight || 600;

    const svg = container.append("svg").attr("width", w).attr("height", h).style("cursor", "grab");

    const g = svg.append("g").attr("transform", "translate(120,100)");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (e) => {
        g.attr(
          "transform",
          `translate(${120 + e.transform.x},${100 + e.transform.y}) scale(${e.transform.k})`
        );
      });

    svg.call(zoom);

    const activeFiles = folderFilter
      ? filteredFiles.filter(
          (f) => f.folder === folderFilter || f.folder.startsWith(folderFilter + "/")
        )
      : filteredFiles;

    // Limit to top 40 files to avoid massive matrix
    const files = activeFiles.slice(0, 40);
    const n = files.length;

    if (n === 0) return;

    const cellSize = Math.min(24, Math.max(12, Math.min(w - 140, h - 120) / n));

    const matrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    const fileIdx: Record<string, number> = {};

    files.forEach((f, i) => {
      fileIdx[f.path] = i;
    });

    filteredConnections.forEach((c) => {
      const srcIdx = fileIdx[c.source];
      const tgtIdx = fileIdx[c.target];
      if (srcIdx !== undefined && tgtIdx !== undefined) {
        matrix[srcIdx][tgtIdx] += c.count || 1;
      }
    });

    let maxVal = 1;
    matrix.forEach((row) =>
      row.forEach((v) => {
        if (v > maxVal) maxVal = v;
      })
    );

    // Columns
    const colLabels = g
      .selectAll("text.col-label")
      .data(files)
      .join("text")
      .attr("class", "col-label")
      .attr("x", (_, i) => i * cellSize + cellSize / 2)
      .attr("y", -8)
      .attr("text-anchor", "start")
      .attr("transform", (_, i) => `rotate(-45,${i * cellSize + cellSize / 2},-8)`)
      .attr("fill", "#737373")
      .attr("font-size", "10px")
      .attr("font-family", '"JetBrains Mono", monospace')
      .text((d) => {
        const name = d.name.replace(/\.[^.]+$/, "");
        return name.length > 12 ? name.slice(0, 10) + "…" : name;
      })
      .style("cursor", "pointer")
      .on("click", (e, d) => selectFile(d.path));

    // Rows
    const rowLabels = g
      .selectAll("text.row-label")
      .data(files)
      .join("text")
      .attr("class", "row-label")
      .attr("x", -8)
      .attr("y", (_, i) => i * cellSize + cellSize / 2 + 3)
      .attr("text-anchor", "end")
      .attr("fill", "#737373")
      .attr("font-size", "10px")
      .attr("font-family", '"JetBrains Mono", monospace')
      .text((d) => {
        const name = d.name.replace(/\.[^.]+$/, "");
        return name.length > 12 ? name.slice(0, 10) + "…" : name;
      })
      .style("cursor", "pointer")
      .on("click", (e, d) => selectFile(d.path));

    const cellData: any[] = [];
    files.forEach((f, i) => {
      files.forEach((t, j) => {
        cellData.push({ row: i, col: j, value: matrix[i][j], source: f, target: t });
      });
    });

    const tooltip = container
      .append("div")
      .attr(
        "class",
        "absolute hidden bg-[#050505] border border-[#1a1a1a] rounded-lg p-3 text-xs shadow-2xl z-50 text-[#e5e5e5]"
      )
      .style("pointer-events", "none");

    const cells = g
      .selectAll("rect.matrix-cell")
      .data(cellData)
      .join("rect")
      .attr("class", "matrix-cell")
      .attr("x", (d) => d.col * cellSize)
      .attr("y", (d) => d.row * cellSize)
      .attr("width", cellSize - 1)
      .attr("height", cellSize - 1)
      .attr("rx", 2)
      .attr("fill", (d) =>
        d.value > 0 ? `rgba(255,107,0,${Math.max(0.15, d.value / maxVal)})` : "#0a0a0a"
      )
      .attr("stroke", "#000000")
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer");

    cells
      .on("mouseenter", function (e, d: any) {
        tooltip
          .html(
            `
        <div class="font-bold text-[#ff6b00] mb-2 border-b border-[#1a1a1a] pb-1 break-all max-w-[200px] font-mono">
          ${d.source.name} <span class="text-[#737373] mx-1">→</span> ${d.target.name}
        </div>
        <div class="flex justify-between items-center gap-4 text-xs">
          <span class="text-[#737373]">Connections</span>
          <span class="text-[#ff6b00] font-mono font-bold">${d.value}</span>
        </div>
      `
          )
          .style("display", "block")
          .style("left", `${e.offsetX + 15}px`)
          .style("top", `${e.offsetY + 15}px`);

        g.selectAll("rect.matrix-cell").attr("opacity", (c: any) =>
          c.row === d.row || c.col === d.col ? 1 : 0.2
        );

        colLabels
          .attr("fill", (_, i) => (i === d.col ? "#ff6b00" : "#737373"))
          .attr("font-weight", (_, i) => (i === d.col ? "600" : "400"));

        rowLabels
          .attr("fill", (_, i) => (i === d.row ? "#ff6b00" : "#737373"))
          .attr("font-weight", (_, i) => (i === d.row ? "600" : "400"));

        d3.select(this).attr("stroke", "#ff6b00").attr("stroke-width", 1.5).raise(); // bring to front
      })
      .on("mousemove", (e) => {
        tooltip.style("left", `${e.offsetX + 15}px`).style("top", `${e.offsetY + 15}px`);
      })
      .on("mouseleave", function () {
        tooltip.style("display", "none");
        cells.attr("opacity", 1);
        colLabels.attr("fill", "#737373").attr("font-weight", "400");
        rowLabels.attr("fill", "#737373").attr("font-weight", "400");
        d3.select(this).attr("stroke", "#000000").attr("stroke-width", 0.5);
      })
      .on("click", (e, d: any) => {
        e.stopPropagation();
        selectFile(d.source.path);
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
  }, [analysisData, folderFilter, selectFile, filteredFiles, filteredConnections]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-transparent flex items-center justify-center"
    />
  );
}
