import React from 'react';
import { CheckCircle2, Brain, Package, Hand } from 'lucide-react';

const MissionSolver = ({ mission, inventory = {}, onToggleHand, hasSubmitted, showResult, isLeader, revealedIndices = {}, isHandRaised, myAnswer }) => {
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

  if (myAnswer) {
    return (
      <div className="flex flex-col gap-4">
        {/* Mission info */}
        <div className="bg-gradient-to-br from-red-900/30 to-slate-900/80 p-5 rounded-xl border border-red-500/30 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={20} className="text-red-400" />
            <span className="text-xs text-red-400 uppercase font-bold tracking-widest">Nhiệm Vụ</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{mission?.title}</h3>
          <p className="text-slate-300 text-sm leading-relaxed">{mission?.description}</p>
        </div>

        <div className={`p-6 rounded-xl border text-center ${myAnswer.isCorrect ? 'bg-green-900/30 border-green-500/30' : 'bg-red-900/30 border-red-500/30'}`}>
          <div className="text-4xl mb-3">{myAnswer.isCorrect ? '✅' : '❌'}</div>
          <div className={`text-xl font-bold mb-1 ${myAnswer.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {myAnswer.isCorrect ? 'Chính xác!' : 'Sai rồi!'}
          </div>
          <div className="text-slate-300 text-sm">
            Đáp án của đội: "<span className="font-bold">{myAnswer.answer}</span>" — Điểm: <span className="text-amber-400 font-bold">+{myAnswer.score}</span>
          </div>
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
      </div>

      {/* Render masked answer */}
      {mission?.correctAnswer && (
        <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700 text-center shadow-lg">
          <div className="text-xs text-slate-400 mb-3 uppercase tracking-widest font-bold">Gợi ý đáp án ({mission.correctAnswer.length} ký tự)</div>
          <div className="flex flex-wrap justify-center gap-2">
            {mission.correctAnswer.split('').map((char, idx) => {
              const isSpace = char === ' ';
              const isRevealed = revealedIndices[idx];
              return (
                <div key={idx} className={`w-8 h-10 sm:w-10 sm:h-12 flex items-center justify-center text-xl font-bold rounded-lg ${
                  isSpace ? 'bg-transparent' : 'bg-slate-800 border-2 border-slate-600 shadow-inner'
                } ${isRevealed ? 'text-amber-400 border-amber-500/50' : 'text-slate-700'}`}>
                  {isSpace ? ' ' : isRevealed ? char : '?'}
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Raise hand to answer */}
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
        <h3 className="text-lg font-bold mb-3 text-white text-center">Trả Lời Câu Hỏi</h3>
        {isLeader ? (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => onToggleHand(!isHandRaised)}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-all ${
                isHandRaised
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white animate-pulse'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white'
              }`}
            >
              <Hand size={24} /> {isHandRaised ? '✋ Đang Giơ Tay — Bấm Để Hạ' : '🙋 Giơ Tay Trả Lời'}
            </button>
            {isHandRaised && (
              <p className="text-amber-300 text-sm text-center animate-pulse">Đang chờ Chủ Chợ mời trả lời...</p>
            )}
          </div>
        ) : (
          <div className="text-center py-6 px-4 bg-slate-900/50 rounded-xl border border-slate-700">
            <span className="text-3xl opacity-50 block mb-2">🔒</span>
            <div className="text-amber-400 font-bold mb-1 animate-pulse">👑 Đang chờ Trưởng Nhóm giơ tay...</div>
            <div className="text-sm text-slate-400">Chỉ Trưởng Nhóm mới có quyền giơ tay trả lời. Hãy thảo luận ở kênh Chat nhé!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MissionSolver;
