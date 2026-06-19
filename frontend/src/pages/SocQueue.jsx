import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ThreatTable from '../components/ThreatTable';
import { ShieldAlert } from 'lucide-react';

export default function SocQueue() {
  return (
    <div className="min-h-screen bg-phalanx-bg text-white font-sans flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-12 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Header Block */}
        <div>
          <div className="inline-flex items-center px-3 py-1 border border-phalanx-warning text-phalanx-warning bg-phalanx-warning/5 text-xs font-mono uppercase tracking-widest mb-6">
            <ShieldAlert className="w-3 h-3 mr-2" />
            Track 3: Regulated Workflows
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 uppercase">SOC Threat Queue</h1>
          <p className="text-gray-500 font-mono text-sm max-w-2xl">
            Human-in-the-loop (HITL) approval dashboard. Payloads flagged by Tier 1 or Tier 1.5 math engines require manual security clearance before passing to enterprise LLMs.
          </p>
        </div>

        {/* The Component we just built */}
        <div className="pt-4">
          <ThreatTable />
        </div>
      </main>

      <Footer />
    </div>
  );
}