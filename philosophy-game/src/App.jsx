import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAudioContext } from './contexts/AudioContext';
import { Volume2, VolumeX } from 'lucide-react';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Result from './pages/Result';
import MillionaireGame from './pages/MillionaireGame';
import CreateMarketRoom from './pages/CreateMarketRoom';
import JoinMarketRoom from './pages/JoinMarketRoom';
import MarketLobby from './pages/MarketLobby';
import MarketGame from './pages/MarketGame';
import MarketResult from './pages/MarketResult';

function App() {
  const { isMuted, toggleMute } = useAudioContext();

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 font-sans text-slate-100">
      <header className="w-full py-4 px-6 border-b border-slate-800/50 backdrop-blur-md sticky top-0 z-10 flex justify-center relative">
        <div className="font-bold text-2xl tracking-tighter text-white flex items-center gap-2">
          <span className="text-red-500">Không Gian</span> Triết - Sử
        </div>
        <button 
          onClick={toggleMute} 
          className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors bg-slate-800/50 p-2 rounded-full border border-slate-700/50 hover:bg-slate-700/50"
          title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-start relative">
        {/* Decorative background elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/lobby/:roomCode" element={<Lobby />} />
          <Route path="/game/:roomCode" element={<Game />} />
          <Route path="/result/:roomCode" element={<Result />} />
          <Route path="/millionaire" element={<MillionaireGame />} />
          <Route path="/create-market" element={<CreateMarketRoom />} />
          <Route path="/join-market" element={<JoinMarketRoom />} />
          <Route path="/market-lobby/:roomCode" element={<MarketLobby />} />
          <Route path="/market/:roomCode" element={<MarketGame />} />
          <Route path="/market-result/:roomCode" element={<MarketResult />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
