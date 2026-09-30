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
  Play,
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
      "Learn how high and low sounds work and begin identifying pitch with your own voice.",
    duration: "5 min",
    xp: 100,
    color: "#8b5cf6",
    video: "/lessons/music/pitch.mp4",
    theory: [
      "Pitch tells us how high or low a sound feels.",
      "Higher frequency creates a higher perceived pitch.",
      "Lower frequency creates a lower perceived pitch.",
      "A singer needs to recognize and reproduce different pitches.",
    ],
    singingTask:
      "Sing a comfortable sustained note for a few seconds. Try to keep your pitch as steady as possible.",
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
      "Learn breathing and vocal control techniques to produce a stable and comfortable voice.",
    duration: "6 min",
    xp: 120,
    color: "#a855f7",
    video: "/lessons/music/voice-control.mp4",
    theory: [
      "Controlled breathing helps maintain a steady voice.",
      "Relax your shoulders and avoid unnecessary tension.",
      "Use a comfortable vocal range while practicing.",
      "Consistency matters more than singing loudly.",
    ],
    singingTask:
      "Take a relaxed breath and sing one comfortable note. Focus on keeping the sound smooth and stable.",
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
      "Understand basic musical notes and how different notes create melodies.",
    duration: "7 min",
    xp: 140,
    color: "#7c3aed",
    video: "/lessons/music/musical-notes.mp4",
    theory: [
      "Basic Indian musical notes are Sa, Re, Ga, Ma, Pa, Dha and Ni.",
      "Each note represents a pitch position.",
      "Different note combinations create melodies.",
      "Listening carefully improves your ability to recognize notes.",
    ],
    singingTask:
      "Try singing Sa → Re → Ga slowly. Focus on clearly moving from one note to the next.",
    quiz: {
      question:
        "Which sequence contains the basic Indian musical notes?",
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
      "Learn beats, timing and how rhythm keeps a musical performance together.",
    duration: "6 min",
    xp: 160,
    color: "#6366f1",
    video: "/lessons/music/rhythm.mp4",
    theory: [
      "Rhythm organizes sounds and silences over time.",
      "A beat provides a regular musical pulse.",
      "Counting helps you stay synchronized.",
      "Start slowly before increasing your speed.",
    ],
    singingTask:
      "Sing a simple note pattern while keeping a steady beat. Focus on staying in time.",
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
      "Train your ear and voice to reproduce a reference pitch accurately.",
    duration: "8 min",
    xp: 180,
    color: "#4f46e5",
    video: "/lessons/music/pitch-matching.mp4",
    theory: [
      "Listen carefully to the reference pitch before singing.",
      "Identify whether your voice is above or below the target.",
      "Make small pitch adjustments.",
      "Repeated practice improves pitch awareness.",
    ],
    singingTask:
      "Sing along with a reference note and try to match it as accurately as possible.",
    quiz: {
      question:
        "What should you do first when trying to match a reference pitch?",
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
      "Combine pitch, rhythm and voice control in your first complete performance.",
    duration: "10 min",
    xp: 250,
    color: "#ec4899",
    video: "/lessons/music/first-performance.mp4",
    theory: [
      "Use controlled breathing throughout the performance.",
      "Keep your pitch stable.",
      "Maintain rhythm instead of rushing.",
      "Focus on consistency, confidence and expression.",
    ],
    singingTask:
      "Perform a short song or melody using everything you have learned so far.",
    quiz: {
      question:
        "What should you focus on during your first performance?",
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

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function loadProgress() {
  try {
    const saved = localStorage.getItem(
      "skillsensai_music_progress"
    );

    if (!saved) return INITIAL_PROGRESS;

    const parsed = JSON.parse(saved);

    return {
      ...INITIAL_PROGRESS,
      ...parsed,
      completedLessons: Array.isArray(
        parsed.completedLessons
      )
        ? parsed.completedLessons
        : [],
    };
  } catch {
    return INITIAL_PROGRESS;
  }
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

  const [selectedLesson, setSelectedLesson] =
    useState(null);

  const [lessonStep, setLessonStep] =
    useState("lesson");

  const [selectedAnswer, setSelectedAnswer] =
    useState(null);

  const [quizSubmitted, setQuizSubmitted] =
    useState(false);

  const [isRecording, setIsRecording] =
    useState(false);

  const [recordingBlob, setRecordingBlob] =
    useState(null);

  const [recordingUrl, setRecordingUrl] =
    useState("");

  const [analysis, setAnalysis] =
    useState(null);

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [analysisError, setAnalysisError] =
    useState("");

  const [songFile, setSongFile] =
    useState(null);

  const [songAnalysis, setSongAnalysis] =
    useState(null);

  const [songLoading, setSongLoading] =
    useState(false);

  const [songError, setSongError] =
    useState("");

  const [celebration, setCelebration] =
    useState(false);

  const mediaRecorderRef =
    useRef(null);

  const mediaStreamRef =
    useRef(null);

  const chunksRef =
    useRef([]);

  useEffect(() => {
    localStorage.setItem(
      "skillsensai_music_progress",
      JSON.stringify(progress)
    );
  }, [progress]);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
    };
  }, [recordingUrl]);

  const completedCount =
    progress.completedLessons.length;

  const progressPercent = Math.round(
    (completedCount / LESSONS.length) * 100
  );

  const currentLevel = Math.max(
    1,
    Math.floor(progress.xp / 300) + 1
  );

  const xpIntoLevel =
    progress.xp % 300;

  const nextLesson = useMemo(() => {
    return LESSONS.find(
      (lesson) =>
        !progress.completedLessons.includes(
          lesson.id
        )
    );
  }, [progress.completedLessons]);

  const isFullyAwakened =
    completedCount === LESSONS.length;

  const characterStage = Math.min(
    completedCount,
    6
  );

  const openLesson = (lesson) => {
    const previousLesson =
      LESSONS.find(
        (item) => item.id === lesson.id - 1
      );

    const unlocked =
      lesson.id === 1 ||
      progress.completedLessons.includes(
        previousLesson?.id
      );

    if (!unlocked) return;

    setSelectedLesson(lesson);
    setLessonStep("lesson");
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setAnalysis(null);
    setAnalysisError("");
    setRecordingBlob(null);

    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
    }

    setRecordingUrl("");
  };

  const closeLesson = () => {
    setSelectedLesson(null);
    setLessonStep("lesson");
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setAnalysis(null);
    setAnalysisError("");

    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
    }

    setRecordingUrl("");
    setRecordingBlob(null);
  };

  const startQuiz = () => {
    setLessonStep("quiz");
    setSelectedAnswer(null);
    setQuizSubmitted(false);
  };

  const submitQuiz = () => {
    if (selectedAnswer === null) return;

    setQuizSubmitted(true);
  };

  const retryQuiz = () => {
    setSelectedAnswer(null);
    setQuizSubmitted(false);
  };

  const completeLesson = () => {
    if (!selectedLesson) return;

    if (
      progress.completedLessons.includes(
        selectedLesson.id
      )
    ) {
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
      xp:
        previous.xp +
        selectedLesson.xp,
      streak: newStreak,
      lastPracticeDate:
        getTodayString(),
    }));

    closeLesson();

    if (wasFinalLesson) {
      setTimeout(
        () => setCelebration(true),
        350
      );
    }
  };

  const resetProgress = () => {
    const confirmed = window.confirm(
      "Reset all Learn From Scratch progress?"
    );

    if (!confirmed) return;

    setProgress(INITIAL_PROGRESS);
    localStorage.removeItem(
      "skillsensai_music_progress"
    );
    setCelebration(false);
  };

  /* ======================================================
     RECORDING
     ====================================================== */

  const startRecording = async () => {
    try {
      setAnalysisError("");

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          }
        );

      mediaStreamRef.current = stream;

      const recorder =
        new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(
          chunksRef.current,
          {
            type: "audio/webm",
          }
        );

        if (recordingUrl) {
          URL.revokeObjectURL(
            recordingUrl
          );
        }

        const url =
          URL.createObjectURL(blob);

        setRecordingBlob(blob);
        setRecordingUrl(url);

        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        mediaStreamRef.current = null;
      };

      mediaRecorderRef.current =
        recorder;

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

  const handleRecordingUpload = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (recordingUrl) {
      URL.revokeObjectURL(
        recordingUrl
      );
    }

    setRecordingBlob(file);
    setRecordingUrl(
      URL.createObjectURL(file)
    );

    setAnalysis(null);
    setAnalysisError("");
  };

  /* ======================================================
     AI VOICE ANALYSIS
     ====================================================== */

  const analyzeVoice = async () => {
    if (!recordingBlob) {
      setAnalysisError(
        "Please record or upload your singing first."
      );
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError("");

      const formData =
        new FormData();

      formData.append(
        "file",
        recordingBlob,
        recordingBlob.name ||
          "singing.webm"
      );

      const response =
        await fetch(
          `${API_URL}/analyze-voice`,
          {
            method: "POST",
            body: formData,
          }
        );

      if (!response.ok) {
        throw new Error(
          "Voice analysis failed"
        );
      }

      const data =
        await response.json();

      setAnalysis(data);
    } catch {
      setAnalysisError(
        "Unable to analyze your recording. Please make sure the SkillSensAI backend is running."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ======================================================
     SONG ANALYSIS
     ====================================================== */

  const handleSongUpload = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setSongFile(file);
    setSongAnalysis(null);
    setSongError("");
  };

  const analyzeSong = async () => {
    if (!songFile) {
      setSongError(
        "Please upload a song first."
      );
      return;
    }

    try {
      setSongLoading(true);
      setSongError("");

      const formData =
        new FormData();

      formData.append(
        "file",
        songFile
      );

      const response =
        await fetch(
          `${API_URL}/analyze-song`,
          {
            method: "POST",
            body: formData,
          }
        );

      if (!response.ok) {
        throw new Error(
          "Song analysis failed"
        );
      }

      const data =
        await response.json();

      setSongAnalysis(data);
    } catch {
      setSongError(
        "Unable to analyze the song. Please make sure the backend is running."
      );
    } finally {
      setSongLoading(false);
    }
  };

  /* ======================================================
     GRAPH
     ====================================================== */

  const renderPitchGraph = (
    points
  ) => {
    if (
      !points ||
      points.length === 0
    ) {
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
        if (
          typeof point ===
          "number"
        ) {
          return point;
        }

        return (
          point.pitch ??
          point.frequency ??
          point.value ??
          0
        );
      })
      .filter(
        (value) =>
          Number.isFinite(value) &&
          value > 0
      );

    if (!values.length) {
      return (
        <div className="empty-analysis">
          No usable pitch data available.
        </div>
      );
    }

    const min =
      Math.min(...values);

    const max =
      Math.max(...values);

    const range = Math.max(
      max - min,
      1
    );

    const path = values
      .map((value, index) => {
        const x =
          (index /
            Math.max(
              values.length - 1,
              1
            )) *
          width;

        const y =
          height -
          ((value - min) /
            range) *
            (height - 25) -
          10;

        return `${
          index === 0 ? "M" : "L"
        } ${x} ${y}`;
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
              <stop
                offset="0%"
                stopColor="#8055e8"
              />

              <stop
                offset="100%"
                stopColor="#ed55aa"
              />
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
    if (!analysis) return null;

    if (
      typeof analysis.accuracy ===
      "number"
    ) {
      return Math.round(
        analysis.accuracy
      );
    }

    if (
      typeof analysis.pitch_accuracy ===
      "number"
    ) {
      return Math.round(
        analysis.pitch_accuracy
      );
    }

    return null;
  };

  const accuracy = getAccuracy();

  return (
    <div className="music-page">
      {/* ==================================================
          NAVBAR
      ================================================== */}

      <header className="music-navbar">
        <button
          className="back-button"
          onClick={() =>
            navigate("/")
          }
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

            <p>
              Music Learning Studio
            </p>
          </div>
        </div>

        <div className="music-navbar-xp">
          <div className="mini-xp">
            <Zap size={15} />
            {progress.xp} XP
          </div>

          <div className="mini-streak">
            <Flame size={15} />
            {progress.streak}
          </div>
        </div>
      </header>

      <main className="music-content">
        {/* ==================================================
            HERO
        ================================================== */}

        <section className="music-hero">
          <div>
            <span className="eyebrow">
              AI-POWERED MUSIC LEARNING
            </span>

            <h2>
              Find Your{" "}
              <span>Voice.</span>
              <br />
              Master Your{" "}
              <span>Music.</span>
            </h2>

            <p>
              Learn step by step, practice with
              your own voice and receive AI-powered
              feedback as you improve.
            </p>
          </div>

          <div className="music-mode-switch">
            <button
              className={
                mode === "scratch"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setMode("scratch")
              }
            >
              <Sparkles size={17} />
              Learn From Scratch
            </button>

            <button
              className={
                mode === "song"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setMode("song")
              }
            >
              <Music2 size={17} />
              Learn a Song
            </button>
          </div>
        </section>

        {mode === "scratch" ? (
          <>
            {/* ==================================================
                AWAKENING HERO
            ================================================== */}

            <section className="awakening-showcase">
              <div className="awakening-copy">
                <span className="eyebrow">
                  YOUR MUSICAL JOURNEY
                </span>

                <h3>
                  Bring Your{" "}
                  <span>Musician</span>{" "}
                  to Life
                </h3>

                <p>
                  Every lesson you complete
                  awakens another part of your
                  musician. Keep learning,
                  practicing and watch your
                  character evolve with you.
                </p>

                <div className="awakening-stats">
                  <div>
                    <strong>
                      {completedCount}
                    </strong>
                    <span>
                      Lessons
                    </span>
                  </div>

                  <div>
                    <strong>
                      {progressPercent}%
                    </strong>
                    <span>
                      Awakened
                    </span>
                  </div>

                  <div>
                    <strong>
                      {progress.xp}
                    </strong>
                    <span>XP</span>
                  </div>
                </div>

                {nextLesson && (
                  <button
                    className="continue-button"
                    onClick={() =>
                      openLesson(
                        nextLesson
                      )
                    }
                  >
                    Continue Learning
                    <ArrowRight size={17} />
                  </button>
                )}

                {isFullyAwakened && (
                  <div className="fully-awakened-label">
                    <Sparkles size={16} />
                    MUSICIAN FULLY AWAKENED
                  </div>
                )}
              </div>

              <div
                className={`awakening-visual stage-${characterStage} ${
                  isFullyAwakened
                    ? "fully-awakened"
                    : ""
                }`}
              >
                <div className="visual-glow glow-one" />
                <div className="visual-glow glow-two" />

                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />

                <img
                  src="/samurai.png"
                  alt="SkillSensAI Musician"
                  className="awakening-image"
                />

                <div className="awakening-spark spark-one">
                  ♪
                </div>

                <div className="awakening-spark spark-two">
                  ♫
                </div>

                <div className="awakening-spark spark-three">
                  ♬
                </div>

                <div className="awakening-spark spark-four">
                  ✦
                </div>

                {isFullyAwakened && (
                  <div className="final-awakening-ring">
                    <span>♪</span>
                    <span>♫</span>
                    <span>♬</span>
                    <span>✦</span>
                  </div>
                )}

                <div className="awakening-stage-label">
                  {isFullyAwakened
                    ? "AWAKENED"
                    : `STAGE ${characterStage}/6`}
                </div>
              </div>
            </section>

            {/* ==================================================
                DASHBOARD
            ================================================== */}

            <section className="progress-dashboard">
              <div className="dashboard-main">
                <div className="dashboard-heading">
                  <div>
                    <span className="eyebrow">
                      YOUR PROGRESS
                    </span>

                    <h3>
                      Music Mastery
                    </h3>
                  </div>

                  <div className="level-badge">
                    <Star size={15} />
                    Level {currentLevel}
                  </div>
                </div>

                <div className="mastery-progress">
                  <div>
                    <span>
                      Journey Progress
                    </span>

                    <strong>
                      {completedCount}/
                      {LESSONS.length}
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

                <div className="dashboard-stats">
                  <div className="music-stat">
                    <div className="stat-symbol purple">
                      <Zap size={19} />
                    </div>

                    <div>
                      <span>
                        Total XP
                      </span>
                      <strong>
                        {progress.xp}
                      </strong>
                    </div>
                  </div>

                  <div className="music-stat">
                    <div className="stat-symbol orange">
                      <Flame size={19} />
                    </div>

                    <div>
                      <span>
                        Streak
                      </span>
                      <strong>
                        {progress.streak} days
                      </strong>
                    </div>
                  </div>

                  <div className="music-stat">
                    <div className="stat-symbol pink">
                      <Trophy size={19} />
                    </div>

                    <div>
                      <span>
                        Lessons
                      </span>
                      <strong>
                        {completedCount}/6
                      </strong>
                    </div>
                  </div>

                  <div className="music-stat">
                    <div className="stat-symbol blue">
                      <Sparkles size={19} />
                    </div>

                    <div>
                      <span>
                        Next Level
                      </span>
                      <strong>
                        {300 - xpIntoLevel} XP
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="level-progress-card">
                <div>
                  <span>
                    LEVEL {currentLevel}
                  </span>

                  <strong>
                    {xpIntoLevel}/300 XP
                  </strong>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        (xpIntoLevel /
                          300) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <p>
                  Complete lessons and
                  practice to earn XP.
                </p>
              </div>
            </section>

            {/* ==================================================
                LESSON PATH
            ================================================== */}

            <section className="lessons-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    LEARNING PATH
                  </span>

                  <h3>
                    Your Music Journey
                  </h3>

                  <p>
                    Learn → Sing → Get AI
                    Feedback → Master
                  </p>
                </div>

                <button
                  className="reset-progress-button"
                  onClick={
                    resetProgress
                  }
                >
                  <RotateCcw
                    size={15}
                  />
                  Reset
                </button>
              </div>

              <div className="lesson-path">
                {LESSONS.map(
                  (
                    lesson,
                    index
                  ) => {
                    const completed =
                      progress.completedLessons.includes(
                        lesson.id
                      );

                    const unlocked =
                      lesson.id === 1 ||
                      progress.completedLessons.includes(
                        LESSONS[
                          index - 1
                        ]?.id
                      );

                    return (
                      <React.Fragment
                        key={
                          lesson.id
                        }
                      >
                        <button
                          className={`lesson-card ${
                            completed
                              ? "completed"
                              : ""
                          } ${
                            !unlocked
                              ? "locked"
                              : ""
                          }`}
                          style={{
                            "--lesson-color":
                              lesson.color,
                          }}
                          disabled={
                            !unlocked
                          }
                          onClick={() =>
                            openLesson(
                              lesson
                            )
                          }
                        >
                          <div className="lesson-number">
                            {completed ? (
                              <Check
                                size={
                                  20
                                }
                              />
                            ) : unlocked ? (
                              lesson.id
                            ) : (
                              <Lock
                                size={
                                  17
                                }
                              />
                            )}
                          </div>

                          <div className="lesson-main">
                            <div className="lesson-top">
                              <span>
                                LESSON{" "}
                                {lesson.id}
                              </span>

                              <div className="lesson-meta">
                                <span>
                                  <CirclePlay
                                    size={
                                      12
                                    }
                                  />
                                  {
                                    lesson.duration
                                  }
                                </span>

                                <span>
                                  <Zap
                                    size={
                                      12
                                    }
                                  />
                                  +
                                  {
                                    lesson.xp
                                  }
                                </span>
                              </div>
                            </div>

                            <h4>
                              {
                                lesson.title
                              }
                            </h4>

                            <p>
                              {
                                lesson.description
                              }
                            </p>

                            <div className="lesson-footer">
                              {completed ? (
                                <>
                                  <Check
                                    size={
                                      13
                                    }
                                  />
                                  Completed
                                </>
                              ) : unlocked ? (
                                <>
                                  <Mic
                                    size={
                                      13
                                    }
                                  />
                                  Learn &
                                  Sing
                                  <ChevronRight
                                    size={
                                      13
                                    }
                                  />
                                </>
                              ) : (
                                <>
                                  <Lock
                                    size={
                                      13
                                    }
                                  />
                                  Locked
                                </>
                              )}
                            </div>
                          </div>
                        </button>

                        {index <
                          LESSONS.length -
                            1 && (
                          <div
                            className={`path-connector ${
                              completed
                                ? "active"
                                : ""
                            }`}
                          >
                            <ChevronRight
                              size={
                                17
                              }
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  }
                )}
              </div>

              {isFullyAwakened && (
                <div className="awakened-banner">
                  <div className="awakened-icon">
                    <Trophy
                      size={23}
                    />
                  </div>

                  <div>
                    <strong>
                      Musician Fully
                      Awakened
                    </strong>

                    <p>
                      You completed the
                      complete Learn From
                      Scratch journey.
                    </p>
                  </div>

                  <Sparkles
                    size={25}
                  />
                </div>
              )}
            </section>
          </>
        ) : (
          /* ==================================================
             LEARN A SONG
          ================================================== */

          <section className="song-learning-section">
            <div className="song-card">
              <div className="song-card-header">
                <div>
                  <span className="eyebrow">
                    LEARN A SONG
                  </span>

                  <h3>
                    Analyze Your Song
                  </h3>

                  <p>
                    Upload a song and let
                    SkillSensAI map its pitch.
                  </p>
                </div>

                <div className="song-icon-large">
                  <Music2 size={29} />
                </div>
              </div>

              <label className="upload-zone">
                <Upload size={29} />

                <strong>
                  {songFile
                    ? songFile.name
                    : "Upload your song"}
                </strong>

                <span>
                  MP3, WAV or supported
                  audio format
                </span>

                <input
                  type="file"
                  accept="audio/*"
                  onChange={
                    handleSongUpload
                  }
                />
              </label>

              <button
                className="primary-music-button"
                disabled={
                  !songFile ||
                  songLoading
                }
                onClick={
                  analyzeSong
                }
              >
                {songLoading ? (
                  "Analyzing..."
                ) : (
                  <>
                    Analyze Song
                    <ArrowRight
                      size={17}
                    />
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

                      <h4>
                        Pitch Map
                      </h4>
                    </div>

                    <Volume2
                      size={21}
                    />
                  </div>

                  {renderPitchGraph(
                    songAnalysis.pitch_data
                  )}
                </div>
              )}
            </div>

            <div className="practice-card">
              <div className="practice-card-header">
                <div className="practice-icon">
                  <Mic size={22} />
                </div>

                <div>
                  <h3>
                    Practice Your Voice
                  </h3>

                  <p>
                    Record yourself or
                    upload a recording for
                    AI feedback.
                  </p>
                </div>
              </div>

              <div className="practice-actions">
                {!isRecording ? (
                  <button
                    className="practice-action primary"
                    onClick={
                      startRecording
                    }
                  >
                    <Mic size={19} />
                    Record Live
                  </button>
                ) : (
                  <button
                    className="practice-action recording"
                    onClick={
                      stopRecording
                    }
                  >
                    <Pause size={19} />
                    Stop Recording
                  </button>
                )}

                <label className="practice-action">
                  <Upload size={19} />
                  Upload Recording

                  <input
                    type="file"
                    accept="audio/*"
                    onChange={
                      handleRecordingUpload
                    }
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
                    onClick={
                      analyzeVoice
                    }
                    disabled={
                      isAnalyzing
                    }
                  >
                    {isAnalyzing
                      ? "AI is listening..."
                      : "Analyze My Voice"}
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
                        {accuracy ??
                          "--"}
                      </strong>
                      <span>
                        %
                      </span>
                    </div>

                    <div>
                      <span>
                        AI VOICE ANALYSIS
                      </span>

                      <h4>
                        {accuracy >=
                        90
                          ? "Excellent!"
                          : accuracy >=
                            75
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

      {/* ====================================================
          LESSON MODAL
      ==================================================== */}

      {selectedLesson && (
        <div className="lesson-modal-overlay">
          <div className="lesson-modal">
            <button
              className="modal-close"
              onClick={
                closeLesson
              }
            >
              <X size={19} />
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
              LESSON{" "}
              {selectedLesson.id}
            </span>

            <h3>
              {selectedLesson.title}
            </h3>

            {lessonStep ===
              "lesson" && (
              <>
                <p className="modal-description">
                  {
                    selectedLesson.description
                  }
                </p>

                <div className="lesson-video">
                  <video
                    controls
                    preload="metadata"
                    src={
                      selectedLesson.video
                    }
                  />

                  <div className="video-fallback">
                    <Play
                      size={23}
                    />
                    Lesson Video
                  </div>
                </div>

                <div className="theory-grid">
                  {selectedLesson.theory.map(
                    (
                      point,
                      index
                    ) => (
                      <div
                        className="theory-point"
                        key={
                          index
                        }
                      >
                        <div>
                          {index +
                            1}
                        </div>

                        <p>
                          {point}
                        </p>
                      </div>
                    )
                  )}
                </div>

                {/* ===============================
                    SING & PRACTICE
                =============================== */}

                <div className="sing-practice-box">
                  <div className="sing-practice-header">
                    <div className="sing-practice-icon">
                      <Mic size={22} />
                    </div>

                    <div>
                      <span className="eyebrow">
                        PRACTICE THIS LESSON
                      </span>

                      <h4>
                        Now Sing It
                      </h4>

                      <p>
                        {
                          selectedLesson.singingTask
                        }
                      </p>
                    </div>
                  </div>

                  <div className="sing-actions">
                    {!isRecording ? (
                      <button
                        className="sing-button live"
                        onClick={
                          startRecording
                        }
                      >
                        <Mic size={19} />
                        Record Live
                      </button>
                    ) : (
                      <button
                        className="sing-button stop"
                        onClick={
                          stopRecording
                        }
                      >
                        <Pause
                          size={19}
                        />
                        Stop Recording
                      </button>
                    )}

                    <label className="sing-button upload">
                      <Upload size={19} />
                      Upload Recording

                      <input
                        type="file"
                        accept="audio/*"
                        onChange={
                          handleRecordingUpload
                        }
                      />
                    </label>
                  </div>

                  {recordingUrl && (
                    <div className="lesson-recording">
                      <audio
                        src={
                          recordingUrl
                        }
                        controls
                      />

                      <button
                        className="ai-analyze-button"
                        onClick={
                          analyzeVoice
                        }
                        disabled={
                          isAnalyzing
                        }
                      >
                        <Sparkles
                          size={17}
                        />

                        {isAnalyzing
                          ? "AI is analyzing your singing..."
                          : "Analyze My Singing with AI"}
                      </button>
                    </div>
                  )}

                  {analysisError && (
                    <div className="error-message">
                      {analysisError}
                    </div>
                  )}

                  {analysis && (
                    <div className="lesson-ai-result">
                      <div className="ai-result-heading">
                        <div>
                          <span>
                            AI PERFORMANCE
                            ANALYSIS
                          </span>

                          <h5>
                            Your Singing
                            Results
                          </h5>
                        </div>

                        <Sparkles
                          size={20}
                        />
                      </div>

                      <div className="ai-result-grid">
                        <div className="ai-score-card">
                          <span>
                            Pitch Accuracy
                          </span>

                          <strong>
                            {accuracy ??
                              "--"}
                            %
                          </strong>

                          <div className="mini-score-track">
                            <div
                              style={{
                                width: `${Math.min(
                                  accuracy ||
                                    0,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="ai-metric-card">
                          <span>
                            Average Pitch
                          </span>

                          <strong>
                            {analysis.avg_pitch
                              ? `${Number(
                                  analysis.avg_pitch
                                ).toFixed(
                                  1
                                )} Hz`
                              : "--"}
                          </strong>
                        </div>

                        <div className="ai-metric-card">
                          <span>
                            Min Pitch
                          </span>

                          <strong>
                            {analysis.min_pitch
                              ? `${Number(
                                  analysis.min_pitch
                                ).toFixed(
                                  1
                                )} Hz`
                              : "--"}
                          </strong>
                        </div>

                        <div className="ai-metric-card">
                          <span>
                            Max Pitch
                          </span>

                          <strong>
                            {analysis.max_pitch
                              ? `${Number(
                                  analysis.max_pitch
                                ).toFixed(
                                  1
                                )} Hz`
                              : "--"}
                          </strong>
                        </div>
                      </div>

                      {renderPitchGraph(
                        analysis.pitch_data ||
                          analysis.pitch_points
                      )}

                      <div className="ai-feedback">
                        <Sparkles
                          size={17}
                        />

                        <div>
                          <strong>
                            AI Feedback
                          </strong>

                          <p>
                            {accuracy >=
                            90
                              ? "Excellent pitch control. Your voice stayed close to the detected pitch target."
                              : accuracy >=
                                75
                              ? "Good work. Your pitch is developing well. Keep practicing smooth transitions and stability."
                              : "Keep practicing. Focus on listening carefully and making small pitch adjustments."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="lesson-modal-actions">
                  <button
                    className="secondary-modal-button"
                    onClick={
                      closeLesson
                    }
                  >
                    Close
                  </button>

                  <button
                    className="primary-music-button"
                    onClick={
                      startQuiz
                    }
                  >
                    Continue to Quiz
                    <ArrowRight
                      size={17}
                    />
                  </button>
                </div>
              </>
            )}

            {lessonStep ===
              "quiz" && (
              <div className="quiz-container">
                <div className="quiz-progress">
                  <span>
                    QUICK CHECK
                  </span>

                  <span>
                    +{selectedLesson.xp} XP
                  </span>
                </div>

                <h4>
                  {
                    selectedLesson
                      .quiz.question
                  }
                </h4>

                <div className="quiz-options">
                  {selectedLesson.quiz.options.map(
                    (
                      option,
                      index
                    ) => {
                      const isSelected =
                        selectedAnswer ===
                        index;

                      const isCorrect =
                        index ===
                        selectedLesson
                          .quiz
                          .answer;

                      let stateClass =
                        "";

                      if (
                        quizSubmitted &&
                        isCorrect
                      ) {
                        stateClass =
                          "correct";
                      }

                      if (
                        quizSubmitted &&
                        isSelected &&
                        !isCorrect
                      ) {
                        stateClass =
                          "wrong";
                      }

                      return (
                        <button
                          key={
                            option
                          }
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
                          disabled={
                            quizSubmitted
                          }
                        >
                          <span className="option-letter">
                            {String.fromCharCode(
                              65 +
                                index
                            )}
                          </span>

                          <span>
                            {option}
                          </span>

                          {quizSubmitted &&
                            isCorrect && (
                              <Check
                                size={
                                  18
                                }
                              />
                            )}

                          {quizSubmitted &&
                            isSelected &&
                            !isCorrect && (
                              <X
                                size={
                                  18
                                }
                              />
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
                      selectedLesson
                        .quiz
                        .answer
                        ? "success"
                        : "failure"
                    }`}
                  >
                    {selectedAnswer ===
                    selectedLesson
                      .quiz
                      .answer ? (
                      <>
                        <Check
                          size={
                            21
                          }
                        />

                        <div>
                          <strong>
                            Correct!
                          </strong>

                          <p>
                            Lesson
                            completed
                            successfully.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <RotateCcw
                          size={
                            21
                          }
                        />

                        <div>
                          <strong>
                            Try again.
                          </strong>

                          <p>
                            Review the
                            lesson and
                            retry the
                            quiz.
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
                          setLessonStep(
                            "lesson"
                          )
                        }
                      >
                        Back
                      </button>

                      <button
                        className="primary-music-button"
                        onClick={
                          submitQuiz
                        }
                        disabled={
                          selectedAnswer ===
                          null
                        }
                      >
                        Check Answer
                        <Check
                          size={
                            17
                          }
                        />
                      </button>
                    </>
                  ) : selectedAnswer ===
                    selectedLesson
                      .quiz
                      .answer ? (
                    <button
                      className="primary-music-button wide"
                      onClick={
                        completeLesson
                      }
                    >
                      Complete Lesson
                      <Sparkles
                        size={
                          17
                        }
                      />
                    </button>
                  ) : (
                    <>
                      <button
                        className="secondary-modal-button"
                        onClick={() =>
                          setLessonStep(
                            "lesson"
                          )
                        }
                      >
                        Review Lesson
                      </button>

                      <button
                        className="primary-music-button"
                        onClick={
                          retryQuiz
                        }
                      >
                        Retry Quiz
                        <RotateCcw
                          size={
                            17
                          }
                        />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================
          FINAL AWAKENING
      ==================================================== */}

      {celebration && (
        <div className="celebration-overlay">
          <div className="celebration-card">
            <div className="celebration-character">
              <div className="celebration-character-glow" />

              <img
                src="/samurai.png"
                alt="Awakened Musician"
              />

              <div className="celebration-notes">
                <span>♪</span>
                <span>♫</span>
                <span>♬</span>
                <span>✦</span>
              </div>
            </div>

            <span className="eyebrow">
              MILESTONE UNLOCKED
            </span>

            <h2>
              Your Musician
              <span>
                {" "}
                Has Awakened!
              </span>
            </h2>

            <p>
              You completed every Learn From
              Scratch lesson. Your journey from
              beginner to musician has begun.
            </p>

            <div className="celebration-reward">
              <Zap size={18} />
              +950 XP earned
            </div>

            <button
              className="primary-music-button"
              onClick={() =>
                setCelebration(false)
              }
            >
              Continue Journey
              <ArrowRight
                size={17}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Music;
