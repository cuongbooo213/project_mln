import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { getServerTime } from '../firebase/timeSync';
import {
  startMarketRound, startAuction, endAuction, cancelAuction,
  toggleHand, adjustTeamXu, sendBroadcast, sendHostHint,
  startMissionPhase, submitMissionAnswer, finishMarketGame,
  sendMarketChat, revealMissionHint, toggleMissionHand
} from '../services/marketService';
import AuctionPanel from '../components/AuctionPanel';
import TeamInventory from '../components/TeamInventory';
import MissionSolver from '../components/MissionSolver';
import { useAudioContext } from '../contexts/AudioContext';
import marketItemsData from '../data/market_items.json';
import { Store, Coins, Send, Megaphone, Gift, Pause, Play, SkipForward, Package, MessageCircle, Gavel, Brain, Eye, EyeOff } from 'lucide-react';

const MarketGame = () => {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { playerId } = location.state || {};
  const [roomData, setRoomData] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [activeTab, setActiveTab] = useState('auction'); // auction | inventory | chat
  const messagesEndRef = useRef(null);

  // Host-specific states
  const [broadcastText, setBroadcastText] = useState('');
  const [hintTeam, setHintTeam] = useState('');
  const [hintText, setHintText] = useState('');
  const [xuTeam, setXuTeam] = useState('');
  const [xuAmount, setXuAmount] = useState(100);
  const [winnerTeam, setWinnerTeam] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [missionAnswerTeam, setMissionAnswerTeam] = useState('');
  const [missionAnswerText, setMissionAnswerText] = useState('');

  const { isMuted } = useAudioContext();

  useEffect(() => {
    if (!roomCode || !playerId) { navigate('/'); return; }
    const roomRef = ref(database, `rooms/${roomCode}`);
    const unsub = onValue(roomRef, (snap) => {
      const data = snap.val();
      if (data) {
        setRoomData(data);
        if (data.gameState === 'finished') {
          navigate(`/market-result/${roomCode}`, { state: { playerId } });
        }
      }
    });
    return () => unsub();
  }, [roomCode, playerId, navigate]);

  // Listen to team chat
  const myTeamId = roomData?.players?.[playerId]?.teamId;
  useEffect(() => {
    if (!roomCode || !myTeamId) return;
    const chatRef = ref(database, `rooms/${roomCode}/teams/${myTeamId}/chat`);
    const unsub = onValue(chatRef, (snap) => {
      const data = snap.val();
      if (data) {
        setMessages(Object.values(data).sort((a, b) => a.timestamp - b.timestamp));
      } else {
        setMessages([]);
      }
    });
    return () => unsub();
  }, [roomCode, myTeamId]);

  // Listen to broadcasts
  useEffect(() => {
    if (!roomCode) return;
    const bcRef = ref(database, `rooms/${roomCode}/broadcasts`);
    const unsub = onValue(bcRef, (snap) => {
      const data = snap.val();
      if (data) {
        setBroadcasts(Object.values(data).sort((a, b) => b.timestamp - a.timestamp).slice(0, 5));
      }
    });
    return () => unsub();
  }, [roomCode]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  if (!roomData) {
    return <div className="flex-1 flex items-center justify-center text-white">Đang tải...</div>;
  }

  const isHost = playerId === roomData.hostId;
  const teams = roomData.teams || {};
  const config = roomData.config || {};
  const currentRound = roomData.currentRound ?? -1;
  const roundData = roomData.rounds?.[currentRound];
  const phase = roundData?.phase || 'shopping';
  const revealedIndices = roundData?.revealedIndices || {};
  const auction = roomData.auction;
  const myTeam = teams[myTeamId];

  // ======================== HOST VIEW ========================
  if (isHost) {
    const items = roundData?.items || {};
    const itemList = Object.entries(items);

    const handleStartRound = async () => {
      if (!window.confirm("Bạn có chắc chắn muốn mở phiên chợ vòng này không?")) return;
      const nextRoundIdx = currentRound + 1;
      if (nextRoundIdx >= marketItemsData.length) {
        await finishMarketGame(roomCode);
        return;
      }
      await startMarketRound(roomCode, marketItemsData[nextRoundIdx]);
    };

    const handleStartAuction = async (itemId) => {
      const item = items[itemId];
      if (!item) return;
      // Store label/hint in auction for player display
      const { update: fbUpdate } = await import('firebase/database');
      const roomRef = ref(database, `rooms/${roomCode}`);
      await fbUpdate(roomRef, {
        auction: {
          isActive: true,
          itemId,
          itemLabel: item.label,
          itemHint: item.hint,
          raisedHands: {},
          startTime: getServerTime(),
          bids: {},
        },
      });
      setWinnerTeam('');
      setFinalPrice(item.startPrice);
    };

    const handleEndAuction = async (e) => {
      e.preventDefault();
      if (!winnerTeam || finalPrice === '') return;
      
      const priceNum = Number(finalPrice);
      const teamXu = teams[winnerTeam]?.xu || 0;
      
      if (priceNum > teamXu) {
        alert(`❌ Đội ${teams[winnerTeam]?.name} chỉ còn ${teamXu} Xu. Không thể chốt giá cao hơn số Xu đang có!`);
        return;
      }
      
      await endAuction(roomCode, winnerTeam, priceNum);
    };
    const handleCancelAuction = () => {
      if (window.confirm("Bạn có chắc chắn muốn hủy phiên đấu giá hiện tại không?")) {
        cancelAuction(roomCode);
      }
    };
    const handleMissionPhase = () => {
      if (window.confirm("Chốt hàng và chuyển sang phần giải nhiệm vụ? Các đội sẽ không thể mua thêm đồ nữa.")) {
        startMissionPhase(roomCode);
      }
    };
    const handleFinish = () => {
      if (window.confirm("Bạn có chắc chắn muốn kết thúc game ngay bây giờ không?")) {
        finishMarketGame(roomCode);
      }
    };
    const handleRevealHint = async (idx) => {
      await revealMissionHint(roomCode, idx);
    };

    const handleBroadcast = async (e) => {
      e.preventDefault();
      if (!broadcastText.trim()) return;
      await sendBroadcast(roomCode, broadcastText);
      setBroadcastText('');
    };

    const handleHint = async (e) => {
      e.preventDefault();
      if (!hintText.trim() || !hintTeam) return;
      await sendHostHint(roomCode, hintTeam, hintText);
      setHintText('');
    };

    const handleHostCheckAnswer = async (e) => {
      e.preventDefault();
      if (!missionAnswerTeam || !missionAnswerText.trim()) return;
      const result = await submitMissionAnswer(roomCode, missionAnswerTeam, missionAnswerText.trim());
      // Hạ tay đội sau khi kiểm tra
      await toggleMissionHand(roomCode, missionAnswerTeam, false);
      if (result.isCorrect) {
        alert(`✅ Đúng! Đội ${teams[missionAnswerTeam]?.name} được +${result.score} điểm!`);
      } else {
        alert(`❌ Sai! Đáp án "${missionAnswerText.trim()}" không chính xác.`);
      }
      setMissionAnswerText('');
      setMissionAnswerTeam('');
    };

    const handleXuAdjust = async (teamId, amount) => {
      await adjustTeamXu(roomCode, teamId, amount);
    };

    return (
      <div className="flex-1 flex flex-col p-4 w-full max-w-6xl mx-auto overflow-y-auto">
        {/* Host Header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            🏪 Bảng Điều Khiển Chủ Chợ
          </h2>
          <p className="text-slate-400 text-sm">
            {currentRound === -1 ? 'Chưa bắt đầu vòng nào' : `Vòng ${currentRound + 1}/${marketItemsData.length} — ${phase === 'mission' ? '🧩 Nhiệm Vụ' : '🛒 Mua Bán'}`}
          </p>
        </div>

        {/* Teams Overview */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 mb-4">
          {Object.entries(teams).map(([tId, team]) => (
            <div key={tId} className="bg-slate-800 p-2 rounded-lg border border-slate-700 text-center">
              <div className="text-lg">{team.emoji}</div>
              <div className="text-xs text-white font-bold truncate">{team.name}</div>
              <div className="text-amber-400 text-xs font-bold flex items-center justify-center gap-0.5">
                <Coins size={10} /> {team.xu}
              </div>
              <div className="text-[10px] text-slate-400">🏆{team.score}</div>
              <div className="flex gap-1 justify-center mt-1">
                <button onClick={() => handleXuAdjust(tId, 100)} className="text-[10px] bg-green-600/30 text-green-400 px-1.5 py-0.5 rounded hover:bg-green-600/50">+100</button>
                <button onClick={() => handleXuAdjust(tId, -50)} className="text-[10px] bg-red-600/30 text-red-400 px-1.5 py-0.5 rounded hover:bg-red-600/50">-50</button>
              </div>
            </div>
          ))}
        </div>

        {/* Start Round / Current Auction */}
        {currentRound === -1 ? (
          <button onClick={handleStartRound}
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-4 px-8 rounded-xl w-full text-xl shadow-lg mb-4 hover:scale-[1.02] transition-transform">
            🏪 Mở Phiên Chợ Vòng 1
          </button>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Items Panel */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Package size={18} className="text-amber-400" />
                  Quầy Hàng ({itemList.filter(([,i]) => !i.soldTo).length} chưa bán / {itemList.length} tổng)
                </h3>
                <button onClick={() => setShowItemDetails(!showItemDetails)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                  {showItemDetails ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showItemDetails ? 'Ẩn chi tiết' : 'Hiện chi tiết'}
                </button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {itemList.map(([itemId, item]) => (
                  <div key={itemId} className={`p-3 rounded-lg border flex items-center justify-between ${
                    item.soldTo ? 'bg-green-900/20 border-green-600/30' : 'bg-slate-900/50 border-slate-700'
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{item.label}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        <span className="text-amber-400 font-bold">{item.startPrice} Xu</span> — {showItemDetails ? item.content : item.hint}
                      </div>
                      {item.soldTo && (
                        <div className="text-xs text-green-400 mt-0.5">✓ Bán cho {teams[item.soldTo]?.name} — {item.soldPrice} Xu</div>
                      )}
                    </div>
                    {!item.soldTo && !auction?.isActive && (
                      <button onClick={() => handleStartAuction(itemId)}
                        className="ml-2 bg-amber-600 hover:bg-amber-500 text-white text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1 whitespace-nowrap">
                        <Gavel size={14} /> Đấu Giá
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3">
              {auction?.isActive && (
                <div className="bg-amber-900/30 p-4 rounded-xl border border-amber-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-amber-400 font-bold">🔨 Đang Bán: {auction.itemLabel}</h4>
                    <button onClick={handleCancelAuction} className="bg-red-600/80 hover:bg-red-500 text-white px-3 py-1 rounded-lg font-bold text-xs">❌ Hủy</button>
                  </div>
                  
                  {/* Raised hands display */}
                  <div className="mb-4">
                    <div className="text-sm text-slate-300 mb-2">🙋 Các đội đang giơ tay:</div>
                    <div className="flex flex-wrap gap-2">
                      {!auction.raisedHands || Object.keys(auction.raisedHands).length === 0 ? (
                        <span className="text-slate-500 text-sm italic">Chưa có ai giơ tay...</span>
                      ) : (
                        Object.keys(auction.raisedHands).map(tId => (
                          <div key={tId} className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg border border-amber-500/30 flex items-center gap-2 text-sm font-bold animate-pulse">
                            {teams[tId]?.emoji} {teams[tId]?.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Close deal form */}
                  <form onSubmit={handleEndAuction} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex flex-col gap-2">
                    <div className="text-sm font-bold text-white mb-1">Chốt Đơn</div>
                    <div className="flex gap-2">
                      <select value={winnerTeam} onChange={e => setWinnerTeam(e.target.value)} required
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                        <option value="">Chọn đội thắng...</option>
                        {Object.entries(teams).map(([tId, t]) => (
                          <option key={tId} value={tId}>{t.emoji} {t.name} (Xu: {t.xu})</option>
                        ))}
                      </select>
                      <input type="number" value={finalPrice} 
                        onChange={e => {
                          let val = e.target.value;
                          if (winnerTeam && val !== '' && Number(val) > (teams[winnerTeam]?.xu || 0)) {
                             val = teams[winnerTeam].xu;
                          }
                          setFinalPrice(val);
                        }} 
                        required placeholder="Giá (Xu)" 
                        min={items[auction.itemId]?.startPrice || 0} 
                        max={winnerTeam ? teams[winnerTeam]?.xu : ''}
                        className="w-24 bg-slate-800 border border-slate-600 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                    </div>
                    <button type="submit" disabled={!winnerTeam || finalPrice === ''}
                      className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold text-sm mt-1 disabled:opacity-50">
                      🔨 Chốt Bán
                    </button>
                  </form>
                </div>
              )}

              {/* Phase controls */}
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-2">
                <h4 className="font-bold text-white mb-1">Điều Khiển</h4>
                {phase === 'shopping' ? (
                  <button onClick={handleMissionPhase}
                    className="bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20">
                    <Brain size={18} /> Chốt Hàng — Chuyển Sang Trả Lời Câu Hỏi
                  </button>
                ) : (
                  <button onClick={handleStartRound} disabled={currentRound + 1 >= marketItemsData.length}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                    <SkipForward size={18} /> {currentRound + 1 >= marketItemsData.length ? 'Đã hết các vòng' : 'Chuyển Sang Vòng Tiếp Theo'}
                  </button>
                )}
                <button onClick={handleFinish}
                  className="bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2">
                  🏁 Kết Thúc Game
                </button>
              </div>

              {/* Broadcast */}
              <form onSubmit={handleBroadcast} className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex gap-2">
                <input type="text" value={broadcastText} onChange={e => setBroadcastText(e.target.value)}
                  placeholder="📢 Phát thông báo..." className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-lg">
                  <Megaphone size={16} />
                </button>
              </form>

              {/* Hint */}
              <form onSubmit={handleHint} className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-col gap-2">
                <div className="flex gap-2">
                  <select value={hintTeam} onChange={e => setHintTeam(e.target.value)}
                    className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-white text-sm focus:outline-none">
                    <option value="">Chọn đội...</option>
                    {Object.entries(teams).map(([tId, t]) => (
                      <option key={tId} value={tId}>{t.emoji} {t.name}</option>
                    ))}
                  </select>
                  <input type="text" value={hintText} onChange={e => setHintText(e.target.value)}
                    placeholder="💡 Gợi ý riêng..." className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg">
                    <Gift size={16} />
                  </button>
                </div>
              </form>

              {/* Mission answers overview */}
              {phase === 'mission' && (
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <h4 className="font-bold text-white mb-4 text-sm flex items-center gap-2"><Brain size={18} className="text-amber-400" /> Nhiệm Vụ</h4>
                  
                  {/* Host masked hint view */}
                  <div className="mb-5 p-4 bg-slate-900 rounded-lg text-center border border-slate-700">
                    <div className="text-xs text-slate-400 mb-2 uppercase font-bold tracking-widest">Gợi ý hiện tại (Bấm vào ô để lật)</div>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {marketItemsData[currentRound]?.mission?.correctAnswer?.split('').map((char, idx) => {
                        const isSpace = char === ' ';
                        const isRevealed = revealedIndices[idx];
                        return (
                          <button key={idx} onClick={() => handleRevealHint(idx)} disabled={isSpace}
                            className={`w-8 h-10 flex items-center justify-center text-lg font-bold rounded hover:ring-2 hover:ring-amber-500 transition-all ${
                            isSpace ? 'bg-transparent cursor-default hover:ring-0' : 'bg-slate-800 border border-slate-600 cursor-pointer shadow-inner'
                          } ${isRevealed ? 'text-amber-400' : 'text-slate-700'}`}>
                            {isSpace ? ' ' : isRevealed ? char : '?'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mission raised hands */}
                  <div className="mb-4">
                    <div className="text-sm text-slate-300 mb-2">🙋 Các đội giơ tay trả lời:</div>
                    <div className="flex flex-wrap gap-2">
                      {!roundData?.missionHands || Object.keys(roundData.missionHands).length === 0 ? (
                        <span className="text-slate-500 text-sm italic">Chưa có đội nào giơ tay...</span>
                      ) : (
                        Object.keys(roundData.missionHands)
                          .sort((a, b) => (roundData.missionHands[a] || 0) - (roundData.missionHands[b] || 0))
                          .map(tId => (
                          <div key={tId} className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-sm font-bold cursor-pointer ${
                            roundData?.answers?.[tId]?.isCorrect
                              ? 'bg-green-500/20 text-green-300 border-green-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                          }`} onClick={() => { if (!roundData?.answers?.[tId]?.isCorrect) setMissionAnswerTeam(tId); }}>
                            {teams[tId]?.emoji} {teams[tId]?.name}
                            {roundData?.answers?.[tId]?.isCorrect && ' ✅'}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Host answer check form */}
                  <form onSubmit={handleHostCheckAnswer} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex flex-col gap-2">
                    <div className="text-sm font-bold text-white mb-1">📝 Nhập đáp án của đội để kiểm tra</div>
                    <div className="flex gap-2">
                      <select value={missionAnswerTeam} onChange={e => setMissionAnswerTeam(e.target.value)} required
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                        <option value="">Chọn đội...</option>
                        {Object.entries(teams).filter(([tId]) => !roundData?.answers?.[tId]?.isCorrect).map(([tId, t]) => (
                          <option key={tId} value={tId}>{t.emoji} {t.name}</option>
                        ))}
                      </select>
                    </div>
                    <input type="text" value={missionAnswerText} onChange={e => setMissionAnswerText(e.target.value)}
                      placeholder="Nhập đáp án đội trả lời..." required
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                    <button type="submit" disabled={!missionAnswerTeam || !missionAnswerText.trim()}
                      className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold text-sm disabled:opacity-50">
                      ✅ Kiểm Tra Đáp Án
                    </button>
                  </form>

                  {/* Already answered teams */}
                  <div className="mt-4 space-y-1">
                    <div className="text-xs text-slate-400 font-bold mb-1">Kết quả:</div>
                    {Object.entries(teams).map(([tId, team]) => {
                      const ans = roundData?.answers?.[tId];
                      return (
                        <div key={tId} className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{team.emoji} {team.name}</span>
                          {ans ? (
                            <span className={ans.isCorrect ? 'text-green-400' : 'text-red-400'}>
                              {ans.isCorrect ? '✅' : '❌'} "{ans.answer}" (+{ans.score})
                            </span>
                          ) : (
                            <span className="text-slate-500">Chưa trả lời</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ======================== PLAYER VIEW ========================
  const myInventory = myTeam?.inventory || {};
  const myXu = myTeam?.xu || 0;
  const roundMission = roundData?.mission;
  const myAnswer = roundData?.answers?.[myTeamId];
  const hasCorrectAnswer = myAnswer?.isCorrect;
  const isLeader = myTeam?.leaderId === playerId;

  const handleToggleHand = async (isRaising) => {
    const result = await toggleHand(roomCode, myTeamId, isRaising);
    if (!result.success) alert(result.error);
  };

  const handleMissionHandToggle = async (isRaising) => {
    await toggleMissionHand(roomCode, myTeamId, isRaising);
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const me = roomData.players[playerId];
    await sendMarketChat(roomCode, myTeamId, playerId, me?.name || 'Ẩn danh', chatInput);
    setChatInput('');
  };

  if (currentRound === -1) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Store size={64} className="text-amber-400 mb-6 animate-pulse" />
        <h2 className="text-3xl font-bold text-white mb-3">Chợ Sắp Mở Cửa!</h2>
        <p className="text-slate-400">Đang chờ Chủ Chợ mở phiên đầu tiên...</p>
      </div>
    );
  }

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'auction':
        return phase === 'mission' ? (
          <MissionSolver
            mission={roundMission}
            inventory={myInventory}
            onToggleHand={handleMissionHandToggle}
            hasSubmitted={!!hasCorrectAnswer}
            showResult={false}
            isLeader={isLeader}
            revealedIndices={revealedIndices}
            isHandRaised={!!roundData?.missionHands?.[myTeamId]}
            myAnswer={hasCorrectAnswer ? myAnswer : null}
          />
        ) : (
          <AuctionPanel
            auction={auction}
            teams={teams}
            myTeamId={myTeamId}
            onToggleHand={handleToggleHand}
            myXu={myXu}
            isLeader={isLeader}
          />
        );
      case 'inventory':
        return <TeamInventory inventory={myInventory} xu={myXu} teamName={myTeam?.name} />;
      case 'chat':
        return (
          <div className="flex flex-col h-full bg-slate-900/80 rounded-xl border border-slate-700 overflow-hidden">
            <div className="bg-slate-800 p-2.5 border-b border-slate-700 text-center font-bold text-white text-sm flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Chat Nội Bộ {myTeam?.name}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Broadcasts */}
              {broadcasts.map((bc, i) => (
                <div key={`bc-${i}`} className="bg-amber-900/30 border border-amber-500/30 p-2 rounded-lg text-center">
                  <span className="text-xs text-amber-400">📢 {bc.text}</span>
                </div>
              ))}
              {messages.map((msg, idx) => {
                const isMe = msg.playerId === playerId;
                const isHostMsg = msg.isHost;
                return (
                  <div key={idx} className={`flex flex-col ${isHostMsg ? 'items-center' : isMe ? 'items-end' : 'items-start'}`}>
                    {isHostMsg ? (
                      <div className="bg-amber-900/30 border border-amber-500/30 px-3 py-2 rounded-xl max-w-[90%] text-sm text-amber-300">
                        👑 {msg.text}
                      </div>
                    ) : (
                      <>
                        <span className="text-[10px] text-slate-400 mb-0.5">{isMe ? 'Bạn' : msg.playerName}</span>
                        <div className={`px-3 py-1.5 rounded-2xl max-w-[85%] text-sm ${
                          isMe ? 'bg-amber-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleChat} className="p-2.5 bg-slate-800 border-t border-slate-700 flex gap-2">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder="Nhập tin nhắn..." className="flex-1 bg-slate-900 border border-slate-600 rounded-full px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500" />
              <button type="submit" disabled={!chatInput.trim()}
                className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white p-2 rounded-full w-8 h-8 flex items-center justify-center">
                <Send size={14} />
              </button>
            </form>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto h-[calc(100vh-65px)]">
      {/* Player Header */}
      <div className="flex items-center justify-between p-3 bg-slate-800/80 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-lg">{myTeam?.emoji}</span>
          <div>
            <div className="text-xs text-slate-400">{myTeam?.name}</div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-amber-400 font-bold flex items-center gap-1"><Coins size={14} /> {myXu}</span>
              <span className="text-slate-400"><Package size={14} className="inline" /> {Object.keys(myInventory).length}</span>
              <span className="text-indigo-400">🏆 {myTeam?.score || 0}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Vòng {currentRound + 1}/{marketItemsData.length}</div>
          <div className="text-sm font-bold text-white">{phase === 'mission' ? '🧩 Nhiệm Vụ' : '🛒 Mua Bán'}</div>
        </div>
      </div>

      {/* Desktop: 3-column layout, Mobile: tabs */}
      <div className="hidden md:flex flex-1 min-h-0">
        <div className="flex-1 p-3 overflow-y-auto">
          {phase === 'mission' ? (
            <MissionSolver mission={roundMission} inventory={myInventory}
              onToggleHand={handleMissionHandToggle}
              hasSubmitted={!!hasCorrectAnswer} showResult={false} isLeader={isLeader}
              revealedIndices={revealedIndices}
              isHandRaised={!!roundData?.missionHands?.[myTeamId]}
              myAnswer={hasCorrectAnswer ? myAnswer : null} />
          ) : (
            <AuctionPanel auction={auction} teams={teams} myTeamId={myTeamId} onToggleHand={handleToggleHand} myXu={myXu} isLeader={isLeader} />
          )}
        </div>
        <div className="w-72 border-l border-slate-700 p-3 overflow-y-auto">
          <TeamInventory inventory={myInventory} xu={myXu} teamName={myTeam?.name} />
        </div>
        <div className="w-80 border-l border-slate-700 flex flex-col">
          {/* Inline chat for desktop */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-slate-800 p-2 border-b border-slate-700 text-center font-bold text-white text-sm flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Chat {myTeam?.name}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {broadcasts.map((bc, i) => (
                <div key={`bc-${i}`} className="bg-amber-900/30 border border-amber-500/30 p-2 rounded-lg text-center">
                  <span className="text-xs text-amber-400">📢 {bc.text}</span>
                </div>
              ))}
              {messages.map((msg, idx) => {
                const isMe = msg.playerId === playerId;
                const isHostMsg = msg.isHost;
                return (
                  <div key={idx} className={`flex flex-col ${isHostMsg ? 'items-center' : isMe ? 'items-end' : 'items-start'}`}>
                    {isHostMsg ? (
                      <div className="bg-amber-900/30 border border-amber-500/30 px-3 py-1.5 rounded-xl max-w-[90%] text-xs text-amber-300">
                        👑 {msg.text}
                      </div>
                    ) : (
                      <>
                        <span className="text-[10px] text-slate-400 mb-0.5">{isMe ? 'Bạn' : msg.playerName}</span>
                        <div className={`px-2.5 py-1.5 rounded-2xl max-w-[85%] text-sm ${
                          isMe ? 'bg-amber-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'
                        }`}>{msg.text}</div>
                      </>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleChat} className="p-2 bg-slate-800 border-t border-slate-700 flex gap-2">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder="Nhập tin nhắn..." className="flex-1 bg-slate-900 border border-slate-600 rounded-full px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500" />
              <button type="submit" disabled={!chatInput.trim()}
                className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white p-2 rounded-full w-8 h-8 flex items-center justify-center">
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile: Tab navigation */}
      <div className="md:hidden flex-1 flex flex-col min-h-0">
        <div className="flex border-b border-slate-700 bg-slate-800">
          {[
            { id: 'auction', icon: phase === 'mission' ? <Brain size={16} /> : <Gavel size={16} />, label: phase === 'mission' ? 'Nhiệm Vụ' : 'Đấu Giá' },
            { id: 'inventory', icon: <Package size={16} />, label: `Kho (${Object.keys(myInventory).length})` },
            { id: 'chat', icon: <MessageCircle size={16} />, label: 'Chat' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors ${
                activeTab === tab.id ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-900/50' : 'text-slate-400'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 p-3 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default MarketGame;
