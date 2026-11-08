import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Music from "./pages/Music";
import LearnFromScratch from "./pages/LearnFromScratch";
import Lesson from "./pages/Lesson";
import MusicSong from "./pages/MusicSong";
import MartialArts from "./pages/MartialArts";
import Boxing from "./pages/Boxing";
import Karate from "./pages/Karate";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import AppLayout from "./components/AppLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Keep the original home/orbit experience intact. */}
        <Route path="/" element={<Home />} />

        {/* Shared navigation for all learning/workspace pages. */}
        <Route element={<AppLayout />}>
          <Route path="/music" element={<Music />} />
          <Route path="/music/learn" element={<LearnFromScratch />} />
          <Route path="/music/learn/lesson/:lessonId" element={<Lesson />} />
          <Route path="/music/upload-song" element={<MusicSong />} />
          <Route path="/martial-arts" element={<MartialArts />} />
          <Route path="/martial-arts/boxing" element={<Boxing />} />
          <Route path="/martial-arts/karate" element={<Karate />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
