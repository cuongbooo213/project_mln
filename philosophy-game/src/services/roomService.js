import { ref, set, get, update, child } from "firebase/database";
import { database } from "../firebase/config";

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createRoom = async (hostName, numQuestions = 10, timePerQuestion = 15) => {
  try {
    const roomCode = generateRoomCode();
    const hostId = "host_" + Date.now();
    
    const roomRef = ref(database, `rooms/${roomCode}`);
    await set(roomRef, {
      gameState: "waiting", // waiting, playing, finished
      currentQuestionIndex: 0,
      createdAt: Date.now(),
      numQuestions,
      timePerQuestion,
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
