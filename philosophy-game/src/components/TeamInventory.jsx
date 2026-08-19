import React from 'react';
import { Package, AlertTriangle, Star, Coins } from 'lucide-react';

const TYPE_ICONS = {
  date: '📅', person: '👤', place: '📍', document: '📜',
  clue: '🔎', rare: '💎', event: '⚔️',
};

const TeamInventory = ({ inventory = {}, xu = 0, teamName = '' }) => {
  const items = Object.entries(inventory);

  return (
    <div className="bg-slate-800/80 rounded-xl border border-slate-700 flex flex-col h-full overflow-hidden">
      <div className="bg-slate-800 p-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Package size={18} className="text-amber-400" /> Kho Hàng
        </h3>
        <span className="flex items-center gap-1 text-amber-400 font-bold text-sm">
          <Coins size={14} /> {xu} Xu
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-6">
            <Package size={32} className="mx-auto mb-2 opacity-40" />
            Chưa mua món nào. Hãy đấu giá để sở hữu thông tin!
          </div>
        ) : (
          items.map(([itemId, item]) => (
            <div key={itemId}
              className={`p-3 rounded-lg border transition-colors ${
                item.type === 'rare'
                  ? 'bg-yellow-900/20 border-yellow-500/30 shadow-[0_0_8px_rgba(234,179,8,0.1)]'
                  : 'bg-slate-900/50 border-slate-700'
              }`}>
              <div className="flex items-start justify-between mb-1">
                <span className="text-sm font-bold text-white">
                  {TYPE_ICONS[item.type] || '📦'} {item.label}
                </span>
                <span className="text-xs text-slate-500">{item.price} Xu</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{item.content}</p>
              {item.type === 'rare' && (
                <div className="mt-1 flex items-center gap-1 text-xs text-yellow-400">
                  <Star size={12} /> Thông tin đặc biệt
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="p-3 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <AlertTriangle size={12} className="text-red-400" />
            <span>Lưu ý: Chợ có thể bán <strong className="text-red-400">hàng giả</strong>! Hãy kiểm chứng thông tin.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamInventory;
