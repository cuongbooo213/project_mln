import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinMarketRoom } from '../services/marketService';
import { ArrowLeft, Store, Users } from 'lucide-react';
import logoMarket from '../assets/4c4d23f2-9d81-40c2-9a9b-5a87e030e1e3.jpg';

const JoinMarketRoom = () => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await joinMarketRoom(roomCode, name);
      navigate(`/market-lobby/${result.roomCode}`, { state: { playerId: result.playerId, isHost: false } });
    } catch (err) {
      setError(err.message || 'Lỗi tham gia phòng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative w-full">
      <button onClick={() => navigate('/')}
        className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={20} /> <span className="hidden md:inline">Quay lại</span>
      </button>

      <div className="panel w-full max-w-lg relative pt-16 mt-8">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full shadow-[0_0_30px_rgba(249,115,22,0.4)] ring-[6px] ring-slate-800">
          <img src={logoMarket} alt="Chợ Lịch Sử Logo" className="w-full h-full object-cover rounded-full" />
        </div>

        <h2 className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Vào Chợ</h2>
        <p className="text-slate-400 text-sm text-center mb-6">Nhập mã phòng để tham gia Chợ Lịch Sử</p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl p-3 mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tên của bạn</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="input-field" placeholder="Nhập tên..." maxLength={20} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mã Phòng</label>
            <input type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="input-field text-center text-2xl font-bold tracking-[0.3em] uppercase" placeholder="ABCDEF" maxLength={6} required />
          </div>
          <button type="submit" disabled={loading || !name.trim() || !roomCode.trim()}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold py-3 px-6 rounded-xl w-full transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
            <Store size={20} />
            {loading ? "Đang vào chợ..." : "Tham Gia Chợ"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinMarketRoom;
