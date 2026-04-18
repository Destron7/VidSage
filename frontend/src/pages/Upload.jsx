import React, { useState, useEffect, useRef } from "react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { Button } from "@/components/ui/button";
import { UploadCloud, Link as LinkIcon, Play, Mic, BookOpen, Loader2, CheckCircle, FileVideo } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSessionStore } from "@/store/sessionStore";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://localhost:8000/api/v1/video";

export default function Upload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mode, setMode, setJobId } = useSessionStore();

  const [inputType, setInputType] = useState("youtube"); // "youtube" | "local"
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollIntervalId, setPollIntervalId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Initializing neural pathways...");
  const [pollingJobId, setPollingJobId] = useState(null);

  // Sync mode from URL param
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "scientist" || urlMode === "viewer") {
      setMode(urlMode);
    }
  }, [searchParams, setMode]);

  // Fake status messages rotation
  const messages = [
    "Warming up local AI weights...",
    "Extracting audio streams...",
    "Transcribing speech using Whisper...",
    "Building semantic index...",
    "Finalizing contexts...",
  ];
  
  useEffect(() => {
    let msgInterval;
    if (isProcessing && !pollingJobId) {
      // Just waiting for the initial upload request to return the jobId
      setStatusMessage("Uploading payload to local server...");
    } else if (isProcessing && pollingJobId) {
       let step = 0;
       setStatusMessage(messages[0]);
       msgInterval = setInterval(() => {
         step = (step + 1) % messages.length;
         setStatusMessage(messages[step]);
       }, 3500);
    }
    return () => clearInterval(msgInterval);
  }, [isProcessing, pollingJobId]);

  // The actual Polling logic
  useEffect(() => {
    if (pollingJobId) {
      const pId = setInterval(async () => {
        try {
          const res = await axios.get(`${API_BASE}/status/${pollingJobId}`);
          if (res.data.status === "completed" || res.data.status === "ready") {
             clearInterval(pId);
             setJobId(pollingJobId);
             // Launch the viewer or session based on mode!
             if (mode === "scientist") {
               navigate(`/session/${pollingJobId}`);
             } else {
               navigate(`/watch/${pollingJobId}`);
             }
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 2000);
      setPollIntervalId(pId);
      return () => clearInterval(pId);
    }
  }, [pollingJobId, navigate, setJobId]);

  // Handlers
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleStartProcessing = async () => {
    if (inputType === "youtube" && !youtubeUrl) return;
    if (inputType === "local" && !selectedFile) return;

    setIsProcessing(true);

    try {
      let createdJobId = null;

      if (inputType === "youtube") {
        const res = await axios.post(`${API_BASE}/youtube`, { url: youtubeUrl });
        createdJobId = res.data.DB_id || (res.data.id); 
        
        // **Fallback logic if ID is missing from youtube**:
        if (!createdJobId) {
           const allRes = await axios.get(`${API_BASE}/all`);
           const videos = allRes.data.videos;
           const latest = videos[videos.length - 1];
           createdJobId = latest.id;
        }

      } else {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const res = await axios.post(`${API_BASE}/local`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        createdJobId = res.data.DB_id;
      }

      setPollingJobId(createdJobId);

    } catch (error) {
      console.error("Upload failed", error);
      setIsProcessing(false);
      alert("Failed to initialize process. Check backend server.");
    }
  };

  return (
    <BackgroundPaths>
      <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 text-[#2D2D2D] font-sans z-10 pt-8 pb-12 overflow-y-auto">
        
        <div className="w-full max-w-2xl bg-[#FAFAFA] border-2 border-[#2D2D2D] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] p-8 pt-10 relative">
           {/* Notebook line styling */}
           <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_95%,_rgba(0,0,0,0.1)_100%)] bg-[length:100%_25px] rounded-xl z-0"></div>
          
           <div className="relative z-10">
             {!isProcessing ? (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                 <h2 className="text-3xl font-extrabold text-[#1A1A1A] mb-2 text-center" style={{ fontFamily: 'Georgia, serif' }}>
                   Initialize VidSage
                 </h2>
                 <p className="text-[#5A5A5A] text-center mb-10 text-sm border-b-2 border-[#2D2D2D]/30 pb-6 w-3/4 mx-auto border-dashed">
                   Select an ingestion source to boot up the offline neural engine.
                 </p>

                 {/* Source Toggle */}
                 <div className="flex bg-white p-1.5 rounded-lg border-2 border-[#2D2D2D] mb-8 max-w-sm mx-auto shadow-inner">
                   <button
                     onClick={() => setInputType("youtube")}
                     className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-bold tracking-wide transition-all ${
                       inputType === "youtube"
                         ? "bg-[#1A1A1A] text-white shadow-[1px_1px_0px_rgba(0,0,0,1)]"
                         : "text-[#5A5A5A] hover:text-[#1A1A1A]"
                     }`}
                   >
                     <Play className="w-4 h-4" /> YouTube URL
                   </button>
                   <button
                     onClick={() => setInputType("local")}
                     className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-bold tracking-wide transition-all ${
                       inputType === "local"
                         ? "bg-[#1A1A1A] text-white shadow-[1px_1px_0px_rgba(0,0,0,1)]"
                         : "text-[#5A5A5A] hover:text-[#1A1A1A]"
                     }`}
                   >
                     <UploadCloud className="w-4 h-4" /> Local File
                   </button>
                 </div>

                 {/* Input Area */}
                 <div className="mb-10 bg-white p-6 rounded-lg border-2 border-[#2D2D2D] border-dashed">
                   {inputType === "youtube" ? (
                     <div className="flex flex-col gap-3">
                       <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
                         <LinkIcon className="w-4 h-4" />
                         Paste Video Link
                       </label>
                       <input
                         type="url"
                         placeholder="https://youtube.com/watch?v=..."
                         className="w-full bg-[#fdfdfd] border-2 border-[#2D2D2D] rounded shadow-[2px_2px_0px_rgba(0,0,0,0.5)] px-4 py-3 text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-red-800 transition-colors"
                         value={youtubeUrl}
                         onChange={(e) => setYoutubeUrl(e.target.value)}
                       />
                     </div>
                   ) : (
                     <div className="flex flex-col gap-3">
                       <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
                         <FileVideo className="w-4 h-4" />
                         Upload Video
                       </label>
                       <div className="relative border-2 border-[#2D2D2D] border-dashed rounded-lg p-10 flex flex-col items-center justify-center group hover:bg-[#FDFBF7] transition-colors bg-white">
                         <UploadCloud className="w-10 h-10 text-[#5A5A5A] mb-3 group-hover:text-blue-600 transition-colors" />
                         <span className="text-[#5A5A5A] text-sm font-medium">Drag & drop or click to browse</span>
                         <input
                           type="file"
                           accept="video/*"
                           onChange={handleFileChange}
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         />
                       </div>
                       {selectedFile && (
                          <div className="text-sm text-blue-700 font-bold tracking-wide flex items-center gap-2 mt-2 bg-blue-100 px-3 py-1.5 rounded-full w-fit">
                            <CheckCircle className="w-4 h-4" /> {selectedFile.name}
                          </div>
                       )}
                     </div>
                   )}
                 </div>

                 {/* Mode Selection */}
                 <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-widest mb-4 flex items-center gap-2">
                   Select Operating Mode
                 </h3>
                 <div className="grid grid-cols-2 gap-4 mb-8">
                   {/* Viewer Card */}
                   <div 
                     onClick={() => setMode("viewer")}
                     className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center text-center transition-all bg-white ${
                       mode === "viewer" ? "border-blue-800 bg-blue-50 shadow-[2px_2px_0px_rgba(0,0,0,1)] -translate-y-1" : "border-[#2D2D2D] hover:-translate-y-0.5 shadow-sm"
                     }`}
                   >
                      <BookOpen className={`w-8 h-8 mb-2 ${mode === "viewer" ? "text-blue-800" : "text-[#5A5A5A]"}`} />
                      <span className={`font-bold ${mode === "viewer" ? "text-blue-900" : "text-[#1A1A1A]"}`}>Viewer Mode</span>
                   </div>
                   {/* Scientist Card */}
                   <div 
                     onClick={() => setMode("scientist")}
                     className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center text-center transition-all bg-white ${
                       mode === "scientist" ? "border-amber-700 bg-amber-50 shadow-[2px_2px_0px_rgba(0,0,0,1)] -translate-y-1" : "border-[#2D2D2D] hover:-translate-y-0.5 shadow-sm"
                     }`}
                   >
                      <Mic className={`w-8 h-8 mb-2 ${mode === "scientist" ? "text-amber-700" : "text-[#5A5A5A]"}`} />
                      <span className={`font-bold ${mode === "scientist" ? "text-amber-900" : "text-[#1A1A1A]"}`}>Scientist Mode</span>
                   </div>
                 </div>

                 {/* Submit Action */}
                 <Button 
                   onClick={handleStartProcessing}
                   disabled={(inputType === "youtube" && !youtubeUrl) || (inputType === "local" && !selectedFile)}
                   className="w-full py-6 text-lg tracking-widest uppercase font-bold bg-[#1A1A1A] hover:bg-[#2D2D2D] text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] border border-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-px transition-all rounded"
                 >
                   Deploy Engine
                 </Button>

               </motion.div>
             ) : (
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="relative w-24 h-24 mb-10">
                    <Loader2 className="w-24 h-24 text-[#5A5A5A] animate-spin absolute inset-0" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <span className="h-6 w-6 rounded-full border-4 border-blue-600 animate-pulse bg-white"></span>
                    </div>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                    Engine Compiling...
                  </h3>
                  
                  <div className="bg-white border-2 border-[#2D2D2D] rounded-md py-3 px-6 mt-6 min-w-[280px] shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <p className="text-[#2D2D2D] font-mono text-sm inline-flex items-center gap-2 font-bold">
                      <span className="text-red-800 font-black">»</span> {statusMessage}
                    </p>
                  </div>
                  
                  <p className="text-xs text-[#5A5A5A] mt-12 max-w-[200px] uppercase font-bold tracking-widest text-center">
                    VidSage heavily utilizes your local CPU/GPU array during transcription.
                  </p>
               </motion.div>
             )}
           </div>

        </div>
      </div>
    </BackgroundPaths>
  );
}
