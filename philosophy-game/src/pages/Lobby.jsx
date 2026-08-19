import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ref, onValue, remove } from 'firebase/database';
import { database } from '../firebase/config';
import { startGame } from '../services/gameService';
import { joinTeam } from '../services/roomService';
import RoomCode from '../components/RoomCode';
import { useAudioContext } from '../contexts/AudioContext';
import casesData from '../data/cases.json';
import { Users, Play, Info, LogOut } from 'lucide-react';
import logo from '../assets/logo21.png';
import bgMusicFile from "../../sound_effect/backgroundmusicbeginning/Nh¡c chuông Nhac gameshow 'Dau truong 100.mp3";

const Lobby = () => {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [players, setPlayers] = useState({});
  const [teams, setTeams] = useState({});
  const [playersPerTeam, setPlayersPerTeam] = useState(4);
  const [maxPlayers, setMaxPlayers] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  
  const { playerId, isHost } = location.state || {};

  const { isMuted } = useAudioContext();
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(bgMusicFile);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;
    audioRef.current.muted = isMuted;
    audioRef.current.play().catch(e => console.log("Audio prevented:", e));

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (!roomCode || !playerId) {
      navigate('/');
      return;
    }

    const roomRef = ref(database, `rooms/${roomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlayers(data.players || {});
        setTeams(data.teams || {});
        setPlayersPerTeam(data.playersPerTeam || 4);
        setMaxPlayers((data.numTeams || 2) * (data.playersPerTeam || 4));
        if (data.gameState === 'playing') {
          navigate(`/game/${roomCode}`, { state: { playerId } });
        }
      } else {
        // Room closed or deleted
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [roomCode, playerId, navigate]);

  const handleJoinTeam = async (teamId) => {
    if (!playerId || isHost) return;
    const teamPlayers = Object.keys(teams[teamId]?.players || {}).length;
    if (teamPlayers >= playersPerTeam) return;
    
    await joinTeam(roomCode, playerId, teamId);
  };

  const handleStartGame = async () => {
    setIsStarting(true);
    await startGame(roomCode, casesData);
    // navigate will be handled by the onValue listener when gameState changes
  };

  const handleLeaveRoom = async () => {
    if (playerId) {
      const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
      try {
        await remove(playerRef);
      } catch (error) {
        console.error("Error removing player:", error);
      }
    }
    navigate('/');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
        <button 
          onClick={handleLeaveRoom}
          className="flex items-center gap-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700 transition-colors"
        >
          <LogOut size={20} /> <span className="hidden sm:inline font-medium">Thoát phòng</span>
        </button>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-8 mt-12">
        
        <div className="panel flex flex-col items-center text-center relative pt-20 md:pt-24 mt-16 md:mt-20">
          <div className="absolute -top-16 md:-top-20 left-1/2 -translate-x-1/2">
            <img src={logo} alt="Mật Mã Lịch Sử" className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] ring-[6px] ring-slate-800 bg-white" />
          </div>
          <h2 className="text-3xl font-bold mb-8 text-white">Phòng Chờ</h2>
          <RoomCode code={roomCode} />
        </div>

        <div className="panel">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="text-yellow-500" />
              <h3 className="text-xl font-bold text-white m-0">Người Chơi ({Object.keys(players).length}/{maxPlayers || '...'})</h3>
            </div>
            {isHost && (
              <span className="text-xs font-bold px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full">
                BẠN LÀ HOST
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {Object.entries(teams).map(([teamId, team]) => {
              const teamPlayerIds = Object.keys(team.players || {});
              const isFull = teamPlayerIds.length >= playersPerTeam;
              const amIInThisTeam = players[playerId]?.teamId === teamId;
              
              return (
                <div key={teamId} className="bg-slate-900/50 border border-slate-700 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex justify-between items-center mb-2 border-b border-slate-700/50 pb-2">
                    <h4 className="font-bold text-lg text-white">{team.name}</h4>
                    <span className="text-sm text-slate-400">{teamPlayerIds.length}/{playersPerTeam}</span>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-2 min-h-[80px]">
                    {teamPlayerIds.map(pid => {
                      const player = players[pid];
                      if (!player) return null;
                      return (
                        <div key={pid} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-bold uppercase">
                            {player.name.charAt(0)}
                          </div>
                          <span className="text-sm text-slate-200">{player.name} {pid === playerId && "(Bạn)"}</span>
                        </div>
                      )
                    })}
                  </div>

                  {!isHost && !amIInThisTeam && (
                    <button 
                      onClick={() => handleJoinTeam(teamId)}
                      disabled={isFull}
                      className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                        isFull 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                      }`}
                    >
                      {isFull ? 'Đã đầy' : 'Vào đội này'}
                    </button>
                  )}
                  {amIInThisTeam && (
                    <div className="py-2 px-4 rounded-lg font-medium text-center bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                      Đội của bạn
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mb-8">
             <h4 className="text-sm text-slate-400 mb-3 font-semibold">Người chơi chưa chọn đội:</h4>
             <div className="flex flex-wrap gap-2">
               {Object.entries(players).filter(([id, p]) => !p.isHost && !p.teamId).map(([id, p]) => (
                  <span key={id} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-sm border border-slate-700">
                    {p.name} {id === playerId && "(Bạn)"}
                  </span>
               ))}
               {Object.entries(players).filter(([id, p]) => !p.isHost && !p.teamId).length === 0 && (
                 <span className="text-slate-500 text-sm italic">Không có ai</span>
               )}
             </div>
          </div>

          {isHost ? (
            <button 
              onClick={handleStartGame}
              disabled={isStarting || Object.keys(players).length === 0}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl w-full flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/20"
            >
              <Play size={24} />
              <span>{isStarting ? "Đang Bắt Đầu..." : "Bắt Đầu Game"}</span>
            </button>
          ) : (
            <div className="text-center p-4 bg-slate-900/50 rounded-xl text-slate-400 animate-pulse">
              Đang chờ host bắt đầu game...
            </div>
          )}
        </div>
        
        {/* Luật chơi & Cách tính điểm */}
        <div className="panel">
          <div className="flex items-center gap-3 mb-4">
            <Info className="text-amber-400" />
            <h3 className="text-xl font-bold text-white m-0">Luật Chơi & Tính Điểm</h3>
          </div>
          <div className="text-slate-300 space-y-3 bg-slate-900/50 p-4 md:p-6 rounded-xl border border-slate-700/50 leading-relaxed text-sm md:text-base">
            <p>🎯 <strong className="text-red-400 font-semibold">Mục tiêu:</strong> Các thành viên trong đội cần hợp tác để tìm ra Sự Kiện Lịch Sử.</p>
            <p>🧩 <strong className="text-yellow-400 font-semibold">Phân mảnh manh mối:</strong> Mỗi người trong đội sẽ nhận được các thông tin <strong>khác nhau</strong>. Bạn phải chat và chia sẻ thông tin cho đồng đội.</p>
            <p>⏱️ <strong className="text-indigo-400 font-semibold">Tốc độ là then chốt:</strong> Đội trả lời đúng và nhanh nhất sẽ được điểm cao. Trả lời sai sẽ không có điểm.</p>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Lobby;
