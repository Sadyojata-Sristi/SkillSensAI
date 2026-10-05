import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Home from "./pages/Home";
import Music from "./pages/Music";
import LearnFromScratch from "./pages/LearnFromScratch";
import Lesson from "./pages/Lesson";
import MartialArts from "./pages/MartialArts";
import Boxing from "./pages/Boxing";
import Karate from "./pages/Karate";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            HOME
        ========================= */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* =========================
            MUSIC ROOM
        ========================= */}
        <Route
          path="/music"
          element={<Music />}
        />

        {/* =========================
            MUSIC — LEARN FROM SCRATCH
        ========================= */}
        <Route
          path="/music/learn"
          element={<LearnFromScratch />}
        />

        {/* =========================
            INDIVIDUAL MUSIC LESSON
        ========================= */}
        <Route
          path="/music/learn/lesson/:lessonId"
          element={<Lesson />}
        />

        {/* =========================
            MARTIAL ARTS
        ========================= */}
        <Route
          path="/martial-arts"
          element={<MartialArts />}
        />

        {/* =========================
            BOXING
        ========================= */}
        <Route
          path="/martial-arts/boxing"
          element={<Boxing />}
        />

        {/* =========================
            KARATE
        ========================= */}
        <Route
          path="/martial-arts/karate"
          element={<Karate />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
