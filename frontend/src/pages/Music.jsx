import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Music2,
  Upload,
  Sparkles,
  ChevronRight,
  X,
  Lightbulb,
} from "lucide-react";

import "./Music.css";

import {
  getLessonsLearned,
  getSelectedMusicCharacter,
  setSelectedMusicCharacter,
} from "../utils/progress";


const TOTAL_LESSONS = 6;


/*
=========================================================
SKILLSENSAI — MUSIC CHARACTERS
=========================================================

Each character has 7 stages:

Stage 0 = Before learning
Stage 1 = Lesson 1 completed
Stage 2 = Lesson 2 completed
Stage 3 = Lesson 3 completed
Stage 4 = Lesson 4 completed
Stage 5 = Lesson 5 completed
Stage 6 = All lessons completed
=========================================================
*/

const MUSIC_CHARACTERS = [
  {
    id: "singer",
    name: "Singer",
    icon: "🎤",
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

  {
    id: "guitarist",
    name: "Guitarist",
    icon: "🎸",
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

  {
    id: "pianist",
    name: "Pianist",
    icon: "🎹",
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

  {
    id: "flutist",
    name: "Flute",
    icon: "🪈",
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

  {
    id: "violinist",
    name: "Violin",
    icon: "🎻",
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

  {
    id: "veena",
    name: "Veena",
    icon: "🎶",
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

  {
    id: "drummer",
    name: "Drummer",
    icon: "🥁",
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
];


function Music() {
  const navigate = useNavigate();

  const [lessonsCompleted, setLessonsCompleted] = useState(0);

  const [selectedCharacter, setSelectedCharacter] =
    useState("singer");

  const [showCharacterSelector, setShowCharacterSelector] =
    useState(false);

  const [pageReady, setPageReady] = useState(false);

  /*
  =========================================================
  THEME
  OFF  = LIGHT
  ON   = DARK
  =========================================================
  */

  const [darkMode, setDarkMode] = useState(() => {
    return (
      localStorage.getItem("skillsensai_theme") ===
      "dark"
    );
  });


  /*
  =========================================================
  CHARACTER IMAGE ERROR STATE
  =========================================================
  */

  const [imageFailed, setImageFailed] = useState(false);


  /*
  =========================================================
  LOAD MUSIC DATA
  =========================================================
  */

  useEffect(() => {
    const lessons = getLessonsLearned();

    const character =
      getSelectedMusicCharacter();

    setLessonsCompleted(
      Math.min(
        Math.max(Number(lessons) || 0, 0),
        TOTAL_LESSONS
      )
    );

    const validCharacter =
      MUSIC_CHARACTERS.some(
        (item) => item.id === character
      )
        ? character
        : "singer";

    setSelectedCharacter(validCharacter);

    const savedTheme =
      localStorage.getItem(
        "skillsensai_theme"
      );

    setDarkMode(
      savedTheme === "dark"
    );

    const timer = setTimeout(() => {
      setPageReady(true);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);


  /*
  =========================================================
  RESET IMAGE ERROR WHEN CHARACTER/STAGE CHANGES
  =========================================================
  */

  useEffect(() => {
    setImageFailed(false);
  }, [
    selectedCharacter,
    lessonsCompleted,
  ]);


  /*
  =========================================================
  LISTEN FOR PROGRESS CHANGES
  =========================================================
  */

  useEffect(() => {
    const updateProgress = () => {
      const lessons =
        getLessonsLearned();

      setLessonsCompleted(
        Math.min(
          Math.max(Number(lessons) || 0, 0),
          TOTAL_LESSONS
        )
      );
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


  /*
  =========================================================
  THEME TOGGLE
  =========================================================
  */

  const toggleTheme = () => {
    const nextTheme =
      !darkMode;

    setDarkMode(nextTheme);

    localStorage.setItem(
      "skillsensai_theme",
      nextTheme
        ? "dark"
        : "light"
    );

    window.dispatchEvent(
      new Event(
        "skillsensai-theme-updated"
      )
    );
  };


  /*
  =========================================================
  CURRENT CHARACTER
  =========================================================
  */

  const currentCharacter =
    MUSIC_CHARACTERS.find(
      (character) =>
        character.id ===
        selectedCharacter
    ) ||
    MUSIC_CHARACTERS[0];


  const currentStage =
    Math.min(
      Math.max(
        lessonsCompleted,
        0
      ),
      TOTAL_LESSONS
    );


  const currentImage =
    currentCharacter.stages[
      currentStage
    ];


  const progressPercentage =
    Math.round(
      (lessonsCompleted /
        TOTAL_LESSONS) *
        100
    );


  /*
  =========================================================
  SELECT CHARACTER
  =========================================================
  */

  const selectCharacter = (
    characterId
  ) => {
    setImageFailed(false);

    setSelectedCharacter(
      characterId
    );

    setSelectedMusicCharacter(
      characterId
    );

    setShowCharacterSelector(
      false
    );
  };


  /*
  =========================================================
  RENDER
  =========================================================
  */

  return (
    <div
      className={`music-room ${
        pageReady
          ? "music-room-entered"
          : ""
      } ${
        darkMode
          ? "music-dark-mode"
          : "music-light-mode"
      }`}
    >

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="music-room-background">
        <div className="music-glow" />
      </div>


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="music-room-header">

        <button
          className="music-back-button"
          onClick={() =>
            navigate("/")
          }
        >
          ← Home
        </button>


        <div className="music-room-title">

          <Music2 size={25} />

          <span>
            Music Room
          </span>

        </div>


        {/* =================================================
            LIGHT BULB
        ================================================= */}

        <button
          className={`music-theme-toggle ${
            darkMode
              ? "dark"
              : "light"
          }`}
          onClick={toggleTheme}
          aria-label={
            darkMode
              ? "Switch to light theme"
              : "Switch to dark theme"
          }
          title={
            darkMode
              ? "Light Theme"
              : "Dark Theme"
          }
        >
          <Lightbulb size={21} />

          <span
            className="music-theme-switch"
          >
            <span />
          </span>
        </button>

      </header>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="music-room-content">


        {/* =================================================
            INTRO
        ================================================= */}

        <section className="music-intro">

          <p className="music-small-label">
            YOUR MUSICAL JOURNEY
          </p>

          <h1>
            Become the musician
            <span>
              {" "}you imagine.
            </span>
          </h1>

          <p>
            Learn step by step, practice your
            skills and watch your musician come
            to life.
          </p>

        </section>


        {/* =================================================
            CHARACTER
        ================================================= */}

        <section className="music-character-section">

          <div className="character-stars">
            <span>✦</span>
            <span>✦</span>
            <span>✦</span>
          </div>


          <div className="character-glow" />


          <div
            className="music-character-wrapper"
            key={`${selectedCharacter}-${currentStage}`}
          >

            {!imageFailed ? (

              <img
                key={`${currentCharacter.id}-${currentStage}`}
                src={currentImage}
                alt={currentCharacter.name}
                className="music-character-image"
                onError={() => {
                  setImageFailed(true);
                }}
              />

            ) : (

              <div className="character-placeholder">
                {currentCharacter.icon}
              </div>

            )}

          </div>


          {/* MUSIC PARTICLES */}

          <div className="character-particle particle-one">
            ♪
          </div>

          <div className="character-particle particle-two">
            ♫
          </div>

          <div className="character-particle particle-three">
            ✦
          </div>

          <div className="character-particle particle-four">
            ♪
          </div>


          {/* CHARACTER NAME */}

          <div className="character-name">

            <span>
              {currentCharacter.name}
            </span>

            <small>
              Stage {currentStage} /{" "}
              {TOTAL_LESSONS}
            </small>

          </div>


          {/* =================================================
              PROGRESS
          ================================================= */}

          <div className="music-progress-container">

            <div className="music-progress-top">

              <span>
                Musical Journey
              </span>

              <strong>
                {lessonsCompleted} /{" "}
                {TOTAL_LESSONS}
              </strong>

            </div>


            <div className="music-progress-bar">

              <div
                className="music-progress-fill"
                style={{
                  width:
                    `${progressPercentage}%`,
                }}
              />

            </div>


            <span className="music-progress-label">
              {progressPercentage}% complete
            </span>

          </div>


          {/* =================================================
              CUSTOMIZE MUSICIAN
          ================================================= */}

          <button
            className="customize-musician-button"
            onClick={() =>
              setShowCharacterSelector(
                true
              )
            }
          >

            <Sparkles size={20} />

            <span>
              Customize Your Musician
            </span>

            <ChevronRight size={19} />

          </button>

        </section>


        {/* =================================================
            MAIN OPTIONS
        ================================================= */}

        <section className="music-options">


          {/* LEARN FROM SCRATCH */}

          <button
            className="music-option-card learn-card"
            onClick={() =>
              navigate(
                "/music/learn"
              )
            }
          >

            <div className="option-icon">
              <Music2 size={28} />
            </div>

            <div className="option-content">

              <span className="option-label">
                LEARN
              </span>

              <h3>
                Learn From Scratch
              </h3>

              <p>
                Follow your learning path,
                complete lessons, quizzes and
                practical exercises.
              </p>

              <span className="option-action">
                Start Learning
                <ChevronRight size={18} />
              </span>

            </div>

          </button>


          {/* UPLOAD SONG */}

          <button
            className="music-option-card upload-card"
            onClick={() =>
              navigate(
                "/music/upload-song"
              )
            }
          >

            <div className="option-icon">
              <Upload size={28} />
            </div>

            <div className="option-content">

              <span className="option-label">
                AI PRACTICE
              </span>

              <h3>
                Upload Song
              </h3>

              <p>
                Upload your recording and get
                AI-powered musical feedback.
              </p>

              <span className="option-action">
                Analyse Recording
                <ChevronRight size={18} />
              </span>

            </div>

          </button>

        </section>


        {/* =================================================
            LESSON INDICATORS
        ================================================= */}

        <section className="lesson-indicators">

          <div className="lesson-heading">

            <span>
              Your Learning Progress
            </span>

            <strong>
              {lessonsCompleted}/
              {TOTAL_LESSONS}
            </strong>

          </div>


          <div className="lesson-dots">

            {Array.from(
              {
                length:
                  TOTAL_LESSONS,
              },
              (_, index) => {

                const lessonNumber =
                  index + 1;

                const completed =
                  lessonNumber <=
                  lessonsCompleted;

                const current =
                  lessonNumber ===
                  lessonsCompleted + 1;


                return (
                  <React.Fragment
                    key={lessonNumber}
                  >

                    <div
                      className={`lesson-dot-wrapper ${
                        completed
                          ? "completed"
                          : ""
                      } ${
                        current
                          ? "current"
                          : ""
                      }`}
                    >

                      <div className="lesson-dot">

                        {completed
                          ? "✓"
                          : lessonNumber}

                      </div>

                    </div>


                    {index <
                      TOTAL_LESSONS - 1 && (

                      <div className="lesson-connector" />

                    )}

                  </React.Fragment>
                );
              }
            )}

          </div>

        </section>

      </main>


      {/* =================================================
          CHARACTER SELECTOR
      ================================================= */}

      {showCharacterSelector && (

        <div
          className="character-selector-overlay"
          onClick={() =>
            setShowCharacterSelector(
              false
            )
          }
        >

          <div
            className="character-selector"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="character-selector-header">

              <div>

                <span>
                  CUSTOMIZE
                </span>

                <h2>
                  Choose Your Musician
                </h2>

                <p>
                  Pick the musician you want
                  to become.
                </p>

              </div>


              <button
                className="selector-close"
                onClick={() =>
                  setShowCharacterSelector(
                    false
                  )
                }
              >
                <X size={22} />
              </button>

            </div>


            {/* CHARACTER OPTIONS */}

            <div className="character-options-grid">

              {MUSIC_CHARACTERS.map(
                (character) => (

                  <button
                    key={character.id}
                    className={`character-option ${
                      selectedCharacter ===
                      character.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      selectCharacter(
                        character.id
                      )
                    }
                  >

                    <div className="character-option-icon">
                      {character.icon}
                    </div>

                    <span>
                      {character.name}
                    </span>

                    {selectedCharacter ===
                      character.id && (

                      <small>
                        Selected
                      </small>

                    )}

                  </button>

                )
              )}

            </div>


            {/* SELECTOR NOTE */}

            <div className="selector-note">
              Your musician will grow as you
              complete your learning journey.
            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Music;
