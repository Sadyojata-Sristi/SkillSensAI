import { useEffect, useRef, useState } from "react";
import "./music.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const lessons = [
  {
    id: 1,
    title: "Understanding Pitch",
    description: "Learn what pitch is and how high and low notes work.",
    duration: "5 min",
    part: "head",
    question: "Which describes pitch?",
    options: [
      "How high or low a sound is",
      "How loud a sound is",
      "How long a song is",
      "How fast you clap",
    ],
    answer: 0,
  },
  {
    id: 2,
    title: "Breathing Basics",
    description: "Learn basic breathing control for singing.",
    duration: "6 min",
    part: "chest",
    question: "Why is controlled breathing useful while singing?",
    options: [
      "It improves voice control",
      "It makes the song shorter",
      "It removes rhythm",
      "It changes the lyrics",
    ],
    answer: 0,
  },
  {
    id: 3,
    title: "Voice Control",
    description: "Practice keeping your voice stable and controlled.",
    duration: "7 min",
    part: "left-arm",
    question: "What helps maintain a steady note?",
    options: [
      "Controlled airflow",
      "Random breathing",
      "Speaking faster",
      "Stopping airflow",
    ],
    answer: 0,
  },
  {
    id: 4,
    title: "Rhythm",
    description: "Understand timing, beats and musical patterns.",
    duration: "5 min",
    part: "right-arm",
    question: "What does rhythm mainly describe?",
    options: [
      "The timing and pattern of sounds",
      "Only the volume",
      "Only the pitch",
      "The microphone quality",
    ],
    answer: 0,
  },
  {
    id: 5,
    title: "Singing Practice",
    description: "Combine pitch, breathing and rhythm.",
    duration: "8 min",
    part: "left-leg",
    question: "What should you focus on during practice?",
    options: [
      "Pitch, rhythm and voice control",
      "Only volume",
      "Only speed",
      "Only lyrics",
    ],
    answer: 0,
  },
  {
    id: 6,
    title: "Become a Musician",
    description: "Complete your first learning journey.",
    duration: "10 min",
    part: "right-leg",
    question: "What is the most important part of learning a skill?",
    options: [
      "Consistent practice",
      "Never practicing",
      "Only watching videos",
      "Giving up quickly",
    ],
    answer: 0,
  },
];

function Music() {
  const [mode, setMode] = useState("home");

  const [completedLessons, setCompletedLessons] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("skillsensai_completed_lessons")) || [];
    } catch {
      return [];
    }
  });

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  const [recording, setRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [audioResult, setAudioResult] = useState(null);

  const [songFile, setSongFile] = useState(null);
  const [songResult, setSongResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    localStorage.setItem(
      "skillsensai_completed_lessons",
      JSON.stringify(completedLessons)
    );
  }, [completedLessons]);

  const progress = Math.round(
    (completedLessons.length / lessons.length) * 100
  );

  const xp = completedLessons.length * 100;

  function openLesson(lesson) {
    setSelectedLesson(lesson);
    setSelectedAnswer(null);
    setQuizResult(null);
  }

  function closeLesson() {
    setSelectedLesson(null);
    setSelectedAnswer(null);
    setQuizResult(null);
  }

  function submitQuiz() {
    if (selectedAnswer === null) {
      setQuizResult("Please select an answer.");
      return;
    }

    if (selectedAnswer === selectedLesson.answer) {
      setQuizResult("correct");

      if (!completedLessons.includes(selectedLesson.id)) {
        setCompletedLessons((prev) => [...prev, selectedLesson.id]);
      }
    } else {
      setQuizResult("wrong");
    }
  }

  async function startRecording() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMessage("Live recording is not supported by this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        const url = URL.createObjectURL(blob);
        setRecordedAudio({
          blob,
          url,
          name: "live-recording.webm",
        });

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();

      mediaRecorderRef.current = recorder;
      setRecording(true);
      setMessage("Recording started...");
    } catch (error) {
      console.error(error);
      setMessage("Microphone permission was denied or unavailable.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    setRecording(false);
    setMessage("Recording saved. You can analyse it now.");
  }

  function handleRecordingUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    setRecordedAudio({
      blob: file,
      url,
      name: file.name,
    });

    setAudioResult(null);
    setMessage("Recording uploaded.");
  }

  async function analyseVoice() {
    if (!recordedAudio?.blob) {
      setMessage("Please record or upload a recording first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("AI is analysing your voice...");

      const formData = new FormData();
      formData.append(
        "file",
        recordedAudio.blob,
        recordedAudio.name || "recording.webm"
      );

      const response = await fetch(`${API_URL}/analyze-voice`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Voice analysis failed: ${response.status}`);
      }

      const data = await response.json();

      setAudioResult(data);
      setMessage("Voice analysis completed.");
    } catch (error) {
      console.error(error);
      setMessage(
        "Unable to analyse the recording. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSongUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSongFile(file);
    setSongResult(null);
    setMessage(`Selected: ${file.name}`);
  }

  async function analyseSong() {
    if (!songFile) {
      setMessage("Please select a song first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("AI is analysing the song...");

      const formData = new FormData();
      formData.append("file", songFile);

      const response = await fetch(`${API_URL}/analyze-song`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Song analysis failed: ${response.status}`);
      }

      const data = await response.json();

      setSongResult(data);
      setMessage("Song analysis completed.");
    } catch (error) {
      console.error(error);
      setMessage(
        "Unable to analyse the song. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  function getAccuracy(result) {
    const possibleValues = [
      result?.accuracy,
      result?.pitch_accuracy,
      result?.score,
    ];

    const value = possibleValues.find(
      (item) => typeof item === "number" && Number.isFinite(item)
    );

    if (value === undefined) return null;

    return Math.max(0, Math.min(100, Math.round(value)));
  }

  function getGraphValues(result) {
    const possible =
      result?.pitches ||
      result?.pitch_values ||
      result?.pitch_graph ||
      result?.graph ||
      [];

    if (!Array.isArray(possible) || possible.length === 0) {
      return [35, 55, 42, 70, 60, 82, 65, 76, 50, 68, 80, 58];
    }

    return possible
      .map((value) => {
        if (typeof value === "number") return value;

        if (typeof value === "object" && value !== null) {
          return (
            Number(value.pitch) ||
            Number(value.value) ||
            Number(value.frequency) ||
            0
          );
        }

        return Number(value) || 0;
      })
      .slice(0, 40);
  }

  return (
    <div className="music-page">
      <header className="music-header">
        <div>
          <div className="brand-small">SKILLSENSAI</div>
          <h1>Music</h1>
          <p>Learn. Practice. Perform.</p>
        </div>

        {mode !== "home" && (
          <button
            className="back-button"
            onClick={() => {
              setMode("home");
              setMessage("");
            }}
          >
            ← Back
          </button>
        )}
      </header>

      <main className="music-container">
        {mode === "home" && (
          <>
            <section className="hero-card">
              <div className="hero-text">
                <span className="eyebrow">AI-POWERED MUSIC LEARNING</span>
                <h2>Bring your inner musician to life.</h2>
                <p>
                  Learn music step by step, practise with AI feedback and
                  watch your musician evolve as you improve.
                </p>

                <div className="stats-row">
                  <div className="stat-box">
                    <strong>{progress}%</strong>
                    <span>Progress</span>
                  </div>

                  <div className="stat-box">
                    <strong>{xp}</strong>
                    <span>XP</span>
                  </div>

                  <div className="stat-box">
                    <strong>{completedLessons.length}/6</strong>
                    <span>Lessons</span>
                  </div>
                </div>
              </div>

              <div className={`musician ${progress === 100 ? "awakened" : ""}`}>
                <div className={`musician-part head ${progress >= 17 ? "active" : ""}`} />
                <div className={`musician-part chest ${progress >= 34 ? "active" : ""}`} />
                <div className={`musician-part left-arm ${progress >= 50 ? "active" : ""}`} />
                <div className={`musician-part right-arm ${progress >= 67 ? "active" : ""}`} />
                <div className={`musician-part left-leg ${progress >= 84 ? "active" : ""}`} />
                <div className={`musician-part right-leg ${progress === 100 ? "active" : ""}`} />
                {progress === 100 && <div className="music-particles">♪ ♫ ✦ ♪</div>}
              </div>
            </section>

            <section className="mode-grid">
              <button
                className="mode-card"
                onClick={() => setMode("scratch")}
              >
                <div className="mode-icon">🎼</div>
                <h3>Learn From Scratch</h3>
                <p>
                  Build your fundamentals through interactive lessons,
                  quizzes and practice.
                </p>
                <span>Start learning →</span>
              </button>

              <button
                className="mode-card"
                onClick={() => setMode("song")}
              >
                <div className="mode-icon">🎤</div>
                <h3>Learn a Song</h3>
                <p>
                  Upload a song and use AI analysis to understand pitch,
                  timing and performance.
                </p>
                <span>Analyse a song →</span>
              </button>
            </section>

            {message && <div className="message-box">{message}</div>}
          </>
        )}

        {mode === "scratch" && (
          <section>
            <div className="section-heading">
              <div>
                <span className="eyebrow">LEARN FROM SCRATCH</span>
                <h2>Build your musical foundation</h2>
                <p>
                  Complete lessons to gradually bring your musician to life.
                </p>
              </div>

              <div className="progress-circle">
                {progress}%
              </div>
            </div>

            <div className="lesson-progress">
              <div
                className="lesson-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="lesson-grid">
              {lessons.map((lesson) => {
                const completed = completedLessons.includes(lesson.id);

                return (
                  <button
                    className={`lesson-card ${completed ? "completed" : ""}`}
                    key={lesson.id}
                    onClick={() => openLesson(lesson)}
                  >
                    <div className="lesson-number">
                      {completed ? "✓" : lesson.id}
                    </div>

                    <div className="lesson-content">
                      <h3>{lesson.title}</h3>
                      <p>{lesson.description}</p>
                      <span>{lesson.duration}</span>
                    </div>

                    <div className="lesson-arrow">→</div>
                  </button>
                );
              })}
            </div>

            <div className="practice-card">
              <div>
                <span className="eyebrow">PRACTICE</span>
                <h2>Train your voice</h2>
                <p>
                  Record yourself or upload a recording and get AI-powered
                  feedback.
                </p>
              </div>

              <div className="practice-actions">
                {!recording ? (
                  <button className="primary-button" onClick={startRecording}>
                    ● Record Live
                  </button>
                ) : (
                  <button className="danger-button" onClick={stopRecording}>
                    ■ Stop Recording
                  </button>
                )}

                <label className="secondary-button">
                  ↑ Upload Recording
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleRecordingUpload}
                    hidden
                  />
                </label>
              </div>

              {recordedAudio && (
                <div className="recording-result">
                  <audio src={recordedAudio.url} controls />
                  <button
                    className="primary-button"
                    onClick={analyseVoice}
                    disabled={loading}
                  >
                    {loading ? "Analysing..." : "Analyse My Voice"}
                  </button>
                </div>
              )}

              {audioResult && (
                <div className="analysis-card">
                  <h3>AI Voice Feedback</h3>

                  {getAccuracy(audioResult) !== null && (
                    <div className="score-display">
                      <strong>{getAccuracy(audioResult)}%</strong>
                      <span>Pitch Accuracy</span>
                    </div>
                  )}

                  <p>
                    {audioResult.feedback ||
                      audioResult.message ||
                      "Your recording has been analysed successfully."}
                  </p>
                </div>
              )}

              {message && <div className="message-box">{message}</div>}
            </div>
          </section>
        )}

        {mode === "song" && (
          <section>
            <div className="section-heading">
              <div>
                <span className="eyebrow">LEARN A SONG</span>
                <h2>Analyse your music</h2>
                <p>
                  Upload a song and let SkillSensAI analyse its musical
                  characteristics.
                </p>
              </div>
            </div>

            <div className="upload-card">
              <div className="upload-icon">🎵</div>

              <h2>Upload a song</h2>

              <p>
                Supported formats depend on your backend configuration.
                MP3, WAV and other common audio files can be selected.
              </p>

              <label className="upload-area">
                <span>Choose Audio File</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleSongUpload}
                  hidden
                />
              </label>

              {songFile && (
                <div className="selected-file">
                  <strong>{songFile.name}</strong>
                  <span>
                    {(songFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}

              <button
                className="primary-button large"
                onClick={analyseSong}
                disabled={!songFile || loading}
              >
                {loading ? "Analysing..." : "Analyse Song"}
              </button>

              {message && <div className="message-box">{message}</div>}
            </div>

            {songResult && (
              <div className="song-analysis">
                <div className="analysis-header">
                  <div>
                    <span className="eyebrow">AI ANALYSIS</span>
                    <h2>Song Analysis Result</h2>
                  </div>

                  {songResult.duration !== undefined && (
                    <div className="duration">
                      {Number(songResult.duration).toFixed(2)} sec
                    </div>
                  )}
                </div>

                {getAccuracy(songResult) !== null && (
                  <div className="score-display large-score">
                    <strong>{getAccuracy(songResult)}%</strong>
                    <span>Analysis Score</span>
                  </div>
                )}

                <div className="pitch-graph">
                  {getGraphValues(songResult).map((value, index) => {
                    const numericValue = Number(value) || 0;

                    const height =
                      numericValue > 100
                        ? Math.min(100, numericValue / 5)
                        : Math.max(10, numericValue);

                    return (
                      <div
                        key={index}
                        className="pitch-bar"
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>

                <p className="analysis-feedback">
                  {songResult.feedback ||
                    songResult.message ||
                    "The AI analysis is complete."}
                </p>
              </div>
            )}

            <div className="practice-card song-practice">
              <div>
                <span className="eyebrow">PRACTICE THE SONG</span>
                <h2>Sing along</h2>
                <p>
                  Record your performance and compare it with the AI analysis.
                </p>
              </div>

              <div className="practice-actions">
                {!recording ? (
                  <button className="primary-button" onClick={startRecording}>
                    ● Record Live
                  </button>
                ) : (
                  <button className="danger-button" onClick={stopRecording}>
                    ■ Stop Recording
                  </button>
                )}

                <label className="secondary-button">
                  ↑ Upload Recording
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleRecordingUpload}
                    hidden
                  />
                </label>
              </div>

              {recordedAudio && (
                <div className="recording-result">
                  <audio src={recordedAudio.url} controls />

                  <button
                    className="primary-button"
                    onClick={analyseVoice}
                    disabled={loading}
                  >
                    {loading ? "Analysing..." : "Analyse Performance"}
                  </button>
                </div>
              )}

              {audioResult && (
                <div className="analysis-card">
                  <h3>Performance Feedback</h3>

                  {getAccuracy(audioResult) !== null && (
                    <div className="score-display">
                      <strong>{getAccuracy(audioResult)}%</strong>
                      <span>Pitch Accuracy</span>
                    </div>
                  )}

                  <p>
                    {audioResult.feedback ||
                      audioResult.message ||
                      "Your performance has been analysed."}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {selectedLesson && (
        <div className="modal-overlay" onClick={closeLesson}>
          <div
            className="lesson-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={closeLesson}>
              ×
            </button>

            <span className="eyebrow">LESSON {selectedLesson.id}</span>

            <h2>{selectedLesson.title}</h2>

            <p>{selectedLesson.description}</p>

            <div className="lesson-video-placeholder">
              <div>▶</div>
              <span>Lesson content</span>
              <small>
                Replace this area with your uploaded lesson video when ready.
              </small>
            </div>

            <h3>{selectedLesson.question}</h3>

            <div className="quiz-options">
              {selectedLesson.options.map((option, index) => (
                <button
                  key={option}
                  className={`quiz-option ${
                    selectedAnswer === index ? "selected" : ""
                  }`}
                  onClick={() => setSelectedAnswer(index)}
                >
                  <span>{String.fromCharCode(65 + index)}</span>
                  {option}
                </button>
              ))}
            </div>

            {quizResult === "correct" && (
              <div className="quiz-success">
                ✓ Correct! +100 XP. Your musician is getting stronger.
              </div>
            )}

            {quizResult === "wrong" && (
              <div className="quiz-error">
                Not quite. Try again.
              </div>
            )}

            {quizResult !== "correct" && (
              <button className="primary-button large" onClick={submitQuiz}>
                Check Answer
              </button>
            )}

            {quizResult === "correct" && (
              <button
                className="primary-button large"
                onClick={closeLesson}
              >
                Continue
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Music;
