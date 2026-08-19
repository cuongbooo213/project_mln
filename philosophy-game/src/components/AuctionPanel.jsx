import React, { useState, useEffect } from 'react';
import { getServerTime } from '../firebase/timeSync';
import { Gavel, Coins } from 'lucide-react';

const AuctionPanel = ({ auction, teams, myTeamId, onToggleHand, myXu, isLeader }) => {
  const isRaising = !!auction?.raisedHands?.[myTeamId];

  if (!auction || !auction.isActive) {
    return (
      <div className="bg-slate-800/80 p-8 rounded-xl border border-slate-700 text-center">
        <Store size={48} className="text-amber-400 mx-auto mb-4 opacity-50" />
        <p className="text-slate-400 text-lg">Đang chờ Chủ Chợ đưa hàng ra bán...</p>
        <p className="text-slate-500 text-sm mt-2">Hãy bàn bạc chiến thuật với đồng đội!</p>
      </div>
    );
  }



  const handleToggle = () => {
    onToggleHand(!isRaising);
  };

  return (
    <div className="bg-gradient-to-br from-amber-900/30 to-slate-900/80 p-5 rounded-xl border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
      {/* Item info */}
      <div className="text-center mb-4">
        <span className="text-xs text-amber-400 uppercase font-bold tracking-widest">Phiên đấu giá</span>
        <h3 className="text-2xl font-bold text-white mt-1">{auction.itemLabel || '📦 Món hàng'}</h3>
        <p className="text-slate-400 text-sm mt-1">{auction.itemHint || ''}</p>
      </div>

      {/* Current status */}
      <div className="bg-slate-900/80 rounded-xl p-4 mb-4 text-center border border-slate-700">
        <div className="text-sm text-slate-400 mb-1">Trạng thái</div>
        <div className="text-xl font-bold text-amber-400">
          Đang chờ Chủ Chợ gọi tên và chốt giá...
        </div>
      </div>

      {/* Hand button */}
      <div className="flex justify-center mb-4">
        {isLeader ? (
          <button
            onClick={handleToggle}
            className={`py-4 px-8 rounded-xl font-bold text-xl transition-all shadow-lg flex items-center gap-3 ${
              isRaising
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 ring-4 ring-red-500/50'
                : 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/30'
            }`}
          >
            <span className="text-3xl">🙋</span> 
            {isRaising ? 'Đang Giơ Tay (Bấm để hạ xuống)' : 'Giơ Tay Phát Biểu!'}
          </button>
        ) : (
          <div className="py-4 px-8 rounded-xl bg-slate-800 border border-slate-700 text-center w-full max-w-sm">
            <span className="text-2xl opacity-50 block mb-2">🔒</span>
            <div className="text-sm font-bold text-slate-400">Chỉ Trưởng Nhóm mới có quyền giơ tay</div>
            {isRaising && <div className="text-amber-400 text-sm mt-2 font-bold animate-pulse">🙋 👑 Trưởng nhóm đang giơ tay!</div>}
          </div>
        )}
      </div>





      <div className="mt-3 text-center text-xs text-slate-500">
        💰 Xu của đội bạn: <span className="text-amber-400 font-bold">{myXu}</span>
      </div>
    </div>
  );
};

// Placeholder for import
const Store = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>
  </svg>
);

export default AuctionPanel;
