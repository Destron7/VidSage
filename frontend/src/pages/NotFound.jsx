import React from "react";
import { Link } from "react-router-dom";
import { useSessionStore } from "@/store/sessionStore";
import { ArrowLeft, BrainCircuit, Loader2, PlayCircle, Clock, FileText, Sparkles, Wand2 } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  return (
    <div className="relative min-h-screen w-full bg-[#fdf9f4] text-[#1c1c19] font-sans selection:bg-[#dfec60] selection:text-[#1a1d00] overflow-hidden">
      {/* CSS Styles for Paper Texture & Custom Animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .paper-texture {
            background-image: 
                linear-gradient(rgba(196, 199, 199, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(196, 199, 199, 0.1) 1px, transparent 1px);
            background-size: 30px 30px;
        }
        .ink-bleed {
            filter: url(#ink-bleed-filter);
        }
        .scribble-404 {
            font-family: 'Georgia', serif;
            font-weight: 900;
            line-height: 0.8;
            letter-spacing: -0.05em;
        }
      `}} />

      {/* SVG Ink Bleed Filter */}
      <svg style={{ display: "none" }}>
        <filter id="ink-bleed-filter">
          <feTurbulence baseFrequency="0.05" numOctaves="2" result="noise" type="fractalNoise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
        </filter>
      </svg>

      {/* Top Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-[#fdf9f4]/80 backdrop-blur-md border-b border-[#c4c7c7]/10">
        <div className="text-2xl font-black tracking-tight text-[#181818]" style={{ fontFamily: 'Georgia, serif' }}>
          VidSage
        </div>
        <div className="flex gap-4">
          <Link to="/" className="text-xs font-bold uppercase tracking-widest text-[#5e5e5e] hover:text-[#181818] transition-colors">
            Back to Safety
          </Link>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="relative min-h-screen w-full paper-texture flex items-center justify-center overflow-hidden pt-16">
        {/* Background Decor */}
        <div className="absolute top-20 left-10 rotate-[-12deg] opacity-20 pointer-events-none">
          <img className="w-32 h-32" alt="sketch" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqZqQvSFjs8-DW8BY_UA_4BjoRWl6vhkPX6VGefGh9ySvvGFgz42mp2bkV6JBfQ0o7MfuaEgn9_ha3aRki_rGD3FduVPCSwjBsaf9hReFp2Ns2GHgXi_1i6CdlAen01lqATTDKHLLaIYFU9iQ1vLVQOAbV3ok_FURvTH6Pk4Pk17KmUOZh0KH2Wfj3oQ_AdrzFQwYTL0Fwf8A1KhDpxjYLidJuOU5zWqYFIVPF5w1pK-Wcb83ymnWQ3pyiZZUQutAI5lQbayDuwU8" />
        </div>
        <div className="absolute bottom-20 right-20 rotate-[15deg] opacity-20 pointer-events-none">
          <img className="w-40 h-40" alt="coffee" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOmx1ww2PVbDz3d_62RVlrm3xuyGH1swmf3B_Ap3Da8jY2VWslLzfRC-F_h3624qzCCBubJGYi4mNi5fUTkm46oY4S9u0UIUljBV-y1lMvLnextiGAZmCcCeo4sSM4xpjwt1cAwKoVkSbKnBWTqDN-RcYbbY5EeQLr-W30T95MzNpEZXITGwetnXgJ0CvrLnZSa7omQR67O_LA9dEs77GFf5F9Y7AoMZjFkAYl84rwRVrgozzape3FrciP_iAvEeRU3_W0bJXqyn8" />
        </div>

        {/* 404 Central Composition */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl px-6">
          <div className="relative w-full flex flex-col items-center">
            {/* Confused Monsters Lineup */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-3xl -mb-32 md:-mb-44 relative z-0 mix-blend-multiply opacity-90 -mb-48 md:-mb-64"
            >
              <img alt="Lineup of confused monsters" className="w-full h-auto" src="/src/assets/image/monsters_404.png" />
            </motion.div>

            {/* The Big Scribble 404 */}
            <div className="relative z-10">
              <h1 className="scribble-404 text-[12rem] md:text-[20rem] select-none drop-shadow-sm text-[#181818]/60 ink-bleed">
                404
              </h1>
              {/* Thought bubble */}
              <motion.div
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 8 }}
                className="absolute -top-12 right-0 md:right-1/4 bg-white border border-[#c4c7c7]/15 p-3 rounded-xl shadow-sm rotate-[8deg]"
              >
                <p className="text-[10px] font-bold uppercase tracking-tighter text-[#171a00]">Wait... where are we?</p>
              </motion.div>
            </div>
          </div>

          {/* Message Area */}
          <div className="space-y-4 -mt-8 md:-mt-12 relative z-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#181818]" style={{ fontFamily: 'Georgia, serif' }}>
              This page was erased.
            </h2>
            <p className="text-[#5e5e5e] max-w-md mx-auto leading-relaxed">
              It looks like this section of the manuscript was never written, or perhaps someone spilled too much ink on it.
            </p>
          </div>

          {/* Return Button */}
          <div className="mt-12 relative group z-20">
            <Link
              className="relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-br from-[#181818] to-[#2c2c2c] text-white rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition-all duration-300"
              to="/"
            >
              <Wand2 className="w-5 h-5" />
              Return to Library
            </Link>
          </div>
        </div>

        {/* Floating Stickers */}
        <div className="absolute bottom-10 left-10 sticker group hidden md:block">
          <div className="bg-[#dfec60] text-[#1a1d00] px-4 py-2 rounded-md rotate-[-5deg] shadow-md font-bold uppercase text-[10px] tracking-widest border border-black/5 group-hover:rotate-0 transition-transform cursor-default">
            DRAFT
          </div>
        </div>
        <div className="absolute top-40 right-10 sticker group hidden md:block">
          <div className="bg-[#e6e2dd] text-[#5e5e5e] px-4 py-3 rounded-full rotate-[12deg] shadow-lg flex items-center gap-2 group-hover:rotate-[15deg] transition-transform cursor-default">
            <span className="text-[#181818] text-sm">★</span>
            <span className="font-bold text-[10px]">A+ FOR EFFORT</span>
          </div>
        </div>

        {/* Revision Branding */}
        <div className="absolute bottom-6 right-6 flex items-center gap-4 opacity-40">
          <div className="text-right">
            <p className="text-[10px] font-bold text-[#444748] uppercase tracking-widest leading-none">Revision History</p>
            <p className="text-[10px] text-[#444748] font-body">v.404.lost_and_found</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#c4c7c7]/30 flex items-center justify-center text-[#c4c7c7]">
            ✎
          </div>
        </div>
      </main>

      {/* Background Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] contrast-125 brightness-100 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
    </div>
  );
};

export default NotFound;
