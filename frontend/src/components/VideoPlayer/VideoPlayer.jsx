import React, { useRef, useState, useEffect } from "react";
import SubtitleOverlay from "./SubtitleOverlay";

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^?&]+)/);
  return match ? match[1] : null;
}

export default function VideoPlayer({ url, playing, onTogglePlay, currentTime, setCurrentTime, detectedTerms }) {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const youtubeId = getYouTubeId(url);
  const isYouTube = !!youtubeId;

  // Sync play/pause state for local video
  useEffect(() => {
    if (!isYouTube && videoRef.current) {
      if (playing) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [playing, isYouTube]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  return (
    <div className="relative w-full aspect-video bg-[#1A1A1A] rounded-xl overflow-hidden border-2 border-[#2D2D2D] shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col group">
      
      <div className="flex-grow relative">
        {isYouTube ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${playing ? 1 : 0}&modestbranding=1&rel=0`}
            title="VidSage Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none' }}
          />
        ) : (
          <video
            ref={videoRef}
            src={url}
            controls
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
        )}

        {/* Subtitles & Overlays */}
        <SubtitleOverlay currentTime={currentTime} detectedTerms={detectedTerms} />
      </div>

      {/* Progress info bar for local files */}
      {!isYouTube && (
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent pt-12 pb-4 px-4 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
           <div className="w-full h-2 bg-white/20 rounded-full mb-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full" style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}></div>
           </div>
           <div className="flex items-center justify-between text-white">
             <div className="text-sm font-mono tracking-wider opacity-80">
               {formatTime(currentTime)} / {formatTime(duration)}
             </div>
           </div>
        </div>
      )}

    </div>
  );
}
