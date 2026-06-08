"use client";

import React, { useState, useEffect } from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { Users, ChevronRight, ChevronDown } from "lucide-react";
import { COLORS } from "../../../lib/codeflow.constants";

export default function OwnershipCard() {
  const { selectedFile, expandedCards, toggleCard } = useCodeflow();

  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownership, setOwnership] = useState<any[] | null>(null);

  useEffect(() => {
    if (selectedFile) {
      setOwnerLoading(false);
      setOwnership([]);
    }
  }, [selectedFile]);

  const isOpen = expandedCards.has("own");

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg mb-3 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-[#1a1a1a] transition select-none text-xs font-semibold text-[#e5e5e5]"
        onClick={() => toggleCard("own")}
      >
        {isOpen ? (
          <ChevronDown size={14} className="text-[#737373]" />
        ) : (
          <ChevronRight size={14} className="text-[#737373]" />
        )}
        <Users size={14} className="text-[#ff6b00]" />
        Ownership
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-3 pt-0 border-t border-[#1a1a1a]/50 mt-1">
          {ownerLoading ? (
            <div className="text-[10px] text-[#737373] py-2 text-center italic">
              Loading ownership data...
            </div>
          ) : ownership && ownership.length > 0 ? (
            <div>
              <div className="flex h-1.5 rounded-full overflow-hidden mb-3 bg-[#000000] border border-[#1a1a1a]/50">
                {ownership.slice(0, 5).map((o, i) => (
                  <div
                    key={i}
                    style={{ width: `${o.percent}%`, backgroundColor: COLORS[i % COLORS.length] }}
                  />
                ))}
              </div>
              <div className="space-y-1.5">
                {ownership.slice(0, 5).map((o, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[#0a0a0f] font-bold text-[8px]"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    >
                      {o.name[0].toUpperCase()}
                    </div>
                    <span className="text-[#e5e5e5] flex-1 truncate">{o.name}</span>
                    <span className="text-[#737373] font-mono">{o.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-[#737373] py-2 text-center italic">
              No ownership data available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
