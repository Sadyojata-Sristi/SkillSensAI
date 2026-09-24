import {
  ArrowLeft,
  Music2,
  BookOpen,
  Mic2,
  Upload,
  Square,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import "./MusicLearn.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://skillsensai-backend.onrender.com";

const lessons = [
  {
    id: 1,
    title: "Pitch Basics",
    level: "BEGINNER",
    description:
      "Learn how high and low sounds work. Understand pitch and practise controlling your voice.",
    video: "/lessons/music/pitch-basics.mp4",
  },
  {
    id: 2,
    title: "Rhythm Basics",
    level: "BEGINNER",
    description:
      "Learn how rhythm and timing work in music. Practise keeping a steady beat.",
    video: "/lessons/music/rhythm-basics.mp4",
  },
  {
    id: 3,
    title: "Voice Control",
    level: "BEGINNER",
    description:
      "Learn basic voice control techniques and practise producing a steady sound.",
    video: "/lessons/music/voice-control.mp4",
  },
];

function MusicLearn() {
  const navigate = useNavigate();

  const [selectedLesson, setSelectedLesson] = useState(lessons[0]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [uploadedAudio, setUploadedAudio] = useState(null);

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError("");
      setAnalysis(null);
      setRecordedAudio(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
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

        const audioUrl = URL.createObjectURL(blob);

        setRecordedAudio({
          blob,
          url: audioUrl,
          name: "my-recording.webm",
        });

        if (streamRef.current) {
          streamRef.current
            .getTracks()
            .forEach((track) => track.stop());
        }
      };

      recorder.start();

      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(
        "Microphone access was blocked. Please allow microphone permission and try again."
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

    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleAudioUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setAnalysis(null);
    setRecordedAudio(null);

    const audioUrl = URL.createObjectURL(file);

    setUploadedAudio({
      file,
      url: audioUrl,
      name: file.name,
    });
  };

  const getCurrentAudio = () => {
    if (recordedAudio) {
      return recordedAudio.blob;
    }

    if (uploadedAudio) {
      return uploadedAudio.file;
    }

    return null;
  };

  const analyzeRecording = async () => {
    const audio = getCurrentAudio();

    if (!audio) {
      setError("Please record your voice or upload an audio file first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAnalysis(null);

      const formData = new FormData();

      formData.append("file", audio, audio.name || "recording.webm");

      const response = await fetch(`${API_URL}/analyze-voice`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error("The backend could not analyse the recording.");
      }

      const pitch = data.pitch || [];

      let score = 0;

      if (pitch.length > 0) {
        const validPitch = pitch.filter(
          (value) => Number.isFinite(value) && value > 0
        );

        if (validPitch.length > 0) {
          const minPitch = Math.min(...validPitch);
          const maxPitch = Math.max(...validPitch);

          const range = maxPitch - minPitch;

          if (range > 0) {
            score = Math.min(
              100,
              Math.max(
                50,
                Math.round(65 + Math.min(range / 8, 30))
              )
            );
          } else {
            score = 70;
          }
        }
      }

      setAnalysis({
        ...data,
        score,
      });
    } catch (err) {
      console.error(err);
      setError(
        "Unable to analyse the recording. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPractice = () => {
    if (recordedAudio?.url) {
      URL.revokeObjectURL(recordedAudio.url);
    }

    if (uploadedAudio?.url) {
      URL.revokeObjectURL(uploadedAudio.url);
    }

    setRecordedAudio(null);
    setUploadedAudio(null);
    setAnalysis(null);
    setError("");
    setRecordingTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  };

  const currentAudio =
    recordedAudio?.url || uploadedAudio?.url || null;

  return (
    <div className="music-learn-page">
      {/* BACK BUTTON */}

      <button
        className="music-learn-back"
        onClick={() => navigate("/music")}
      >
        <ArrowLeft size={20} />
        Back to Music
      </button>

      {/* HEADER */}

      <section className="music-learn-header">
        <div className="music-learn-icon">
          <Music2 size={38} />
        </div>

        <span className="music-learn-label">
          SKILLSENSAI MUSIC
        </span>

        <h1>
          Learn From <span>Scratch</span>
        </h1>

        <p>
          Build your musical foundation step by step with
          guided lessons and AI-assisted practice.
        </p>
      </section>

      <main className="music-learn-container">
        {/* LESSONS */}

        <section className="lesson-section">
          <div className="section-heading">
            <div>
              <span>YOUR LEARNING PATH</span>
              <h2>Music Fundamentals</h2>
            </div>

            <BookOpen size={28} />
          </div>

          <div className="lesson-list">
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                className={`lesson-card ${
                  selectedLesson.id === lesson.id
                    ? "selected-lesson-card"
                    : ""
                }`}
                onClick={() => {
                  setSelectedLesson(lesson);
                  resetPractice();
                }}
              >
                <div className="lesson-number">
                  {lesson.id}
                </div>

                <div className="lesson-card-content">
                  <span>{lesson.level}</span>

                  <h3>{lesson.title}</h3>

                  <p>{lesson.description}</p>
                </div>

                {selectedLesson.id === lesson.id && (
                  <div className="lesson-active-dot" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* SELECTED LESSON */}

        <section className="selected-lesson-section">
          <div className="selected-lesson-header">
            <div>
              <span>LESSON {selectedLesson.id}</span>

              <h2>{selectedLesson.title}</h2>
            </div>

            <div className="lesson-progress-label">
              STEP {selectedLesson.id} / {lessons.length}
            </div>
          </div>

          {/* VIDEO */}

          <div className="lesson-video-container">
            <video
              className="lesson-video"
              controls
              key={selectedLesson.video}
            >
              <source
                src={selectedLesson.video}
                type="video/mp4"
              />

              Your browser does not support video playback.
            </video>
          </div>

          <div className="lesson-description">
            <h3>About this lesson</h3>

            <p>{selectedLesson.description}</p>
          </div>
        </section>

        {/* PRACTICE */}

        <section className="practice-section">
          <div className="practice-header">
            <div>
              <span>PRACTICE</span>

              <h2>Try It Yourself</h2>

              <p>
                Record your voice live or upload a recording
                and let SkillSensAI analyse your performance.
              </p>
            </div>

            <Mic2 size={34} />
          </div>

          <div className="practice-card">
            <div className="practice-options">
              {/* RECORD */}

              {!isRecording ? (
                <button
                  className="practice-option learn-record-button"
                  onClick={startRecording}
                >
                  <div className="practice-option-icon">
                    <Mic2 size={30} />
                  </div>

                  <div className="practice-option-content">
                    <h3>Start Recording</h3>

                    <p>
                      Record your voice directly using
                      your microphone.
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  className="practice-option learn-stop-button"
                  onClick={stopRecording}
                >
                  <div className="practice-option-icon">
                    <Square size={26} />
                  </div>

                  <div className="practice-option-content">
                    <h3>Stop Recording</h3>

                    <p>
                      Recording:{" "}
                      {formatTime(recordingTime)}
                    </p>
                  </div>
                </button>
              )}

              {/* UPLOAD */}

              <label className="practice-option learn-upload-label">
                <div className="practice-option-icon">
                  <Upload size={30} />
                </div>

                <div className="practice-option-content">
                  <h3>Choose Audio</h3>

                  <p>
                    Upload an existing voice recording.
                  </p>
                </div>

                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                />
              </label>
            </div>

            {/* RECORDING STATUS */}

            {isRecording && (
              <div className="learn-recording-status">
                <div className="learn-recording-dot" />

                Recording your voice...

                <strong>
                  {formatTime(recordingTime)}
                </strong>
              </div>
            )}

            {/* AUDIO */}

            {currentAudio && (
              <div className="learn-audio-preview">
                <div>
                  <span>YOUR RECORDING</span>

                  <strong>
                    {recordedAudio?.name ||
                      uploadedAudio?.name}
                  </strong>
                </div>

                <audio
                  controls
                  src={currentAudio}
                />
              </div>
            )}

            {/* ANALYZE */}

            {currentAudio && !analysis && (
              <button
                className="learn-analyze-button"
                onClick={analyzeRecording}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2
                      size={20}
                      className="spin"
                    />

                    Analysing...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />

                    Analyse My Performance
                  </>
                )}
              </button>
            )}

            {/* ERROR */}

            {error && (
              <div className="music-learn-error">
                {error}
              </div>
            )}

            {/* RESULT */}

            {analysis && (
              <div className="learn-analysis-result">
                <div className="learn-result-header">
                  <div className="learn-result-icon">
                    <CheckCircle2 size={25} />
                  </div>

                  <div>
                    <span>AI PRACTICE RESULT</span>

                    <h3>Analysis Complete</h3>
                  </div>
                </div>

                <div className="learn-score-section">
                  <div className="learn-score-circle">
                    <strong>
                      {analysis.score}%
                    </strong>

                    <span>Score</span>
                  </div>

                  <div className="learn-score-info">
                    <h3>
                      Keep Practising!
                    </h3>

                    <p>
                      Your recording has been analysed
                      using pitch information extracted
                      from your voice.
                    </p>
                  </div>
                </div>

                <div className="learn-stats-grid">
                  <div className="learn-stat">
                    <span>Average Pitch</span>

                    <strong>
                      {analysis.average_pitch
                        ? `${Number(
                            analysis.average_pitch
                          ).toFixed(1)} Hz`
                        : "--"}
                    </strong>
                  </div>

                  <div className="learn-stat">
                    <span>Minimum Pitch</span>

                    <strong>
                      {analysis.minimum_pitch
                        ? `${Number(
                            analysis.minimum_pitch
                          ).toFixed(1)} Hz`
                        : "--"}
                    </strong>
                  </div>

                  <div className="learn-stat">
                    <span>Maximum Pitch</span>

                    <strong>
                      {analysis.maximum_pitch
                        ? `${Number(
                            analysis.maximum_pitch
                          ).toFixed(1)} Hz`
                        : "--"}
                    </strong>
                  </div>

                  <div className="learn-stat">
                    <span>Pitch Points</span>

                    <strong>
                      {analysis.total_pitch_points ||
                        0}
                    </strong>
                  </div>
                </div>

                <div className="learn-feedback">
                  <div className="learn-feedback-title">
                    <Sparkles size={19} />

                    AI Feedback
                  </div>

                  <ul className="learn-feedback-list">
                    <li className="learn-feedback-item">
                      Your voice recording was
                      successfully processed.
                    </li>

                    <li className="learn-feedback-item">
                      Continue practising steady
                      pitch and controlled voice
                      production.
                    </li>

                    <li className="learn-feedback-item">
                      Repeat the exercise and compare
                      your results as you improve.
                    </li>
                  </ul>
                </div>

                <button
                  className="learn-reset-button"
                  onClick={resetPractice}
                >
                  <RotateCcw size={18} />

                  Practise Again
                </button>
              </div>
            )}
          </div>
        </section>

        {/* TIP */}

        <section className="learning-tip">
          <Sparkles size={22} />

          <div>
            <strong>AI Learning Tip</strong>

            <p>
              Practise slowly and consistently. SkillSensAI
              is designed to help you improve at your own
              pace.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default MusicLearn;
