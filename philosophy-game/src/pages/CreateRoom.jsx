import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../services/roomService';
import { ArrowLeft } from 'lucide-react';

const CreateRoom = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      const { roomCode, playerId } = await createRoom(name);
      navigate(`/lobby/${roomCode}`, { state: { playerId, isHost: true } });
    } catch (error) {
      console.error(error);
      alert("Lỗi tạo phòng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="panel w-full max-w-md">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

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
          
          <button 
            type="submit" 
            disabled={loading || !name.trim()}
            className="btn-primary w-full"
          >
            {loading ? "Đang tạo..." : "Tạo Phòng"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom;
