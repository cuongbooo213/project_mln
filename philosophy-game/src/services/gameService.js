import { ref, update, get } from "firebase/database";
import { database } from "../firebase/config";
import { getServerTime } from "../firebase/timeSync";

export const startGame = async (roomCode, questionsList) => {
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    const roomData = snapshot.exists() ? snapshot.val() : {};
    const numQuestions = roomData.numQuestions || 10;

    // Shuffle and pick numQuestions or how many are available
    const shuffled = [...questionsList].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, numQuestions);

    await update(roomRef, {
      gameState: "playing",
      questions: selectedQuestions,
      currentQuestionIndex: 0,
      questionStartTime: getServerTime() + 3000, // 3 seconds delay before first question
    });
  } catch (error) {
    console.error("Error starting game:", error);
  }
};

export const submitAnswer = async (roomCode, playerId, scoreToAdd, questionIndex) => {
  try {
    const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
    const snapshot = await get(playerRef);
    if (snapshot.exists()) {
      const currentScore = snapshot.val().score || 0;
      await update(playerRef, {
        score: currentScore + scoreToAdd
      });
    }
    
    if (questionIndex !== undefined) {
      const answeredRef = ref(database, `rooms/${roomCode}/questionAnswers/${questionIndex}`);
      await update(answeredRef, {
        [playerId]: true
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
        questionStartTime: getServerTime() + 3000 // 3 seconds delay for players to read
      });
    }
  } catch (error) {
    console.error("Error going to next question:", error);
  }
};
