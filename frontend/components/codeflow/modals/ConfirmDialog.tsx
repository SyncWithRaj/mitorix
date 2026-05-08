"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";

export default function ConfirmDialog() {
  const { confirmDialog, setConfirmDialog } = useCodeflow();

  if (!confirmDialog) return null;

  const { tone, title, desc, onConfirm } = confirmDialog;

  const getToneStyles = () => {
    switch (tone) {
      case "danger":
        return {
          color: "text-[#ff5f5f]",
          border: "border-[#ff5f5f]/30",
          bg: "bg-[#ff5f5f]/10",
          btn: "bg-[#ff5f5f] hover:bg-[#ff4040] text-white",
          icon: <AlertCircle className="w-8 h-8 text-[#ff5f5f]" />,
        };
      case "info":
        return {
          color: "text-[#58a6ff]",
          border: "border-[#58a6ff]/30",
          bg: "bg-[#58a6ff]/10",
          btn: "bg-[#58a6ff] hover:bg-[#3182ce] text-white",
          icon: <Info className="w-8 h-8 text-[#58a6ff]" />,
        };
      case "warning":
      default:
        return {
          color: "text-[#ff9f43]",
          border: "border-[#ff9f43]/30",
          bg: "bg-[#ff9f43]/10",
          btn: "bg-[#ff9f43] hover:bg-[#e68a30] text-white",
          icon: <AlertTriangle className="w-8 h-8 text-[#ff9f43]" />,
        };
    }
  };

  const styles = getToneStyles();

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={`bg-[#161b22] border ${styles.border} rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
      >
        <div className={`p-6 flex flex-col items-center text-center ${styles.bg}`}>
          <div className="mb-4 bg-[#0d1117] p-3 rounded-full shadow-inner border border-[#30363d]">
            {styles.icon}
          </div>
          <h2 className="text-xl font-bold text-[#c9d1d9] mb-2">{title}</h2>
          <p className="text-[#8b949e] text-sm leading-relaxed">{desc}</p>
        </div>

        <div className="flex p-4 gap-3 bg-[#0d1117] border-t border-[#30363d]">
          <button
            className="flex-1 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md transition text-[#c9d1d9] font-medium"
            onClick={() => setConfirmDialog(null)}
          >
            Cancel
          </button>
          <button
            className={`flex-1 px-4 py-2 rounded-md transition font-medium border border-white/10 shadow-sm ${styles.btn}`}
            onClick={() => {
              onConfirm();
              setConfirmDialog(null);
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
