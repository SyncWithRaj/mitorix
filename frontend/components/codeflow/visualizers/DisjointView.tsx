"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useCodeflow } from "../../../context/CodeflowContext";
import { COLORS } from "../../../lib/codeflow.constants";

export default function DisjointView() {
  const { analysisData, folderFilter, selectFile, filteredFiles, filteredConnections, highlightLinks, relationFilters } =
    useCodeflow();
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightLinksRef = useRef(highlightLinks);
  const relationFiltersRef = useRef(relationFilters);

  useEffect(() => {
    highlightLinksRef.current = highlightLinks;
    relationFiltersRef.current = relationFilters;
  }, [highlightLinks, relationFilters]);

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
      .attr("fill", "#737373")
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
        "absolute hidden bg-[#050505] border border-[#1a1a1a] rounded-lg p-3 text-xs shadow-2xl z-50 text-[#e5e5e5]"
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
      .attr("stroke", "#000000")
      .attr("stroke-width", 1.5);

    node
      .on("mouseenter", function (e, d: any) {
        tooltip
          .html(
            `
        <div class="font-bold text-[#ff6b00] mb-2 border-b border-[#1a1a1a] pb-1 font-mono">${d.name}</div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1">
          <span class="text-[#737373]">Lines</span><span class="text-white font-mono text-right">${d.lines}</span>
          <span class="text-[#737373]">Functions</span><span class="text-white font-mono text-right">${d.fns}</span>
        </div>
      `
          )
          .style("display", "block")
          .style("left", `${e.offsetX + 15}px`)
          .style("top", `${e.offsetY + 15}px`);

        const hl = highlightLinksRef.current;
        const rf = relationFiltersRef.current;

        const isVisible = (type: string) => {
          const t = (type || "").toLowerCase();
          if (t.includes("call") && !rf.calls) return false;
          if (t.includes("access") && !rf.accesses) return false;
          if ((t.includes("import") || t.includes("export")) && !rf.imports) return false;
          if (t.includes("handle") && !rf.handles) return false;
          return true;
        };

        link
          .attr("stroke-opacity", (l: any) => {
            if (!isVisible(l.type)) return 0;
            return l.source.id === d.id || l.target.id === d.id ? 0.9 : (hl ? 0.05 : 0);
          })
          .attr("stroke", (l: any) =>
            l.source.id === d.id || l.target.id === d.id ? `#${getColor(l.type)}` : "#1a1a1a"
          )
          .attr("stroke-width", (l: any) => {
            if (!isVisible(l.type)) return 0.8;
            return l.source.id === d.id || l.target.id === d.id ? 1.5 : 0.8;
          })
          .attr("marker-end", (l: any) => {
            if (!isVisible(l.type)) return "";
            return l.source.id === d.id || l.target.id === d.id ? `url(#disjoint-arr-${getColor(l.type)})` : "";
          });

        d3.select(this)
          .select("circle")
          .transition()
          .duration(150)
          .attr("r", 14)
          .attr("stroke", "#ff6b00")
          .attr("stroke-width", 2);
      })
      .on("mousemove", (e) => {
        tooltip.style("left", `${e.offsetX + 15}px`).style("top", `${e.offsetY + 15}px`);
      })
      .on("mouseleave", function (e, d: any) {
        tooltip.style("display", "none");
        const hl = highlightLinksRef.current;
        const rf = relationFiltersRef.current;

        const isVisible = (type: string) => {
          const t = (type || "").toLowerCase();
          if (t.includes("call") && !rf.calls) return false;
          if (t.includes("access") && !rf.accesses) return false;
          if ((t.includes("import") || t.includes("export")) && !rf.imports) return false;
          if (t.includes("handle") && !rf.handles) return false;
          return true;
        };

        link
          .attr("stroke-opacity", (l: any) => hl && isVisible(l.type) ? 0.45 : 0) // slightly dimmed
          .attr("stroke", (l: any) => `#${getColor(l.type)}`)
          .attr("stroke-width", 0.8)
          .attr("marker-end", (l: any) => hl && isVisible(l.type) ? `url(#disjoint-arr-${getColor(l.type)})` : "");
        d3.select(this)
          .select("circle")
          .transition()
          .duration(150)
          .attr("r", Math.max(6, Math.min(14, 4 + d.fns)))
          .attr("stroke", "#000000")
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

    const isVisible = (type: string) => {
      const t = (type || "").toLowerCase();
      if (t.includes("call") && !relationFilters.calls) return false;
      if (t.includes("access") && !relationFilters.accesses) return false;
      if ((t.includes("import") || t.includes("export")) && !relationFilters.imports) return false;
      if (t.includes("handle") && !relationFilters.handles) return false;
      return true;
    };

    svg.selectAll(".disjoint-link")
      .transition()
      .duration(300)
      .attr("stroke-opacity", (d: any) => highlightLinks && isVisible(d.type) ? 0.45 : 0)
      .attr("stroke-width", (d: any) => highlightLinks && isVisible(d.type) ? 0.8 : 0.8)
      .attr("marker-end", (d: any) => highlightLinks && isVisible(d.type) ? `url(#disjoint-arr-${getColor(d.type)})` : "");
  }, [highlightLinks, relationFilters]);

  return <div ref={containerRef} className="w-full h-full relative bg-transparent" />;
}
