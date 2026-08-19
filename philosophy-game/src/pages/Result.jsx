import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '../firebase/config';
import Leaderboard from '../components/Leaderboard';
import { useAudioContext } from '../contexts/AudioContext';
import { Home } from 'lucide-react';
import logo from '../assets/logo21.png';
import confetti from 'canvas-confetti';
import bgMusicFile from '../../sound_effect/backgroundmusicbeginning/we_are_the_champions.mp3';

const Result = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [teams, setTeams] = useState({});
  const { isMuted } = useAudioContext();
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchResult = async () => {
      const roomRef = ref(database, `rooms/${roomCode}`);
      const snapshot = await get(roomRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        setTeams(data.teams || {});
      }
    };
    fetchResult();

    // Play music
    audioRef.current = new Audio(bgMusicFile);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
    audioRef.current.muted = isMuted;
    audioRef.current.play().catch(e => console.log("Audio prevented:", e));

    // Fireworks effect
    const duration = 15 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 45, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 100 * (timeLeft / duration);
      
      // Random burst in the air
      confetti({
        ...defaults,
        particleCount: Math.floor(randomInRange(30, 80)),
        startVelocity: randomInRange(20, 40),
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 }
      });

      // Shoot from left
      confetti({
        ...defaults,
        particleCount,
        angle: randomInRange(55, 75),
        spread: randomInRange(50, 70),
        origin: { x: 0, y: 1 }
      });
      
      // Shoot from right
      confetti({
        ...defaults,
        particleCount,
        angle: randomInRange(105, 125),
        spread: randomInRange(50, 70),
        origin: { x: 1, y: 1 }
      });
    }, 200);

    return () => {
      if (audioRef.current) audioRef.current.pause();
      clearInterval(interval);
    };
  }, [roomCode]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Find winner
  const sortedTeams = Object.values(teams).sort((a, b) => b.score - a.score);
  const winner = sortedTeams.length > 0 ? sortedTeams[0] : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center flex flex-col items-center">
        <img src={logo} alt="Mật Mã Lịch Sử" className="w-24 h-24 mb-6 object-cover rounded-full shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-2 ring-indigo-500/30 bg-white" />
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-500 mb-2">
          Kết Quả Chung Cuộc
        </h1>
        <p className="text-slate-400 mb-10 text-lg">Mật mã phòng: {roomCode}</p>

        {winner && (
          <div className="mb-12 animate-bounce">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Đội Chiến Thắng</div>
            <div className="text-4xl font-bold text-white bg-slate-800 border-2 border-yellow-500/50 px-8 py-4 rounded-3xl shadow-[0_0_30px_rgba(234,179,8,0.3)] flex items-center justify-center gap-4">
              👑 {winner.name} 
              <span className="text-2xl text-yellow-500">{winner.score} pts</span>
            </div>
          </div>
        )}

        <Leaderboard teams={teams} />

        <button 
          onClick={() => navigate('/')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl mt-12 w-full max-w-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          <Home size={20} />
          <span>Về Trang Chủ</span>
        </button>
      </div>
    </div>
  );
};

export default Result;
