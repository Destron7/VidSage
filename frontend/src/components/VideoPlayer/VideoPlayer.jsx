import React, { useRef, useState, useEffect } from "react";
import SubtitleOverlay from "./SubtitleOverlay";

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^?&]+)/);
  return match ? match[1] : null;
}

// Module-level YouTube API loader (ensures single load across re-renders)
let ytApiPromise = null;
function ensureYouTubeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = resolve;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

export default function VideoPlayer({ url, playing, onTogglePlay, currentTime, setCurrentTime, detectedTerms }) {
  const videoRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [ytReady, setYtReady] = useState(false);
  const ytContainerId = useRef(`yt-player-${Date.now()}`);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const youtubeId = getYouTubeId(url);
  const isYouTube = !!youtubeId;

  // ─── YouTube IFrame Player API setup ───
  useEffect(() => {
    if (!isYouTube || !youtubeId) return;

    let destroyed = false;

    const init = async () => {
      await ensureYouTubeAPI();
      if (destroyed) return;

      // Destroy previous instance
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch(e) {}
        ytPlayerRef.current = null;
      }

      ytPlayerRef.current = new window.YT.Player(ytContainerId.current, {
        videoId: youtubeId,
        playerVars: {
          autoplay: playing ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (destroyed) return;
            setYtReady(true);
            if (ytPlayerRef.current?.getDuration) {
              setDuration(ytPlayerRef.current.getDuration());
            }
          },
        },
      });
    };

    init();

    return () => {
      destroyed = true;
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch(e) {}
        ytPlayerRef.current = null;
      }
      setYtReady(false);
    };
  }, [youtubeId, isYouTube]);

  // ─── Poll YouTube player for currentTime (every 250ms) ───
  useEffect(() => {
    if (!isYouTube || !ytReady) return;

    const interval = setInterval(() => {
      if (ytPlayerRef.current?.getCurrentTime) {
        setCurrentTime(ytPlayerRef.current.getCurrentTime());
      }
      if (ytPlayerRef.current?.getDuration && duration === 0) {
        setDuration(ytPlayerRef.current.getDuration());
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isYouTube, ytReady, setCurrentTime]);

  // ─── Sync play/pause for YouTube ───
  useEffect(() => {
    if (!isYouTube || !ytReady || !ytPlayerRef.current) return;
    try {
      if (playing) {
        ytPlayerRef.current.playVideo();
      } else {
        ytPlayerRef.current.pauseVideo();
      }
    } catch(e) {}
  }, [playing, isYouTube, ytReady]);

  // ─── Sync play/pause for local video ───
  useEffect(() => {
    if (!isYouTube && videoRef.current) {
      if (playing) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [playing, isYouTube]);

  // ─── Expose global getTime/seekTo for NotesPanel, Timeline, etc. ───
  useEffect(() => {
    window.__vidsage_getTime = () => {
      if (isYouTube && ytPlayerRef.current?.getCurrentTime) {
        return ytPlayerRef.current.getCurrentTime();
      }
      if (videoRef.current) {
        return videoRef.current.currentTime;
      }
      return currentTime;
    };

    window.__vidsage_seekTo = (time) => {
      if (isYouTube && ytPlayerRef.current?.seekTo) {
        ytPlayerRef.current.seekTo(time, true);
        setCurrentTime(time);
      } else if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    };

    return () => {
      delete window.__vidsage_getTime;
      delete window.__vidsage_seekTo;
    };
  }, [isYouTube, ytReady, currentTime, setCurrentTime]);

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
          <div className="absolute inset-0 w-full h-full">
            <div id={ytContainerId.current} className="w-full h-full" />
          </div>
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
