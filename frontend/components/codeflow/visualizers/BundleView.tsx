"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useCodeflow } from "../../../context/CodeflowContext";
import { COLORS } from "../../../lib/codeflow.constants";

const getColor = (type: string) => {
  const t = (type || "").toLowerCase();
  if (t.includes("access")) return "ef4444";
  if (t.includes("call")) return "3b82f6";
  if (t.includes("import") || t.includes("export")) return "22c55e";
  if (t.includes("handle")) return "eab308";
  return "30363d";
};

export default function BundleView() {
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
    const radius = Math.min(w, h) / 2 - 120;

    const svg = container.append("svg").attr("width", w).attr("height", h).style("cursor", "grab");
    const g = svg.append("g").attr("transform", `translate(${w / 2},${h / 2})`);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on("zoom", (e) => {
        g.attr(
          "transform",
          `translate(${w / 2 + e.transform.x},${h / 2 + e.transform.y}) scale(${e.transform.k})`
        );
        svg.style("cursor", e.transform.k > 1 ? "grab" : "default");
      });

    svg.call(zoom);

    const activeFiles = folderFilter
      ? filteredFiles.filter(
        (f) => f.folder === folderFilter || f.folder.startsWith(folderFilter + "/")
      )
      : filteredFiles;

    const files = activeFiles.slice(0, 100);
    const filePaths = new Set(files.map((f) => f.path));

    const hier: any = { name: "root", children: [] };
    const folderMap: Record<string, any> = {};

    files.forEach((f) => {
      const folder = f.folder || "root";
      if (!folderMap[folder]) {
        folderMap[folder] = {
          name: folder.split("/").pop() || "root",
          fullPath: folder,
          children: [],
        };
      }
      folderMap[folder].children.push({ name: f.name, path: f.path, folder });
    });

    hier.children = Object.values(folderMap);

    const root = d3.hierarchy(hier);
    const cluster = d3.cluster().size([2 * Math.PI, radius]);
    cluster(root);

    const nodeByPath: Record<string, any> = {};
    root.leaves().forEach((d: any) => {
      nodeByPath[d.data.path] = d;
    });

    const links: any[] = [];
    filteredConnections.forEach((c) => {
      const src = c.source;
      const tgt = c.target;
      if (filePaths.has(src) && filePaths.has(tgt) && src !== tgt) {
        if (nodeByPath[src] && nodeByPath[tgt]) {
          const lpath: any = nodeByPath[src].path(nodeByPath[tgt]);
          lpath.type = c.type; // Attach relationship type metadata
          links.push(lpath);
        }
      }
    });

    const line = d3
      .lineRadial<any>()
      .curve(d3.curveBundle.beta(0.85))
      .radius((d) => d.y)
      .angle((d) => d.x);

    const defs = svg.append("defs");
    const colors = ["ef4444", "3b82f6", "22c55e", "eab308", "30363d"];
    colors.forEach(c => {
      defs
        .append("marker")
        .attr("id", `bundle-arr-${c}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", -2)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-4L10,0L0,4")
        .attr("fill", `#${c}`);
    });

    const link = g
      .append("g")
      .selectAll("path.bundle-link")
      .data(links)
      .join("path")
      .attr("class", "bundle-link")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", (l: any) => `#${getColor(l.type)}`)
      .attr("stroke-width", 0.8)
      .attr("stroke-opacity", 0)
      .attr("marker-mid", "");

    const node = g
      .append("g")
      .selectAll("g.bundle-node")
      .data(root.leaves())
      .join("g")
      .attr("class", "bundle-node")
      .attr("transform", (d: any) => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`)
      .style("cursor", "pointer");

    node
      .append("circle")
      .attr("r", 4)
      .attr("fill", (d: any) => {
        const folderIdx = analysisData.folders.indexOf(d.data.folder) || 0;
        return COLORS[folderIdx % COLORS.length] || COLORS[0];
      });

    node
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", (d: any) => (d.x < Math.PI ? 6 : -6))
      .attr("text-anchor", (d: any) => (d.x < Math.PI ? "start" : "end"))
      .attr("transform", (d: any) => (d.x >= Math.PI ? "rotate(180)" : null))
      .attr("fill", "#8b949e")
      .attr("font-size", "10px")
      .attr("font-family", '"JetBrains Mono", monospace')
      .text((d: any) => {
        const n = d.data.name.replace(/\.[^.]+$/, "");
        return n.length > 18 ? n.slice(0, 16) + "…" : n;
      });

    node
      .on("mouseenter", function (e, d: any) {
        d3.select(this).select("text").attr("fill", "#c9d1d9").attr("font-weight", "bold");
        d3.select(this).select("circle").attr("r", 6).attr("fill", "#58a6ff");

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
          .attr("stroke", (l: any) => {
            if (l[0] === d || l[l.length - 1] === d) return `#${getColor(l.type)}`;
            return "#30363d";
          })
          .attr("stroke-opacity", (l: any) => {
            if (!isVisible(l.type)) return 0;
            return (l[0] === d || l[l.length - 1] === d ? 0.9 : (hl ? 0.05 : 0));
          })
          .attr("stroke-width", (l: any) => {
            if (!isVisible(l.type)) return 0.8;
            return (l[0] === d || l[l.length - 1] === d ? 1.5 : 0.8);
          })
          .attr("marker-mid", (l: any) => {
            if (!isVisible(l.type)) return "";
            return (l[0] === d || l[l.length - 1] === d ? `url(#bundle-arr-${getColor(l.type)})` : "");
          })
          .raise();
      })
      .on("mouseleave", function () {
        d3.select(this).select("text").attr("fill", "#8b949e").attr("font-weight", "normal");
        d3.select(this)
          .select("circle")
          .attr("r", 4)
          .attr("fill", (d: any) => {
            const folderIdx = analysisData.folders.indexOf(d.data.folder) || 0;
            return COLORS[folderIdx % COLORS.length] || COLORS[0];
          });

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
          .attr("stroke", (l: any) => `#${getColor(l.type)}`)
          .attr("stroke-opacity", (l: any) => hl && isVisible(l.type) ? 0.45 : 0)
          .attr("stroke-width", 0.8)
          .attr("marker-mid", (l: any) => hl && isVisible(l.type) ? `url(#bundle-arr-${getColor(l.type)})` : "");
      })
      .on("click", (e, d: any) => {
        e.stopPropagation();
        selectFile(d.data.path);
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

  useEffect(() => {
    if (!containerRef.current) return;
    const svg = d3.select(containerRef.current).select("svg");
    if (svg.empty()) return;

    const isVisible = (type: string) => {
      const t = (type || "").toLowerCase();
      if (t.includes("call") && !relationFilters.calls) return false;
      if (t.includes("access") && !relationFilters.accesses) return false;
      if ((t.includes("import") || t.includes("export")) && !relationFilters.imports) return false;
      if (t.includes("handle") && !relationFilters.handles) return false;
      return true;
    };

    svg.selectAll(".bundle-link")
      .transition()
      .duration(300)
      .attr("stroke-opacity", (l: any) => highlightLinks && isVisible(l.type) ? 0.45 : 0)
      .attr("stroke-width", 0.8)
      .attr("marker-mid", (l: any) => highlightLinks && isVisible(l.type) ? `url(#bundle-arr-${getColor(l.type)})` : "");
  }, [highlightLinks, relationFilters]);

  return <div ref={containerRef} className="w-full h-full relative bg-[#0a0a0f]" />;
}
