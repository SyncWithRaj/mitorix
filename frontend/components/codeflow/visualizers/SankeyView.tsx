"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import { useCodeflow } from "../../../context/CodeflowContext";
import { COLORS } from "../../../lib/codeflow.constants";

export default function SankeyView() {
  const { analysisData, folderFilter, setFolderFilter, filteredFiles, filteredConnections } =
    useCodeflow();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!analysisData || !containerRef.current) return;

    const container = d3.select(containerRef.current);
    container.selectAll("*").remove();

    const w = containerRef.current.clientWidth || 800;
    const h = containerRef.current.clientHeight || 600;

    const svg = container.append("svg").attr("width", w).attr("height", h).style("cursor", "grab");
    const g = svg.append("g").attr("transform", "translate(20,20)");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .on("zoom", (e) => {
        g.attr(
          "transform",
          `translate(${20 + e.transform.x},${20 + e.transform.y}) scale(${e.transform.k})`
        );
      });

    svg.call(zoom);

    const activeFiles = folderFilter
      ? filteredFiles.filter(
          (f) => f.folder === folderFilter || f.folder.startsWith(folderFilter + "/")
        )
      : filteredFiles;

    const folders = Array.from(new Set(activeFiles.map((f) => f.folder || "root"))).slice(0, 15);
    const folderIdx: Record<string, number> = {};
    folders.forEach((f, i) => {
      folderIdx[f] = i;
    });

    const filteredPaths = new Set(activeFiles.map((f) => f.path));
    const flowMap: Record<string, number> = {};

    filteredConnections.forEach((c) => {
      const src = c.source;
      const tgt = c.target;
      if (!filteredPaths.has(src) && !filteredPaths.has(tgt)) return;

      const srcFile = activeFiles.find((f) => f.path === src);
      const tgtFile = activeFiles.find((f) => f.path === tgt);

      if (srcFile && tgtFile && srcFile.folder !== tgtFile.folder) {
        const key = `${srcFile.folder}|${tgtFile.folder}`;
        flowMap[key] = (flowMap[key] || 0) + (c.count || 1);
      }
    });

    const nodes = folders.map((f, i) => ({
      id: i,
      name: f.split("/").pop() || "root",
      fullPath: f,
      fileCount: activeFiles.filter((x) => x.folder === f).length,
    }));

    const linkMap: Record<string, any> = {};
    Object.entries(flowMap).forEach(([k, val]) => {
      const parts = k.split("|");
      const si = folderIdx[parts[0]];
      const ti = folderIdx[parts[1]];

      if (si !== undefined && ti !== undefined && si !== ti) {
        const key = `${Math.min(si, ti)}|${Math.max(si, ti)}`;
        if (!linkMap[key])
          linkMap[key] = { a: Math.min(si, ti), b: Math.max(si, ti), ab: 0, ba: 0 };
        if (si < ti) linkMap[key].ab += val;
        else linkMap[key].ba += val;
      }
    });

    const links: any[] = [];
    Object.values(linkMap).forEach((l) => {
      const net = l.ab - l.ba;
      if (net > 0) links.push({ source: l.a, target: l.b, value: net });
      else if (net < 0) links.push({ source: l.b, target: l.a, value: -net });
      else if (l.ab > 0) links.push({ source: l.a, target: l.b, value: l.ab });
    });

    if (links.length === 0) {
      g.append("text")
        .attr("x", w / 2 - 20)
        .attr("y", h / 2)
        .attr("fill", "#8b949e")
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .text("No cross-folder dependencies to visualize");
      return;
    }

    const sankeyGenerator = sankey<any, any>()
      .nodeId((d) => d.id)
      .nodeWidth(20)
      .nodePadding(15)
      .extent([
        [0, 0],
        [w - 60, h - 60],
      ]);

    let graph;
    try {
      graph = sankeyGenerator({
        nodes: nodes.map((d) => ({ ...d })),
        links: links.map((d) => ({ ...d })),
      });
    } catch (e) {
      g.append("text")
        .attr("x", w / 2 - 20)
        .attr("y", h / 2)
        .attr("fill", "#8b949e")
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .text(
          "Sankey diagram unavailable: dependency graph has circular references. Try Force Graph."
        );
      return;
    }

    const tooltip = container
      .append("div")
      .attr(
        "class",
        "absolute hidden bg-[rgba(22,27,34,0.95)] border border-[#30363d] rounded-lg p-3 text-xs shadow-xl z-50"
      )
      .style("pointer-events", "none");

    g.selectAll("path.sankey-link")
      .data(graph.links)
      .join("path")
      .attr("class", "sankey-link")
      .attr("d", sankeyLinkHorizontal())
      .attr("fill", "none")
      .attr("stroke", (d: any) => {
        const folderIdx = analysisData.folders.indexOf(d.source.fullPath) || 0;
        return COLORS[folderIdx % COLORS.length] || COLORS[d.source.id % COLORS.length];
      })
      .attr("stroke-width", (d: any) => Math.max(2, d.width))
      .attr("stroke-opacity", 0.4)
      .on("mouseenter", function (e, d: any) {
        d3.select(this).attr("stroke-opacity", 0.8);
        tooltip
          .html(
            `
          <div class="font-bold text-[#c9d1d9] mb-2 border-b border-[#30363d] pb-1">
            ${d.source.name} → ${d.target.name}
          </div>
          <div class="flex justify-between items-center gap-4">
            <span class="text-[#8b949e]">Connections</span>
            <span class="text-[#58a6ff] font-mono font-bold">${d.value}</span>
          </div>
        `
          )
          .style("display", "block")
          .style("left", `${e.offsetX + 15}px`)
          .style("top", `${e.offsetY + 15}px`);
      })
      .on("mousemove", (e) =>
        tooltip.style("left", `${e.offsetX + 15}px`).style("top", `${e.offsetY + 15}px`)
      )
      .on("mouseleave", function () {
        d3.select(this).attr("stroke-opacity", 0.4);
        tooltip.style("display", "none");
      });

    const node = g
      .selectAll("g.sankey-node")
      .data(graph.nodes)
      .join("g")
      .attr("class", "sankey-node")
      .style("cursor", "pointer");

    node
      .append("rect")
      .attr("x", (d: any) => d.x0)
      .attr("y", (d: any) => d.y0)
      .attr("width", (d: any) => d.x1 - d.x0)
      .attr("height", (d: any) => Math.max(4, d.y1 - d.y0))
      .attr("rx", 3)
      .attr("fill", (d: any) => {
        const folderIdx = analysisData.folders.indexOf(d.fullPath) || 0;
        return COLORS[folderIdx % COLORS.length] || COLORS[d.id % COLORS.length];
      });

    node
      .append("text")
      .attr("x", (d: any) => (d.x0 < w / 2 ? d.x1 + 8 : d.x0 - 8))
      .attr("y", (d: any) => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d: any) => (d.x0 < w / 2 ? "start" : "end"))
      .attr("fill", "#c9d1d9")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .text((d: any) => `${d.name} (${d.fileCount})`);

    node
      .on("mouseenter", function (e, d: any) {
        tooltip
          .html(
            `
        <div class="font-bold text-[#c9d1d9] mb-2 border-b border-[#30363d] pb-1">${d.fullPath}</div>
        <div class="flex justify-between items-center gap-4">
          <span class="text-[#8b949e]">Files in folder</span>
          <span class="text-white font-mono text-right">${d.fileCount}</span>
        </div>
      `
          )
          .style("display", "block")
          .style("left", `${e.offsetX + 15}px`)
          .style("top", `${e.offsetY + 15}px`);

        g.selectAll("path.sankey-link").attr("stroke-opacity", (l: any) =>
          l.source.id === d.id || l.target.id === d.id ? 0.8 : 0.1
        );
      })
      .on("mousemove", (e) =>
        tooltip.style("left", `${e.offsetX + 15}px`).style("top", `${e.offsetY + 15}px`)
      )
      .on("mouseleave", () => {
        tooltip.style("display", "none");
        g.selectAll("path.sankey-link").attr("stroke-opacity", 0.4);
      })
      .on("click", (e, d: any) => {
        e.stopPropagation();
        setFolderFilter(d.fullPath);
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
  }, [analysisData, folderFilter, setFolderFilter, filteredFiles, filteredConnections]);

  return <div ref={containerRef} className="w-full h-full relative bg-[#0a0a0f]" />;
}
