import {
  ArrowLeft,
  Music2,
  Upload,
  Mic2,
  Sparkles,
  Loader2,
  CheckCircle2,
  BarChart3,
  Play,
  BookOpen,
  Circle,
  Trophy,
  RotateCcw,
  Square,
  Lock,
  Star,
  Flame,
  ChevronRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useRef, useEffect } from "react";

/*
|--------------------------------------------------------------------------
| API CONFIGURATION
|--------------------------------------------------------------------------
| Local:
|   http://127.0.0.1:8000
|
| Deployment:
|   Set VITE_API_URL in your Vercel environment variables.
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/*
|--------------------------------------------------------------------------
| MUSIC BASICS LESSONS
|--------------------------------------------------------------------------
| Put your lesson videos inside:
|
| public/
|   lessons/
|     music/
|       pitch-basics.mp4
|       rhythm-basics.mp4
|       voice-control.mp4
|--------------------------------------------------------------------------
*/

const musicLessons = [
  {
    id: 1,
    title: "Pitch Basics",
    description:
      "Understand high and low pitch and learn how your voice moves between notes.",
    duration: "5 min",
    video: "/lessons/music/pitch-basics.mp4",
    topics: ["High & low pitch", "Matching notes", "Basic vocal control"],
    quiz: [
      {
        question: "What does pitch describe in music?",
        options: [
          "How high or low a sound is",
          "How loud a sound is",
          "How long a song is",
          "How fast a song is",
        ],
        answer: 0,
        explanation: "Pitch tells us whether a sound is higher or lower.",
      },
      {
        question: "When your target note is higher than your current note, what should you do?",
        options: [
          "Lower your voice",
          "Raise your pitch",
          "Stop immediately",
          "Increase the volume only",
        ],
        answer: 1,
        explanation: "You need to raise your pitch to reach the higher target note.",
      },
    ],
  },
  {
    id: 2,
    title: "Rhythm Basics",
    description:
      "Learn how beats, timing and rhythm work together when singing or performing music.",
    duration: "6 min",
    video: "/lessons/music/rhythm-basics.mp4",
    topics: ["Beat", "Tempo", "Timing"],
    quiz: [
      {
        question: "What is a beat?",
        options: [
          "A basic pulse in music",
          "A type of microphone",
          "A vocal warm-up",
          "A musical instrument",
        ],
        answer: 0,
        explanation: "A beat is the steady pulse that helps organize musical timing.",
      },
      {
        question: "What does tempo describe?",
        options: [
          "The pitch of a note",
          "The speed of the beat",
          "The loudness of a singer",
          "The shape of a waveform",
        ],
        answer: 1,
        explanation: "Tempo describes how fast or slow the musical pulse is.",
      },
    ],
  },
  {
    id: 3,
    title: "Voice Control",
    description:
      "Practice breathing, voice stability and controlled movement between notes.",
    duration: "7 min",
    video: "/lessons/music/voice-control.mp4",
    topics: ["Breathing", "Voice stability", "Note control"],
    quiz: [
      {
        question: "Why is controlled breathing useful for singing?",
        options: [
          "It helps support and control the voice",
          "It changes the song file format",
          "It automatically fixes pitch",
          "It makes every note louder",
        ],
        answer: 0,
        explanation: "Steady breath support helps you control your voice while singing.",
      },
      {
        question: "What does voice stability mean?",
        options: [
          "Keeping the voice controlled and steady",
          "Always singing at maximum volume",
          "Changing pitch randomly",
          "Stopping between every note",
        ],
        answer: 0,
        explanation: "Voice stability means maintaining controlled, steady vocal output.",
      },
    ],
  },
];

function Music() {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | MAIN MODE
  |--------------------------------------------------------------------------
  */

  const [activeMode, setActiveMode] = useState("basics");

  /*
  |--------------------------------------------------------------------------
  | MUSIC BASICS
  |--------------------------------------------------------------------------
  */

  const [selectedLesson, setSelectedLesson] = useState(musicLessons[0]);

  const [completedLessons, setCompletedLessons] = useState(() => {
    try {
      const saved = localStorage.getItem("skillsensai_music_lessons");

      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Unable to load music progress:", error);
    }

    return [];
  });

  /* --------------------------------------------------------------------------
     DUOLINGO-STYLE LEARNING STATE
     -------------------------------------------------------------------------- */

  const [musicXP, setMusicXP] = useState(() => {
    try {
      return Number(localStorage.getItem("skillsensai_music_xp")) || 0;
    } catch {
      return 0;
    }
  });

  const [musicNotes, setMusicNotes] = useState(() => {
    try {
      return Number(localStorage.getItem("skillsensai_music_notes")) || 0;
    } catch {
      return 0;
    }
  });

  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [practiceAttempted, setPracticeAttempted] = useState(false);

  const completedCount = completedLessons.length;
  const characterStage =
    progressPercentage === 100
      ? "Awakened Music Master"
      : progressPercentage >= 67
      ? "Performer Awakening"
      : progressPercentage >= 34
      ? "Musician Awakening"
      : progressPercentage > 0
      ? "First Spark"
      : "Lifeless Shadow";

  const musicLevel =
    musicXP >= 1000
      ? "Maestro"
      : musicXP >= 500
      ? "Artist"
      : musicXP >= 250
      ? "Musician"
      : musicXP >= 100
      ? "Apprentice"
      : "Beginner";

  const handleQuizAnswer = (questionIndex, optionIndex) => {
    if (quizSubmitted) return;

    setQuizAnswers((previous) => ({
      ...previous,
      [questionIndex]: optionIndex,
    }));
  };

  const submitLessonQuiz = () => {
    const questions = selectedLesson.quiz || [];

    if (questions.some((_, index) => quizAnswers[index] === undefined)) {
      setError("Answer every quiz question before submitting.");
      return;
    }

    const score = questions.reduce(
      (total, question, index) =>
        total + (quizAnswers[index] === question.answer ? 1 : 0),
      0
    );

    setQuizScore(score);
    setQuizSubmitted(true);
    setError("");

    if (score === questions.length) {
      setMusicXP((previous) => previous + 10);
      setMusicNotes((previous) => previous + 2);
    }
  };

  const retryLessonQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | BASIC MUSIC RECORDING
  |--------------------------------------------------------------------------
  */

  const [isBasicsRecording, setIsBasicsRecording] = useState(false);
  const [basicsRecordingUrl, setBasicsRecordingUrl] = useState(null);
  const [basicsRecordingFile, setBasicsRecordingFile] = useState(null);
  const [basicsRecordingTime, setBasicsRecordingTime] = useState(0);

  const basicsMediaRecorderRef = useRef(null);
  const basicsAudioChunksRef = useRef([]);
  const basicsTimerRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | BASIC MUSIC UPLOAD
  |--------------------------------------------------------------------------
  */

  const [uploadedBasicsFile, setUploadedBasicsFile] = useState(null);
  const [uploadedBasicsUrl, setUploadedBasicsUrl] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | SONG ANALYSIS
  |--------------------------------------------------------------------------
  */

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | VOICE ANALYSIS
  |--------------------------------------------------------------------------
  */

  const [isRecording, setIsRecording] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceAnalysis, setVoiceAnalysis] = useState(null);
  const [accuracy, setAccuracy] = useState(null);

  const mediaRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);

  /*
  |--------------------------------------------------------------------------
  | CLEANUP
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      if (basicsTimerRef.current) {
        clearInterval(basicsTimerRef.current);
      }

      if (basicsRecordingUrl) {
        URL.revokeObjectURL(basicsRecordingUrl);
      }

      if (uploadedBasicsUrl) {
        URL.revokeObjectURL(uploadedBasicsUrl);
      }
    };
  }, [basicsRecordingUrl, uploadedBasicsUrl]);

  /*
  |--------------------------------------------------------------------------
  | SAVE MUSIC PROGRESS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    try {
      localStorage.setItem(
        "skillsensai_music_lessons",
        JSON.stringify(completedLessons)
      );
    } catch (error) {
      console.error("Unable to save music progress:", error);
    }
  }, [completedLessons]);

  useEffect(() => {
    try {
      localStorage.setItem("skillsensai_music_xp", String(musicXP));
      localStorage.setItem("skillsensai_music_notes", String(musicNotes));
    } catch (error) {
      console.error("Unable to save music rewards:", error);
    }
  }, [musicXP, musicNotes]);

  /*
  |--------------------------------------------------------------------------
  | PROGRESS CALCULATION
  |--------------------------------------------------------------------------
  */

  const progressPercentage = Math.round(
    (completedLessons.length / musicLessons.length) * 100
  );

  /*
  |--------------------------------------------------------------------------
  | SELECT LESSON
  |--------------------------------------------------------------------------
  */

  const handleLessonSelect = (lesson) => {
    const lessonIndex = musicLessons.findIndex(
      (item) => item.id === lesson.id
    );

    const previousLessonCompleted =
      lessonIndex === 0 ||
      completedLessons.includes(musicLessons[lessonIndex - 1].id);

    if (!previousLessonCompleted) {
      return;
    }

    setSelectedLesson(lesson);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setPracticeAttempted(false);
    setError("");

    setUploadedBasicsFile(null);

    if (uploadedBasicsUrl) {
      URL.revokeObjectURL(uploadedBasicsUrl);
    }

    setUploadedBasicsUrl(null);
    setBasicsRecordingFile(null);

    if (basicsRecordingUrl) {
      URL.revokeObjectURL(basicsRecordingUrl);
    }

    setBasicsRecordingUrl(null);
  };

  /*
  |--------------------------------------------------------------------------
  | MARK LESSON COMPLETE
  |--------------------------------------------------------------------------
  */

  const handleCompleteLesson = () => {
    if (completedLessons.includes(selectedLesson.id)) return;

    if (!quizSubmitted || quizScore !== selectedLesson.quiz.length) {
      setError("Complete the quiz perfectly before finishing this lesson.");
      return;
    }

    if (!practiceAttempted) {
      setError("Record or upload a practice attempt before finishing this lesson.");
      return;
    }

    setCompletedLessons((previous) => [...previous, selectedLesson.id]);
    setMusicXP((previous) => previous + 50);
    setMusicNotes((previous) => previous + 10);
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | RESET MUSIC PROGRESS
  |--------------------------------------------------------------------------
  */

  const resetMusicProgress = () => {
    setCompletedLessons([]);
    setMusicXP(0);
    setMusicNotes(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setPracticeAttempted(false);
    localStorage.removeItem("skillsensai_music_lessons");
    localStorage.removeItem("skillsensai_music_xp");
    localStorage.removeItem("skillsensai_music_notes");
  };

  /*
  |--------------------------------------------------------------------------
  | BASIC MUSIC LIVE RECORDING
  |--------------------------------------------------------------------------
  */

  const startBasicsRecording = async () => {
    try {
      setBasicsRecordingFile(null);

      if (basicsRecordingUrl) {
        URL.revokeObjectURL(basicsRecordingUrl);
        setBasicsRecordingUrl(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);

      basicsMediaRecorderRef.current = recorder;
      basicsAudioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          basicsAudioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(
          basicsAudioChunksRef.current,
          {
            type: "audio/webm",
          }
        );

        const file = new File(
          [blob],
          `music-basics-${Date.now()}.webm`,
          {
            type: "audio/webm",
          }
        );

        const url = URL.createObjectURL(blob);

        setBasicsRecordingFile(file);
        setBasicsRecordingUrl(url);
        setPracticeAttempted(true);

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();

      setIsBasicsRecording(true);
      setBasicsRecordingTime(0);

      basicsTimerRef.current = setInterval(() => {
        setBasicsRecordingTime((previous) => previous + 1);
      }, 1000);
    } catch (err) {
      console.error(err);

      alert(
        "Microphone access is required for live recording. Please allow microphone permission in your browser."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | STOP BASIC RECORDING
  |--------------------------------------------------------------------------
  */

  const stopBasicsRecording = () => {
    if (
      basicsMediaRecorderRef.current &&
      basicsMediaRecorderRef.current.state !== "inactive"
    ) {
      basicsMediaRecorderRef.current.stop();
    }

    setIsBasicsRecording(false);

    if (basicsTimerRef.current) {
      clearInterval(basicsTimerRef.current);
      basicsTimerRef.current = null;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | BASIC AUDIO UPLOAD
  |--------------------------------------------------------------------------
  */

  const handleBasicsUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      alert("Please upload an audio file.");
      return;
    }

    setUploadedBasicsFile(file);
    setPracticeAttempted(true);

    if (uploadedBasicsUrl) {
      URL.revokeObjectURL(uploadedBasicsUrl);
    }

    setUploadedBasicsUrl(URL.createObjectURL(file));
  };

  /*
  |--------------------------------------------------------------------------
  | FORMAT TIME
  |--------------------------------------------------------------------------
  */

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  /*
  |--------------------------------------------------------------------------
  | SONG FILE SELECTION
  |--------------------------------------------------------------------------
  */

  const handleSongFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setError("Please upload a valid audio file.");
      return;
    }

    setSelectedFile(file);
    setAnalysis(null);
    setVoiceAnalysis(null);
    setAccuracy(null);
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | AI SONG ANALYSIS
  |--------------------------------------------------------------------------
  */

  const handleSongUpload = async () => {
    if (!selectedFile) {
      setError("Please select a song first.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);
    setVoiceAnalysis(null);
    setAccuracy(null);

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await axios.post(
        `${API_BASE_URL}/analyze-song`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setAnalysis(response.data);
    } catch (err) {
      console.error("Song analysis error:", err);

      const message =
        err?.response?.data?.detail ||
        "Unable to analyze the song. Please check that the backend is running.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | VOICE RECORDING FOR SONG
  |--------------------------------------------------------------------------
  */

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      voiceChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(
          voiceChunksRef.current,
          {
            type: "audio/webm",
          }
        );

        const file = new File(
          [blob],
          "voice-recording.webm",
          {
            type: "audio/webm",
          }
        );

        stream.getTracks().forEach((track) => track.stop());

        await analyzeVoice(file);
      };

      recorder.start();

      setIsRecording(true);
      setVoiceAnalysis(null);
      setAccuracy(null);
    } catch (err) {
      console.error(err);

      setError(
        "Microphone access is required for voice recording."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | STOP SONG VOICE RECORDING
  |--------------------------------------------------------------------------
  */

  const stopVoiceRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  /*
  |--------------------------------------------------------------------------
  | VOICE FILE UPLOAD
  |--------------------------------------------------------------------------
  */

  const handleVoiceUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setError("Please upload a valid audio recording.");
      return;
    }

    await analyzeVoice(file);
  };

  /*
  |--------------------------------------------------------------------------
  | AI VOICE ANALYSIS
  |--------------------------------------------------------------------------
  */

  const analyzeVoice = async (file) => {
    if (!analysis) {
      setError(
        "Please analyze the song before submitting your voice."
      );
      return;
    }

    setVoiceLoading(true);
    setError("");
    setVoiceAnalysis(null);
    setAccuracy(null);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await axios.post(
        `${API_BASE_URL}/analyze-voice`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setVoiceAnalysis(response.data);

      /*
      |--------------------------------------------------------------------------
      | SIMPLE PITCH ACCURACY
      |--------------------------------------------------------------------------
      */

      const originalPitch = Number(analysis?.pitch);
      const userPitch = Number(response?.data?.pitch);

      if (
        Number.isFinite(originalPitch) &&
        Number.isFinite(userPitch) &&
        originalPitch > 0
      ) {
        const difference = Math.abs(
          originalPitch - userPitch
        );

        const calculatedAccuracy = Math.max(
          0,
          Math.min(
            100,
            100 - (difference / originalPitch) * 100
          )
        );

        setAccuracy(calculatedAccuracy.toFixed(1));
      } else if (
        response?.data?.accuracy !== undefined
      ) {
        setAccuracy(
          Number(response.data.accuracy).toFixed(1)
        );
      }
    } catch (err) {
      console.error("Voice analysis error:", err);

      const message =
        err?.response?.data?.detail ||
        "Unable to analyze your voice. Please try again.";

      setError(message);
    } finally {
      setVoiceLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CREATE PITCH GRAPH POINTS
  |--------------------------------------------------------------------------
  */

  const createGraphPoints = (
    values,
    width = 900,
    height = 280
  ) => {
    if (!Array.isArray(values) || values.length === 0) {
      return "";
    }

    const numericValues = values
      .map(Number)
      .filter((value) => Number.isFinite(value));

    if (numericValues.length === 0) {
      return "";
    }

    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);

    const range = max - min || 1;

    return numericValues
      .map((value, index) => {
        const x =
          (index / Math.max(numericValues.length - 1, 1)) *
          width;

        const y =
          height -
          ((value - min) / range) * (height - 30) -
          15;

        return `${x},${y}`;
      })
      .join(" ");
  };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="music-page">
      {/* =========================================================
          BACK BUTTON
      ========================================================= */}

      <button
        className="music-back-button"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={20} />
        Back to Home
      </button>

      {/* =========================================================
          HEADER
      ========================================================= */}

      <section className="music-header">
        <div className="music-header-icon">
          <Music2 size={42} />
        </div>

        <span className="music-label">
          SKILLSENSAI MUSIC TRAINING
        </span>

        <h1>
          Learn <span>Music</span>
        </h1>

        <p>
          Learn music step by step, practise your voice and
          receive AI-powered feedback on your performance.
        </p>
      </section>

      {/* =========================================================
          MODE SWITCH
      ========================================================= */}

      <section className="practice-options">
        <button
          className={`practice-card ${
            activeMode === "basics"
              ? "practice-card-active"
              : ""
          }`}
          onClick={() => setActiveMode("basics")}
        >
          <div className="practice-card-icon">
            <BookOpen size={25} />
          </div>

          <div>
            <h3>Learn From Scratch</h3>

            <p>
              Start with music fundamentals, lessons,
              practice recordings and progress tracking.
            </p>
          </div>
        </button>

        <button
          className={`practice-card ${
            activeMode === "song"
              ? "practice-card-active"
              : ""
          }`}
          onClick={() => setActiveMode("song")}
        >
          <div className="practice-card-icon">
            <Sparkles size={25} />
          </div>

          <div>
            <h3>Learn a Song</h3>

            <p>
              Upload a song and use AI pitch analysis to
              compare your voice with the original.
            </p>
          </div>
        </button>
      </section>

      {/* =========================================================
          LEARN FROM SCRATCH
      ========================================================= */}

      {activeMode === "basics" && (
        <>
          {/* MUSICIAN AWAKENING */}

          <section className="music-awakening-card">
            <div className="awakening-copy">
              <span className="awakening-label">YOUR MUSICIAN</span>
              <h2>{characterStage}</h2>
              <p>
                Every completed lesson brings your musician to life.
                Learn, practise and awaken the full character.
              </p>

              <div className="awakening-stats">
                <div>
                  <strong>{musicXP}</strong>
                  <span>XP</span>
                </div>
                <div>
                  <strong>{musicNotes}</strong>
                  <span>Notes</span>
                </div>
                <div>
                  <strong>{musicLevel}</strong>
                  <span>Level</span>
                </div>
              </div>
            </div>

            <div
              className={`awakening-character stage-${Math.ceil(
                (progressPercentage || 1) / 20
              )}`}
              style={{ "--awakening-progress": `${progressPercentage}%` }}
              aria-label={`Musician awakening progress ${progressPercentage}%`}
            >
              <div className="character-aura" />
              <div className="character-head" />
              <div className="character-hair" />
              <div className="character-body" />
              <div className="character-arm character-arm-left" />
              <div className="character-arm character-arm-right" />
              <div className="character-instrument" />
              <div className="character-glow" />
            </div>

            <div className="awakening-progress">
              <div className="awakening-progress-top">
                <span>Life Progress</span>
                <strong>{progressPercentage}%</strong>
              </div>
              <div className="awakening-progress-track">
                <div
                  className="awakening-progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </section>

          {/* PROGRESS */}

          <section className="comparison-section">
            <div className="comparison-header">
              <div className="comparison-icon">
                <Trophy size={25} />
              </div>

              <div>
                <span>YOUR MUSIC PROGRESS</span>

                <h2>
                  {completedLessons.length} /{" "}
                  {musicLessons.length} Lessons Completed
                </h2>

                <p>
                  Keep practising and build your music
                  skills step by step.
                </p>
              </div>
            </div>

            <div className="accuracy-card">
              <span>COURSE PROGRESS</span>

              <strong>
                {progressPercentage}%
              </strong>

              <p>
                {progressPercentage === 100
                  ? "Music basics completed!"
                  : "Keep learning and practising."}
              </p>
            </div>

            <div
              style={{
                width: "100%",
                height: "10px",
                borderRadius: "20px",
                background: "rgba(130, 150, 200, 0.15)",
                overflow: "hidden",
                marginTop: "20px",
              }}
            >
              <div
                style={{
                  width: `${progressPercentage}%`,
                  height: "100%",
                  borderRadius: "20px",
                  background:
                    "linear-gradient(90deg, #7188ff, #9eafff)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            {completedLessons.length > 0 && (
              <button
                className="practice-button"
                style={{ marginTop: "20px" }}
                onClick={resetMusicProgress}
              >
                <RotateCcw size={16} />
                Reset Progress
              </button>
            )}
          </section>

          {/* LESSON LIST */}

          <section className="pitch-analysis">
            <div className="pitch-header">
              <div>
                <span>MUSIC BASICS</span>

                <h2>Choose a Lesson</h2>
              </div>
            </div>

            <div className="lesson-list">
              {musicLessons.map((lesson, index) => {
                const completed =
                  completedLessons.includes(lesson.id);

                const unlocked =
                  index === 0 ||
                  completedLessons.includes(
                    musicLessons[index - 1].id
                  );

                const selected =
                  selectedLesson.id === lesson.id;

                return (
                  <button
                    key={lesson.id}
                    className={`music-lesson-card ${
                      selected
                        ? "music-lesson-selected"
                        : ""
                    } ${!unlocked ? "music-lesson-locked" : ""}`}
                    onClick={() => handleLessonSelect(lesson)}
                    disabled={!unlocked}
                  >
                    <div className="music-lesson-number">
                      {completed ? (
                        <CheckCircle2 size={22} />
                      ) : unlocked ? (
                        <Circle size={22} />
                      ) : (
                        <Lock size={19} />
                      )}
                    </div>

                    <div className="music-lesson-content">
                      <div className="lesson-title-row">
                        <h3>{lesson.title}</h3>
                        {completed && (
                          <span className="lesson-xp-badge">
                            +50 XP
                          </span>
                        )}
                      </div>

                      <p>{lesson.description}</p>

                      <small>
                        {lesson.duration} · {lesson.quiz.length} quiz questions
                      </small>
                    </div>

                    {unlocked ? (
                      <ChevronRight size={20} />
                    ) : (
                      <Lock size={18} />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* SELECTED LESSON */}

          <section className="comparison-section">
            <div className="comparison-header">
              <div className="comparison-icon">
                <BookOpen size={25} />
              </div>

              <div>
                <span>LESSON {selectedLesson.id}</span>

                <h2>{selectedLesson.title}</h2>

                <p>
                  {selectedLesson.description}
                </p>
              </div>
            </div>

            {/* VIDEO */}

            <div
              className="music-lesson-video"
              style={{ marginTop: "25px" }}
            >
              <video
                key={selectedLesson.video}
                controls
                playsInline
                preload="metadata"
                style={{
                  width: "100%",
                  borderRadius: "16px",
                  background: "#030812",
                  display: "block",
                }}
              >
                <source
                  src={selectedLesson.video}
                  type="video/mp4"
                />

                Your browser does not support video
                playback.
              </video>
            </div>

            {/* TOPICS */}

            <div
              className="key-points"
              style={{ marginTop: "25px" }}
            >
              <h3>What You'll Learn</h3>

              <ul>
                {selectedLesson.topics.map(
                  (topic) => (
                    <li key={topic}>{topic}</li>
                  )
                )}
              </ul>
            </div>

            {/* COMPLETE */}

            <div className="lesson-completion-box">
              <div>
                <span>FINAL STEP</span>
                <p>
                  {completedLessons.includes(selectedLesson.id)
                    ? "This lesson is complete."
                    : "Pass the quiz and submit one practice attempt to complete this lesson."}
                </p>
              </div>

              <button
                className="practice-button"
                style={{ marginTop: "0" }}
                onClick={handleCompleteLesson}
                disabled={completedLessons.includes(
                  selectedLesson.id
                )}
              >
              <CheckCircle2 size={18} />

                {completedLessons.includes(
                  selectedLesson.id
                )
                  ? "Lesson Completed"
                  : "Complete Lesson +50 XP"}
              </button>
            </div>
          </section>

          {/* =====================================================
              LESSON QUIZ
          ===================================================== */}

          <section className="comparison-section lesson-quiz-section">
            <div className="comparison-header">
              <div className="comparison-icon">
                <Star size={25} />
              </div>

              <div>
                <span>CHECKPOINT</span>
                <h2>Quick Music Quiz</h2>
                <p>
                  Complete this checkpoint after the lesson.
                  Get every answer correct to unlock completion.
                </p>
              </div>
            </div>

            <div className="quiz-list">
              {selectedLesson.quiz.map((question, questionIndex) => {
                const selectedAnswer = quizAnswers[questionIndex];
                const correct =
                  quizSubmitted &&
                  selectedAnswer === question.answer;

                return (
                  <div
                    className={`quiz-question ${
                      quizSubmitted
                        ? correct
                          ? "quiz-correct"
                          : "quiz-wrong"
                        : ""
                    }`}
                    key={question.question}
                  >
                    <div className="quiz-question-number">
                      {questionIndex + 1}
                    </div>

                    <div className="quiz-question-body">
                      <h3>{question.question}</h3>

                      <div className="quiz-options">
                        {question.options.map((option, optionIndex) => (
                          <button
                            key={option}
                            className={`quiz-option ${
                              selectedAnswer === optionIndex
                                ? "quiz-option-selected"
                                : ""
                            } ${
                              quizSubmitted &&
                              optionIndex === question.answer
                                ? "quiz-option-correct"
                                : ""
                            }`}
                            onClick={() =>
                              handleQuizAnswer(
                                questionIndex,
                                optionIndex
                              )
                            }
                            disabled={quizSubmitted}
                          >
                            <span>
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            {option}
                          </button>
                        ))}
                      </div>

                      {quizSubmitted && (
                        <p className="quiz-explanation">
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!quizSubmitted ? (
              <button
                className="practice-button"
                onClick={submitLessonQuiz}
                style={{ marginTop: "20px" }}
              >
                <CheckCircle2 size={18} />
                Check Answers
              </button>
            ) : (
              <div className="quiz-result-row">
                <div>
                  <strong>
                    {quizScore}/{selectedLesson.quiz.length}
                  </strong>
                  <span>
                    {quizScore === selectedLesson.quiz.length
                      ? "Perfect! Practice is now unlocked."
                      : "Not quite. Review the lesson and try again."}
                  </span>
                </div>

                {quizScore !== selectedLesson.quiz.length && (
                  <button
                    className="practice-button"
                    onClick={retryLessonQuiz}
                  >
                    <RotateCcw size={16} />
                    Retry Quiz
                  </button>
                )}
              </div>
            )}
          </section>

          {/* =====================================================
              PRACTICE RECORDING
          ===================================================== */}

          <section className="comparison-section">
            <div className="comparison-header">
              <div className="comparison-icon">
                <Mic2 size={25} />
              </div>

              <div>
                <span>PRACTICE</span>

                <h2>Practise Your Voice</h2>

                <p>
                  Record yourself live or upload an
                  existing recording.
                </p>
              </div>
            </div>

            <div className={`practice-unlock-note ${
              quizSubmitted && quizScore === selectedLesson.quiz.length
                ? "practice-unlocked"
                : ""
            }`}>
              {quizSubmitted && quizScore === selectedLesson.quiz.length ? (
                <>
                  <CheckCircle2 size={17} />
                  Quiz passed — your practice attempt is unlocked.
                </>
              ) : (
                <>
                  <Lock size={17} />
                  Pass the quiz to unlock the practice test.
                </>
              )}
            </div>

            {/* LIVE RECORDING */}

            <div className="practice-card" style={{ marginTop: "25px" }}>
              <div className="practice-card-icon">
                <Mic2 size={25} />
              </div>

              <div style={{ flex: 1 }}>
                <h3>Record Live</h3>

                <p>
                  Use your microphone to record your
                  practice.
                </p>

                {isBasicsRecording && (
                  <div
                    className="recording-status"
                    style={{
                      margin: "15px 0 0",
                    }}
                  >
                    <div className="recording-pulse" />

                    <div>
                      <strong>
                        Recording...
                      </strong>

                      <span>
                        {formatTime(
                          basicsRecordingTime
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {!isBasicsRecording ? (
                <button
                  className="practice-button recording-button"
                  onClick={startBasicsRecording}
                  disabled={
                    !quizSubmitted ||
                    quizScore !== selectedLesson.quiz.length
                  }
                >
                  <Mic2 size={17} />
                  Start Recording
                </button>
              ) : (
                <button
                  className="practice-button recording-button"
                  onClick={stopBasicsRecording}
                >
                  <Square size={17} />
                  Stop Recording
                </button>
              )}
            </div>

            {/* RECORDED AUDIO */}

            {basicsRecordingUrl && (
              <div
                className="voice-result"
                style={{ marginTop: "20px" }}
              >
                <div className="voice-result-icon">
                  <CheckCircle2 size={25} />
                </div>

                <div style={{ flex: 1 }}>
                  <span>RECORDING READY</span>

                  <h2>Your Practice Recording</h2>

                  <p>
                    Listen to your recording before
                    submitting another attempt.
                  </p>

                  <audio
                    controls
                    src={basicsRecordingUrl}
                    style={{
                      width: "100%",
                      marginTop: "15px",
                    }}
                  />

                  <a
                    href={basicsRecordingUrl}
                    download={
                      basicsRecordingFile?.name ||
                      "music-practice.webm"
                    }
                    className="practice-button"
                    style={{
                      display: "inline-flex",
                      textDecoration: "none",
                      marginTop: "15px",
                    }}
                  >
                    Save Recording
                  </a>
                </div>
              </div>
            )}

            {/* UPLOAD RECORDING */}

            <div className="practice-card" style={{ marginTop: "20px" }}>
              <div className="practice-card-icon">
                <Upload size={25} />
              </div>

              <div style={{ flex: 1 }}>
                <h3>Upload Recording</h3>

                <p>
                  Upload an audio recording from your
                  device.
                </p>

                {uploadedBasicsFile && (
                  <p
                    style={{
                      marginTop: "10px",
                      color: "#70e0b4",
                    }}
                  >
                    {uploadedBasicsFile.name}
                  </p>
                )}
              </div>

              <label
                className={`practice-button upload-label ${
                  !quizSubmitted ||
                  quizScore !== selectedLesson.quiz.length
                    ? "practice-disabled"
                    : ""
                }`}
              >
                <Upload size={17} />
                Choose Audio

                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={handleBasicsUpload}
                />
              </label>
            </div>

            {uploadedBasicsUrl && (
              <div
                className="voice-result"
                style={{ marginTop: "20px" }}
              >
                <div className="voice-result-icon">
                  <CheckCircle2 size={25} />
                </div>

                <div style={{ flex: 1 }}>
                  <span>UPLOADED RECORDING</span>

                  <h2>Practice Audio</h2>

                  <audio
                    controls
                    src={uploadedBasicsUrl}
                    style={{
                      width: "100%",
                      marginTop: "15px",
                    }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* AI INFORMATION */}

          <section className="music-ai-info">
            <div className="ai-info-icon">
              <Sparkles size={25} />
            </div>

            <div>
              <h3>AI Music Coach</h3>

              <p>
                Your Music Basics practice can be
                recorded or uploaded here. AI pitch
                comparison is available in the
                <strong> Learn a Song </strong>
                section. More detailed AI coaching for
                individual lessons can be connected as
                the platform develops.
              </p>
            </div>
          </section>
        </>
      )}

      {/* =========================================================
          LEARN A SONG
      ========================================================= */}

      {activeMode === "song" && (
        <>
          {/* SONG UPLOAD */}

          <section className="pitch-analysis">
            <div className="pitch-header">
              <div>
                <span>AI SONG ANALYSIS</span>

                <h2>Upload Your Song</h2>

                <p>
                  Upload a song and let SkillSensAI
                  analyse its pitch.
                </p>
              </div>

              <Music2 size={35} />
            </div>

            <div
              className="practice-card"
              style={{ marginTop: "25px" }}
            >
              <div className="practice-card-icon">
                <Upload size={25} />
              </div>

              <div style={{ flex: 1 }}>
                <h3>Select Song</h3>

                <p>
                  MP3, WAV and other supported audio
                  formats.
                </p>
              </div>

              <label className="practice-button upload-label">
                <Upload size={17} />
                Choose Song

                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={handleSongFileChange}
                />
              </label>
            </div>

            {selectedFile && (
              <div className="selected-song">
                <Music2 size={22} />

                <div>
                  <strong>
                    {selectedFile.name}
                  </strong>

                  <small>
                    {(
                      selectedFile.size /
                      (1024 * 1024)
                    ).toFixed(2)}{" "}
                    MB
                  </small>
                </div>

                <CheckCircle2
                  size={22}
                  className="success-icon"
                />
              </div>
            )}

            <button
              className="practice-button"
              onClick={handleSongUpload}
              disabled={loading || !selectedFile}
              style={{ marginTop: "20px" }}
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="loading-icon"
                  />
                  Analysing Song...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Analyse With AI
                </>
              )}
            </button>
          </section>

          {/* ERROR */}

          {error && (
            <div className="analysis-error">
              {error}
            </div>
          )}

          {/* ANALYSIS STATUS */}

          {loading && (
            <div className="analysis-status">
              <Loader2
                size={20}
                className="loading-icon"
              />

              Analysing pitch and extracting musical
              information...
            </div>
          )}

          {/* =====================================================
              PITCH ANALYSIS RESULT
          ===================================================== */}

          {analysis && (
            <section className="pitch-analysis">
              <div className="pitch-header">
                <div>
                  <span>PITCH EXTRACTION</span>

                  <h2>Song Analysis</h2>

                  <p>
                    AI has analysed the uploaded song.
                  </p>
                </div>

                <BarChart3 size={35} />
              </div>

              {analysis.duration && (
                <div className="song-duration">
                  <small>Duration</small>

                  <strong>
                    {Number(
                      analysis.duration
                    ).toFixed(2)}{" "}
                    sec
                  </strong>
                </div>
              )}

              {Array.isArray(analysis.pitch) ? (
                <div className="pitch-graph-container">
                  <div className="pitch-label-high">
                    High
                  </div>

                  <div className="pitch-label-low">
                    Low
                  </div>

                  <svg
                    viewBox="0 0 900 280"
                    className="pitch-graph"
                    preserveAspectRatio="none"
                  >
                    <line
                      x1="0"
                      y1="70"
                      x2="900"
                      y2="70"
                      className="graph-grid"
                    />

                    <line
                      x1="0"
                      y1="140"
                      x2="900"
                      y2="140"
                      className="graph-grid"
                    />

                    <line
                      x1="0"
                      y1="210"
                      x2="900"
                      y2="210"
                      className="graph-grid"
                    />

                    <polyline
                      points={createGraphPoints(
                        analysis.pitch
                      )}
                      className="pitch-line"
                    />
                  </svg>
                </div>
              ) : (
                <div className="no-pitch">
                  Pitch graph data is not available
                  for this recording.
                </div>
              )}

              <div className="pitch-info">
                <div>
                  <span className="pitch-dot" />

                  <p>
                    Detected song pitch
                  </p>
                </div>

                {analysis.pitch && (
                  <p>
                    Pitch:{" "}
                    {Array.isArray(
                      analysis.pitch
                    )
                      ? "Multiple notes"
                      : `${analysis.pitch} Hz`}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* =====================================================
              VOICE PRACTICE
          ===================================================== */}

          {analysis && (
            <section className="comparison-section">
              <div className="comparison-header">
                <div className="comparison-icon">
                  <Mic2 size={25} />
                </div>

                <div>
                  <span>YOUR PERFORMANCE</span>

                  <h2>Sing Along</h2>

                  <p>
                    Record your voice live or upload
                    your own recording.
                  </p>
                </div>
              </div>

              <div className="practice-options">
                {/* LIVE */}

                <div className="practice-card">
                  <div className="practice-card-icon">
                    <Mic2 size={25} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3>Record Live</h3>

                    <p>
                      Record your voice using your
                      microphone.
                    </p>
                  </div>

                  {!isRecording ? (
                    <button
                      className="practice-button recording-button"
                      onClick={
                        startVoiceRecording
                      }
                    >
                      <Mic2 size={17} />
                      Start Recording
                    </button>
                  ) : (
                    <button
                      className="practice-button recording-button"
                      onClick={
                        stopVoiceRecording
                      }
                    >
                      <Square size={17} />
                      Stop & Analyse
                    </button>
                  )}
                </div>

                {/* UPLOAD */}

                <div className="practice-card">
                  <div className="practice-card-icon">
                    <Upload size={25} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3>Upload Voice</h3>

                    <p>
                      Upload an existing singing
                      recording.
                    </p>
                  </div>

                  <label className="practice-button upload-label">
                    <Upload size={17} />
                    Upload Recording

                    <input
                      type="file"
                      accept="audio/*"
                      hidden
                      onChange={
                        handleVoiceUpload
                      }
                    />
                  </label>
                </div>
              </div>

              {voiceLoading && (
                <div className="analysis-status">
                  <Loader2
                    size={20}
                    className="loading-icon"
                  />

                  Analysing your voice...
                </div>
              )}

              {isRecording && (
                <div className="recording-status">
                  <div className="recording-pulse" />

                  <div>
                    <strong>
                      Recording your voice...
                    </strong>

                    <span>
                      Stop recording when you
                      finish singing.
                    </span>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* =====================================================
              VOICE RESULT
          ===================================================== */}

          {voiceAnalysis && (
            <section className="voice-result">
              <div className="voice-result-icon">
                <CheckCircle2 size={26} />
              </div>

              <div>
                <span>AI VOICE ANALYSIS</span>

                <h2>
                  Your Voice Has Been Analysed
                </h2>

                <p>
                  SkillSensAI compared your
                  recording with the selected song.
                </p>
              </div>
            </section>
          )}

          {/* =====================================================
              ACCURACY
          ===================================================== */}

          {accuracy !== null && (
            <section className="comparison-section">
              <div className="comparison-header">
                <div className="comparison-icon">
                  <BarChart3 size={25} />
                </div>

                <div>
                  <span>PERFORMANCE RESULT</span>

                  <h2>Pitch Accuracy</h2>

                  <p>
                    Your estimated pitch match with
                    the original song.
                  </p>
                </div>
              </div>

              <div className="accuracy-card">
                <span>YOUR ACCURACY</span>

                <strong>
                  {accuracy}%
                </strong>

                <p>
                  Keep practising to improve your
                  pitch consistency.
                </p>
              </div>

              {/* COMPARISON GRAPH */}

              <div className="comparison-legend">
                <div>
                  <span className="legend-dot original-dot" />
                  Original
                </div>

                <div>
                  <span className="legend-dot voice-dot" />
                  Your Voice
                </div>
              </div>

              <div className="comparison-graph-container">
                <div className="comparison-label-high">
                  High
                </div>

                <div className="comparison-label-low">
                  Low
                </div>

                <svg
                  viewBox="0 0 900 280"
                  className="comparison-graph"
                  preserveAspectRatio="none"
                >
                  {Array.isArray(
                    analysis?.pitch
                  ) && (
                    <polyline
                      points={createGraphPoints(
                        analysis.pitch
                      )}
                      className="original-pitch-line"
                    />
                  )}

                  {Array.isArray(
                    voiceAnalysis?.pitch
                  ) && (
                    <polyline
                      points={createGraphPoints(
                        voiceAnalysis.pitch
                      )}
                      className="voice-pitch-line"
                    />
                  )}
                </svg>
              </div>
            </section>
          )}

          {/* =====================================================
              AI INFORMATION
          ===================================================== */}

          <section className="music-ai-info">
            <div className="ai-info-icon">
              <Sparkles size={25} />
            </div>

            <div>
              <h3>AI-Powered Music Coach</h3>

              <p>
                Upload a song, record your voice and
                compare your pitch with the original.
                SkillSensAI uses the analysis to provide
                performance feedback and help you
                practise more effectively.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Music;
