/* =========================================================
   SKILLSENSAI — FIREBASE CONFIGURATION
   ========================================================= */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


/* =========================================================
   FIREBASE PROJECT CONFIG
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyCKN-lLpUPA1N5bzyCSf6KyRF_AkAk2-sc",
  authDomain: "skillsensai.firebaseapp.com",
  projectId: "skillsensai",
  storageBucket: "skillsensai.firebasestorage.app",
  messagingSenderId: "49752312536",
  appId: "1:49752312536:web:b53edae0f591af7cff65ad",
};


/* =========================================================
   INITIALIZE FIREBASE
   ========================================================= */

const app = initializeApp(firebaseConfig);


/* =========================================================
   FIREBASE AUTHENTICATION
   ========================================================= */

export const auth = getAuth(app);


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default app;
