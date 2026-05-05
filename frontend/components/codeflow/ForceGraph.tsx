"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useCodeflow } from "../../context/CodeflowContext";
import { COLORS, LAYER_COLORS } from "../../lib/codeflow.constants";
import * as d3 from "d3";

// Dynamically import ForceGraph2D
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export default function ForceGraph() {
  const { analysisData, colorMode, graphConfig, setHoveredNode, folderFilter, blastRadius, setSelectedFile } = useCodeflow();
  const fgRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });

  // Transform AnalysisData into ForceGraph node/link format
  useEffect(() => {
    if (!analysisData) return;

    const filteredFiles = folderFilter 
      ? analysisData.files.filter(f => f.folder === folderFilter || f.folder.startsWith(folderFilter + '/')) 
      : analysisData.files;

    const fileIds = new Set(filteredFiles.map(f => f.path));

    const nodes = filteredFiles.map(f => ({
      id: f.path,
      name: f.name,
      folder: f.folder,
      fnCount: f.functions?.length || 0,
      layer: f.layer,
      churn: f.churn || 0,
      val: Math.max(8, Math.min(24, 5 + (f.functions?.length || 0) * 0.8)),
    }));

    const linkMap = new Map();
    analysisData.connections.forEach(c => {
      if (!fileIds.has(c.source) || !fileIds.has(c.target)) return;
      if (c.source === c.target) return; // Skip self-links
      
      const k = `${c.source}|${c.target}`;
      if (!linkMap.has(k)) {
        linkMap.set(k, { source: c.source, target: c.target, count: 0 });
      }
      linkMap.get(k).count += c.count;
    });

    const links = Array.from(linkMap.values());
    setGraphData({ nodes, links });
    
  }, [analysisData, folderFilter]);

  // Adjust force graph physics
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      fgRef.current.d3Force('charge').strength(-graphConfig.spacing);
      fgRef.current.d3Force('link').distance(graphConfig.linkDist);
      fgRef.current.d3Force('center', d3.forceCenter(0, 0));
      
      // Reheat simulation
      fgRef.current.d3ReheatSimulation();
    }
  }, [graphData, graphConfig.spacing, graphConfig.linkDist]);

  const getColor = (node: any) => {
    if (blastRadius) {
      if (node.id === blastRadius.targetId) return "#ffffff";
      if (blastRadius.affectedNodeIds.has(node.id)) return "#ff5858";
      return "#30363d"; // Dim unaffected
    }
    
    if (colorMode === "folder") {
      const folderIdx = analysisData?.folders.indexOf(node.folder) ?? 0;
      return COLORS[folderIdx % COLORS.length] || COLORS[0];
    }
    if (colorMode === "layer") {
      return LAYER_COLORS[node.layer] || LAYER_COLORS["unknown"];
    }
    if (colorMode === "churn") {
      const r = (node.churn || 0) / 10; // simplistic normalization for now
      return r > 0.7 ? "#ff5f5f" : r > 0.4 ? "#ff9f43" : "#22c55e";
    }
    return COLORS[0];
  };

  if (!analysisData) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-pulse text-[#8b949e]">Loading visualization...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0a0a0f]">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeId="id"
        nodeVal="val"
        onNodeHover={(node: any) => {
          setHoveredNode(node);
          if (node) {
            document.body.style.cursor = 'pointer';
          } else {
            document.body.style.cursor = '';
          }
        }}
        onNodeClick={(node: any) => {
          setSelectedFile(node.id);
        }}
        onBackgroundClick={() => {
          setSelectedFile(null);
        }}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const color = getColor(node);
          const r = Math.sqrt(Math.max(4, node.val)) * 1.5;

          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();

          // Stroke highlighting for blast radius or selection
          if (blastRadius && node.id === blastRadius.targetId) {
            ctx.strokeStyle = '#e3b341';
            ctx.lineWidth = 3 / globalScale;
            ctx.stroke();
          } else if (blastRadius && blastRadius.affectedNodeIds.has(node.id)) {
            ctx.strokeStyle = '#ff5858';
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
          }

          // Labels
          if (graphConfig.showLabels && (globalScale >= 1.2 || node.val > 15)) {
            const fontSize = 10 / globalScale;
            const textY = node.y + r + fontSize / 2 + 2;
            
            ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let textColor = blastRadius && !blastRadius.affectedNodeIds.has(node.id) 
              ? "rgba(255,255,255,0.1)" 
              : '#c9d1d9';
            
            ctx.fillStyle = textColor;
            ctx.fillText(node.name, node.x, textY);
          }
        }}
        linkColor={(link: any) => {
          if (blastRadius) {
            const sId = link.source?.id || link.source;
            const tId = link.target?.id || link.target;
            if (blastRadius.affectedNodeIds.has(sId) && blastRadius.affectedNodeIds.has(tId)) {
              return "rgba(255, 88, 88, 0.8)";
            }
            return "rgba(255, 255, 255, 0.05)";
          }
          return "rgba(139, 148, 158, 0.3)";
        }}
        linkWidth={(link: any) => {
           return Math.max(1, Math.min(3, Math.sqrt(link.count) * 0.5));
        }}
        linkDirectionalArrowLength={(link: any) => {
           if (blastRadius && !blastRadius.affectedNodeIds.has(link.source?.id || link.source)) return 0;
           return 4;
        }}
        linkDirectionalArrowRelPos={1}
      />
    </div>
  );
}
