import React, { useState, useEffect } from "react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { useParams, useNavigate } from "react-router-dom";
import { useSessionStore } from "@/store/sessionStore";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer/VideoPlayer";
import TermPanel from "@/components/Terms/TermPanel";
import axios from "axios";

export default function Watch() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { mode } = useSessionStore();
  
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoData, setVideoData] = useState(null);
  const [glossary, setGlossary] = useState([]);
  
  useEffect(() => {
    // If it's a demo job, we can just supply mock data
    if (!jobId || jobId === "demo-123" || isNaN(jobId)) {
      setVideoData({
         title: "Cosmology & The Universe (Demo)",
         youtube_url: null,
         filename: null,
         transcription: "In this video, we'll explore the Cosmic Microwave Background, a key piece of evidence for the Big Bang. As the universe expanded, the light from the early universe underwent a phenomenon known as Redshift."
      });
      return;
    }

    const fetchVideoData = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/v1/video/data/${jobId}`);
        setVideoData(res.data);
      } catch (err) {
        console.error("Failed to fetch video data", err);
      }
    };

    const fetchGlossary = async () => {
        try {
            const res = await axios.get(`http://localhost:8000/api/v1/terms/${jobId}`);
            if (res.data && res.data.glossary) {
                setGlossary(res.data.glossary);
            }
        } catch (err) {
            console.error("Failed to fetch glossary", err);
        }
    };

    fetchVideoData();
    fetchGlossary();
  }, [jobId]);

  // Determine video URL
  const videoUrl = videoData?.youtube_url 
      ? videoData.youtube_url 
      : (videoData?.filename ? `http://localhost:8000/uploads/${videoData.filename}` : "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4");

  return (
    <BackgroundPaths>
      <div className="flex flex-col flex-1 w-full font-sans text-[#2D2D2D] z-10 overflow-hidden bg-transparent">
        

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden p-6 gap-6 max-w-screen-2xl mx-auto w-full relative z-10">
          
          {/* Left Column: Video Player (65%) */}
          <div className="w-[65%] h-full flex flex-col gap-4">
            <VideoPlayer 
               url={videoUrl}
               playing={playing}
               onTogglePlay={() => setPlaying(!playing)}
               currentTime={currentTime}
               setCurrentTime={setCurrentTime}
               detectedTerms={glossary}
            />
            
            {/* Transcript/Metadata Area below video */}
            <div className="flex-1 bg-white border-2 border-[#2D2D2D] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col">
               <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_95%,_rgba(0,0,0,0.1)_100%)] bg-[length:100%_25px] opacity-30"></div>
               <div className="border-b-2 border-[#2D2D2D] bg-[#FAFAFA] p-3 shrink-0 flex gap-4">
                 <button className="text-sm font-bold uppercase tracking-widest border-b-2 border-blue-600 text-blue-900 pb-1">Transcript</button>
                 <button className="text-sm font-bold uppercase tracking-widest text-[#5A5A5A] hover:text-[#1A1A1A]">Summary</button>
               </div>
               <div className="flex-1 p-6 overflow-y-auto relative z-10 font-serif text-lg leading-relaxed text-[#4A4A4A]">
                  <p>{videoData?.transcription || "No transcription available."}</p>
               </div>
            </div>
          </div>

          {/* Right Column: Term Panel (35%) */}
          <div className="w-[35%] h-full">
            <TermPanel currentTime={currentTime} glossary={glossary} />
          </div>

        </div>
      </div>
    </BackgroundPaths>
  );
}
