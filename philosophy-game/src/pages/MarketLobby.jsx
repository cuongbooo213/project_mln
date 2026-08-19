import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ref, onValue, remove } from 'firebase/database';
import { database } from '../firebase/config';
import { joinMarketTeam } from '../services/marketService';
import RoomCode from '../components/RoomCode';
import { useAudioContext } from '../contexts/AudioContext';
import { Users, Store, Play, Info, LogOut } from 'lucide-react';

const MarketLobby = () => {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [players, setPlayers] = useState({});
  const [teams, setTeams] = useState({});
  const [isStarting, setIsStarting] = useState(false);

  const { playerId, isHost } = location.state || {};
  const { isMuted } = useAudioContext();

  useEffect(() => {
    if (!roomCode || !playerId) { navigate('/'); return; }

    const roomRef = ref(database, `rooms/${roomCode}`);
    const unsub = onValue(roomRef, (snap) => {
      const data = snap.val();
      if (data) {
        setRoomData(data);
        setPlayers(data.players || {});
        setTeams(data.teams || {});
        if (data.gameState === 'market') {
          navigate(`/market/${roomCode}`, { state: { playerId } });
        }
      } else {
        navigate('/');
      }
    });
    return () => unsub();
  }, [roomCode, playerId, navigate]);

  const handleJoinTeam = async (teamId) => {
    if (!playerId || isHost) return;
    const ppt = roomData?.config?.playersPerTeam || 7;
    const count = Object.keys(teams[teamId]?.players || {}).length;
    if (count >= ppt) return;
    await joinMarketTeam(roomCode, playerId, teamId);
  };

  const handleStart = async () => {
    setIsStarting(true);
    // We just update gameState; the MarketGame page will handle round loading
    const { update: fbUpdate } = await import('firebase/database');
    await fbUpdate(ref(database, `rooms/${roomCode}`), { gameState: 'market', currentRound: -1 });
  };

  const handleLeave = async () => {
    if (playerId) {
      try { await remove(ref(database, `rooms/${roomCode}/players/${playerId}`)); } catch (e) {}
    }
    navigate('/');
  };

  const config = roomData?.config || {};
  const ppt = config.playersPerTeam || 7;
  const totalPlayers = Object.values(players).filter(p => !p.isHost).length;
  const maxPlayers = (config.numTeams || 9) * ppt;

  return (
    <div className="flex-1 flex flex-col items-center p-4 md:p-6 relative overflow-y-auto">
      <div className="absolute top-4 left-4 z-10">
        <button onClick={handleLeave}
          className="flex items-center gap-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700 transition-colors">
          <LogOut size={18} /> <span className="hidden sm:inline font-medium">Thoát</span>
        </button>
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-6 mt-12">
        {/* Header */}
        <div className="panel flex flex-col items-center text-center py-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
            <Store size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2">Chợ Lịch Sử</h2>
          <p className="text-slate-400 mb-4">Phòng chờ — Chờ các đội tham gia</p>
          <RoomCode code={roomCode} />
          <div className="mt-4 flex gap-4 text-sm text-slate-400">
            <span>💰 {config.startingXu || 1000} Xu</span>
            <span>⏱️ {config.auctionTimer || 15}s/đấu giá</span>
            <span>👥 {totalPlayers}/{maxPlayers}</span>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="text-amber-400" /> Các Đội ({totalPlayers}/{maxPlayers})
            </h3>
            {isHost && (
              <span className="text-xs font-bold px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full">👑 CHỦ CHỢ</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {Object.entries(teams).map(([teamId, team]) => {
              const teamPlayerIds = Object.keys(team.players || {});
              const isFull = teamPlayerIds.length >= ppt;
              const amIHere = players[playerId]?.teamId === teamId;

              return (
                <div key={teamId} className="bg-slate-900/60 border border-slate-700 p-3 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                    <h4 className="font-bold text-white text-sm">{team.emoji} {team.name}</h4>
                    <span className="text-xs text-slate-400">{teamPlayerIds.length}/{ppt}</span>
                  </div>

                  <div className="flex-1 flex flex-col gap-1 min-h-[40px]">
                    {teamPlayerIds.map(pid => {
                      const p = players[pid];
                      if (!p) return null;
                      return (
                        <div key={pid} className="flex items-center gap-1.5 text-xs text-slate-300">
                          <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 text-[10px] font-bold uppercase">{p.name?.charAt(0)}</span>
                          {p.name} {pid === playerId && <span className="text-slate-500">(Bạn)</span>}
                        </div>
                      );
                    })}
                  </div>

                  {!isHost && !amIHere && (
                    <button onClick={() => handleJoinTeam(teamId)} disabled={isFull}
                      className={`py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                        isFull ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                      }`}>
                      {isFull ? 'Đã đầy' : 'Vào đội'}
                    </button>
                  )}
                  {amIHere && (
                    <div className="py-1.5 px-3 rounded-lg text-sm font-medium text-center bg-green-500/20 text-green-400 border border-green-500/30">
                      Đội của bạn
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Unassigned players */}
          {(() => {
            const unassigned = Object.entries(players).filter(([id, p]) => !p.isHost && !p.teamId);
            if (unassigned.length === 0) return null;
            return (
              <div className="mb-4">
                <h4 className="text-sm text-slate-400 mb-2 font-semibold">Chưa chọn đội:</h4>
                <div className="flex flex-wrap gap-2">
                  {unassigned.map(([id, p]) => (
                    <span key={id} className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs border border-slate-700">
                      {p.name} {id === playerId && "(Bạn)"}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {isHost ? (
            <button onClick={handleStart} disabled={isStarting || totalPlayers === 0}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-3 px-6 rounded-xl w-full flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50">
              <Store size={22} />
              <span>{isStarting ? "Đang mở chợ..." : "🏪 Mở Chợ — Bắt Đầu Game"}</span>
            </button>
          ) : (
            <div className="text-center p-4 bg-slate-900/50 rounded-xl text-slate-400 animate-pulse">
              Đang chờ Chủ Chợ mở phiên...
            </div>
          )}
        </div>

        {/* Rules */}
        <div className="panel">
          <div className="flex items-center gap-2 mb-3">
            <Info className="text-amber-400" />
            <h3 className="text-lg font-bold text-white">Luật Chơi Chợ Lịch Sử</h3>
          </div>
          <div className="text-slate-300 space-y-2 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-sm leading-relaxed">
            <p>💰 <strong className="text-amber-400">Mỗi đội nhận {config.startingXu || 1000} Xu</strong> để mua thông tin trong Chợ.</p>
            <p>🏪 <strong className="text-orange-400">Chủ Chợ đưa hàng ra bán</strong> — Các đội đấu giá hoặc mua trực tiếp.</p>
            <p>📜 <strong className="text-blue-400">Hàng hóa gồm:</strong> Mốc thời gian, Nhân vật, Địa điểm, Văn kiện, Manh mối... và cả <strong className="text-red-400">HÀNG GIẢ!</strong></p>
            <p>🧩 <strong className="text-green-400">Cuối mỗi vòng:</strong> Ghép thông tin đã mua để giải nhiệm vụ lịch sử.</p>
            <p>🏆 <strong className="text-yellow-400">Điểm cuối = Xu còn + Điểm nhiệm vụ + Bonus</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketLobby;
