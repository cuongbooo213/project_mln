import React, { useState } from 'react';
import { CheckCircle2, Brain, Package } from 'lucide-react';

const MissionSolver = ({ mission, inventory = {}, onSubmit, hasSubmitted, showResult, seconds }) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer.trim() || hasSubmitted) return;
    onSubmit(answer.trim());
  };

  const items = Object.entries(inventory);

  if (showResult) {
    return (
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center">
        <h3 className="text-xl font-bold mb-4 text-white">Đáp Án Đúng</h3>
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 font-bold rounded-xl text-xl border border-green-500/30">
          <CheckCircle2 size={24} /> {mission?.correctAnswer}
        </div>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="bg-indigo-900/30 p-6 rounded-xl border border-indigo-500/50 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-amber-300 font-medium">Đã nộp đáp án! Đang chờ kết quả...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mission */}
      <div className="bg-gradient-to-br from-red-900/30 to-slate-900/80 p-5 rounded-xl border border-red-500/30 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={20} className="text-red-400" />
          <span className="text-xs text-red-400 uppercase font-bold tracking-widest">Nhiệm Vụ</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{mission?.title}</h3>
        <p className="text-slate-300 text-sm leading-relaxed">{mission?.description}</p>

        {/* Timer */}
        <div className="mt-4 flex items-center justify-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center border-3 ${
            seconds <= 10 ? 'border-red-500 bg-red-900/30' : 'border-amber-500 bg-slate-900'
          }`}>
            <span className={`text-xl font-bold ${seconds <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {seconds}s
            </span>
          </div>
        </div>
      </div>

      {/* Quick inventory reference */}
      {items.length > 0 && (
        <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
          <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1">
            <Package size={12} /> Thông tin đã mua ({items.length} món):
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {items.map(([id, item]) => (
              <span key={id} className="px-2 py-1 bg-slate-900 rounded text-xs text-slate-300 border border-slate-700" title={item.content}>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Answer form */}
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
        <h3 className="text-lg font-bold mb-3 text-white text-center">Chốt Đáp Án</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)}
            placeholder="Nhập đáp án (VD: 1930 hoặc Hội nghị thành lập Đảng)..."
            className="w-full bg-slate-900 border-2 border-slate-600 focus:border-amber-500 rounded-xl px-4 py-3 text-white text-center font-bold text-lg transition-colors" />
          <button type="submit" disabled={!answer.trim()}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
            <CheckCircle2 /> GỬI ĐÁP ÁN
          </button>
        </form>
      </div>
    </div>
  );
};

export default MissionSolver;
