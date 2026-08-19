import { ref, set, get, update, child } from "firebase/database";
import { database } from "../firebase/config";

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createRoom = async (hostName, numQuestions = 3, timePerQuestion = 90, numTeams = 2, playersPerTeam = 4) => {
  try {
    const roomCode = generateRoomCode();
    const hostId = "host_" + Date.now();
    const teamNames = ["Đội Đỏ", "Đội Xanh", "Đội Vàng", "Đội Lục", "Đội Tím", "Đội Cam"];
    const teams = {};
    for (let i = 0; i < numTeams; i++) {
      teams[`team_${i}`] = {
        name: teamNames[i],
        score: 0,
        players: {}
      };
    }
    
    const roomRef = ref(database, `rooms/${roomCode}`);
    await set(roomRef, {
      gameState: "waiting", // waiting, playing, finished
      currentQuestionIndex: 0,
      createdAt: Date.now(),
      numQuestions,
      timePerQuestion,
      numTeams,
      playersPerTeam,
      hostId,
      teams,
      players: {
        [hostId]: {
          name: hostName,
          score: 0,
          isHost: true
        }
      }
    });
    
    return { roomCode, playerId: hostId, name: hostName };
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

export const joinRoom = async (roomCode, playerName) => {
  try {
    const code = roomCode.toUpperCase();
    const roomRef = ref(database, `rooms/${code}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      throw new Error("Room not found");
    }
    
    const roomData = snapshot.val();
    if (roomData.gameState !== "waiting") {
      throw new Error("Game has already started or finished");
    }

    const maxPlayers = (roomData.numTeams || 2) * (roomData.playersPerTeam || 4);
    const playersCount = Object.values(roomData.players || {}).filter(p => !p.isHost).length;
    if (playersCount >= maxPlayers) {
      throw new Error("Phòng đã đầy (Full)");
    }

    const playerId = "player_" + Date.now();
    const playerRef = child(roomRef, `players/${playerId}`);
    
    await set(playerRef, {
      name: playerName,
      score: 0,
      isHost: false
    });

    return { roomCode: code, playerId, name: playerName };
  } catch (error) {
    console.error("Error joining room:", error);
    throw error;
  }
};

export const joinTeam = async (roomCode, playerId, teamId) => {
  try {
    const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
    const snapshot = await get(playerRef);
    const updates = {};
    
    if (snapshot.exists()) {
      const playerData = snapshot.val();
      if (playerData.teamId && playerData.teamId !== teamId) {
        updates[`rooms/${roomCode}/teams/${playerData.teamId}/players/${playerId}`] = null;
      }
    }
    
    updates[`rooms/${roomCode}/players/${playerId}/teamId`] = teamId;
    updates[`rooms/${roomCode}/teams/${teamId}/players/${playerId}`] = true;
    
    await update(ref(database), updates);
  } catch (error) {
    console.error("Error joining team:", error);
    throw error;
  }
};
