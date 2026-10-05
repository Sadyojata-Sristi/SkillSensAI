import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Music2,
  Mic2,
  Upload,
  Sparkles,
  ChevronRight,
  X,
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
MUSIC CHARACTER DATA
=========================================================
Each character has 7 stages:

0 = Before learning
1 = Lesson 1 completed
2 = Lesson 2 completed
...
6 = All lessons completed
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

  const [lessonsCompleted, setLessonsCompleted] =
    useState(0);

  const [selectedCharacter, setSelectedCharacter] =
    useState("singer");

  const [showCharacterSelector, setShowCharacterSelector] =
    useState(false);

  const [pageReady, setPageReady] =
    useState(false);


  /*
  ---------------------------------------------------------
  LOAD MUSIC PROGRESS
  ---------------------------------------------------------
  */

  useEffect(() => {
    const lessons =
      getLessonsLearned();

    const character =
      getSelectedMusicCharacter();

    setLessonsCompleted(
      Math.min(
        Math.max(lessons, 0),
        TOTAL_LESSONS
      )
    );

    setSelectedCharacter(
      character
    );

    const timer =
      setTimeout(() => {
        setPageReady(true);
      }, 100);

    return () =>
      clearTimeout(timer);
  }, []);


  /*
  ---------------------------------------------------------
  LISTEN FOR PROGRESS CHANGES
  ---------------------------------------------------------
  */

  useEffect(() => {
    const updateProgress = () => {
      setLessonsCompleted(
        getLessonsLearned()
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
  ---------------------------------------------------------
  CHARACTER
  ---------------------------------------------------------
  */

  const currentCharacter =
    MUSIC_CHARACTERS.find(
      (character) =>
        character.id === selectedCharacter
    ) || MUSIC_CHARACTERS[0];


  const currentStage =
    Math.min(
      Math.max(lessonsCompleted, 0),
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
  ---------------------------------------------------------
  SELECT CHARACTER
  ---------------------------------------------------------
  */

  const selectCharacter = (
    characterId
  ) => {

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


  return (
    <div
      className={`music-room ${
        pageReady
          ? "music-room-ready"
          : ""
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

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="music-room-content">


        {/* INTRO */}

        <section className="music-intro">

          <p className="music-eyebrow">
            YOUR MUSICAL JOURNEY
          </p>

          <h1>
            Become the musician
            <span> you imagine.</span>
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


          <div className="character-glow" />


          <div className="music-character-wrapper">

            {currentImage ? (

              <img
                src={currentImage}
                alt={
                  currentCharacter.name
                }
                className="music-character-image"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />

            ) : (

              <div className="character-placeholder">
                {currentCharacter.icon}
              </div>

            )}

          </div>


          <div className="character-particle particle-1">
            ♪
          </div>

          <div className="character-particle particle-2">
            ♫
          </div>

          <div className="character-particle particle-3">
            ✦
          </div>


          <h2 className="character-name">
            {currentCharacter.name}
          </h2>


          {/* =================================================
              PROGRESS
          ================================================= */}

          <div className="music-progress-container">

            <div className="music-progress-text">

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


            <span className="music-progress-percent">
              {progressPercentage}% complete
            </span>

          </div>


          {/* =================================================
              CUSTOMIZE BUTTON
          ================================================= */}

          <button
            className="customize-musician-button"
            onClick={() =>
              setShowCharacterSelector(true)
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


          <button
            className="music-option-card"
            onClick={() =>
              navigate(
                "/music/learn"
              )
            }
          >

            <div className="music-option-icon">
              <Music2 size={28} />
            </div>

            <div className="music-option-content">

              <h3>
                Learn From Scratch
              </h3>

              <p>
                Follow your learning path,
                complete lessons, quizzes and
                practical exercises.
              </p>

            </div>

            <ChevronRight />

          </button>


          <button
            className="music-option-card"
            onClick={() =>
              navigate(
                "/music/upload-song"
              )
            }
          >

            <div className="music-option-icon">
              <Upload size={28} />
            </div>

            <div className="music-option-content">

              <h3>
                Upload Song
              </h3>

              <p>
                Upload your recording and get
                AI-powered musical feedback.
              </p>

            </div>

            <ChevronRight />

          </button>


        </section>


        {/* =================================================
            LESSON INDICATORS
        ================================================= */}

        <section className="lesson-indicators">

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

              return (

                <div
                  key={lessonNumber}
                  className={`lesson-indicator ${
                    completed
                      ? "completed"
                      : ""
                  }`}
                >
                  {lessonNumber}
                </div>

              );

            }
          )}

        </section>


      </main>


      {/* =================================================
          CHARACTER SELECTOR
      ================================================= */}

      {showCharacterSelector && (

        <div
          className="character-selector-overlay"
          onClick={() =>
            setShowCharacterSelector(false)
          }
        >

          <div
            className="character-selector"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

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
                onClick={() =>
                  setShowCharacterSelector(false)
                }
              >
                <X size={22} />
              </button>

            </div>


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

          </div>

        </div>

      )}

    </div>
  );
}

export default Music;
