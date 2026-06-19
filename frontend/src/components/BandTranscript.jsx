import React, { useEffect, useRef } from 'react';

const AGENT_STYLES = {
  PhalanxIngestion: 'text-blue-400',
  PhalanxSecurity: 'text-gray-300',
  PhalanxCompactor: 'text-gray-300',
};

const VARIANT_TEXT = {
  neutral: 'text-gray-400',
  success: 'text-emerald-400',
  danger: 'text-red-400',
  warn: 'text-amber-400',
};

export default function BandTranscript({ chatLogs = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatLogs.length]);

  return (
    <div className="bg-[#050505] border border-[#222] rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl relative">
      
      {/* Mac-Style Header to match simulator */}
      <div className="border-b border-[#222] bg-[#0a0a0a] p-4 flex items-center justify-between font-mono relative z-10 flex-shrink-0">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]"></div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">// Orchestration</div>
            <div className="text-sm font-bold text-white tracking-wide">Band Agent Swarm Log</div>
          </div>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
      </div>

      <div ref={scrollRef} className="flex-1 p-6 space-y-5 overflow-y-auto font-mono text-sm custom-scrollbar bg-black/50">
        {chatLogs.length === 0 && (
          <div className="text-gray-600 text-xs flex h-full items-center justify-center text-center">
            No activity yet.<br/>Run the pipeline simulator to watch the agent handoff.
          </div>
        )}
        {chatLogs.map((entry, i) => (
          <div
            key={i}
            className={`space-y-1.5 ${entry.variant === 'danger' ? 'pl-4 border-l-2 border-red-500 bg-red-500/5 py-2' : entry.variant === 'success' ? 'pl-4 border-l-2 border-emerald-500 bg-emerald-500/5 py-2' : 'pl-4 border-l-2 border-gray-800'}`}
            style={{ animation: 'phalanx-fade-in 0.3s ease-out' }}
          >
            <div className={`text-xs ${AGENT_STYLES[entry.agent] || 'text-gray-500'}`}>@{entry.agent}</div>
            <div className={`${VARIANT_TEXT[entry.variant] || 'text-gray-300'} leading-relaxed`}>{entry.text}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes phalanx-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #050505; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #222; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #333; 
        }
      `}</style>
    </div>
  );
}