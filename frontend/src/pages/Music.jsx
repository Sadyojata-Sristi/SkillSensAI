import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CirclePlay,
  Flame,
  Lock,
  Mic,
  Music2,
  Pause,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  Upload,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Music.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const STORAGE_KEY = "skillsensai_music_progress";

const LESSONS = [
  {
    id: 1,
    title: "Understanding Pitch",
    description:
      "Learn how high and low sounds work and understand the basics of pitch.",
    duration: "8 min",
    xp: 100,
    video: "/lessons/music/pitch.mp4",
    theory: [
      "Pitch tells us how high or low a sound is.",
      "Higher frequency creates a higher-pitched sound.",
      "Lower frequency creates a lower-pitched sound.",
      "Good pitch awareness is the foundation of singing.",
    ],
    question:
      "What determines whether a musical sound is high or low?",
    options: [
      "Frequency",
      "Volume",
      "Duration",
      "Silence",
    ],
    answer: 0,
  },
  {
    id: 2,
    title: "Voice Control",
    description:
      "Understand breathing, support and how to control your singing voice.",
    duration: "10 min",
    xp: 120,
    video: "/lessons/music/voice-control.mp4",
    theory: [
      "Breathing is one of the foundations of good singing.",
      "Controlled airflow helps maintain stable notes.",
      "Relax your shoulders while breathing.",
      "Avoid forcing the voice when reaching higher notes.",
    ],
    question:
      "What helps a singer maintain a stable voice?",
    options: [
      "Controlled breathing",
      "Shouting",
      "Holding your breath",
      "Speaking faster",
    ],
    answer: 0,
  },
  {
    id: 3,
    title: "Musical Notes",
    description:
      "Learn the basic musical notes and how they relate to pitch.",
    duration: "9 min",
    xp: 130,
    video: "/lessons/music/musical-notes.mp4",
    theory: [
      "The basic musical notes are A, B, C, D, E, F and G.",
      "Notes repeat at different octaves.",
      "An octave contains eight note positions.",
      "Understanding notes makes pitch training easier.",
    ],
    question:
      "Which of these is a basic musical note?",
    options: [
      "C",
      "Z",
      "Q",
      "R",
    ],
    answer: 0,
  },
  {
    id: 4,
    title: "Rhythm Basics",
    description:
      "Learn how timing, beats and rhythm work together in music.",
    duration: "11 min",
    xp: 140,
    video: "/lessons/music/rhythm.mp4",
    theory: [
      "Rhythm is the timing and pattern of sounds.",
      "A beat provides the basic pulse of music.",
      "Counting beats helps maintain timing.",
      "Good rhythm is important for both singing and instruments.",
    ],
    question:
      "What does rhythm mainly describe?",
    options: [
      "Timing and pattern of sounds",
      "Only loudness",
      "Only pitch",
      "Only silence",
    ],
    answer: 0,
  },
  {
    id: 5,
    title: "Pitch Matching",
    description:
      "Train your ears and voice to reproduce a target musical pitch.",
    duration: "12 min",
    xp: 160,
    video: "/lessons/music/pitch-matching.mp4",
    theory: [
      "Pitch matching means reproducing a target pitch with your voice.",
      "Listen carefully before attempting the note.",
      "Start gently rather than forcing the sound.",
      "Repeated practice improves pitch accuracy.",
    ],
    question:
      "What is pitch matching?",
    options: [
      "Reproducing a target pitch",
      "Increasing volume",
      "Changing rhythm",
      "Stopping the music",
    ],
    answer: 0,
  },
  {
    id: 6,
    title: "Your First Performance",
    description:
      "Bring everything together and prepare for your first complete performance.",
    duration: "15 min",
    xp: 200,
    video: "/lessons/music/first-performance.mp4",
    theory: [
      "A performance combines pitch, rhythm, voice control and confidence.",
      "Warm up your voice before singing.",
      "Focus on expression instead of perfection.",
      "The goal is to communicate through music.",
    ],
    question:
      "What combines the skills learned throughout the course?",
    options: [
      "A complete performance",
      "Only breathing",
      "Only rhythm",
      "Only volume",
    ],
    answer: 0,
  },
];

function getInitialProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      return {
        completedLessons: Array.isArray(parsed.completedLessons)
          ? parsed.completedLessons
          : [],
        xp: Number(parsed.xp) || 0,
        streak: Number(parsed.streak) || 0,
        lastPracticeDate: parsed.lastPracticeDate || null,
      };
    }
  } catch (error) {
    console.error("Unable to load music progress:", error);
  }

  return {
    completedLessons: [],
    xp: 0,
    streak: 0,
    lastPracticeDate: null,
  };
}

function Music() {
  const navigate = useNavigate();

  const [progress, setProgress] = useState(getInitialProgress);

  const [activeTab, setActiveTab] = useState("scratch");

  const [selectedLesson, setSelectedLesson] = useState(null);

  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const [lessonCompleted, setLessonCompleted] = useState(false);

  const [songFile, setSongFile] = useState(null);
  const [songAnalysis, setSongAnalysis] = useState(null);
  const [songLoading, setSongLoading] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState(null);
  const [voiceLoading, setVoiceLoading] = useState(false);

  const [showCelebration, setShowCelebration] = useState(false);

  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(progress)
      );
    } catch (error) {
      console.error("Unable to save music progress:", error);
    }
  }, [progress]);

  const completedLessons = progress.completedLessons;

  const completedCount = completedLessons.length;

  const isFullyAwakened = completedCount === LESSONS.length;

  const level = useMemo(() => {
    return Math.floor(progress.xp / 300) + 1;
  }, [progress.xp]);

  const nextLesson = LESSONS.find(
    (lesson) => !completedLessons.includes(lesson.id)
  );

  const openLesson = (lesson) => {
    if (
      lesson.id !== 1 &&
      !completedLessons.includes(lesson.id - 1)
    ) {
      return;
    }

    setSelectedLesson(lesson);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setLessonCompleted(false);
  };

  const closeLesson = () => {
    setSelectedLesson(null);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setLessonCompleted(false);
  };

  const handleAnswer = (index) => {
    if (quizSubmitted) return;

    setSelectedAnswer(index);
    setQuizSubmitted(true);
  };

  const isCorrect =
    selectedLesson &&
    selectedAnswer === selectedLesson.answer;

  const completeLesson = () => {
    if (!selectedLesson || !isCorrect) return;

    if (!completedLessons.includes(selectedLesson.id)) {
      const newCompletedLessons = [
        ...completedLessons,
        selectedLesson.id,
      ].sort((a, b) => a - b);

      const newXp = progress.xp + selectedLesson.xp;

      const today = new Date().toISOString().slice(0, 10);

      setProgress((previous) => ({
        ...previous,
        completedLessons: newCompletedLessons,
        xp: newXp,
        streak: previous.streak || 1,
        lastPracticeDate: today,
      }));

      setLessonCompleted(true);

      if (newCompletedLessons.length === LESSONS.length) {
        setTimeout(() => {
          setShowCelebration(true);
        }, 700);
      }
    } else {
      setLessonCompleted(true);
    }
  };

  const retryQuiz = () => {
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setLessonCompleted(false);
  };

  const handleSongUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSongFile(file);
    setSongAnalysis(null);
  };

  const analyzeSong = async () => {
    if (!songFile) return;

    setSongLoading(true);
    setSongAnalysis(null);

    try {
      const formData = new FormData();

      formData.append("file", songFile);

      const response = await fetch(
        `${API_URL}/analyze-song`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Song analysis failed.");
      }

      const data = await response.json();

      setSongAnalysis(data);
    } catch (error) {
      console.error(error);

      setSongAnalysis({
        error:
          "Unable to analyze the song. Please make sure the backend is running.",
      });
    } finally {
      setSongLoading(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert(
        "Your browser does not support live recording."
      );
      return;
    }

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
        const blob = new Blob(
          recordingChunksRef.current,
          {
            type: "audio/webm",
          }
        );

        setRecordedBlob(blob);

        stream.getTracks().forEach((track) => {
          track.stop();
        });
      };

      recorder.start();

      mediaRecorderRef.current = recorder;

      setRecording(true);
      setVoiceAnalysis(null);
    } catch (error) {
      console.error(error);

      alert(
        "Unable to access your microphone. Please allow microphone permission."
      );
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setRecording(false);
  };

  const analyzeVoiceBlob = async (blob) => {
    if (!blob) return;

    setVoiceLoading(true);
    setVoiceAnalysis(null);

    try {
      const formData = new FormData();

      formData.append(
        "file",
        blob,
        "voice-recording.webm"
      );

      const response = await fetch(
        `${API_URL}/analyze-voice`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Voice analysis failed.");
      }

      const data = await response.json();

      const pitchData = Array.isArray(data.pitch_data)
        ? data.pitch_data
        : [];

      let stability = 0;

      if (pitchData.length > 1) {
        const validPitches = pitchData
          .map((point) => {
            if (Array.isArray(point)) {
              return Number(point[1]);
            }

            if (
              point &&
              typeof point.pitch === "number"
            ) {
              return point.pitch;
            }

            return null;
          })
          .filter(
            (pitch) =>
              Number.isFinite(pitch) && pitch > 0
          );

        if (validPitches.length > 1) {
          const average =
            validPitches.reduce(
              (sum, value) => sum + value,
              0
            ) / validPitches.length;

          const deviation =
            validPitches.reduce(
              (sum, value) =>
                sum + Math.abs(value - average),
              0
            ) / validPitches.length;

          stability = Math.max(
            0,
            Math.min(
              100,
              100 - deviation / 5
            )
          );
        }
      }

      setVoiceAnalysis({
        ...data,
        stability: Math.round(stability),
      });
    } catch (error) {
      console.error(error);

      setVoiceAnalysis({
        error:
          "Unable to analyze the recording. Please make sure the backend is running.",
      });
    } finally {
      setVoiceLoading(false);
    }
  };

  const handleRecordedUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setRecordedBlob(file);
    setVoiceAnalysis(null);
  };

  const uploadAndAnalyzeRecording = () => {
    if (!recordedBlob) return;

    analyzeVoiceBlob(recordedBlob);
  };

  const resetProgress = () => {
    const confirmed = window.confirm(
      "Reset all Music progress?"
    );

    if (!confirmed) return;

    const freshProgress = {
      completedLessons: [],
      xp: 0,
      streak: 0,
      lastPracticeDate: null,
    };

    setProgress(freshProgress);
    setShowCelebration(false);
  };

  return (
    <div className="music-page">
      {/* =====================================================
          NAVBAR
          ===================================================== */}

      <header className="music-navbar">
        <button
          className="music-back-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="music-brand">
          <div className="music-brand-icon">
            <Music2 size={22} />
          </div>

          <div>
            <h1>Music</h1>
            <span>Find your voice</span>
          </div>
        </div>

        <div className="music-nav-stats">
          <div className="music-nav-stat">
            <Flame size={17} />
            <span>{progress.streak}</span>
          </div>

          <div className="music-nav-stat">
            <Zap size={17} />
            <span>{progress.xp} XP</span>
          </div>

          <div className="music-level">
            LEVEL {level}
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <main className="music-content">
        <section className="music-hero">
          <div className="music-hero-copy">
            <div className="music-eyebrow">
              <Sparkles size={15} />
              AI-POWERED MUSIC LEARNING
            </div>

            <h2>
              Discover the
              <span> Musician </span>
              Inside You
            </h2>

            <p>
              Learn music step by step, practice with AI
              feedback, and watch your musician come to life.
            </p>

            {nextLesson ? (
              <button
                className="continue-button"
                onClick={() => openLesson(nextLesson)}
              >
                Continue Learning
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                className="continue-button awakened-button"
                onClick={() => setShowCelebration(true)}
              >
                <Sparkles size={18} />
                Musician Awakened
              </button>
            )}
          </div>

          {/* =================================================
              SINGER AWAKENING
              ================================================= */}

          <div
            className={`awakening-visual stage-${completedCount} ${
              isFullyAwakened
                ? "fully-awakened"
                : ""
            }`}
          >
            <div className="awakening-aura aura-one" />
            <div className="awakening-aura aura-two" />

            <div className="singer-container">
              <img
                src="/singer.png"
                alt="SkillSensAI Musician"
                className="singer-character"
              />

              {isFullyAwakened && (
                <>
                  <div className="music-note note-1">
                    ♪
                  </div>

                  <div className="music-note note-2">
                    ♫
                  </div>

                  <div className="music-note note-3">
                    ♬
                  </div>

                  <div className="music-note note-4">
                    ♪
                  </div>

                  <div className="sound-wave wave-1" />
                  <div className="sound-wave wave-2" />
                  <div className="sound-wave wave-3" />

                  <div className="music-spark spark-1">
                    ✦
                  </div>

                  <div className="music-spark spark-2">
                    ✦
                  </div>

                  <div className="music-spark spark-3">
                    ✧
                  </div>

                  <div className="music-spark spark-4">
                    ✦
                  </div>
                </>
              )}
            </div>

            <div className="awakening-progress">
              {isFullyAwakened
                ? "MUSICIAN AWAKENED"
                : `${completedCount} / 6 LESSONS`}
            </div>
          </div>
        </section>

        {/* =====================================================
            PROGRESS
            ===================================================== */}

        <section className="music-progress-section">
          <div className="progress-heading">
            <div>
              <span>Your Musical Journey</span>

              <h3>
                {completedCount} of {LESSONS.length} lessons
                completed
              </h3>
            </div>

            <button
              className="reset-progress-button"
              onClick={resetProgress}
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${
                  (completedCount /
                    LESSONS.length) *
                  100
                }%`,
              }}
            />
          </div>

          <div className="lesson-dots">
            {LESSONS.map((lesson) => {
              const completed =
                completedLessons.includes(
                  lesson.id
                );

              const unlocked =
                lesson.id === 1 ||
                completedLessons.includes(
                  lesson.id - 1
                );

              return (
                <div
                  key={lesson.id}
                  className={`lesson-dot ${
                    completed
                      ? "completed"
                      : unlocked
                      ? "unlocked"
                      : "locked"
                  }`}
                >
                  {completed ? (
                    <Check size={14} />
                  ) : unlocked ? (
                    lesson.id
                  ) : (
                    <Lock size={12} />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            TABS
            ===================================================== */}

        <div className="music-tabs">
          <button
            className={
              activeTab === "scratch"
                ? "active"
                : ""
            }
            onClick={() => setActiveTab("scratch")}
          >
            <Music2 size={18} />
            Learn From Scratch
          </button>

          <button
            className={
              activeTab === "song"
                ? "active"
                : ""
            }
            onClick={() => setActiveTab("song")}
          >
            <Volume2 size={18} />
            Learn a Song
          </button>
        </div>

        {/* =====================================================
            LEARN FROM SCRATCH
            ===================================================== */}

        {activeTab === "scratch" && (
          <section className="learning-section">
            <div className="section-title">
              <div>
                <span>START HERE</span>
                <h3>Learn From Scratch</h3>
              </div>

              <p>
                Build your musical foundation one lesson at
                a time.
              </p>
            </div>

            <div className="lesson-grid">
              {LESSONS.map((lesson) => {
                const completed =
                  completedLessons.includes(
                    lesson.id
                  );

                const unlocked =
                  lesson.id === 1 ||
                  completedLessons.includes(
                    lesson.id - 1
                  );

                return (
                  <article
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
                    onClick={() => {
                      if (unlocked) {
                        openLesson(lesson);
                      }
                    }}
                  >
                    <div className="lesson-card-top">
                      <div
                        className={`lesson-number ${
                          completed
                            ? "done"
                            : ""
                        }`}
                      >
                        {completed ? (
                          <Check size={18} />
                        ) : (
                          lesson.id
                        )}
                      </div>

                      <div className="lesson-xp">
                        +{lesson.xp} XP
                      </div>
                    </div>

                    <div className="lesson-card-icon">
                      {completed ? (
                        <Trophy size={25} />
                      ) : unlocked ? (
                        <CirclePlay size={25} />
                      ) : (
                        <Lock size={22} />
                      )}
                    </div>

                    <h4>{lesson.title}</h4>

                    <p>{lesson.description}</p>

                    <div className="lesson-card-footer">
                      <span>
                        {lesson.duration}
                      </span>

                      {completed ? (
                        <span className="completed-label">
                          Completed
                        </span>
                      ) : unlocked ? (
                        <span className="start-label">
                          Start
                          <ChevronRight
                            size={15}
                          />
                        </span>
                      ) : (
                        <span className="locked-label">
                          Locked
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* =====================================================
            LEARN A SONG
            ===================================================== */}

        {activeTab === "song" && (
          <section className="song-section">
            <div className="section-title">
              <div>
                <span>PRACTICE WITH AI</span>
                <h3>Learn a Song</h3>
              </div>

              <p>
                Upload a song and analyze its pitch, then
                practice your voice.
              </p>
            </div>

            <div className="song-layout">
              {/* SONG ANALYSIS */}

              <div className="song-card">
                <div className="song-card-icon">
                  <Volume2 size={26} />
                </div>

                <h4>Analyze a Song</h4>

                <p>
                  Upload an audio file and let AI analyze
                  its pitch.
                </p>

                <label className="upload-box">
                  <Upload size={23} />

                  <strong>
                    {songFile
                      ? songFile.name
                      : "Choose an audio file"}
                  </strong>

                  <span>
                    MP3, WAV, M4A or supported audio
                  </span>

                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleSongUpload}
                  />
                </label>

                <button
                  className="primary-action"
                  onClick={analyzeSong}
                  disabled={
                    !songFile || songLoading
                  }
                >
                  {songLoading ? (
                    <>
                      <span className="spinner" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={17} />
                      Analyze Song
                    </>
                  )}
                </button>

                {songAnalysis && (
                  <div className="analysis-result">
                    {songAnalysis.error ? (
                      <div className="analysis-error">
                        <X size={17} />
                        {songAnalysis.error}
                      </div>
                    ) : (
                      <>
                        <div className="analysis-result-header">
                          <Check size={18} />
                          <strong>
                            AI Song Analysis Complete
                          </strong>
                        </div>

                        <div className="analysis-stats">
                          <div>
                            <span>Duration</span>
                            <strong>
                              {songAnalysis.duration
                                ? `${Number(
                                    songAnalysis.duration
                                  ).toFixed(1)}s`
                                : "--"}
                            </strong>
                          </div>

                          <div>
                            <span>Pitch Points</span>
                            <strong>
                              {Array.isArray(
                                songAnalysis.pitch_data
                              )
                                ? songAnalysis
                                    .pitch_data.length
                                : "--"}
                            </strong>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* VOICE PRACTICE */}

              <div className="song-card">
                <div className="song-card-icon pink">
                  <Mic size={26} />
                </div>

                <h4>Practice Your Voice</h4>

                <p>
                  Record live or upload your recording and
                  receive AI voice analysis.
                </p>

                <div className="record-actions">
                  {!recording ? (
                    <button
                      className="record-button"
                      onClick={startRecording}
                    >
                      <Mic size={18} />
                      Record Live
                    </button>
                  ) : (
                    <button
                      className="record-button recording"
                      onClick={stopRecording}
                    >
                      <Pause size={18} />
                      Stop Recording
                    </button>
                  )}

                  <label className="upload-record-button">
                    <Upload size={18} />
                    Upload Recording

                    <input
                      type="file"
                      accept="audio/*"
                      onChange={
                        handleRecordedUpload
                      }
                    />
                  </label>
                </div>

                {recordedBlob && (
                  <div className="recorded-preview">
                    <div>
                      <Check size={17} />
                      Recording ready
                    </div>

                    <button
                      onClick={
                        uploadAndAnalyzeRecording
                      }
                      disabled={voiceLoading}
                    >
                      {voiceLoading
                        ? "Analyzing..."
                        : "Analyze Recording"}
                    </button>
                  </div>
                )}

                {voiceAnalysis && (
                  <div className="voice-analysis">
                    {voiceAnalysis.error ? (
                      <div className="analysis-error">
                        <X size={17} />
                        {voiceAnalysis.error}
                      </div>
                    ) : (
                      <>
                        <div className="voice-score">
                          <span>AI Voice Analysis</span>

                          <strong>
                            {voiceAnalysis.stability ??
                              0}
                            %
                          </strong>
                        </div>

                        <div className="voice-progress">
                          <div
                            style={{
                              width: `${
                                voiceAnalysis.stability ??
                                0
                              }%`,
                            }}
                          />
                        </div>

                        <p>
                          {(
                            voiceAnalysis.stability ??
                            0
                          ) >= 85
                            ? "Excellent voice stability!"
                            : (
                                voiceAnalysis.stability ??
                                0
                              ) >= 65
                            ? "Good progress. Keep practicing!"
                            : "Keep practicing your voice control."}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* =====================================================
          LESSON MODAL
          ===================================================== */}

      {selectedLesson && (
        <div
          className="lesson-modal-backdrop"
          onClick={closeLesson}
        >
          <div
            className="lesson-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={closeLesson}
            >
              <X size={20} />
            </button>

            <div className="modal-header">
              <div className="modal-lesson-number">
                LESSON {selectedLesson.id}
              </div>

              <h2>{selectedLesson.title}</h2>

              <p>
                {selectedLesson.description}
              </p>
            </div>

            <div className="lesson-video">
              <video
                controls
                preload="metadata"
                src={selectedLesson.video}
              />

              <div className="video-fallback">
                <CirclePlay size={22} />
                Lesson Video
              </div>
            </div>

            <div className="lesson-theory">
              <h3>What you'll learn</h3>

              {selectedLesson.theory.map(
                (point, index) => (
                  <div
                    className="theory-point"
                    key={index}
                  >
                    <span>{index + 1}</span>
                    <p>{point}</p>
                  </div>
                )
              )}
            </div>

            {!lessonCompleted && (
              <div className="lesson-quiz">
                <div className="quiz-header">
                  <span>QUICK CHECK</span>
                  <strong>
                    Test what you learned
                  </strong>
                </div>

                <h3>
                  {selectedLesson.question}
                </h3>

                <div className="quiz-options">
                  {selectedLesson.options.map(
                    (option, index) => {
                      let className =
                        "quiz-option";

                      if (
                        selectedAnswer ===
                        index
                      ) {
                        className += " selected";
                      }

                      if (
                        quizSubmitted &&
                        index ===
                          selectedLesson.answer
                      ) {
                        className += " correct";
                      }

                      if (
                        quizSubmitted &&
                        selectedAnswer ===
                          index &&
                        index !==
                          selectedLesson.answer
                      ) {
                        className += " wrong";
                      }

                      return (
                        <button
                          key={index}
                          className={className}
                          onClick={() =>
                            handleAnswer(
                              index
                            )
                          }
                          disabled={
                            quizSubmitted
                          }
                        >
                          <span>
                            {String.fromCharCode(
                              65 + index
                            )}
                          </span>

                          {option}

                          {quizSubmitted &&
                            index ===
                              selectedLesson.answer && (
                              <Check
                                size={18}
                              />
                            )}

                          {quizSubmitted &&
                            selectedAnswer ===
                              index &&
                            index !==
                              selectedLesson.answer && (
                              <X
                                size={18}
                              />
                            )}
                        </button>
                      );
                    }
                  )}
                </div>

                {quizSubmitted && (
                  <div
                    className={`quiz-feedback ${
                      isCorrect
                        ? "correct"
                        : "wrong"
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <Check size={17} />
                        <strong>
                          Correct answer!
                        </strong>
                      </>
                    ) : (
                      <>
                        <X size={17} />
                        <strong>
                          Incorrect answer.
                        </strong>
                      </>
                    )}
                  </div>
                )}

                {quizSubmitted &&
                  !isCorrect && (
                    <button
                      className="retry-button"
                      onClick={retryQuiz}
                    >
                      <RotateCcw size={16} />
                      Try Again
                    </button>
                  )}

                {quizSubmitted &&
                  isCorrect && (
                    <button
                      className="complete-lesson-button"
                      onClick={completeLesson}
                    >
                      Complete Lesson
                      <ArrowRight size={18} />
                    </button>
                  )}
              </div>
            )}

            {lessonCompleted && (
              <div className="lesson-completed-box">
                <div className="lesson-completed-icon">
                  <Check size={28} />
                </div>

                <div>
                  <strong>
                    Lesson completed!
                  </strong>

                  <p>
                    +{selectedLesson.xp} XP earned.
                  </p>
                </div>

                <button
                  onClick={closeLesson}
                  className="complete-lesson-button"
                >
                  Continue
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          FINAL AWAKENING
          ===================================================== */}

      {showCelebration && (
        <div className="celebration-backdrop">
          <div className="celebration-card">
            <div className="celebration-icon">
              <Sparkles size={35} />
            </div>

            <div className="celebration-mini-singer">
              <img
                src="/singer.png"
                alt="Awakened musician"
              />
            </div>

            <span className="celebration-label">
              6 / 6 LESSONS COMPLETE
            </span>

            <h2>
              The Musician Inside You
              <span> Has Awakened!</span>
            </h2>

            <p>
              You completed your entire beginner
              music journey. Your musician is now
              fully alive.
            </p>

            <div className="celebration-stats">
              <div>
                <Trophy size={18} />
                <strong>
                  {progress.xp} XP
                </strong>
                <span>Earned</span>
              </div>

              <div>
                <Star size={18} />
                <strong>6 / 6</strong>
                <span>Lessons</span>
              </div>

              <div>
                <Music2 size={18} />
                <strong>100%</strong>
                <span>Awakened</span>
              </div>
            </div>

            <button
              className="celebration-close"
              onClick={() =>
                setShowCelebration(false)
              }
            >
              Continue My Musical Journey
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Music;
