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

    // --- DEFS for Gradients and Shadows ---
    const defs = svg.append("defs");

    // Shadow filter
    const filter = defs.append("filter").attr("id", "node-shadow").attr("height", "130%");
    filter
      .append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 3)
      .attr("result", "blur");
    filter
      .append("feOffset")
      .attr("in", "blur")
      .attr("dx", 0)
      .attr("dy", 1)
      .attr("result", "offsetBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const g = svg.append("g").attr("transform", "translate(40,40)");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (e) => {
        g.attr(
          "transform",
          `translate(${40 + e.transform.x},${40 + e.transform.y}) scale(${e.transform.k})`
        );
      });

    svg.call(zoom);

    const activeFiles = folderFilter
      ? filteredFiles.filter(
          (f) => f.folder === folderFilter || f.folder.startsWith(folderFilter + "/")
        )
      : filteredFiles;

    const folders = Array.from(new Set(activeFiles.map((f) => f.folder || "root"))).slice(0, 20);
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

    // BFS Cycle Breaker
    const finalLinks: any[] = [];
    const dagAdj: Record<number, number[]> = {};
    const sortedLinks = [...links].sort((a, b) => b.value - a.value);

    sortedLinks.forEach((l) => {
      const queue = [l.target];
      const visitedBFS = new Set<number>();
      let formsCycle = false;
      while (queue.length > 0) {
        const curr = queue.shift()!;
        if (curr === l.source) {
          formsCycle = true;
          break;
        }
        if (visitedBFS.has(curr)) continue;
        visitedBFS.add(curr);
        (dagAdj[curr] || []).forEach((n) => queue.push(n));
      }
      if (!formsCycle) {
        finalLinks.push(l);
        if (!dagAdj[l.source]) dagAdj[l.source] = [];
        dagAdj[l.source].push(l.target);
      }
    });

    if (finalLinks.length === 0) {
      g.append("text")
        .attr("x", w / 2 - 40)
        .attr("y", h / 2)
        .attr("fill", "#737373")
        .attr("font-size", "14px")
        .attr("text-anchor", "middle")
        .attr("font-family", "Outfit, sans-serif")
        .text("No cross-folder dependencies to visualize");
      return;
    }

    const sankeyGenerator = sankey<any, any>()
      .nodeId((d) => d.id)
      .nodeWidth(12)
      .nodePadding(25)
      .extent([
        [0, 0],
        [w - 120, h - 120],
      ]);

    let graph;
    try {
      graph = sankeyGenerator({
        nodes: nodes.map((d) => ({ ...d })),
        links: finalLinks.map((d) => ({ ...d })),
      });
    } catch (e) {
      console.error("Sankey generation failed even after cycle breaking", e);
      return;
    }

    // Create Gradients for each link
    graph.links.forEach((link: any, i: number) => {
      const gradientId = `link-grad-${i}`;
      const sourceColor = COLORS[link.source.id % COLORS.length];
      const targetColor = COLORS[link.target.id % COLORS.length];

      const grad = defs
        .append("linearGradient")
        .attr("id", gradientId)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", link.source.x1)
        .attr("x2", link.target.x0);

      grad.append("stop").attr("offset", "0%").attr("stop-color", sourceColor).attr("stop-opacity", 0.6);
      grad.append("stop").attr("offset", "100%").attr("stop-color", targetColor).attr("stop-opacity", 0.6);
    });

    const tooltip = container
      .append("div")
      .attr(
        "class",
        "absolute hidden bg-[#050505] border border-[#1a1a1a] rounded-xl p-4 text-xs shadow-2xl z-50 text-[#e5e5e5] backdrop-blur-md"
      )
      .style("pointer-events", "none");

    // Render Links
    g.selectAll("path.sankey-link")
      .data(graph.links)
      .join("path")
      .attr("class", "sankey-link")
      .attr("d", sankeyLinkHorizontal())
      .attr("fill", "none")
      .attr("stroke", (d: any, i: number) => `url(#link-grad-${i})`)
      .attr("stroke-width", (d: any) => Math.max(2, d.width))
      .attr("stroke-opacity", 0.4)
      .style("transition", "stroke-opacity 0.3s ease")
      .on("mouseenter", function (e, d: any) {
        d3.select(this).attr("stroke-opacity", 0.9);
        tooltip
          .html(
            `
          <div class="font-bold text-[#ff6b00] mb-2 border-b border-[#1a1a1a] pb-1 flex items-center gap-2 font-mono">
            <span style="color: ${COLORS[d.source.id % COLORS.length]}">${d.source.name}</span>
            <span class="text-[#737373]">→</span>
            <span style="color: ${COLORS[d.target.id % COLORS.length]}">${d.target.name}</span>
          </div>
          <div class="flex justify-between items-center gap-6 text-xs">
            <span class="text-[#737373]">Flow Strength</span>
            <span class="text-white font-mono font-bold text-sm">${d.value}</span>
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

    // Render Nodes
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
      .attr("height", (d: any) => Math.max(5, d.y1 - d.y0))
      .attr("rx", 4)
      .attr("fill", (d: any) => COLORS[d.id % COLORS.length])
      .attr("filter", "url(#node-shadow)")
      .style("transition", "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)");

    node
      .append("text")
      .attr("x", (d: any) => (d.x0 < w / 2 ? d.x1 + 10 : d.x0 - 10))
      .attr("y", (d: any) => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d: any) => (d.x0 < w / 2 ? "start" : "end"))
      .attr("fill", "#e5e5e5")
      .attr("font-size", "11px")
      .attr("font-family", "Outfit, sans-serif")
      .attr("font-weight", "600")
      .text((d: any) => d.name)
      .append("tspan")
      .attr("fill", "#737373")
      .attr("font-weight", "400")
      .attr("dx", "4")
      .text((d: any) => `(${d.fileCount})`);

    node
      .on("mouseenter", function (e, d: any) {
        d3.select(this).select("rect").attr("width", (d: any) => (d.x1 - d.x0) + 4).attr("x", (d: any) => d.x0 - 2);
        
        tooltip
          .html(
            `
        <div class="font-bold text-[#ff6b00] mb-2 border-b border-[#1a1a1a] pb-1 flex items-center gap-2 font-mono">
           <div class="w-2 h-2 rounded-full" style="background: ${COLORS[d.id % COLORS.length]}"></div>
           ${d.fullPath}
        </div>
        <div class="flex justify-between items-center gap-6 text-xs">
          <span class="text-[#737373]">Files</span>
          <span class="text-white font-mono font-bold">${d.fileCount}</span>
        </div>
      `
          )
          .style("display", "block")
          .style("left", `${e.offsetX + 15}px`)
          .style("top", `${e.offsetY + 15}px`);

        g.selectAll("path.sankey-link").attr("stroke-opacity", (l: any) =>
          l.source.id === d.id || l.target.id === d.id ? 0.9 : 0.05
        );
      })
      .on("mousemove", (e) =>
        tooltip.style("left", `${e.offsetX + 15}px`).style("top", `${e.offsetY + 15}px`)
      )
      .on("mouseleave", function(e, d: any) {
        d3.select(this).select("rect").attr("width", (d: any) => d.x1 - d.x0).attr("x", (d: any) => d.x0);
        tooltip.style("display", "none");
        g.selectAll("path.sankey-link").attr("stroke-opacity", 0.4);
      })
      .on("click", (e, d: any) => {
        e.stopPropagation();
        setFolderFilter(d.fullPath);
      });

    return () => {
      // Clean up event listeners if any were added
    };
  }, [analysisData, folderFilter, setFolderFilter, filteredFiles, filteredConnections]);

  return (
    <div className="w-full h-full relative bg-transparent overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#ff6b00]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#ff8c00]/5 blur-[120px]" />
      </div>
    </div>
  );
}
