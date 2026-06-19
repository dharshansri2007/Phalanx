import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, ArrowUpRight, Activity, 
  Presentation, Network, Cpu, Globe, Database, 
  Link as LinkIcon, Calculator, Zap, ShieldAlert, Terminal, PlayCircle
} from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import ShieldVisualiser from '../components/ShieldVisualiser';
import Footer from '../components/Footer';
import PitchDeck from '../components/PitchDeck';

// Custom GitHub icon to replace the removed Lucide brand icon
const GithubIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// Scroll Animation Wrapper
const FadeInSection = ({ children }) => {
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
    <div ref={domRef} className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24'}`}>
      {children}
    </div>
  );
};

// Reusable Tech Card
const TechCard = ({ icon: Icon, title, shortDesc, longDesc, className }) => (
  <div className={`group p-8 rounded-[2rem] bg-[#0a0a0a] border border-[#111] hover:border-gray-800 transition-all duration-500 ease-out overflow-hidden flex flex-col justify-start ${className}`}>
    <Icon className="w-8 h-8 text-gray-500 mb-6 group-hover:text-white transition-colors duration-300" />
    <h3 className="text-2xl font-sans font-bold tracking-tight text-white mb-2">{title}</h3>
    <p className="text-gray-500 font-sans text-sm leading-relaxed mb-4">{shortDesc}</p>
    
    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-in-out">
      <div className="overflow-hidden">
        <div className="pt-4 mt-2 border-t border-[#222]">
          <span className="text-white text-[10px] font-mono uppercase tracking-[0.2em] mb-2 block">Why we chose it</span>
          <p className="text-gray-400 font-sans text-sm leading-relaxed pb-2">{longDesc}</p>
        </div>
      </div>
    </div>
  </div>
);

export default function LandingPage() {
  const [isBooted, setIsBooted] = useState(false);
  const [isDeckOpen, setIsDeckOpen] = useState(false);
  const navigate = useNavigate();

  if (!isBooted) return <LoadingScreen onComplete={() => setIsBooted(true)} />;

  return (
    <div className="min-h-screen bg-black text-white relative font-sans selection:bg-white selection:text-black flex flex-col">
      
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 w-full h-16 bg-black/80 backdrop-blur-md border-b border-[#111] z-50 flex items-center justify-between px-8">
        <div className="flex items-center space-x-2 font-mono font-bold tracking-widest text-white">
          <Shield className="w-4 h-4 text-white" />
          <span>PHALANX</span>
        </div>
        <button onClick={() => navigate('/console')} className="text-[10px] font-mono border border-gray-800 text-gray-400 px-4 py-2 hover:border-white hover:text-white transition-all flex items-center uppercase tracking-widest">
          Command Centre <ArrowUpRight className="w-3 h-3 ml-2" />
        </button>
      </header>

      {/* 1. HERO SECTION */}
      <main className="relative z-10 pt-32 pb-12 px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between min-h-[90vh] gap-16">
        <div className="w-full lg:w-1/2 flex flex-col space-y-8 z-10">
          
          <div className="inline-flex items-center self-start px-3 py-1 border border-[#222] bg-[#0a0a0a] text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-3" />
            System Live
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-sans font-extrabold tracking-tighter text-white">
              Phalanx
            </h1>
            <p className="text-xl md:text-2xl font-mono text-gray-500 leading-snug">
              The <span className="text-white">Air Gap</span> between User & AI.
            </p>
          </div>

          <p className="text-gray-500 font-mono text-xs max-w-md leading-relaxed">
            Every payload an AI agent pulls from the open web passes through three independent checks before it reaches your model: deterministic, mathematical, and semantic.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-8 pt-8">
            <button 
              onClick={() => navigate('/console')}
              className="bg-white text-black font-mono text-sm font-bold px-8 py-4 flex items-center hover:bg-gray-300 transition-all hover:scale-105 active:scale-95 group"
            >
              <Terminal className="w-4 h-4 mr-3" />
              OPEN COMMAND CENTRE
            </button>
            
            <div className="flex flex-col border-l border-gray-800 pl-6">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center mb-1">
                <Activity className="w-3 h-3 text-emerald-500 mr-2" /> Status
              </span>
              <span className="text-sm font-mono text-white">
                AWAITING THREATS
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 h-[560px] relative mt-12 lg:mt-0 flex items-center justify-center">
          <ShieldVisualiser isUnderAttack={true} />
        </div>
      </main>

      {/* 2. THE QUICK LINKS */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pb-24 w-full">
        <FadeInSection>
          <div className="flex flex-col sm:flex-row gap-6">
            <button 
              onClick={() => navigate('/band-demo')}
              className="group border border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black transition-all duration-300 px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] flex items-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              type="button"
            >
              <PlayCircle size={14} className="mr-3 group-hover:scale-110 transition-transform" /> 
              [ BAND_SWARM_DEMO ]
            </button>

            <button 
              onClick={() => setIsDeckOpen(true)}
              className="group border border-gray-600 bg-transparent hover:border-gray-400 hover:text-white transition-all duration-300 px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] flex items-center text-gray-500"
              type="button"
            >
              <Presentation size={14} className="mr-3 group-hover:scale-110 transition-transform" /> 
              [ OFFICIAL_PITCH_DECK ]
            </button>
          </div>
        </FadeInSection>
      </section>

      {/* 3. TECHNOLOGY PARTNERS BENTO BOX GRID */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pb-32 w-full">
        <FadeInSection>
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-sans font-bold tracking-tight text-white mb-4">
              Technology Partners.
            </h2>
            <p className="text-gray-500 font-mono text-sm max-w-2xl">
              Engineered with enterprise-grade infrastructure. Hover over any module to view our implementation rationale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">
            
            <TechCard 
              className="md:col-span-2 md:row-span-2"
              icon={Network}
              title="Band SDK"
              shortDesc="The core orchestration mesh. Connects our Ingestion, Security, and Compaction agents into a unified, zero-trust collaborative environment."
              longDesc="Phalanx uses Band as a live AI chat room. Ingestion @mentions Security directly. If flagged, Compaction is never called. True zero-trust delegation."
            />

            <TechCard 
              className="md:col-span-1"
              icon={Database}
              title="AI ML API"
              shortDesc="Powers the Tier-3 Compaction engine via Llama 70B."
              longDesc="Once a payload clears Regex and Gemini, Llama 70B instantly distills the safe HTML into a dense JSON summary for your enterprise model."
            />

            <TechCard 
              className="md:col-span-1"
              icon={Cpu}
              title="Gemini 2.5 Flash"
              shortDesc="The brain of our Tier-2 semantic evaluator."
              longDesc="Regex catches tags, Math catches encryption. Gemini catches malicious intent. Near-zero latency behavioral analysis before the final handoff."
            />

            <TechCard 
              className="md:col-span-1"
              icon={LinkIcon}
              title="Langchain"
              shortDesc="Complex state machine orchestration."
              longDesc="Wraps our Band adapters in rigid state graphs. Enforces strict sequential execution of our 3-tier firewall before any LLM reads the data."
            />

            <TechCard 
              className="md:col-span-2"
              icon={Globe}
              title="Bright Data"
              shortDesc="Advanced Tier-0 SERP bypassing and page ingestion."
              longDesc="Models fail on 403 Forbidden pages. Ingestion natively rotates proxies to bypass SERP blocks, scanning raw HTML, not access-denied errors."
            />

          </div>
        </FadeInSection>
      </section>

      {/* 4. TIER 1.5 MATH / WHY US SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pb-16 w-full">
        <FadeInSection>
          <div className="flex flex-col lg:flex-row gap-16">
            
            {/* Left Column: The Philosophy */}
            <div className="w-full lg:w-1/2 space-y-8 flex flex-col justify-start">
              <div className="inline-flex items-center self-start px-3 py-1 border border-[#222] bg-[#0a0a0a] text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-3" />
                Tier 1.5 Defense
              </div>
              
              <h2 className="text-4xl md:text-6xl font-sans font-extrabold tracking-tighter text-white">
                In Math We Trust.
              </h2>
              
              <div className="space-y-6 text-gray-400 font-sans text-sm leading-relaxed">
                <p>
                  Every other tier in a standard pipeline trusts an AI to judge danger. But an LLM judge can be fooled by the exact same prompt-injection techniques it's meant to catch.
                </p>
                <p className="text-white font-bold">
                  Our Stats Agent trusts nothing but arithmetic.
                </p>
                <p>
                  It runs zero AI models. It evaluates the raw mathematical distribution of characters using published cryptanalytic formulas. It cannot be jailbroken or prompt-injected because it has no language understanding to manipulate.
                </p>
                <div className="border-l border-gray-800 pl-4 py-2 mt-4 text-gray-500 font-mono text-xs">
                  // Sub-millisecond latency. Rejects incoherent garbage before a single Gemini token is spent.
                </div>
              </div>

              {/* Stats Agent Button */}
              <div className="pt-6">
                <button 
                  onClick={() => navigate('/stats')}
                  className="group border border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black transition-all duration-300 px-6 py-3 flex items-center justify-center w-fit shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                  type="button"
                >
                  <span className="font-mono text-xs tracking-[0.15em] text-emerald-500 group-hover:text-black uppercase flex items-center">
                    <Calculator size={14} className="mr-3 group-hover:scale-110 transition-transform" /> 
                    [ TRY_OUT_STATS_AGENT ]
                  </span>
                </button>
              </div>
            </div>

            {/* Right Column: The 5 Signals */}
            <div className="w-full lg:w-1/2">
              <div className="bg-[#0a0a0a] border border-[#111] rounded-[2rem] p-8 md:p-10 space-y-6">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-8 border-b border-[#222] pb-4">
                  The Five Signals
                </h3>
                
                <div className="space-y-8">
                  <div className="group border-l-2 border-[#222] pl-6 hover:border-emerald-500 transition-colors duration-300">
                    <h4 className="text-white font-sans font-bold text-base mb-2 group-hover:translate-x-2 transition-transform">01. Shannon Entropy</h4>
                    <p className="text-gray-500 font-sans text-xs leading-relaxed">Measures raw information density. Encoded or randomly packed payloads carry unnatural density compared to normal prose.</p>
                  </div>
                  
                  <div className="group border-l-2 border-[#222] pl-6 hover:border-emerald-500 transition-colors duration-300">
                    <h4 className="text-white font-sans font-bold text-base mb-2 group-hover:translate-x-2 transition-transform">02. Sliding Window Entropy</h4>
                    <p className="text-gray-500 font-sans text-xs leading-relaxed">Scans in microscopic chunks. Short malicious blobs hidden inside large, normal paragraphs can no longer hide behind a low average.</p>
                  </div>
                  
                  <div className="group border-l-2 border-[#222] pl-6 hover:border-emerald-500 transition-colors duration-300">
                    <h4 className="text-white font-sans font-bold text-base mb-2 group-hover:translate-x-2 transition-transform">03. Compression Ratio</h4>
                    <p className="text-gray-500 font-sans text-xs leading-relaxed">Natural language is highly redundant and compresses easily. Random or encoded malicious data does not compress.</p>
                  </div>
                  
                  <div className="group border-l-2 border-[#222] pl-6 hover:border-emerald-500 transition-colors duration-300">
                    <h4 className="text-white font-sans font-bold text-base mb-2 group-hover:translate-x-2 transition-transform">04. Chi-Squared Frequency</h4>
                    <p className="text-gray-500 font-sans text-xs leading-relaxed">Classic cryptanalysis. Compares payload letter distribution against real-world English baselines to instantly detect ciphertext.</p>
                  </div>
                  
                  <div className="group border-l-2 border-[#222] pl-6 hover:border-emerald-500 transition-colors duration-300">
                    <h4 className="text-white font-sans font-bold text-base mb-2 group-hover:translate-x-2 transition-transform">05. Index of Coincidence</h4>
                    <p className="text-gray-500 font-sans text-xs leading-relaxed">Measures character skew. English is skewed heavily towards specific letters (E, T). Malicious noise distributions are perfectly flat.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </FadeInSection>
      </section>

      {/* 5. LOBSTERTRAP INTEGRATION SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pb-16 w-full">
        <FadeInSection>
          <div className="bg-[#050505] border border-[#222] rounded-3xl p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row gap-12 items-center justify-between shadow-2xl relative overflow-hidden">
            
            {/* Ambient Background for this specific card */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full lg:w-2/3 space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Local Edge Security</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-sans font-bold text-white tracking-tight">
                Powered by Lobstertrap.
              </h2>
              
              <div className="text-gray-400 font-sans text-sm md:text-base leading-relaxed space-y-4 max-w-2xl">
                <p>
                  While Phalanx coordinates the multi-agent cloud swarm, the actual edge-level proxy inspection is powered by <strong>Lobstertrap</strong>—an open-source (MIT Licensed) compiled Go binary. 
                </p>
                <p>
                  Lobstertrap sits silently between our custom Regex tier and our statistical Math engine. This can be used  locally as a lightweight binary, it intercepts and validates API structures before they ever hit the cloud, ensuring an extra protection and total structural integrity without cloud latency.
                </p>
              </div>
            </div>

            <div className="w-full lg:w-1/3 flex flex-col gap-4 relative z-10">
              <a 
                href="#" 
                className="group border border-gray-600 bg-[#0a0a0a] hover:border-blue-500 hover:text-white transition-all duration-300 px-6 py-4 flex items-center justify-between rounded-xl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex items-center gap-3">
                  <GithubIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <span className="font-mono text-xs uppercase tracking-widest text-gray-300 group-hover:text-white">View Repository</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
              <p className="text-center text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                Repository link pending update
              </p>
            </div>

          </div>
        </FadeInSection>
      </section>

      {/* 6. FINAL CTA & FOOTER */}
      <section className="relative z-10 border-t border-[#111] bg-[#050505] pt-24 pb-12 px-8 w-full mt-12">
        <FadeInSection>
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <h2 className="text-4xl md:text-6xl font-sans font-extrabold tracking-tighter text-white mb-6">
              Built <span className="text-blue-500">Solo</span> for the User by the Dev.
            </h2>
            <p className="text-gray-500 font-mono text-sm max-w-2xl mb-12">
              Phalanx AI is engineered for true zero-trust environments. Complete air-gapped sanitization. Zero compromised payloads.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 mb-24">
              <button
                onClick={() => navigate('/queue')}
                className="group border border-gray-600 bg-transparent hover:border-gray-400 hover:text-white transition-all duration-300 px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] flex items-center text-gray-500"
                type="button"
              >
                <ShieldAlert size={14} className="mr-3 group-hover:scale-110 transition-transform" /> 
                [ SOC_TABLE ]
              </button>
              
              <button
                onClick={() => navigate('/console')}
                className="group border border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black transition-all duration-300 px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] flex items-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                type="button"
              >
                <Terminal size={14} className="mr-3 group-hover:scale-110 transition-transform" /> 
                [ COMMAND_CENTRE ]
              </button>
            </div>

            <div className="w-full flex flex-col md:flex-row justify-between items-center border-t border-[#222] pt-8 font-mono text-[10px] text-gray-600 uppercase tracking-widest">
              <div>© 2026 Phalanx AI - All rights reserved</div>
              <div className="mt-4 md:mt-0">Architected & designed by Sri Dharshan SD</div>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* <-- INJECTED PITCH DECK MODAL HERE --> */}
      {isDeckOpen && <PitchDeck onClose={() => setIsDeckOpen(false)} />}

    </div>
  );
}