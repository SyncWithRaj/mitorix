"use client";

import React, { useState } from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { X, Download, FileJson, FileText, Image, FileCode2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ExportModal() {
  const { analysisData, showExportModal, setShowExportModal } = useCodeflow();

  if (!showExportModal || !analysisData) return null;

  const exportSVG = () => {
    const svgEl = document.querySelector(".d3-svg") || document.querySelector("svg");
    if (!svgEl) {
      toast.error("No graph visualization found to export");
      return;
    }
    const svgClone = svgEl.cloneNode(true) as SVGElement;
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgClone.setAttribute("width", svgEl.clientWidth.toString());
    svgClone.setAttribute("height", svgEl.clientHeight.toString());
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = "text{font-family:JetBrains Mono,monospace;pointer-events:none}";
    svgClone.insertBefore(style, svgClone.firstChild);

    const blob = new Blob([new XMLSerializer().serializeToString(svgClone)], {
      type: "image/svg+xml",
    });
    downloadBlob(blob, `codeflow-graph-${Date.now()}.svg`);
    toast.success("Graph exported as SVG");
  };

  const exportJSON = () => {
    const data = {
      stats: analysisData.stats,
      files: analysisData.files.map((f) => ({
        path: f.path,
        fns: f.functions.length,
        layer: f.layer,
        lines: f.lines,
        dependencies: f.dependencies || [],
      })),
      connections: analysisData.connections,
      issues: analysisData.issues,
      patterns: analysisData.patterns,
      security: analysisData.securityIssues,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    downloadBlob(blob, `codeflow-analysis.json`);
    toast.success("Analysis exported as JSON");
  };

  const generateReport = (format: "md" | "txt") => {
    const repo = "Repository Analysis";
    const h = analysisData.health;

    if (format === "md") {
      let md = `# CodeFlow Analysis Report\n\n`;
      md += `**Repository:** ${repo}\n`;
      md += `**Analyzed:** ${new Date().toLocaleString()}\n\n`;
      md += `## Summary\n\n`;
      md += `| Metric | Value |\n|--------|-------|\n`;
      md += `| Health Score | ${h?.score || 0}/100 (${h?.grade || "F"}) |\n`;
      md += `| Files | ${analysisData.stats.files} |\n`;
      md += `| Functions | ${analysisData.stats.functions} |\n`;
      md += `| Lines of Code | ${analysisData.stats.loc.toLocaleString()} |\n`;
      md += `| Dependencies | ${analysisData.stats.connections} |\n`;
      md += `| Unused Functions | ${analysisData.stats.dead} |\n`;
      md += `| Security Issues | ${analysisData.securityIssues.length} |\n\n`;

      const blob = new Blob([md], { type: "text/markdown" });
      downloadBlob(blob, `codeflow-report.md`);
      toast.success("Report exported as Markdown");
    } else {
      let txt = `CODEFLOW ANALYSIS REPORT\n========================\n\n`;
      txt += `Health Score: ${h?.score || 0}/100 (Grade: ${h?.grade || "F"})\n`;
      txt += `Files: ${analysisData.stats.files}\n`;
      txt += `Functions: ${analysisData.stats.functions}\n`;
      const blob = new Blob([txt], { type: "text/plain" });
      downloadBlob(blob, `codeflow-report.txt`);
      toast.success("Report exported as Text");
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-[#c9d1d9]" />
            <h2 className="text-lg font-bold text-[#c9d1d9]">Export Analysis</h2>
          </div>
          <button
            className="text-[#8b949e] hover:text-[#c9d1d9] transition"
            onClick={() => setShowExportModal(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <button
            onClick={exportJSON}
            className="flex items-center gap-3 p-3 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] rounded-lg transition text-left"
          >
            <FileJson className="w-6 h-6 text-[#a855f7]" />
            <div>
              <div className="font-bold text-[#c9d1d9]">JSON Raw Data</div>
              <div className="text-xs text-[#8b949e]">
                Full architecture metrics and connections array
              </div>
            </div>
          </button>
          <button
            onClick={() => generateReport("md")}
            className="flex items-center gap-3 p-3 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] rounded-lg transition text-left"
          >
            <FileText className="w-6 h-6 text-[#58a6ff]" />
            <div>
              <div className="font-bold text-[#c9d1d9]">Markdown Report</div>
              <div className="text-xs text-[#8b949e]">
                Detailed document with issues and metrics
              </div>
            </div>
          </button>
          <button
            onClick={() => generateReport("txt")}
            className="flex items-center gap-3 p-3 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] rounded-lg transition text-left"
          >
            <FileCode2 className="w-6 h-6 text-[#8b949e]" />
            <div>
              <div className="font-bold text-[#c9d1d9]">Plain Text</div>
              <div className="text-xs text-[#8b949e]">Simple readable summary format</div>
            </div>
          </button>
          <button
            onClick={exportSVG}
            className="flex items-center gap-3 p-3 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] rounded-lg transition text-left"
          >
            <Image className="w-6 h-6 text-[#00ff9d]" />
            <div>
              <div className="font-bold text-[#c9d1d9]">SVG Vector Graphic</div>
              <div className="text-xs text-[#8b949e]">
                High resolution export of current visualization
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
