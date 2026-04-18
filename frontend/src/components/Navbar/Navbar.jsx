import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSessionStore } from "@/store/sessionStore";
import { ArrowLeft, BookOpen, Mic } from "lucide-react";
import { GradientText } from "@/components/ui/gradient-text";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, setMode, jobId } = useSessionStore();

  const isHome = location.pathname === "/";
  const isUpload = location.pathname === "/upload";
  const isLibrary = location.pathname === "/library";
  const isWatch = location.pathname.startsWith("/watch");
  const isSession = location.pathname.startsWith("/session");

  // If we're on Home, maybe we want a minimal transparent navbar or no navbar? Let's make it universal but adapt.
  
  return (
    <header className="h-16 border-b-2 border-[#2D2D2D] bg-[#FAFAFA] flex items-center justify-between px-6 shrink-0 relative shadow-[0_2px_0_rgba(0,0,0,1)] z-50">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_95%,_rgba(0,0,0,0.1)_100%)] bg-[length:100%_16px] opacity-40"></div>
      
      {/* Left side: Logo & Back Button */}
      <div className="flex items-center gap-4 relative z-10">
        {!isHome && (
          <button 
            onClick={() => navigate(-1)} 
            className="p-1.5 border-2 border-[#2D2D2D] rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all bg-white hover:bg-gray-50 flex items-center justify-center text-[#1A1A1A]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <Link to="/" className="flex items-center gap-2 group mr-6">
          <h1 className="font-bold text-xl leading-tight tracking-tight group-hover:scale-105 transition-transform" style={{ fontFamily: 'Georgia, serif' }}>
            <span className="text-[#1A1A1A]">Vid<GradientText className="text-[#1A1A1A]">Sage</GradientText></span>
          </h1>
        </Link>
        
        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-4 border-l-2 border-[#2D2D2D]/30 pl-6">
           <Link 
             to="/library" 
             className={`text-xs font-bold uppercase tracking-widest transition-colors ${isLibrary ? "text-blue-600 underline underline-offset-4 decoration-2" : "text-[#5A5A5A] hover:text-[#1A1A1A]"}`}
           >
             Library
           </Link>
           <Link 
             to="/upload" 
             className={`text-xs font-bold uppercase tracking-widest transition-colors ${isUpload ? "text-blue-600 underline underline-offset-4 decoration-2" : "text-[#5A5A5A] hover:text-[#1A1A1A]"}`}
           >
             Upload
           </Link>
        </div>

        {(isWatch || isSession) && jobId && (
          <div className="ml-6 hidden lg:block">
            <p className="text-[10px] font-mono font-bold text-[#5A5A5A] uppercase tracking-wider bg-white border border-[#2D2D2D]/50 px-2 py-0.5 rounded shadow-sm shadow-[#2D2D2D]/20">
              ID: {jobId.substring(0,8)}
            </p>
          </div>
        )}
      </div>

      {/* Right side: Mode Switcher & Status */}
      <div className="flex items-center gap-4 relative z-10">
        
        {/* Only show mode switcher if we're on a page with a job */}
        {(isWatch || isSession) && (
          <div className="flex bg-white p-1 rounded-md border-2 border-[#2D2D2D] shadow-inner shadow-black/10">
            <button
              onClick={() => {
                setMode("viewer");
                navigate(`/watch/${jobId}`);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                mode === "viewer"
                  ? "bg-[#1A1A1A] text-white shadow-[1px_1px_0px_rgba(0,0,0,1)]"
                  : "text-[#5A5A5A] hover:text-[#1A1A1A]"
              }`}
            >
              <BookOpen className="w-3 h-3" /> Viewer
            </button>
            <button
              onClick={() => {
                setMode("scientist");
                navigate(`/session/${jobId}`);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                mode === "scientist"
                  ? "bg-[#1A1A1A] text-white shadow-[1px_1px_0px_rgba(0,0,0,1)]"
                  : "text-[#5A5A5A] hover:text-[#1A1A1A]"
              }`}
            >
              <Mic className="w-3 h-3" /> Scientist
            </button>
          </div>
        )}

        {/* Global Agent Status (Pulse indicator) */}
        {!isHome && !isUpload && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-[2px_2px_0px_rgba(0,0,0,1)] text-[10px] font-bold uppercase tracking-widest border-2 ${
            mode === 'scientist' 
              ? 'bg-amber-100 border-amber-900 text-amber-900' 
              : 'bg-indigo-100 border-indigo-900 text-indigo-900'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${mode === 'scientist' ? 'bg-amber-600' : 'bg-indigo-600'}`}></span>
            {mode === 'scientist' ? 'Agent Listening' : 'Engine Active'}
          </div>
        )}

      </div>
    </header>
  );
}
