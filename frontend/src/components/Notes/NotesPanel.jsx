import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, PenTool, Save, Loader2, Trash2, Pencil, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://localhost:8000/api/v1/notes";

function formatTimestamp(seconds) {
  const s = Math.floor(seconds || 0);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function NotesPanel({ jobId, currentTime = 0, onSeek, onNotesChange }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [liveTime, setLiveTime] = useState(0);
  const rafRef = useRef(null);

  // Poll the video element for exact live time (more accurate than prop)
  useEffect(() => {
    const tick = () => {
      let time = null;
      if (typeof window.__vidsage_getTime === 'function') {
        time = window.__vidsage_getTime();
      } else {
        const videoEl = document.querySelector("video");
        if (videoEl) time = videoEl.currentTime;
      }

      if (time !== null && !isNaN(time)) {
        setLiveTime(time);
      }
      
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const fetchNotes = async () => {
    if (!jobId || jobId === "demo-123" || isNaN(jobId)) return;
    try {
      const res = await axios.get(`${API_BASE}/${jobId}`);
      if (res.data && res.data.notes) {
        setNotes(res.data.notes);
        onNotesChange && onNotesChange(res.data.notes);
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
    // Read exact video position
    let exactTime = currentTime;
    if (typeof window.__vidsage_getTime === 'function') {
      exactTime = window.__vidsage_getTime();
    } else {
      const videoEl = document.querySelector("video");
      if (videoEl) exactTime = videoEl.currentTime;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/${jobId}`, {
        video_id: parseInt(jobId),
        content: newNote,
        timestamp: exactTime
      });
      setNewNote("");
      fetchNotes();
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(`${API_BASE}/${noteId}`);
      const updated = notes.filter(n => n.id !== noteId);
      setNotes(updated);
      onNotesChange && onNotesChange(updated);
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleEditStart = (note) => {
    setEditingId(note.id);
    setEditText(note.content);
  };

  const handleEditSave = async (noteId) => {
    if (!editText.trim()) return;
    try {
      await axios.put(`${API_BASE}/${noteId}`, { content: editText });
      const updated = notes.map(n => n.id === noteId ? { ...n, content: editText } : n);
      setNotes(updated);
      onNotesChange && onNotesChange(updated);
      setEditingId(null);
      setEditText("");
    } catch (err) {
      console.error("Failed to update note:", err);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveNote();
    }
  };

  return (
    <div className="h-full bg-white border-2 border-[#2D2D2D] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_95%,_rgba(0,0,0,0.1)_100%)] bg-[length:100%_25px] opacity-30"></div>

      {/* Header */}
      <div className="bg-[#1A1A1A] text-white px-3 py-2 shrink-0 flex items-center justify-between border-b-2 border-[#2D2D2D] relative z-10">
         <h2 className="font-bold uppercase tracking-widest flex items-center gap-2 text-xs">
           <PenTool className="w-3.5 h-3.5 text-amber-400" /> Research Notes
         </h2>
         <div className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">{notes.length}</div>
      </div>

      {/* Input Area */}
      <div className="p-2 border-b-2 border-[#2D2D2D] bg-[#FAFAFA] relative z-10">
        <div className="border-2 border-[#2D2D2D] rounded-lg bg-white relative shadow-sm overflow-hidden focus-within:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all">
          <textarea 
            placeholder="Log an observation..." 
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-10 p-2 resize-none focus:outline-none text-xs font-semibold text-[#1A1A1A] placeholder:text-gray-400 placeholder:font-normal"
          ></textarea>
          <div className="bg-gray-50 border-t-2 border-[#2D2D2D]/10 px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-amber-100 text-amber-900 font-mono font-bold px-1.5 py-0.5 border border-amber-300 rounded">
                @{formatTimestamp(liveTime)}
              </span>
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
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 relative z-10">
        
        {notes.length === 0 && (
            <p className="text-center text-sm text-[#5A5A5A] italic mt-4">No notes recorded yet. Log an observation above.</p>
        )}

        <AnimatePresence>
          {notes.map((note) => (
            <motion.div 
              key={note.id} 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white border-2 border-[#2D2D2D]/30 rounded p-3 relative hover:border-[#2D2D2D] transition-colors shadow-[1px_1px_0px_rgba(0,0,0,0.1)] group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onSeek && onSeek(note.timestamp || 0)}
                    className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
                    title="Seek to this timestamp"
                  >
                    {formatTimestamp(note.timestamp)}
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Observation</span>
                </div>
                {/* Edit / Delete — visible on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingId !== note.id && (
                    <>
                      <button 
                        onClick={() => handleEditStart(note)} 
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors rounded"
                        title="Edit note"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleDeleteNote(note.id)} 
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded"
                        title="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editingId === note.id ? (
                <div className="flex gap-2 items-start">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 text-sm font-medium text-[#4A4A4A] leading-relaxed border border-blue-300 rounded p-2 resize-none focus:outline-none focus:border-blue-600 bg-blue-50/30"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleEditSave(note.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={handleEditCancel} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-medium text-[#4A4A4A] leading-relaxed break-words whitespace-pre-wrap">
                  {note.content}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
