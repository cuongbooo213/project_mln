import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Users, HelpCircle, Check, X, Trophy } from 'lucide-react';
import allQuestions from '../data/questions.json';
import logoSingle from '../assets/logo.jpg';

const PRIZES = [
  "1.000.000", "2.000.000", "3.000.000", "4.000.000", "5.000.000",
  "6.000.000", "10.000.000", "14.000.000", "18.000.000", "22.000.000",
  "30.000.000", "60.000.000", "100.000.000", "250.000.000", "500.000.000"
];

// 0-indexed milestones
const SAFE_MILESTONES = [4, 9, 14];

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const getGameQuestions = () => {
  const easy = shuffleArray(allQuestions.filter(q => q.difficulty === 'easy')).slice(0, 5);
  const medium = shuffleArray(allQuestions.filter(q => q.difficulty === 'medium')).slice(0, 5);
  const hard = shuffleArray(allQuestions.filter(q => q.difficulty === 'hard')).slice(0, 5);
  return [...easy, ...medium, ...hard];
};

const MillionaireGame = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [gameState, setGameState] = useState('intro'); // intro, playing, grace, answering, correct, wrong, walk_away, won
  const [timer, setTimer] = useState(20);
  const [graceTimer, setGraceTimer] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  
  const [lifelines, setLifelines] = useState({
    fiftyFifty: true,
    askAudience: true,
    callFriend: true
  });
  const [removedAnswers, setRemovedAnswers] = useState([]);
  const [audienceVote, setAudienceVote] = useState(null);
  const [showCallFriendModal, setShowCallFriendModal] = useState(false);

  const timerRef = useRef(null);
  const graceTimerRef = useRef(null);

  useEffect(() => {
    setQuestions(getGameQuestions());
  }, []);

  const startGame = () => {
    setGameState('playing');
    setTimer(20);
  };

  useEffect(() => {
    if (gameState === 'playing' && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    } else if (gameState === 'playing' && timer === 0) {
      setGameState('grace');
      setGraceTimer(3);
    }
    return () => clearTimeout(timerRef.current);
  }, [gameState, timer]);

  useEffect(() => {
    if (gameState === 'grace' && graceTimer > 0) {
      graceTimerRef.current = setTimeout(() => setGraceTimer(t => t - 1), 1000);
    } else if (gameState === 'grace' && graceTimer === 0) {
      handleTimeOut();
    }
    return () => clearTimeout(graceTimerRef.current);
  }, [gameState, graceTimer]);

  const handleTimeOut = () => {
    setGameState('wrong');
    setTimeout(() => {
      setGameState('game_over');
    }, 3000);
  };

  const getSafePrize = () => {
    if (currentStep > 9) return PRIZES[9]; // Passed Q10
    if (currentStep > 4) return PRIZES[4]; // Passed Q5
    return "0";
  };

  const handleAnswer = (answerKey) => {
    if (gameState !== 'playing' && gameState !== 'grace') return;
    
    setSelectedAnswer(answerKey);
    setGameState('answering');
    
    setTimeout(() => {
      const currentQ = questions[currentStep];
      if (answerKey === currentQ.correct) {
        setGameState('correct');
        setTimeout(() => {
          if (currentStep === 14) {
            setGameState('won');
          } else {
            setCurrentStep(s => s + 1);
            setTimer(20);
            setGameState('playing');
            setSelectedAnswer(null);
            setRemovedAnswers([]);
            setAudienceVote(null);
          }
        }, 2000);
      } else {
        setGameState('wrong');
        setTimeout(() => {
          setGameState('game_over');
        }, 3000);
      }
    }, 2000);
  };

  const handleWalkAway = () => {
    if (SAFE_MILESTONES.includes(currentStep)) return; // Cannot walk away AT milestones (as requested, except 5, 10, 15)
    setGameState('walk_away');
  };

  // Lifelines
  const useFiftyFifty = () => {
    if (!lifelines.fiftyFifty || gameState !== 'playing') return;
    const currentQ = questions[currentStep];
    const wrongAnswers = ['A', 'B', 'C', 'D'].filter(key => key !== currentQ.correct);
    const shuffledWrong = shuffleArray(wrongAnswers);
    setRemovedAnswers([shuffledWrong[0], shuffledWrong[1]]);
    setLifelines(prev => ({ ...prev, fiftyFifty: false }));
  };

  const useAskAudience = () => {
    if (!lifelines.askAudience || gameState !== 'playing') return;
    const currentQ = questions[currentStep];
    
    // Simulate audience logic (better for easy questions)
    let correctVotes = 0;
    if (currentQ.difficulty === 'easy') correctVotes = Math.floor(Math.random() * 20) + 75; // 75-95%
    else if (currentQ.difficulty === 'medium') correctVotes = Math.floor(Math.random() * 30) + 50; // 50-80%
    else correctVotes = Math.floor(Math.random() * 20) + 35; // 35-55%

    let remaining = 100 - correctVotes;
    const wrongKeys = ['A', 'B', 'C', 'D'].filter(key => key !== currentQ.correct);
    
    const votes = {
      [currentQ.correct]: correctVotes
    };
    
    wrongKeys.forEach((key, index) => {
      if (index === 2) {
        votes[key] = remaining;
      } else {
        const v = Math.floor(Math.random() * remaining);
        votes[key] = v;
        remaining -= v;
      }
    });

    setAudienceVote(votes);
    setLifelines(prev => ({ ...prev, askAudience: false }));
  };

  const useCallFriend = () => {
    if (!lifelines.callFriend || gameState !== 'playing') return;
    setTimer(t => t + 30);
    setShowCallFriendModal(true);
    setLifelines(prev => ({ ...prev, callFriend: false }));
  };

  const renderIntro = () => (
    <div className="w-full max-w-4xl flex flex-col items-center justify-center p-4 h-full min-h-[80vh] relative pt-16">
      <div className="absolute top-4 left-4 md:left-0">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} /> Thoát
        </button>
      </div>

      <img src={logoSingle} alt="Ai Là Triết Gia Logo" className="w-40 h-40 md:w-48 md:h-48 object-cover rounded-full shadow-[0_0_30px_rgba(234,179,8,0.3)] ring-4 ring-yellow-500/30 animate-pulse mb-8" />
      
      <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-4 text-center">
        Ai Là Triết Gia
      </h1>
      <p className="text-xl text-slate-300 mb-8 text-center">
        Vượt qua 15 câu hỏi triết học để giành giải thưởng 500 triệu đồng!
      </p>
      
      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 text-left space-y-2 max-w-md w-full mb-8">
        <p className="text-emerald-400 font-bold mb-4 border-b border-slate-700 pb-2">Luật chơi:</p>
        <p>• 20 giây suy nghĩ mỗi câu hỏi.</p>
        <p>• Nếu hết giờ, bạn có 3 giây cuối để chọn nhanh.</p>
        <p>• 3 quyền trợ giúp: 50-50, Khán giả, Gọi điện.</p>
        <p>• Mốc an toàn: Câu 5 (5tr) và Câu 10 (22tr).</p>
      </div>
      
      <button 
        onClick={startGame}
        className="px-12 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded-full font-bold text-xl text-white shadow-lg shadow-yellow-500/20 transition-all hover:scale-105"
      >
        Bắt Đầu Chơi
      </button>
    </div>
  );

  const renderGameOver = () => {
    const isWin = gameState === 'won';
    const isWalkAway = gameState === 'walk_away';
    let prize = "0";
    
    if (isWin) prize = "500.000.000";
    else if (isWalkAway) prize = PRIZES[currentStep - 1] || "0";
    else prize = getSafePrize();

    return (
      <div className="w-full max-w-4xl flex flex-col items-center justify-center p-4 h-full min-h-[80vh] relative pt-16 text-center space-y-6">
        {isWin ? (
          <div className="relative">
            <img src={logoSingle} alt="Win Logo" className="w-40 h-40 object-cover rounded-full shadow-[0_0_40px_rgba(234,179,8,0.5)] ring-4 ring-yellow-500" />
            <Trophy className="absolute -bottom-4 -right-4 w-16 h-16 text-yellow-400 drop-shadow-lg" />
          </div>
        ) : (
          <div className="relative opacity-70">
            <img src={logoSingle} alt="Game Over Logo" className="w-32 h-32 object-cover rounded-full shadow-lg ring-2 ring-red-500/50 grayscale" />
            <X className="absolute -bottom-2 -right-2 w-12 h-12 text-red-500 drop-shadow-lg" />
          </div>
        )}
        <h2 className="text-4xl font-bold text-white">
          {isWin ? 'Tuyệt Vời! Bạn Là Triết Gia Lỗi Lạc!' : 
           isWalkAway ? 'Bạn Đã Dừng Cuộc Chơi' : 
           'Trò Chơi Kết Thúc'}
        </h2>
        <p className="text-2xl text-slate-300">Tiền thưởng của bạn:</p>
        <p className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">
          {prize} VNĐ
        </p>
        <div className="pt-8 flex gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white transition-colors"
          >
            Chơi Lại
          </button>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-white transition-colors"
          >
            Về Trang Chủ
          </button>
        </div>
      </div>
    );
  };

  if (!questions.length) return <div className="p-8 text-white">Đang tải câu hỏi...</div>;
  if (gameState === 'intro') return renderIntro();
  if (['game_over', 'walk_away', 'won'].includes(gameState)) return renderGameOver();

  const currentQ = questions[currentStep];
  const isGrace = gameState === 'grace';
  const isAnswering = gameState === 'answering';
  const isCorrect = gameState === 'correct';

  return (
    <div className="w-full max-w-6xl flex flex-col md:flex-row gap-6 p-4 h-full min-h-[80vh]">
      {/* Left Area - Game Board */}
      <div className="flex-1 flex flex-col justify-between items-center relative space-y-6">
        
        {/* Top Bar - Header & Walk Away */}
        <div className="w-full flex justify-between items-center relative pt-4 md:pt-6">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors z-10"
          >
            <ArrowLeft size={20} /> Thoát
          </button>
          
          <div className="absolute left-1/2 -translate-x-1/2 top-4 md:top-6 flex flex-col items-center">
            <img src={logoSingle} alt="Logo Mini" className="w-16 h-16 object-cover rounded-full shadow-[0_0_15px_rgba(234,179,8,0.2)] ring-2 ring-yellow-500/20" />
          </div>
          
          <button
            onClick={handleWalkAway}
            disabled={SAFE_MILESTONES.includes(currentStep) || ['answering', 'correct', 'grace'].includes(gameState)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold border border-slate-700 transition-colors z-10"
          >
            Dừng Cuộc Chơi
          </button>
        </div>

        {/* Lifelines */}
        <div className="flex gap-4">
          <button 
            onClick={useFiftyFifty}
            disabled={!lifelines.fiftyFifty || gameState !== 'playing'}
            className={`w-16 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
              lifelines.fiftyFifty ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105' : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
            }`}
          >
            50:50
          </button>
          <button 
            onClick={useAskAudience}
            disabled={!lifelines.askAudience || gameState !== 'playing'}
            className={`w-16 h-12 rounded-full flex items-center justify-center transition-all ${
              lifelines.askAudience ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105' : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
            }`}
          >
            <Users size={24} />
          </button>
          <button 
            onClick={useCallFriend}
            disabled={!lifelines.callFriend || gameState !== 'playing'}
            className={`w-16 h-12 rounded-full flex items-center justify-center transition-all ${
              lifelines.callFriend ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105' : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
            }`}
          >
            <Phone size={24} />
          </button>
        </div>

        {/* Timer */}
        <div className="relative">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-extrabold border-4 ${
            isGrace ? 'border-red-500 text-red-500 animate-pulse' : 
            timer <= 5 ? 'border-orange-500 text-orange-500' : 'border-indigo-500 text-indigo-400'
          } bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
            {isGrace ? graceTimer : timer}
          </div>
          {isGrace && <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-red-500 font-bold whitespace-nowrap">Ân hạn!</div>}
        </div>

        {/* Question Area */}
        <div className="w-full">
          {/* Question Text */}
          <div className="bg-gradient-to-b from-indigo-950 to-slate-950 border-2 border-indigo-500/50 rounded-full py-6 px-12 text-center relative mb-8 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Câu {currentStep + 1}
            </div>
            <h3 className="text-xl md:text-2xl font-semibold leading-relaxed">
              {currentQ.question}
            </h3>
          </div>

          {/* Answers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['A', 'B', 'C', 'D'].map(key => {
              const isRemoved = removedAnswers.includes(key);
              
              let btnClass = "bg-gradient-to-b from-slate-800 to-slate-900 border-indigo-500/50 hover:bg-slate-800 hover:border-indigo-400";
              if (selectedAnswer === key) {
                if (gameState === 'correct') {
                  btnClass = "bg-gradient-to-b from-emerald-600 to-green-700 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]";
                } else if (gameState === 'wrong') {
                  btnClass = key === currentQ.correct 
                    ? "bg-gradient-to-b from-emerald-600 to-green-700 border-emerald-400" 
                    : "bg-gradient-to-b from-red-600 to-rose-700 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
                } else {
                  btnClass = "bg-gradient-to-b from-orange-500 to-amber-600 border-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.5)]";
                }
              } else if (gameState === 'wrong' && key === currentQ.correct) {
                btnClass = "bg-gradient-to-b from-emerald-600 to-green-700 border-emerald-400 animate-pulse";
              }

              return (
                <button
                  key={key}
                  disabled={isRemoved || isAnswering || isCorrect}
                  onClick={() => handleAnswer(key)}
                  className={`relative group border-2 rounded-full py-4 px-6 flex items-center transition-all duration-300 ${btnClass} ${isRemoved ? 'opacity-0' : 'opacity-100'}`}
                >
                  <span className="text-indigo-400 font-bold text-xl mr-4 group-hover:text-white transition-colors">{key}:</span>
                  <span className="text-lg text-left flex-1 font-medium">{currentQ.answers[key]}</span>
                  
                  {audienceVote && !isRemoved && (
                    <span className="absolute right-4 text-xs font-bold text-blue-300 bg-blue-900/50 px-2 py-1 rounded">
                      {audienceVote[key]}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Area - Prize Ladder */}
      <div className="w-full md:w-64 bg-slate-900/80 rounded-2xl border border-slate-700/50 p-4 flex flex-col-reverse justify-start overflow-hidden">
        {PRIZES.map((prize, idx) => {
          const isCurrent = currentStep === idx;
          const isPassed = currentStep > idx;
          const isSafe = SAFE_MILESTONES.includes(idx);
          
          let itemClass = "text-slate-400";
          if (isCurrent) itemClass = "bg-indigo-600 text-white font-bold rounded-lg scale-105 shadow-lg shadow-indigo-500/30";
          else if (isPassed) itemClass = "text-slate-600";
          else if (isSafe) itemClass = "text-yellow-500 font-bold";

          return (
            <div key={idx} className={`flex justify-between items-center px-4 py-2 my-0.5 transition-all ${itemClass}`}>
              <span className="w-8 text-left">{idx + 1}</span>
              <span className="flex-1 text-right border-b border-dashed border-slate-700/50 mx-2"></span>
              <span className="w-24 text-right flex items-center justify-end gap-2">
                {isSafe && !isCurrent && <Check size={14} className="text-yellow-600" />}
                {prize}
              </span>
            </div>
          );
        })}
      </div>

      {/* Call Friend Modal */}
      {showCallFriendModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-indigo-500 rounded-2xl p-8 max-w-sm w-full text-center">
            <Phone size={48} className="mx-auto text-indigo-400 mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold mb-4">Gọi Người Thân</h3>
            <p className="text-slate-300 mb-6">
              Bạn có thêm <strong className="text-emerald-400">30 giây</strong> để suy nghĩ!<br/>
              Gợi ý: "Tôi không chắc lắm, nhưng tôi linh cảm đáp án là <strong className="text-yellow-400">{questions[currentStep].correct}</strong>."
            </p>
            <button 
              onClick={() => setShowCallFriendModal(false)}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold w-full"
            >
              Cảm ơn
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default MillionaireGame;
