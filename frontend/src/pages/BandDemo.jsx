import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PlayCircle, ShieldCheck, Terminal, Cpu } from 'lucide-react';

export default function BandDemo() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col relative selection:bg-emerald-500 selection:text-black">
      
      {/* Premium ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-8 max-w-7xl mx-auto w-full space-y-12 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-6 animate-[fadeIn_1s_ease-out]">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-800/50 text-[10px] font-mono uppercase tracking-widest bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_currentColor]" />
            Local Execution Capture
          </span>
          <h1 className="text-5xl md:text-7xl font-sans font-extrabold tracking-tighter">
            Swarm <span className="text-gray-600">Orchestration.</span>
          </h1>
          <p className="text-gray-500 font-mono text-sm max-w-2xl leading-relaxed">
            To prevent live API credit drain and ensure zero latency during the pitch, this is a raw, unedited capture of the Band SDK orchestrating our 3-agent swarm locally.
          </p>
        </div>

        {/* Cinematic Video Player Container */}
        <div className="w-full bg-[#0a0a0a] border border-[#222] rounded-2xl overflow-hidden shadow-2xl relative z-10">
          
          {/* Mac-Style Terminal Header */}
          <div className="border-b border-[#222] bg-[#050505] p-4 flex items-center justify-between font-mono relative z-10">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]"></div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">// System Playback</div>
                <div className="text-sm font-bold text-white tracking-wide">band_swarm_execution_final.mp4</div>
              </div>
            </div>
          </div>

          {/* Actual Video */}
          <div className="aspect-video w-full bg-black relative flex items-center justify-center group border-b border-[#222]">
            
            {/* DROP YOUR VIDEO FILE IN THE PUBLIC FOLDER AND UPDATE THIS SRC */}
            <video 
              className="w-full h-full object-contain relative z-20"
              controls
              autoPlay
              muted
            >
              <source src="/your-video-filename-here.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Fallback placeholder underneath video just in case it doesn't load immediately */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] z-10">
              <PlayCircle className="w-16 h-16 text-[#222] mb-4" />
              <p className="font-mono text-[#444] text-xs">Awaiting local video source...</p>
            </div>
          </div>
        </div>

        {/* Explanation Cards below video */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="p-8 bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-xl hover:border-blue-500/50 transition-colors duration-300">
            <Terminal className="w-8 h-8 text-blue-500 mb-6" />
            <h3 className="font-bold text-white mb-3 font-sans text-xl">1. Ingestion @mentions</h3>
            <p className="text-gray-500 text-sm font-mono leading-relaxed">The ingestion agent fetches raw HTML and delegates the payload directly to @PhalanxSecurity via Band's mesh network.</p>
          </div>
          <div className="p-8 bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-xl hover:border-emerald-500/50 transition-colors duration-300">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mb-6" />
            <h3 className="font-bold text-white mb-3 font-sans text-xl">2. Security Gate</h3>
            <p className="text-gray-500 text-sm font-mono leading-relaxed">Math engine and Gemini evaluate the payload. If flagged, execution stops immediately. Compactor is never awakened.</p>
          </div>
          <div className="p-8 bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-xl hover:border-purple-500/50 transition-colors duration-300">
            <Cpu className="w-8 h-8 text-purple-500 mb-6" />
            <h3 className="font-bold text-white mb-3 font-sans text-xl">3. Final Compaction</h3>
            <p className="text-gray-500 text-sm font-mono leading-relaxed">Only if cleared, the heavy Tier 3 agent (Llama) wakes up to distill the safe HTML into clean JSON for the enterprise.</p>
          </div>
        </div>

      </main>
      
      <Footer />
    </div>
  );
}