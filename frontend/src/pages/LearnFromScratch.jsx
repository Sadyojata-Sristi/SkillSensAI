import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Check,
  Lock,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import "./LearnFromScratch.css";

import {
  getLessonsLearned,
  getSelectedMusicCharacter,
} from "../utils/progress";

/* =========================================================
   CONSTANTS
   ========================================================= */

const TOTAL_LESSONS = 6;

const LESSONS = [
  {
    id: 1,
    title: "Understanding Your Voice",
    description:
      "Learn the basics of your voice, sound and pitch.",
    icon: "🎤",
  },
  {
    id: 2,
    title: "Breathing & Voice Control",
    description:
      "Learn how breathing helps you control your sound.",
    icon: "🌬️",
  },
  {
    id: 3,
    title: "Finding Your Pitch",
    description:
      "Learn how to recognize and match different pitches.",
    icon: "🎵",
  },
  {
    id: 4,
    title: "Singing Basic Notes",
    description:
      "Practice producing clear and accurate notes.",
    icon: "🎶",
  },
  {
    id: 5,
    title: "Pitch Stability & Accuracy",
    description:
      "Learn to hold your pitch steadily and accurately.",
    icon: "🎯",
  },
  {
    id: 6,
    title: "Your First Complete Performance",
    description:
      "Put everything together and perform the complete lesson.",
    icon: "⭐",
  },
];

/* =========================================================
   MUSIC CHARACTERS
   ========================================================= */

const MUSIC_CHARACTERS = {
  singer: {
    name: "Singer",
    stages: [
      "/music/characters/singer/stage-0.png",
      "/music/characters/singer/stage-1.png",
      "/music/characters/singer/stage-2.png",
      "/music/characters/singer/stage-3.png",
      "/music/characters/singer/stage-4.png",
      "/music/characters/singer/stage-5.png",
      "/music/characters/singer/stage-6.png",
    ],
  },

  guitarist: {
    name: "Guitarist",
    stages: [
      "/music/characters/guitarist/stage-0.png",
      "/music/characters/guitarist/stage-1.png",
      "/music/characters/guitarist/stage-2.png",
      "/music/characters/guitarist/stage-3.png",
      "/music/characters/guitarist/stage-4.png",
      "/music/characters/guitarist/stage-5.png",
      "/music/characters/guitarist/stage-6.png",
    ],
  },

  pianist: {
    name: "Pianist",
    stages: [
      "/music/characters/pianist/stage-0.png",
      "/music/characters/pianist/stage-1.png",
      "/music/characters/pianist/stage-2.png",
      "/music/characters/pianist/stage-3.png",
      "/music/characters/pianist/stage-4.png",
      "/music/characters/pianist/stage-5.png",
      "/music/characters/pianist/stage-6.png",
    ],
  },

  flutist: {
    name: "Flute Player",
    stages: [
      "/music/characters/flutist/stage-0.png",
      "/music/characters/flutist/stage-1.png",
      "/music/characters/flutist/stage-2.png",
      "/music/characters/flutist/stage-3.png",
      "/music/characters/flutist/stage-4.png",
      "/music/characters/flutist/stage-5.png",
      "/music/characters/flutist/stage-6.png",
    ],
  },

  violinist: {
    name: "Violinist",
    stages: [
      "/music/characters/violinist/stage-0.png",
      "/music/characters/violinist/stage-1.png",
      "/music/characters/violinist/stage-2.png",
      "/music/characters/violinist/stage-3.png",
      "/music/characters/violinist/stage-4.png",
      "/music/characters/violinist/stage-5.png",
      "/music/characters/violinist/stage-6.png",
    ],
  },

  veena: {
    name: "Veena Player",
    stages: [
      "/music/characters/veena/stage-0.png",
      "/music/characters/veena/stage-1.png",
      "/music/characters/veena/stage-2.png",
      "/music/characters/veena/stage-3.png",
      "/music/characters/veena/stage-4.png",
      "/music/characters/veena/stage-5.png",
      "/music/characters/veena/stage-6.png",
    ],
  },

  drummer: {
    name: "Drummer",
    stages: [
      "/music/characters/drummer/stage-0.png",
      "/music/characters/drummer/stage-1.png",
      "/music/characters/drummer/stage-2.png",
      "/music/characters/drummer/stage-3.png",
      "/music/characters/drummer/stage-4.png",
      "/music/characters/drummer/stage-5.png",
      "/music/characters/drummer/stage-6.png",
    ],
  },
};

/* =========================================================
   COMPONENT
   ========================================================= */

function LearnFromScratch() {
  const navigate = useNavigate();

  const [lessonsLearned, setLessonsLearned] =
    useState(getLessonsLearned());

  const [characterId, setCharacterId] = useState(
    getSelectedMusicCharacter()
  );

  const [theme, setTheme] = useState(
    localStorage.getItem("skillsensai_theme") || "light"
  );

  const [imageFailed, setImageFailed] =
    useState(false);

  /* =======================================================
     THEME
     ======================================================= */

  useEffect(() => {
    const updateTheme = () => {
      setTheme(
        localStorage.getItem("skillsensai_theme") ||
          "light"
      );
    };

    updateTheme();

    window.addEventListener(
      "skillsensai-theme-changed",
      updateTheme
    );

    window.addEventListener(
      "storage",
      updateTheme
    );

    return () => {
      window.removeEventListener(
        "skillsensai-theme-changed",
        updateTheme
      );

      window.removeEventListener(
        "storage",
        updateTheme
      );
    };
  }, []);

  /* =======================================================
     PROGRESS
     ======================================================= */

  useEffect(() => {
    const updateProgress = () => {
      setLessonsLearned(getLessonsLearned());
      setCharacterId(getSelectedMusicCharacter());
    };

    window.addEventListener(
      "skillsensai-progress-updated",
      updateProgress
    );

    return () => {
      window.removeEventListener(
        "skillsensai-progress-updated",
        updateProgress
      );
    };
  }, []);

  /* =======================================================
     CHARACTER
     ======================================================= */

  useEffect(() => {
    setImageFailed(false);
  }, [characterId, lessonsLearned]);

  const character =
    MUSIC_CHARACTERS[characterId] ||
    MUSIC_CHARACTERS.singer;

  const stage = Math.min(
    Math.max(lessonsLearned, 0),
    TOTAL_LESSONS
  );

  const progressPercentage =
    (lessonsLearned / TOTAL_LESSONS) * 100;

  /* =======================================================
     LESSON CLICK
     ======================================================= */

  const handleLessonClick = (lesson) => {
    const isCompleted =
      lesson.id <= lessonsLearned;

    const isCurrent =
      lesson.id === lessonsLearned + 1;

    if (isCompleted || isCurrent) {
      navigate(
        "/music/learn/lesson/" + lesson.id
      );
    }
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div
      className={`learn-page ${
        theme === "dark" ? "dark" : "light"
      }`}
    >
      <header className="learn-header">
        <button
          className="learn-back-button"
          onClick={() => navigate("/music")}
          aria-label="Back to Music Room"
        >
          <ArrowLeft size={20} />
          <span>Music Room</span>
        </button>

        <div className="learn-header-title">
          <strong>Learn From Scratch</strong>
          <span>
            Your personal music learning journey
          </span>
        </div>
      </header>

      <main className="learn-content">
        <section className="learn-intro">
          <div className="learn-eyebrow">
            <Sparkles size={14} />
            MUSIC JOURNEY
          </div>

          <h1>
            Become a Musician
          </h1>

          <p>
            Learn step by step, practice what you learn,
            and bring your musician to life as you progress.
          </p>
        </section>

        <section className="learn-character-section">
          <div className="learn-character-glow" />

          <div className="learn-character-wrapper">
            {!imageFailed ? (
              <img
                className="learn-character-image"
                src={character.stages[stage]}
                alt={`${character.name} learning stage`}
                onError={() =>
                  setImageFailed(true)
                }
              />
            ) : (
              <div className="learn-character-placeholder">
                Character image unavailable
              </div>
            )}
          </div>

          <div className="learn-character-name">
            {character.name}
          </div>

          <div className="learn-character-stage">
            Stage {stage} of {TOTAL_LESSONS}
          </div>
        </section>

        <section className="learn-progress-card">
          <div className="learn-progress-top">
            <span>
              Your Progress
            </span>

            <span>
              {lessonsLearned}/{TOTAL_LESSONS} Lessons
            </span>
          </div>

          <div className="learn-progress-track">
            <div
              className="learn-progress-fill"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        </section>

        <section className="journey-section">
          <div className="journey-heading">
            <h2>Your Learning Journey</h2>

            <p>
              Complete each lesson to unlock the next step.
            </p>
          </div>

          <div className="journey-path">
            {LESSONS.map((lesson) => {
              const completed =
                lesson.id <= lessonsLearned;

              const current =
                lesson.id === lessonsLearned + 1;

              const locked =
                lesson.id > lessonsLearned + 1;

              return (
                <div
                  key={lesson.id}
                  className="journey-node-wrapper"
                >
                  <div
                    className={`journey-node ${
                      completed
                        ? "completed"
                        : current
                        ? "current"
                        : "locked"
                    }`}
                  >
                    {completed ? (
                      <Check
                        size={25}
                        strokeWidth={3}
                      />
                    ) : locked ? (
                      <Lock size={20} />
                    ) : (
                      <span>
                        {lesson.id}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lesson-list">
            {LESSONS.map((lesson) => {
              const completed =
                lesson.id <= lessonsLearned;

              const current =
                lesson.id === lessonsLearned + 1;

              const locked =
                lesson.id > lessonsLearned + 1;

              return (
                <div
                  key={lesson.id}
                  className={`lesson-card ${
                    completed
                      ? "completed"
                      : current
                      ? "current clickable"
                      : "locked"
                  }`}
                  onClick={() =>
                    handleLessonClick(lesson)
                  }
                >
                  <div className="lesson-card-icon">
                    {lesson.icon}
                  </div>

                  <div className="lesson-card-content">
                    <h3>
                      Lesson {lesson.id}:{" "}
                      {lesson.title}
                    </h3>

                    <p>
                      {lesson.description}
                    </p>
                  </div>

                  <div className="lesson-action">
                    {completed ? (
                      <Check
                        size={20}
                        strokeWidth={3}
                      />
                    ) : locked ? (
                      <Lock size={18} />
                    ) : (
                      <ChevronRight size={21} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {lessonsLearned >= TOTAL_LESSONS && (
            <div className="journey-complete-card">
              <div className="complete-icon">
                <Sparkles size={28} />
              </div>

              <h3>
                Your Musician Has Come to Life!
              </h3>

              <p>
                You completed the complete
                Learn From Scratch journey.
                Keep practicing and continue
                developing your musical skills.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default LearnFromScratch;
