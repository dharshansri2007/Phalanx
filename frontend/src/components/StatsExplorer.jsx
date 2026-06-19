import React, { useState, useEffect } from 'react';
import { Calculator, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';

export default function StatsExplorer() {
  const [payload, setPayload] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [result, setResult] = useState(null); // raw StatsCheckResponse shape

  const analyzeWithStatsAgent = async (text) => {
    setIsAnalyzing(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/stats-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error('Stats API error');
      const data = await response.json();
      setOffline(false);
      setResult(data);
    } catch (error) {
      console.error('Stats agent connection failed:', error);
      setOffline(true);
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!payload) {
      setResult(null);
      setOffline(false);
      return;
    }
    const timeoutId = setTimeout(() => analyzeWithStatsAgent(payload), 500);
    return () => clearTimeout(timeoutId);
  }, [payload]);

  const presets = {
    normal: 'Phalanx is a zero-trust firewall designed to protect enterprise AI workloads.',
    base64: '"PHNjcmlwdD5ldmFsKGF0b2IoJ2QzZDNMbmN6TG5Wd2JHOWhaR1Z5TG1OdmJTOXFjMjl1TDNkbGJuTjBjbVZuTDNWeWJDOXpjRzl5ZEM1d2FIQT0nKSk7PC9zY3JpcHQ+"',
    obfuscated: "var _0x4b3a=['\\x63\\x6f\\x6f\\x6b\\x69\\x65'];window[_0x4b3a[0]]=doc;",
  };

  const metrics = result?.metrics;
  const isAnomaly = result && !result.is_safe;

  return (
    <div className="bg-[#050505] border border-[#222] p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <h3 className="font-mono text-xl flex items-center text-white">
          <Calculator className="mr-3 text-emerald-500" /> SIGNAL EXPLORER
        </h3>
        <div className="flex items-center space-x-3 bg-black border border-gray-800 px-3 py-1.5 rounded-full">
          {isAnalyzing ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Scanning</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Idle</span>
            </>
          )}
        </div>
      </div>

      <textarea
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        placeholder="Paste a payload here, it's sent directly to the real stats_agent.py, no search, no scraping..."
        className="w-full h-32 bg-black border border-gray-800 p-4 font-mono text-sm text-gray-300 focus:border-emerald-500 outline-none transition-colors shadow-inner"
      />

      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 font-mono text-xs items-start sm:items-center">
        <span className="text-gray-500">PRESETS:</span>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setPayload(presets.normal)} className="px-3 py-1 border border-gray-800 hover:text-white hover:border-gray-500 transition-colors bg-black">Normal Prose</button>
          <button onClick={() => setPayload(presets.base64)} className="px-3 py-1 border border-gray-800 hover:text-red-400 hover:border-red-500 transition-colors bg-black">Base64 Injection</button>
          <button onClick={() => setPayload(presets.obfuscated)} className="px-3 py-1 border border-gray-800 hover:text-red-400 hover:border-red-500 transition-colors bg-black">Obfuscated JS</button>
        </div>
      </div>

      {offline && (
        <div className="font-mono text-xs text-amber-500 border border-amber-500/30 bg-amber-500/5 px-4 py-2">
          Couldn't reach the live stats agent. Check VITE_API_URL and that the backend is deployed.
        </div>
      )}

      {result && (
        <div className={`font-mono text-xs px-4 py-3 border flex items-center justify-between ${isAnomaly ? 'border-red-500/50 bg-red-500/5 text-red-400' : 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'}`}>
          <span className="flex items-center">
            {isAnomaly ? <AlertTriangle className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            {isAnomaly ? `ANOMALY DETECTED — ${result.reason}` : 'STATISTICALLY NORMAL'}
          </span>
          <span>risk_score: {result.risk_score.toFixed(3)}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className={`p-5 border ${isAnomaly ? 'border-red-500/50 bg-red-500/5' : 'border-gray-800 bg-black'}`}>
          <div className="text-gray-500 font-mono text-xs mb-3 tracking-widest uppercase">Global Entropy</div>
          <div className="text-3xl font-bold font-mono text-white">{metrics ? metrics.entropy_bits_per_char.toFixed(3) : '—'}</div>
          <div className="text-[10px] font-mono text-gray-600 mt-2">bits/char</div>
        </div>

        <div className={`p-5 border ${isAnomaly ? 'border-red-500/50 bg-red-500/5' : 'border-gray-800 bg-black'}`}>
          <div className="text-gray-500 font-mono text-xs mb-3 tracking-widest uppercase">Max Window Entropy</div>
          <div className="text-3xl font-bold font-mono text-white">{metrics ? metrics.max_window_entropy.toFixed(3) : '—'}</div>
          <div className="text-[10px] font-mono text-gray-600 mt-2">catches blobs hidden in normal text</div>
        </div>

        <div className="p-5 border border-gray-800 bg-black">
          <div className="text-gray-500 font-mono text-xs mb-3 tracking-widest uppercase">Index of Coincidence</div>
          <div className="text-3xl font-bold font-mono text-white">
            {metrics?.index_of_coincidence != null ? metrics.index_of_coincidence.toFixed(4) : 'n/a'}
          </div>
          <div className="text-[10px] font-mono text-gray-600 mt-2 flex items-center"><Activity className="w-3 h-3 mr-1" /> English baseline ~0.0667</div>
        </div>
      </div>
    </div>
  );
}