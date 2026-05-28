import { ref, update, get } from "firebase/database";
import { database } from "../firebase/config";

export const startGame = async (roomCode, questionsList) => {
  try {
    // Shuffle and pick 10 questions or how many are available
    const shuffled = [...questionsList].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 10);

    const roomRef = ref(database, `rooms/${roomCode}`);
    await update(roomRef, {
      gameState: "playing",
      questions: selectedQuestions,
      currentQuestionIndex: 0,
      questionStartTime: Date.now() + 3000, // 3 seconds delay before first question
    });
  } catch (error) {
    console.error("Error starting game:", error);
  }
};

export const submitAnswer = async (roomCode, playerId, scoreToAdd) => {
  try {
    const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
    const snapshot = await get(playerRef);
    if (snapshot.exists()) {
      const currentScore = snapshot.val().score || 0;
      await update(playerRef, {
        score: currentScore + scoreToAdd
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
      // End game
      await update(roomRef, {
        gameState: "finished"
      });
    } else {
      // Next question
      await update(roomRef, {
        currentQuestionIndex: currentIndex + 1,
        questionStartTime: Date.now() + 3000 // 3 seconds delay for players to read
      });
    }
  } catch (error) {
    console.error("Error going to next question:", error);
  }
};
