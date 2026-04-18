import React, { useState, useEffect } from "react";
import { X, ExternalLink, Bookmark, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";

export default function TermCard({ termData, onClose }) {
  const [research, setResearch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResearch = async () => {
       if (!termData || !termData.term) return;
       try {
           const res = await axios.get(`http://localhost:8000/api/v1/terms/research/${encodeURIComponent(termData.term)}`);
           setResearch(res.data.research_summary);
       } catch (err) {
           console.error("Failed to fetch research", err);
           setResearch("Failed to load deep research. Please check internet connection or LLM setup.");
       } finally {
           setLoading(false);
       }
    };
    fetchResearch();
  }, [termData]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="absolute top-4 right-4 w-80 bg-white border-2 border-[#2D2D2D] rounded-xl shadow-[6px_6px_0px_rgba(0,0,0,1)] overflow-hidden z-20 flex flex-col"
    >
       <div className="bg-[#1A1A1A] p-3 text-white flex justify-between items-center border-b-2 border-[#2D2D2D]">
          <h3 className="font-bold uppercase tracking-widest text-sm text-blue-400">Context Acquired</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
       </div>
       
       <div className="p-4 bg-[linear-gradient(translate_95%,_rgba(0,0,0,0.05)_100%)] bg-[length:100%_20px]">
          <h4 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-2">{termData?.term || "Unknown Term"}</h4>
          <p className="text-sm font-medium text-[#4A4A4A] leading-relaxed mb-4">
            {termData?.definition || "No definition provided."}
          </p>
          
          {/* Tabs */}
          <div className="flex border-b-2 border-[#2D2D2D]/20 mb-3">
             <button className="text-xs font-bold uppercase tracking-widest border-b-2 border-blue-600 text-blue-900 pb-1 px-2">Deep AI Source</button>
             <button className="text-xs font-bold uppercase tracking-widest text-[#5A5A5A] hover:text-[#1A1A1A] pb-1 px-2">Web</button>
          </div>
          
          <div className="bg-gray-50 border border-[#2D2D2D]/30 rounded p-3 text-xs text-[#5A5A5A] mb-4 max-h-32 overflow-y-auto">
             {loading ? (
                <div className="flex gap-2 items-center text-blue-800 font-bold justify-center w-full my-4">
                   <Loader2 className="w-4 h-4 animate-spin" /> Mining Research...
                </div>
             ) : (
                <p className="italic leading-relaxed break-words whitespace-pre-wrap">{research}</p>
             )}
          </div>

          <div className="flex gap-2">
             <button className="flex-1 bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold uppercase tracking-widest py-2 rounded shadow flex justify-center items-center gap-2 transition-all">
               <Bookmark className="w-3 h-3" /> Pin Term
             </button>
             <button className="p-2 border-2 border-[#2D2D2D] rounded shadow-sm hover:bg-gray-50 flex items-center justify-center text-[#1A1A1A]">
               <ExternalLink className="w-4 h-4" />
             </button>
          </div>
       </div>
    </motion.div>
  );
}
