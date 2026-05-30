import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { startGame } from '../services/gameService';
import RoomCode from '../components/RoomCode';
import questionsData from '../data/questions.json';
import { Users, Play } from 'lucide-react';
import logo from '../assets/logo21.png';

const Lobby = () => {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [players, setPlayers] = useState({});
  const [isStarting, setIsStarting] = useState(false);
  
  const { playerId, isHost } = location.state || {};

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

  const handleStartGame = async () => {
    setIsStarting(true);
    await startGame(roomCode, questionsData);
    // navigate will be handled by the onValue listener when gameState changes
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl flex flex-col gap-8 mt-12">
        
        <div className="panel flex flex-col items-center text-center relative pt-20 md:pt-24 mt-16 md:mt-20">
          <div className="absolute -top-16 md:-top-20 left-1/2 -translate-x-1/2">
            <img src={logo} alt="Philosophy Arena" className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)] ring-[6px] ring-slate-800 bg-white" />
          </div>
          <h2 className="text-3xl font-bold mb-8 text-white">Phòng Chờ</h2>
          <RoomCode code={roomCode} />
        </div>

        <div className="panel">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="text-indigo-400" />
              <h3 className="text-xl font-bold text-white m-0">Người Chơi ({Object.keys(players).length})</h3>
            </div>
            {isHost && (
              <span className="text-xs font-bold px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full">
                BẠN LÀ HOST
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {Object.entries(players).map(([id, player]) => (
              <div key={id} className="bg-slate-900/50 border border-slate-700 p-4 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold uppercase">
                  {player.name.charAt(0)}
                </div>
                <span className="font-medium text-lg text-slate-200 truncate">{player.name}</span>
                {id === playerId && <span className="text-xs text-slate-500 ml-auto">(Bạn)</span>}
              </div>
            ))}
          </div>

          {isHost ? (
            <button 
              onClick={handleStartGame}
              disabled={isStarting || Object.keys(players).length === 0}
              className="btn-primary w-full"
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
        
      </div>
    </div>
  );
};

export default Lobby;
