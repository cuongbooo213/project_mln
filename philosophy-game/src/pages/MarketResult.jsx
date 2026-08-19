import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '../firebase/config';
import { CheckCircle2, Home, History } from 'lucide-react';
import marketItemsData from '../data/market_items.json';

const MarketResult = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { playerId } = location.state || {};
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const snap = await get(ref(database, `rooms/${roomCode}`));
      if (snap.exists()) setRoomData(snap.val());
    };
    fetch();
  }, [roomCode]);

  if (!roomData) {
    return <div className="flex-1 flex items-center justify-center text-white">Đang tải kết quả...</div>;
  }

  const teams = roomData.teams || {};
  const rounds = roomData.rounds || [];

  return (
    <div className="flex-1 flex flex-col items-center p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2">
            Tổng Kết Trò Chơi
          </h2>
          <p className="text-xl text-amber-300 font-bold mb-1">Thống Kê Đáp Án Các Vòng</p>
        </div>

        {/* Round by Round Stats */}
        <div className="space-y-6 mb-8">
          {marketItemsData.map((item, index) => {
            const roundRecord = rounds[index] || {};
            const answers = roundRecord.answers || {};
            const correctTeams = Object.keys(answers);
            
            return (
              <div key={item.roundId} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                <div className="bg-slate-900/80 p-4 border-b border-slate-700">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <History size={20} className="text-amber-400" />
                    Vòng {index + 1}: {item.mission.title}
                  </h3>
                  <div className="text-sm text-green-400 font-bold mt-2">
                    Đáp án: {item.mission.correctAnswer}
                  </div>
                </div>
                
                <div className="p-4">
                  {correctTeams.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {correctTeams.map(tId => (
                        <div key={tId} className="flex items-center gap-2 bg-green-900/20 border border-green-500/30 px-3 py-2 rounded-lg text-green-300 text-sm font-bold">
                          <CheckCircle2 size={16} className="text-green-500" />
                          <span>{teams[tId]?.emoji} {teams[tId]?.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic text-sm text-center py-2">
                      Không có đội nào trả lời đúng ở vòng này.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => navigate('/')}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all">
          <Home size={20} /> Về Trang Chủ
        </button>
      </div>
    </div>
  );
};

export default MarketResult;
