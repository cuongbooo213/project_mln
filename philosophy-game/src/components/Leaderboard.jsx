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
            className={`flex items-center justify-between p-4 rounded-xl ${
              idx === 0 ? 'bg-yellow-500/20 border border-yellow-500/50' : 
              idx === 1 ? 'bg-slate-300/20 border border-slate-300/50' :
              idx === 2 ? 'bg-amber-700/20 border border-amber-700/50' :
              'bg-slate-800 border border-slate-700'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
                ${idx === 0 ? 'bg-yellow-500 text-yellow-900' : 
                  idx === 1 ? 'bg-slate-300 text-slate-800' :
                  idx === 2 ? 'bg-amber-600 text-amber-100' :
                  'bg-slate-700 text-slate-300'}`}>
                {idx + 1}
              </div>
              <span className="font-medium text-lg truncate max-w-[150px]">{player.name}</span>
            </div>
            <div className="font-bold text-xl text-indigo-300">
              {player.score} <span className="text-sm text-indigo-400/70 font-normal">pts</span>
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
