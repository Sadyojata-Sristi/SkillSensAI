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
  Play,
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

const LESSONS = [
  {
    id: 1,
    title: "Understanding Pitch",
    shortTitle: "Pitch",
    description:
      "Learn what pitch is and how high and low sounds are created.",
    duration: "5 min",
    xp: 100,
    color: "#9b5cff",
    video: "/lessons/music/pitch.mp4",
    theory: [
      "Pitch tells us how high or low a sound feels.",
      "Higher frequency produces a higher perceived pitch.",
      "Lower frequency produces a lower perceived pitch.",
      "Good singers learn to recognize and reproduce different pitches.",
    ],
    quiz: {
      question: "What mainly determines the pitch of a sound?",
      options: [
        "Frequency",
        "Volume",
        "Duration",
        "Room size",
      ],
      answer: 0,
    },
  },
  {
    id: 2,
    title: "Voice Control",
    shortTitle: "Voice Control",
    description:
      "Understand breathing, vocal control and how to produce a stable sound.",
    duration: "6 min",
    xp: 120,
    color: "#b25cff",
    video: "/lessons/music/voice-control.mp4",
    theory: [
      "Controlled breathing helps maintain a steady voice.",
      "Relax your shoulders and avoid unnecessary tension.",
      "Start with comfortable notes instead of forcing your range.",
      "Consistency is more important than volume.",
    ],
    quiz: {
      question: "Which helps maintain better vocal control?",
      options: [
        "Controlled breathing",
        "Shouting louder",
        "Holding your breath",
        "Tensing your shoulders",
      ],
      answer: 0,
    },
  },
  {
    id: 3,
    title: "Musical Notes",
    shortTitle: "Notes",
    description:
      "Get familiar with musical notes and how they relate to pitch.",
    duration: "7 min",
    xp: 140,
    color: "#8d67ff",
    video: "/lessons/music/musical-notes.mp4",
    theory: [
      "The basic note names are Sa, Re, Ga, Ma, Pa, Dha and Ni in Indian music.",
      "Notes represent specific pitch positions.",
      "Different note combinations create melodies.",
      "Listening carefully helps you recognize note relationships.",
    ],
    quiz: {
      question: "Which sequence contains the basic Indian musical notes?",
      options: [
        "Sa Re Ga Ma Pa Dha Ni",
        "Do Re Mi Fa Sol",
        "A B C D E F G",
        "One Two Three Four",
      ],
      answer: 0,
    },
  },
  {
    id: 4,
    title: "Rhythm Basics",
    shortTitle: "Rhythm",
    description:
      "Learn timing, beats and how rhythm keeps music together.",
    duration: "6 min",
    xp: 160,
    color: "#735fff",
    video: "/lessons/music/rhythm.mp4",
    theory: [
      "Rhythm is the organization of sounds and silences over time.",
      "A beat gives music a regular pulse.",
      "Counting helps you stay synchronized with the music.",
      "Start slowly and increase speed only after your timing becomes stable.",
    ],
    quiz: {
      question: "What does rhythm mainly organize?",
      options: [
        "Sounds and silences over time",
        "Only volume",
        "Only pitch",
        "Only lyrics",
      ],
      answer: 0,
    },
  },
  {
    id: 5,
    title: "Pitch Matching",
    shortTitle: "Pitch Matching",
    description:
      "Practice listening to a reference pitch and matching it with your voice.",
    duration: "8 min",
    xp: 180,
    color: "#655cff",
    video: "/lessons/music/pitch-matching.mp4",
    theory: [
      "Listen to the reference sound before singing.",
      "Try to identify whether your voice is above or below the target.",
      "Make small adjustments instead of changing pitch dramatically.",
      "Repeated practice improves pitch awareness and control.",
    ],
    quiz: {
      question: "What should you do first when trying to match a reference pitch?",
      options: [
        "Listen carefully to the reference",
        "Sing as loudly as possible",
        "Ignore the reference",
        "Immediately sing a random note",
      ],
      answer: 0,
    },
  },
  {
    id: 6,
    title: "Your First Performance",
    shortTitle: "Performance",
    description:
      "Combine pitch, voice control and rhythm in your first complete performance.",
    duration: "10 min",
    xp: 250,
    color: "#ff4fb8",
    video: "/lessons/music/first-performance.mp4",
    theory: [
      "Use controlled breathing throughout the performance.",
      "Keep your pitch stable and listen to yourself.",
      "Maintain the rhythm instead of rushing.",
      "Focus on consistency, confidence and musical expression.",
    ],
    quiz: {
      question: "What should you focus on during your first performance?",
      options: [
        "Pitch, rhythm, control and expression",
        "Only singing loudly",
        "Only speed",
        "Ignoring mistakes completely",
      ],
      answer: 0,
    },
  },
];

const INITIAL_PROGRESS = {
  completedLessons: [],
  xp: 0,
  streak: 0,
  lastPracticeDate: null,
};

function loadProgress() {
  try {
    const saved = localStorage.getItem("skillsensai_music_progress");

    if (!saved) {
      return INITIAL_PROGRESS;
    }

    const parsed = JSON.parse(saved);

    return {
      ...INITIAL_PROGRESS,
      ...parsed,
      completedLessons: Array.isArray(parsed.completedLessons)
        ? parsed.completedLessons
        : [],
    };
  } catch {
    return INITIAL_PROGRESS;
  }
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function updateStreak(previousDate, currentStreak) {
  const today = getTodayString();

  if (previousDate === today) {
    return currentStreak;
  }

  if (previousDate) {
    const previous = new Date(previousDate);
    const current = new Date(today);

    const difference =
      (current.getTime() - previous.getTime()) /
      (1000 * 60 * 60 * 24);

    if (difference === 1) {
      return currentStreak + 1;
    }
  }

  return Math.max(1, currentStreak);
}

function Music() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("scratch");

  const [progress, setProgress] = useState(loadProgress);

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonStep, setLessonStep] = useState("lesson");

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [recordingUrl, setRecordingUrl] = useState("");

  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const [songFile, setSongFile] = useState(null);
  const [songAnalysis, setSongAnalysis] = useState(null);
  const [songLoading, setSongLoading] = useState(false);
  const [songError, setSongError] = useState("");

  const [celebration, setCelebration] = useState(false);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    localStorage.setItem(
      "skillsensai_music_progress",
      JSON.stringify(progress)
    );
  }, [progress]);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
    };
  }, [recordingUrl]);

  const completedCount = progress.completedLessons.length;

  const progressPercent = Math.round(
    (completedCount / LESSONS.length) * 100
  );

  const currentLevel = Math.max(
    1,
    Math.floor(progress.xp / 300) + 1
  );

  const xpIntoLevel = progress.xp % 300;

  const nextLesson = useMemo(() => {
    return LESSONS.find(
      (lesson) => !progress.completedLessons.includes(lesson.id)
    );
  }, [progress.completedLessons]);

  const isFullyAwakened =
    completedCount === LESSONS.length;

  const characterStage = Math.min(
    6,
    completedCount
  );

  const openLesson = (lesson) => {
    const previousLesson = LESSONS.find(
      (item) => item.id === lesson.id - 1
    );

    const unlocked =
      lesson.id === 1 ||
      progress.completedLessons.includes(previousLesson?.id);

    if (!unlocked) {
      return;
    }

    setSelectedLesson(lesson);
    setLessonStep("lesson");
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setRecordingBlob(null);
    setAnalysis(null);
    setAnalysisError("");
  };

  const closeLesson = () => {
    setSelectedLesson(null);
    setLessonStep("lesson");
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setAnalysis(null);
    setAnalysisError("");
  };

  const startQuiz = () => {
    setLessonStep("quiz");
    setSelectedAnswer(null);
    setQuizSubmitted(false);
  };

  const submitQuiz = () => {
    if (selectedAnswer === null) {
      return;
    }

    setQuizSubmitted(true);
  };

  const retryQuiz = () => {
    setSelectedAnswer(null);
    setQuizSubmitted(false);
  };

  const completeLesson = () => {
    if (!selectedLesson) {
      return;
    }

    if (progress.completedLessons.includes(selectedLesson.id)) {
      closeLesson();
      return;
    }

    const newCompleted = [
      ...progress.completedLessons,
      selectedLesson.id,
    ].sort((a, b) => a - b);

    const newStreak = updateStreak(
      progress.lastPracticeDate,
      progress.streak
    );

    const wasFinalLesson =
      newCompleted.length === LESSONS.length;

    setProgress((previous) => ({
      ...previous,
      completedLessons: newCompleted,
      xp: previous.xp + selectedLesson.xp,
      streak: newStreak,
      lastPracticeDate: getTodayString(),
    }));

    if (wasFinalLesson) {
      setCelebration(true);
    }

    closeLesson();
  };

  const resetProgress = () => {
    const confirmed = window.confirm(
      "Reset all Learn From Scratch progress?"
    );

    if (!confirmed) {
      return;
    }

    setProgress(INITIAL_PROGRESS);
    localStorage.removeItem("skillsensai_music_progress");
    setCelebration(false);
  };

  const startRecording = async () => {
    try {
      setAnalysisError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(blob);

        setRecordingBlob(blob);
        setRecordingUrl(url);

        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      };

      mediaRecorderRef.current = recorder;

      recorder.start();
      setIsRecording(true);
    } catch {
      setAnalysisError(
        "Microphone access was not available. Please allow microphone permission and try again."
      );
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) {
      return;
    }

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleRecordingUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
    }

    setRecordingBlob(file);
    setRecordingUrl(URL.createObjectURL(file));
    setAnalysis(null);
    setAnalysisError("");
  };

  const analyzeVoice = async () => {
    if (!recordingBlob) {
      setAnalysisError("Please record or upload a recording first.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError("");

      const formData = new FormData();

      formData.append(
        "file",
        recordingBlob,
        recordingBlob.name || "recording.webm"
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

      setAnalysis(data);
    } catch {
      setAnalysisError(
        "Unable to analyze the recording. Please make sure the backend is running and try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSongUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSongFile(file);
    setSongAnalysis(null);
    setSongError("");
  };

  const analyzeSong = async () => {
    if (!songFile) {
      setSongError("Please upload a song first.");
      return;
    }

    try {
      setSongLoading(true);
      setSongError("");

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
    } catch {
      setSongError(
        "Unable to analyze the song. Please make sure the backend is running."
      );
    } finally {
      setSongLoading(false);
    }
  };

  const renderPitchGraph = (points) => {
    if (!points || points.length === 0) {
      return (
        <div className="empty-analysis">
          No pitch data available.
        </div>
      );
    }

    const width = 700;
    const height = 220;

    const values = points
      .map((point) => {
        if (typeof point === "number") {
          return point;
        }

        return (
          point.pitch ??
          point.frequency ??
          point.value ??
          0
        );
      })
      .filter((value) => Number.isFinite(value) && value > 0);

    if (values.length === 0) {
      return (
        <div className="empty-analysis">
          No usable pitch data available.
        </div>
      );
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1);

    const path = values
      .map((value, index) => {
        const x =
          (index / Math.max(values.length - 1, 1)) *
          width;

        const y =
          height -
          ((value - min) / range) * (height - 25) -
          10;

        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    return (
      <div className="pitch-graph">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="pitchGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#8c5cff" />
              <stop offset="100%" stopColor="#ff4fb8" />
            </linearGradient>
          </defs>

          <path
            d={path}
            fill="none"
            stroke="url(#pitchGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  };

  const getAccuracy = () => {
    if (!analysis) {
      return null;
    }

    if (typeof analysis.accuracy === "number") {
      return Math.round(analysis.accuracy);
    }

    if (typeof analysis.pitch_accuracy === "number") {
      return Math.round(analysis.pitch_accuracy);
    }

    return null;
  };

  const accuracy = getAccuracy();

  return (
    <div className="music-page">
      <header className="music-navbar">
        <button
          className="back-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={18} />
          Home
        </button>

        <div className="music-brand">
          <div className="music-brand-icon">
            <Music2 size={22} />
          </div>

          <div>
            <h1>
              SkillSens<span>AI</span>
            </h1>
            <p>Music Learning Studio</p>
          </div>
        </div>

        <div className="music-navbar-xp">
          <div className="mini-xp">
            <Zap size={15} />
            <span>{progress.xp} XP</span>
          </div>

          <div className="mini-streak">
            <Flame size={15} />
            <span>{progress.streak}</span>
          </div>
        </div>
      </header>

      <main className="music-content">
        <section className="music-hero">
          <div>
            <span className="eyebrow">
              AI-POWERED MUSIC LEARNING
            </span>

            <h2>
              Find Your <span>Voice.</span>
              <br />
              Master Your <span>Music.</span>
            </h2>

            <p>
              Learn from the basics, practice with AI and
              watch your musician come to life.
            </p>
          </div>

          <div className="music-mode-switch">
            <button
              className={mode === "scratch" ? "active" : ""}
              onClick={() => setMode("scratch")}
            >
              <Sparkles size={17} />
              Learn From Scratch
            </button>

            <button
              className={mode === "song" ? "active" : ""}
              onClick={() => setMode("song")}
            >
              <Music2 size={17} />
              Learn a Song
            </button>
          </div>
        </section>

        {mode === "scratch" ? (
          <>
            <section className="progress-dashboard">
              <div className="progress-character-card">
                <div
                  className={`awakening-character stage-${characterStage} ${
                    isFullyAwakened ? "fully-awakened" : ""
                  }`}
                >
                  <div className="character-aura aura-one"></div>
                  <div className="character-aura aura-two"></div>

                  <div className="musician-silhouette">
                    <div className="musician-head"></div>
                    <div className="musician-body"></div>
                    <div className="musician-arm"></div>
                    <div className="musician-instrument"></div>
                  </div>

                  {isFullyAwakened && (
                    <div className="music-particles">
                      <span>♪</span>
                      <span>♫</span>
                      <span>♬</span>
                      <span>♪</span>
                      <span>♫</span>
                      <span>♩</span>
                    </div>
                  )}
                </div>

                <div className="character-info">
                  <span className="character-label">
                    YOUR MUSICIAN
                  </span>

                  <h3>
                    {isFullyAwakened
                      ? "Musician Awakened!"
                      : "Bring the Musician to Life"}
                  </h3>

                  <p>
                    Complete lessons to gradually awaken
                    your musician.
                  </p>

                  <div className="awakening-progress">
                    <div className="awakening-progress-top">
                      <span>
                        Awakening Progress
                      </span>
                      <strong>
                        {completedCount}/{LESSONS.length}
                      </strong>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${progressPercent}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="stats-grid">
                <div className="music-stat">
                  <div className="stat-symbol purple">
                    <Zap size={19} />
                  </div>
                  <div>
                    <span>Total XP</span>
                    <strong>{progress.xp}</strong>
                  </div>
                </div>

                <div className="music-stat">
                  <div className="stat-symbol orange">
                    <Flame size={19} />
                  </div>
                  <div>
                    <span>Streak</span>
                    <strong>{progress.streak} days</strong>
                  </div>
                </div>

                <div className="music-stat">
                  <div className="stat-symbol pink">
                    <Trophy size={19} />
                  </div>
                  <div>
                    <span>Level</span>
                    <strong>{currentLevel}</strong>
                  </div>
                </div>

                <div className="music-stat">
                  <div className="stat-symbol blue">
                    <Star size={19} />
                  </div>
                  <div>
                    <span>Lessons</span>
                    <strong>
                      {completedCount}/{LESSONS.length}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="level-progress">
                <div className="level-progress-top">
                  <span>
                    Level {currentLevel}
                  </span>
                  <span>
                    {xpIntoLevel}/300 XP
                  </span>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(xpIntoLevel / 300) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </section>

            <section className="lessons-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    YOUR LEARNING PATH
                  </span>

                  <h3>Learn From Scratch</h3>

                  <p>
                    Complete each lesson to unlock the
                    next stage of your musical journey.
                  </p>
                </div>

                <button
                  className="reset-progress-button"
                  onClick={resetProgress}
                >
                  <RotateCcw size={15} />
                  Reset Progress
                </button>
              </div>

              <div className="lesson-path">
                {LESSONS.map((lesson, index) => {
                  const completed =
                    progress.completedLessons.includes(
                      lesson.id
                    );

                  const previousLesson =
                    LESSONS[index - 1];

                  const unlocked =
                    lesson.id === 1 ||
                    progress.completedLessons.includes(
                      previousLesson?.id
                    );

                  return (
                    <React.Fragment key={lesson.id}>
                      <button
                        className={`lesson-card ${
                          completed ? "completed" : ""
                        } ${
                          !unlocked ? "locked" : ""
                        }`}
                        onClick={() =>
                          openLesson(lesson)
                        }
                        disabled={!unlocked}
                        style={{
                          "--lesson-color":
                            lesson.color,
                        }}
                      >
                        <div className="lesson-number">
                          {completed ? (
                            <Check size={21} />
                          ) : unlocked ? (
                            lesson.id
                          ) : (
                            <Lock size={18} />
                          )}
                        </div>

                        <div className="lesson-main">
                          <div className="lesson-top">
                            <span>
                              LESSON {lesson.id}
                            </span>

                            <div className="lesson-meta">
                              <span>
                                <CirclePlay
                                  size={13}
                                />
                                {lesson.duration}
                              </span>

                              <span>
                                <Zap size={13} />
                                +{lesson.xp} XP
                              </span>
                            </div>
                          </div>

                          <h4>{lesson.title}</h4>

                          <p>
                            {lesson.description}
                          </p>

                          <div className="lesson-status">
                            {completed ? (
                              <>
                                <Check size={14} />
                                Completed
                              </>
                            ) : unlocked ? (
                              <>
                                Start Lesson
                                <ChevronRight
                                  size={14}
                                />
                              </>
                            ) : (
                              <>
                                Complete previous lesson
                                <Lock size={13} />
                              </>
                            )}
                          </div>
                        </div>
                      </button>

                      {index < LESSONS.length - 1 && (
                        <div
                          className={`path-connector ${
                            progress.completedLessons.includes(
                              lesson.id
                            )
                              ? "active"
                              : ""
                          }`}
                        >
                          <ChevronRight size={18} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {nextLesson && (
                <div className="next-lesson-banner">
                  <div>
                    <span>NEXT STEP</span>
                    <strong>
                      {nextLesson.title}
                    </strong>
                  </div>

                  <button
                    onClick={() =>
                      openLesson(nextLesson)
                    }
                  >
                    Continue
                    <ArrowRight size={17} />
                  </button>
                </div>
              )}

              {isFullyAwakened && (
                <div className="awakened-banner">
                  <Sparkles size={22} />

                  <div>
                    <strong>
                      Musician Fully Awakened
                    </strong>
                    <p>
                      You completed the entire Learn From
                      Scratch journey.
                    </p>
                  </div>

                  <Trophy size={25} />
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="song-learning-section">
            <div className="song-card">
              <div className="song-card-header">
                <div>
                  <span className="eyebrow">
                    LEARN A SONG
                  </span>

                  <h3>Analyze Your Song</h3>

                  <p>
                    Upload a song and let SkillSensAI
                    analyze its pitch structure.
                  </p>
                </div>

                <div className="song-icon-large">
                  <Music2 size={30} />
                </div>
              </div>

              <label className="upload-zone">
                <Upload size={30} />

                <strong>
                  {songFile
                    ? songFile.name
                    : "Upload your song"}
                </strong>

                <span>
                  MP3, WAV or supported audio format
                </span>

                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleSongUpload}
                />
              </label>

              <button
                className="primary-music-button"
                onClick={analyzeSong}
                disabled={!songFile || songLoading}
              >
                {songLoading ? (
                  "Analyzing..."
                ) : (
                  <>
                    Analyze Song
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {songError && (
                <div className="error-message">
                  {songError}
                </div>
              )}

              {songAnalysis && (
                <div className="song-analysis">
                  <div className="analysis-header">
                    <div>
                      <span className="eyebrow">
                        AI ANALYSIS
                      </span>
                      <h4>Pitch Map</h4>
                    </div>

                    <Volume2 size={22} />
                  </div>

                  {renderPitchGraph(
                    songAnalysis.pitch_data
                  )}

                  <div className="analysis-summary">
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
                        {songAnalysis.pitch_data
                          ?.length || 0}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="practice-card">
              <div className="practice-card-header">
                <div className="practice-icon">
                  <Mic size={23} />
                </div>

                <div>
                  <h3>Practice Your Voice</h3>
                  <p>
                    Record yourself or upload a recording
                    for AI feedback.
                  </p>
                </div>
              </div>

              <div className="practice-actions">
                {!isRecording ? (
                  <button
                    className="practice-action primary"
                    onClick={startRecording}
                  >
                    <Mic size={20} />
                    Record Live
                  </button>
                ) : (
                  <button
                    className="practice-action recording"
                    onClick={stopRecording}
                  >
                    <Pause size={20} />
                    Stop Recording
                  </button>
                )}

                <label className="practice-action">
                  <Upload size={20} />
                  Upload Recording
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleRecordingUpload}
                  />
                </label>
              </div>

              {recordingUrl && (
                <div className="recording-preview">
                  <audio
                    src={recordingUrl}
                    controls
                  />

                  <button
                    className="analyze-recording-button"
                    onClick={analyzeVoice}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing
                      ? "Analyzing..."
                      : "Analyze Recording"}
                  </button>
                </div>
              )}

              {analysisError && (
                <div className="error-message">
                  {analysisError}
                </div>
              )}

              {analysis && (
                <div className="voice-analysis">
                  <div className="voice-score">
                    <div className="score-circle">
                      <strong>
                        {accuracy ?? "--"}
                      </strong>
                      <span>%</span>
                    </div>

                    <div>
                      <span>Voice Analysis</span>
                      <h4>
                        {accuracy >= 90
                          ? "Excellent!"
                          : accuracy >= 75
                          ? "Great progress!"
                          : "Keep practicing!"}
                      </h4>
                    </div>
                  </div>

                  {renderPitchGraph(
                    analysis.pitch_data ||
                      analysis.pitch_points
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {selectedLesson && (
        <div className="lesson-modal-overlay">
          <div className="lesson-modal">
            <button
              className="modal-close"
              onClick={closeLesson}
            >
              <X size={20} />
            </button>

            <div
              className="modal-lesson-number"
              style={{
                "--lesson-color":
                  selectedLesson.color,
              }}
            >
              {selectedLesson.id}
            </div>

            <span className="eyebrow">
              LESSON {selectedLesson.id}
            </span>

            <h3>{selectedLesson.title}</h3>

            {lessonStep === "lesson" && (
              <>
                <p className="modal-description">
                  {selectedLesson.description}
                </p>

                <div className="lesson-video">
                  <video
                    controls
                    preload="metadata"
                    src={selectedLesson.video}
                  />

                  <div className="video-fallback">
                    <CirclePlay size={26} />
                    <span>
                      Lesson video
                    </span>
                  </div>
                </div>

                <div className="theory-grid">
                  {selectedLesson.theory.map(
                    (point, index) => (
                      <div
                        className="theory-point"
                        key={index}
                      >
                        <div>
                          {index + 1}
                        </div>
                        <p>{point}</p>
                      </div>
                    )
                  )}
                </div>

                <div className="lesson-modal-actions">
                  <button
                    className="secondary-modal-button"
                    onClick={closeLesson}
                  >
                    Close
                  </button>

                  <button
                    className="primary-music-button"
                    onClick={startQuiz}
                  >
                    Take Quiz
                    <ArrowRight size={18} />
                  </button>
                </div>
              </>
            )}

            {lessonStep === "quiz" && (
              <div className="quiz-container">
                <div className="quiz-progress">
                  <span>
                    Quick Check
                  </span>

                  <span>
                    +{selectedLesson.xp} XP
                  </span>
                </div>

                <h4>
                  {selectedLesson.quiz.question}
                </h4>

                <div className="quiz-options">
                  {selectedLesson.quiz.options.map(
                    (option, index) => {
                      const isSelected =
                        selectedAnswer === index;

                      const isCorrect =
                        index ===
                        selectedLesson.quiz.answer;

                      let stateClass = "";

                      if (quizSubmitted && isCorrect) {
                        stateClass = "correct";
                      }

                      if (
                        quizSubmitted &&
                        isSelected &&
                        !isCorrect
                      ) {
                        stateClass = "wrong";
                      }

                      return (
                        <button
                          key={option}
                          className={`quiz-option ${
                            isSelected
                              ? "selected"
                              : ""
                          } ${stateClass}`}
                          onClick={() =>
                            !quizSubmitted &&
                            setSelectedAnswer(
                              index
                            )
                          }
                          disabled={quizSubmitted}
                        >
                          <span className="option-letter">
                            {String.fromCharCode(
                              65 + index
                            )}
                          </span>

                          <span>
                            {option}
                          </span>

                          {quizSubmitted &&
                            isCorrect && (
                              <Check size={18} />
                            )}

                          {quizSubmitted &&
                            isSelected &&
                            !isCorrect && (
                              <X size={18} />
                            )}
                        </button>
                      );
                    }
                  )}
                </div>

                {quizSubmitted && (
                  <div
                    className={`quiz-result ${
                      selectedAnswer ===
                      selectedLesson.quiz.answer
                        ? "success"
                        : "failure"
                    }`}
                  >
                    {selectedAnswer ===
                    selectedLesson.quiz.answer ? (
                      <>
                        <Check size={21} />
                        <div>
                          <strong>
                            Correct!
                          </strong>
                          <p>
                            You can now continue your
                            music journey.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <RotateCcw size={21} />
                        <div>
                          <strong>
                            Not quite yet.
                          </strong>
                          <p>
                            Review the lesson and try
                            the quiz again.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="lesson-modal-actions">
                  {!quizSubmitted ? (
                    <>
                      <button
                        className="secondary-modal-button"
                        onClick={() =>
                          setLessonStep("lesson")
                        }
                      >
                        Back
                      </button>

                      <button
                        className="primary-music-button"
                        onClick={submitQuiz}
                        disabled={
                          selectedAnswer === null
                        }
                      >
                        Check Answer
                        <Check size={18} />
                      </button>
                    </>
                  ) : selectedAnswer ===
                    selectedLesson.quiz.answer ? (
                    <button
                      className="primary-music-button wide"
                      onClick={completeLesson}
                    >
                      Complete Lesson
                      <Sparkles size={18} />
                    </button>
                  ) : (
                    <>
                      <button
                        className="secondary-modal-button"
                        onClick={() =>
                          setLessonStep("lesson")
                        }
                      >
                        Review Lesson
                      </button>

                      <button
                        className="primary-music-button"
                        onClick={retryQuiz}
                      >
                        Retry Quiz
                        <RotateCcw size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {celebration && (
        <div className="celebration-overlay">
          <div className="celebration-card">
            <div className="celebration-particles">
              <span>♪</span>
              <span>♫</span>
              <span>♬</span>
              <span>✦</span>
              <span>♪</span>
              <span>♫</span>
            </div>

            <div className="celebration-icon">
              <Trophy size={38} />
            </div>

            <span className="eyebrow">
              MILESTONE UNLOCKED
            </span>

            <h2>
              Musician
              <span> Awakened!</span>
            </h2>

            <p>
              You completed every Learn From Scratch
              lesson. Your musician has fully come to life.
            </p>

            <div className="celebration-reward">
              <Zap size={20} />
              <strong>
                +{LESSONS.reduce(
                  (total, lesson) =>
                    total + lesson.xp,
                  0
                )} XP earned
              </strong>
            </div>

            <button
              className="primary-music-button"
              onClick={() =>
                setCelebration(false)
              }
            >
              Continue Journey
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Music;
