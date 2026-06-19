import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Calculator, AlertTriangle, Cpu, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatsExplorer from '../components/StatsExplorer';

// --- Scroll Animation Wrapper ---
const FadeInSection = ({ children, delay = "0ms" }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisible(true);
    }, { threshold: 0.1 });
    if (domRef.current) observer.observe(domRef.current);
    return () => { if (domRef.current) observer.unobserve(domRef.current); };
  }, []);

  return (
    <div 
      ref={domRef} 
      style={{ transitionDelay: delay }}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24'
      }`}
    >
      {children}
    </div>
  );
};

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black flex flex-col">
      
      {/* Injecting the custom levitation animation directly so you don't have to touch CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes levitate {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-levitate {
          animation: levitate 6s ease-in-out infinite;
        }
      `}} />

      <Navbar />

      <main className="flex-grow pt-32 pb-16 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-32">
        
        {/* 1. HEADER SECTION */}
        <FadeInSection>
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center px-3 py-1 border border-[#222] bg-[#0a0a0a] text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-3" />
              Special Mention
            </div>
            
            <h1 className="text-6xl md:text-8xl font-sans font-extrabold tracking-tighter text-white">
              Tier 1.5 <span className="text-emerald-500">Math.</span>
            </h1>
            
            <p className="text-xl font-mono text-gray-500 max-w-2xl leading-relaxed">
              Zero models. Zero latency. Pure cryptanalytic arithmetic acting as an impenetrable gatekeeper.
            </p>
          </div>
        </FadeInSection>

        {/* 2. THE PIPELINE FLOW DIAGRAM */}
        <FadeInSection delay="200ms">
          <div className="relative">
            {/* Connecting Line behind the cards (desktop only) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-gray-900 -z-10 transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-sm">
              
              {/* TIER 1 */}
              <div className="bg-[#0a0a0a] border border-[#222] p-8 flex flex-col items-center text-center relative group hover:border-gray-600 transition-colors">
                <div className="absolute -top-3 bg-black px-4 text-[10px] text-gray-600 tracking-[0.2em]">TIER 01</div>
                <ShieldCheck className="w-8 h-8 text-gray-600 mb-4" />
                <div className="text-white font-bold tracking-widest uppercase mb-2">REGEX PROXY</div>
                <div className="text-xs text-red-500 mt-auto pt-4">Bypassed by Obfuscation</div>
              </div>

              {/* TIER 1.5 (The Star) */}
              <div className="bg-[#050505] border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)] p-8 flex flex-col items-center text-center relative transform scale-105 z-10">
                <div className="absolute -top-3 bg-black px-4 text-[10px] text-emerald-500 tracking-[0.2em] font-bold">TIER 1.5</div>
                <Calculator className="w-10 h-10 text-emerald-500 mb-4" />
                <div className="text-white font-bold tracking-widest uppercase text-lg mb-2">STATS AGENT</div>
                <div className="text-xs text-emerald-400 mt-auto pt-4 font-bold border-t border-emerald-500/20 w-full">Catches Cryptological Anomalies</div>
              </div>

              {/* TIER 2 */}
              <div className="bg-[#0a0a0a] border border-[#222] p-8 flex flex-col items-center text-center relative group hover:border-gray-600 transition-colors">
                <div className="absolute -top-3 bg-black px-4 text-[10px] text-gray-600 tracking-[0.2em]">TIER 02</div>
                <Cpu className="w-8 h-8 text-gray-600 mb-4" />
                <div className="text-white font-bold tracking-widest uppercase mb-2">GEMINI LLM</div>
                <div className="text-xs text-gray-500 mt-auto pt-4">High Latency / High Cost</div>
              </div>

            </div>
          </div>
        </FadeInSection>

        {/* 3. THE PHILOSOPHY / EXPLANATION */}
        <FadeInSection delay="100ms">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div className="space-y-6">
              <h2 className="text-4xl font-sans font-bold tracking-tight text-white">Why rely on pure math?</h2>
              <div className="w-12 h-1 bg-emerald-500"></div>
              <p className="text-gray-400 font-sans text-sm leading-relaxed">
                Hackers know standard Regex filters look for obvious tags like <code className="bg-[#111] text-red-400 px-2 py-0.5 rounded text-xs mx-1">{'<script>'}</code>. To bypass this, they pack their payloads into Base64 or obfuscate the JavaScript. 
              </p>
              <p className="text-gray-400 font-sans text-sm leading-relaxed">
                If we sent every obfuscated payload directly to an LLM evaluator like Gemini, we would instantly hit API rate limits during an attack and drive up enterprise inference costs.
              </p>
            </div>
            
            <div className="bg-[#0a0a0a] border border-[#111] p-8 rounded-2xl">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-5 h-5 text-emerald-500 mr-3" />
                <h3 className="font-mono text-white text-sm tracking-widest uppercase">The Solution</h3>
              </div>
              <p className="text-gray-400 font-sans text-sm leading-relaxed">
                Our custom Stats-Agent acts as an air-tight, zero-cost gatekeeper. It analyzes the mathematical distribution of characters. By calculating <span className="text-white font-bold">Shannon Entropy</span> to detect packed data, and the <span className="text-white font-bold">Index of Coincidence</span> to detect non-human language, it filters out malicious noise in sub-milliseconds.
              </p>
            </div>
          </div>
        </FadeInSection>

        {/* 4. THE INTERACTIVE WIDGET (Now Levitating) */}
        <FadeInSection>
          <div className="space-y-12 pb-12">
            <div className="text-center">
              <h2 className="text-3xl font-sans font-bold text-white tracking-tight">Signal Explorer</h2>
              <p className="text-gray-500 font-mono text-xs mt-2 uppercase tracking-widest">Test the math engine locally</p>
            </div>
            
            {/* Holographic Levitating Wrapper */}
            <div className="max-w-4xl mx-auto animate-levitate">
              <div className="shadow-[0_30px_60px_rgba(16,185,129,0.1)] rounded-2xl border border-[#222] bg-[#050505] overflow-hidden">
                <StatsExplorer />
              </div>
            </div>
          </div>
        </FadeInSection>

      </main>

      <Footer />
    </div>
  );
}