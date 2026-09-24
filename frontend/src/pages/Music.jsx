import {
  ArrowLeft,
  Music2,
  BookOpen,
  Upload,
  Sparkles,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "./Music.css";

function Music() {
  const navigate = useNavigate();

  return (
    <div className="music-page">

      {/* BACK */}

      <button
        className="music-back-button"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={20} />
        Back to Home
      </button>

      {/* HEADER */}

      <section className="music-header">

        <div className="music-header-icon">
          <Music2 size={42} />
        </div>

        <span className="music-label">
          SKILLSENSAI MUSIC
        </span>

        <h1>
          Learn <span>Music</span>
        </h1>

        <p>
          Learn music from the basics or
          practise your favourite songs with
          AI-powered feedback.
        </p>

      </section>

      {/* OPTIONS */}

      <section className="music-main-options">

        {/* LEARN FROM SCRATCH */}

        <button
          className="music-option-card music-basics-option"
          onClick={() =>
            navigate("/music/learn")
          }
        >

          <div className="music-option-icon">
            <BookOpen size={38} />
          </div>

          <div className="music-option-content">

            <span className="music-option-label">
              BEGINNER PATH
            </span>

            <h2>
              Learn From Scratch
            </h2>

            <p>
              Start from the fundamentals of
              music. Learn pitch, rhythm and
              voice control through guided
              lessons and practice.
            </p>

            <div className="music-option-features">

              <span>
                ✓ Step-by-step lessons
              </span>

              <span>
                ✓ Practice recordings
              </span>

              <span>
                ✓ AI feedback
              </span>

            </div>

            <div className="music-option-arrow">
              Start Learning →
            </div>

          </div>

        </button>

        {/* UPLOAD SONG */}

        <button
          className="music-option-card music-song-option"
          onClick={() =>
            navigate("/music/song")
          }
        >

          <div className="music-option-icon">
            <Upload size={38} />
          </div>

          <div className="music-option-content">

            <span className="music-option-label">
              AI SONG PRACTICE
            </span>

            <h2>
              Upload a Song
            </h2>

            <p>
              Upload a song, analyse its pitch
              and practise singing along with
              AI-assisted performance feedback.
            </p>

            <div className="music-option-features">

              <span>
                ✓ Upload your song
              </span>

              <span>
                ✓ Pitch analysis
              </span>

              <span>
                ✓ Voice practice
              </span>

            </div>

            <div className="music-option-arrow">
              Upload a Song →
            </div>

          </div>

        </button>

      </section>

      {/* AI INFORMATION */}

      <section className="music-ai-info">

        <div className="ai-info-icon">
          <Sparkles size={25} />
        </div>

        <div>

          <h3>
            AI Music Coach
          </h3>

          <p>
            SkillSensAI combines guided learning
            with AI-assisted analysis to help
            learners practise music at their own
            pace.
          </p>

        </div>

      </section>

    </div>
  );
}

export default Music;
