import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Music from "./pages/Music";
import MartialArts from "./pages/MartialArts";
import Boxing from "./pages/Boxing";
import Karate from "./pages/Karate";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Music */}
        <Route path="/music" element={<Music />} />

        {/* Martial Arts */}
        <Route path="/martial-arts" element={<MartialArts />} />
        <Route path="/martial-arts/boxing" element={<Boxing />} />
        <Route path="/martial-arts/karate" element={<Karate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
