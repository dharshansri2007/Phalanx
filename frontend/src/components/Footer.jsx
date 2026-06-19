// components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-gray-800 bg-black/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-blue-500" />
          <span>© 2026 Phalanx AI — all rights reserved</span>
        </div>

        <div className="flex items-center space-x-6">
          <Link to="/console" className="hover:text-white transition-colors">Command Centre</Link>
          <Link to="/queue" className="hover:text-white transition-colors">SOC Queue</Link>
        </div>

        <span className="text-gray-600">Architected & built solo by Sri Dharshan</span>
      </div>
    </footer>
  );
}