import React, { useState, useCallback, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import BandTranscript from '../components/BandTranscript';
import PipelineSimulator from '../components/PipelineSimulator';
import Footer from '../components/Footer';
import { ShieldAlert, Bot, Gauge, Radio } from 'lucide-react';

function useCountUp(value, duration = 600) {
  const [display, setDisplay] = useState(value);
  const startRef = useRef(value);
  useEffect(() => {
    const from = startRef.current;
    const delta = value - from;
    if (delta === 0) return;
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(from + delta * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
      else startRef.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return display;
}

function StatusBadge({ mode }) {
  const map = {
    STANDBY: { dot: 'bg-gray-600', text: 'text-gray-400', border: 'border-gray-800' },
    LIVE: { dot: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-800' },
    SIMULATION: { dot: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-800' },
  };
  const s = map[mode];
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-mono uppercase tracking-widest bg-black ${s.border} ${s.text} shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse shadow-[0_0_8px_currentColor]`} /> {mode}
    </span>
  );
}

export default function CommandCentre() {
  const [bandLogs, setBandLogs] = useState([]);
  const [runs, setRuns] = useState(0);
  const [threatsBlocked, setThreatsBlocked] = useState(0);
  const [latencies, setLatencies] = useState([]);
  const [networkMode, setNetworkMode] = useState('STANDBY');
  const runStartRef = useRef(null);

  const handleLog = useCallback((entry) => {
    setBandLogs((prev) => [...prev, entry]);
    if (entry.text.includes('Live backend unreachable')) setNetworkMode('SIMULATION');
  }, []);

  const handleResult = useCallback((result) => {
    const elapsed = runStartRef.current ? (Date.now() - runStartRef.current) / 1000 : 0;
    setRuns((n) => n + 1);
    setLatencies((prev) => [...prev.slice(-9), elapsed]);
    if (!result.ok) setThreatsBlocked((n) => n + 1);
    setNetworkMode((m) => (m === 'STANDBY' ? 'LIVE' : m));
  }, []);

  useEffect(() => {
    if (bandLogs.length === 1) runStartRef.current = Date.now();
  }, [bandLogs.length]);

  const avgLatency = latencies.length
    ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)
    : null;

  const animatedThreats = useCountUp(threatsBlocked);
  const animatedRuns = useCountUp(runs);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative selection:bg-emerald-500 selection:text-black">
      
      {/* Premium ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-8 max-w-7xl mx-auto w-full space-y-16 relative z-10">

        {/* Centered Hero Section (Like Tier 1.5 Page) */}
        <div className="flex flex-col items-center text-center space-y-6 animate-[fadeIn_1s_ease-out]">
          <StatusBadge mode={networkMode} />
          <h1 className="text-6xl md:text-8xl font-sans font-extrabold tracking-tighter">
            Command <span className="text-gray-600">Centre.</span>
          </h1>
          <p className="text-gray-500 font-mono text-sm max-w-2xl leading-relaxed">
            Every payload that reaches this console gets the exact same three-tier interrogation
            your production pipeline runs. Nothing here is faked — when the backend answers,
            you're watching the real thing.
          </p>
        </div>

        {/* Floating Bento Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="group bg-[#050505] border border-[#222] hover:border-[#333] transition-all duration-500 p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-mono flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4 text-red-500" /> Threats Blocked
            </span>
            <span className="font-mono text-5xl font-bold text-white group-hover:scale-110 transition-transform duration-500">{animatedThreats}</span>
          </div>

          <div className="group bg-[#050505] border border-[#222] hover:border-[#333] transition-all duration-500 p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-mono flex items-center gap-2 mb-4">
              <Bot className="w-4 h-4 text-emerald-500" /> Agents Active
            </span>
            <span className="font-mono text-5xl font-bold text-white group-hover:scale-110 transition-transform duration-500">3</span>
          </div>

          <div className="group bg-[#050505] border border-[#222] hover:border-[#333] transition-all duration-500 p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-mono flex items-center gap-2 mb-4">
              <Gauge className="w-4 h-4 text-blue-500" /> Avg Latency
            </span>
            <span className="font-mono text-5xl font-bold text-white group-hover:scale-110 transition-transform duration-500">{avgLatency ? `${avgLatency}s` : '—'}</span>
          </div>

          <div className="group bg-[#050505] border border-[#222] hover:border-[#333] transition-all duration-500 p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-mono flex items-center gap-2 mb-4">
              <Radio className="w-4 h-4 text-gray-400" /> Pipeline Runs
            </span>
            <span className="font-mono text-5xl font-bold text-white group-hover:scale-110 transition-transform duration-500">{animatedRuns}</span>
          </div>
        </div>

        {/* Dual Scroll Containers - Fixed Height */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[750px]">
          <PipelineSimulator onLog={handleLog} onResult={handleResult} />
          <BandTranscript chatLogs={bandLogs} />
        </div>

      </main>

      <Footer />
    </div>
  );
}