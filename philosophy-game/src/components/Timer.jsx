import React from 'react';

const Timer = ({ seconds, maxSeconds = 15 }) => {
  const percentage = (seconds / maxSeconds) * 100;
  
  let colorClass = "text-indigo-400";
  let strokeClass = "stroke-indigo-500";
  
  if (seconds <= 5) {
    colorClass = "text-red-400 animate-pulse";
    strokeClass = "stroke-red-500";
  } else if (seconds <= 10) {
    colorClass = "text-yellow-400";
    strokeClass = "stroke-yellow-500";
  }

  return (
    <div className="relative w-24 h-24 flex items-center justify-center mx-auto mb-6">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle 
          cx="50" cy="50" r="45" 
          fill="none" 
          stroke="rgba(255,255,255,0.1)" 
          strokeWidth="8" 
        />
        <circle 
          cx="50" cy="50" r="45" 
          fill="none" 
          className={`${strokeClass} transition-all duration-1000 ease-linear`}
          strokeWidth="8"
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * percentage) / 100}
          strokeLinecap="round"
        />
      </svg>
      <div className={`absolute text-3xl font-bold ${colorClass}`}>
        {seconds}
      </div>
    </div>
  );
};

export default Timer;
