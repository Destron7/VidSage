import React from "react";
import { GitCommit, AlignLeft } from "lucide-react";

export default function Timeline() {
  return (
    <div className="h-full bg-[#FAFAFA] border-2 border-[#2D2D2D] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="bg-[#1A1A1A] text-white p-3 shrink-0 flex items-center justify-between border-b-2 border-[#2D2D2D]">
         <h2 className="font-bold uppercase tracking-widest flex items-center gap-2 text-sm">
           <GitCommit className="w-4 h-4 text-emerald-400" /> Structural Timeline
         </h2>
      </div>

      <div className="p-3 border-b-2 border-[#2D2D2D] bg-white flex items-center justify-between">
         <span className="text-xs font-bold tracking-widest uppercase text-[#5A5A5A]">Auto-Segmented</span>
         <button className="text-[#5A5A5A] hover:text-[#1A1A1A]"><AlignLeft className="w-4 h-4" /></button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col relative">
        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-[#2D2D2D]/20 z-0"></div>

        <div className="relative z-10 flex gap-4 pr-2 mb-6 opacity-60">
          <div className="w-8 h-8 rounded-full bg-white border-2 border-[#2D2D2D]/30 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-mono font-bold text-[#5A5A5A]">00</div>
          <div>
            <h4 className="text-sm font-bold text-[#1A1A1A] mb-1">Introduction & Premise</h4>
            <p className="text-xs text-[#5A5A5A]">Setting the stage for cosmic observation. Standard model basics.</p>
          </div>
        </div>

        <div className="relative z-10 flex gap-4 pr-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-900 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-mono font-bold text-emerald-900 shadow-sm animate-pulse">01</div>
          <div className="bg-white border-2 border-emerald-900 p-3 rounded shadow-[2px_2px_0px_rgba(4,120,87,1)] flex-1">
            <h4 className="text-sm font-bold text-emerald-900 mb-1">The Expansion Metric</h4>
            <p className="text-xs text-emerald-800 font-medium">Detailed breakdown of the Hubble constant discrepancy. <span className="font-bold">Active Segment</span></p>
          </div>
        </div>

        <div className="relative z-10 flex gap-4 pr-2 mb-6 opacity-60">
          <div className="w-8 h-8 rounded-full bg-white border-2 border-[#2D2D2D]/30 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-mono font-bold text-[#5A5A5A]">03</div>
          <div>
            <h4 className="text-sm font-bold text-[#1A1A1A] mb-1">Dark Energy Influence</h4>
            <p className="text-xs text-[#5A5A5A]">Theoretical frameworks for accelerating expansion.</p>
          </div>
        </div>

        <div className="relative z-10 flex gap-4 pr-2 opacity-60">
          <div className="w-8 h-8 rounded-full bg-white border-2 border-[#2D2D2D]/30 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-mono font-bold text-[#5A5A5A]">04</div>
          <div>
            <h4 className="text-sm font-bold text-[#1A1A1A] mb-1">Conclusion</h4>
            <p className="text-xs text-[#5A5A5A]">Summary of findings and future telescopic missions.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
