import React, { useState, useEffect } from "react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "@/store/sessionStore";
import { motion } from "framer-motion";
import { Play, Clock, CheckCircle, Loader2, AlertCircle, Film, BookOpen, Mic, Trash2 } from "lucide-react";
import axios from "axios";

const API_BASE = "http://localhost:8000/api/v1/video";

export default function Library() {
  const navigate = useNavigate();
  const { mode, setMode, setJobId } = useSessionStore();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/all`);
      setVideos(res.data.videos || []);
    } catch (err) {
      console.error("Failed to fetch videos", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = (video) => {
    setJobId(video.id);
    if (mode === "scientist") {
      navigate(`/session/${video.id}`);
    } else {
      navigate(`/watch/${video.id}`);
    }
  };

  const statusConfig = {
    completed: { icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-700", label: "Ready" },
    processing: { icon: Loader2, color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-700", label: "Processing", spin: true },
    pending: { icon: Clock, color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-500", label: "Pending" },
    failed: { icon: AlertCircle, color: "text-red-700", bg: "bg-red-100", border: "border-red-700", label: "Failed" },
  };

  const accentColors = [
    "border-l-blue-600",
    "border-l-indigo-600",
    "border-l-rose-600",
    "border-l-amber-600",
    "border-l-emerald-600",
    "border-l-violet-600",
  ];

  return (
    <BackgroundPaths>
      <div className="flex flex-col flex-1 w-full font-sans text-[#2D2D2D] z-10 overflow-y-auto bg-transparent">
        
        <div className="max-w-6xl mx-auto w-full px-6 py-10">
          
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <div className="flex items-end justify-between border-b-[3px] border-[#2D2D2D] pb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] tracking-tight mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  Video Library
                </h1>
                <p className="text-[#5A5A5A] font-medium">
                  {videos.length} video{videos.length !== 1 ? 's' : ''} ingested into your local AI engine.
                </p>
              </div>
              <button 
                onClick={() => navigate('/upload')}
                className="bg-[#1A1A1A] hover:bg-[#2D2D2D] text-white px-6 py-3 rounded font-bold uppercase tracking-widest text-sm border-2 border-[#1A1A1A] shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
              >
                <Film className="w-4 h-4" /> Ingest New
              </button>
            </div>
          </motion.div>

          {/* Mode Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 flex items-center gap-4"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-[#5A5A5A]">Launch as:</span>
            <div className="flex bg-white p-1 rounded-md border-2 border-[#2D2D2D] shadow-inner shadow-black/10">
              <button
                onClick={() => setMode("viewer")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                  mode === "viewer"
                    ? "bg-[#1A1A1A] text-white shadow-[1px_1px_0px_rgba(0,0,0,1)]"
                    : "text-[#5A5A5A] hover:text-[#1A1A1A]"
                }`}
              >
                <BookOpen className="w-3 h-3" /> Viewer
              </button>
              <button
                onClick={() => setMode("scientist")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                  mode === "scientist"
                    ? "bg-[#1A1A1A] text-white shadow-[1px_1px_0px_rgba(0,0,0,1)]"
                    : "text-[#5A5A5A] hover:text-[#1A1A1A]"
                }`}
              >
                <Mic className="w-3 h-3" /> Scientist
              </button>
            </div>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-[#5A5A5A] animate-spin" />
              <span className="text-sm font-bold uppercase tracking-widest text-[#5A5A5A]">Fetching library...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && videos.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-dashed border-[#2D2D2D] rounded-xl p-16 text-center"
            >
              <Film className="w-16 h-16 text-[#5A5A5A]/30 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Georgia, serif' }}>No videos yet</h3>
              <p className="text-[#5A5A5A] mb-6">Upload a YouTube link or local file to get started.</p>
              <button 
                onClick={() => navigate('/upload')}
                className="bg-[#1A1A1A] hover:bg-[#2D2D2D] text-white px-8 py-3 rounded font-bold uppercase tracking-widest text-sm shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all"
              >
                Ingest First Video
              </button>
            </motion.div>
          )}

          {/* Video Grid */}
          {!loading && videos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video, index) => {
                const status = statusConfig[video.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const accent = accentColors[index % accentColors.length];
                const isReady = video.status === "completed";

                return (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    onClick={() => isReady && handleLaunch(video)}
                    className={`group relative bg-white border-2 border-[#2D2D2D] border-l-4 ${accent} rounded-xl overflow-hidden transition-all ${
                      isReady 
                        ? "cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] shadow-[3px_3px_0px_rgba(0,0,0,1)]" 
                        : "opacity-70 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
                    }`}
                  >
                    {/* Notebook paper lines */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_95%,_rgba(0,0,0,0.05)_100%)] bg-[length:100%_20px] opacity-40"></div>

                    <div className="relative z-10 p-5">
                      {/* Status Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${status.border} ${status.bg} text-[10px] font-bold uppercase tracking-widest ${status.color}`}>
                          <StatusIcon className={`w-3 h-3 ${status.spin ? "animate-spin" : ""}`} />
                          {status.label}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#5A5A5A] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                          #{video.id}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-lg text-[#1A1A1A] mb-2 leading-snug line-clamp-2 group-hover:text-blue-900 transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
                        {video.title || video.filename}
                      </h3>

                      {/* Meta Row */}
                      <div className="flex items-center gap-3 mb-4">
                        {video.duration && (
                          <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#5A5A5A]">
                            <Clock className="w-3 h-3" /> {video.duration}
                          </div>
                        )}
                        {video.youtube_url && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">YouTube</span>
                        )}
                        {!video.youtube_url && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Local</span>
                        )}
                      </div>

                      {/* Transcript preview */}
                      {video.transcription && (
                        <p className="text-xs text-[#5A5A5A] line-clamp-2 leading-relaxed italic font-serif mb-4 border-l-2 border-[#2D2D2D]/20 pl-3">
                          "{video.transcription.substring(0, 120)}..."
                        </p>
                      )}

                      {/* Action Row */}
                      {isReady && (
                        <div className="flex items-center justify-between pt-3 border-t-2 border-dashed border-[#2D2D2D]/15">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5A] group-hover:text-blue-800 transition-colors">
                            Click to launch →
                          </span>
                          <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center group-hover:bg-blue-800 transition-colors shadow-sm">
                            <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                      )}

                      {!isReady && video.status === "processing" && (
                        <div className="pt-3 border-t-2 border-dashed border-[#2D2D2D]/15">
                          <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full animate-pulse w-2/3"></div>
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mt-2">Whisper is transcribing...</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </BackgroundPaths>
  );
}
