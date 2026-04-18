import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SubtitleOverlay({ currentTime, detectedTerms = [] }) {
  // Build a set of term words for highlighting
  const termWords = new Set();
  detectedTerms.forEach(t => {
    if (t.term) {
      t.term.toLowerCase().split(" ").forEach(w => termWords.add(w));
    }
  });

  // No subtitle text available — hide overlay
  if (termWords.size === 0) return null;

  return (
    <div className="absolute bottom-20 left-0 w-full flex justify-center px-8 pointer-events-none z-10">
      <AnimatePresence>
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           className="bg-black/80 backdrop-blur-sm border border-white/10 px-6 py-3 rounded-lg max-w-3xl text-center shadow-lg pointer-events-auto"
        >
          <p className="text-sm text-white/60 font-mono uppercase tracking-widest">
            {detectedTerms.length} terms detected
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
