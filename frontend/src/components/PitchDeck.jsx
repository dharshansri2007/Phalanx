import React, { useState, useEffect } from 'react';
import { 
  Shield, X, ChevronLeft, ChevronRight, 
  AlertTriangle, Lock, TrendingDown, Layers, Zap, Crosshair
} from 'lucide-react';

const SLIDES = [
  {
    id: 'problem',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    glow: 'bg-red-900/20',
    title: 'The Core Problem',
    subtitle: 'LLMS CANNOT DEFEND THEMSELVES',
    points: [
      "Prompt injection allows attackers to bypass standard guardrails by manipulating an LLM's context window, forcing it to execute malicious commands.",
      "Most 'security' solutions just use another LLM to check inputs. This creates a recursive vulnerability loop and massive token overhead.",
      "Current enterprise firewalls fail at 'Tier-0' ingestion—they get blocked by 403 Forbidden pages when trying to scrape necessary context data."
    ]
  },
  {
    id: 'impact',
    icon: TrendingDown,
    iconColor: 'text-orange-500',
    glow: 'bg-orange-900/20',
    title: 'Why It Matters',
    subtitle: 'THE COST OF UNCHECKED INGESTION',
    points: [
      "In 2024, a major prompt injection attack on a customer service AI resulted in the leak of proprietary pricing models and PII data.",
      "The average cost of a data breach involving compromised AI systems now exceeds $4.45M per incident, primarily due to exfiltrated training data.",
      "Source: IBM Cost of a Data Breach Report 2024 & OWASP Top 10 for LLM Applications (LLM01: Prompt Injection)."
    ]
  },
  {
    id: 'solution',
    icon: Lock,
    iconColor: 'text-emerald-500',
    glow: 'bg-emerald-900/20',
    title: 'The Solution',
    subtitle: 'MULTI-AGENT AIR GAP FIREWALL',
    points: [
      "Phalanx completely isolates your core enterprise model from raw web data using a decentralized, multi-agent swarm architecture.",
      "A rigid, sequential three-tier interrogation pipeline (Deterministic, Mathematical, Semantic) guarantees payload safety before execution.",
      "Failsafe design: The Band SDK orchestration ensures that if any single agent flags a threat or goes offline, the payload is immediately quarantined."
    ]
  },
  {
    id: 'why-us',
    icon: Crosshair,
    iconColor: 'text-blue-500',
    glow: 'bg-blue-900/20',
    title: 'Why Us?',
    subtitle: 'BEYOND BASIC PROMPT WRAPPERS',
    points: [
      "Tier-0 Bypassing: We use Bright Data rotating proxies natively in our Ingestion agent to fetch raw HTML without hitting CAPTCHAs or 403 errors.",
      "Tier-1.5 Cryptanalysis: We run pure mathematical checks (Shannon Entropy, Chi-Squared) to catch encrypted payloads instantly, burning zero API tokens.",
      "Tier-3 Compaction: Instead of passing raw, safe HTML to the user, Llama 70B distills it into a dense JSON summary, saving massive context window costs."
    ]
  },
  {
    id: 'architecture',
    icon: Layers,
    iconColor: 'text-purple-500',
    glow: 'bg-purple-900/20',
    title: 'Process Flow',
    subtitle: 'ZERO-TRUST ORCHESTRATION',
    points: [
      "1. INGESTION: Agent fetches external data -> 2. REGEX: Deterministic pattern matching drops obvious threats.",
      "3. STATS ENGINE: Math isolates obfuscated code -> 4. SEMANTIC (Gemini): Deep behavioral analysis catches zero-day logic traps.",
      "5. COMPACTION (Llama): Cleared data is compressed -> 6. DELIVERY: Enterprise model safely consumes the sanitized JSON."
    ]
  },
  {
    id: 'business',
    icon: Zap,
    iconColor: 'text-white',
    glow: 'bg-gray-700/20',
    title: 'Enterprise Ready',
    subtitle: 'SCALABLE. SECURE. SEAMLESS.',
    points: [
      "Cloud-Native: Hosted on Google Cloud Run for auto-scaling, serverless execution capable of handling massive, sudden threat traffic spikes.",
      "Model-Agnostic: Phalanx protects OpenAI, Anthropic, or local open-source models with zero integration friction.",
      "Built for Production: A true zero-trust AI proxy architected to enforce strict deterministic control over unpredictable generative systems."
    ]
  }
];

export default function PitchDeck({ onClose }) {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => setCurrent((prev) => (prev < SLIDES.length - 1 ? prev + 1 : prev));
  const prevSlide = () => setCurrent((prev) => (prev > 0 ? prev - 1 : prev));

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const slide = SLIDES[current];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col font-sans text-white animate-[fadeIn_0.3s_ease-out]">
      
      {/* Dynamic Background Glow based on current slide */}
      <div className={`absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none transition-colors duration-1000 ${slide.glow}`} />

      {/* Header */}
      <header className="flex-shrink-0 h-20 border-b border-[#222] px-8 flex items-center justify-between relative z-10 bg-[#050505]/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#0a0a0a] border border-[#222] flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="font-bold tracking-wide text-lg leading-tight">Phalanx AI</h2>
            <div className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">
              Presentation Mode // {current + 1} of {SLIDES.length}
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="group border border-[#222] bg-[#0a0a0a] hover:border-gray-500 hover:text-white transition-all duration-300 px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] flex items-center text-gray-400 rounded-md"
        >
          <X className="w-4 h-4 mr-2" /> EXIT
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-8 lg:p-16 gap-12 lg:gap-24 relative z-10 max-w-[1600px] mx-auto w-full">
        
        {/* Left Side: Title & Icon */}
        <div className="w-full lg:w-5/12 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
          <div key={`icon-${current}`} className="animate-[slideUp_0.5s_ease-out]">
            <div className={`w-32 h-32 rounded-3xl bg-[#0a0a0a] border border-[#222] flex items-center justify-center shadow-2xl relative overflow-hidden`}>
              <div className={`absolute inset-0 opacity-20 ${slide.glow}`} />
              <Icon className={`w-16 h-16 ${slide.iconColor} relative z-10`} />
            </div>
          </div>
          
          <div key={`text-${current}`} className="space-y-4 animate-[slideUp_0.6s_ease-out]">
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-tight text-white drop-shadow-md">
              {slide.title}
            </h1>
            <h3 className="font-mono text-sm lg:text-base text-emerald-500 uppercase tracking-[0.2em] font-bold">
              {slide.subtitle}
            </h3>
          </div>
        </div>

        {/* Right Side: 3 Points */}
        <div className="w-full lg:w-7/12 flex flex-col gap-5">
          {slide.points.map((point, index) => (
            <div 
              key={`${current}-${index}`} 
              className="bg-[#0a0a0a] border border-[#222] p-6 lg:p-8 rounded-2xl flex gap-6 items-start shadow-xl"
              style={{ 
                animation: `slideUp 0.${5 + index * 2}s ease-out forwards`,
                opacity: 0 
              }}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#111] border border-[#333] flex items-center justify-center font-mono text-xs text-gray-400 font-bold mt-1">
                0{index + 1}
              </div>
              <p className="text-gray-300 font-sans text-base lg:text-lg leading-relaxed pt-1.5">
                {point}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="flex-shrink-0 h-24 border-t border-[#222] px-8 lg:px-16 flex items-center justify-between relative z-10 bg-[#050505]">
        
        {/* Progress Tracker */}
        <div className="flex items-center gap-3">
          {SLIDES.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === current ? 'w-12 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                idx < current ? 'w-4 bg-[#444]' : 'w-4 bg-[#222]'
              }`} 
            />
          ))}
        </div>

        {/* Nav Buttons */}
        <div className="flex items-center gap-4">
          <button 
            onClick={prevSlide}
            disabled={current === 0}
            className="w-12 h-12 rounded-full border border-[#222] bg-[#0a0a0a] flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={nextSlide}
            disabled={current === SLIDES.length - 1}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group ${
              current === SLIDES.length - 1 
                ? 'bg-[#222] text-gray-500 cursor-not-allowed' 
                : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
            }`}
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </footer>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}