import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const SubmissionArea = ({ disabled, onSubmit, hasSubmitted, correctAnswer, showResult }) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer.trim() || disabled) return;
    onSubmit(answer.trim());
  };

  if (showResult) {
    return (
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-white">Kết Quả Vòng Này</h3>
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 font-bold rounded-xl text-2xl border border-green-500/30">
          <CheckCircle2 size={28} />
          {correctAnswer}
        </div>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="bg-indigo-900/30 p-6 rounded-xl border border-indigo-500/50 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-indigo-300 font-medium">Đội của bạn đã gửi đáp án. Đang chờ kết quả...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
      <h3 className="text-lg font-bold mb-4 text-white text-center">Chốt Đáp Án Đội</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <input 
            type="text" 
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={disabled}
            placeholder="Nhập đáp án (VD: 1930)..." 
            className="w-full bg-slate-900 border-2 border-slate-600 focus:border-indigo-500 rounded-xl px-4 py-3 text-white text-center font-bold text-xl uppercase transition-colors"
          />
        </div>
        <button 
          type="submit"
          disabled={disabled || !answer.trim()}
          className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          <CheckCircle2 /> GỬI ĐÁP ÁN CHO ĐỘI
        </button>
      </form>
      <p className="text-xs text-slate-400 text-center mt-3">
        Lưu ý: Bất kỳ thành viên nào cũng có quyền chốt đáp án cho toàn đội. Hãy trao đổi kỹ!
      </p>
    </div>
  );
};

export default SubmissionArea;
