// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBFrPxvWAaabazLG_hjK5GQjfNRsNz_K14",
  authDomain: "philosophy-game-47cda.firebaseapp.com",
  databaseURL: "https://philosophy-game-47cda-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "philosophy-game-47cda",
  storageBucket: "philosophy-game-47cda.firebasestorage.app",
  messagingSenderId: "13713280035",
  appId: "1:13713280035:web:a550c307d8b4c433437596",
  measurementId: "G-FMLWQZHKHC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const database = getDatabase(app);