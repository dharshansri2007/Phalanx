import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'text-white' : 'text-gray-600 hover:text-white';

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-[#222] h-16 flex items-center justify-between px-6 md:px-12">
      <Link to="/" className="flex items-center space-x-2 text-white group">
        <ShieldAlert className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
        <span className="font-mono font-bold tracking-widest text-lg">PHALANX_AI</span>
      </Link>
      <div className="hidden md:flex space-x-8 font-mono text-xs tracking-wider uppercase">
        <Link to="/console" className={isActive('/console')}>/COMMAND-CENTRE</Link>
        <Link to="/queue" className={isActive('/queue')}>/SOC-QUEUE</Link>
        
        {/* <-- Replaced Architecture with Swarm Demo --> */}
        <Link to="/band-demo" className={isActive('/band-demo')}>/SWARM-DEMO</Link>
        
        <Link to="/stats" className={isActive('/stats')}>/STATS-AGENT</Link>
      </div>
    </nav>
  );
}