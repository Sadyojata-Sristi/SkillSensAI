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
  Brain,
  BookOpen,
  Target,
  Headphones,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Music.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const PROGRESS_KEY = "skillsensai_music_progress";

const LESSONS = [
  {
    id: 1,
    title: "Understanding Pitch",
    shortTitle: "Pitch",
    description:
      "Understand high and low sounds and learn how pitch changes your singing.",
    duration: "5 min",
    xp: 100,
    color: "#8b5cf6",
    video: "/lessons/music/pitch.mp4",
    theory: [
      "Pitch describes how high or low a sound is.",
      "Higher frequency creates a higher perceived pitch.",
      "Your vocal cords vibrate at different speeds to create different pitches.",
      "Good pitch control is one of the foundations of singing.",
    ],
    question:
      "Which factor mainly determines whether a sound is perceived as high or low?",
    options: [
      "Frequency",
      "Volume",
      "Duration",
      "Echo",
    ],
    answer: "Frequency",
  },
  {
    id: 2,
    title: "Voice Control",
    shortTitle: "Voice Control",
    description:
      "Learn breathing, vocal control and how to produce a steady sound.",
    duration: "6 min",
    xp: 120,
    color: "#ec4899",
    video: "/lessons/music/voice-control.mp4",
    theory: [
      "Controlled breathing helps maintain a stable voice.",
      "Avoid forcing your throat when producing higher notes.",
      "A steady airflow helps keep your pitch consistent.",
      "Good posture can improve breathing and vocal control.",
    ],
    question:
      "Which helps a singer maintain a stable voice?",
    options: [
      "Controlled breathing",
      "Holding your breath",
      "Shouting",
      "Tensing the neck",
    ],
    answer: "Controlled breathing",
  },
  {
    id: 3,
    title: "Musical Notes",
    shortTitle: "Notes",
    description:
      "Understand basic musical notes and how singers move between them.",
    duration: "7 min",
    xp: 140,
    color: "#06b6d4",
    video: "/lessons/music/musical-notes.mp4",
    theory: [
      "Musical notes represent specific pitches.",
      "The basic Western note names are A, B, C, D, E, F and G.",
      "Notes can repeat at different octaves.",
      "Understanding notes makes pitch training easier.",
    ],
    question:
      "Which of the following is a musical note name?",
    options: [
      "C",
      "H",
      "X",
      "Z",
    ],
    answer: "C",
  },
  {
    id: 4,
    title: "Rhythm Basics",
    shortTitle: "Rhythm",
    description:
      "Learn timing, beats and how to keep your singing synchronized with music.",
    duration: "6 min",
    xp: 150,
    color: "#f59e0b",
    video: "/lessons/music/rhythm.mp4",
    theory: [
      "Rhythm is the organization of sounds and silences over time.",
      "A beat provides the basic pulse of music.",
      "Counting beats helps singers stay synchronized.",
      "Good rhythm is essential for performing with other musicians.",
    ],
    question:
      "What does rhythm primarily deal with?",
    options: [
      "Timing",
      "Color",
      "Volume only",
      "Microphone size",
    ],
    answer: "Timing",
  },
  {
    id: 5,
    title: "Pitch Matching",
    shortTitle: "Pitch Matching",
    description:
      "Train your ear and voice to reproduce a target note accurately.",
    duration: "8 min",
    xp: 180,
    color: "#22c55e",
    video: "/lessons/music/pitch-matching.mp4",
    theory: [
      "Pitch matching means reproducing a target pitch with your voice.",
      "Listen carefully before attempting the note.",
      "Start slowly and adjust your voice toward the target.",
      "Regular practice improves your pitch recognition and control.",
    ],
    question:
      "What is the main goal of pitch matching?",
    options: [
      "Reproduce a target pitch",
      "Sing louder",
      "Sing faster",
      "Change microphone volume",
    ],
    answer: "Reproduce a target pitch",
  },
  {
    id: 6,
    title: "Your First Performance",
    shortTitle: "Performance",
    description:
      "Bring everything together and perform with confidence.",
    duration: "10 min",
    xp: 250,
    color: "#f43f5e",
    video: "/lessons/music/first-performance.mp4",
    theory: [
      "A performance combines pitch, rhythm, voice control and expression.",
      "Confidence grows through repeated practice.",
      "Focus on musical expression instead of trying to be perfect.",
      "Your first performance is the beginning of your musical journey.",
    ],
    question:
      "What combines pitch, rhythm and voice control during a performance?",
    options: [
      "Musical performance",
      "Silence",
      "Audio compression",
      "Microphone hardware",
    ],
    answer: "Musical performance",
  },
];

const getInitialProgress = () => ({
  completedLessons: [],
  xp: 0,
  streak: 0,
  lastPracticeDate: null,
});

function getLevel(xp) {
  if (xp >= 850) return 6;
  if (xp >= 650) return 5;
  if (xp >= 500) return 4;
  if (xp >= 350) return 3;
  if (xp >= 200) return 2;
  if (xp >= 100) return 1;
  return 0;
}

function getLevelName(level) {
  const names = [
    "Beginner",
    "Voice Explorer",
    "Music Learner",
    "Pitch Trainer",
    "Rhythm Master",
    "Vocal Artist",
    "Musician",
  ];

  return names[level] || "Beginner";
}

function calculateStreak(lastPracticeDate, currentStreak) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!lastPracticeDate) {
    return 1;
  }

  const previous = new Date(lastPracticeDate);
  previous.setHours(0, 0, 0, 0);

  const difference =
    (today.getTime() - previous.getTime()) /
    (1000 * 60 * 60 * 24);

  if (difference === 0) {
    return Math.max(currentStreak, 1);
  }

  if (difference === 1) {
    return Math.max(currentStreak + 1, 1);
  }

  return 1;
}

function Music() {
  const navigate = useNavigate();

  const [progress, setProgress] = useState(getInitialProgress);

  const [activeTab, setActiveTab] = useState("scratch");

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonStep, setLessonStep] = useState("lesson");

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  const [recordingMode, setRecordingMode] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const [songFile, setSongFile] = useState(null);
  const [songUrl, setSongUrl] = useState(null);
  const [songAnalysis, setSongAnalysis] = useState(null);
  const [isSongAnalyzing, setIsSongAnalyzing] = useState(false);
  const [songError, setSongError] = useState("");

  const [showCelebration, setShowCelebration] = useState(false);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROGRESS_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        setProgress({
          ...getInitialProgress(),
          ...parsed,
        });
      }
    } catch (error) {
      console.error("Unable to load music progress:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    return () => {
      stopRecording();

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      if (songUrl) {
        URL.revokeObjectURL(songUrl);
      }
    };
  }, []);

  const completedCount = progress.completedLessons.length;

  const progressPercentage = Math.round(
    (completedCount / LESSONS.length) * 100
  );

  const characterStage = completedCount;

  const isFullyAwakened = completedCount === LESSONS.length;

  const level = getLevel(progress.xp);

  const levelName = getLevelName(level);

  const nextLesson = useMemo(() => {
    return LESSONS.find(
      (lesson) => !progress.completedLessons.includes(lesson.id)
    );
  }, [progress.completedLessons]);

  const currentLevelXp = (() => {
    const thresholds = [0, 100, 200, 350, 500, 650, 850];
    return progress.xp - thresholds[level];
  })();

  const nextLevelXp = (() => {
    const thresholds = [100, 200, 350, 500, 650, 850, 1000];
    return Math.max(thresholds[level] - [0, 100, 200, 350, 500, 650, 850][level], 1);
  })();

  const levelProgress = Math.min(
    Math.round((currentLevelXp / nextLevelXp) * 100),
    100
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
    setQuizResult(null);
    resetPractice();
  };

  const closeLesson = () => {
    stopRecording();
    resetPractice();
    setSelectedLesson(null);
  };

  const resetPractice = () => {
    setRecordingMode(null);
    setIsRecording(false);
    setRecordingTime(0);
    setAnalysis(null);
    setAnalysisError("");
    setAudioFile(null);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const markPractice = () => {
    const today = new Date().toISOString();

    setProgress((previous) => ({
      ...previous,
      streak: calculateStreak(
        previous.lastPracticeDate,
        previous.streak
      ),
      lastPracticeDate: today,
    }));
  };

  const startRecording = async () => {
    try {
      setAnalysis(null);
      setAnalysisError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(recordingChunksRef.current, {
          type: "audio/webm",
        });

        const file = new File(
          [blob],
          "skillsensai-recording.webm",
          {
            type: "audio/webm",
          }
        );

        const url = URL.createObjectURL(blob);

        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }

        setAudioFile(file);
        setAudioUrl(url);

        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;

        await analyzeVoice(file);
      };

      recorder.start();

      setRecordingMode("live");
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((time) => time + 1);
      }, 1000);
    } catch (error) {
      console.error(error);

      setAnalysisError(
        "Microphone access was not available. Please allow microphone permission or upload a recording instead."
      );
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAudioUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setRecordingMode("upload");

    await analyzeVoice(file);
  };

  const analyzeVoice = async (file) => {
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysis(null);
    setAnalysisError("");

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
          `Voice analysis failed: ${response.status}`
        );
      }

      const data = await response.json();

      const pitchValues = Array.isArray(data.pitch_data)
        ? data.pitch_data
            .map((point) => {
              if (typeof point === "number") return point;

              if (Array.isArray(point)) {
                return Number(point[1]);
              }

              return Number(
                point.pitch ??
                  point.frequency ??
                  point.value ??
                  0
              );
            })
            .filter((value) => Number.isFinite(value) && value > 0)
        : [];

      let stability = 0;

      if (pitchValues.length > 1) {
        const mean =
          pitchValues.reduce((sum, value) => sum + value, 0) /
          pitchValues.length;

        const deviations = pitchValues.map((value) =>
          Math.abs(value - mean)
        );

        const averageDeviation =
          deviations.reduce((sum, value) => sum + value, 0) /
          deviations.length;

        stability = Math.max(
          0,
          Math.min(
            100,
            100 - (averageDeviation / Math.max(mean, 1)) * 100
          )
        );
      }

      const backendAverage =
        Number(data.average_pitch ?? data.avg_pitch ?? 0);

      const duration =
        Number(data.duration ?? data.duration_seconds ?? 0);

      const score =
        pitchValues.length > 1
          ? Math.round(stability)
          : backendAverage > 0
            ? 75
            : 0;

      setAnalysis({
        ...data,
        pitchValues,
        duration,
        score,
        stability: Math.round(stability),
      });

      markPractice();
    } catch (error) {
      console.error(error);

      setAnalysisError(
        "Unable to analyse this recording. Make sure the SkillSensAI backend is running and the recording format is supported."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submitQuiz = () => {
    if (!selectedLesson || !selectedAnswer) return;

    const correct = selectedAnswer === selectedLesson.answer;

    setQuizResult(correct ? "correct" : "wrong");

    if (correct) {
      completeLesson(selectedLesson);
    }
  };

  const completeLesson = (lesson) => {
    setProgress((previous) => {
      if (previous.completedLessons.includes(lesson.id)) {
        return previous;
      }

      const completedLessons = [
        ...previous.completedLessons,
        lesson.id,
      ].sort((a, b) => a - b);

      const nextXp = previous.xp + lesson.xp;

      return {
        ...previous,
        completedLessons,
        xp: nextXp,
        streak: calculateStreak(
          previous.lastPracticeDate,
          previous.streak
        ),
        lastPracticeDate: new Date().toISOString(),
      };
    });

    setLessonStep("completed");

    if (lesson.id === LESSONS.length) {
      setTimeout(() => {
        setShowCelebration(true);
      }, 500);
    }
  };

  const retryQuiz = () => {
    setSelectedAnswer(null);
    setQuizResult(null);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
  };

  const handleSongUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (songUrl) {
      URL.revokeObjectURL(songUrl);
    }

    setSongFile(file);
    setSongUrl(URL.createObjectURL(file));
    setSongAnalysis(null);
    setSongError("");
  };

  const analyzeSong = async () => {
    if (!songFile) return;

    setIsSongAnalyzing(true);
    setSongAnalysis(null);
    setSongError("");

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
        throw new Error(
          `Song analysis failed: ${response.status}`
        );
      }

      const data = await response.json();

      setSongAnalysis(data);
      markPractice();
    } catch (error) {
      console.error(error);

      setSongError(
        "Unable to analyse this song. Please check the SkillSensAI backend."
      );
    } finally {
      setIsSongAnalyzing(false);
    }
  };

  const getFeedback = (score) => {
    if (score >= 90) {
      return {
        title: "Excellent Control!",
        text: "Your voice is showing strong pitch stability. Keep building consistency.",
      };
    }

    if (score >= 75) {
      return {
        title: "Great Progress!",
        text: "Your pitch is developing well. Keep practising slowly and consistently.",
      };
    }

    if (score >= 50) {
      return {
        title: "Good Start!",
        text: "Your voice is beginning to find the notes. Focus on steady breathing and listening carefully.",
      };
    }

    return {
      title: "Keep Practising!",
      text: "Don't worry about the score. Repeat the lesson and focus on matching the target sound.",
    };
  };

  return (
    <div className="music-page">
      <header className="music-navbar">
        <button
          className="back-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={19} />
          Back
        </button>

        <div className="music-brand">
          <div className="music-brand-icon">
            <Music2 size={22} />
          </div>

          <div>
            <h1>Music</h1>
            <span>AI-powered musical learning</span>
          </div>
        </div>

        <div className="music-nav-right">
          <div className="streak-pill">
            <Flame size={17} />
            <strong>{progress.streak}</strong>
            <span>day streak</span>
          </div>

          <div className="xp-pill">
            <Zap size={17} />
            <strong>{progress.xp}</strong>
            <span>XP</span>
          </div>
        </div>
      </header>

      <main className="music-content">
        <section className="music-hero">
          <div className="music-hero-copy">
            <div className="eyebrow">
              <Sparkles size={15} />
              PERSONALIZED MUSIC JOURNEY
            </div>

            <h2>
              Discover the{" "}
              <span>Musician</span>
              <br />
              Inside You
            </h2>

            <p>
              Learn the fundamentals, practise with your own
              voice and let AI help you understand your progress.
            </p>

            <div className="hero-actions">
              <button
                className="primary-music-button"
                onClick={() => {
                  if (nextLesson) {
                    openLesson(nextLesson);
                  }
                }}
              >
                {nextLesson
                  ? `Continue: ${nextLesson.shortTitle}`
                  : "Journey Complete"}
                <ArrowRight size={18} />
              </button>

              <div className="hero-progress">
                <div className="hero-progress-top">
                  <span>Journey progress</span>
                  <strong>{progressPercentage}%</strong>
                </div>

                <div className="hero-progress-bar">
                  <div
                    style={{
                      width: `${progressPercentage}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className={`awakening-visual stage-${characterStage} ${
              isFullyAwakened ? "fully-awakened" : ""
            }`}
          >
            <div className="visual-glow glow-one" />
            <div className="visual-glow glow-two" />

            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />

            <div className="musician-stage">
              <img
                src="/samurai.png"
                alt="SkillSensAI musician"
                className="awakening-image"
              />

              {isFullyAwakened && (
                <>
                  <div className="musician-mic">
                    <div className="mic-head">
                      <div className="mic-grille" />
                    </div>

                    <div className="mic-body" />

                    <div className="mic-handle" />
                  </div>

                  <div className="singing-wave wave-one">
                    ♪
                  </div>

                  <div className="singing-wave wave-two">
                    ♫
                  </div>

                  <div className="singing-wave wave-three">
                    ♬
                  </div>
                </>
              )}
            </div>

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
                ? "MUSICIAN AWAKENED"
                : `STAGE ${characterStage}/6`}
            </div>
          </div>
        </section>

        <section className="music-stats-grid">
          <div className="music-stat-card">
            <div className="music-stat-icon">
              <Trophy size={20} />
            </div>

            <div>
              <span>Current Level</span>
              <strong>
                Level {level}
              </strong>
              <small>{levelName}</small>
            </div>
          </div>

          <div className="music-stat-card">
            <div className="music-stat-icon">
              <Star size={20} />
            </div>

            <div>
              <span>Experience</span>
              <strong>{progress.xp} XP</strong>
              <small>
                {Math.max(0, nextLevelXp - currentLevelXp)} XP
                to next level
              </small>
            </div>
          </div>

          <div className="music-stat-card">
            <div className="music-stat-icon">
              <Target size={20} />
            </div>

            <div>
              <span>Lessons</span>
              <strong>
                {completedCount}/{LESSONS.length}
              </strong>
              <small>Learning journey</small>
            </div>
          </div>

          <div className="music-stat-card">
            <div className="music-stat-icon">
              <Flame size={20} />
            </div>

            <div>
              <span>Practice Streak</span>
              <strong>
                {progress.streak} days
              </strong>
              <small>Keep the rhythm going</small>
            </div>
          </div>
        </section>

        <section className="music-tabs-section">
          <div className="music-tabs">
            <button
              className={
                activeTab === "scratch"
                  ? "music-tab active"
                  : "music-tab"
              }
              onClick={() => setActiveTab("scratch")}
            >
              <Brain size={18} />
              Learn From Scratch
            </button>

            <button
              className={
                activeTab === "song"
                  ? "music-tab active"
                  : "music-tab"
              }
              onClick={() => setActiveTab("song")}
            >
              <Music2 size={18} />
              Learn a Song
            </button>
          </div>
        </section>

        {activeTab === "scratch" && (
          <section className="learning-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">
                  YOUR CURRICULUM
                </span>

                <h3>
                  Build Your Musical Foundation
                </h3>

                <p>
                  Complete each lesson to awaken another
                  part of the musician inside you.
                </p>
              </div>

              <div className="curriculum-progress">
                <strong>
                  {completedCount}/{LESSONS.length}
                </strong>
                <span>completed</span>
              </div>
            </div>

            <div className="level-progress-card">
              <div className="level-progress-info">
                <div>
                  <span>Level {level}</span>
                  <strong>{levelName}</strong>
                </div>

                <div className="level-xp">
                  {currentLevelXp}/{nextLevelXp} XP
                </div>
              </div>

              <div className="level-progress-track">
                <div
                  style={{
                    width: `${levelProgress}%`,
                  }}
                />
              </div>
            </div>

            <div className="lesson-path">
              {LESSONS.map((lesson, index) => {
                const completed =
                  progress.completedLessons.includes(
                    lesson.id
                  );

                const unlocked =
                  lesson.id === 1 ||
                  progress.completedLessons.includes(
                    lesson.id - 1
                  );

                return (
                  <React.Fragment key={lesson.id}>
                    <button
                      className={`lesson-card ${
                        completed ? "completed" : ""
                      } ${!unlocked ? "locked" : ""}`}
                      onClick={() => openLesson(lesson)}
                      disabled={!unlocked}
                      style={{
                        "--lesson-color": lesson.color,
                      }}
                    >
                      <div className="lesson-number">
                        {completed ? (
                          <Check size={20} />
                        ) : unlocked ? (
                          lesson.id
                        ) : (
                          <Lock size={18} />
                        )}
                      </div>

                      <div className="lesson-card-content">
                        <div className="lesson-card-top">
                          <span>
                            LESSON {lesson.id}
                          </span>

                          <small>
                            {lesson.duration}
                          </small>
                        </div>

                        <h4>{lesson.title}</h4>

                        <p>
                          {lesson.description}
                        </p>

                        <div className="lesson-card-bottom">
                          <span>
                            +{lesson.xp} XP
                          </span>

                          {completed && (
                            <span className="completed-label">
                              Completed
                            </span>
                          )}

                          {!completed && unlocked && (
                            <span className="start-label">
                              Start lesson
                              <ChevronRight size={15} />
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {index < LESSONS.length - 1 && (
                      <div
                        className={`lesson-connector ${
                          progress.completedLessons.includes(
                            lesson.id
                          )
                            ? "filled"
                            : ""
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "song" && (
          <section className="song-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">
                  AI SONG ANALYSIS
                </span>

                <h3>
                  Learn Through Any Song
                </h3>

                <p>
                  Upload a song and let SkillSensAI analyse
                  its vocal pitch information.
                </p>
              </div>
            </div>

            <div className="song-learning-grid">
              <div className="song-upload-card">
                <div className="song-card-icon">
                  <Headphones size={28} />
                </div>

                <h4>Analyse a Song</h4>

                <p>
                  Upload an audio file and explore its pitch
                  information with AI.
                </p>

                <label className="upload-song-button">
                  <Upload size={18} />
                  Choose Audio
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleSongUpload}
                    hidden
                  />
                </label>

                {songFile && (
                  <div className="selected-audio">
                    <Music2 size={18} />

                    <div>
                      <strong>
                        {songFile.name}
                      </strong>

                      <span>
                        {(songFile.size / 1024 / 1024).toFixed(
                          2
                        )}{" "}
                        MB
                      </span>
                    </div>
                  </div>
                )}

                {songUrl && (
                  <audio
                    controls
                    src={songUrl}
                    className="audio-player"
                  />
                )}

                <button
                  className="primary-music-button full"
                  onClick={analyzeSong}
                  disabled={
                    !songFile || isSongAnalyzing
                  }
                >
                  {isSongAnalyzing ? (
                    <>
                      <Activity
                        size={18}
                        className="spinning"
                      />
                      Analysing...
                    </>
                  ) : (
                    <>
                      <Brain size={18} />
                      Analyse Song
                    </>
                  )}
                </button>

                {songError && (
                  <div className="analysis-error">
                    {songError}
                  </div>
                )}
              </div>

              <div className="song-analysis-card">
                <div className="analysis-header">
                  <div>
                    <span>
                      AI PITCH ANALYSIS
                    </span>

                    <h4>
                      {songAnalysis
                        ? "Your Song's Pitch Profile"
                        : "Your analysis will appear here"}
                    </h4>
                  </div>

                  <div className="analysis-ai-icon">
                    <Sparkles size={21} />
                  </div>
                </div>

                {songAnalysis ? (
                  <>
                    <div className="song-analysis-metrics">
                      <div>
                        <span>Duration</span>
                        <strong>
                          {Number(
                            songAnalysis.duration || 0
                          ).toFixed(1)}
                          s
                        </strong>
                      </div>

                      <div>
                        <span>Pitch Points</span>
                        <strong>
                          {Array.isArray(
                            songAnalysis.pitch_data
                          )
                            ? songAnalysis.pitch_data.length
                            : 0}
                        </strong>
                      </div>

                      <div>
                        <span>Status</span>
                        <strong>Analysed</strong>
                      </div>
                    </div>

                    <div className="pitch-graph">
                      {Array.isArray(
                        songAnalysis.pitch_data
                      ) &&
                      songAnalysis.pitch_data.length > 0 ? (
                        <svg
                          viewBox="0 0 800 220"
                          preserveAspectRatio="none"
                        >
                          <polyline
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={songAnalysis.pitch_data
                              .map(
                                (point, index) => {
                                  const value =
                                    Array.isArray(point)
                                      ? Number(
                                          point[1]
                                        )
                                      : Number(
                                          point.pitch ??
                                            point.frequency ??
                                            point.value ??
                                            0
                                        );

                                  const x =
                                    (index /
                                      Math.max(
                                        songAnalysis
                                          .pitch_data
                                          .length -
                                          1,
                                        1
                                      )) *
                                    800;

                                  const y =
                                    200 -
                                    Math.min(
                                      Math.max(
                                        value / 2,
                                        0
                                      ),
                                      180
                                    );

                                  return `${x},${y}`;
                                }
                              )
                              .join(" ")}
                          />
                        </svg>
                      ) : (
                        <div className="empty-graph">
                          Pitch graph unavailable
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="empty-analysis">
                    <div>
                      <Music2 size={34} />
                    </div>

                    <strong>
                      Upload a song to begin
                    </strong>

                    <span>
                      Your pitch visualisation and song
                      information will appear here.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="song-practice-card">
              <div>
                <div className="song-practice-icon">
                  <Mic size={24} />
                </div>

                <div>
                  <span className="section-kicker">
                    PRACTICE
                  </span>

                  <h4>
                    Now Sing It Yourself
                  </h4>

                  <p>
                    Record your voice or upload a recording
                    and receive AI voice analysis.
                  </p>
                </div>
              </div>

              <div className="song-practice-actions">
                <label className="secondary-music-button">
                  <Upload size={17} />
                  Upload Recording

                  <input
                    type="file"
                    accept="audio/*"
                    hidden
                    onChange={handleAudioUpload}
                  />
                </label>

                <button
                  className={`record-button ${
                    isRecording ? "recording" : ""
                  }`}
                  onClick={handleRecordingToggle}
                >
                  {isRecording ? (
                    <>
                      <Pause size={17} />
                      Stop {formatTime(recordingTime)}
                    </>
                  ) : (
                    <>
                      <Mic size={17} />
                      Record Live
                    </>
                  )}
                </button>
              </div>

              {audioUrl && (
                <div className="practice-result">
                  <audio
                    controls
                    src={audioUrl}
                    className="audio-player"
                  />

                  {isAnalyzing && (
                    <div className="analysis-loading">
                      <Activity
                        size={18}
                        className="spinning"
                      />
                      AI is analysing your voice...
                    </div>
                  )}

                  {analysis && !isAnalyzing && (
                    <div className="voice-analysis-result">
                      <div className="voice-score">
                        <strong>
                          {analysis.score}%
                        </strong>
                        <span>
                          Voice Stability
                        </span>
                      </div>

                      <div>
                        <h5>
                          {getFeedback(
                            analysis.score
                          ).title}
                        </h5>

                        <p>
                          {getFeedback(
                            analysis.score
                          ).text}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {analysisError && (
                <div className="analysis-error">
                  {analysisError}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {selectedLesson && (
        <div
          className="lesson-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeLesson();
            }
          }}
        >
          <div className="lesson-modal">
            <button
              className="modal-close"
              onClick={closeLesson}
            >
              <X size={20} />
            </button>

            {lessonStep === "lesson" && (
              <>
                <div className="modal-header">
                  <div>
                    <span>
                      LESSON {selectedLesson.id}
                    </span>

                    <h3>
                      {selectedLesson.title}
                    </h3>

                    <p>
                      {selectedLesson.description}
                    </p>
                  </div>

                  <div
                    className="modal-xp"
                    style={{
                      "--lesson-color":
                        selectedLesson.color,
                    }}
                  >
                    <Zap size={17} />
                    +{selectedLesson.xp} XP
                  </div>
                </div>

                <div className="lesson-video-container">
                  <video
                    controls
                    preload="metadata"
                    src={selectedLesson.video}
                    className="lesson-video"
                  >
                    Your browser does not support video
                    playback.
                  </video>
                </div>

                <div className="lesson-theory">
                  <div className="lesson-theory-header">
                    <BookOpen size={20} />
                    <h4>What You'll Learn</h4>
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

                          <span>{point}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="lesson-practice-area">
                  <div className="practice-heading">
                    <div>
                      <span>
                        PRACTICE THIS LESSON
                      </span>

                      <h4>
                        Sing what you learned
                      </h4>

                      <p>
                        Record your voice or upload a
                        recording. SkillSensAI will analyse
                        your voice using AI.
                      </p>
                    </div>

                    <div className="practice-heading-icon">
                      <Mic size={22} />
                    </div>
                  </div>

                  <div className="lesson-practice-actions">
                    <label className="secondary-music-button">
                      <Upload size={17} />
                      Upload Recording

                      <input
                        type="file"
                        accept="audio/*"
                        hidden
                        onChange={handleAudioUpload}
                      />
                    </label>

                    <button
                      className={`record-button ${
                        isRecording
                          ? "recording"
                          : ""
                      }`}
                      onClick={
                        handleRecordingToggle
                      }
                    >
                      {isRecording ? (
                        <>
                          <Pause size={17} />
                          Stop{" "}
                          {formatTime(
                            recordingTime
                          )}
                        </>
                      ) : (
                        <>
                          <Mic size={17} />
                          Record Live
                        </>
                      )}
                    </button>
                  </div>

                  {audioUrl && (
                    <div className="lesson-recording-result">
                      <audio
                        controls
                        src={audioUrl}
                        className="audio-player"
                      />

                      {isAnalyzing && (
                        <div className="analysis-loading">
                          <Activity
                            size={18}
                            className="spinning"
                          />
                          AI is analysing your singing...
                        </div>
                      )}

                      {analysis &&
                        !isAnalyzing && (
                          <div className="voice-analysis-result">
                            <div className="voice-score">
                              <strong>
                                {analysis.score}%
                              </strong>

                              <span>
                                Voice Stability
                              </span>
                            </div>

                            <div>
                              <h5>
                                {
                                  getFeedback(
                                    analysis.score
                                  ).title
                                }
                              </h5>

                              <p>
                                {
                                  getFeedback(
                                    analysis.score
                                  ).text
                                }
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {analysisError && (
                    <div className="analysis-error">
                      {analysisError}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    className="primary-music-button"
                    onClick={() =>
                      setLessonStep("quiz")
                    }
                  >
                    Continue to Quiz
                    <ArrowRight size={18} />
                  </button>
                </div>
              </>
            )}

            {lessonStep === "quiz" && (
              <div className="quiz-screen">
                <div className="quiz-icon">
                  <Brain size={30} />
                </div>

                <span className="section-kicker">
                  QUICK CHECK
                </span>

                <h3>
                  Test Your Understanding
                </h3>

                <p>
                  Answer correctly to complete this
                  lesson and unlock the next stage.
                </p>

                <div className="quiz-question">
                  <span>
                    QUESTION 1
                  </span>

                  <h4>
                    {selectedLesson.question}
                  </h4>
                </div>

                <div className="quiz-options">
                  {selectedLesson.options.map(
                    (option) => (
                      <button
                        key={option}
                        className={`quiz-option ${
                          selectedAnswer === option
                            ? "selected"
                            : ""
                        } ${
                          quizResult === "correct" &&
                          option ===
                            selectedLesson.answer
                            ? "correct"
                            : ""
                        } ${
                          quizResult === "wrong" &&
                          selectedAnswer ===
                            option
                            ? "wrong"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedAnswer(
                            option
                          )
                        }
                        disabled={
                          quizResult === "correct"
                        }
                      >
                        <span className="option-letter">
                          {String.fromCharCode(
                            65 +
                              selectedLesson.options.indexOf(
                                option
                              )
                          )}
                        </span>

                        {option}

                        {quizResult ===
                          "correct" &&
                          option ===
                            selectedLesson.answer && (
                            <Check size={18} />
                          )}
                      </button>
                    )
                  )}
                </div>

                {quizResult === "wrong" && (
                  <div className="quiz-feedback wrong">
                    <strong>
                      Not quite.
                    </strong>

                    <span>
                      Try again and think about the lesson
                      carefully.
                    </span>

                    <button onClick={retryQuiz}>
                      <RotateCcw size={16} />
                      Try Again
                    </button>
                  </div>
                )}

                {quizResult === "correct" && (
                  <div className="quiz-feedback correct">
                    <strong>
                      Excellent!
                    </strong>

                    <span>
                      Lesson completed. Your musician is
                      getting stronger.
                    </span>
                  </div>
                )}

                {!quizResult && (
                  <button
                    className="primary-music-button quiz-submit"
                    disabled={!selectedAnswer}
                    onClick={submitQuiz}
                  >
                    Complete Lesson
                    <Check size={18} />
                  </button>
                )}

                {quizResult === "correct" && (
                  <button
                    className="primary-music-button quiz-submit"
                    onClick={closeLesson}
                  >
                    Continue Journey
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            )}

            {lessonStep === "completed" && (
              <div className="lesson-complete-screen">
                <div className="completion-burst">
                  <Sparkles size={38} />
                </div>

                <span className="section-kicker">
                  LESSON COMPLETE
                </span>

                <h3>
                  {selectedLesson.id ===
                  LESSONS.length
                    ? "The Musician Inside You Has Awakened!"
                    : "Another Part of You Has Come Alive!"}
                </h3>

                <p>
                  {selectedLesson.id ===
                  LESSONS.length
                    ? "You completed the entire musical foundation. Your journey has transformed the learner into a musician."
                    : "You've taken another step toward awakening the musician inside you."}
                </p>

                <div className="completion-rewards">
                  <div>
                    <Zap size={18} />
                    <strong>
                      +{selectedLesson.xp}
                    </strong>
                    <span>XP earned</span>
                  </div>

                  <div>
                    <Music2 size={18} />
                    <strong>
                      Stage{" "}
                      {Math.min(
                        selectedLesson.id,
                        6
                      )}
                    </strong>
                    <span>
                      Musician awakened
                    </span>
                  </div>
                </div>

                <button
                  className="primary-music-button"
                  onClick={closeLesson}
                >
                  Continue
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showCelebration && (
        <div className="celebration-backdrop">
          <div className="celebration-card">
            <div className="celebration-musician">
              <div className="celebration-aura" />

              <div className="celebration-person">
                <div className="celebration-head" />
                <div className="celebration-body" />
                <div className="celebration-arm" />
              </div>

              <div className="celebration-mic">
                <div />
                <span />
              </div>

              <span className="celebration-note note-a">
                ♪
              </span>

              <span className="celebration-note note-b">
                ♫
              </span>

              <span className="celebration-note note-c">
                ♬
              </span>

              <span className="celebration-note note-d">
                ✦
              </span>
            </div>

            <span className="section-kicker">
              FULL AWAKENING
            </span>

            <h2>
              The Musician Inside
              <br />
              You Has Awakened!
            </h2>

            <p>
              Six lessons. Six stages. One new version of
              you.
              <br />
              Your musical journey has officially begun.
            </p>

            <div className="celebration-stats">
              <div>
                <strong>6</strong>
                <span>Lessons</span>
              </div>

              <div>
                <strong>
                  {progress.xp}
                </strong>
                <span>XP Earned</span>
              </div>

              <div>
                <strong>100%</strong>
                <span>Journey</span>
              </div>
            </div>

            <button
              className="primary-music-button celebration-button"
              onClick={() =>
                setShowCelebration(false)
              }
            >
              <Music2 size={19} />
              Enter Your Musician Era
              <ArrowRight size={19} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Music;
