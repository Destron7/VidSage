import React, { useState, useEffect, useCallback, useRef } from "react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Clock, Mic, FileText, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoPlayer from "@/components/VideoPlayer/VideoPlayer";
import NotesPanel from "@/components/Notes/NotesPanel";
import TermPanel from "@/components/Terms/TermPanel";
import Timeline from "@/components/Timeline/Timeline";
import ResearchBriefBar from "@/components/Report/ResearchBriefBar";
import ReactMarkdown from "react-markdown";
import useSSE from "@/hooks/useSSE";
import axios from "axios";

const API_BASE = "http://localhost:8000/api/v1";

export default function Session() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoData, setVideoData] = useState(null);
  const [glossary, setGlossary] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Summary
  const [activeTab, setActiveTab] = useState("transcript");
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);


  const fetchAllData = useCallback(async () => {
    if (!jobId || isNaN(jobId)) return;
    setLoading(true);
    try {
      const [videoRes, termsRes, notesRes] = await Promise.all([
        axios.get(`${API_BASE}/video/data/${jobId}`),
        axios.get(`${API_BASE}/terms/${jobId}`).catch(() => ({ data: { glossary: [] } })),
        axios.get(`${API_BASE}/notes/${jobId}`).catch(() => ({ data: { notes: [] } })),
      ]);
      
      setVideoData(videoRes.data);
      if (termsRes.data && termsRes.data.glossary) {
        setGlossary(termsRes.data.glossary);
      }
      if (notesRes.data && notesRes.data.notes) {
        setNotes(notesRes.data.notes);
      }
    } catch (err) {
      console.error("Failed to fetch session data", err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Refetch just notes (used after create/delete/edit in NotesPanel)
  const refreshNotes = useCallback(async () => {
    if (!jobId || isNaN(jobId)) return;
    try {
      const res = await axios.get(`${API_BASE}/notes/${jobId}`);
      if (res.data && res.data.notes) {
        setNotes(res.data.notes);
      }
    } catch (err) { /* silent */ }
  }, [jobId]);

  const fetchSummary = async () => {
    if (summary || summaryLoading) return;
    setSummaryLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/video/summary/${jobId}`);
      setSummary(res.data.summary);
    } catch (err) {
      console.error("Failed to fetch summary", err);
      setSummary("Error generating summary. Please try again later.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "summary" && !summary) {
      fetchSummary();
    }
  };

  // Handle SSE completion events for auto-display
  const handleJobComplete = useCallback((completedId) => {
    if (String(completedId) === String(jobId)) {
      console.log(`✨ [Session] Job ${completedId} completed! Refreshing...`);
      fetchAllData();
    }
  }, [jobId, fetchAllData]);

  useSSE({ onJobComplete: handleJobComplete });

  useEffect(() => {
    setVideoData(null);
    setGlossary([]);
    setNotes([]);
    setSummary("");
    setActiveTab("transcript");
    setCurrentTime(0);
    
    if (!jobId || jobId === "demo-123" || isNaN(jobId)) {
      setVideoData({
         title: "Cosmology & The Universe (Demo)",
         youtube_url: null,
         filename: null,
         status: "completed",
         transcription: "In this video, we'll explore the Cosmic Microwave Background, a key piece of evidence for the Big Bang...",
         duration: 0
      });
      setLoading(false);
      return;
    }

    fetchAllData();
  }, [jobId, fetchAllData]);

  // Seek handler — used by Timeline and NotesPanel timestamp clicks
  const handleSeek = (timestamp) => {
    // For HTML5 video, set currentTime directly
    const videoEl = document.querySelector("video");
    if (videoEl) {
      videoEl.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  };

  const videoUrl = videoData?.youtube_url 
      ? videoData.youtube_url 
      : (videoData?.filename ? `http://localhost:8000/uploads/${videoData.filename}` : "");

  const isReady = videoData?.status === "completed";

  return (
    <BackgroundPaths>
      <div className="flex flex-col flex-1 w-full font-sans text-[#2D2D2D] z-10 overflow-hidden bg-transparent">
        
        <AnimatePresence mode="wait">
          {loading || !videoData ? (
             <motion.div 
               key="loading"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="flex-1 flex flex-col items-center justify-center"
             >
                <Loader2 className="w-12 h-12 text-[#1A1A1A] animate-spin mb-4" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#5A5A5A]">Initializing Research Environment...</span>
             </motion.div>
          ) : !isReady ? (
            <motion.div 
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-12 text-center"
            >
               <div className="relative mb-8">
                  <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 animate-pulse"></div>
                  <Mic className="w-20 h-20 text-[#1A1A1A] relative z-10" />
               </div>
               <h2 className="text-3xl font-extrabold tracking-tight mb-4" style={{ fontFamily: 'Georgia, serif' }}>Scientist Mode: Analysis Pending</h2>
               <p className="text-lg text-[#5A5A5A] max-w-lg mb-8 leading-relaxed">
                  We are extracting data from <strong>"{videoData.title}"</strong>. The specialized research environment will activate automatically when processing is complete.
               </p>
               <div className="flex items-center gap-3 bg-white border-2 border-[#2D2D2D] px-6 py-3 rounded shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">Listening for Backend Signal...</span>
               </div>
            </motion.div>
          ) : (
            <motion.div 
               key="ready"
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="flex-1 flex flex-col overflow-y-auto p-4 gap-4 max-w-[1700px] mx-auto w-full relative z-10"
            >
              {/* Top row: Video + Notes + Timeline */}
              <div className="flex shrink-0 min-h-[500px] gap-4">
                
                {/* Col 1: Video + Transcript/Summary (~65%) */}
                <div className="w-[65%] h-full flex flex-col gap-3 min-h-0">
                  {/* Video Title */}
                  <div className="flex items-center gap-3 px-1">
                    <h2 className="text-lg font-extrabold text-[#1A1A1A] tracking-tight line-clamp-1 flex-1" style={{ fontFamily: 'Georgia, serif' }}>
                      {videoData.title || videoData.filename || "Untitled"}
                    </h2>
                    <div className="flex gap-1.5 shrink-0">
                      {videoData.youtube_url && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">YouTube</span>
                      )}
                      <span className="text-[9px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Scientist</span>
                    </div>
                  </div>

                  {/* Video Player */}
                  <div className="flex-1 shadow-[6px_6px_0px_rgba(0,0,0,1)] rounded-xl border-2 border-[#2D2D2D] overflow-hidden bg-[#1A1A1A]">
                    <VideoPlayer 
                       url={videoUrl}
                       playing={playing}
                       onTogglePlay={() => setPlaying(!playing)}
                       currentTime={currentTime}
                       setCurrentTime={setCurrentTime}
                       detectedTerms={glossary}
                    />
                  </div>
                </div>

                {/* Col 2: Notes + Timeline stacked vertically (~35%) */}
                <div className="w-[35%] h-full flex flex-col gap-3 min-h-0">
                  {/* Research Notes — takes remaining space */}
                  <div className="flex-1 min-h-0">
                    <NotesPanel 
                      jobId={jobId} 
                      currentTime={currentTime} 
                      onSeek={handleSeek}
                      onNotesChange={(updatedNotes) => setNotes(updatedNotes)}
                    />
                  </div>

                  {/* Timeline — compact, shows ~3 items */}
                  <div className="shrink-0 h-[230px]">
                    <Timeline 
                      glossary={glossary}
                      notes={notes}
                      currentTime={currentTime}
                      onSeek={handleSeek}
                      videoDuration={videoData?.duration || 0}
                    />
                  </div>
                </div>
              </div>

              {/* Middle: Horizontal Reference Deck */}
              <div className="shrink-0 h-[220px]">
                <TermPanel currentTime={currentTime} glossary={glossary} notes={notes} onSeek={handleSeek} />
              </div>

              {/* Bottom: Transcript/Summary Window (Full Width) */}
              <div className="shrink-0 h-[280px] bg-white border-2 border-[#2D2D2D] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_95%,_rgba(0,0,0,0.1)_100%)] bg-[length:100%_25px] opacity-30"></div>
                <div className="border-b-2 border-[#2D2D2D] bg-[#FAFAFA] p-1 shrink-0 flex">
                  <button 
                    onClick={() => handleTabChange("transcript")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-widest transition-all border-r-2 border-[#2D2D2D] ${
                      activeTab === "transcript" ? "bg-white text-blue-600 shadow-sm" : "bg-gray-50 text-[#5A5A5A] hover:bg-gray-100"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Transcript
                  </button>
                  <button 
                     onClick={() => handleTabChange("summary")}
                     className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                       activeTab === "summary" ? "bg-white text-blue-600 shadow-sm" : "bg-gray-50 text-[#5A5A5A] hover:bg-gray-100"
                     }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Summary
                  </button>
                </div>

                <div className="flex-1 p-5 overflow-y-auto relative z-10 font-serif text-base leading-relaxed text-[#4A4A4A]">
                   <AnimatePresence mode="wait">
                      {activeTab === "transcript" ? (
                        <motion.div
                          key="transcript-view"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                        >
                          <p>{videoData?.transcription || "No transcription available."}</p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="summary-view"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="min-h-[120px]"
                        >
                          {summaryLoading ? (
                            <div className="flex flex-col items-center justify-center h-full py-8 gap-3">
                               <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                               <p className="text-sm font-bold uppercase tracking-widest text-[#5A5A5A]">Asking the Research Agent...</p>
                            </div>
                          ) : (
                            <div className="prose prose-blue max-w-none">
                              {summary ? (
                                <ReactMarkdown>{summary}</ReactMarkdown>
                              ) : (
                                <p className="italic text-gray-400 text-center py-8">Click to generate an AI summary.</p>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                   </AnimatePresence>
                </div>
              </div>

              {/* Bottom: Research Brief Bar */}
              <ResearchBriefBar 
                jobId={jobId}
                noteCount={notes.length}
                termCount={glossary.length}
                videoDuration={videoData?.duration || 0}
                videoTitle={videoData?.title || ""}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </BackgroundPaths>
  );
}
