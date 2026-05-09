import React, { useEffect, useMemo, useRef } from "react";
import { GitCommit, StickyNote, Diamond, Clock } from "lucide-react";
import { motion } from "framer-motion";

function formatTimestamp(seconds) {
  const s = Math.floor(seconds || 0);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function Timeline({ glossary = [], notes = [], currentTime = 0, onSeek, videoDuration = 0, showNotes = true }) {
  
  // Build unified timeline markers sorted by timestamp
  const markers = [];

  notes.forEach(note => {
    markers.push({
      type: "note",
      timestamp: note.timestamp || 0,
      label: note.content,
      id: `note-${note.id}`,
    });
  });

  glossary.forEach((term, i) => {
    markers.push({
      type: "term",
      timestamp: term.first_timestamp || 0,
      label: term.term,
      sublabel: term.definition || term.summary || "",
      id: `term-${i}`,
    });
  });

  // Sort by timestamp ascending
  markers.sort((a, b) => a.timestamp - b.timestamp);

  const hasData = markers.length > 0;

  // Find the first active marker
  const activeMarker = useMemo(() => {
    return markers.find(m => Math.abs(currentTime - m.timestamp) < 3);
  }, [currentTime, markers]);

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (activeMarker && scrollContainerRef.current) {
      const el = document.getElementById(`timeline-marker-${activeMarker.id}`);
      const container = scrollContainerRef.current;
      
      if (el && container) {
        // Calculate scroll position to center the element within the timeline container
        // without affecting the main page's scroll position
        const targetScrollTop = el.offsetTop - (container.clientHeight / 2) + (el.clientHeight / 2);
        
        container.scrollTo({
          top: targetScrollTop,
          behavior: "smooth"
        });
      }
    }
  }, [activeMarker]);

  return (
    <div className="h-full bg-[#FAFAFA] border-2 border-[#2D2D2D] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="bg-[#1A1A1A] text-white px-3 py-2 shrink-0 flex items-center justify-between border-b-2 border-[#2D2D2D]">
         <h2 className="font-bold uppercase tracking-widest flex items-center gap-2 text-xs">
           <GitCommit className="w-3.5 h-3.5 text-emerald-400" /> Timeline
         </h2>
         <div className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">{markers.length}</div>
      </div>

      {/* Legend */}
      <div className="py-1.5 px-3 border-b-2 border-[#2D2D2D] bg-white flex items-center gap-3">
         {showNotes && (
           <div className="flex items-center gap-1">
             <span className="w-2 h-2 rounded-full bg-blue-500 border border-blue-700"></span>
             <span className="text-[9px] font-bold tracking-wider uppercase text-[#5A5A5A]">Notes</span>
           </div>
         )}
         <div className="flex items-center gap-1">
           <span className="w-2 h-2 rounded bg-violet-500 border border-violet-700 rotate-45 scale-75"></span>
           <span className="text-[9px] font-bold tracking-wider uppercase text-[#5A5A5A]">Terms</span>
         </div>
      </div>

      {/* Timeline List */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 flex flex-col relative">
        {/* Vertical connector line */}
        {hasData && (
          <div className="absolute left-[23px] top-3 bottom-3 w-0.5 bg-[#2D2D2D]/15 z-0"></div>
        )}

        {!hasData && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
            <Clock className="w-8 h-8 text-[#5A5A5A]/30" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#5A5A5A]">No markers yet</p>
            <p className="text-xs text-[#5A5A5A]/70">Notes and detected terms will appear here.</p>
          </div>
        )}

        {markers.map((marker, i) => {
          const isActive = Math.abs(currentTime - marker.timestamp) < 3;
          const isNote = marker.type === "note";

          return (
            <motion.div
              id={`timeline-marker-${marker.id}`}
              key={marker.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSeek && onSeek(marker.timestamp)}
              className={`relative z-10 flex gap-2 pr-1 mb-2.5 cursor-pointer group transition-opacity ${
                isActive ? "opacity-100" : "opacity-60 hover:opacity-90"
              }`}
              title={`Seek to ${formatTimestamp(marker.timestamp)}`}
            >
              {/* Marker dot */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[8px] font-mono font-bold border-2 transition-all ${
                isActive 
                  ? (isNote 
                      ? "bg-blue-100 border-blue-700 text-blue-800 shadow-sm animate-pulse" 
                      : "bg-violet-100 border-violet-700 text-violet-800 shadow-sm animate-pulse")
                  : (isNote 
                      ? "bg-white border-blue-400 text-blue-600" 
                      : "bg-white border-violet-400 text-violet-600")
              }`}>
                {isNote 
                  ? <StickyNote className="w-2.5 h-2.5" /> 
                  : <Diamond className="w-2.5 h-2.5" />
                }
              </div>

              {/* Content */}
              <div className={`flex-1 min-w-0 transition-all ${
                isActive 
                  ? (isNote 
                      ? "bg-white border border-blue-600 px-1.5 py-1 rounded shadow-sm" 
                      : "bg-white border border-violet-600 px-1.5 py-1 rounded shadow-sm")
                  : ""
              }`}>
                <span className={`text-[9px] font-mono font-bold ${isNote ? "text-blue-700" : "text-violet-700"}`}>
                  {formatTimestamp(marker.timestamp)}
                </span>
                <p className={`text-[11px] font-bold leading-tight line-clamp-1 ${
                  isActive ? "text-[#1A1A1A]" : "text-[#4A4A4A]"
                }`}>
                  {marker.label}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
