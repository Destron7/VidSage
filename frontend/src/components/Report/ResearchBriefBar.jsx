import React, { useState } from "react";
import { FileDown, Loader2, BookOpen, StickyNote, Clock, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function formatDuration(seconds) {
  const s = Math.floor(seconds || 0);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

export default function ResearchBriefBar({ jobId, noteCount = 0, termCount = 0, videoDuration = 0, videoTitle = "" }) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = () => {
    if (!jobId || jobId === "demo-123" || isNaN(jobId)) {
      alert("Select a real session to export PDF.");
      return;
    }
    setGenerating(true);
    setDone(false);

    // Trigger PDF download
    const link = document.createElement('a');
    link.href = `http://localhost:8000/api/v1/reports/pdf/${jobId}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Simulate completion after download triggers
    setTimeout(() => {
      setGenerating(false);
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white border-2 border-[#2D2D2D] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] px-5 py-3 flex items-center justify-between relative z-10"
    >
      {/* Left: Session stats */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <StickyNote className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-bold text-[#1A1A1A]">{noteCount}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5A]">Notes</span>
        </div>
        <div className="w-px h-4 bg-[#2D2D2D]/20"></div>
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-violet-600" />
          <span className="text-xs font-bold text-[#1A1A1A]">{termCount}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5A]">Terms</span>
        </div>
        <div className="w-px h-4 bg-[#2D2D2D]/20"></div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#5A5A5A]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5A]">{formatDuration(videoDuration)}</span>
        </div>
      </div>

      {/* Center: Title */}
      <p className="text-xs font-serif font-bold text-[#5A5A5A] hidden lg:block truncate max-w-[300px]" title={videoTitle}>
        {videoTitle || "Research Session"}
      </p>

      {/* Right: Export button */}
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-emerald-100 text-emerald-800 border-2 border-emerald-700 px-4 py-2 rounded font-bold uppercase tracking-widest text-xs shadow-[2px_2px_0px_rgba(4,120,87,1)]"
          >
            <CheckCircle className="w-4 h-4" /> Downloaded
          </motion.div>
        ) : (
          <motion.button
            key="export"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleExport}
            disabled={generating}
            className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#2D2D2D] text-white px-4 py-2 rounded font-bold uppercase tracking-widest text-xs shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-70"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" /> Generate Brief
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
