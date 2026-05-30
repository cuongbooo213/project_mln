import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, Brain } from 'lucide-react';
import logoSingle from '../assets/logo.jpg';
import logoMulti from '../assets/logo21.png';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 w-full flex flex-col lg:flex-row h-full">
      {/* Cột trái: Ai Là Triết Gia (Chơi Đơn) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-700/50 bg-slate-900/20 hover:bg-slate-800/40 transition-all duration-500 group">
        <div className="mb-8 transform group-hover:scale-105 transition-transform duration-500">
          <img src={logoSingle} alt="Ai Là Triết Gia Logo" className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-full shadow-[0_0_30px_rgba(234,179,8,0.3)] ring-4 ring-yellow-500/30" />
        </div>
        
        <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 mb-4 text-center">
          Ai Là Triết Gia
        </h2>
        <p className="text-lg text-slate-400 mb-10 max-w-sm text-center leading-relaxed">
          Thử thách kiến thức triết học của bạn qua 15 câu hỏi để giành lấy phần thưởng lên đến 500 triệu đồng.
        </p>

        <button 
          onClick={() => navigate('/millionaire')}
          className="w-full max-w-[320px] flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white py-4 px-8 rounded-2xl font-bold text-xl shadow-lg shadow-yellow-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <Brain size={28} />
          <span>Chơi Đơn</span>
        </button>
      </div>

      {/* Cột phải: Philosophy Arena (Chơi Nhiều Người) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 bg-slate-900/20 hover:bg-slate-800/40 transition-all duration-500 group">
        <div className="mb-8 transform group-hover:scale-105 transition-transform duration-500">
          <img src={logoMulti} alt="Philosophy Arena Logo" className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-full shadow-[0_0_30px_rgba(99,102,241,0.3)] ring-4 ring-indigo-500/30 bg-white" />
        </div>
        
        <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-4 text-center">
          Philosophy Arena
        </h2>
        <p className="text-lg text-slate-400 mb-10 max-w-sm text-center leading-relaxed">
          Cạnh tranh kiến thức với bạn bè trong thời gian thực qua các phòng thi đấu trực tuyến.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-[400px]">
          <button 
            onClick={() => navigate('/create-room')}
            className="btn-primary flex-1 !py-4"
          >
            <Play size={24} />
            <span className="text-lg">Tạo Phòng</span>
          </button>
          
          <button 
            onClick={() => navigate('/join-room')}
            className="btn-secondary flex-1 !py-4"
          >
            <Users size={24} />
            <span className="text-lg">Tham Gia</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
