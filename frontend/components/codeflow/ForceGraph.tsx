"use client";

import React, { useEffect, useRef } from "react";
import { useCodeflow } from "../../context/CodeflowContext";
import { COLORS, LAYER_COLORS } from "../../lib/codeflow.constants";
import { measurePerformance } from "../../lib/performance.utils";
import * as d3 from "d3";

export default function ForceGraph() {
  const { analysisData, colorMode, graphConfig, setHoveredNode, folderFilter, blastRadius, selectFile, deselectFile, selectedFile, filteredFiles, filteredConnections } = useCodeflow();
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<any>(null);

  useEffect(() => {
    if (!analysisData || !containerRef.current) return;

    const startPerf = performance.now();
    const el = containerRef.current;
    // Clean up previous
    d3.select(el).selectAll('*').remove();

    const w = el.clientWidth || 800;
    const h = el.clientHeight || 600;

    // --- Data preparation (identical to index.html) ---
    const currentFiles = folderFilter
      ? filteredFiles.filter(f => f.folder === folderFilter || f.folder.startsWith(folderFilter + '/'))
      : filteredFiles;

    const fileIds = new Set(currentFiles.map(f => f.path));

    const nodes: any[] = currentFiles.map(f => ({
      id: f.path,
      name: f.name,
      folder: f.folder,
      fnCount: f.functions?.length || 0,
      layer: f.layer,
      churn: f.churn || 0,
    }));

    const linkMap = new Map<string, any>();
    filteredConnections.forEach(c => {
      if (!fileIds.has(c.source) || !fileIds.has(c.target)) return;
      if (c.source === c.target) return;
      const k = `${c.source}|${c.target}`;
      if (!linkMap.has(k)) linkMap.set(k, { source: c.source, target: c.target, count: 0 });
      linkMap.get(k)!.count += c.count;
    });
    const links = Array.from(linkMap.values());

    // --- Helpers (identical to index.html) ---
    function getR(d: any) { return Math.max(8, Math.min(24, 5 + d.fnCount * 0.8)); }

    // Colors and highlights are handled in the secondary useEffect to prevent simulation restarts
    function getC(d: any) { return '#30363d'; } // Placeholder

    // --- Folder centers (identical to index.html) ---
    const folders = [...new Set(nodes.map(n => n.folder))];
    const cols = Math.max(2, Math.ceil(Math.sqrt(folders.length)));
    const cw = w / (cols + 1);
    const ch = h / (Math.ceil(folders.length / cols) + 1);
    const centers: Record<string, { x: number; y: number }> = {};
    folders.forEach((f, i) => {
      centers[f] = { x: (i % cols + 1) * cw, y: (Math.floor(i / cols) + 1) * ch };
    });

    // --- SVG Setup ---
    const svg = d3.select(el).append('svg')
      .attr('width', w)
      .attr('height', h)
      .style('cursor', 'grab')
      .style('background', '#0a0a0f');

    const container = svg.append('g');
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'arr')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 14)
      .attr('markerWidth', 4)
      .attr('markerHeight', 4)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4')
      .attr('fill', '#444');

    const hullLayer = container.append('g');
    const linkLayer = container.append('g');
    const nodeLayer = container.append('g');

    // --- Zoom ---
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on('zoom', (e) => { container.attr('transform', e.transform); });
    svg.call(zoom);

    // --- Force Simulation (identical to index.html) ---
    const sim = d3.forceSimulation(nodes);

    if (graphConfig.viewMode === 'force') {
      sim
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(graphConfig.linkDist).strength(0.3))
        .force('charge', d3.forceManyBody().strength(-graphConfig.spacing).distanceMax(400))
        .force('collision', d3.forceCollide().radius((d: any) => getR(d) + 12))
        .force('x', d3.forceX((d: any) => centers[d.folder] ? centers[d.folder].x : w / 2).strength(0.15))
        .force('y', d3.forceY((d: any) => centers[d.folder] ? centers[d.folder].y : h / 2).strength(0.15));
    } else if (graphConfig.viewMode === 'radial') {
      const r = Math.min(w, h) * 0.35;
      nodes.forEach((n, i) => {
        n.angle = i / nodes.length * 2 * Math.PI;
        n.targetX = w / 2 + Math.cos(n.angle) * r;
        n.targetY = h / 2 + Math.sin(n.angle) * r;
      });
      sim
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(graphConfig.linkDist * 0.5).strength(0.05))
        .force('charge', d3.forceManyBody().strength(-graphConfig.spacing * 0.3))
        .force('collision', d3.forceCollide().radius((d: any) => getR(d) + 8))
        .force('x', d3.forceX((d: any) => d.targetX).strength(0.8))
        .force('y', d3.forceY((d: any) => d.targetY).strength(0.8));
    } else if (graphConfig.viewMode === 'hierarchical') {
      const layerOrder: Record<string, number> = { util: 0, model: 1, service: 2, controller: 3, view: 4, test: 5, config: 6, modules: 7, forms: 8, classes: 9 };
      const layerGroups: Record<string, any[]> = {};
      nodes.forEach(n => { const l = n.layer || 'util'; if (!layerGroups[l]) layerGroups[l] = []; layerGroups[l].push(n); });
      const sortedLayers = Object.keys(layerGroups).sort((a, b) => (layerOrder[a] || 99) - (layerOrder[b] || 99));
      sortedLayers.forEach((l, li) => {
        const g = layerGroups[l];
        const colW = w / (sortedLayers.length + 1);
        g.forEach((n, ni) => { n.targetX = (li + 1) * colW; n.targetY = (ni + 1) * h / (g.length + 1); });
      });
      sim
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(graphConfig.linkDist).strength(0.1))
        .force('charge', d3.forceManyBody().strength(-graphConfig.spacing * 0.5).distanceMax(200))
        .force('collision', d3.forceCollide().radius((d: any) => getR(d) + 10))
        .force('x', d3.forceX((d: any) => d.targetX || w / 2).strength(0.9))
        .force('y', d3.forceY((d: any) => d.targetY || h / 2).strength(0.3));
    } else if (graphConfig.viewMode === 'grid') {
      const gridCols = Math.ceil(Math.sqrt(nodes.length));
      const cellW = w / (gridCols + 1);
      const cellH = h / (Math.ceil(nodes.length / gridCols) + 1);
      nodes.forEach((n, i) => { n.targetX = (i % gridCols + 1) * cellW; n.targetY = (Math.floor(i / gridCols) + 1) * cellH; });
      sim
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(graphConfig.linkDist * 1.5).strength(0.02))
        .force('collision', d3.forceCollide().radius((d: any) => getR(d) + 15))
        .force('x', d3.forceX((d: any) => d.targetX).strength(1))
        .force('y', d3.forceY((d: any) => d.targetY).strength(1));
    } else if (graphConfig.viewMode === 'metro') {
      const roots = nodes.filter(n => !links.some(l => (l.target.id || l.target) === n.id));
      if (!roots.length && nodes.length) roots.push(nodes[0]);
      const lineY = 80;
      const lineSpacing = Math.min(120, (h - 160) / Math.max(1, roots.length));
      roots.forEach((root, li) => {
        const visited = new Set<string>();
        const queue = [root.id];
        let x = 80;
        while (queue.length) {
          const id = queue.shift()!;
          if (visited.has(id)) continue;
          visited.add(id);
          const node = nodes.find(n => n.id === id);
          if (node) { node.targetX = x; node.targetY = lineY + li * lineSpacing; x += graphConfig.spacing * 0.8; }
          links.forEach(l => {
            const s = l.source.id || l.source;
            const t = l.target.id || l.target;
            if (s === id && !visited.has(t)) queue.push(t);
          });
        }
      });
      nodes.filter(n => !n.targetX).forEach((n, i) => { n.targetX = 80 + i * 50; n.targetY = h - 80; });
      sim
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(graphConfig.linkDist).strength(0.05))
        .force('collision', d3.forceCollide().radius((d: any) => getR(d) + 12))
        .force('x', d3.forceX((d: any) => d.targetX || w / 2).strength(0.95))
        .force('y', d3.forceY((d: any) => d.targetY || h / 2).strength(0.95));
    }

    // Adaptive simulation parameters
    const isLargeGraph = nodes.length > 300;
    sim.velocityDecay(isLargeGraph ? 0.7 : 0.6).alphaDecay(isLargeGraph ? 0.08 : 0.05);
    simRef.current = sim;

    // --- Links ---
    const link = linkLayer.selectAll('.edge-path')
      .data(links)
      .join('path')
      .attr('class', 'edge-path')
      .attr('fill', 'none')
      .attr('stroke', '#333')
      .attr('stroke-width', (d: any) => Math.max(1, Math.min(2, Math.sqrt(d.count) * 0.3)))
      .attr('stroke-opacity', 0.4)
      .attr('marker-end', 'url(#arr)');

    // --- Nodes ---
    const node = nodeLayer.selectAll<SVGGElement, any>('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer');

    // Drag
    node.call(d3.drag<SVGGElement, any>()
      .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.1).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }) as any);

    // Click
    node.on('click', (e, d) => { e.stopPropagation(); selectFile(d.id); });

    // Hover
    node.on('mouseenter', (e, d) => {
      setHoveredNode(d);
    }).on('mouseleave', () => {
      setHoveredNode(null);
    });

    // Clear selection on background click
    svg.on('click', (e) => {
      if (e.target === svg.node()) {
        deselectFile();
      }
    });

    // Node circles
    node.append('circle')
      .attr('class', 'nc')
      .attr('r', getR)
      .attr('fill', getC)
      .attr('stroke', (d: any) => {
        const c = d3.color(getC(d));
        return c ? c.brighter(0.3).formatHex() : '#fff';
      })
      .attr('stroke-width', 1.5);

    // Labels
    if (!isLargeGraph || graphConfig.showLabels) {
      node.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', (d: any) => getR(d) + 12)
        .attr('fill', '#e2e8f0')
        .attr('font-size', '10px')
        .attr('font-family', '"JetBrains Mono", system-ui, sans-serif')
        .attr('font-weight', '500')
        .attr('paint-order', 'stroke')
        .attr('stroke', '#0a0a0f')
        .attr('stroke-width', '3px')
        .attr('stroke-linejoin', 'round')
        .attr('pointer-events', 'none')
        .text((d: any) => {
          const n = d.name;
          return n.length > 18 ? n.slice(0, 16) + '…' : n;
        });
    }

    // --- Hulls (identical to index.html) ---
    const nodesByFolder: Record<string, any[]> = {};
    folders.forEach(f => { nodesByFolder[f] = nodes.filter(n => n.folder === f); });

    function updateHulls() {
      hullLayer.selectAll('*').remove();
      folders.forEach(f => {
        const fn = nodesByFolder[f];
        if (!fn || fn.length < 1) return;
        const pad = 30;
        const pts: [number, number][] = [];
        fn.forEach(n => {
          if (n.x && n.y) {
            pts.push([n.x - pad, n.y - pad], [n.x + pad, n.y - pad], [n.x - pad, n.y + pad], [n.x + pad, n.y + pad]);
          }
        });
        if (pts.length < 3) return;
        const hull = d3.polygonHull(pts);
        if (hull) {
          const color = COLORS[folders.indexOf(f) % COLORS.length];
          hullLayer.append('path')
            .attr('d', 'M' + hull.join('L') + 'Z')
            .attr('fill', color)
            .attr('fill-opacity', 0.04)
            .attr('stroke', color)
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.25)
            .attr('rx', 8);
          const cx = d3.mean(fn, (n: any) => n.x);
          const cy = (d3.min(fn, (n: any) => n.y) || 0) - pad - 8;
          hullLayer.append('text')
            .attr('x', cx || 0)
            .attr('y', cy)
            .attr('text-anchor', 'middle')
            .attr('fill', color)
            .attr('font-size', '10px')
            .attr('font-family', '"JetBrains Mono", monospace')
            .attr('font-weight', '600')
            .attr('opacity', 0.7)
            .text(f || 'root');
        }
      });
    }

    // --- Tick ---
    const hullInterval = isLargeGraph ? 5 : 1;
    let tickCount = 0;

    sim.on('tick', () => {
      if (graphConfig.curvedLinks) {
        link.attr('d', (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy);
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
      } else {
        link.attr('d', (d: any) => `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`);
      }
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      tickCount++;
      if (tickCount % hullInterval === 0) updateHulls();
    });

    // Labels visibility
    node.selectAll('text').attr('opacity', (!isLargeGraph || graphConfig.showLabels) ? 1 : 0);

    // --- Toolbar events ---
    const handleZoomIn = () => svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    const handleZoomOut = () => svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.3);
    const handleResetZoom = () => svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    const handleFitView = () => svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);

    window.addEventListener("codeflow:zoomIn", handleZoomIn);
    window.addEventListener("codeflow:zoomOut", handleZoomOut);
    window.addEventListener("codeflow:resetZoom", handleResetZoom);
    window.addEventListener("codeflow:fitView", handleFitView);

    const endPerf = performance.now();
    console.log(`[Performance] ForceGraph rendering complete in ${(endPerf - startPerf).toFixed(2)}ms`);

    return () => {
      sim.stop();
      window.removeEventListener("codeflow:zoomIn", handleZoomIn);
      window.removeEventListener("codeflow:zoomOut", handleZoomOut);
      window.removeEventListener("codeflow:resetZoom", handleResetZoom);
      window.removeEventListener("codeflow:fitView", handleFitView);
    };
  }, [analysisData, graphConfig, folderFilter, setHoveredNode, selectFile, deselectFile, filteredFiles, filteredConnections]);

  // Secondary effect to handle dynamic coloring and blast radius highlighting without restarting simulation
  useEffect(() => {
    if (!analysisData || !containerRef.current) return;
    
    const svg = d3.select(containerRef.current).select('svg');
    if (svg.empty()) return;

    const colorMap: Record<string, string> = {};
    if (colorMode === 'folder') {
      analysisData.folders.forEach((f, i) => { colorMap[f] = COLORS[i % COLORS.length]; });
      colorMap['root'] = COLORS[0];
    } else if (colorMode === 'layer') {
      analysisData.files.forEach(f => { colorMap[f.path] = LAYER_COLORS[f.layer] || COLORS[0]; });
    } else if (colorMode === 'churn') {
      const maxC = Math.max(...analysisData.files.map(f => f.churn || 0)) || 1;
      analysisData.files.forEach(f => {
        const r = (f.churn || 0) / maxC;
        colorMap[f.path] = r > 0.7 ? '#ff5f5f' : r > 0.4 ? '#ff9f43' : '#22c55e';
      });
    }

    const affectedSet = blastRadius ? new Set(blastRadius.affected) : new Set();

    function getC(d: any) {
      if (blastRadius && affectedSet.size > 0) {
        if (d.id === selectedFile) return '#ff5f5f'; // HTML uses red for selected
        if (affectedSet.has(d.id)) return '#ff9f43'; // HTML uses orange for affected
        return colorMode === 'folder' ? (colorMap[d.folder] || COLORS[0]) :
               colorMode === 'layer' ? (LAYER_COLORS[d.layer] || LAYER_COLORS['unknown']) :
               (colorMap[d.id] || '#22c55e');
      }
      if (colorMode === 'folder') return colorMap[d.folder] || COLORS[0];
      if (colorMode === 'layer') return LAYER_COLORS[d.layer] || LAYER_COLORS['unknown'];
      if (colorMode === 'churn') return colorMap[d.id] || '#22c55e';
      return COLORS[0];
    }

    svg.selectAll('.nc').transition().duration(200)
      .attr('opacity', (d: any) => { if (selectedFile && d.id === selectedFile) return 1; if (selectedFile && affectedSet.has(d.id)) return 1; return selectedFile ? 0.2 : 1; })
      .attr('fill', getC)
      .attr('stroke', (d: any) => { const c = d3.color(getC(d)); return c ? c.brighter(0.3).formatHex() : '#fff'; });

    svg.selectAll('.edge-path').transition().duration(200)
      .attr('stroke-opacity', (l: any) => { const s = l.source.id || l.source; const t = l.target.id || l.target; if (s === selectedFile || t === selectedFile) return 0.8; return selectedFile ? 0.05 : 0.4; })
      .attr('stroke', (l: any) => { const s = l.source.id || l.source; const t = l.target.id || l.target; if (s === selectedFile || t === selectedFile) return '#58a6ff'; return '#333'; });

  }, [analysisData, colorMode, selectedFile, blastRadius]);

  if (!analysisData) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-pulse text-[#8b949e]">Loading visualization...</div>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#0a0a0f]" />;
}
