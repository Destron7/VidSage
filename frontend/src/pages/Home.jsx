import { BackgroundPaths } from "@/components/ui/background-paths";
import { GridBeam } from "@/components/ui/background-grid-beam";
import { GradientText } from "@/components/ui/gradient-text";
import { Button } from "@/components/ui/button";
import { Mic, BookOpen, Download, HardDrive, PenTool } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();

  return (
    <BackgroundPaths>
      <div className="flex flex-col items-center justify-center text-center max-w-5xl mx-auto pt-10 font-sans text-[#2D2D2D]">
        
        {/* App Title & Tagline */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-[#2D2D2D]/30 shadow-sm backdrop-blur-md mb-6 transform -rotate-1">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-sm font-semibold text-[#2D2D2D] tracking-wider uppercase">Local AI Engine Ready</span>
          </div>
          
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold mb-6 tracking-tighter" style={{ fontFamily: 'Georgia, serif' }}>
            <span className="text-[#1A1A1A]">
              Vid<GradientText className="text-[#1A1A1A]">Sage</GradientText>
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-[#4A4A4A] max-w-2xl mx-auto mb-16 italic font-serif">
             AI intelligence layered on any video.<br/>
             <span className="font-bold text-[#D04A4A] not-italic decoration-wavy underline decoration-[#D04A4A]/40 underline-offset-4">Free. Local. Yours.</span>
          </p>
        </motion.div>

        {/* CTA Section */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl mb-24 z-20">
          
          {/* Card 1: Viewer Mode */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="group relative"
          >
            <div className="absolute top-2 left-2 right-2 bottom-2 bg-blue-200 rounded-xl transform -rotate-2 -z-10 transition-transform group-hover:-rotate-3 translate-x-2 translate-y-2"></div>
            <div className="relative h-full bg-[#fdfdfd] border-2 border-[#2D2D2D] rounded-xl p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
              <div className="h-16 w-16 mb-6">
                 <PenTool className="h-full w-full stroke-[1.5px] text-blue-700" />
              </div>
              <h3 className="text-3xl font-bold text-[#1A1A1A] mb-3" style={{ fontFamily: 'Georgia, serif' }}>I'm a Viewer</h3>
              <p className="text-[#5A5A5A] mb-8 flex-grow font-medium leading-relaxed">
                Watch videos with real-time AI subtitle cards and an interactive glossary for complex topics.
              </p>
              <Button 
                onClick={() => navigate('/upload?mode=viewer')}
                className="w-full bg-[#1A1A1A] hover:bg-[#2D2D2D] text-white rounded border-b-4 border-r-4 border-blue-900 py-6 text-lg tracking-wide shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:border-b-0 hover:border-r-0 hover:shadow-none transition-all"
              >
                Launch Viewer Mode
              </Button>
            </div>
          </motion.div>

          {/* Card 2: Scientist Mode */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="group relative"
          >
             <div className="absolute top-2 left-2 right-2 bottom-2 bg-amber-200 rounded-xl transform rotate-2 -z-10 transition-transform group-hover:rotate-3 translate-x-2 translate-y-2"></div>
             <div className="relative h-full bg-[#fdfdfd] border-2 border-[#2D2D2D] rounded-xl p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
               <div className="h-16 w-16 mb-6">
                 <Mic className="h-full w-full stroke-[1.5px] text-amber-700" />
              </div>
              <h3 className="text-3xl font-bold text-[#1A1A1A] mb-3" style={{ fontFamily: 'Georgia, serif' }}>I'm a Scientist</h3>
              <p className="text-[#5A5A5A] mb-8 flex-grow font-medium leading-relaxed">
                Interact with the AI via voice, pin detailed notes, and export comprehensive PDF research briefs.
              </p>
              <Button 
                onClick={() => navigate('/upload?mode=scientist')}
                className="w-full bg-[#1A1A1A] hover:bg-[#2D2D2D] text-white rounded border-b-4 border-r-4 border-amber-900 py-6 text-lg tracking-wide shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:border-b-0 hover:border-r-0 hover:shadow-none transition-all"
              >
                Launch Scientist Mode
              </Button>
             </div>
          </motion.div>

        </div>

        {/* Feature Strip utilizing GridBeam */}
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.6 }}
           className="w-full max-w-5xl rounded-lg overflow-hidden border-2 border-[#2D2D2D] bg-[#FAFAFA] shadow-[4px_4px_0px_rgba(0,0,0,1)] relative"
        >
          {/* Notebook line styling */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_95%,_rgba(0,0,0,0.1)_100%)] bg-[length:100%_25px]"></div>
          
          <GridBeam className="py-12 px-6 mix-blend-multiply">
            <h4 className="text-[#2D2D2D] font-bold text-xl mb-10 tracking-widest uppercase border-b-2 border-dashed border-[#2D2D2D]/30 pb-4 inline-block">Core Capabilities</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
               <div className="flex flex-col items-center gap-4 group">
                 <div className="p-3 bg-red-100 rounded-full border border-red-900 group-hover:rotate-12 transition-transform shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
                    <BookOpen className="text-red-900 h-6 w-6 stroke-[2px]" />
                 </div>
                 <span className="text-sm text-[#2D2D2D] font-bold">Auto-detects Jargon</span>
               </div>
               <div className="flex flex-col items-center gap-4 group">
                 <div className="p-3 bg-blue-100 rounded-full border border-blue-900 group-hover:-rotate-12 transition-transform shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
                    <Mic className="text-blue-900 h-6 w-6 stroke-[2px]" />
                 </div>
                 <span className="text-sm text-[#2D2D2D] font-bold">Voice Commands</span>
               </div>
               <div className="flex flex-col items-center gap-4 group">
                 <div className="p-3 bg-emerald-100 rounded-full border border-emerald-900 group-hover:rotate-12 transition-transform shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
                    <Download className="text-emerald-900 h-6 w-6 stroke-[2px]" />
                 </div>
                 <span className="text-sm text-[#2D2D2D] font-bold">Export PDF Briefs</span>
               </div>
               <div className="flex flex-col items-center gap-4 group">
                 <div className="p-3 bg-amber-100 rounded-full border border-amber-900 group-hover:-rotate-12 transition-transform shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
                    <HardDrive className="text-amber-900 h-6 w-6 stroke-[2px]" />
                 </div>
                 <span className="text-sm text-[#2D2D2D] font-bold">Runs 100% Offline</span>
               </div>
            </div>
          </GridBeam>
        </motion.div>

        {/* Minimal Footer built-in */}
        <div className="mt-20 mb-8 pt-8 border-t-[3px] border-dotted border-[#2D2D2D] w-full flex flex-col items-center font-bold">
            <span className="text-sm text-[#5A5A5A] uppercase tracking-widest mb-2">Runs locally • Zero API costs • Open Source</span>
        </div>

      </div>
    </BackgroundPaths>
  );
}
