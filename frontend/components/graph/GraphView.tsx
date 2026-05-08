"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useCodeflow } from "../../context/CodeflowContext";
import api from "@/lib/axios";
import { Flame, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

import toast from "react-hot-toast";

// Dynamically import ForceGraph2D (avoids SSR window undef errors)
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export default function GraphView({ repoId }: { repoId: string }) {
  const searchParams = useSearchParams();
  const blastRadiusParam = searchParams.get("blastRadius");
  
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const { selectFile, selectedFile, setRightTab } = useCodeflow();
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [hoverNode, setHoverNode] = useState<any | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringTooltipRef = useRef(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [blastRadius, setBlastRadius] = useState<{ targetId: string, affectedNodeIds: Set<string> } | null>(null);
  const hasAutoTriggeredRef = useRef(false);

  const handleNodeHover = useCallback((node: any) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    if (node) {
      setHoverNode(node);
    } else {
      // Delay closing so user can move mouse into tooltip
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isHoveringTooltipRef.current) {
          setHoverNode(null);
        }
      }, 300);
    }
  }, []);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await api.get(`/repos/${repoId}/graph`);
        
        // ensure format fits force-graph (has target/source identifiers that match node.id)
        if (res.data.success) {
          // Filter out detached "anonymous_arrow" or redundant "anonymous_function" nodes
          const filteredNodes = res.data.graph.nodes.filter((n: any) => n.name !== "anonymous_arrow" && n.name !== "anonymous_function");
          const validNodeIds = new Set(filteredNodes.map((n: any) => n.id));
          
          // Only keep links between valid remaining nodes
          const filteredLinks = res.data.graph.edges.filter((e: any) => {
             const sourceId = e.source?.id || e.source;
             const targetId = e.target?.id || e.target;
             return validNodeIds.has(sourceId) && validNodeIds.has(targetId);
          });

          setGraphData({
            nodes: filteredNodes,
            links: filteredLinks
          });
          
          // Collapse all files by default so code entities are not visible immediately
          const defaultCollapsed = new Set<string>();
          res.data.graph.nodes.forEach((n: any) => {
            if (n.type === "file") defaultCollapsed.add(n.id);
          });
          setCollapsedNodes(defaultCollapsed);
        }
      } catch (err) {
        console.error("Error fetching graph data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, [repoId]);

  const visibleGraphData = useMemo(() => {
    const hiddenNodes = new Set<string>();
    
    // Find all descendants of collapsed folders recursively
    const findDescendants = (parentId: string) => {
      // link source/target could be objects if d3 has already parsed them
      const children = graphData.links
        .filter((l: any) => (l.source?.id || l.source) === parentId && l.label === "contains")
        .map((l: any) => l.target?.id || l.target);
        
      children.forEach((childId: string) => {
        hiddenNodes.add(childId);
        findDescendants(childId);
      });
    };

    collapsedNodes.forEach(nodeId => findDescendants(nodeId));

    const nodes = graphData.nodes.filter((n: any) => !hiddenNodes.has(n.id));
    const links = graphData.links.filter((l: any) => {
      const sourceId = l.source?.id || l.source;
      const targetId = l.target?.id || l.target;
      return !hiddenNodes.has(sourceId) && !hiddenNodes.has(targetId);
    });
    
    return { nodes, links };
  }, [graphData, collapsedNodes]);

  const triggerBlastRadius = useCallback(async (targetNode: any) => {
    if (targetNode.type === "folder") {
      toast.error("Blast radius analysis is currently only available for files and functions.");
      return;
    }
    
    const filePath = targetNode.type === "file" ? targetNode.id : targetNode.path;
    
    if (!filePath) return;

    try {
      const toastId = toast.loading("Analyzing structural impact...", { id: "blast-radius" });
      
      const res = await api.get(`/codeflow/blast/${repoId}/${encodeURIComponent(filePath)}`);
      
      toast.dismiss(toastId);
      
      if (res.data.success && res.data.blast) {
        const { affected, transitive } = res.data.blast;
        const affectedFiles = new Set<string>([filePath, ...affected, ...transitive]);
        
        const affectedNodeIds = new Set<string>();
        
        graphData.nodes.forEach((n: any) => {
          if (n.type === "file" && affectedFiles.has(n.id)) {
            affectedNodeIds.add(n.id);
          }
          else if (n.type !== "folder" && n.type !== "file" && n.path && affectedFiles.has(n.path)) {
            affectedNodeIds.add(n.id);
          }
        });
        
        setBlastRadius({ targetId: targetNode.id, affectedNodeIds });
      } else {
        toast.error("Failed to calculate blast radius.", { id: "blast-radius" });
      }
    } catch (err: unknown) {
      toast.error((err as any).response?.data?.message || "Failed to calculate blast radius.", { id: "blast-radius" });
    } finally {
      setHoverNode(null);
    }
  }, [repoId, graphData.nodes]);

  // Auto-trigger blast radius if query parameter is present
  useEffect(() => {
    if (blastRadiusParam && graphData.nodes.length > 0 && !hasAutoTriggeredRef.current) {
      const targetNode = graphData.nodes.find((n: any) => 
        n.id === blastRadiusParam || n.id.endsWith(blastRadiusParam)
      );
      if (targetNode) {
        hasAutoTriggeredRef.current = true;
        
        // Uncollapse the parent folders so the target and its dependencies are visible
        setCollapsedNodes(prev => {
          const newCollapsed = new Set(prev);
          const pathParts = (targetNode.path || targetNode.id).split("/");
          pathParts.pop(); 
          let currentPath = "";
          for (const part of pathParts) {
             currentPath = currentPath ? `${currentPath}/${part}` : part;
             newCollapsed.delete(currentPath);
          }
          return newCollapsed;
        });
        
        // Slight delay to let uncollapsing render
        setTimeout(() => {
          triggerBlastRadius(targetNode);
        }, 50);
      }
    }
  }, [blastRadiusParam, graphData.nodes, triggerBlastRadius]);

  // Adjust force graph physics to make it cleaner and less clumped
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-400); // push nodes apart
      fgRef.current.d3Force('link').distance(50); // space out links
    }
  }, [visibleGraphData]);

  const handleNodeClick = useCallback((node: any) => {
    if (node.type === "folder" || node.type === "file") {
      setCollapsedNodes(prev => {
        const next = new Set(prev);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
    }

    if (node.type === "folder") return;

    if (node.type === "file") {
      selectFile(node.id);
      setRightTab("code");
    } else {
      selectFile(node.path || node.id);
      setRightTab("code");
    }
  }, [selectFile, setRightTab]);

  if (loading) {
    return (
      <div className="flex w-full h-full items-center justify-center text-[#c9d1d9]">
        <svg className="animate-spin h-8 w-8 text-[#58a6ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (containerRef.current && !isHoveringTooltipRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({ 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top 
      });
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-[#0d1117] overflow-hidden relative group border-2 border-[#30363d] rounded-xl flex-grow"
      onPointerMove={handlePointerMove}
    >
      <div className="absolute top-4 left-4 z-10 bg-[#161b22] border border-[#30363d] px-4 py-2 rounded-lg shadow-lg">
        <h3 className="text-white text-sm font-semibold">Codebase Visualizer</h3>
        <p className="text-xs text-[#8b949e]">Click a folder to toggle collapse</p>
        <p className="text-xs text-[#8b949e]">Click a file to view code</p>
      </div>

      {blastRadius && (
        <div className="absolute top-4 right-4 z-10 bg-[#ff5858]/10 border border-[#ff5858]/50 px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(255,88,88,0.2)] flex items-center gap-3 backdrop-blur-md animate-fadeInUp">
          <div className="flex items-center gap-2">
            <Flame className="text-[#ff5858] animate-pulse" size={18} />
            <div>
              <div className="text-[#ff5858] text-sm font-bold tracking-wide">BLAST RADIUS ACTIVE</div>
              <div className="text-xs text-[#c9d1d9] font-medium">{blastRadius.affectedNodeIds.size - 1} dependent entities affected</div>
            </div>
          </div>
          <button 
            onClick={() => setBlastRadius(null)}
            className="p-1.5 ml-2 hover:bg-[#ff5858]/20 rounded-md transition text-[#ff5858] active:scale-95 cursor-pointer"
            title="Clear Analysis"
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {hoverNode && (
        <div 
          className="absolute z-50 bg-[#161b22] border border-[#30363d] px-4 py-3 rounded-xl shadow-2xl pointer-events-auto transition-opacity duration-150"
          style={{ left: mousePos.x + 15, top: mousePos.y + 15, minWidth: '220px' }}
          onMouseEnter={() => { isHoveringTooltipRef.current = true; }}
          onMouseLeave={() => { 
            isHoveringTooltipRef.current = false; 
            setHoverNode(null); 
          }}
        >
          <div className="font-semibold text-white mb-1 break-all">{hoverNode.name}</div>
          <div className="text-xs text-[#8b949e] mb-2 font-mono break-all pb-2 border-b border-[#30363d]">{hoverNode.id}</div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-[#8b949e]">Type</div>
            <div className="text-right text-[#c9d1d9] capitalize font-medium">{hoverNode.type}</div>
            
            {hoverNode.type === "folder" ? (
              <>
                <div className="text-[#8b949e]">Descendants</div>
                <div className="text-right text-[#c9d1d9]">{hoverNode.metadata?.descendentCount || 0}</div>
                <div className="text-[#8b949e]">Status</div>
                <div className="text-right text-[#c9d1d9]">{collapsedNodes.has(hoverNode.id) ? "Collapsed" : "Expanded"}</div>
              </>
            ) : hoverNode.type === "file" ? (
              <>
                <div className="text-[#8b949e]">Lines</div>
                <div className="text-right text-[#c9d1d9]">{hoverNode.metadata?.totalLines || 0}</div>
                <div className="text-[#8b949e]">Size</div>
                <div className="text-right text-[#c9d1d9]">{((hoverNode.metadata?.fileSize || 0) / 1024).toFixed(1)} KB</div>
                {hoverNode.metadata?.hasReactComponent && <div className="col-span-2 text-[#58a6ff] text-right font-semibold">React Component</div>}
                {hoverNode.metadata?.isBackendFile && <div className="col-span-2 text-[#2ea043] text-right font-semibold">Backend API</div>}
                {hoverNode.metadata?.isTestFile && <div className="col-span-2 text-[#d2a8ff] text-right font-semibold">Test File</div>}
                {hoverNode.metadata?.hasDefaultExport && <div className="col-span-2 text-[#e3b341] text-right font-semibold">Default Export</div>}
                
                <div className="text-[#8b949e] border-t border-[#30363d] pt-1 mt-1 col-span-2">Entities</div>
                <div className="text-right text-[#c9d1d9] col-span-2">{collapsedNodes.has(hoverNode.id) ? "Hidden (Click to expand)" : "Visible"}</div>
                
                <div className="col-span-2 mt-2 pt-2 border-t border-[#30363d]">
                   <button 
                     onClick={(e) => { e.stopPropagation(); triggerBlastRadius(hoverNode); }}
                     className="cursor-pointer w-full py-1.5 flex items-center justify-center gap-2 bg-[#ff5858]/10 hover:bg-[#ff5858]/20 text-[#ff5858] border border-[#ff5858]/30 hover:border-[#ff5858] rounded text-xs font-bold uppercase tracking-wider transition-all"
                   >
                     <Flame size={14} /> Analyze Impact
                   </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-[#8b949e]">Path</div>
                <div className="text-right text-[#c9d1d9] font-mono truncate" title={hoverNode.path}>{hoverNode.path}</div>
                {(hoverNode.metadata?.startLine !== undefined) && (
                   <>
                    <div className="text-[#8b949e]">Lines</div>
                    <div className="text-right text-[#c9d1d9]">{hoverNode.metadata.startLine} - {hoverNode.metadata.endLine}</div>
                   </>
                )}
                {hoverNode.metadata?.returnType && (
                   <>
                    <div className="text-[#8b949e]">Returns</div>
                    <div className="text-right text-[#c9d1d9] font-mono">{hoverNode.metadata.returnType}</div>
                   </>
                )}
                
                <div className="col-span-2 mt-2 pt-2 border-t border-[#30363d]">
                   <button 
                     onClick={(e) => { e.stopPropagation(); triggerBlastRadius(hoverNode); }}
                     className="cursor-pointer w-full py-1.5 flex items-center justify-center gap-2 bg-[#ff5858]/10 hover:bg-[#ff5858]/20 text-[#ff5858] border border-[#ff5858]/30 hover:border-[#ff5858] rounded text-xs font-bold uppercase tracking-wider transition-all"
                   >
                     <Flame size={14} /> Analyze Impact
                   </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      <ForceGraph2D
        ref={fgRef}
        graphData={visibleGraphData}
        nodeId="id"
        nodeLabel={() => ""} // disable native tooltip
        onNodeHover={handleNodeHover}
        nodeVal={(node: any) => node.type === "folder" ? Math.max(8, node.val) : node.val}
        
        // Custom canvas draw for nodes and their label text!
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          
          let color = "#c9d1d9";
          if (node.id === selectedFile) color = "#ff7b72";
          else if (node.type === "folder") color = collapsedNodes.has(node.id) ? "#a371f7" : "#e3b341"; // gold for folders
          else if (node.type === "file") {
            if (node.metadata?.hasReactComponent) color = "#58a6ff";
            else if (node.metadata?.isBackendFile) color = "#2ea043";
            else if (node.metadata?.isTestFile) color = "#d2a8ff";
            else color = "#c9d1d9";
          } else {
             color = ["function", "arrow", "method"].includes(node.type) ? "#d18616" :
                     ["class", "interface"].includes(node.type) ? "#4ec9b0" :
                     ["import", "export"].includes(node.type) ? "#c586c0" : "#569cd6";
          }

          // Handle Blast Radius Colors
          if (blastRadius) {
            if (node.id === blastRadius.targetId) {
              color = "#ffffff"; // Epicenter
            } else if (blastRadius.affectedNodeIds.has(node.id)) {
              color = "#ff5858"; // Affected
            } else {
              color = "#30363d"; // Dim unaffected
            }
          }

          const nodeSize = node.type === "folder" ? Math.max(8, node.val) : Math.max(4, node.val);
          const r = Math.sqrt(nodeSize) * 1.5; // Radius approx

          ctx.beginPath();
          if (node.type === "folder") {
            // Draw square for folder
            ctx.rect(node.x - r, node.y - r, r * 2, r * 2);
          } else if (node.type === "file") {
            // Draw circle for file
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
          } else {
            // Entities: smaller circles
            ctx.arc(node.x, node.y, r * 0.7, 0, 2 * Math.PI, false);
          }
          ctx.fillStyle = color;
          ctx.fill();

          // Highlight selection
          if (node.id === hoverNode?.id) {
             ctx.strokeStyle = '#ffffff';
             ctx.lineWidth = 1.5 / globalScale;
             ctx.stroke();
          } else if (blastRadius && blastRadius.targetId === node.id) {
             // Epicenter highlight
             ctx.strokeStyle = '#e3b341';
             ctx.lineWidth = 3 / globalScale;
             ctx.stroke();
          } else if (blastRadius && blastRadius.affectedNodeIds.has(node.id)) {
             // Affected nodes highlight
             ctx.strokeStyle = '#ff5858';
             ctx.lineWidth = 1.5 / globalScale;
             ctx.stroke();
          }

          // Draw Text Label below node if zoomed in, or if it's a major folder
          if (globalScale >= 1.2 || node.type === "folder" || node.type === "file") {
             const textY = node.y + r + fontSize / 2 + 2;
             ctx.font = `${fontSize}px Sans-Serif`;
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             let textColor = node.type === "folder" ? '#e3b341' : (node.type === "file" ? '#8b949e' : '#a0a0a0');
             if (blastRadius && !blastRadius.affectedNodeIds.has(node.id)) textColor = "rgba(255,255,255,0.1)";
             ctx.fillStyle = textColor; 
             ctx.fillText(label, node.x, textY);
          }

          // Explicitly draw +/- icon in the center of the square or file circle
          if (node.type === "folder" || node.type === "file") {
             ctx.fillStyle = '#1e1e1e';
             const iconSize = node.type === "folder" ? Math.max(fontSize * 1.2, r * 1.5) : Math.max(fontSize * 0.8, r * 1.2);
             ctx.font = `bold ${iconSize}px Sans-Serif`;
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText(collapsedNodes.has(node.id) ? '+' : '−', node.x, node.y);
          }
        }}
        
        linkDirectionalArrowLength={(link: any) => {
           if (blastRadius && !blastRadius.affectedNodeIds.has(link.source?.id || link.source)) return 0;
           return link.label === "contains" ? 0 : 3.5;
        }} 
        linkDirectionalArrowRelPos={1}
        linkColor={(link: any) => {
          if (blastRadius) {
            const sId = link.source?.id || link.source;
            const tId = link.target?.id || link.target;
            if (blastRadius.affectedNodeIds.has(sId) && blastRadius.affectedNodeIds.has(tId)) {
              return "rgba(255, 88, 88, 0.8)";
            }
            return "rgba(255, 255, 255, 0.02)"; // Dim unaffected
          }
          return link.label === "contains" ? "rgba(139, 148, 158, 0.2)" : "rgba(88, 166, 255, 0.5)";
        }}
        
        // Custom canvas draw for edge labels
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={(link: any, ctx, globalScale) => {
          const MAX_FONT_SIZE = 4;
          const LABEL_NODE_MARGIN = 4;

          const start = link.source;
          const end = link.target;

          // Ignore unbound links
          if (typeof start !== 'object' || typeof end !== 'object') return;

          // Never show cluttered label text for hierarchy links
          if (link.label === "contains") return; 

          // Hide text if blast radius is active and this link is not involved
          if (blastRadius && (!blastRadius.affectedNodeIds.has(start.id) || !blastRadius.affectedNodeIds.has(end.id))) {
             return;
          }

          const textPos = { x: start.x + (end.x - start.x) / 2, y: start.y + (end.y - start.y) / 2 };
          const relLink = { x: end.x - start.x, y: end.y - start.y };
          const maxTextLength = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) - LABEL_NODE_MARGIN * 2;

          let textAngle = Math.atan2(relLink.y, relLink.x);
          if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
          if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);

          const label = link.label;
          const fontSize = Math.min(MAX_FONT_SIZE, maxTextLength / label.length);
          if (fontSize < 1) return; // Hide unreadable microscopic text

          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.fillStyle = link.label === "contains" ? "rgba(139, 148, 158, 0.7)" : "rgba(88, 166, 255, 0.9)";
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          ctx.save();
          ctx.translate(textPos.x, textPos.y);
          ctx.rotate(textAngle);
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
}
