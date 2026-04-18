import React, { useState, useEffect } from "react";
import { Mic, PenTool, Pin, AlertCircle, Save, Loader2 } from "lucide-react";
import axios from "axios";

export default function NotesPanel({ jobId }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchNotes = async () => {
    if (!jobId || jobId === "demo-123" || isNaN(jobId)) return;
    try {
      const res = await axios.get(`http://localhost:8000/api/v1/notes/${jobId}`);
      if (res.data && res.data.notes) {
        setNotes(res.data.notes);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [jobId]);

  const handleSaveNote = async () => {
    if (!newNote.trim() || !jobId || jobId === "demo-123" || isNaN(jobId)) return;
    setLoading(true);
    try {
      await axios.post(`http://localhost:8000/api/v1/notes/${jobId}`, {
        video_id: parseInt(jobId),
        content: newNote
      });
      setNewNote("");
      fetchNotes(); // refresh
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!jobId || jobId === "demo-123" || isNaN(jobId)) {
        alert("Select a real session to export PDF.");
        return;
    }
    window.open(`http://localhost:8000/api/v1/reports/pdf/${jobId}`, '_blank');
  };

  return (
    <div className="h-full bg-white border-2 border-[#2D2D2D] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_95%,_rgba(0,0,0,0.1)_100%)] bg-[length:100%_25px] opacity-30"></div>

      {/* Header */}
      <div className="bg-[#1A1A1A] text-white p-3 shrink-0 flex items-center justify-between border-b-2 border-[#2D2D2D] relative z-10">
         <h2 className="font-bold uppercase tracking-widest flex items-center gap-2 text-sm">
           <PenTool className="w-4 h-4 text-amber-400" /> Research Notes
         </h2>
         <div className="flex gap-1">
           <button onClick={handleExportPDF} className="bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider transition-colors">Export PDF</button>
         </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-b-2 border-[#2D2D2D] bg-[#FAFAFA] relative z-10">
        <div className="border-2 border-[#2D2D2D] rounded-lg bg-white relative shadow-sm overflow-hidden focus-within:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all">
          <textarea 
            placeholder="Log an observation..." 
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full h-20 p-3 resize-none focus:outline-none text-sm font-semibold text-[#1A1A1A] placeholder:text-gray-400 placeholder:font-normal"
          ></textarea>
          <div className="bg-gray-50 border-t-2 border-[#2D2D2D]/10 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-amber-100 text-amber-900 font-mono font-bold px-1.5 py-0.5 border border-amber-300 rounded">@00:00</span>
              <button className="text-gray-400 hover:text-red-500 transition-colors" title="Voice dictation active">
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <button 
                onClick={handleSaveNote}
                disabled={loading || !newNote.trim()}
                className="bg-[#1A1A1A] hover:bg-black text-white p-1.5 rounded transition-colors shadow disabled:opacity-50"
            >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative z-10">
        
        {notes.length === 0 && (
            <p className="text-center text-sm text-[#5A5A5A] italic mt-4">No notes recorded yet. Log an observation above to start.</p>
        )}

        {notes.map((note) => (
            <div key={note.id} className="bg-white border-2 border-[#2D2D2D]/30 rounded p-3 relative hover:border-[#2D2D2D] transition-colors shadow-[1px_1px_0px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-1 rounded">00:00</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Observation</span>
                </div>
            </div>
            <p className="text-sm font-medium text-[#4A4A4A] leading-relaxed break-words whitespace-pre-wrap">
                {note.content}
            </p>
            </div>
        ))}

        {/* Demo Mode Mock Term (only shown if no real notes and demo mode) */}
        {(jobId === "demo-123" || isNaN(jobId)) && notes.length === 0 && (
             <div className="bg-amber-50 border-2 border-amber-900/50 rounded p-3 relative group hover:border-amber-900 transition-colors shadow-sm">
             <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2">
                  <Mic className="w-3 h-3 text-amber-700" />
                  <span className="text-xs font-mono font-bold text-amber-900 bg-amber-200 px-1 rounded">01:12</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">Observation</span>
               </div>
             </div>
             <p className="text-sm font-serif font-bold text-[#1A1A1A] leading-relaxed">
               "The expansion rate seen here implies a positive cosmological constant. Needs double checking against local Hubble parameter."
             </p>
           </div>
        )}
      </div>
    </div>
  );
}
