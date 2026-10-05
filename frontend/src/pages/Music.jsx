import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Music2,
  Upload,
  GraduationCap,
  Palette,
  Lock,
  Sparkles,
} from "lucide-react";

import "./Music.css";
import {
  getLessonsLearned,
  getSelectedMusicCharacter,
  setSelectedMusicCharacter,
} from "../utils/progress";

/*
=========================================================
SKILLSENSAI — MUSIC ROOM
=========================================================

6 Lesson Character Progression

0 lessons  -> character stage 0
1 lesson   -> character stage 1
2 lessons  -> character stage 2
3 lessons  -> character stage 3
4 lessons  -> character stage 4
5 lessons  -> character stage 5
6 lessons  -> final character stage
=========================================================
*/

const TOTAL_LESSONS = 6;

/*
---------------------------------------------------------
CHARACTER SETS

Later, replace these placeholder paths with the images
you upload.

Example:

/music/characters/singer/stage-0.png
/music/characters/singer/stage-1.png
...
---------------------------------------------------------
*/

const CHARACTER_OPTIONS = [
  {
    id: "singer",
    name: "Singer",
    description: "The Voice",
    images: [
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
    description: "The Strings",
    images: [
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
    description: "The Keys",
    images: [
      "/music/characters/pianist/stage-0.png",
      "/music/characters/pianist/stage-1.png",
      "/music/characters/pianist/stage-2.png",
      "/music/characters/pianist/stage-3.png",
      "/music/characters/pianist/stage-4.png",
      "/music/characters/pianist/stage-5.png",
      "/music/characters/pianist/stage-6.png",
    ],
  },
];

function Music() {
  const navigate = useNavigate();

  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState("singer");
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const [roomEntered, setRoomEntered] = useState(false);

  useEffect(() => {
    const completed = getLessonsLearned();

    const safeCompleted = Math.min(
      Math.max(Number(completed) || 0, 0),
      TOTAL_LESSONS
    );

    setLessonsCompleted(safeCompleted);

    const savedCharacter = getSelectedMusicCharacter();

    if (savedCharacter) {
      setSelectedCharacter(savedCharacter);
    }

    // Small entrance animation
    const timer = setTimeout(() => {
      setRoomEntered(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const currentCharacter =
    CHARACTER_OPTIONS.find(
      (character) => character.id === selectedCharacter
    ) || CHARACTER_OPTIONS[0];

  const currentStage = Math.min(
    lessonsCompleted,
    TOTAL_LESSONS
  );

  const currentImage = currentCharacter.images[currentStage];

  const progressPercentage =
    (lessonsCompleted / TOTAL_LESSONS) * 100;

  const handleCharacterChange = (characterId) => {
    setSelectedCharacter(characterId);
    setSelectedMusicCharacter(characterId);
    setShowCharacterSelector(false);
  };

  const handleLearnFromScratch = () => {
    navigate("/music/learn");
  };

  const handleUploadSong = () => {
    navigate("/music/upload-song");
  };

  return (
    <div
      className={`music-room ${
        roomEntered ? "music-room-entered" : ""
      }`}
    >
      {/* ================================================
          BACKGROUND
      ================================================= */}

      <div className="music-room-background">
        <div className="music-glow glow-one"></div>
        <div className="music-glow glow-two"></div>
        <div className="music-glow glow-three"></div>

        <div className="floating-note note-one">♪</div>
        <div className="floating-note note-two">♫</div>
        <div className="floating-note note-three">♬</div>
        <div className="floating-note note-four">♪</div>
      </div>

      {/* ================================================
          TOP BAR
      ================================================= */}

      <header className="music-room-header">
        <button
          className="music-back-button"
          onClick={() => navigate("/")}
          aria-label="Back to Home"
        >
          <ArrowLeft size={21} />
          <span>Home</span>
        </button>

        <div className="music-room-title">
          <Music2 size={22} />
          <span>MUSIC ROOM</span>
        </div>

        <div className="music-header-space"></div>
      </header>

      {/* ================================================
          MAIN ROOM
      ================================================= */}

      <main className="music-room-content">

        {/* ==============================================
            TITLE
        ============================================== */}

        <section className="music-intro">
          <div className="music-small-label">
            <Sparkles size={15} />
            YOUR MUSICAL JOURNEY
          </div>

          <h1>Welcome to Your Music Room</h1>

          <p>
            Learn, practice and bring your musician to life.
          </p>
        </section>

        {/* ==============================================
            CHARACTER AREA
        ============================================== */}

        <section className="music-character-section">

          <div className="character-stars">
            <span>✦</span>
            <span>✧</span>
            <span>✦</span>
            <span>✧</span>
            <span>✦</span>
          </div>

          <div
            className={`character-glow ${
              lessonsCompleted === TOTAL_LESSONS
                ? "character-complete"
                : ""
            }`}
          ></div>

          <div
            className={`music-character-wrapper ${
              lessonsCompleted === TOTAL_LESSONS
                ? "character-awakened"
                : ""
            }`}
          >
            <img
              src={currentImage}
              alt={`${currentCharacter.name} character`}
              className="music-character-image"
              onError={(event) => {
                /*
                Temporary fallback while your images
                have not been uploaded yet.
                */
                event.currentTarget.style.display = "none";
                event.currentTarget.parentElement.classList.add(
                  "character-placeholder-visible"
                );
              }}
            />

            <div className="character-placeholder">
              <Music2 size={65} strokeWidth={1.2} />

              <span>
                {currentCharacter.name}
              </span>

              <small>
                Character artwork coming soon
              </small>
            </div>
          </div>

          {/* Character floating particles */}

          <div className="character-particle particle-one">
            ♪
          </div>

          <div className="character-particle particle-two">
            ✦
          </div>

          <div className="character-particle particle-three">
            ♫
          </div>

          <div className="character-particle particle-four">
            ✧
          </div>

          {/* Character name */}

          <div className="character-name">
            <span>{currentCharacter.name}</span>

            <small>
              {lessonsCompleted === TOTAL_LESSONS
                ? "Musician Awakened"
                : currentCharacter.description}
            </small>
          </div>

          {/* ============================================
              PROGRESS
          ============================================ */}

          <div className="music-progress-container">

            <div className="music-progress-top">
              <span>
                Musical Journey
              </span>

              <strong>
                {lessonsCompleted}/{TOTAL_LESSONS}
              </strong>
            </div>

            <div className="music-progress-bar">
              <div
                className="music-progress-fill"
                style={{
                  width: `${progressPercentage}%`,
                }}
              ></div>
            </div>

            <div className="music-progress-label">
              {lessonsCompleted === 0
                ? "Your musician is waiting for you."
                : lessonsCompleted === TOTAL_LESSONS
                ? "Your musician has come to life!"
                : `${TOTAL_LESSONS - lessonsCompleted} lessons remaining`}
            </div>

          </div>

          {/* Customize */}

          <button
            className="customize-character-button"
            onClick={() =>
              setShowCharacterSelector(true)
            }
          >
            <Palette size={17} />
            Customize Musician
          </button>

        </section>

        {/* ==============================================
            MAIN OPTIONS
        ============================================== */}

        <section className="music-options">

          {/* LEARN FROM SCRATCH */}

          <button
            className="music-option-card learn-card"
            onClick={handleLearnFromScratch}
          >
            <div className="option-icon">
              <GraduationCap size={29} />
            </div>

            <div className="option-content">
              <span className="option-label">
                START YOUR JOURNEY
              </span>

              <h2>Learn From Scratch</h2>

              <p>
                Learn music step by step through lessons,
                quizzes and practical challenges.
              </p>

              <div className="option-action">
                {lessonsCompleted > 0
                  ? "Continue Learning"
                  : "Start Learning"}
                <span>→</span>
              </div>
            </div>
          </button>

          {/* UPLOAD SONG */}

          <button
            className="music-option-card upload-card"
            onClick={handleUploadSong}
          >
            <div className="option-icon">
              <Upload size={27} />
            </div>

            <div className="option-content">
              <span className="option-label">
                PRACTICE YOUR MUSIC
              </span>

              <h2>Upload Song</h2>

              <p>
                Upload a song or recording and practice
                with AI-powered musical feedback.
              </p>

              <div className="option-action">
                Upload & Practice
                <span>→</span>
              </div>
            </div>
          </button>

        </section>

        {/* ==============================================
            LESSON INDICATORS
        ============================================== */}

        <section className="lesson-indicators">

          <span className="lesson-heading">
            YOUR 6-LESSON JOURNEY
          </span>

          <div className="lesson-dots">

            {Array.from(
              { length: TOTAL_LESSONS },
              (_, index) => {
                const lessonNumber = index + 1;
                const completed =
                  lessonNumber <= lessonsCompleted;

                const current =
                  lessonNumber === lessonsCompleted + 1;

                return (
                  <div
                    key={lessonNumber}
                    className={`lesson-dot-wrapper ${
                      completed
                        ? "completed"
                        : current
                        ? "current"
                        : "locked"
                    }`}
                  >
                    <div className="lesson-dot">
                      {completed ? "✓" : lessonNumber}
                    </div>

                    {index <
                      TOTAL_LESSONS - 1 && (
                      <div className="lesson-connector"></div>
                    )}
                  </div>
                );
              }
            )}

          </div>

        </section>

      </main>

      {/* ================================================
          CHARACTER SELECTOR MODAL
      ================================================= */}

      {showCharacterSelector && (
        <div
          className="character-selector-overlay"
          onClick={() =>
            setShowCharacterSelector(false)
          }
        >
          <div
            className="character-selector-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="selector-close"
              onClick={() =>
                setShowCharacterSelector(false)
              }
            >
              ×
            </button>

            <div className="selector-header">
              <Palette size={22} />

              <h2>Choose Your Musician</h2>

              <p>
                Your chosen appearance will continue
                evolving as you learn.
              </p>
            </div>

            <div className="character-options">

              {CHARACTER_OPTIONS.map(
                (character) => {
                  const selected =
                    selectedCharacter ===
                    character.id;

                  return (
                    <button
                      key={character.id}
                      className={`character-option ${
                        selected
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleCharacterChange(
                          character.id
                        )
                      }
                    >

                      <div className="character-option-image">

                        <img
                          src={
                            character.images[0]
                          }
                          alt={
                            character.name
                          }
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";

                            event.currentTarget.parentElement.classList.add(
                              "option-placeholder-visible"
                            );
                          }}
                        />

                        <div className="option-placeholder">
                          <Music2 size={35} />
                        </div>

                      </div>

                      <strong>
                        {character.name}
                      </strong>

                      <span>
                        {character.description}
                      </span>

                      {selected && (
                        <div className="selected-mark">
                          ✓
                        </div>
                      )}

                    </button>
                  );
                }
              )}

            </div>

            <div className="selector-note">
              <Lock size={14} />
              More musician appearances will be added
              later.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Music;
