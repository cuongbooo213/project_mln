import React, { useState, useEffect } from 'react';
import { getServerTime } from '../firebase/timeSync';
import { Gavel, Coins } from 'lucide-react';

const AuctionPanel = ({ auction, teams, myTeamId, onBid, myXu }) => {
  const [seconds, setSeconds] = useState(0);
  const [customBid, setCustomBid] = useState('');

  useEffect(() => {
    if (!auction?.isActive) return;
    const interval = setInterval(() => {
      const now = getServerTime();
      const remaining = Math.max(0, Math.ceil((auction.endTime - now) / 1000));
      setSeconds(remaining);
    }, 300);
    return () => clearInterval(interval);
  }, [auction?.endTime, auction?.isActive]);

  if (!auction || !auction.isActive) {
    return (
      <div className="bg-slate-800/80 p-8 rounded-xl border border-slate-700 text-center">
        <Store size={48} className="text-amber-400 mx-auto mb-4 opacity-50" />
        <p className="text-slate-400 text-lg">Đang chờ Chủ Chợ đưa hàng ra bán...</p>
        <p className="text-slate-500 text-sm mt-2">Hãy bàn bạc chiến thuật với đồng đội!</p>
      </div>
    );
  }

  const currentBidderTeam = teams[auction.currentBidder];
  const isMyTeamLeading = auction.currentBidder === myTeamId;
  const minBid = auction.currentBid + 50;

  const handleQuickBid = (increment) => {
    const amount = auction.currentBid + increment;
    if (amount > myXu) return;
    onBid(amount);
  };

  const handleCustomBid = (e) => {
    e.preventDefault();
    const amount = parseInt(customBid);
    if (!amount || amount <= auction.currentBid || amount > myXu) return;
    onBid(amount);
    setCustomBid('');
  };

  return (
    <div className="bg-gradient-to-br from-amber-900/30 to-slate-900/80 p-5 rounded-xl border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
      {/* Item info */}
      <div className="text-center mb-4">
        <span className="text-xs text-amber-400 uppercase font-bold tracking-widest">Phiên đấu giá</span>
        <h3 className="text-2xl font-bold text-white mt-1">{auction.itemLabel || '📦 Món hàng'}</h3>
        <p className="text-slate-400 text-sm mt-1">{auction.itemHint || ''}</p>
      </div>

      {/* Current bid */}
      <div className="bg-slate-900/80 rounded-xl p-4 mb-4 text-center border border-slate-700">
        <div className="text-sm text-slate-400 mb-1">Giá hiện tại</div>
        <div className="text-4xl font-black text-amber-400 flex items-center justify-center gap-2">
          <Coins size={28} /> {auction.currentBid} Xu
        </div>
        {currentBidderTeam ? (
          <div className={`text-sm mt-2 font-medium ${isMyTeamLeading ? 'text-green-400' : 'text-red-400'}`}>
            {isMyTeamLeading ? '✅ Đội bạn đang dẫn đầu!' : `${currentBidderTeam.emoji} ${currentBidderTeam.name} đang dẫn`}
          </div>
        ) : (
          <div className="text-sm mt-2 text-slate-500">Chưa có ai đặt giá</div>
        )}
      </div>

      {/* Timer */}
      <div className="flex justify-center mb-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-lg ${
          seconds <= 5 ? 'border-red-500 bg-red-900/30 shadow-red-500/30' : 'border-amber-500 bg-slate-900 shadow-amber-500/20'
        }`}>
          <span className={`text-2xl font-bold ${seconds <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {seconds}
          </span>
        </div>
      </div>

      {/* Bid buttons */}
      {!isMyTeamLeading && seconds > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[50, 100, 200].map(inc => {
              const bidAmount = auction.currentBid + inc;
              const canAfford = bidAmount <= myXu;
              return (
                <button key={inc} onClick={() => handleQuickBid(inc)} disabled={!canAfford}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${
                    canAfford
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg hover:scale-105 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}>
                  +{inc} Xu
                </button>
              );
            })}
          </div>
          <form onSubmit={handleCustomBid} className="flex gap-2">
            <input type="number" value={customBid} onChange={e => setCustomBid(e.target.value)}
              placeholder={`Tối thiểu ${minBid}`} min={minBid} max={myXu}
              className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
            <button type="submit" disabled={!customBid || parseInt(customBid) <= auction.currentBid}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1">
              <Gavel size={16} /> Đặt
            </button>
          </form>
        </div>
      )}

      {isMyTeamLeading && seconds > 0 && (
        <div className="text-center py-3 bg-green-900/30 rounded-xl border border-green-500/30 text-green-400 font-medium">
          🎉 Đội bạn đang thắng! Chờ kết quả...
        </div>
      )}

      {seconds === 0 && (
        <div className="text-center py-3 bg-slate-800 rounded-xl text-slate-400 font-medium">
          🔨 Phiên đấu giá đã kết thúc
        </div>
      )}

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
