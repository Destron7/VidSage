import React, { useState } from "react";
import { Book, Bookmark, Search, Cpu } from "lucide-react";
import TermCard from "./TermCard";

export default function TermPanel({ currentTime, glossary = [] }) {
  const [activeTerm, setActiveTerm] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGlossary = glossary.filter(g => g.term.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-full bg-white border-2 border-[#2D2D2D] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_95%,_rgba(0,0,0,0.1)_100%)] bg-[length:100%_25px] opacity-30"></div>
      
      {/* Header */}
      <div className="bg-[#1A1A1A] text-white p-4 shrink-0 flex items-center justify-between border-b-2 border-[#2D2D2D] relative z-10">
        <h2 className="font-bold text-lg uppercase tracking-widest flex items-center gap-2">
          <Book className="w-5 h-5 text-blue-400" /> Reference Deck
        </h2>
        <div className="text-xs bg-white/20 px-2 py-1 rounded font-mono">{glossary.length} Terms</div>
      </div>

      {/* Search / Filter */}
      <div className="p-4 border-b-2 border-[#2D2D2D] relative z-10 bg-[#FAFAFA]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A5A]" />
          <input 
            type="text" 
            placeholder="Search glossary..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#2D2D2D] rounded-md shadow-sm focus:outline-none focus:border-blue-600 focus:shadow-[2px_2px_0px_rgba(37,99,235,1)] transition-all text-sm font-bold"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 relative z-10">
        <div className="flex items-center gap-2 mb-2">
           <div className="h-px bg-[#2D2D2D]/20 flex-1"></div>
           <span className="text-xs font-bold uppercase tracking-widest text-[#5A5A5A] flex items-center gap-1"><Cpu className="w-3 h-3"/> AI Extracted</span>
           <div className="h-px bg-[#2D2D2D]/20 flex-1"></div>
        </div>

        {filteredGlossary.length === 0 && (
            <p className="text-center text-sm text-[#5A5A5A] italic mt-4">No glossary terms found.</p>
        )}

        {filteredGlossary.map((item, index) => (
             <div 
                key={index} 
                onClick={() => setActiveTerm(item)}
                className="border border-[#2D2D2D]/30 border-l-4 border-l-indigo-600 rounded bg-white p-3 hover:bg-gray-50 transition-colors cursor-pointer"
             >
             <div className="flex justify-between items-center mb-1">
               <span className="font-bold text-[#1A1A1A] font-serif">{item.term}</span>
             </div>
             <p className="text-xs text-[#5A5A5A] line-clamp-2 leading-relaxed">{item.definition}</p>
          </div>
        ))}
      </div>

      {/* If an active term is selected, show the overlay card over everything */}
      {activeTerm && (
        <TermCard termData={activeTerm} onClose={() => setActiveTerm(null)} />
      )}
    </div>
  );
}
