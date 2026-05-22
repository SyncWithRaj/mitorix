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
        const changedFiles = res.data.data.files;
        let score = 0;
        let factors = [];
        let totalBlast = 0;

        changedFiles.forEach((f: any) => {
          const existing = analysisData.files.find((df) => df.path === f.filename);
          if (existing) {
            const importsCount = analysisData.connections.filter(
              (c) => c.target === f.filename
            ).length;
            totalBlast += importsCount;
          }
        });

        if (totalBlast > 50) {
          score += 30;
          factors.push(`High blast radius (${totalBlast} files)`);
        } else if (totalBlast > 20) {
          score += 15;
          factors.push("Moderate blast radius");
        }
        if (changedFiles.length > 10) {
          score += 20;
          factors.push(`Many files changed (${changedFiles.length})`);
        }
        const totalChanges = res.data.data.additions + res.data.data.deletions;
        if (totalChanges > 500) {
          score += 25;
          factors.push(`Large changeset (${totalChanges} lines)`);
        }

        score = Math.min(100, score);
        const level =
          score >= 70 ? "critical" : score >= 40 ? "high" : score >= 20 ? "medium" : "low";

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
    if (level === "critical") return "text-red-500";
    if (level === "high") return "text-[#ff6b00]";
    if (level === "medium") return "text-[#ff8c00]";
    return "text-blue-500";
  };

  return (
    <div className="fixed inset-0 z-[950] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#000000] border border-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a] bg-[#050505]">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-[#ff6b00]" />
            <h2 className="text-lg font-bold text-[#e5e5e5]">PR Risk Analysis</h2>
          </div>
          <button
            className="text-[#737373] hover:text-[#e5e5e5] transition"
            onClick={() => {
              setShowPRModal(false);
              setPrResult(null);
              setPrNumber("");
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!prResult && (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-[#e5e5e5]">Enter Pull Request Number</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="e.g. 42"
                  className="flex-1 bg-[#050505] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-[#e5e5e5] focus:border-[#ff6b00] focus:outline-none"
                  value={prNumber}
                  onChange={(e) => setPrNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && analyzePR()}
                />
                <button
                  className="px-4 py-2 bg-[#ff6b00] hover:bg-[#ff8c00] rounded-md font-bold text-sm text-white transition disabled:opacity-50"
                  onClick={analyzePR}
                  disabled={!prNumber || loading}
                >
                  {loading ? "Analyzing..." : "Analyze"}
                </button>
              </div>
              <p className="text-xs text-[#737373]">
                This will calculate the blast radius and architectural risk of the changes in this
                PR.
              </p>
            </div>
          )}

          {prResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-4 flex flex-col items-center justify-center">
                  <div
                    className={`text-4xl font-bold font-mono mb-1 ${getRiskColor(prResult.level)}`}
                  >
                    {prResult.score}
                  </div>
                  <div className="text-xs font-bold uppercase text-[#737373]">Risk Score</div>
                </div>
                <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-4 flex flex-col justify-center gap-2">
                  <div className="flex items-center gap-2">
                    {prResult.level === "critical" || prResult.level === "high" ? (
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    )}
                    <span className="text-sm font-bold capitalize text-[#e5e5e5]">
                      {prResult.level} Risk
                    </span>
                  </div>
                  <div className="text-xs text-[#737373]">
                    Blast Radius: {prResult.totalBlast} dependencies
                  </div>
                  <div className="text-xs text-[#737373]">
                    Files Changed: {prResult.changedFiles?.length}
                  </div>
                </div>
              </div>

              {prResult.factors.length > 0 && (
                <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-3">
                  <h3 className="text-xs font-bold uppercase text-[#737373] mb-2 px-1">
                    Risk Factors
                  </h3>
                  <div className="space-y-2">
                    {prResult.factors.map((factor: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-[#e5e5e5] bg-[#000000] p-2 rounded border border-[#1a1a1a]"
                      >
                        <AlertTriangle className="w-4 h-4 text-[#ff8c00] mt-0.5 shrink-0" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="w-full py-2 bg-[#0a0a0a] hover:bg-[#1a1a1a] rounded-md font-bold text-sm text-[#e5e5e5] border border-[#1a1a1a] transition"
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
