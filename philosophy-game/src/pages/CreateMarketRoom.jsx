import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMarketRoom } from '../services/marketService';
import { ArrowLeft, Store } from 'lucide-react';

const CreateMarketRoom = () => {
  const [name, setName] = useState('');
  const [startingXu, setStartingXu] = useState(1000);
  const [numTeams, setNumTeams] = useState(9);
  const [playersPerTeam, setPlayersPerTeam] = useState(7);
  const [secretCode, setSecretCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (secretCode !== 'vnr202') {
      alert("❌ Mã mở chợ không chính xác! Bạn không có quyền mở chợ.");
      return;
    }
    setLoading(true);
    try {
      const { roomCode, playerId } = await createMarketRoom(name, {
        numTeams, playersPerTeam, startingXu
      });
      navigate(`/market-lobby/${roomCode}`, { state: { playerId, isHost: true } });
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

      <div className="panel w-full max-w-lg relative pt-16 mt-8">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] ring-[6px] ring-slate-800">
          <Store size={44} className="text-white" />
        </div>

        <h2 className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Mở Chợ Mới</h2>
        <p className="text-slate-400 text-sm text-center mb-6">Cấu hình phiên Chợ Lịch Sử</p>

        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tên Chủ Chợ (Host)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="input-field" placeholder="Nhập tên..." maxLength={20} required />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">💰 Xu khởi điểm</label>
              <input type="number" value={startingXu} onChange={(e) => setStartingXu(Number(e.target.value))}
                className="input-field" min="500" max="5000" step="100" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">👥 Số đội</label>
              <input type="number" value={numTeams} onChange={(e) => setNumTeams(Number(e.target.value))}
                className="input-field" min="2" max="9" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">👤 Người / đội</label>
              <input type="number" value={playersPerTeam} onChange={(e) => setPlayersPerTeam(Number(e.target.value))}
                className="input-field" min="1" max="10" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">🔑 Mã đặc biệt (Dành cho Host)</label>
            <input type="password" value={secretCode} onChange={(e) => setSecretCode(e.target.value)}
              className="input-field border-amber-500/30 focus:border-amber-500" placeholder="Nhập mã mở chợ..." required />
          </div>

          <button type="submit" disabled={loading || !name.trim() || !secretCode.trim()}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-3 px-6 rounded-xl w-full transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Store size={20} />
            {loading ? "Đang mở chợ..." : "Mở Chợ"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateMarketRoom;
