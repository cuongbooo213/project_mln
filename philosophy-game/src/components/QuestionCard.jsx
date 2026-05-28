import React from 'react';

const QuestionCard = ({ question, index, total }) => {
  return (
    <div className="panel flex flex-col items-center justify-center min-h-[250px] w-full max-w-3xl mx-auto mb-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-700">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>
      
      <div className="text-indigo-400 font-semibold mb-4 tracking-wider uppercase text-sm">
        Câu hỏi {index + 1} / {total}
      </div>
      
      <h2 className="text-2xl md:text-3xl lg:text-4xl text-center text-white font-bold leading-tight px-4">
        {question}
      </h2>
    </div>
  );
};

export default QuestionCard;
