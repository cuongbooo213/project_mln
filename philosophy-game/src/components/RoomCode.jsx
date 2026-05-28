import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const RoomCode = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-slate-400 text-sm uppercase tracking-widest font-semibold">Mã Phòng</div>
      <div 
        onClick={handleCopy}
        className="flex items-center gap-4 bg-slate-900/80 border-2 border-indigo-500/30 hover:border-indigo-500 px-6 py-3 rounded-2xl cursor-pointer transition-all group"
      >
        <span className="text-3xl md:text-4xl font-mono font-bold tracking-widest text-white group-hover:text-indigo-300 transition-colors">
          {code}
        </span>
        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
          {copied ? <Check size={24} /> : <Copy size={24} />}
        </div>
      </div>
      {copied && (
        <div className="text-green-400 text-sm mt-1 animate-pulse">
          Đã copy mã phòng!
        </div>
      )}
    </div>
  );
};

export default RoomCode;
