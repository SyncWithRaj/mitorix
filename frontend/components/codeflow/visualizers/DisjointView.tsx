"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useCodeflow } from "../../../context/CodeflowContext";
import { COLORS } from "../../../lib/codeflow.constants";

export default function DisjointView() {
  const { analysisData, folderFilter, selectFile, filteredFiles, filteredConnections, highlightLinks } =
    useCodeflow();
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightLinksRef = useRef(highlightLinks);

  useEffect(() => {
    highlightLinksRef.current = highlightLinks;
  }, [highlightLinks]);

  useEffect(() => {
    if (!analysisData || !containerRef.current) return;

    const container = d3.select(containerRef.current);
    container.selectAll("*").remove();

    const w = containerRef.current.clientWidth || 800;
    const h = containerRef.current.clientHeight || 600;

    const svg = container.append("svg").attr("width", w).attr("height", h).style("cursor", "grab");
    
    const defs = svg.append("defs");
    const colors = ["ef4444", "3b82f6", "22c55e", "eab308", "30363d"];
    colors.forEach(c => {
      defs
        .append("marker")
        .attr("id", `disjoint-arr-${c}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 18)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-4L10,0L0,4")
        .attr("fill", `#${c}`);
    });

    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (e) => {
        g.attr("transform", e.transform);
        svg.style("cursor", e.transform.k > 1 ? "grab" : "default");
      });

    svg.call(zoom);

    const activeFiles = folderFilter
      ? filteredFiles.filter(
          (f) => f.folder === folderFilter || f.folder.startsWith(folderFilter + "/")
        )
      : filteredFiles;

    const files = activeFiles.slice(0, 150); // limit to avoid simulation lag
    const fileIdx: Record<string, number> = {};
    files.forEach((f, i) => {
      fileIdx[f.path] = i;
    });

    const folders = Array.from(new Set(files.map((f) => f.folder || "root")));
    const cols = Math.ceil(Math.sqrt(folders.length));
    const cellW = 500;
    const cellH = 500;

    const centers: Record<string, { x: number; y: number }> = {};
    folders.forEach((f, i) => {
      centers[f] = {
        x: ((i % cols) + 0.5) * cellW,
        y: (Math.floor(i / cols) + 0.5) * cellH,
      };
    });

    const nodes = files.map((f) => ({
      id: f.path,
      name: f.name,
      folder: f.folder || "root",
      fns: f.functions?.length || 0,
      lines: f.lines || 0,
      layer: f.layer,
      cx: centers[f.folder || "root"].x,
      cy: centers[f.folder || "root"].y,
    }));

    const links: any[] = [];
    filteredConnections.forEach((c) => {
      const src = c.source;
      const tgt = c.target;
      if (fileIdx[src] !== undefined && fileIdx[tgt] !== undefined && src !== tgt) {
        links.push({ source: src, target: tgt, count: c.count || 1, type: c.type });
      }
    });

    const sim = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(300) // Much longer arrows to avoid clutter
          .strength(0.01) // Weak link force so x/y folder clusters dominate
      )
      .force("charge", d3.forceManyBody().strength(-200)) // Push nodes away from each other
      .force("x", d3.forceX((d: any) => d.cx).strength(0.15))
      .force("y", d3.forceY((d: any) => d.cy).strength(0.15))
      .force("collide", d3.forceCollide(60));

    // Folder backgrounds
    g.selectAll("rect.cluster-bg")
      .data(folders)
      .join("rect")
      .attr("class", "cluster-bg")
      .attr("x", (_, i) => (i % cols) * cellW + 10)
      .attr("y", (_, i) => Math.floor(i / cols) * cellH + 10)
      .attr("width", cellW - 20)
      .attr("height", cellH - 20)
      .attr("rx", 12)
      .attr("fill", (d) => {
        const idx = analysisData.folders.indexOf(d) || folders.indexOf(d);
        return COLORS[idx % COLORS.length] || COLORS[0];
      })
      .attr("opacity", 0.08)
      .attr("stroke", (d) => {
        const idx = analysisData.folders.indexOf(d) || folders.indexOf(d);
        return COLORS[idx % COLORS.length] || COLORS[0];
      })
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.3);

    // Folder labels
    g.selectAll("text.cluster-label")
      .data(folders)
      .join("text")
      .attr("class", "cluster-label")
      .attr("x", (_, i) => (i % cols) * cellW + 20)
      .attr("y", (_, i) => Math.floor(i / cols) * cellH + 28)
      .attr("fill", "#8b949e")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("font-family", '"JetBrains Mono", monospace')
      .text((d) => d.split("/").pop() || "root");

    const linkGroup = g
      .selectAll("g.disjoint-link-group")
      .data(links)
      .join("g")
      .attr("class", "disjoint-link-group");

    const getColor = (type: string) => {
      const t = (type || "").toLowerCase();
      if (t.includes("access")) return "ef4444";
      if (t.includes("call")) return "3b82f6";
      if (t.includes("import") || t.includes("export")) return "22c55e";
      if (t.includes("handle")) return "eab308";
      return "30363d";
    };

    const link = linkGroup
      .append("path")
      .attr("id", (d, i) => `disjoint-edge-${i}`)
      .attr("class", "disjoint-link")
      .attr("fill", "none")
      .attr("stroke", (d: any) => `#${getColor(d.type)}`)
      .attr("stroke-width", 0.8)
      .attr("stroke-opacity", 0) // let secondary effect handle it
      .attr("marker-end", "");

    const tooltip = container
      .append("div")
      .attr(
        "class",
        "absolute hidden bg-[rgba(22,27,34,0.95)] border border-[#30363d] rounded-lg p-3 text-xs shadow-xl z-50"
      )
      .style("pointer-events", "none");

    const node = g
      .selectAll("g.disjoint-node")
      .data(nodes)
      .join("g")
      .attr("class", "disjoint-node")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, any>()
          .on("start", (e, d) => {
            if (!e.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (e, d) => {
            d.fx = e.x;
            d.fy = e.y;
          })
          .on("end", (e, d) => {
            if (!e.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      );

    node
      .append("circle")
      .attr("r", (d) => Math.max(6, Math.min(14, 4 + d.fns)))
      .attr("fill", (d) => {
        const folderIdx = analysisData.folders.indexOf(d.folder) || 0;
        return COLORS[folderIdx % COLORS.length] || COLORS[0];
      })
      .attr("stroke", "#0d1117")
      .attr("stroke-width", 1.5);

    node
      .on("mouseenter", function (e, d: any) {
        tooltip
          .html(
            `
        <div class="font-bold text-[#c9d1d9] mb-2 border-b border-[#30363d] pb-1">${d.name}</div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1">
          <span class="text-[#8b949e]">Lines</span><span class="text-white font-mono text-right">${d.lines}</span>
          <span class="text-[#8b949e]">Functions</span><span class="text-white font-mono text-right">${d.fns}</span>
        </div>
      `
          )
          .style("display", "block")
          .style("left", `${e.offsetX + 15}px`)
          .style("top", `${e.offsetY + 15}px`);

        const hl = highlightLinksRef.current;
        link
          .attr("stroke-opacity", (l: any) =>
            l.source.id === d.id || l.target.id === d.id ? 0.9 : (hl ? 0.05 : 0)
          )
          .attr("stroke", (l: any) =>
            l.source.id === d.id || l.target.id === d.id ? `#${getColor(l.type)}` : "#30363d"
          )
          .attr("stroke-width", (l: any) => (l.source.id === d.id || l.target.id === d.id ? 1.5 : 0.8))
          .attr("marker-end", (l: any) =>
            l.source.id === d.id || l.target.id === d.id ? `url(#disjoint-arr-${getColor(l.type)})` : ""
          );

        d3.select(this)
          .select("circle")
          .transition()
          .duration(150)
          .attr("r", 14)
          .attr("stroke", "#58a6ff")
          .attr("stroke-width", 2);
      })
      .on("mousemove", (e) => {
        tooltip.style("left", `${e.offsetX + 15}px`).style("top", `${e.offsetY + 15}px`);
      })
      .on("mouseleave", function (e, d: any) {
        tooltip.style("display", "none");
        const hl = highlightLinksRef.current;
        link
          .attr("stroke-opacity", hl ? 0.45 : 0) // slightly dimmed
          .attr("stroke", (l: any) => `#${getColor(l.type)}`)
          .attr("stroke-width", 0.8)
          .attr("marker-end", (l: any) => hl ? `url(#disjoint-arr-${getColor(l.type)})` : "");
        d3.select(this)
          .select("circle")
          .transition()
          .duration(150)
          .attr("r", Math.max(6, Math.min(14, 4 + d.fns)))
          .attr("stroke", "#0d1117")
          .attr("stroke-width", 1.5);
      })
      .on("click", (e, d: any) => {
        e.stopPropagation();
        selectFile(d.id);
      });

    sim.on("tick", () => {
      link.attr("d", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
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
      sim.stop();
      window.removeEventListener("codeflow:zoomIn", handleZoomIn);
      window.removeEventListener("codeflow:zoomOut", handleZoomOut);
      window.removeEventListener("codeflow:resetZoom", handleResetZoom);
      window.removeEventListener("codeflow:fitView", handleFitView);
    };
  }, [analysisData, folderFilter, selectFile, filteredFiles, filteredConnections]);

  useEffect(() => {
    if (!containerRef.current) return;
    const svg = d3.select(containerRef.current).select("svg");
    if (svg.empty()) return;

    const getColor = (type: string) => {
      const t = (type || "").toLowerCase();
      if (t.includes("access")) return "ef4444";
      if (t.includes("call")) return "3b82f6";
      if (t.includes("import") || t.includes("export")) return "22c55e";
      if (t.includes("handle")) return "eab308";
      return "30363d";
    };

    svg.selectAll(".disjoint-link")
      .transition()
      .duration(300)
      .attr("stroke-opacity", highlightLinks ? 0.45 : 0)
      .attr("stroke-width", highlightLinks ? 0.8 : 0.8)
      .attr("marker-end", (d: any) => highlightLinks ? `url(#disjoint-arr-${getColor(d.type)})` : "");
  }, [highlightLinks]);

  return <div ref={containerRef} className="w-full h-full relative bg-[#0a0a0f]" />;
}
