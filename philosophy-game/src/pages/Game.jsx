import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { getServerTime } from '../firebase/timeSync';
import { submitAnswer, nextQuestion } from '../services/gameService';
import { useTimer } from '../hooks/useTimer';
import QuestionCard from '../components/QuestionCard';
import AnswerButton from '../components/AnswerButton';
import Leaderboard from '../components/Leaderboard';
import { useAudioContext } from '../contexts/AudioContext';
import logo from '../assets/logo21.png';
import bgMusicFile from '../../sound_effect/backgroundmusicbeginning/nhac_nen_to_chuc_tro_choi-www_tiengdong_com (1).mp3';

const Game = () => {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { playerId } = location.state || {};

  const [gameState, setGameState] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const timePerQuestion = gameState?.timePerQuestion || 15;

  const { seconds, start, reset, pause } = useTimer(timePerQuestion, () => {
    // Timer expired
    if (!hasSubmitted) {
      handleAnswerSubmit(null);
    }
  });

  const { isMuted } = useAudioContext();
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(bgMusicFile);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.2;
    audioRef.current.muted = isMuted;
    audioRef.current.play().catch(e => console.log("Audio prevented:", e));

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (!roomCode || !playerId) {
      navigate('/');
      return;
    }

    const roomRef = ref(database, `rooms/${roomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameState(data);
        
        if (data.gameState === 'finished') {
          navigate(`/result/${roomCode}`);
        }
      }
    });

    return () => unsubscribe();
  }, [roomCode, playerId, navigate]);

  // Handle new question
  useEffect(() => {
    if (gameState?.questions && gameState.currentQuestionIndex !== undefined) {
      const startTime = gameState.questionStartTime;
      const now = getServerTime();
      
      // Reset state for new question
      setSelectedAnswer(null);
      setHasSubmitted(false);
      setWaitingForNext(false);
      setShowLeaderboard(false);
      setShowResult(false);
      
      if (startTime > now) {
        // Still in delay before question starts
        const delay = startTime - now;
        reset(timePerQuestion);
        setTimeout(() => {
          start();
        }, delay);
      } else {
        // Question already started, calculate remaining time
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, timePerQuestion - elapsed);
        reset(remaining);
        start();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentQuestionIndex]);

  const isDelay = gameState ? getServerTime() < gameState.questionStartTime : false;
  const numPlayers = Object.keys(gameState?.players || {}).length;
  const numAnswers = Object.keys(gameState?.questionAnswers?.[gameState?.currentQuestionIndex] || {}).length;
  const allAnswered = numPlayers > 0 && numAnswers >= numPlayers;
  const timeExpired = seconds === 0 && !isDelay && gameState;
  const shouldReveal = allAnswered || timeExpired;

  useEffect(() => {
    if (shouldReveal && !showResult && !waitingForNext && !isDelay) {
      setShowResult(true);
      
      setTimeout(() => {
        setShowLeaderboard(true);
        setWaitingForNext(true);
        
        if (gameState.players[playerId]?.isHost) {
          setTimeout(() => {
            nextQuestion(roomCode, gameState.currentQuestionIndex, gameState.questions.length);
          }, 5000);
        }
      }, 3000);
    }
  }, [shouldReveal, showResult, waitingForNext, isDelay, gameState, playerId, roomCode]);

  const handleAnswerSubmit = async (answerKey) => {
    if (hasSubmitted || waitingForNext || showResult) return;
    
    const submitTime = getServerTime();
    
    setSelectedAnswer(answerKey);
    setHasSubmitted(true);
    
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    let score = 0;
    
    if (answerKey === currentQuestion.correct) {
      const startTime = gameState.questionStartTime;
      const timeTakenMs = Math.max(0, submitTime - startTime);
      const totalTimeMs = timePerQuestion * 1000;
      
      if (timeTakenMs <= 1000) {
        score = 1000;
      } else {
        const ratio = Math.max(0, (totalTimeMs - timeTakenMs) / totalTimeMs);
        score = Math.floor(ratio * 900) + 100;
      }
    }
    
    await submitAnswer(roomCode, playerId, score, gameState.currentQuestionIndex);
  };

  if (!gameState || !gameState.questions) {
    return <div className="flex-1 flex items-center justify-center text-white">Đang tải...</div>;
  }

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];

  if (isDelay && !waitingForNext) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <img src={logo} alt="Logo" className="w-32 h-32 mb-6 object-cover rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] ring-4 ring-indigo-500/50 bg-white animate-pulse" />
        <h2 className="text-4xl font-bold text-white mb-4">Chuẩn bị...</h2>
        <div className="text-xl text-indigo-300">Câu hỏi {gameState.currentQuestionIndex + 1} chuẩn bị xuất hiện</div>
      </div>
    );
  }

  if (showLeaderboard) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <img src={logo} alt="Logo" className="w-24 h-24 mb-4 object-cover rounded-full shadow-lg ring-2 ring-indigo-500/30 bg-white" />
        <h2 className="text-2xl text-white mb-6">Đang chuẩn bị câu tiếp theo...</h2>
        <Leaderboard players={gameState.players} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 w-full max-w-4xl mx-auto relative">
      
      {/* Background Watermark Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 opacity-15">
        <img src={logo} alt="Watermark" className="w-[600px] h-[600px] md:w-[1200px] md:h-[1200px] max-w-none object-cover rounded-full" />
      </div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="text-lg font-bold bg-slate-800 px-4 py-2 rounded-xl text-white">
          Điểm: <span className="text-indigo-400">{gameState.players[playerId]?.score || 0}</span>
        </div>
        
        <div className="relative w-16 h-16 flex items-center justify-center bg-slate-800 rounded-full border-4 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          <span className={`text-2xl font-bold ${seconds <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {seconds}
          </span>
        </div>
        
        <div className="text-lg font-bold bg-slate-800 px-4 py-2 rounded-xl text-slate-300">
          Câu {gameState.currentQuestionIndex + 1}/{gameState.questions.length}
        </div>
      </div>

      <QuestionCard 
        question={currentQuestion.question} 
        index={gameState.currentQuestionIndex} 
        total={gameState.questions.length} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {Object.entries(currentQuestion.answers).map(([key, text]) => (
          <AnswerButton 
            key={key}
            label={key}
            text={text}
            selected={selectedAnswer === key}
            correct={showResult ? key === currentQuestion.correct : undefined}
            disabled={hasSubmitted || showResult}
            onClick={() => handleAnswerSubmit(key)}
          />
        ))}
      </div>

    </div>
  );
};

export default Game;
