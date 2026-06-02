import React from 'react';
import { Trophy, Medal } from 'lucide-react';

const Leaderboard = ({ players }) => {
  // players is an object: { id: { name, score } }
  const sortedPlayers = Object.values(players || {}).sort((a, b) => b.score - a.score);

  return (
    <div className="panel w-full max-w-md mx-auto">
      <div className="flex items-center justify-center gap-3 mb-6">
        <Trophy className="text-yellow-500 w-8 h-8" />
        <h2 className="text-2xl font-bold m-0">Bảng Xếp Hạng</h2>
      </div>
      
      <div className="flex flex-col gap-3">
        {sortedPlayers.map((player, idx) => (
          <div 
            key={idx} 
            className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
              idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.6)] animate-[pulse_2s_ease-in-out_infinite] scale-105 my-2' : 
              idx === 1 ? 'bg-gradient-to-r from-slate-300/20 to-slate-400/20 border-2 border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.5)] scale-[1.02] my-1' :
              idx === 2 ? 'bg-gradient-to-r from-amber-700/20 to-amber-600/20 border-2 border-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.5)] scale-[1.01]' :
              'bg-slate-800 border border-slate-700'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg
                ${idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-900 shadow-yellow-500/50' : 
                  idx === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 shadow-slate-400/50' :
                  idx === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-amber-50 shadow-amber-600/50' :
                  'bg-slate-700 text-slate-300'}`}>
                {idx + 1}
              </div>
              <span className={`font-bold text-lg truncate max-w-[150px] ${
                idx === 0 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' :
                idx === 1 ? 'text-slate-200 drop-shadow-[0_0_8px_rgba(203,213,225,0.8)]' :
                idx === 2 ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' :
                'text-slate-200'
              }`}>{player.name}</span>
            </div>
            <div className={`font-extrabold text-2xl ${
                idx === 0 ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]' :
                idx === 1 ? 'text-slate-200 drop-shadow-[0_0_10px_rgba(203,213,225,0.8)]' :
                idx === 2 ? 'text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]' :
                'text-indigo-300'
              }`}>
              {player.score} <span className="text-sm font-normal opacity-70">pts</span>
            </div>
          </div>
        ))}
        {sortedPlayers.length === 0 && (
          <div className="text-center text-slate-400 py-4">Chưa có người chơi nào</div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
