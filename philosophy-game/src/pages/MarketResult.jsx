import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '../firebase/config';
import { Trophy, Coins, Package, Star, AlertTriangle, Home } from 'lucide-react';

const MarketResult = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { playerId } = location.state || {};
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const snap = await get(ref(database, `rooms/${roomCode}`));
      if (snap.exists()) setRoomData(snap.val());
    };
    fetch();
  }, [roomCode]);

  if (!roomData) {
    return <div className="flex-1 flex items-center justify-center text-white">Đang tải kết quả...</div>;
  }

  const teams = roomData.teams || {};

  // Calculate final scores
  const rankings = Object.entries(teams).map(([tId, team]) => {
    const xu = team.xu || 0;
    const missionScore = team.score || 0;
    const inventory = team.inventory || {};
    const itemCount = Object.keys(inventory).length;
    const fakeCount = Object.values(inventory).filter(i => i.isFake).length;
    const rareCount = Object.values(inventory).filter(i => i.type === 'rare' && !i.isFake).length;

    const totalScore = xu + missionScore;

    return {
      teamId: tId,
      name: team.name,
      emoji: team.emoji,
      xu,
      missionScore,
      itemCount,
      fakeCount,
      rareCount,
      totalScore,
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const winner = rankings[0];
  const myTeamId = roomData.players?.[playerId]?.teamId;

  return (
    <div className="flex-1 flex flex-col items-center p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-3xl">
        {/* Winner */}
        <div className="text-center mb-8 relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-6xl animate-bounce">🏆</div>
          <div className="pt-16 pb-6 bg-gradient-to-br from-amber-900/40 to-slate-900/80 rounded-2xl border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2">
              {winner.emoji} {winner.name}
            </h2>
            <p className="text-xl text-amber-300 font-bold mb-1">🏆 Vô Địch Chợ Lịch Sử!</p>
            <p className="text-4xl font-black text-white">{winner.totalScore} điểm</p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
          <div className="bg-slate-800 p-4 border-b border-slate-700">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy size={20} className="text-amber-400" /> Bảng Xếp Hạng Chung Cuộc
            </h3>
          </div>
          <div className="divide-y divide-slate-700">
            {rankings.map((team, index) => {
              const isMe = team.teamId === myTeamId;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={team.teamId}
                  className={`p-4 flex items-center gap-4 ${isMe ? 'bg-amber-900/20' : ''} ${index < 3 ? 'bg-slate-800' : ''}`}>
                  <div className="text-2xl w-10 text-center font-bold">
                    {medals[index] || <span className="text-slate-500 text-lg">{index + 1}</span>}
                  </div>
                  <div className="text-2xl">{team.emoji}</div>
                  <div className="flex-1">
                    <div className="font-bold text-white flex items-center gap-2">
                      {team.name}
                      {isMe && <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">Đội bạn</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><Coins size={12} className="text-amber-400" /> {team.xu} Xu còn</span>
                      <span className="flex items-center gap-1"><Star size={12} className="text-green-400" /> {team.missionScore} Nhiệm vụ</span>
                      <span className="flex items-center gap-1"><Package size={12} /> {team.itemCount} món</span>
                      {team.fakeCount > 0 && (
                        <span className="flex items-center gap-1 text-red-400"><AlertTriangle size={12} /> {team.fakeCount} hàng giả</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-amber-400">{team.totalScore}</div>
                    <div className="text-xs text-slate-500">điểm</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={() => navigate('/')}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg">
          <Home size={20} /> Về Trang Chủ
        </button>
      </div>
    </div>
  );
};

export default MarketResult;
