import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinRoom } from '../services/roomService';
import { ArrowLeft } from 'lucide-react';

const JoinRoom = () => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="panel w-full max-w-md">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

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
