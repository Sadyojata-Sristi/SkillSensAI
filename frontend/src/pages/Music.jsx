import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Brain,
  Check,
  ChevronRight,
  CircleHelp,
  FileAudio,
  Lock,
  Mic,
  Music2,
  Play,
  RotateCcw,
  Sparkles,
  Upload,
  Volume2,
  X,
} from "lucide-react";

import "./music.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const lessons = [
  {
    id: 1,
    title: "Understanding Pitch",
    description:
      "Learn what pitch means and how your voice moves between high and low notes.",
    duration: "5 min",
    icon: "🎵",
    color: "purple",
    video: "/lessons/music/pitch-basics.mp4",
    question: "What happens when the frequency of a sound increases?",
    options: [
      "The pitch becomes higher",
      "The pitch becomes lower",
      "The sound disappears",
      "Nothing changes",
    ],
    answer: 0,
  },
  {
    id: 2,
    title: "Voice Control",
    description:
      "Learn simple breathing and voice-control techniques for singing.",
    duration: "7 min",
    icon: "🎤",
    color: "blue",
    video: "/lessons/music/voice-control.mp4",
    question:
      "Which helps you maintain better control while singing?",
    options: [
      "Holding your breath",
      "Controlled breathing",
      "Speaking as loudly as possible",
      "Avoiding warm-ups",
    ],
    answer: 1,
  },
  {
    id: 3,
    title: "Musical Notes",
    description:
      "Understand the basic notes and how they are arranged.",
    duration: "6 min",
    icon: "🎼",
    color: "pink",
    video: "",
    question: "Which of these is a musical note?",
    options: ["C", "X", "Z", "Q"],
    answer: 0,
  },
  {
    id: 4,
    title: "Rhythm Basics",
    description:
      "Discover beats, timing and the foundation of musical rhythm.",
    duration: "8 min",
    icon: "🥁",
    color: "orange",
    video: "/lessons/music/rhythm-basics.mp4",
    question: "What does rhythm mainly describe?",
    options: [
      "The timing of sounds",
      "The color of an instrument",
      "The size of a speaker",
      "The volume of a microphone",
    ],
    answer: 0,
  },
  {
    id: 5,
    title: "Pitch Matching",
    description:
      "Practice matching your voice to a reference note.",
    duration: "8 min",
    icon: "🎯",
    color: "green",
    video: "",
    question: "What is pitch matching?",
    options: [
      "Matching your voice to a target note",
      "Making your voice louder",
      "Changing the song speed",
      "Adding background music",
    ],
    answer: 0,
  },
  {
    id: 6,
    title: "Your First Performance",
    description:
      "Put everything together and perform a short musical exercise.",
    duration: "10 min",
    icon: "🌟",
    color: "gold",
    video: "",
    question: "What is the most important part of practice?",
    options: [
      "Practicing consistently",
      "Never making mistakes",
      "Only practicing once",
      "Avoiding difficult exercises",
    ],
    answer: 0,
  },
];

function getSavedProgress() {
  try {
    const saved = localStorage.getItem(
      "skillsensai_music_progress"
    );

    if (!saved) return 0;

    const parsed = Number(saved);

    if (Number.isNaN(parsed)) return 0;

    return Math.max(
      0,
      Math.min(Math.floor(parsed), lessons.length)
    );
  } catch {
    return 0;
  }
}

function Music() {
  const [screen, setScreen] = useState("home");

  const [completedLessons, setCompletedLessons] =
    useState(getSavedProgress);

  const [selectedLesson, setSelectedLesson] =
    useState(null);

  const [selectedAnswer, setSelectedAnswer] =
    useState(null);

  const [quizResult, setQuizResult] =
    useState(null);

  const [songFile, setSongFile] =
    useState(null);

  const [songAnalysis, setSongAnalysis] =
    useState(null);

  const [voiceFile, setVoiceFile] =
    useState(null);

  const [voiceAnalysis, setVoiceAnalysis] =
    useState(null);

  const [recording, setRecording] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const mediaRecorderRef =
    useRef(null);

  const audioChunksRef =
    useRef([]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "skillsensai_music_progress",
        String(completedLessons)
      );
    } catch {
      // Ignore localStorage errors.
    }
  }, [completedLessons]);

  const progress = useMemo(() => {
    return Math.round(
      (completedLessons / lessons.length) * 100
    );
  }, [completedLessons]);

  const characterLevel = useMemo(() => {
    return Math.max(
      0,
      Math.min(6, completedLessons)
    );
  }, [completedLessons]);

  const currentLesson = selectedLesson
    ? lessons.find(
        (lesson) =>
          lesson.id === selectedLesson
      )
    : null;

  function isLessonUnlocked(lessonId) {
    return lessonId <= completedLessons + 1;
  }

  function openLesson(lesson) {
    if (!isLessonUnlocked(lesson.id)) {
      return;
    }

    setSelectedLesson(lesson.id);
    setSelectedAnswer(null);
    setQuizResult(null);
    setError("");
  }

  function closeLesson() {
    setSelectedLesson(null);
    setSelectedAnswer(null);
    setQuizResult(null);
  }

  function checkAnswer() {
    if (
      !currentLesson ||
      selectedAnswer === null
    ) {
      return;
    }

    const correct =
      selectedAnswer === currentLesson.answer;

    setQuizResult(
      correct ? "correct" : "wrong"
    );

    if (correct) {
      setCompletedLessons((previous) =>
        Math.max(
          previous,
          currentLesson.id
        )
      );
    }
  }

  function resetProgress() {
    setCompletedLessons(0);
    setSelectedLesson(null);
    setSelectedAnswer(null);
    setQuizResult(null);

    try {
      localStorage.removeItem(
        "skillsensai_music_progress"
      );
    } catch {
      // Ignore localStorage errors.
    }
  }

  async function analyzeSong(file) {
    if (!file) return;

    setSongFile(file);
    setSongAnalysis(null);
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/analyze-song`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data = await response.json();

      setSongAnalysis({
        ...data,
        pitch:
          data.pitch ||
          data.pitch_data ||
          [],
      });
    } catch (err) {
      console.error(err);

      setError(
        "Unable to analyse the song. Make sure the SkillSensAI backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  async function analyzeVoice(file) {
    if (!file) return;

    setVoiceFile(file);
    setVoiceAnalysis(null);
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/analyze-voice`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data = await response.json();

      const pitchData =
        data.pitch ||
        data.pitch_data ||
        [];

      const calculatedAccuracy =
        data.accuracy !== undefined
          ? Number(data.accuracy)
          : null;

      setVoiceAnalysis({
        ...data,
        pitch:
          Array.isArray(pitchData)
            ? pitchData
            : [],
        accuracy:
          calculatedAccuracy,
        message:
          data.message ||
          data.feedback ||
          "Your recording has been analysed. Keep practising to improve your pitch consistency.",
      });
    } catch (err) {
      console.error(err);

      setError(
        "Unable to analyse the recording. Make sure the SkillSensAI backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  async function startRecording() {
    setError("");

    if (
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError(
        "Live recording is not supported by this browser."
      );
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      audioChunksRef.current = [];

      let mimeType = "audio/webm";

      if (
        !MediaRecorder.isTypeSupported(
          "audio/webm"
        )
      ) {
        mimeType = "";
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      mediaRecorderRef.current =
        recorder;

      recorder.ondataavailable = (
        event
      ) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = async () => {
        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        const blob = new Blob(
          audioChunksRef.current,
          {
            type:
              mimeType ||
              "audio/webm",
          }
        );

        const file = new File(
          [blob],
          "skillsensai-recording.webm",
          {
            type:
              mimeType ||
              "audio/webm",
          }
        );

        await analyzeVoice(file);
      };

      recorder.start();

      setRecording(true);
    } catch (err) {
      console.error(err);

      setError(
        "Microphone access was not available. Please allow microphone permission."
      );
    }
  }

  function stopRecording() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setRecording(false);
  }

  function goToLearnFromScratch() {
    setScreen("scratch");
    setError("");
  }

  function goToLearnSong() {
    setScreen("song");
    setError("");
  }

  function goHome() {
    setScreen("home");
    setError("");
  }

  function getVideoSource(lesson) {
    return lesson.video || "";
  }

  return (
    <div className="music-page">
      <header className="music-navbar">
        <button
          className="music-brand"
          onClick={goHome}
        >
          <span className="music-brand-icon">
            <Music2 size={22} />
          </span>

          <span>
            <strong>
              Skill<span>SensAI</span>
            </strong>

            <small>
              Learn music your way
            </small>
          </span>
        </button>

        <div className="music-progress-mini">
          <span>
            {completedLessons}/
            {lessons.length} lessons
          </span>

          <div className="mini-progress">
            <div
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </header>

      {screen === "home" && (
        <main className="music-home">
          <section className="music-hero">
            <div className="music-hero-copy">
              <span className="eyebrow">
                <Sparkles size={14} />
                AI-POWERED MUSIC LEARNING
              </span>

              <h1>
                Discover the
                <span> musician </span>
                inside you.
              </h1>

              <p>
                Learn music from the beginning,
                practise your voice, analyse your
                performance and build your skills
                at your own pace.
              </p>
            </div>

            <div className="musician-stage">
              <div
                className={`musician-aura level-${characterLevel}`}
              />

              <div
                className={`musician-silhouette level-${characterLevel}`}
              >
                <div className="musician-head" />
                <div className="musician-body" />
                <div className="musician-arm left" />
                <div className="musician-arm right" />
                <div className="musician-leg left" />
                <div className="musician-leg right" />
              </div>

              {characterLevel === 6 && (
                <div className="musician-particles">
                  <span>♪</span>
                  <span>♫</span>
                  <span>♪</span>
                  <span>♬</span>
                  <span>♫</span>
                </div>
              )}

              <div className="musician-level">
                <strong>
                  Level {characterLevel}
                </strong>

                <span>
                  {progress}% awakened
                </span>
              </div>
            </div>

            <div className="music-choice-grid">
              <button
                className="music-choice-card scratch"
                onClick={
                  goToLearnFromScratch
                }
              >
                <div className="choice-icon">
                  <Brain size={27} />
                </div>

                <div>
                  <span className="choice-label">
                    START HERE
                  </span>

                  <h2>
                    Learn From Scratch
                  </h2>

                  <p>
                    Build your musical foundation
                    through guided lessons, quizzes
                    and practice.
                  </p>
                </div>

                <ChevronRight className="choice-arrow" />
              </button>

              <button
                className="music-choice-card song"
                onClick={goToLearnSong}
              >
                <div className="choice-icon">
                  <Music2 size={27} />
                </div>

                <div>
                  <span className="choice-label">
                    PRACTICE
                  </span>

                  <h2>
                    Learn a Song
                  </h2>

                  <p>
                    Upload a song and use AI feedback
                    to practise your pitch and voice.
                  </p>
                </div>

                <ChevronRight className="choice-arrow" />
              </button>
            </div>
          </section>

          <section className="music-stats">
            <div>
              <strong>
                {completedLessons}
              </strong>

              <span>
                Lessons completed
              </span>
            </div>

            <div>
              <strong>
                {progress}%
              </strong>

              <span>
                Learning progress
              </span>
            </div>

            <div>
              <strong>
                {characterLevel === 6
                  ? "Awakened"
                  : "Learning"}
              </strong>

              <span>
                Musician status
              </span>
            </div>
          </section>

          {completedLessons > 0 && (
            <button
              className="reset-progress"
              onClick={resetProgress}
            >
              <RotateCcw size={15} />
              Reset learning progress
            </button>
          )}
        </main>
      )}

      {screen === "scratch" && (
        <main className="music-content">
          <button
            className="back-button"
            onClick={goHome}
          >
            <ArrowLeft size={18} />
            Back to Music
          </button>

          <section className="page-heading">
            <span className="eyebrow">
              <Brain size={14} />
              LEARN FROM SCRATCH
            </span>

            <h1>
              Build your musical foundation.
            </h1>

            <p>
              Complete lessons to bring your
              musician to life.
            </p>
          </section>

          <section className="progress-panel">
            <div className="progress-panel-top">
              <div>
                <strong>
                  Your journey
                </strong>

                <span>
                  {completedLessons} of{" "}
                  {lessons.length} lessons
                  completed
                </span>
              </div>

              <strong>{progress}%</strong>
            </div>

            <div className="large-progress">
              <div
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </section>

          <section className="lesson-grid">
            {lessons.map((lesson) => {
              const completed =
                lesson.id <=
                completedLessons;

              const unlocked =
                isLessonUnlocked(
                  lesson.id
                );

              return (
                <button
                  key={lesson.id}
                  className={`lesson-card ${
                    completed
                      ? "completed"
                      : ""
                  } ${
                    !unlocked
                      ? "locked"
                      : ""
                  }`}
                  onClick={() =>
                    openLesson(lesson)
                  }
                  disabled={!unlocked}
                >
                  <div
                    className={`lesson-number ${lesson.color}`}
                  >
                    {completed ? (
                      <Check size={21} />
                    ) : !unlocked ? (
                      <Lock size={18} />
                    ) : (
                      lesson.id
                    )}
                  </div>

                  <div className="lesson-icon">
                    {lesson.icon}
                  </div>

                  <div className="lesson-details">
                    <span>
                      LESSON {lesson.id}
                    </span>

                    <h3>
                      {lesson.title}
                    </h3>

                    <p>
                      {lesson.description}
                    </p>

                    <small>
                      {lesson.duration}
                    </small>
                  </div>

                  {unlocked ? (
                    <ChevronRight className="lesson-arrow" />
                  ) : (
                    <Lock className="lesson-arrow" />
                  )}
                </button>
              );
            })}
          </section>

          <section className="practice-section">
            <div className="section-heading">
              <span>
                <Mic size={15} />
                PRACTICE
              </span>

              <h2>
                Test what you've learned.
              </h2>
            </div>

            <div className="practice-options">
              <div className="practice-card">
                <div className="practice-card-icon">
                  <Mic size={22} />
                </div>

                <div className="practice-card-copy">
                  <h3>
                    Record Live
                  </h3>

                  <p>
                    Record yourself singing and
                    receive AI-powered feedback.
                  </p>
                </div>

                {!recording ? (
                  <button
                    className="practice-button recording-button"
                    onClick={
                      startRecording
                    }
                  >
                    <Mic size={16} />
                    Record Live
                  </button>
                ) : (
                  <button
                    className="practice-button recording-button"
                    onClick={
                      stopRecording
                    }
                  >
                    <X size={16} />
                    Stop Recording
                  </button>
                )}
              </div>

              <div className="practice-card">
                <div className="practice-card-icon">
                  <Upload size={22} />
                </div>

                <div className="practice-card-copy">
                  <h3>
                    Upload Recording
                  </h3>

                  <p>
                    Upload an existing recording for
                    AI analysis.
                  </p>
                </div>

                <label className="practice-button upload-label">
                  <Upload size={16} />
                  Upload Recording

                  <input
                    type="file"
                    accept="audio/*"
                    hidden
                    onChange={(event) =>
                      analyzeVoice(
                        event.target
                          .files?.[0]
                      )
                    }
                  />
                </label>
              </div>
            </div>
          </section>

          {recording && (
            <div className="recording-status">
              <span className="recording-pulse" />

              <div>
                <strong>
                  Recording in progress
                </strong>

                <span>
                  Sing naturally, then press
                  stop.
                </span>
              </div>
            </div>
          )}

          {loading && (
            <div className="analysis-status">
              <Sparkles
                size={18}
                className="loading-icon"
              />

              Analysing your recording with
              AI...
            </div>
          )}

          {voiceFile && (
            <div className="selected-song">
              <Volume2 size={20} />

              <div>
                <strong>
                  {voiceFile.name}
                </strong>

                <small>
                  Recording selected for
                  analysis
                </small>
              </div>

              <Check className="success-icon" />
            </div>
          )}

          {voiceAnalysis && (
            <section className="voice-result">
              <div className="voice-result-icon">
                <Sparkles size={24} />
              </div>

              <div>
                <span>
                  AI FEEDBACK
                </span>

                <h2>
                  {voiceAnalysis.accuracy !==
                  null &&
                  voiceAnalysis.accuracy !==
                    undefined
                    ? `${Math.round(
                        Number(
                          voiceAnalysis.accuracy
                        )
                      )}% pitch accuracy`
                    : "Your recording has been analysed"}
                </h2>

                <p>
                  {voiceAnalysis.message ||
                    voiceAnalysis.feedback ||
                    "Keep practising and focus on matching the target pitch."}
                </p>
              </div>
            </section>
          )}

          {error && (
            <div className="analysis-error">
              {error}
            </div>
          )}
        </main>
      )}

      {screen === "song" && (
        <main className="music-content">
          <button
            className="back-button"
            onClick={goHome}
          >
            <ArrowLeft size={18} />
            Back to Music
          </button>

          <section className="page-heading">
            <span className="eyebrow">
              <Music2 size={14} />
              LEARN A SONG
            </span>

            <h1>
              Practise with AI feedback.
            </h1>

            <p>
              Upload a song, study its pitch and
              compare your performance.
            </p>
          </section>

          <section className="upload-song-card">
            <div className="upload-song-icon">
              <FileAudio size={30} />
            </div>

            <h2>
              Choose a song
            </h2>

            <p>
              Upload an audio file and SkillSensAI
              will analyse its musical
              characteristics.
            </p>

            <label className="primary-upload-button">
              <Upload size={18} />
              Upload Song

              <input
                type="file"
                accept="audio/*"
                hidden
                onChange={(event) =>
                  analyzeSong(
                    event.target.files?.[0]
                  )
                }
              />
            </label>

            <small>
              MP3, WAV, M4A and other supported
              audio formats
            </small>
          </section>

          {songFile && (
            <div className="selected-song">
              <FileAudio size={20} />

              <div>
                <strong>
                  {songFile.name}
                </strong>

                <small>
                  Song selected for analysis
                </small>
              </div>

              <Check className="success-icon" />
            </div>
          )}

          {loading && (
            <div className="analysis-status">
              <Sparkles
                size={18}
                className="loading-icon"
              />

              Analysing your audio with AI...
            </div>
          )}

          {error && (
            <div className="analysis-error">
              {error}
            </div>
          )}

          {songAnalysis && (
            <section className="pitch-analysis">
              <div className="pitch-header">
                <div>
                  <span>
                    AI SONG ANALYSIS
                  </span>

                  <h2>
                    Pitch profile
                  </h2>
                </div>

                <div className="song-duration">
                  <small>
                    Duration
                  </small>

                  <strong>
                    {songAnalysis.duration
                      ? `${Number(
                          songAnalysis.duration
                        ).toFixed(1)} sec`
                      : "Available"}
                  </strong>
                </div>
              </div>

              {songAnalysis.pitch &&
              Array.isArray(
                songAnalysis.pitch
              ) &&
              songAnalysis.pitch.length > 0 ? (
                <div className="pitch-graph-container">
                  <svg
                    className="pitch-graph"
                    viewBox="0 0 1000 350"
                    preserveAspectRatio="none"
                  >
                    <line
                      className="graph-axis"
                      x1="45"
                      y1="20"
                      x2="45"
                      y2="320"
                    />

                    <line
                      className="graph-axis"
                      x1="45"
                      y1="320"
                      x2="980"
                      y2="320"
                    />

                    {[80, 140, 200, 260].map(
                      (y) => (
                        <line
                          key={y}
                          className="graph-grid"
                          x1="45"
                          y1={y}
                          x2="980"
                          y2={y}
                        />
                      )
                    )}

                    <polyline
                      className="pitch-line"
                      points={songAnalysis.pitch
                        .map(
                          (
                            value,
                            index
                          ) => {
                            const x =
                              50 +
                              (index /
                                Math.max(
                                  1,
                                  songAnalysis
                                    .pitch
                                    .length -
                                    1
                                )) *
                                920;

                            const numeric =
                              Number(
                                value
                              ) || 0;

                            const y =
                              310 -
                              Math.min(
                                270,
                                Math.max(
                                  0,
                                  numeric *
                                    2
                                )
                              );

                            return `${x},${y}`;
                          }
                        )
                        .join(" ")}
                    />
                  </svg>

                  <span className="pitch-label-high">
                    High
                  </span>

                  <span className="pitch-label-low">
                    Low
                  </span>
                </div>
              ) : (
                <div className="no-pitch">
                  Pitch data was returned without a
                  graphable pitch sequence.
                </div>
              )}

              <div className="pitch-info">
                <div>
                  <span className="pitch-dot" />

                  <p>
                    Detected pitch over time
                  </p>
                </div>

                <span>
                  AI-generated analysis
                </span>
              </div>
            </section>
          )}

          <section className="practice-section">
            <div className="section-heading">
              <span>
                <Mic size={15} />
                PRACTICE YOUR VOICE
              </span>

              <h2>
                Sing along and compare your
                voice.
              </h2>
            </div>

            <div className="practice-options">
              <div className="practice-card">
                <div className="practice-card-icon">
                  <Mic size={22} />
                </div>

                <div className="practice-card-copy">
                  <h3>
                    Record Live
                  </h3>

                  <p>
                    Sing into your microphone and
                    let AI analyse your pitch.
                  </p>
                </div>

                {!recording ? (
                  <button
                    className="practice-button recording-button"
                    onClick={
                      startRecording
                    }
                  >
                    <Mic size={16} />
                    Record Live
                  </button>
                ) : (
                  <button
                    className="practice-button recording-button"
                    onClick={
                      stopRecording
                    }
                  >
                    <X size={16} />
                    Stop Recording
                  </button>
                )}
              </div>

              <div className="practice-card">
                <div className="practice-card-icon">
                  <Upload size={22} />
                </div>

                <div className="practice-card-copy">
                  <h3>
                    Upload Recording
                  </h3>

                  <p>
                    Use an existing recording
                    instead.
                  </p>
                </div>

                <label className="practice-button upload-label">
                  <Upload size={16} />
                  Upload Recording

                  <input
                    type="file"
                    accept="audio/*"
                    hidden
                    onChange={(event) =>
                      analyzeVoice(
                        event.target
                          .files?.[0]
                      )
                    }
                  />
                </label>
              </div>
            </div>
          </section>

          {recording && (
            <div className="recording-status">
              <span className="recording-pulse" />

              <div>
                <strong>
                  Recording in progress
                </strong>

                <span>
                  Sing naturally, then press
                  stop.
                </span>
              </div>
            </div>
          )}

          {voiceFile && (
            <div className="selected-song">
              <Mic size={20} />

              <div>
                <strong>
                  {voiceFile.name}
                </strong>

                <small>
                  Voice recording selected
                </small>
              </div>

              <Check className="success-icon" />
            </div>
          )}

          {voiceAnalysis && (
            <section className="comparison-section">
              <div className="comparison-header">
                <div className="comparison-icon">
                  <Sparkles size={24} />
                </div>

                <div>
                  <span>
                    AI VOICE FEEDBACK
                  </span>

                  <h2>
                    Your performance
                  </h2>

                  <p>
                    Your recording has been
                    analysed by SkillSensAI.
                  </p>
                </div>
              </div>

              <div className="accuracy-card">
                <span>
                  PITCH ACCURACY
                </span>

                <strong>
                  {voiceAnalysis.accuracy !==
                    null &&
                  voiceAnalysis.accuracy !==
                    undefined
                    ? `${Math.round(
                        Number(
                          voiceAnalysis.accuracy
                        )
                      )}%`
                    : "--"}
                </strong>

                <p>
                  {voiceAnalysis.message ||
                    voiceAnalysis.feedback ||
                    "Keep practising to improve your pitch consistency."}
                </p>
              </div>

              {voiceAnalysis.pitch &&
              voiceAnalysis.pitch.length > 0 ? (
                <div className="comparison-graph-container">
                  <div className="comparison-legend">
                    <div>
                      <span className="legend-dot voice-dot" />
                      Your voice
                    </div>
                  </div>

                  <svg
                    className="comparison-graph"
                    viewBox="0 0 1000 350"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      className="voice-pitch-line"
                      points={voiceAnalysis.pitch
                        .map(
                          (
                            value,
                            index
                          ) => {
                            const x =
                              (index /
                                Math.max(
                                  1,
                                  voiceAnalysis
                                    .pitch
                                    .length -
                                    1
                                )) *
                                980 +
                              10;

                            const numeric =
                              Number(
                                value
                              ) || 0;

                            const y =
                              320 -
                              Math.min(
                                280,
                                Math.max(
                                  0,
                                  numeric *
                                    2
                                )
                              );

                            return `${x},${y}`;
                          }
                        )
                        .join(" ")}
                    />
                  </svg>

                  <span className="comparison-label-high">
                    High
                  </span>

                  <span className="comparison-label-low">
                    Low
                  </span>
                </div>
              ) : null}
            </section>
          )}

          <section className="music-ai-info">
            <div className="ai-info-icon">
              <Brain size={23} />
            </div>

            <div>
              <h3>
                How SkillSensAI helps
              </h3>

              <p>
                SkillSensAI analyses audio
                characteristics such as pitch and
                provides practical feedback that
                helps you improve through repeated
                practice.
              </p>
            </div>
          </section>
        </main>
      )}

      {currentLesson && (
        <div className="lesson-modal-backdrop">
          <div className="lesson-modal">
            <button
              className="modal-close"
              onClick={closeLesson}
            >
              <X size={20} />
            </button>

            <div className="modal-lesson-icon">
              {currentLesson.icon}
            </div>

            <span className="modal-label">
              LESSON {currentLesson.id}
            </span>

            <h2>
              {currentLesson.title}
            </h2>

            <p>
              {currentLesson.description}
            </p>

            <div className="lesson-video-section">
              {getVideoSource(
                currentLesson
              ) ? (
                <>
                  <video
                    className="lesson-video"
                    src={getVideoSource(
                      currentLesson
                    )}
                    controls
                    preload="metadata"
                  >
                    Your browser does not support
                    video playback.
                  </video>

                  <small>
                    Watch the lesson before
                    answering the quiz.
                  </small>
                </>
              ) : (
                <div className="lesson-video-placeholder">
                  <Play size={30} />

                  <strong>
                    Lesson video coming soon
                  </strong>

                  <span>
                    The lesson content can be
                    uploaded here later.
                  </span>
                </div>
              )}
            </div>

            <div className="lesson-tip">
              <CircleHelp size={18} />

              <span>
                Take your time and answer the
                question below.
              </span>
            </div>

            <div className="quiz-box">
              <h3>
                {currentLesson.question}
              </h3>

              <div className="quiz-options">
                {currentLesson.options.map(
                  (
                    option,
                    index
                  ) => {
                    const selected =
                      selectedAnswer ===
                      index;

                    const isCorrect =
                      quizResult ===
                        "correct" &&
                      index ===
                        currentLesson.answer;

                    const isWrong =
                      quizResult ===
                        "wrong" &&
                      selected;

                    return (
                      <button
                        key={option}
                        className={`quiz-option ${
                          selected
                            ? "selected"
                            : ""
                        } ${
                          isCorrect
                            ? "correct"
                            : ""
                        } ${
                          isWrong
                            ? "wrong"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedAnswer(
                            index
                          )
                        }
                      >
                        <span>
                          {String.fromCharCode(
                            65 + index
                          )}
                        </span>

                        {option}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {quizResult ===
              "correct" && (
              <div className="quiz-feedback correct">
                <Check size={18} />

                Correct! Your musician is
                becoming more complete.
              </div>
            )}

            {quizResult === "wrong" && (
              <div className="quiz-feedback wrong">
                Not quite. Try again and review
                the lesson concept.
              </div>
            )}

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={closeLesson}
              >
                Close
              </button>

              <button
                className="primary-button"
                onClick={checkAnswer}
                disabled={
                  selectedAnswer === null
                }
              >
                Check Answer
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Music;
