import React, { useState, useEffect } from "react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, LayoutPanelLeft } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer/VideoPlayer";
import NotesPanel from "@/components/Notes/NotesPanel";
import Timeline from "@/components/Timeline/Timeline";
import axios from "axios";

export default function Session() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoData, setVideoData] = useState(null);

  useEffect(() => {
    if (!jobId || jobId === "demo-123" || isNaN(jobId)) {
      setVideoData({
         title: "Cosmology & The Universe (Demo)",
         youtube_url: null,
         filename: null,
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

    fetchVideoData();
  }, [jobId]);

  const videoUrl = videoData?.youtube_url 
      ? videoData.youtube_url 
      : (videoData?.filename ? `http://localhost:8000/uploads/${videoData.filename}` : "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4");


  return (
    <BackgroundPaths>
      <div className="flex flex-col flex-1 w-full font-sans text-[#2D2D2D] z-10 overflow-hidden bg-transparent">
        

        {/* Main Content Area - 3 Columns */}
        <div className="flex-1 flex overflow-hidden p-4 gap-4 max-w-[1600px] mx-auto w-full relative z-10">
          
          {/* Col 1: Video (~45%) */}
          <div className="w-[45%] h-full flex flex-col justify-center">
            <div className="shadow-[8px_8px_0px_rgba(0,0,0,1)] rounded-xl border-2 border-[#2D2D2D] overflow-hidden bg-[#1A1A1A]">
              <VideoPlayer 
                 url={videoUrl}
                 playing={playing}
                 onTogglePlay={() => setPlaying(!playing)}
                 currentTime={currentTime}
                 setCurrentTime={setCurrentTime}
                 detectedTerms={[]}
              />
            </div>
            {/* Meta tags for video */}
            <div className="mt-6 flex gap-2 flex-wrap px-2">
              <span className="text-[10px] font-bold uppercase tracking-widest border border-[#2D2D2D] bg-white px-2 py-1 rounded shadow-sm">Physics</span>
              <span className="text-[10px] font-bold uppercase tracking-widest border border-[#2D2D2D] bg-white px-2 py-1 rounded shadow-sm">Cosmology</span>
              <span className="text-[10px] font-bold uppercase tracking-widest border border-[#2D2D2D] bg-white px-2 py-1 rounded shadow-sm text-red-700">Flagged: Unverified Claim</span>
            </div>
          </div>

          {/* Col 2: Notes (~35%) */}
          <div className="w-[35%] h-full pt-2">
             <NotesPanel jobId={jobId} />
          </div>

          {/* Col 3: Structural Timeline (~20%) */}
          <div className="w-[20%] h-full pt-2">
             <Timeline />
          </div>

        </div>
      </div>
    </BackgroundPaths>
  );
}
