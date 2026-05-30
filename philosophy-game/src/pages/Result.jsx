import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '../firebase/config';
import Leaderboard from '../components/Leaderboard';
import { Home } from 'lucide-react';
import logo from '../assets/logo21.png';

const Result = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState({});

  useEffect(() => {
    const fetchResult = async () => {
      const roomRef = ref(database, `rooms/${roomCode}`);
      const snapshot = await get(roomRef);
      if (snapshot.exists()) {
        setPlayers(snapshot.val().players || {});
      }
    };
    fetchResult();
  }, [roomCode]);

  // Find winner
  const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);
  const winner = sortedPlayers.length > 0 ? sortedPlayers[0] : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center flex flex-col items-center">
        <img src={logo} alt="Philosophy Arena" className="w-24 h-24 mb-6 object-cover rounded-full shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-2 ring-indigo-500/30 bg-white" />
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-2">
          Kết Quả Chung Cuộc
        </h1>
        <p className="text-slate-400 mb-10 text-lg">Phòng chơi: {roomCode}</p>

        {winner && (
          <div className="mb-12 animate-bounce">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Người Chiến Thắng</div>
            <div className="text-4xl font-bold text-white bg-slate-800 border-2 border-yellow-500/50 px-8 py-4 rounded-3xl shadow-[0_0_30px_rgba(234,179,8,0.3)]">
              👑 {winner.name} 
              <span className="text-2xl text-yellow-500 ml-4">{winner.score} pts</span>
            </div>
          </div>
        )}

        <Leaderboard players={players} />

        <button 
          onClick={() => navigate('/')}
          className="btn-secondary mt-12 w-full max-w-sm"
        >
          <Home size={20} />
          <span>Về Trang Chủ</span>
        </button>
      </div>
    </div>
  );
};

export default Result;
