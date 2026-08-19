import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../services/roomService';
import { useAudioContext } from '../contexts/AudioContext';
import { ArrowLeft } from 'lucide-react';
import logo from '../assets/logo21.png';
import bgMusicFile from "../../sound_effect/backgroundmusicbeginning/Nh¡c chuông Nhac gameshow 'Dau truong 100.mp3";

const CreateRoom = () => {
  const [name, setName] = useState('');
  const [numQuestions, setNumQuestions] = useState(3);
  const [timePerQuestion, setTimePerQuestion] = useState(90);
  const [numTeams, setNumTeams] = useState(2);
  const [playersPerTeam, setPlayersPerTeam] = useState(4);
  const [loading, setLoading] = useState(false);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      const { roomCode, playerId } = await createRoom(name, numQuestions, timePerQuestion, numTeams, playersPerTeam);
      navigate(`/lobby/${roomCode}`, { state: { playerId, isHost: true } });
    } catch (error) {
      console.error(error);
      alert("Lỗi tạo phòng");
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
          <img src={logo} alt="Mật Mã Lịch Sử" className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] ring-[6px] ring-slate-800 bg-white" />
        </div>

        <h2 className="text-3xl font-bold mb-6 text-center text-white">Tạo Phòng Mới</h2>
        
        <form onSubmit={handleCreate} className="flex flex-col gap-6">
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Số vụ án</label>
              <input 
                type="number" 
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="input-field"
                min="1"
                max="3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Thời gian giải mã (s)</label>
              <input 
                type="number" 
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                className="input-field"
                min="30"
                max="300"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Số đội</label>
              <input 
                type="number" 
                value={numTeams}
                onChange={(e) => setNumTeams(Number(e.target.value))}
                className="input-field"
                min="2"
                max="6"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Số người / đội</label>
              <input 
                type="number" 
                value={playersPerTeam}
                onChange={(e) => setPlayersPerTeam(Number(e.target.value))}
                className="input-field"
                min="2"
                max="10"
                required
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !name.trim()}
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl w-full transition-colors shadow-lg shadow-red-600/20"
          >
            {loading ? "Đang tạo..." : "Tạo Phòng"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom;
