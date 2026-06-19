import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import our Page architectures
import LandingPage from './pages/LandingPage';
import CommandCentre from './pages/CommandCentre';
import StatsPage from './pages/StatsPage';
import SocQueue from './pages/SocQueue';
import BandDemo from './pages/BandDemo';


function App() {
  return (
    <Router>
      <div className="min-h-screen font-sans bg-phalanx-bg text-white">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/console" element={<CommandCentre />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/queue" element={<SocQueue />} />
          <Route path="/band-demo" element={<BandDemo />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;