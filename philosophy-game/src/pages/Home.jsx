import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, BookOpen } from 'lucide-react';
import logo from '../assets/logo.jpg';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full flex flex-col items-center text-center">
        <div className="mb-8">
          <img src={logo} alt="Philosophy Arena Logo" className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-full shadow-2xl ring-4 ring-indigo-500/30" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
          Philosophy Arena
        </h1>
        <p className="text-xl text-slate-400 mb-12 max-w-lg">
          Thử thách kiến thức triết học của bạn và cạnh tranh với bạn bè trong thời gian thực.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
          <button 
            onClick={() => navigate('/create-room')}
            className="btn-primary flex-1 max-w-[240px]"
          >
            <Play size={24} />
            <span>Tạo Phòng Mới</span>
          </button>
          
          <button 
            onClick={() => navigate('/join-room')}
            className="btn-secondary flex-1 max-w-[240px]"
          >
            <Users size={24} />
            <span>Tham Gia Phòng</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
