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

import "./MusicLearn.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

const musicLessons = [
  {
    id: 1,
    title: "Pitch Basics",
    description:
      "Understand high and low pitch and learn how your voice moves between notes.",
    duration: "5 min",
    video: "/lessons/music/pitch-basics.mp4",
    topics: [
      "High & low pitch",
      "Matching notes",
      "Basic vocal control",
    ],
  },
  {
    id: 2,
    title: "Rhythm Basics",
    description:
      "Learn how beats, timing and rhythm work together when singing or performing music.",
    duration: "6 min",
    video: "/lessons/music/rhythm-basics.mp4",
    topics: [
      "Beat",
      "Tempo",
      "Timing",
    ],
  },
  {
    id: 3,
    title: "Voice Control",
    description:
      "Practice breathing, voice stability and controlled movement between notes.",
    duration: "7 min",
    video: "/lessons/music/voice-control.mp4",
    topics: [
      "Breathing",
      "Voice stability",
      "Note control",
    ],
  },
];

function MusicLearn() {
  const navigate = useNavigate();

  const [selectedLesson, setSelectedLesson] =
    useState(musicLessons[0]);

  const [completedLessons, setCompletedLessons] =
    useState(() => {
      try {
        const saved = localStorage.getItem(
          "skillsensai_music_lessons"
        );

        return saved
          ? JSON.parse(saved)
          : [];
      } catch {
        return [];
      }
    });

  const [isRecording, setIsRecording] =
    useState(false);

  const [recordingUrl, setRecordingUrl] =
    useState(null);

  const [recordingFile, setRecordingFile] =
    useState(null);

  const [recordingTime, setRecordingTime] =
    useState(0);

  const [uploadedFile, setUploadedFile] =
    useState(null);

  const [uploadedUrl, setUploadedUrl] =
    useState(null);

  const [analysis, setAnalysis] =
    useState(null);

  const [analysisLoading, setAnalysisLoading] =
    useState(false);

  const [analysisError, setAnalysisError] =
    useState("");

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(
      "skillsensai_music_lessons",
      JSON.stringify(completedLessons)
    );
  }, [completedLessons]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }

      if (uploadedUrl) {
        URL.revokeObjectURL(uploadedUrl);
      }
    };
  }, [recordingUrl, uploadedUrl]);

  const selectLesson = (lesson) => {
    setSelectedLesson(lesson);

    setAnalysis(null);
    setAnalysisError("");

    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
    }

    if (uploadedUrl) {
      URL.revokeObjectURL(uploadedUrl);
    }

    setRecordingUrl(null);
    setRecordingFile(null);
    setUploadedUrl(null);
    setUploadedFile(null);
  };

  const completeLesson = () => {
    if (
      !completedLessons.includes(
        selectedLesson.id
      )
    ) {
      setCompletedLessons([
        ...completedLessons,
        selectedLesson.id,
      ]);
    }
  };

  const resetProgress = () => {
    setCompletedLessons([]);
    localStorage.removeItem(
      "skillsensai_music_lessons"
    );
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(
      seconds / 60
    );

    const remaining = seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(remaining).padStart(
      2,
      "0"
    )}`;
  };

  /* ===============================
     AI PRACTICE ANALYSIS
  =============================== */

  const analyzePractice = async (file) => {
    if (!file) return;

    setAnalysisLoading(true);
    setAnalysis(null);
    setAnalysisError("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await axios.post(
        `${API_BASE_URL}/analyze-voice`,
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      const pitchData =
        Array.isArray(
          response.data?.pitch
        )
          ? response.data.pitch
              .map(Number)
              .filter(
                (value) =>
                  Number.isFinite(value) &&
                  value > 0
              )
          : [];

      if (!pitchData.length) {
        throw new Error(
          "No clear pitch was detected. Please record your voice more clearly."
        );
      }

      const mean =
        pitchData.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / pitchData.length;

      const variance =
        pitchData.reduce(
          (sum, value) =>
            sum +
            Math.pow(
              value - mean,
              2
            ),
          0
        ) / pitchData.length;

      const deviation =
        Math.sqrt(variance);

      const minPitch =
        Math.min(...pitchData);

      const maxPitch =
        Math.max(...pitchData);

      const range =
        maxPitch - minPitch;

      const stability = Math.max(
        0,
        Math.min(
          100,
          100 -
            (deviation /
              Math.max(mean, 1)) *
              500
        )
      );

      const control = Math.max(
        0,
        Math.min(
          100,
          100 -
            (range /
              Math.max(mean, 1)) *
              100
        )
      );

      const score =
        stability * 0.6 +
        control * 0.4;

      const feedback = [];

      if (stability >= 85) {
        feedback.push(
          "Your pitch remained quite stable during the recording."
        );
      } else if (stability >= 70) {
        feedback.push(
          "Your pitch was fairly stable, but some variation was detected."
        );
      } else {
        feedback.push(
          "Your pitch varied noticeably. Try holding each note more steadily."
        );
      }

      if (control >= 85) {
        feedback.push(
          "You showed good control while moving between different pitches."
        );
      } else if (control >= 70) {
        feedback.push(
          "Your pitch range shows developing vocal control."
        );
      } else {
        feedback.push(
          "Practise moving slowly between notes to improve pitch control."
        );
      }

      feedback.push(
        "Focus on steady breathing while holding each note."
      );

      feedback.push(
        "Repeat the exercise and try to make your pitch movement smoother."
      );

      setAnalysis({
        score: Math.round(score),
        stability: Math.round(stability),
        control: Math.round(control),
        feedback,
        pitch: pitchData,
      });
    } catch (error) {
      console.error(error);

      setAnalysisError(
        error?.response?.data?.detail ||
          error?.message ||
          "Unable to analyse your recording."
      );
    } finally {
      setAnalysisLoading(false);
    }
  };

  /* ===============================
     RECORD
  =============================== */

  const startRecording = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          }
        );

      const recorder =
        new MediaRecorder(stream);

      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (
        event
      ) => {
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

        const file = new File(
          [blob],
          `music-practice-${Date.now()}.webm`,
          {
            type: "audio/webm",
          }
        );

        const url =
          URL.createObjectURL(blob);

        setRecordingFile(file);
        setRecordingUrl(url);

        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        analyzePractice(file);
      };

      recorder.start();

      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current =
        setInterval(() => {
          setRecordingTime(
            (previous) =>
              previous + 1
          );
        }, 1000);
    } catch (error) {
      console.error(error);

      alert(
        "Please allow microphone access to record your voice."
      );
    }
  };

  const stopRecording = () => {
    if (
      recorderRef.current &&
      recorderRef.current
        .state !== "inactive"
    ) {
      recorderRef.current.stop();
    }

    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  /* ===============================
     UPLOAD
  =============================== */

  const handleUpload = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("audio/")
    ) {
      alert(
        "Please upload an audio file."
      );
      return;
    }

    if (uploadedUrl) {
      URL.revokeObjectURL(uploadedUrl);
    }

    const url =
      URL.createObjectURL(file);

    setUploadedFile(file);
    setUploadedUrl(url);

    analyzePractice(file);
  };

  const progress = Math.round(
    (completedLessons.length /
      musicLessons.length) *
      100
  );

  return (
    <div className="music-learn-page">

      {/* BACK */}

      <button
        className="music-back-button"
        onClick={() =>
          navigate("/music")
        }
      >
        <ArrowLeft size={20} />
        Back to Music
      </button>

      {/* HEADER */}

      <section className="music-header">

        <div className="music-header-icon">
          <BookOpen size={40} />
        </div>

        <span className="music-label">
          MUSIC FUNDAMENTALS
        </span>

        <h1>
          Learn From <span>Scratch</span>
        </h1>

        <p>
          Build your music skills through
          guided lessons and AI-assisted
          practice feedback.
        </p>

      </section>

      {/* PROGRESS */}

      <section className="comparison-section">

        <div className="comparison-header">

          <div className="comparison-icon">
            <Trophy size={24} />
          </div>

          <div>
            <span>
              YOUR PROGRESS
            </span>

            <h2>
              {completedLessons.length} /{" "}
              {musicLessons.length}
              {" "}Lessons Completed
            </h2>

            <p>
              {progress}% of your music
              fundamentals completed.
            </p>
          </div>

        </div>

        <div className="music-progress-bar">

          <div
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

        {completedLessons.length > 0 && (
          <button
            className="practice-button"
            onClick={resetProgress}
            style={{
              marginTop: "18px",
            }}
          >
            <RotateCcw size={16} />
            Reset Progress
          </button>
        )}

      </section>

      {/* LESSONS */}

      <section className="pitch-analysis">

        <div className="pitch-header">

          <div>
            <span>
              LESSONS
            </span>

            <h2>
              Choose a Lesson
            </h2>
          </div>

        </div>

        <div className="music-lessons-grid">

          {musicLessons.map(
            (lesson) => {

              const completed =
                completedLessons.includes(
                  lesson.id
                );

              const selected =
                selectedLesson.id ===
                lesson.id;

              return (
                <button
                  key={lesson.id}
                  className={`music-lesson-card ${
                    selected
                      ? "music-lesson-selected"
                      : ""
                  }`}
                  onClick={() =>
                    selectLesson(
                      lesson
                    )
                  }
                >

                  <div className="music-lesson-number">

                    {completed ? (
                      <CheckCircle2
                        size={22}
                      />
                    ) : (
                      <Circle
                        size={22}
                      />
                    )}

                  </div>

                  <div className="music-lesson-content">

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

                  <Play size={20} />

                </button>
              );
            }
          )}

        </div>

      </section>

      {/* SELECTED LESSON */}

      <section className="comparison-section">

        <div className="comparison-header">

          <div className="comparison-icon">
            <Music2 size={24} />
          </div>

          <div>

            <span>
              LESSON {selectedLesson.id}
            </span>

            <h2>
              {selectedLesson.title}
            </h2>

            <p>
              {selectedLesson.description}
            </p>

          </div>

        </div>

        <video
          key={selectedLesson.video}
          controls
          playsInline
          preload="metadata"
          className="music-learning-video"
        >

          <source
            src={selectedLesson.video}
            type="video/mp4"
          />

          Your browser does not
          support video playback.

        </video>

        {/* TOPICS */}

        <div className="music-topics">

          <h3>
            What You'll Learn
          </h3>

          <div>

            {selectedLesson.topics.map(
              (topic) => (
                <span key={topic}>
                  ✓ {topic}
                </span>
              )
            )}

          </div>

        </div>

        {/* COMPLETE */}

        <button
          className="practice-button"
          onClick={completeLesson}
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

      {/* PRACTICE */}

      <section className="comparison-section">

        <div className="comparison-header">

          <div className="comparison-icon">
            <Mic2 size={24} />
          </div>

          <div>

            <span>
              PRACTICE
            </span>

            <h2>
              Practise Your Voice
            </h2>

            <p>
              Record live or upload your
              practice recording.
            </p>

          </div>

        </div>

        {/* RECORD */}

        <div className="music-practice-option">

          <div className="music-practice-icon">
            <Mic2 size={25} />
          </div>

          <div className="music-practice-info">

            <h3>
              Record Live
            </h3>

            <p>
              Record yourself using
              your microphone.
            </p>

            {isRecording && (
              <div className="music-recording-status">

                <span />

                Recording{" "}
                {formatTime(
                  recordingTime
                )}

              </div>
            )}

          </div>

          {!isRecording ? (
            <button
              className="practice-button"
              onClick={startRecording}
            >
              <Mic2 size={17} />
              Start Recording
            </button>
          ) : (
            <button
              className="practice-button"
              onClick={stopRecording}
            >
              <Square size={17} />
              Stop Recording
            </button>
          )}

        </div>

        {/* UPLOAD */}

        <div className="music-practice-option">

          <div className="music-practice-icon">
            <Upload size={25} />
          </div>

          <div className="music-practice-info">

            <h3>
              Upload Recording
            </h3>

            <p>
              Upload an existing audio
              recording.
            </p>

            {uploadedFile && (
              <small>
                {uploadedFile.name}
              </small>
            )}

          </div>

          <label className="practice-button">

            <Upload size={17} />
            Choose Audio

            <input
              type="file"
              accept="audio/*"
              hidden
              onChange={handleUpload}
            />

          </label>

        </div>

      </section>

      {/* RECORDING */}

      {recordingUrl && (
        <section className="voice-result">

          <div className="voice-result-icon">
            <CheckCircle2 size={25} />
          </div>

          <div>

            <span>
              RECORDING READY
            </span>

            <h2>
              Your Practice
            </h2>

            <audio
              controls
              src={recordingUrl}
            />

          </div>

        </section>
      )}

      {/* UPLOAD */}

      {uploadedUrl && (
        <section className="voice-result">

          <div className="voice-result-icon">
            <Upload size={25} />
          </div>

          <div>

            <span>
              UPLOADED RECORDING
            </span>

            <h2>
              Practice Audio
            </h2>

            <audio
              controls
              src={uploadedUrl}
            />

          </div>

        </section>
      )}

      {/* ANALYSIS LOADING */}

      {analysisLoading && (
        <div className="analysis-status">

          <Loader2
            size={20}
            className="loading-icon"
          />

          Analysing your music
          performance...

        </div>
      )}

      {/* ERROR */}

      {analysisError && (
        <div className="analysis-error">
          {analysisError}
        </div>
      )}

      {/* FEEDBACK */}

      {analysis && (
        <section className="comparison-section">

          <div className="comparison-header">

            <div className="comparison-icon">
              <Sparkles size={25} />
            </div>

            <div>

              <span>
                AI PRACTICE FEEDBACK
              </span>

              <h2>
                Your Performance
              </h2>

              <p>
                Here's what SkillSensAI
                detected from your
                recording.
              </p>

            </div>

          </div>

          {/* SCORE */}

          <div className="accuracy-card">

            <span>
              OVERALL PRACTICE SCORE
            </span>

            <strong>
              {analysis.score}%
            </strong>

            <p>
              Keep practising to improve
              your consistency.
            </p>

          </div>

          {/* METRICS */}

          <div className="music-feedback-grid">

            <div className="music-feedback-card">

              <BarChart3 size={25} />

              <span>
                PITCH STABILITY
              </span>

              <strong>
                {analysis.stability}%
              </strong>

              <p>
                Consistency of your pitch
                during the recording.
              </p>

            </div>

            <div className="music-feedback-card">

              <Music2 size={25} />

              <span>
                VOICE CONTROL
              </span>

              <strong>
                {analysis.control}%
              </strong>

              <p>
                Control while moving
                between pitches.
              </p>

            </div>

          </div>

          {/* FEEDBACK */}

          <div className="music-feedback-list">

            <h3>
              Personalised Feedback
            </h3>

            {analysis.feedback.map(
              (item, index) => (
                <div
                  key={index}
                  className="music-feedback-item"
                >

                  <CheckCircle2
                    size={18}
                  />

                  <span>
                    {item}
                  </span>

                </div>
              )
            )}

          </div>

          <button
            className="practice-button"
            onClick={() =>
              setAnalysis(null)
            }
          >
            <RotateCcw size={17} />
            Practise Again
          </button>

          <div className="analysis-note">

            <strong>
              Prototype AI Feedback:
            </strong>{" "}

            This version analyses pitch
            characteristics from your
            recording. Future versions can
            compare your performance
            directly against lesson
            reference audio.

          </div>

        </section>
      )}

      {/* AI INFO */}

      <section className="music-ai-info">

        <div className="ai-info-icon">
          <Sparkles size={25} />
        </div>

        <div>

          <h3>
            AI Music Coach
          </h3>

          <p>
            Learn at your own pace,
            practise your voice and
            receive AI-assisted feedback
            after every practice attempt.
          </p>

        </div>

      </section>

    </div>
  );
}

export default MusicLearn;
