import React from 'react';

const AnswerButton = ({ label, text, onClick, selected, correct, disabled }) => {
  let baseClass = "panel !p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]";
  
  if (disabled && !selected && !correct) {
    baseClass += " opacity-50 cursor-not-allowed hover:scale-100";
  } else if (selected && correct === undefined) {
    baseClass += " ring-2 ring-indigo-500 bg-indigo-500/10";
  } else if (correct === true) {
    baseClass += " !bg-green-600/80 !border-green-500 text-white";
  } else if (selected && correct === false) {
    baseClass += " !bg-red-600/80 !border-red-500 text-white";
  } else if (!disabled) {
    baseClass += " hover:bg-slate-700/80 hover:border-indigo-500/50";
  }

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`w-full text-left ${baseClass}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0
        ${(correct === true) ? 'bg-green-500/20 text-green-100' : 
          (selected && correct === false) ? 'bg-red-500/20 text-red-100' : 
          'bg-slate-700 text-indigo-300'}`}>
        {label}
      </div>
      <span className="text-lg font-medium">
        {text}
      </span>
    </button>
  );
};

export default AnswerButton;
