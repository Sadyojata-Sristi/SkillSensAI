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
  },
  {
    id: 2,
    title: "Rhythm Basics",
    description:
      "Learn how beats, timing and rhythm work together when singing or performing music.",
    duration: "6 min",
    video: "/lessons/music/rhythm-basics.mp4",
    topics: ["Beat", "Tempo", "Timing"],
  },
  {
    id: 3,
    title: "Voice Control",
    description:
      "Practice breathing, voice stability and controlled movement between notes.",
    duration: "7 min",
    video: "/lessons/music/voice-control.mp4",
    topics: ["Breathing", "Voice stability", "Note control"],
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
    setSelectedLesson(lesson);

    setUploadedBasicsFile(null);

    if (uploadedBasicsUrl) {
      URL.revokeObjectURL(uploadedBasicsUrl);
    }

    setUploadedBasicsUrl(null);
  };

  /*
  |--------------------------------------------------------------------------
  | MARK LESSON COMPLETE
  |--------------------------------------------------------------------------
  */

  const handleCompleteLesson = () => {
    if (!completedLessons.includes(selectedLesson.id)) {
      setCompletedLessons((previous) => [
        ...previous,
        selectedLesson.id,
      ]);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RESET MUSIC PROGRESS
  |--------------------------------------------------------------------------
  */

  const resetMusicProgress = () => {
    setCompletedLessons([]);
    localStorage.removeItem("skillsensai_music_lessons");
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
              {musicLessons.map((lesson) => {
                const completed =
                  completedLessons.includes(lesson.id);

                const selected =
                  selectedLesson.id === lesson.id;

                return (
                  <button
                    key={lesson.id}
                    className={`music-lesson-card ${
                      selected
                        ? "music-lesson-selected"
                        : ""
                    }`}
                    onClick={() =>
                      handleLessonSelect(lesson)
                    }
                  >
                    <div className="music-lesson-number">
                      {completed ? (
                        <CheckCircle2 size={22} />
                      ) : (
                        <Circle size={22} />
                      )}
                    </div>

                    <div className="music-lesson-content">
                      <h3>{lesson.title}</h3>

                      <p>{lesson.description}</p>

                      <small>
                        {lesson.duration}
                      </small>
                    </div>

                    <Play size={20} />
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

            <button
              className="practice-button"
              style={{ marginTop: "25px" }}
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
                : "Mark Lesson Complete"}
            </button>
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
                className="practice-button upload-label"
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