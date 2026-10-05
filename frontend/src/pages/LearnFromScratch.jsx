import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Lock,
  Play,
  ChevronRight,
  Music2,
  Sparkles,
} from "lucide-react";

import "./LearnFromScratch.css";

import {
  getLessonsLearned,
  getSelectedMusicCharacter,
} from "../utils/progress";

/*
=========================================================
SKILLSENSAI — LEARN FROM SCRATCH
=========================================================
*/

const TOTAL_LESSONS = 6;

/*
---------------------------------------------------------
UNIVERSAL MUSIC CURRICULUM

The curriculum is the SAME for every musician.
The selected character is only visual.
---------------------------------------------------------
*/

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

/*
---------------------------------------------------------
MUSICIAN APPEARANCE
---------------------------------------------------------
*/

const MUSIC_CHARACTERS = {
  singer: {
    name: "Singer",
    image: (stage) =>
      `/music/characters/singer/stage-${stage}.png`,
  },

  guitarist: {
    name: "Guitarist",
    image: (stage) =>
      `/music/characters/guitarist/stage-${stage}.png`,
  },

  pianist: {
    name: "Pianist",
    image: (stage) =>
      `/music/characters/pianist/stage-${stage}.png`,
  },

  flutist: {
    name: "Flute Player",
    image: (stage) =>
      `/music/characters/flutist/stage-${stage}.png`,
  },

  violinist: {
    name: "Violinist",
    image: (stage) =>
      `/music/characters/violinist/stage-${stage}.png`,
  },

  veena: {
    name: "Veena Player",
    image: (stage) =>
      `/music/characters/veena/stage-${stage}.png`,
  },

  drummer: {
    name: "Drummer",
    image: (stage) =>
      `/music/characters/drummer/stage-${stage}.png`,
  },
};

function LearnFromScratch() {
  const navigate = useNavigate();

  const [lessonsCompleted, setLessonsCompleted] =
    useState(() => getLessonsLearned());

  const [selectedCharacter, setSelectedCharacter] =
    useState(() => getSelectedMusicCharacter());

  const [imageFailed, setImageFailed] =
    useState(false);

  /*
  -------------------------------------------------------
  LISTEN FOR PROGRESS CHANGES
  -------------------------------------------------------
  */

  useEffect(() => {
    const updateProgress = () => {
      setLessonsCompleted(getLessonsLearned());
      setSelectedCharacter(
        getSelectedMusicCharacter()
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
  -------------------------------------------------------
  CURRENT CHARACTER
  -------------------------------------------------------
  */

  const currentCharacter =
    MUSIC_CHARACTERS[selectedCharacter] ||
    MUSIC_CHARACTERS.singer;

  /*
  -------------------------------------------------------
  CHARACTER STAGE

  0 = before learning
  1 = lesson 1 complete
  ...
  6 = all lessons complete
  -------------------------------------------------------
  */

  const currentStage = Math.min(
    Math.max(lessonsCompleted, 0),
    TOTAL_LESSONS
  );

  /*
  -------------------------------------------------------
  RESET IMAGE FALLBACK WHEN CHARACTER/STAGE CHANGES
  -------------------------------------------------------
  */

  useEffect(() => {
    setImageFailed(false);
  }, [selectedCharacter, currentStage]);

  /*
  -------------------------------------------------------
  PROGRESS PERCENTAGE
  -------------------------------------------------------
  */

  const progressPercentage =
    (lessonsCompleted / TOTAL_LESSONS) * 100;

  /*
  -------------------------------------------------------
  LESSON CLICK
  -------------------------------------------------------
  */

  const openLesson = (lesson) => {
    const isUnlocked =
      lesson.id <= lessonsCompleted + 1;

    if (!isUnlocked) {
      return;
    }

    /*
      For now this opens the lesson route.
      We will build the actual lesson screen next.
    */

    navigate(
      `/music/learn/lesson/${lesson.id}`
    );
  };

  return (
    <div className="learn-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="learn-header">

        <button
          className="learn-back-button"
          onClick={() => navigate("/music")}
        >
          <ArrowLeft size={20} />
          <span>Music Room</span>
        </button>

        <div className="learn-header-title">
          <Music2 size={22} />
          <span>Learn From Scratch</span>
        </div>

        <div className="learn-header-spacer" />

      </header>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="learn-content">

        {/* =================================================
            INTRO
        ================================================= */}

        <section className="learn-intro">

          <div className="learn-eyebrow">
            <Sparkles size={15} />
            YOUR MUSIC JOURNEY
          </div>

          <h1>
            Learn From Scratch
          </h1>

          <p>
            Learn step by step, practice what you learn,
            and become a better musician.
          </p>

        </section>


        {/* =================================================
            CHARACTER
        ================================================= */}

        <section className="learn-character-section">

          <div className="learn-character-glow" />

          <div
            className={`learn-character-wrapper ${
              lessonsCompleted === TOTAL_LESSONS
                ? "learn-character-complete"
                : ""
            }`}
          >

            {!imageFailed ? (
              <img
                key={`${selectedCharacter}-${currentStage}`}
                src={currentCharacter.image(
                  currentStage
                )}
                alt={currentCharacter.name}
                className="learn-character-image"
                onError={() =>
                  setImageFailed(true)
                }
              />
            ) : (
              <div className="learn-character-placeholder">
                <Music2 size={54} />
              </div>
            )}

          </div>

          <div className="learn-character-name">
            {currentCharacter.name}
          </div>

          <div className="learn-character-stage">
            Stage {currentStage} / {TOTAL_LESSONS}
          </div>

        </section>


        {/* =================================================
            PROGRESS
        ================================================= */}

        <section className="learn-progress-card">

          <div className="learn-progress-top">

            <div>
              <span className="learn-progress-label">
                Your Progress
              </span>

              <strong>
                {lessonsCompleted} / {TOTAL_LESSONS}
              </strong>
            </div>

            <span className="learn-progress-percent">
              {Math.round(progressPercentage)}%
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

          <p>
            {lessonsCompleted === 0 &&
              "Your journey begins here."}

            {lessonsCompleted > 0 &&
              lessonsCompleted < TOTAL_LESSONS &&
              `${TOTAL_LESSONS - lessonsCompleted} lessons remaining.`}

            {lessonsCompleted === TOTAL_LESSONS &&
              "You've completed the entire journey! 🎉"}
          </p>

        </section>


        {/* =================================================
            JOURNEY
        ================================================= */}

        <section className="journey-section">

          <div className="journey-heading">

            <div>
              <span className="journey-small-label">
                YOUR PATH
              </span>

              <h2>
                Your Learning Journey
              </h2>
            </div>

            <span className="journey-count">
              {lessonsCompleted}/{TOTAL_LESSONS}
            </span>

          </div>


          {/* =================================================
              JOURNEY PATH
          ================================================= */}

          <div className="journey-path">

            {LESSONS.map((lesson, index) => {

              const isCompleted =
                lesson.id <= lessonsCompleted;

              const isCurrent =
                lesson.id ===
                lessonsCompleted + 1;

              const isLocked =
                lesson.id >
                lessonsCompleted + 1;

              return (
                <React.Fragment
                  key={lesson.id}
                >

                  {/* Connector */}

                  {index > 0 && (
                    <div
                      className={`journey-connector ${
                        LESSONS[index - 1].id <=
                        lessonsCompleted
                          ? "journey-connector-completed"
                          : ""
                      }`}
                    />
                  )}


                  {/* Lesson Node */}

                  <button
                    className={`journey-node-wrapper ${
                      isCompleted
                        ? "completed"
                        : ""
                    } ${
                      isCurrent
                        ? "current"
                        : ""
                    } ${
                      isLocked
                        ? "locked"
                        : ""
                    }`}
                    onClick={() =>
                      openLesson(lesson)
                    }
                    disabled={isLocked}
                  >

                    <div className="journey-node">

                      {isCompleted ? (
                        <Check size={27} />
                      ) : isLocked ? (
                        <Lock size={23} />
                      ) : (
                        <span>
                          {lesson.icon}
                        </span>
                      )}

                    </div>

                    <div className="journey-node-number">
                      Lesson {lesson.id}
                    </div>

                  </button>

                </React.Fragment>
              );
            })}

          </div>


          {/* =================================================
              LESSON CARDS
          ================================================= */}

          <div className="lesson-list">

            {LESSONS.map((lesson) => {

              const isCompleted =
                lesson.id <= lessonsCompleted;

              const isCurrent =
                lesson.id ===
                lessonsCompleted + 1;

              const isLocked =
                lesson.id >
                lessonsCompleted + 1;

              return (
                <div
                  key={lesson.id}
                  className={`lesson-card ${
                    isCompleted
                      ? "lesson-completed"
                      : ""
                  } ${
                    isCurrent
                      ? "lesson-current"
                      : ""
                  } ${
                    isLocked
                      ? "lesson-locked"
                      : ""
                  }`}
                >

                  <div className="lesson-card-icon">

                    {isCompleted ? (
                      <Check size={25} />
                    ) : isLocked ? (
                      <Lock size={22} />
                    ) : (
                      <span>
                        {lesson.icon}
                      </span>
                    )}

                  </div>


                  <div className="lesson-card-content">

                    <span className="lesson-number">
                      LESSON {lesson.id}
                    </span>

                    <h3>
                      {lesson.title}
                    </h3>

                    <p>
                      {isLocked
                        ? `Complete Lesson ${
                            lesson.id - 1
                          } to unlock this lesson.`
                        : lesson.description}
                    </p>

                  </div>


                  <button
                    className="lesson-action"
                    disabled={isLocked}
                    onClick={() =>
                      openLesson(lesson)
                    }
                  >

                    {isCompleted
                      ? "Review"
                      : isCurrent
                      ? "Start"
                      : "Locked"}

                    {!isLocked && (
                      <ChevronRight size={18} />
                    )}

                  </button>

                </div>
              );
            })}

          </div>

        </section>


        {/* =================================================
            COMPLETION MESSAGE
        ================================================= */}

        {lessonsCompleted === TOTAL_LESSONS && (
          <section className="journey-complete-card">

            <div className="journey-complete-icon">
              ✨
            </div>

            <h2>
              Your Musician Has Come to Life!
            </h2>

            <p>
              You completed all 6 lessons.
              Your musician has reached the final stage.
            </p>

            <button
              onClick={() => navigate("/music")}
            >
              Return to Music Room
              <ChevronRight size={19} />
            </button>

          </section>
        )}

      </main>

    </div>
  );
}

export default LearnFromScratch;
