import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Result from './pages/Result';
import MillionaireGame from './pages/MillionaireGame';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 font-sans text-slate-100">
      <header className="w-full py-4 px-6 border-b border-slate-800/50 backdrop-blur-md sticky top-0 z-10 flex justify-center">
        <div className="font-bold text-2xl tracking-tighter text-white flex items-center gap-2">
          <span className="text-indigo-500">Philo</span>Arena
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-start relative">
        {/* Decorative background elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/lobby/:roomCode" element={<Lobby />} />
          <Route path="/game/:roomCode" element={<Game />} />
          <Route path="/result/:roomCode" element={<Result />} />
          <Route path="/millionaire" element={<MillionaireGame />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
