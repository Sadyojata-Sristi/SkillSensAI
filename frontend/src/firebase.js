import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCKN-lLpUPA1N5bzyCSf6KyRF_AkAk2-sc",
  authDomain: "skillsensai.firebaseapp.com",
  projectId: "skillsensai",
  storageBucket: "skillsensai.firebasestorage.app",
  messagingSenderId: "49752312536",
  appId: "1:49752312536:web:b53edae0f591af7cff65ad",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;
