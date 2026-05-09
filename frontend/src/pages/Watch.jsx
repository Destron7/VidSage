import React, { useState, useEffect, useCallback } from "react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { useParams, useNavigate } from "react-router-dom";
import { useSessionStore } from "@/store/sessionStore";
import { ArrowLeft, BrainCircuit, Loader2, PlayCircle, Clock, FileText, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoPlayer from "@/components/VideoPlayer/VideoPlayer";
import TermPanel from "@/components/Terms/TermPanel";
import Timeline from "@/components/Timeline/Timeline";
import ReactMarkdown from "react-markdown";
import useSSE from "@/hooks/useSSE";
import axios from "axios";

export default function Watch() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { mode } = useSessionStore();
  
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoData, setVideoData] = useState(null);
  const [glossary, setGlossary] = useState([]);
  const [loading, setLoading] = useState(true);

  // Summary related states
  const [activeTab, setActiveTab] = useState("transcript"); // "transcript" | "summary"
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchAllData = useCallback(async () => {
    if (!jobId || isNaN(jobId)) return;
    
    setLoading(true);
    try {
      // Parallel fetch for speed
      const [videoRes, termsRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/v1/video/data/${jobId}`),
        axios.get(`http://localhost:8000/api/v1/terms/${jobId}`).catch(() => ({ data: { glossary: [] } }))
      ]);
      
      setVideoData(videoRes.data);
      if (termsRes.data && termsRes.data.glossary) {
        setGlossary(termsRes.data.glossary);
      }
    } catch (err) {
      console.error("Failed to fetch video data", err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const handleSeek = useCallback((time) => {
    if (window.__vidsage_seekTo) {
      window.__vidsage_seekTo(time);
    }
  }, []);

  const fetchSummary = async () => {
    if (summary || summaryLoading) return;
    
    setSummaryLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/v1/video/summary/${jobId}`);
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

  // Handle SSE completion events
  const handleJobComplete = useCallback((completedId) => {
    console.log(`📡 [SSE Signal] Job ${completedId} status updated. Current ID: ${jobId}`);
    if (String(completedId) === String(jobId)) {
      console.log(`✨ [Reactivity] Match found for ID ${completedId}! Triggering auto-refresh...`);
      fetchAllData();
    }
  }, [jobId, fetchAllData]);

  // Connect to SSE
  useSSE({ onJobComplete: handleJobComplete });

  useEffect(() => {
    // Reset state on navigation
    setVideoData(null);
    setGlossary([]);
    setSummary("");
    setActiveTab("transcript");
    setCurrentTime(0);
    
    if (!jobId || jobId === "demo-123" || isNaN(jobId)) {
      setVideoData({
         title: "Cosmology & The Universe (Demo)",
         youtube_url: null,
         filename: null,
         status: "completed",
         transcription: "In this video, we'll explore the Cosmic Microwave Background, a key piece of evidence for the Big Bang..."
      });
      setLoading(false);
      return;
    }

    fetchAllData();
  }, [jobId, fetchAllData]);

  // Determine video URL
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
              className="flex-1 flex flex-col items-center justify-center p-12 text-center"
            >
               <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
               <h2 className="text-3xl font-extrabold tracking-tight mb-2" style={{ fontFamily: 'Georgia, serif' }}>Fetching Video Intelligence...</h2>
               <p className="text-[#5A5A5A] max-w-md">Our backend engine is gathering the transcript and technical glossary for this session.</p>
            </motion.div>
          ) : !isReady ? (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-12 text-center"
            >
               <div className="relative mb-8">
                  <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-20 animate-pulse"></div>
                  <Clock className="w-24 h-24 text-amber-600 relative z-10" />
               </div>
               <h2 className="text-4xl font-extrabold tracking-tight mb-4" style={{ fontFamily: 'Georgia, serif' }}>AI Processing in Progress</h2>
               <p className="text-lg text-[#5A5A5A] max-w-lg mb-8 leading-relaxed">
                  VidSage is currently transcribing and analyzing <strong>"{videoData.title}"</strong>. 
                  This usually takes about 30 seconds for every minute of video.
               </p>
               <div className="flex items-center gap-3 bg-white border-2 border-[#2D2D2D] px-6 py-3 rounded-full shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">Awaiting Live Update. No Refresh Needed.</span>
               </div>
            </motion.div>
          ) : (
            <motion.div 
               key="ready"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex-1 flex flex-col overflow-y-auto p-4 gap-4 max-w-[1700px] mx-auto w-full relative z-10"
            >
              {/* Top row: Video + Timeline */}
              <div className="flex shrink-0 min-h-[500px] gap-4">
                 {/* Left Column: Video Player (~70%) */}
                 <div className="w-[70%] h-full flex flex-col gap-3 min-h-0">
                   <div className="flex items-center gap-3 px-1">
                     <h2 className="text-lg font-extrabold text-[#1A1A1A] tracking-tight line-clamp-1 flex-1" style={{ fontFamily: 'Georgia, serif' }}>
                       {videoData.title || videoData.filename || "Untitled"}
                     </h2>
                     <div className="flex gap-1.5 shrink-0">
                       {videoData.youtube_url && (
                         <span className="text-[9px] font-bold uppercase tracking-widest text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">YouTube</span>
                       )}
                       <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Viewer Mode</span>
                     </div>
                   </div>

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
                 
                 {/* Right Column: Timeline (~30%) */}
                 <div className="w-[30%] h-full">
                   <Timeline 
                     glossary={glossary}
                     currentTime={currentTime}
                     onSeek={handleSeek}
                     videoDuration={videoData?.duration || 0}
                     showNotes={false}
                   />
                 </div>
              </div>

              {/* Middle: Horizontal Reference Deck */}
              <div className="shrink-0 h-[220px]">
                <TermPanel currentTime={currentTime} glossary={glossary} onSeek={handleSeek} showNotes={false} />
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
                    <Sparkles className="w-3.5 h-3.5" /> AI Summary
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
                               <p className="text-sm font-bold uppercase tracking-widest text-[#5A5A5A]">Asking the Research Agent to summarize...</p>
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

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BackgroundPaths>
  );
}
