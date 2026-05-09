import React, { useState, useEffect } from "react";
import { X, ExternalLink, Bookmark, Loader2, Globe, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import axios from "axios";

const API_BASE = "http://localhost:8000/api/v1/terms";

export default function TermCard({ termData, onClose }) {
  const [activeTab, setActiveTab] = useState("ai");
  const [research, setResearch] = useState(null);
  const [researchLoading, setResearchLoading] = useState(true);
  const [webResults, setWebResults] = useState(null);
  const [webLoading, setWebLoading] = useState(false);

  // Fetch AI research on mount
  useEffect(() => {
    const fetchResearch = async () => {
       if (!termData || !termData.term) return;
       
       setResearchLoading(true);
       setResearch(null);

       try {
           const res = await axios.get(`${API_BASE}/research/${encodeURIComponent(termData.term)}`);
           setResearch(res.data.research_summary);
       } catch (err) {
           console.error("Failed to fetch research", err);
           setResearch("Failed to load deep research. Please check internet connection or LLM setup.");
       } finally {
           setResearchLoading(false);
       }
    };
    fetchResearch();
  }, [termData]);

  // Fetch web results when "web" tab is activated (lazy load)
  useEffect(() => {
    if (activeTab !== "web" || webResults !== null) return;

    const fetchWeb = async () => {
      if (!termData || !termData.term) return;
      setWebLoading(true);

      try {
        const res = await axios.get(`${API_BASE}/web/${encodeURIComponent(termData.term)}`);
        setWebResults(res.data.results || []);
      } catch (err) {
        console.error("Failed to fetch web results", err);
        setWebResults([]);
      } finally {
        setWebLoading(false);
      }
    };
    fetchWeb();
  }, [activeTab, termData, webResults]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="w-80 bg-white border-2 border-[#2D2D2D] rounded-xl shadow-[6px_6px_0px_rgba(0,0,0,1)] overflow-hidden z-20 flex flex-col max-h-[85vh]"
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
             <button 
               onClick={() => setActiveTab("ai")}
               className={`text-xs font-bold uppercase tracking-widest pb-1 px-2 transition-colors ${
                 activeTab === "ai" 
                   ? "border-b-2 border-blue-600 text-blue-900" 
                   : "text-[#5A5A5A] hover:text-[#1A1A1A]"
               }`}
             >
               Deep AI Source
             </button>
             <button 
               onClick={() => setActiveTab("web")}
               className={`text-xs font-bold uppercase tracking-widest pb-1 px-2 transition-colors flex items-center gap-1 ${
                 activeTab === "web" 
                   ? "border-b-2 border-emerald-600 text-emerald-900" 
                   : "text-[#5A5A5A] hover:text-[#1A1A1A]"
               }`}
             >
               <Globe className="w-3 h-3" /> Web
             </button>
          </div>
          
          <div className="bg-gray-50 border border-[#2D2D2D]/30 rounded p-3 text-xs text-[#5A5A5A] mb-4 max-h-48 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === "ai" ? (
                <motion.div
                  key="ai-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  {researchLoading ? (
                    <div className="flex gap-2 items-center text-blue-800 font-bold justify-center w-full my-4">
                       <Loader2 className="w-4 h-4 animate-spin" /> Mining Research...
                    </div>
                  ) : (
                    <div className="prose prose-xs prose-slate max-w-none [&_h1]:text-sm [&_h1]:font-bold [&_h1]:mb-1 [&_h1]:mt-2 [&_h2]:text-xs [&_h2]:font-bold [&_h2]:mb-1 [&_h2]:mt-2 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:mt-1.5 [&_p]:text-xs [&_p]:leading-relaxed [&_p]:mb-1.5 [&_ul]:text-xs [&_ul]:pl-4 [&_ul]:mb-1.5 [&_ol]:text-xs [&_ol]:pl-4 [&_ol]:mb-1.5 [&_li]:mb-0.5 [&_strong]:font-bold [&_strong]:text-[#1A1A1A] [&_code]:bg-gray-200 [&_code]:px-1 [&_code]:rounded [&_code]:text-[10px]">
                      <ReactMarkdown>{research}</ReactMarkdown>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="web-tab"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  {webLoading ? (
                    <div className="flex gap-2 items-center text-emerald-800 font-bold justify-center w-full my-4">
                       <Loader2 className="w-4 h-4 animate-spin" /> Searching the web...
                    </div>
                  ) : webResults && webResults.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {webResults.map((result, i) => (
                        <a
                          key={i}
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block p-2 rounded border border-[#2D2D2D]/15 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
                        >
                          <div className="flex items-start gap-1.5 mb-0.5">
                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded border border-emerald-200 shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-xs font-bold text-[#1A1A1A] leading-tight line-clamp-2 group-hover:text-emerald-800 transition-colors">
                              {result.title}
                              <ArrowUpRight className="w-3 h-3 inline ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          </div>
                          {result.snippet && (
                            <p className="text-[10px] text-[#5A5A5A] leading-relaxed line-clamp-2 ml-5">
                              {result.snippet}
                            </p>
                          )}
                          <p className="text-[9px] text-emerald-600 font-mono truncate ml-5 mt-0.5">
                            {result.url}
                          </p>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Globe className="w-6 h-6 text-[#5A5A5A]/30 mx-auto mb-2" />
                      <p className="text-xs text-[#5A5A5A] italic">
                        No web results found. Make sure SearXNG is running.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
