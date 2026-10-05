import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import "./Lesson.css";

const LESSONS = [
  {
    id: "1",
    title: "Understanding Your Voice",
    description:
      "Learn how your voice works and how to begin controlling it.",
  },
  {
    id: "2",
    title: "Breathing & Voice Control",
    description:
      "Learn breathing techniques and basic voice control.",
  },
  {
    id: "3",
    title: "Finding Your Pitch",
    description:
      "Learn how to identify and reproduce the correct pitch.",
  },
  {
    id: "4",
    title: "Singing Basic Notes",
    description:
      "Practice basic notes and improve your pitch accuracy.",
  },
  {
    id: "5",
    title: "Pitch Stability & Accuracy",
    description:
      "Improve pitch stability and maintain accurate notes.",
  },
  {
    id: "6",
    title: "Your First Complete Performance",
    description:
      "Put everything together and perform the complete lesson.",
  },
];

function Lesson() {
  const navigate = useNavigate();
  const { lessonId } = useParams();

  const lesson = LESSONS.find(
    (item) => item.id === lessonId
  );

  if (!lesson) {
    return (
      <div className="lesson-page">
        <div className="lesson-error">
          <h1>Lesson Not Found</h1>

          <p>
            The lesson you are trying to open does not
            exist.
          </p>

          <button
            onClick={() =>
              navigate("/music/learn")
            }
          >
            Back to Learn From Scratch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-page">

      {/* =========================
          TOP BAR
      ========================= */}
      <header className="lesson-header">

        <button
          className="lesson-back-button"
          onClick={() =>
            navigate("/music/learn")
          }
        >
          ← Back
        </button>

        <div className="lesson-header-title">
          <span>Music</span>
          <strong>Lesson {lesson.id}</strong>
        </div>

      </header>

      {/* =========================
          MAIN CONTENT
      ========================= */}
      <main className="lesson-container">

        <div className="lesson-number">
          LESSON {lesson.id}
        </div>

        <h1>{lesson.title}</h1>

        <p className="lesson-description">
          {lesson.description}
        </p>

        {/* =========================
            VIDEO
        ========================= */}
        <section className="lesson-card">

          <div className="lesson-section-title">
            <span>🎬</span>
            <h2>Lesson Video</h2>
          </div>

          <div className="lesson-video-placeholder">

            <div className="video-play-icon">
              ▶
            </div>

            <h3>Your lesson video will appear here</h3>

            <p>
              Watch the complete lesson before
              continuing.
            </p>

          </div>

        </section>

        {/* =========================
            THEORY
        ========================= */}
        <section className="lesson-card">

          <div className="lesson-section-title">
            <span>📖</span>
            <h2>What You'll Learn</h2>
          </div>

          <p>
            This lesson introduces the fundamentals
            you need before beginning practical
            singing exercises.
          </p>

          <div className="theory-box">

            <h3>Understanding Your Voice</h3>

            <p>
              Your voice is produced when air from
              your lungs passes through your vocal
              folds. Learning to control your
              breathing, pitch and stability is
              essential for singing.
            </p>

            <p>
              During this course, AI will compare
              your voice with the reference lesson
              and help you identify areas that need
              improvement.
            </p>

          </div>

        </section>

        {/* =========================
            QUESTIONS
        ========================= */}
        <section className="lesson-card">

          <div className="lesson-section-title">
            <span>🧠</span>
            <h2>Quick Check</h2>
          </div>

          <div className="question-box">

            <h3>
              What is one important factor in
              producing a controlled singing voice?
            </h3>

            <label>
              <input
                type="radio"
                name="question1"
              />
              Controlled breathing
            </label>

            <label>
              <input
                type="radio"
                name="question1"
              />
              Singing as loudly as possible
            </label>

            <label>
              <input
                type="radio"
                name="question1"
              />
              Holding your breath
            </label>

          </div>

        </section>

        {/* =========================
            PRACTICAL PERFORMANCE
        ========================= */}
        <section className="lesson-card">

          <div className="lesson-section-title">
            <span>🎤</span>
            <h2>Your Performance</h2>
          </div>

          <p>
            You must complete the full practical
            performance for this lesson.
          </p>

          <div className="record-options">

            <button className="record-button">
              🎙️ Record Live
            </button>

            <button className="upload-button">
              📁 Upload Voice
            </button>

          </div>

          <div className="performance-warning">
            ⚠️ You must perform the complete lesson
            before this lesson can be completed.
          </div>

        </section>

      </main>

    </div>
  );
}

export default Lesson;
