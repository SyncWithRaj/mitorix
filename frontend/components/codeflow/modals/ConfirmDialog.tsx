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
          color: "text-[#ff6b00]",
          border: "border-[#ff6b00]/30",
          bg: "bg-[#ff6b00]/10",
          btn: "bg-[#ff6b00] hover:bg-[#ff8c00] text-white",
          icon: <Info className="w-8 h-8 text-[#ff6b00]" />,
        };
      case "warning":
      default:
        return {
          color: "text-[#ff8c00]",
          border: "border-[#ff8c00]/30",
          bg: "bg-[#ff8c00]/10",
          btn: "bg-[#ff8c00] hover:bg-[#ffa800] text-white",
          icon: <AlertTriangle className="w-8 h-8 text-[#ff8c00]" />,
        };
    }
  };

  const styles = getToneStyles();

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className={`bg-[#050505] border ${styles.border} rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
      >
        <div className={`p-6 flex flex-col items-center text-center ${styles.bg}`}>
          <div className="mb-4 bg-[#000000] p-3 rounded-full shadow-inner border border-[#1a1a1a]">
            {styles.icon}
          </div>
          <h2 className="text-xl font-bold text-[#e5e5e5] mb-2">{title}</h2>
          <p className="text-[#737373] text-sm leading-relaxed">{desc}</p>
        </div>

        <div className="flex p-4 gap-3 bg-[#000000] border-t border-[#1a1a1a]">
          <button
            className="flex-1 px-4 py-2 bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-[#1a1a1a] rounded-md transition text-[#e5e5e5] font-medium"
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
