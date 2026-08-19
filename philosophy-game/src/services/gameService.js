import { ref, update, get, push, set } from "firebase/database";
import { database } from "../firebase/config";
import { getServerTime } from "../firebase/timeSync";

export const startGame = async (roomCode, casesList) => {
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    const roomData = snapshot.exists() ? snapshot.val() : {};
    const numQuestions = roomData.numQuestions || 3;

    // Shuffle and pick cases
    const shuffled = [...casesList].sort(() => 0.5 - Math.random());
    const selectedCases = shuffled.slice(0, numQuestions);

    // Get all players (excluding host)
    const players = roomData.players || {};
    const hostId = roomData.hostId;
    const playerIds = Object.keys(players).filter(id => id !== hostId);
    
    const numTeams = roomData.numTeams || 2;
    const teams = roomData.teams || {};
    
    const updates = {};
    
    const teamCounts = {};
    for (let i = 0; i < numTeams; i++) {
      teamCounts[`team_${i}`] = Object.keys(teams[`team_${i}`]?.players || {}).length;
    }

    // Auto-assign players without team
    playerIds.forEach(pid => {
      const p = players[pid];
      if (!p.teamId) {
        const minTeamId = Object.keys(teamCounts).reduce((a, b) => teamCounts[a] < teamCounts[b] ? a : b);
        updates[`players/${pid}/teamId`] = minTeamId;
        updates[`teams/${minTeamId}/players/${pid}`] = true;
        teamCounts[minTeamId]++;
      }
    });

    updates["gameState"] = "playing";
    updates["questions"] = selectedCases;
    updates["currentQuestionIndex"] = 0;
    updates["questionStartTime"] = getServerTime() + 5000;
    // We don't overwrite updates["teams"] here to preserve the players list in teams
    // Xóa đáp án cũ nếu có
    updates["questionAnswers"] = null;

    await update(roomRef, updates);
  } catch (error) {
    console.error("Error starting game:", error);
  }
};

export const submitTeamAnswer = async (roomCode, teamId, scoreToAdd, caseIndex) => {
  try {
    const teamRef = ref(database, `rooms/${roomCode}/teams/${teamId}`);
    const snapshot = await get(teamRef);
    if (snapshot.exists()) {
      const currentScore = snapshot.val().score || 0;
      await update(teamRef, {
        score: currentScore + scoreToAdd
      });
    }
    
    if (caseIndex !== undefined) {
      const answeredRef = ref(database, `rooms/${roomCode}/questionAnswers/${caseIndex}`);
      await update(answeredRef, {
        [teamId]: true
      });
    }
  } catch (error) {
    console.error("Error submitting answer:", error);
  }
};

export const nextQuestion = async (roomCode, currentIndex, totalQuestions) => {
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    if (currentIndex + 1 >= totalQuestions) {
      await update(roomRef, {
        gameState: "finished"
      });
    } else {
      await update(roomRef, {
        currentQuestionIndex: currentIndex + 1,
        questionStartTime: getServerTime() + 5000
      });
    }
  } catch (error) {
    console.error("Error going to next question:", error);
  }
};

export const sendTeamMessage = async (roomCode, teamId, playerId, playerName, text) => {
  try {
    const chatRef = ref(database, `rooms/${roomCode}/teams/${teamId}/chat`);
    const newMessageRef = push(chatRef);
    await set(newMessageRef, {
      playerId,
      playerName,
      text,
      timestamp: getServerTime()
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
};
