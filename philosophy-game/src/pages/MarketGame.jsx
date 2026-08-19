import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { getServerTime } from '../firebase/timeSync';
import {
  startMarketRound, startAuction, endAuction, cancelAuction,
  placeBid, adjustTeamXu, sendBroadcast, sendHostHint,
  startMissionPhase, submitMissionAnswer, finishMarketGame,
  sendMarketChat,
} from '../services/marketService';
import AuctionPanel from '../components/AuctionPanel';
import TeamInventory from '../components/TeamInventory';
import MissionSolver from '../components/MissionSolver';
import { useAudioContext } from '../contexts/AudioContext';
import marketItemsData from '../data/market_items.json';
import { Store, Coins, Send, Megaphone, Gift, Pause, Play, SkipForward, Package, MessageCircle, Gavel, Brain } from 'lucide-react';

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
  const [missionSeconds, setMissionSeconds] = useState(0);
  const messagesEndRef = useRef(null);

  // Host-specific states
  const [broadcastText, setBroadcastText] = useState('');
  const [hintTeam, setHintTeam] = useState('');
  const [hintText, setHintText] = useState('');
  const [xuTeam, setXuTeam] = useState('');
  const [xuAmount, setXuAmount] = useState(100);

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

  // Mission timer
  useEffect(() => {
    if (!roomData) return;
    const round = roomData.currentRound;
    const phase = roomData.rounds?.[round]?.phase;
    if (phase !== 'mission' || !roomData.missionStartTime) return;

    const missionDuration = roomData.config?.missionTimer || 120;
    const interval = setInterval(() => {
      const elapsed = Math.floor((getServerTime() - roomData.missionStartTime) / 1000);
      setMissionSeconds(Math.max(0, missionDuration - elapsed));
    }, 500);
    return () => clearInterval(interval);
  }, [roomData?.missionStartTime, roomData?.rounds, roomData?.currentRound, roomData?.config?.missionTimer]);

  if (!roomData) {
    return <div className="flex-1 flex items-center justify-center text-white">Đang tải...</div>;
  }

  const isHost = playerId === roomData.hostId;
  const teams = roomData.teams || {};
  const config = roomData.config || {};
  const currentRound = roomData.currentRound ?? -1;
  const roundData = roomData.rounds?.[currentRound];
  const phase = roundData?.phase || 'shopping';
  const auction = roomData.auction;
  const myTeam = teams[myTeamId];

  // ======================== HOST VIEW ========================
  if (isHost) {
    const items = roundData?.items || {};
    const itemList = Object.entries(items);

    const handleStartRound = async () => {
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
          currentBid: item.startPrice,
          currentBidder: null,
          startTime: getServerTime(),
          endTime: getServerTime() + (config.auctionTimer || 15) * 1000,
          bids: {},
        },
      });
    };

    const handleEndAuction = () => endAuction(roomCode);
    const handleCancelAuction = () => cancelAuction(roomCode);
    const handleMissionPhase = () => startMissionPhase(roomCode);
    const handleFinish = () => finishMarketGame(roomCode);

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
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Package size={18} className="text-amber-400" />
                Quầy Hàng ({itemList.filter(([,i]) => !i.soldTo).length} chưa bán / {itemList.length} tổng)
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {itemList.map(([itemId, item]) => (
                  <div key={itemId} className={`p-3 rounded-lg border flex items-center justify-between ${
                    item.soldTo ? 'bg-green-900/20 border-green-600/30' : 'bg-slate-900/50 border-slate-700'
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{item.label}</span>
                        {item.isFake && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">GIẢ</span>}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{item.startPrice} Xu — {item.content?.substring(0, 50)}...</div>
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
              {/* Active auction controls */}
              {auction?.isActive && (
                <div className="bg-amber-900/30 p-4 rounded-xl border border-amber-500/30">
                  <h4 className="text-amber-400 font-bold mb-2">🔨 Đấu Giá Đang Diễn Ra</h4>
                  <p className="text-white text-sm mb-1">{auction.itemLabel}</p>
                  <p className="text-2xl font-black text-amber-400 mb-2">{auction.currentBid} Xu</p>
                  {auction.currentBidder && (
                    <p className="text-sm text-green-400 mb-3">Dẫn đầu: {teams[auction.currentBidder]?.emoji} {teams[auction.currentBidder]?.name}</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={handleEndAuction} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold text-sm">🔨 Kết Thúc</button>
                    <button onClick={handleCancelAuction} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-bold text-sm">❌ Hủy</button>
                  </div>
                </div>
              )}

              {/* Phase controls */}
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-2">
                <h4 className="font-bold text-white mb-1">Điều Khiển</h4>
                {phase === 'shopping' && (
                  <button onClick={handleMissionPhase}
                    className="bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2">
                    <Brain size={18} /> Chuyển Sang Nhiệm Vụ
                  </button>
                )}
                <button onClick={handleStartRound} disabled={currentRound + 1 >= marketItemsData.length}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  <SkipForward size={18} /> {currentRound + 1 >= marketItemsData.length ? 'Hết vòng' : 'Vòng Tiếp Theo'}
                </button>
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
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                  <h4 className="font-bold text-white mb-2 text-sm">🧩 Đáp án các đội</h4>
                  <div className="space-y-1">
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
                            <span className="text-slate-500 animate-pulse">Đang làm...</span>
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

  const handleBid = async (amount) => {
    const result = await placeBid(roomCode, myTeamId, amount);
    if (!result.success) alert(result.error);
  };

  const handleMissionSubmit = async (answer) => {
    await submitMissionAnswer(roomCode, myTeamId, answer);
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
            onSubmit={handleMissionSubmit}
            hasSubmitted={!!myAnswer}
            showResult={false}
            seconds={missionSeconds}
          />
        ) : (
          <AuctionPanel
            auction={auction}
            teams={teams}
            myTeamId={myTeamId}
            onBid={handleBid}
            myXu={myXu}
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
            <MissionSolver mission={roundMission} inventory={myInventory} onSubmit={handleMissionSubmit}
              hasSubmitted={!!myAnswer} showResult={false} seconds={missionSeconds} />
          ) : (
            <AuctionPanel auction={auction} teams={teams} myTeamId={myTeamId} onBid={handleBid} myXu={myXu} />
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
