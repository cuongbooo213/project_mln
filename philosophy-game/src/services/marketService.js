import { ref, update, get, push, set } from "firebase/database";
import { database } from "../firebase/config";
import { getServerTime } from "../firebase/timeSync";

const TEAM_NAMES = [
  "Đội Cách Mạng", "Đội Tiên Phong", "Đội Độc Lập",
  "Đội Thống Nhất", "Đội Niềm Tin", "Đội Quyết Tâm",
  "Đội Lịch Sử", "Đội Việt Nam", "Đội Chiến Thắng"
];
const TEAM_EMOJIS = ["🟥","🟦","🟩","🟨","🟪","🟧","⬛","🟫","⬜"];

// ========== ROOM ==========

export const createMarketRoom = async (hostName, config = {}) => {
  const {
    numTeams = 9,
    playersPerTeam = 7,
    startingXu = 1000,
  } = config;

  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const hostId = "host_" + Date.now();

  const teams = {};
  for (let i = 0; i < numTeams; i++) {
    teams[`team_${i}`] = {
      name: TEAM_NAMES[i] || `Đội ${i + 1}`,
      emoji: TEAM_EMOJIS[i] || "🏳️",
      xu: startingXu,
      score: 0,
      inventory: {},
      players: {},
    };
  }

  const roomRef = ref(database, `rooms/${roomCode}`);
  await set(roomRef, {
    gameMode: "market",
    gameState: "waiting",
    createdAt: Date.now(),
    hostId,
    config: { numTeams, playersPerTeam, startingXu },
    teams,
    currentRound: -1,
    players: {
      [hostId]: { name: hostName, isHost: true },
    },
  });

  return { roomCode, playerId: hostId, name: hostName };
};

export const joinMarketRoom = async (roomCode, playerName) => {
  const code = roomCode.toUpperCase();
  const roomRef = ref(database, `rooms/${code}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) throw new Error("Phòng không tồn tại");
  const data = snapshot.val();
  if (data.gameState !== "waiting") throw new Error("Game đã bắt đầu hoặc kết thúc");

  const maxPlayers = (data.config?.numTeams || 9) * (data.config?.playersPerTeam || 7);
  const count = Object.values(data.players || {}).filter(p => !p.isHost).length;
  if (count >= maxPlayers) throw new Error("Phòng đã đầy");

  const playerId = "player_" + Date.now();
  await set(ref(database, `rooms/${code}/players/${playerId}`), {
    name: playerName, isHost: false,
  });

  return { roomCode: code, playerId, name: playerName };
};

export const joinMarketTeam = async (roomCode, playerId, teamId) => {
  const playerSnap = await get(ref(database, `rooms/${roomCode}/players/${playerId}`));
  const updates = {};

  if (playerSnap.exists()) {
    const old = playerSnap.val();
    if (old.teamId && old.teamId !== teamId) {
      updates[`rooms/${roomCode}/teams/${old.teamId}/players/${playerId}`] = null;
    }
  }

  const teamSnap = await get(ref(database, `rooms/${roomCode}/teams/${teamId}`));
  if (teamSnap.exists()) {
    const teamData = teamSnap.val();
    if (!teamData.leaderId) {
      updates[`rooms/${roomCode}/teams/${teamId}/leaderId`] = playerId;
    }
  }

  updates[`rooms/${roomCode}/players/${playerId}/teamId`] = teamId;
  updates[`rooms/${roomCode}/teams/${teamId}/players/${playerId}`] = true;
  await update(ref(database), updates);
};

export const setTeamLeader = async (roomCode, teamId, playerId) => {
  await update(ref(database, `rooms/${roomCode}/teams/${teamId}`), { leaderId: playerId });
};

// ========== MARKET ROUND ==========

export const startMarketRound = async (roomCode, roundData) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snap = await get(roomRef);
  const data = snap.val();
  const nextRound = (data.currentRound ?? -1) + 1;

  const items = {};
  roundData.items.forEach(item => {
    items[item.id] = {
      ...item,
      isRevealed: false,
      soldTo: null,
      soldPrice: 0,
    };
  });

  const updates = {};
  updates["gameState"] = "market";
  updates["currentRound"] = nextRound;
  updates[`rounds/${nextRound}`] = {
    mission: roundData.mission,
    items,
    phase: "shopping", // shopping | mission
  };
  updates["auction"] = null;

  await update(roomRef, updates);
};

// ========== AUCTION ==========

export const startAuction = async (roomCode, itemId, startPrice) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const now = getServerTime();

  await update(roomRef, {
    auction: {
      isActive: true,
      itemId,
      raisedHands: {},
      startTime: now,
    },
  });
};

export const toggleHand = async (roomCode, teamId, isRaising) => {
  const auctionRef = ref(database, `rooms/${roomCode}/auction/raisedHands/${teamId}`);
  if (isRaising) {
    await set(auctionRef, getServerTime());
  } else {
    await set(auctionRef, null);
  }
  return { success: true };
};

export const endAuction = async (roomCode, winnerTeamId = null, finalPrice = 0) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snap = await get(roomRef);
  const data = snap.val();
  const auction = data.auction;

  if (!auction || !auction.isActive) return;

  const updates = {};
  updates["auction/isActive"] = false;

  if (winnerTeamId) {
    const itemId = auction.itemId;
    const round = data.currentRound;

    // Deduct xu from winning team
    const teamXu = data.teams[winnerTeamId]?.xu || 0;
    updates[`teams/${winnerTeamId}/xu`] = Math.max(0, teamXu - finalPrice);

    // Add item to team inventory
    const itemData = data.rounds?.[round]?.items?.[itemId];
    if (itemData) {
      updates[`teams/${winnerTeamId}/inventory/${itemId}`] = {
        type: itemData.type,
        label: itemData.label,
        content: itemData.content,
        isFake: itemData.isFake,
        boughtAt: getServerTime(),
        price: finalPrice,
      };
    }

    // Mark item as sold
    updates[`rounds/${round}/items/${itemId}/soldTo`] = winnerTeamId;
    updates[`rounds/${round}/items/${itemId}/soldPrice`] = finalPrice;
  }

  await update(roomRef, updates);
};

export const cancelAuction = async (roomCode) => {
  await update(ref(database, `rooms/${roomCode}`), { auction: null });
};

// ========== DIRECT SELL ==========

export const sellItemDirect = async (roomCode, itemId, teamId, price) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snap = await get(roomRef);
  const data = snap.val();
  const round = data.currentRound;

  const teamXu = data.teams[teamId]?.xu || 0;
  if (price > teamXu) return { success: false, error: "Đội không đủ Xu" };

  const itemData = data.rounds?.[round]?.items?.[itemId];
  if (!itemData) return { success: false, error: "Món hàng không tồn tại" };

  const updates = {};
  updates[`teams/${teamId}/xu`] = teamXu - price;
  updates[`teams/${teamId}/inventory/${itemId}`] = {
    type: itemData.type,
    label: itemData.label,
    content: itemData.content,
    isFake: itemData.isFake,
    boughtAt: getServerTime(),
    price,
  };
  updates[`rounds/${round}/items/${itemId}/soldTo`] = teamId;
  updates[`rounds/${round}/items/${itemId}/soldPrice`] = price;

  await update(roomRef, updates);
  return { success: true };
};

// ========== HOST TOOLS ==========

export const adjustTeamXu = async (roomCode, teamId, amount) => {
  const teamRef = ref(database, `rooms/${roomCode}/teams/${teamId}`);
  const snap = await get(teamRef);
  if (!snap.exists()) return;
  const currentXu = snap.val().xu || 0;
  await update(teamRef, { xu: Math.max(0, currentXu + amount) });
};

export const sendBroadcast = async (roomCode, text, type = "info") => {
  const bcRef = push(ref(database, `rooms/${roomCode}/broadcasts`));
  await set(bcRef, { text, type, timestamp: getServerTime() });
};

export const sendHostHint = async (roomCode, teamId, text) => {
  const chatRef = push(ref(database, `rooms/${roomCode}/teams/${teamId}/chat`));
  await set(chatRef, {
    playerId: "HOST",
    playerName: "👑 Chủ Chợ",
    text,
    timestamp: getServerTime(),
    isHost: true,
  });
};

// ========== MISSION ==========

export const startMissionPhase = async (roomCode) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snap = await get(roomRef);
  const round = snap.val().currentRound;

  await update(roomRef, {
    [`rounds/${round}/phase`]: "mission",
    missionStartTime: getServerTime(),
  });
};

export const revealMissionHint = async (roomCode, index) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snap = await get(roomRef);
  if (!snap.exists()) return;
  const round = snap.val().currentRound;
  const currentVal = snap.val().rounds?.[round]?.revealedIndices?.[index];
  await update(roomRef, {
    [`rounds/${round}/revealedIndices/${index}`]: !currentVal ? true : null,
  });
};

// ========== MISSION HAND RAISE ==========

export const toggleMissionHand = async (roomCode, teamId, isRaising) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snap = await get(roomRef);
  if (!snap.exists()) return { success: false };
  const round = snap.val().currentRound;
  if (isRaising) {
    await update(roomRef, {
      [`rounds/${round}/missionHands/${teamId}`]: getServerTime(),
    });
  } else {
    await update(roomRef, {
      [`rounds/${round}/missionHands/${teamId}`]: null,
    });
  }
  return { success: true };
};

export const submitMissionAnswer = async (roomCode, teamId, answer) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snap = await get(roomRef);
  const data = snap.val();
  const round = data.currentRound;
  const mission = data.rounds?.[round]?.mission;

  if (!mission) return { success: false, score: 0 };

  const normalizedAnswer = answer.toString().trim().toLowerCase();
  const isCorrect = mission.acceptableAnswers?.some(
    a => normalizedAnswer.includes(a.toLowerCase())
  ) || normalizedAnswer === mission.correctAnswer.toLowerCase();

  let score = 0;
  if (isCorrect) {
    const answers = data.rounds?.[round]?.answers || {};
    let correctCount = 0;
    Object.values(answers).forEach(ans => {
      if (ans.isCorrect) correctCount++;
    });
    
    const baseScore = mission.bonusPoints || 500;
    const decrementStep = 100;
    score = Math.max(100, baseScore - (correctCount * decrementStep));
  }

  // Check for rare items bonus
  const inventory = data.teams?.[teamId]?.inventory || {};
  Object.values(inventory).forEach(item => {
    if (item.type === "rare" && !item.isFake) {
      score += 100;
    }
  });

  // Count fake items detected (items NOT in inventory that are fake = good)
  // Items in inventory that are fake = penalty awareness
  let fakeCount = 0;
  Object.values(inventory).forEach(item => {
    if (item.isFake) fakeCount++;
  });

  const updates = {};
  if (isCorrect) {
    updates[`teams/${teamId}/score`] = (data.teams[teamId]?.score || 0) + score;
    updates[`rounds/${round}/answers/${teamId}`] = {
      answer,
      isCorrect,
      score,
      fakeItemsBought: fakeCount,
      timestamp: getServerTime(),
    };
    await update(roomRef, updates);
  }
  return { success: true, isCorrect, score, fakeCount };
};

// ========== GAME FLOW ==========

export const finishMarketGame = async (roomCode) => {
  await update(ref(database, `rooms/${roomCode}`), { gameState: "finished" });
};

// ========== CHAT ==========

export const sendMarketChat = async (roomCode, teamId, playerId, playerName, text) => {
  const chatRef = push(ref(database, `rooms/${roomCode}/teams/${teamId}/chat`));
  await set(chatRef, { playerId, playerName, text, timestamp: getServerTime() });
};
