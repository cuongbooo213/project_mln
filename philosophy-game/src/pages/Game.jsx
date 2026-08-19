import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { getServerTime } from '../firebase/timeSync';
import { submitTeamAnswer, nextQuestion } from '../services/gameService';
import Leaderboard from '../components/Leaderboard';
import TeamChat from '../components/TeamChat';
import SubmissionArea from '../components/SubmissionArea';
import { useAudioContext } from '../contexts/AudioContext';
import logo from '../assets/logo21.png';
import { Search } from 'lucide-react';
import bgMusicFile from '../../sound_effect/backgroundmusicbeginning/nhac_nen_to_chuc_tro_choi-www_tiengdong_com (1).mp3';

const Game = () => {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { playerId } = location.state || {};

  const [gameState, setGameState] = useState(null);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const timePerQuestion = gameState?.timePerQuestion || 90; // 90 seconds for a puzzle
  const [seconds, setSeconds] = useState(timePerQuestion);

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

  // Handle new question and timer sync
  useEffect(() => {
    if (gameState?.questions && gameState.currentQuestionIndex !== undefined) {
      setWaitingForNext(false);
      setShowLeaderboard(false);
      setShowResult(false);
    }
  }, [gameState?.currentQuestionIndex]);

  // Global Timer Sync Effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState?.questions && gameState.currentQuestionIndex !== undefined) {
        const startTime = gameState.questionStartTime;
        const now = getServerTime();
        
        if (startTime > now) {
          // Still in delay before question starts
          setSeconds(timePerQuestion);
        } else {
          // Question already started, calculate remaining time directly from server time
          const elapsed = Math.floor((now - startTime) / 1000);
          const remaining = Math.max(0, timePerQuestion - elapsed);
          setSeconds(remaining);
        }
      }
    }, 500); // Check twice a second to prevent visual skipping
    
    return () => clearInterval(interval);
  }, [gameState?.currentQuestionIndex, gameState?.questionStartTime, timePerQuestion]);

  const isDelay = gameState ? getServerTime() < gameState.questionStartTime : false;
  const numTeams = Object.keys(gameState?.teams || {}).length;
  const numAnswers = Object.keys(gameState?.questionAnswers?.[gameState?.currentQuestionIndex] || {}).length;
  const allAnswered = numTeams > 0 && numAnswers >= numTeams;
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
          }, 8000);
        }
      }, 5000);
    }
  }, [shouldReveal, showResult, waitingForNext, isDelay, gameState, playerId, roomCode]);

  const currentQuestion = gameState?.questions?.[gameState.currentQuestionIndex];
  const myTeamId = gameState?.players?.[playerId]?.teamId;
  const teamHasAnswered = gameState?.questionAnswers?.[gameState.currentQuestionIndex]?.[myTeamId];

  const handleAnswerSubmit = async (answer) => {
    if (teamHasAnswered || waitingForNext || showResult) return;
    
    const submitTime = getServerTime();
    
    let score = 0;
    
    // Normalize string for comparison
    const normalizedSubmit = answer.toString().trim().toLowerCase();
    const normalizedCorrect = currentQuestion.correctAnswer.toString().trim().toLowerCase();

    if (normalizedSubmit === normalizedCorrect) {
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
    
    await submitTeamAnswer(roomCode, myTeamId, score, gameState.currentQuestionIndex);
  };

  if (!gameState || !gameState.questions) {
    return <div className="flex-1 flex items-center justify-center text-white">Đang tải...</div>;
  }

  if (isDelay && !waitingForNext) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Search size={64} className="text-indigo-500 mb-6 animate-pulse" />
        <h2 className="text-4xl font-bold text-white mb-4">Chuẩn bị giải mã...</h2>
        <div className="text-xl text-indigo-300">Vụ án số {gameState.currentQuestionIndex + 1}</div>
      </div>
    );
  }

  if (showLeaderboard) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl text-white mb-6">Đang chuẩn bị vụ án tiếp theo...</h2>
        <Leaderboard teams={gameState.teams} />
      </div>
    );
  }

  if (playerId === gameState.hostId) {
    return (
      <div className="flex-1 flex flex-col p-6 w-full max-w-4xl mx-auto h-[calc(100vh-80px)] overflow-y-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Giao diện Quản trò</h2>
          <p className="text-indigo-400">Đang diễn ra: Vụ án {gameState.currentQuestionIndex + 1}/{gameState.questions.length}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-yellow-500"></div>
          <h3 className="text-2xl font-bold text-white mb-4">{currentQuestion?.title}</h3>
          <div className="inline-block bg-slate-900 border border-slate-700 px-6 py-3 rounded-lg">
            <span className="text-sm text-slate-400 block mb-1">Đáp án đúng</span>
            <span className="text-3xl font-bold text-green-400 tracking-widest uppercase">{currentQuestion?.correctAnswer}</span>
          </div>
          
          <div className="mt-6 flex justify-center">
            <div className="w-20 h-20 flex items-center justify-center bg-slate-900 rounded-full border-4 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <span className={`text-2xl font-bold ${seconds <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {seconds}s
              </span>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-4">Trạng thái các đội</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(gameState.teams || {}).map(([tId, team]) => {
            const hasAnswered = gameState.questionAnswers?.[gameState.currentQuestionIndex]?.[tId];
            return (
              <div key={tId} className={`p-4 rounded-xl border ${hasAnswered ? 'bg-green-900/30 border-green-500' : 'bg-slate-800 border-slate-700'}`}>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-lg text-white">{team.name}</h4>
                  <span className="text-yellow-400 font-bold">{team.score} pts</span>
                </div>
                <div className="text-sm">
                  {hasAnswered ? (
                    <span className="text-green-400 flex items-center gap-1">✓ Đã chốt đáp án</span>
                  ) : (
                    <span className="text-slate-400 animate-pulse">Đang giải mã...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Determine clue based on player index in team
  const teamPlayers = Object.entries(gameState.players).filter(([id, p]) => p.teamId === myTeamId);
  teamPlayers.sort((a, b) => a[0].localeCompare(b[0]));
  const myIndexInTeam = teamPlayers.findIndex(([id]) => id === playerId);
  const myClue = currentQuestion.clues[myIndexInTeam % currentQuestion.clues.length];
  const myTeam = gameState.teams[myTeamId];
  const me = gameState.players[playerId];

  return (
    <div className="flex-1 flex flex-col p-4 w-full max-w-6xl mx-auto h-[calc(100vh-80px)]">
      
      <div className="flex items-center justify-between mb-4 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">{myTeam?.name}</span>
          <span className="text-lg font-bold text-white">Điểm: <span className="text-yellow-400">{myTeam?.score || 0}</span></span>
        </div>
        
        <div className="text-center">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Vụ án {gameState.currentQuestionIndex + 1}/{gameState.questions.length}</span>
          <h2 className="text-xl font-bold text-white truncate max-w-[200px] md:max-w-[400px]">{currentQuestion.title}</h2>
        </div>
        
        <div className="relative w-14 h-14 flex items-center justify-center bg-slate-900 rounded-full border-2 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]">
          <span className={`text-xl font-bold ${seconds <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {seconds}
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        {/* Cột trái: Manh mối cá nhân & Form trả lời */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900/50 p-6 rounded-xl border border-indigo-500/30 shadow-lg">
            <h3 className="text-indigo-300 text-sm uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
              <Search size={16} /> Manh Mối Của Bạn
            </h3>
            <p className="text-2xl font-medium text-white leading-relaxed">
              "{myClue}"
            </p>
          </div>

          <SubmissionArea 
            disabled={teamHasAnswered || showResult || timeExpired}
            hasSubmitted={teamHasAnswered}
            onSubmit={handleAnswerSubmit}
            showResult={showResult}
            correctAnswer={currentQuestion.correctAnswer}
          />
          
          {showResult && (
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mt-2">
              <h4 className="text-yellow-400 font-bold mb-2">Giải thích:</h4>
              <p className="text-slate-300 text-sm">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        {/* Cột phải: Khung Chat */}
        <div className="h-[400px] md:h-full">
          <TeamChat 
            roomCode={roomCode}
            teamId={myTeamId}
            playerId={playerId}
            playerName={me?.name || 'Vô danh'}
          />
        </div>
      </div>
    </div>
  );
};

export default Game;
