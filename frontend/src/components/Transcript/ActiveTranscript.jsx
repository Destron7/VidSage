import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function ActiveTranscript({ timedSegments, currentTime, onSeek }) {
  const containerRef = useRef(null);
  const activeSegmentRef = useRef(null);
  const [activeSegIndex, setActiveSegIndex] = useState(-1);

  // Find the currently active segment based on time
  useEffect(() => {
    if (!timedSegments || timedSegments.length === 0) return;
    
    // Find segment where current time falls within
    const currentIdx = timedSegments.findIndex(
      (seg) => currentTime >= seg.start && currentTime <= seg.end
    );
    
    if (currentIdx !== -1 && currentIdx !== activeSegIndex) {
      setActiveSegIndex(currentIdx);
    }
  }, [currentTime, timedSegments, activeSegIndex]);

  // Auto-scroll to active segment when it changes
  useEffect(() => {
    if (activeSegmentRef.current && containerRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeSegIndex]);

  if (!timedSegments || timedSegments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 gap-3">
         <p className="italic text-gray-400 text-center">No timestamped transcript available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 font-serif text-lg leading-relaxed text-[#4A4A4A] pb-32" ref={containerRef}>
      {timedSegments.map((segment, segIdx) => {
        const isSegmentActive = segIdx === activeSegIndex;
        
        return (
          <p 
            key={segIdx}
            ref={isSegmentActive ? activeSegmentRef : null}
            className={`transition-colors duration-300 rounded p-2 border-l-4 ${isSegmentActive ? 'bg-blue-50/50 border-blue-400 text-[#1A1A1A]' : 'border-transparent hover:bg-gray-50'}`}
          >
            {segment.words && segment.words.length > 0 ? (
               segment.words.map((w, wIdx) => {
                 const isWordActive = currentTime >= w.start && currentTime <= w.end;
                 return (
                   <span 
                     key={wIdx}
                     onClick={() => onSeek(w.start)}
                     className={`cursor-pointer rounded transition-all duration-150 inline ${isWordActive ? 'bg-blue-600 text-white shadow-sm font-semibold' : 'hover:bg-blue-100 hover:text-blue-800'}`}
                   >
                     {w.word}
                   </span>
                 );
               })
            ) : (
               <span 
                 onClick={() => onSeek(segment.start)}
                 className={`cursor-pointer rounded transition-all duration-150 block ${isSegmentActive ? 'text-[#1A1A1A] font-medium' : 'hover:bg-blue-50 hover:text-blue-800'}`}
               >
                 {segment.text}
               </span>
            )}
          </p>
        );
      })}
    </div>
  );
}
