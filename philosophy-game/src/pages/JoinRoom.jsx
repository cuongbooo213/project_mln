import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinRoom } from '../services/roomService';
import { useAudioContext } from '../contexts/AudioContext';
import { ArrowLeft } from 'lucide-react';
import logo from '../assets/logo21.png';
import bgMusicFile from "../../sound_effect/backgroundmusicbeginning/Nh¡c chuông Nhac gameshow 'Dau truong 100.mp3";

const JoinRoom = () => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const { roomCode, playerId } = await joinRoom(code, name);
      navigate(`/lobby/${roomCode}`, { state: { playerId, isHost: false } });
    } catch (err) {
      console.error(err);
      setError("Không tìm thấy phòng hoặc phòng đã bắt đầu chơi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative w-full">
      <button 
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="hidden md:inline">Quay lại</span>
      </button>

      <div className="panel w-full max-w-md relative pt-20 md:pt-24 mt-16 md:mt-20">
        <div className="absolute -top-16 md:-top-20 left-1/2 -translate-x-1/2">
          <img src={logo} alt="Philosophy Arena" className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)] ring-[6px] ring-slate-800 bg-white" />
        </div>

        <h2 className="text-3xl font-bold mb-6 text-center text-white">Tham Gia Phòng</h2>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mã Phòng</label>
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="input-field font-mono text-lg uppercase tracking-widest"
              placeholder="VD: A1B2C3"
              maxLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tên của bạn</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Nhập nickname..."
              maxLength={20}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !name.trim() || !code.trim()}
            className="btn-primary w-full"
          >
            {loading ? "Đang tham gia..." : "Vào Phòng"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinRoom;
