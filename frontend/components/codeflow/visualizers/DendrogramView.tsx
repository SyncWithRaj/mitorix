"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useCodeflow } from "../../../context/CodeflowContext";
import { COLORS } from "../../../lib/codeflow.constants";

export default function DendrogramView() {
  const { analysisData, folderFilter, selectFile, setFolderFilter, filteredFiles } = useCodeflow();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!analysisData || !containerRef.current) return;

    const container = d3.select(containerRef.current);
    container.selectAll("*").remove();

    const w = containerRef.current.clientWidth || 800;
    const h = containerRef.current.clientHeight || 600;

    const svg = container.append("svg").attr("width", w).attr("height", h).style("cursor", "grab");
    const g = svg.append("g").attr("transform", "translate(80,20)");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (e) => {
        g.attr(
          "transform",
          `translate(${80 + e.transform.x},${20 + e.transform.y}) scale(${e.transform.k})`
        );
        svg.style("cursor", e.transform.k > 1 ? "grab" : "default");
      });

    svg.call(zoom);

    const activeFiles = folderFilter
      ? filteredFiles.filter(
          (f) => f.folder === folderFilter || f.folder.startsWith(folderFilter + "/")
        )
      : filteredFiles;

    const hier: any = { name: "root", children: [] };
    const folderMap: Record<string, any> = {};

    // Limit to 80 files for dendrogram to prevent massive vertical overflow
    activeFiles.slice(0, 80).forEach((f) => {
      const folder = f.folder || "root";
      if (!folderMap[folder]) {
        folderMap[folder] = {
          name: folder.split("/").pop() || "root",
          fullPath: folder,
          children: [],
        };
      }
      folderMap[folder].children.push({
        name: f.name,
        path: f.path,
        fns: f.functions?.length || 0,
        lines: f.lines || 0,
        folder,
        layer: f.layer,
      });
    });

    hier.children = Object.values(folderMap);

    const root = d3.hierarchy(hier);
    const treeLayout = d3.cluster().size([h - 60, w - 200]);
    treeLayout(root);

    const tooltip = container
      .append("div")
      .attr(
        "class",
        "absolute hidden bg-[rgba(22,27,34,0.95)] border border-[#30363d] rounded-lg p-3 text-xs shadow-xl z-50"
      )
      .style("pointer-events", "none");

    // Links
    g.selectAll("path.dendro-link")
      .data(root.links())
      .join("path")
      .attr("class", "dendro-link")
      .attr(
        "d",
        (d: any) =>
          `M${d.source.y},${d.source.x}C${(d.source.y + d.target.y) / 2},${d.source.x} ${(d.source.y + d.target.y) / 2},${d.target.x} ${d.target.y},${d.target.x}`
      )
      .attr("fill", "none")
      .attr("stroke", "#30363d")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6);

    // Nodes
    const node = g
      .selectAll("g.dendro-node")
      .data(root.descendants())
      .join("g")
      .attr("class", "dendro-node")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`)
      .style("cursor", "pointer");

    node
      .append("circle")
      .attr("r", (d: any) => (d.children ? 6 : 8))
      .attr("fill", (d: any) => {
        if (d.children) return "#161b22";
        const folderIdx = analysisData.folders.indexOf(d.data.folder) || 0;
        return COLORS[folderIdx % COLORS.length] || COLORS[0];
      })
      .attr("stroke", (d: any) => (d.children ? "#8b949e" : "#0d1117"))
      .attr("stroke-width", 2);

    // Leaf text
    node
      .filter((d: any) => !d.children)
      .append("text")
      .attr("x", 12)
      .attr("dy", "0.35em")
      .attr("fill", "#c9d1d9")
      .attr("font-size", "10px")
      .attr("font-family", '"JetBrains Mono", monospace')
      .text((d: any) => {
        const n = d.data.name.replace(/\.[^.]+$/, "");
        return n.length > 20 ? n.slice(0, 18) + "…" : n;
      });

    // Parent text
    node
      .filter((d: any) => d.children && d.depth > 0)
      .append("text")
      .attr("x", -10)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .attr("fill", "#8b949e")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .text((d: any) => d.data.name);

    node
      .on("mouseenter", function (e, d: any) {
        if (!d.data.path) return;

        tooltip
          .html(
            `
        <div class="font-bold text-[#c9d1d9] mb-2 border-b border-[#30363d] pb-1">${d.data.name}</div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1">
          <span class="text-[#8b949e]">Lines</span><span class="text-white font-mono text-right">${d.data.lines}</span>
          <span class="text-[#8b949e]">Functions</span><span class="text-white font-mono text-right">${d.data.fns}</span>
          <span class="text-[#8b949e]">Layer</span><span class="text-white text-right truncate">${d.data.layer || "—"}</span>
        </div>
      `
          )
          .style("display", "block")
          .style("left", `${e.offsetX + 15}px`)
          .style("top", `${e.offsetY + 15}px`);

        d3.select(this)
          .select("circle")
          .transition()
          .duration(150)
          .attr("r", 12)
          .attr("stroke", "#58a6ff")
          .attr("stroke-width", 3);
      })
      .on("mousemove", (e) => {
        tooltip.style("left", `${e.offsetX + 15}px`).style("top", `${e.offsetY + 15}px`);
      })
      .on("mouseleave", function (e, d: any) {
        tooltip.style("display", "none");
        d3.select(this)
          .select("circle")
          .transition()
          .duration(150)
          .attr("r", d.children ? 6 : 8)
          .attr("stroke", d.children ? "#8b949e" : "#0d1117")
          .attr("stroke-width", 2);
      })
      .on("click", (e, d: any) => {
        e.stopPropagation();
        if (d.data.path) {
          selectFile(d.data.path);
        } else if (d.data.fullPath) {
          setFolderFilter(d.data.fullPath);
        }
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
  }, [analysisData, folderFilter, selectFile, setFolderFilter, filteredFiles]);

  return <div ref={containerRef} className="w-full h-full relative bg-[#0a0a0f]" />;
}
