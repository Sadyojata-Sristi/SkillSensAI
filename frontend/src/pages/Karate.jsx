import {
  ArrowLeft,
  Shield,
  Play,
  Upload,
  Video,
  CheckCircle2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useState } from "react";

import "./Karate.css";

function Karate() {
  const navigate = useNavigate();

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const lessons = [
    {
      id: 1,
      title: "Basic Karate Stance",
      description:
        "Learn the correct stance, balance and body position.",
      video: "/lessons/karate/basic-stance.mp4",
    },
    {
      id: 2,
      title: "Straight Punch",
      description:
        "Learn the basic karate straight punch with proper technique.",
      video: "/lessons/karate/straight-punch.mp4",
    },
    {
      id: 3,
      title: "Front Kick",
      description:
        "Learn the basic front kick and correct leg movement.",
      video: "/lessons/karate/front-kick.mp4",
    },
    {
      id: 4,
      title: "Basic Block",
      description:
        "Learn a fundamental karate blocking technique.",
      video: "/lessons/karate/basic-block.mp4",
    },
  ];

  const handleVideoUpload = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      setVideoFile(file);
    }
  };

  const startRecording = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setIsRecording(true);

      alert(
        "Camera access granted. Live recording will be connected to AI analysis next."
      );
    } catch (error) {
      alert(
        "Camera access was not granted. Please allow camera and microphone access."
      );
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  return (
    <div className="karate-page">
      <button
        className="karate-back-button"
        onClick={() => navigate("/martial-arts")}
      >
        <ArrowLeft size={20} />
        Back to Martial Arts
      </button>

      <section className="karate-header">
        <div className="karate-header-icon">
          <Shield size={42} />
        </div>

        <span className="karate-label">
          SKILLSENSAI MARTIAL ARTS
        </span>

        <h1>
          Learn <span>Karate</span>
        </h1>

        <p>
          Learn fundamental karate techniques through guided
          lessons and practise them with AI-powered feedback.
        </p>
      </section>

      <section className="karate-lessons">
        <div className="karate-section-title">
          <h2>Karate Lessons</h2>
          <p>
            Follow the lessons step by step and practise each
            technique.
          </p>
        </div>

        <div className="karate-lesson-grid">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              className={`karate-lesson-card ${
                selectedLesson?.id === lesson.id
                  ? "selected"
                  : ""
              }`}
              onClick={() => setSelectedLesson(lesson)}
            >
              <div className="karate-lesson-number">
                {lesson.id}
              </div>

              <div className="karate-lesson-content">
                <h3>{lesson.title}</h3>

                <p>{lesson.description}</p>
              </div>

              <Play size={20} />
            </button>
          ))}
        </div>
      </section>

      {selectedLesson && (
        <section className="karate-video-section">
          <div className="karate-section-title">
            <h2>{selectedLesson.title}</h2>
            <p>{selectedLesson.description}</p>
          </div>

          <div className="karate-video-container">
            <video
              className="karate-lesson-video"
              controls
              src={selectedLesson.video}
            >
              Your browser does not support video playback.
            </video>
          </div>
        </section>
      )}

      <section className="karate-practice">
        <div className="karate-section-title">
          <h2>Practice Your Technique</h2>

          <p>
            Record yourself or upload a video of your practice.
          </p>
        </div>

        <div className="karate-practice-grid">
          <div className="karate-practice-card">
            <div className="karate-practice-icon">
              <Video size={30} />
            </div>

            <h3>Record Live</h3>

            <p>
              Use your camera to record your karate technique.
            </p>

            {!isRecording ? (
              <button
                className="karate-action-button"
                onClick={startRecording}
              >
                Start Recording
              </button>
            ) : (
              <button
                className="karate-action-button recording"
                onClick={stopRecording}
              >
                Stop Recording
              </button>
            )}
          </div>

          <div className="karate-practice-card">
            <div className="karate-practice-icon">
              <Upload size={30} />
            </div>

            <h3>Upload Video</h3>

            <p>
              Upload a video of your karate practice for
              analysis.
            </p>

            <label
              htmlFor="karate-video-upload"
              className="karate-action-button"
            >
              Choose Video
            </label>

            <input
              id="karate-video-upload"
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              hidden
            />

            {videoFile && (
              <div className="karate-upload-success">
                <CheckCircle2 size={18} />

                <span>{videoFile.name}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="karate-ai-section">
        <Shield size={28} />

        <div>
          <h3>AI-Powered Technique Analysis</h3>

          <p>
            Your practice video will be analysed to identify
            movement patterns, technique issues and areas for
            improvement.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Karate;
