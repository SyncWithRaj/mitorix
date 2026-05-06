"use client";

import React, { useState } from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { X, GitPullRequest, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import api from "../../../lib/axios";
import toast from "react-hot-toast";

export default function PRAnalysisModal({ repoId }: { repoId: string }) {
  const { analysisData, showPRModal, setShowPRModal } = useCodeflow();
  const [prNumber, setPrNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [prResult, setPrResult] = useState<any>(null);

  if (!showPRModal || !analysisData) return null;

  const analyzePR = async () => {
    if (!prNumber) return;
    setLoading(true);
    try {
      const res = await api.get(`/codeflow/pr/${repoId}/${prNumber}`);
      if (res.data.success) {
        // Run PR risk logic
        const changedFiles = res.data.data.files;
        let score = 0;
        let factors = [];
        let totalBlast = 0;

        changedFiles.forEach((f: any) => {
          const existing = analysisData.files.find(df => df.path === f.filename);
          if (existing) {
            const importsCount = analysisData.connections.filter(c => c.target === f.filename).length;
            totalBlast += importsCount;
          }
        });

        if (totalBlast > 50) { score += 30; factors.push(`High blast radius (${totalBlast} files)`); }
        else if (totalBlast > 20) { score += 15; factors.push("Moderate blast radius"); }
        if (changedFiles.length > 10) { score += 20; factors.push(`Many files changed (${changedFiles.length})`); }
        const totalChanges = res.data.data.additions + res.data.data.deletions;
        if (totalChanges > 500) { score += 25; factors.push(`Large changeset (${totalChanges} lines)`); }

        score = Math.min(100, score);
        const level = score >= 70 ? "critical" : score >= 40 ? "high" : score >= 20 ? "medium" : "low";

        setPrResult({ score, level, factors, totalBlast, changedFiles });
      } else {
        toast.error("Failed to analyze PR");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to analyze PR");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    if (level === "critical") return "text-[#f85149]";
    if (level === "high") return "text-[#ff9f43]";
    if (level === "medium") return "text-[#eab308]";
    return "text-[#2ea043]";
  };

  return (
    <div className="fixed inset-0 z-[950] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-[#a855f7]" />
            <h2 className="text-lg font-bold text-[#c9d1d9]">PR Risk Analysis</h2>
          </div>
          <button 
            className="text-[#8b949e] hover:text-[#c9d1d9] transition"
            onClick={() => { setShowPRModal(false); setPrResult(null); setPrNumber(""); }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!prResult && (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-[#c9d1d9]">Enter Pull Request Number</label>
              <div className="flex gap-2">
                <input 
                  type="number"
                  placeholder="e.g. 42"
                  className="flex-1 bg-[#010409] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none"
                  value={prNumber}
                  onChange={(e) => setPrNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && analyzePR()}
                />
                <button 
                  className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] rounded-md font-bold text-sm text-white transition disabled:opacity-50"
                  onClick={analyzePR}
                  disabled={!prNumber || loading}
                >
                  {loading ? "Analyzing..." : "Analyze"}
                </button>
              </div>
              <p className="text-xs text-[#8b949e]">This will calculate the blast radius and architectural risk of the changes in this PR.</p>
            </div>
          )}

          {prResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex flex-col items-center justify-center">
                  <div className={`text-4xl font-bold font-mono mb-1 ${getRiskColor(prResult.level)}`}>
                    {prResult.score}
                  </div>
                  <div className="text-xs font-bold uppercase text-[#8b949e]">Risk Score</div>
                </div>
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex flex-col justify-center gap-2">
                  <div className="flex items-center gap-2">
                    {prResult.level === "critical" || prResult.level === "high" ? <ShieldAlert className="w-4 h-4 text-[#f85149]"/> : <CheckCircle className="w-4 h-4 text-[#2ea043]"/>}
                    <span className="text-sm font-bold capitalize text-[#c9d1d9]">{prResult.level} Risk</span>
                  </div>
                  <div className="text-xs text-[#8b949e]">Blast Radius: {prResult.totalBlast} dependencies</div>
                  <div className="text-xs text-[#8b949e]">Files Changed: {prResult.changedFiles?.length}</div>
                </div>
              </div>

              {prResult.factors.length > 0 && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                  <h3 className="text-xs font-bold uppercase text-[#8b949e] mb-2 px-1">Risk Factors</h3>
                  <div className="space-y-2">
                    {prResult.factors.map((factor: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-[#c9d1d9] bg-[#0d1117] p-2 rounded border border-[#30363d]">
                        <AlertTriangle className="w-4 h-4 text-[#eab308] mt-0.5 shrink-0" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                className="w-full py-2 bg-[#21262d] hover:bg-[#30363d] rounded-md font-bold text-sm text-[#c9d1d9] border border-[#30363d] transition"
                onClick={() => setPrResult(null)}
              >
                Analyze Another PR
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
