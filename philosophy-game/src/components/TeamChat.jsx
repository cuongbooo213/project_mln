import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { sendTeamMessage } from '../services/gameService';
import { Send } from 'lucide-react';

const TeamChat = ({ roomCode, teamId, playerId, playerName }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!roomCode || !teamId) return;
    
    const chatRef = ref(database, `rooms/${roomCode}/teams/${teamId}/chat`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array and sort by timestamp
        const msgs = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [roomCode, teamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const text = input.trim();
    setInput(''); // clear input immediately for better UX
    await sendTeamMessage(roomCode, teamId, playerId, playerName, text);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
      <div className="bg-slate-800 p-3 border-b border-slate-700 text-center font-bold text-white flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        Kênh Chat Nội Bộ Đội
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 text-sm mt-4">
            Chưa có tin nhắn nào. Hãy bắt đầu trao đổi manh mối!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.playerId === playerId;
            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-slate-400 mb-1 ml-1">{isMe ? 'Bạn' : msg.playerName}</span>
                <div 
                  className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-slate-700 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..." 
          className="flex-1 bg-slate-900 border border-slate-600 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button 
          type="submit"
          disabled={!input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default TeamChat;
