import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Mic,
  Music2,
  Play,
  Upload,
  Square,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./Music.css";

import {
  completeLesson,
  isLessonCompleted,
  getCompletedLessons,
} from "../utils/progress";

const MUSIC_LESSONS = [
  {
    id: "music-lesson-1",
    title: "Understanding Pitch",
    description:
      "Learn what pitch is and how to identify high and low notes.",
    video: "/lessons/music/music-lesson-1.mp4",
  },
  {
    id: "music-lesson-2",
    title: "Basic Voice Control",
    description:
      "Learn the fundamentals of controlling your voice while singing.",
    video: "/lessons/music/music-lesson-2.mp4",
  },
  {
    id: "music-lesson-3",
    title: "Breathing for Singing",
    description:
      "Learn simple breathing techniques to improve your singing.",
    video: "/lessons/music/music-lesson-3.mp4",
  },
  {
    id: "music-lesson-4",
    title: "Basic Rhythm",
    description:
      "Understand rhythm, timing and how to stay on beat.",
    video: "/lessons/music/music-lesson-4.mp4",
  },
  {
    id: "music-lesson-5",
    title: "Putting It Together",
    description:
      "Combine pitch, breathing, voice control and rhythm.",
    video: "/lessons/music/music-lesson-5.mp4",
  },
];

function Music() {
  const navigate = useNavigate();

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);

  const [showLearnFromScratch, setShowLearnFromScratch] =
    useState(false);

  const [showLearnSong, setShowLearnSong] = useState(false);

  const [songFile, setSongFile] = useState(null);
  const [recordingFile, setRecordingFile] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState("");

  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);

  /* -----------------------------------------
     LOAD PROGRESS
  ----------------------------------------- */

  useEffect(() => {
    const updateProgress = () => {
      setCompletedLessons(getCompletedLessons());
    };

    updateProgress();

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

  /* -----------------------------------------
     LESSON COMPLETION
  ----------------------------------------- */

  const handleCompleteLesson = (lessonId) => {
    const completed = completeLesson(lessonId);

    setCompletedLessons(getCompletedLessons());

    if (completed) {
      setMessage("Lesson completed! Your progress has been saved.");
    } else {
      setMessage("You have already completed this lesson.");
    }
  };

  const lessonCompleted = (lessonId) => {
    return isLessonCompleted(lessonId);
  };

  /* -----------------------------------------
     FILE UPLOAD
  ----------------------------------------- */

  const handleSongUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSongFile(file);
    setMessage(`Song selected: ${file.name}`);
  };

  const handleRecordingUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setRecordingFile(file);
    setMessage(`Recording selected: ${file.name}`);
  };

  /* -----------------------------------------
     RECORD AUDIO
  ----------------------------------------- */

  const startRecording = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const recorder = new MediaRecorder(stream);

      recordingChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(
          recordingChunksRef.current,
          {
            type: "audio/webm",
          }
        );

        const file = new File(
          [audioBlob],
          "skillsensai-recording.webm",
          {
            type: "audio/webm",
          }
        );

        setRecordingFile(file);

        stream.getTracks().forEach((track) => {
          track.stop();
        });

        setMessage("Live recording completed.");
      };

      mediaRecorderRef.current = recorder;

      recorder.start();

      setIsRecording(true);
      setMessage("Recording started. Sing now!");
    } catch (error) {
      console.error(error);

      setMessage(
        "Microphone access was denied or unavailable."
      );
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  /* -----------------------------------------
     AI ANALYSIS
  ----------------------------------------- */

  const analyzeSong = () => {
    if (!songFile) {
      setMessage("Please upload a song first.");
      return;
    }

    setMessage(
      "AI song analysis will process your pitch and rhythm."
    );
  };

  const analyzeRecording = () => {
    if (!recordingFile) {
      setMessage(
        "Please record or upload your singing first."
      );
      return;
    }

    setMessage(
      "AI voice analysis will provide pitch and singing feedback."
    );
  };

  /* -----------------------------------------
     PROGRESS
  ----------------------------------------- */

  const completedCount = completedLessons.filter((id) =>
    MUSIC_LESSONS.some((lesson) => lesson.id === id)
  ).length;

  const progressPercentage = Math.round(
    (completedCount / MUSIC_LESSONS.length) * 100
  );

  /* -----------------------------------------
     RENDER
  ----------------------------------------- */

  return (
    <div className="music-page">

      {/* HEADER */}
      <header className="music-header">

        <div className="music-brand">
          <span className="music-brand-skill">
            Skill
          </span>
          <span className="music-brand-sensai">
            SensAI
          </span>
        </div>

        <button
          className="music-back-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={18} />
          Back Home
        </button>

      </header>

      {/* HERO */}
      <section className="music-hero">

        <div className="music-hero-icon">
          <Music2 size={42} />
        </div>

        <div>
          <p className="music-eyebrow">
            AI-POWERED MUSIC LEARNING
          </p>

          <h1>
            Learn <span>Music</span> Your Way
          </h1>

          <p className="music-hero-description">
            Learn from scratch, practice your voice,
            analyze songs and improve step by step with
            SkillSensAI.
          </p>
        </div>

      </section>

      {/* MAIN */}
      <main className="music-main">

        {/* PROGRESS CARD */}
        <section className="music-progress-card">

          <div className="music-progress-top">

            <div>
              <p className="music-progress-label">
                YOUR MUSIC PROGRESS
              </p>

              <h2>
                {completedCount} / {MUSIC_LESSONS.length}
                {" "}Lessons Completed
              </h2>
            </div>

            <div className="music-progress-percentage">
              {progressPercentage}%
            </div>

          </div>

          <div className="music-progress-bar">
            <div
              className="music-progress-fill"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>

        </section>

        {/* LEARNING MODES */}
        <section className="music-mode-section">

          <div className="music-section-heading">
            <p>START LEARNING</p>
            <h2>Choose Your Learning Path</h2>
          </div>

          <div className="music-mode-grid">

            {/* LEARN FROM SCRATCH */}
            <button
              className={`music-mode-card ${
                showLearnFromScratch
                  ? "music-mode-card-active"
                  : ""
              }`}
              onClick={() => {
                setShowLearnFromScratch(
                  !showLearnFromScratch
                );
                setShowLearnSong(false);
                setSelectedLesson(null);
                setMessage("");
              }}
            >

              <div className="music-mode-icon blue">
                <BookOpen size={30} />
              </div>

              <div className="music-mode-content">
                <h3>Learn From Scratch</h3>

                <p>
                  Start from the basics and build your
                  music skills step by step.
                </p>

                <span>
                  {completedCount}/
                  {MUSIC_LESSONS.length} completed
                </span>
              </div>

            </button>

            {/* LEARN A SONG */}
            <button
              className={`music-mode-card ${
                showLearnSong
                  ? "music-mode-card-active red"
                  : ""
              }`}
              onClick={() => {
                setShowLearnSong(!showLearnSong);
                setShowLearnFromScratch(false);
                setSelectedLesson(null);
                setMessage("");
              }}
            >

              <div className="music-mode-icon red">
                <Sparkles size={30} />
              </div>

              <div className="music-mode-content">
                <h3>Learn a Song</h3>

                <p>
                  Upload a song and practice singing
                  along with AI-powered feedback.
                </p>

                <span>
                  Practice • Record • Improve
                </span>
              </div>

            </button>

          </div>

        </section>

        {/* LEARN FROM SCRATCH */}
        {showLearnFromScratch && (
          <section className="music-lessons-section">

            <div className="music-section-heading">
              <p>STEP BY STEP</p>
              <h2>Music Lessons</h2>
            </div>

            <div className="music-lessons-list">

              {MUSIC_LESSONS.map((lesson, index) => {

                const completed =
                  lessonCompleted(lesson.id);

                return (
                  <div
                    className={`music-lesson-card ${
                      completed
                        ? "music-lesson-completed"
                        : ""
                    }`}
                    key={lesson.id}
                  >

                    <div className="music-lesson-number">
                      {completed ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        index + 1
                      )}
                    </div>

                    <div className="music-lesson-details">

                      <h3>{lesson.title}</h3>

                      <p>
                        {lesson.description}
                      </p>

                      {completed && (
                        <span className="music-completed-text">
                          Completed
                        </span>
                      )}

                    </div>

                    <button
                      className="music-lesson-open"
                      onClick={() =>
                        setSelectedLesson(lesson)
                      }
                    >
                      <Play size={16} />
                      Open
                    </button>

                  </div>
                );
              })}

            </div>

          </section>
        )}

        {/* SELECTED LESSON */}
        {selectedLesson && (
          <section className="music-video-section">

            <div className="music-video-header">

              <div>
                <p>NOW LEARNING</p>

                <h2>
                  {selectedLesson.title}
                </h2>
              </div>

              <button
                className="music-close-video"
                onClick={() =>
                  setSelectedLesson(null)
                }
              >
                Close
              </button>

            </div>

            <p className="music-video-description">
              {selectedLesson.description}
            </p>

            <video
              className="music-video-player"
              controls
              src={selectedLesson.video}
            />

            <div className="music-video-actions">

              <button
                className="music-complete-button"
                onClick={() =>
                  handleCompleteLesson(
                    selectedLesson.id
                  )
                }
                disabled={lessonCompleted(
                  selectedLesson.id
                )}
              >
                <CheckCircle2 size={18} />

                {lessonCompleted(
                  selectedLesson.id
                )
                  ? "Lesson Completed"
                  : "Mark Lesson Complete"}
              </button>

            </div>

          </section>
        )}

        {/* LEARN A SONG */}
        {showLearnSong && (
          <section className="music-song-section">

            <div className="music-section-heading">
              <p>SONG PRACTICE</p>
              <h2>Practice With Your Voice</h2>
            </div>

            <div className="music-song-grid">

              {/* SONG */}
              <div className="music-song-card">

                <div className="music-card-icon">
                  <Music2 size={26} />
                </div>

                <h3>Choose a Song</h3>

                <p>
                  Upload the song you want to practice.
                </p>

                <label className="music-upload-button">

                  <Upload size={18} />

                  Upload Song

                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleSongUpload}
                  />

                </label>

                {songFile && (
                  <div className="music-file-name">
                    {songFile.name}
                  </div>
                )}

                <button
                  className="music-analyze-button"
                  onClick={analyzeSong}
                >
                  <Sparkles size={18} />
                  Analyze Song
                </button>

              </div>

              {/* VOICE */}
              <div className="music-song-card">

                <div className="music-card-icon red">
                  <Mic size={26} />
                </div>

                <h3>Your Singing</h3>

                <p>
                  Record your voice live or upload
                  an existing recording.
                </p>

                <div className="music-record-actions">

                  {!isRecording ? (
                    <button
                      className="music-record-button"
                      onClick={startRecording}
                    >
                      <Mic size={18} />
                      Record Live
                    </button>
                  ) : (
                    <button
                      className="music-stop-button"
                      onClick={stopRecording}
                    >
                      <Square size={17} />
                      Stop Recording
                    </button>
                  )}

                  <label className="music-upload-button secondary">

                    <Upload size={18} />

                    Upload Recording

                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleRecordingUpload}
                    />

                  </label>

                </div>

                {recordingFile && (
                  <div className="music-file-name">
                    {recordingFile.name}
                  </div>
                )}

                <button
                  className="music-analyze-button red"
                  onClick={analyzeRecording}
                >
                  <Sparkles size={18} />
                  Analyze My Voice
                </button>

              </div>

            </div>

          </section>
        )}

        {/* MESSAGE */}
        {message && (
          <div className="music-message">
            {message}
          </div>
        )}

      </main>
    </div>
  );
}

export default Music;
