import React, { useState } from "react";
import { Book, Search, Cpu, StickyNote, PenTool } from "lucide-react";
import TermCard from "./TermCard";

function formatTimestamp(seconds) {
  const s = Math.floor(seconds || 0);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function TermPanel({ currentTime, glossary = [], notes = [], onSeek, showNotes = true }) {
  const [activeTerm, setActiveTerm] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "terms" | "notes"

  const filteredGlossary = glossary.filter(g => g.term.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredNotes = notes.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase()));

  // Build combined cards sorted by timestamp
  const cards = [];

  if (filter === "all" || filter === "terms") {
    filteredGlossary.forEach((item, i) => {
      cards.push({
        type: "term",
        key: `term-${i}`,
        timestamp: item.first_timestamp || 0,
        data: item,
      });
    });
  }

  if (filter === "all" || filter === "notes") {
    filteredNotes.forEach((note) => {
      cards.push({
        type: "note",
        key: `note-${note.id}`,
        timestamp: note.timestamp || 0,
        data: note,
      });
    });
  }

  // Sort by timestamp
  cards.sort((a, b) => a.timestamp - b.timestamp);

  const termCount = filter === "notes" ? 0 : filteredGlossary.length;
  const noteCount = filter === "terms" ? 0 : filteredNotes.length;

  return (
    <div className="w-full h-full bg-white border-2 border-[#2D2D2D] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col">
      
      {/* Header row */}
      <div className="bg-[#1A1A1A] text-white px-4 py-2 shrink-0 flex items-center gap-3 border-b-2 border-[#2D2D2D] relative z-10">
        <h2 className="font-bold text-xs uppercase tracking-widest flex items-center gap-2 shrink-0">
          <Book className="w-3.5 h-3.5 text-blue-400" /> Reference Deck
        </h2>

        {/* Filter pills */}
        {showNotes && (
          <div className="flex items-center gap-1 shrink-0">
            {[
              { id: "all", label: "All", count: filteredGlossary.length + filteredNotes.length },
              { id: "terms", label: "Terms", count: filteredGlossary.length },
              { id: "notes", label: "Notes", count: filteredNotes.length },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded transition-all ${
                  filter === f.id
                    ? "bg-white text-[#1A1A1A]"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {f.label} <span className="font-mono opacity-70">{f.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1 bg-white/10 border border-white/20 rounded text-[10px] text-white placeholder:text-white/40 focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all font-medium"
          />
        </div>
      </div>

      {/* Horizontal scrolling cards */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 relative z-10">
        {cards.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-[#5A5A5A] italic">No items found.</p>
          </div>
        ) : (
          <div className="flex gap-3 h-full">
            {cards.map((card) => {
              const ts = card.timestamp;
              const tsLabel = formatTimestamp(ts);

              if (card.type === "term") {
                const item = card.data;
                return (
                  <div 
                    key={card.key} 
                    onClick={() => setActiveTerm(item)}
                    className="shrink-0 w-52 border border-[#2D2D2D]/30 border-l-4 border-l-indigo-600 rounded-lg bg-white p-3 hover:bg-indigo-50/50 hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between group hover:shadow-md"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-xs text-[#1A1A1A] font-serif leading-tight line-clamp-1">{item.term}</span>
                        {ts > 0 && (
                          <span className="text-[8px] font-mono font-bold text-violet-700 bg-violet-50 px-1 py-0.5 rounded border border-violet-200 shrink-0 ml-1">
                            @{tsLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#5A5A5A] line-clamp-3 leading-relaxed">{item.definition}</p>
                    </div>
                    <div className="mt-1.5 pt-1 border-t border-[#2D2D2D]/10">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Cpu className="w-2.5 h-2.5" /> Research →
                      </span>
                    </div>
                  </div>
                );
              } else {
                // Note card
                const note = card.data;
                return (
                  <div 
                    key={card.key} 
                    onClick={() => onSeek && onSeek(note.timestamp || 0)}
                    className="shrink-0 w-52 border border-[#2D2D2D]/30 border-l-4 border-l-amber-500 rounded-lg bg-white p-3 hover:bg-amber-50/50 hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between group hover:shadow-md"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="flex items-center gap-1">
                          <StickyNote className="w-3 h-3 text-amber-600" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-amber-700">Note</span>
                        </span>
                        <span className="text-[8px] font-mono font-bold text-amber-800 bg-amber-100 px-1 py-0.5 rounded border border-amber-300 shrink-0">
                          @{tsLabel}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#4A4A4A] line-clamp-4 leading-relaxed font-medium break-words">{note.content}</p>
                    </div>
                    <div className="mt-1.5 pt-1 border-t border-[#2D2D2D]/10">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <PenTool className="w-2.5 h-2.5" /> Seek to note →
                      </span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>

      {/* TermCard overlay */}
      {activeTerm && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-6 pointer-events-none">
          <div className="pointer-events-auto">
            <TermCard 
              key={activeTerm.term}
              termData={activeTerm} 
              onClose={() => setActiveTerm(null)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
