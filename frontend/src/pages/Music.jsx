import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
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

import "./Music.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const LESSONS = [
  {
    id: 1,
    title: "Understanding Pitch",
    description: "Learn what pitch is and how your voice moves between high and low sounds.",
    question: "What determines whether a musical sound is high or low?",
    options: ["Pitch", "Volume", "Tempo", "Lyrics"],
    answer: 0,
  },
  {
    id: 2,
    title: "Voice Control",
    description: "Learn how to control your voice and produce a stable sound.",
    question: "What helps you maintain a steady singing sound?",
    options: ["Random breathing", "Voice control", "Increasing volume", "Singing faster"],
    answer: 1,
  },
  {
    id: 3,
    title: "Musical Notes",
    description: "Understand notes and how they are represented in music.",
    question: "Which of these represents a musical note?",
    options: ["C", "100%", "RGB", "HTML"],
    answer: 0,
  },
  {
    id: 4,
    title: "Rhythm Basics",
    description: "Understand beats, timing and rhythmic patterns.",
    question: "What is rhythm mainly related to?",
    options: ["Timing", "Color", "Volume", "Pitch only"],
    answer: 0,
  },
  {
    id: 5,
    title: "Pitch Matching",
    description: "Practice matching your voice to a target pitch.",
    question: "What does pitch matching mean?",
    options: [
      "Matching the target note",
      "Singing louder",
      "Singing faster",
      "Changing the lyrics",
    ],
    answer: 0,
  },
  {
    id: 6,
    title: "Your First Performance",
    description: "Put everything together and complete your first musical performance.",
    question: "What is the goal of this lesson?",
    options: [
      "Apply what you learned",
      "Avoid practice",
      "Only read theory",
      "Skip previous lessons",
    ],
    answer: 0,
  },
];

function getSavedProgress() {
  try {
    const saved = localStorage.getItem("skillsensai_music_progress");

    if (!saved) return 0;

    const value = Number(saved);

    if (!Number.isFinite(value)) return 0;

    return Math.min(Math.max(value, 0), LESSONS.length);
  } catch {
    return 0;
  }
}

function extractPitchValues(data) {
  const source =
    data?.pitch_data ||
    data?.pitch ||
    data?.reference_pitch ||
    data?.user_pitch ||
    [];

  if (!Array.isArray(source)) return [];

  return source
    .map((item) => {
      if (typeof item === "number") return item;

      if (typeof item === "string") {
        const value = Number(item);
        return Number.isFinite(value) ? value : null;
      }

      if (item && typeof item === "object") {
        const value =
          item.frequency ??
          item.pitch ??
          item.value ??
          item.hz;

        const number = Number(value);

        return Number.isFinite(number) ? number : null;
      }

      return null;
    })
    .filter(
      (value) =>
        value !== null &&
        Number.isFinite(value) &&
        value > 0
    );
}

function buildPitchPoints(values, width = 900, height = 260) {
  if (!values.length) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x =
        values.length === 1
          ? width / 2
          : (index / (values.length - 1)) * width;

      const normalized = (value - min) / range;

      const y =
        height -
        20 -
        normalized * (height - 40);

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function formatAccuracy(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return null;

  return Math.round(
    Math.min(Math.max(number, 0), 100)
  );
}

export default function Music() {
  const [screen, setScreen] = useState("home");

  const [completedLessons, setCompletedLessons] =
    useState(getSavedProgress);

  const [selectedLesson, setSelectedLesson] =
    useState(null);

  const [selectedAnswer, setSelectedAnswer] =
    useState(null);

  const [quizResult, setQuizResult] = useState(null);

  const [songFile, setSongFile] = useState(null);
  const [songAnalysis, setSongAnalysis] = useState(null);

  const [voiceFile, setVoiceFile] = useState(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState(null);

  const [recording, setRecording] = useState(false);
  const [recordingContext, setRecordingContext] =
    useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    localStorage.setItem(
      "skillsensai_music_progress",
      String(completedLessons)
    );
  }, [completedLessons]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  const progress =
    (completedLessons / LESSONS.length) * 100;

  const currentLesson =
    completedLessons < LESSONS.length
      ? completedLessons + 1
      : LESSONS.length;

  const characterLevel = completedLessons;

  const isLessonUnlocked = (lessonId) =>
    lessonId <= completedLessons + 1;

  const openLesson = (lesson) => {
    if (!isLessonUnlocked(lesson.id)) return;

    setSelectedLesson(lesson);
    setSelectedAnswer(null);
    setQuizResult(null);
  };

  const closeLesson = () => {
    setSelectedLesson(null);
    setSelectedAnswer(null);
    setQuizResult(null);
  };

  const checkAnswer = () => {
    if (!selectedLesson || selectedAnswer === null) return;

    const correct =
      selectedAnswer === selectedLesson.answer;

    setQuizResult(correct ? "correct" : "incorrect");

    if (
      correct &&
      selectedLesson.id === completedLessons + 1
    ) {
      setCompletedLessons((previous) =>
        Math.min(previous + 1, LESSONS.length)
      );
    }
  };

  const resetProgress = () => {
    localStorage.removeItem(
      "skillsensai_music_progress"
    );

    setCompletedLessons(0);
  };

  const analyzeSong = async () => {
    if (!songFile) return;

    setLoading(true);
    setError("");
    setSongAnalysis(null);
    setVoiceAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("song", songFile);

      const response = await fetch(
        `${API_URL}/analyze-song`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Song analysis failed (${response.status})`
        );
      }

      const data = await response.json();

      setSongAnalysis({
        ...data,
        pitch: extractPitchValues(data),
      });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to analyze the song. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const analyzeVoice = async (file) => {
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("voice", file);

      const response = await fetch(
        `${API_URL}/analyze-voice`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Voice analysis failed (${response.status})`
        );
      }

      const data = await response.json();

      const pitch = extractPitchValues(data);

      const accuracy =
        formatAccuracy(
          data.accuracy ??
            data.score
        );

      setVoiceAnalysis({
        ...data,
        pitch,
        accuracy,
        message:
          data.feedback ||
          data.message ||
          "Your voice has been analyzed.",
      });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to analyze the recording."
      );
    } finally {
      setLoading(false);
    }
  };

  const compareSongVoice = async (
    song,
    voice
  ) => {
    if (!song || !voice) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("song", song);
      formData.append("voice", voice);

      const response = await fetch(
        `${API_URL}/compare-song-voice`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Comparison failed (${response.status})`
        );
      }

      const data = await response.json();

      const referencePitch = extractPitchValues({
        reference_pitch:
          data.reference_pitch ||
          data.original_pitch ||
          data.song_pitch,
      });

      const userPitch = extractPitchValues({
        user_pitch:
          data.user_pitch ||
          data.voice_pitch ||
          data.pitch ||
          data.pitch_data,
      });

      setVoiceAnalysis({
        ...data,
        pitch: userPitch,
        referencePitch,
        accuracy: formatAccuracy(
          data.accuracy ?? data.score
        ),
        message:
          data.feedback ||
          data.message ||
          "Your performance has been compared with the song.",
      });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to compare your recording with the song."
      );
    } finally {
      setLoading(false);
    }
  };

  const processRecording = async (file) => {
    setVoiceFile(file);

    if (
      recordingContext === "song" &&
      songFile
    ) {
      await compareSongVoice(
        songFile,
        file
      );
    } else {
      await analyzeVoice(file);
    }
  };

  const startRecording = async (context) => {
    if (
      context === "song" &&
      !songFile
    ) {
      setError(
        "Upload and analyze a song before recording your singing."
      );
      return;
    }

    setError("");

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const options =
        MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus"
        )
          ? {
              mimeType:
                "audio/webm;codecs=opus",
            }
          : {};

      const recorder =
        new MediaRecorder(
          stream,
          options
        );

      mediaRecorderRef.current =
        recorder;

      setRecordingContext(context);
      setRecording(true);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(
          audioChunksRef.current,
          {
            type:
              recorder.mimeType ||
              "audio/webm",
          }
        );

        const file = new File(
          [blob],
          "skillsensai-recording.webm",
          {
            type:
              blob.type ||
              "audio/webm",
          }
        );

        setRecording(false);

        if (mediaStreamRef.current) {
          mediaStreamRef.current
            .getTracks()
            .forEach((track) =>
              track.stop()
            );
        }

        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;

        await processRecording(file);
      };

      recorder.start();
    } catch (err) {
      setRecording(false);

      setError(
        "Microphone access was denied or is unavailable."
      );
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleVoiceUpload = async (
    event,
    context
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setRecordingContext(context);
    setVoiceFile(file);

    if (
      context === "song" &&
      songFile
    ) {
      await compareSongVoice(
        songFile,
        file
      );
    } else {
      await analyzeVoice(file);
    }

    event.target.value = "";
  };

  const songPitchPoints = buildPitchPoints(
    songAnalysis?.pitch || []
  );

  const voicePitchPoints = buildPitchPoints(
    voiceAnalysis?.pitch || []
  );

  const referencePitchPoints =
    buildPitchPoints(
      voiceAnalysis?.referencePitch || []
    );

  return (
    <div className="music-page">
      <header className="music-navbar">
        <button
          className="music-brand"
          onClick={() => setScreen("home")}
        >
          <span className="music-brand-icon">
            <Music2 size={20} />
          </span>
          <span>SkillSensAI</span>
        </button>

        <div className="music-mini-progress">
          <span>
            {completedLessons}/
            {LESSONS.length} lessons
          </span>

          <div className="music-mini-bar">
            <div
              className="music-mini-bar-fill"
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
            <h1>
              Your <span>Music</span> Journey
            </h1>

            <p>
              Learn music at your own pace.
              Practice your voice, understand
              the fundamentals and let AI guide
              your progress.
            </p>

            <div
              className={`music-character level-${characterLevel}`}
            >
              <div className="music-character-aura" />

              <img
                src="/samurai.png"
                alt="SkillSensAI music character"
                className="music-character-silhouette"
              />

              <div className="music-character-particles">
                <span>♪</span>
                <span>♫</span>
                <span>♬</span>
                <span>♪</span>
                <span>♩</span>
                <span>♫</span>
              </div>
            </div>

            <div className="music-levels">
              {LESSONS.map((lesson) => (
                <span
                  key={lesson.id}
                  className={`music-level-dot ${
                    lesson.id <=
                    completedLessons
                      ? "active"
                      : ""
                  }`}
                />
              ))}
            </div>

            {completedLessons ===
              LESSONS.length && (
              <div className="music-awakened-message">
                <Sparkles size={16} />
                Your musician has awakened.
                You completed the full
                Music journey!
              </div>
            )}
          </section>

          <section className="music-choices">
            <button
              className="music-choice-card"
              onClick={() =>
                setScreen("scratch")
              }
            >
              <div className="music-choice-icon">
                <Sparkles size={25} />
              </div>

              <h2>
                Learn From Scratch
              </h2>

              <p>
                Start with the fundamentals.
                Learn pitch, notes, rhythm and
                voice control through guided
                lessons and practice.
              </p>

              <ChevronRight
                className="music-choice-arrow"
                size={22}
              />
            </button>

            <button
              className="music-choice-card"
              onClick={() =>
                setScreen("song")
              }
            >
              <div className="music-choice-icon">
                <Volume2 size={25} />
              </div>

              <h2>
                Learn a Song
              </h2>

              <p>
                Upload a song, analyze its pitch
                and compare your singing with the
                original using AI feedback.
              </p>

              <ChevronRight
                className="music-choice-arrow"
                size={22}
              />
            </button>
          </section>

          <section className="music-stats">
            <div className="music-stat">
              <strong>
                {completedLessons}
              </strong>
              <span>
                Lessons Completed
              </span>
            </div>

            <div className="music-stat">
              <strong>
                {Math.round(progress)}%
              </strong>
              <span>
                Journey Progress
              </span>
            </div>

            <div className="music-stat">
              <strong>
                {completedLessons ===
                LESSONS.length
                  ? "Awakened"
                  : `Level ${characterLevel}`}
              </strong>
              <span>
                Musician Status
              </span>
            </div>
          </section>

          <button
            className="music-reset"
            onClick={resetProgress}
          >
            <RotateCcw size={13} />
            Reset Music Progress
          </button>
        </main>
      )}

      {screen === "scratch" && (
        <main className="music-content-page">
          <button
            className="music-back-button"
            onClick={() =>
              setScreen("home")
            }
          >
            <ArrowLeft size={17} />
            Back to Music
          </button>

          <div className="music-page-heading">
            <h1>
              Learn From Scratch
            </h1>

            <p>
              Complete each lesson to unlock
              the next stage of your musical
              journey.
            </p>
          </div>

          <div className="music-progress-panel">
            <div className="music-progress-panel-top">
              <span>
                Music Journey
              </span>

              <strong>
                {completedLessons}/
                {LESSONS.length}
              </strong>
            </div>

            <div className="music-progress-track">
              <div
                className="music-progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          <section className="music-lessons-grid">
            {LESSONS.map((lesson) => {
              const unlocked =
                isLessonUnlocked(
                  lesson.id
                );

              const completed =
                lesson.id <=
                completedLessons;

              return (
                <button
                  key={lesson.id}
                  className={`music-lesson-card ${
                    !unlocked
                      ? "locked"
                      : ""
                  } ${
                    completed
                      ? "completed"
                      : ""
                  }`}
                  onClick={() =>
                    openLesson(lesson)
                  }
                  disabled={!unlocked}
                >
                  <div className="music-lesson-number">
                    {completed ? (
                      <Check size={19} />
                    ) : unlocked ? (
                      lesson.id
                    ) : (
                      <Lock size={16} />
                    )}
                  </div>

                  <div className="music-lesson-status">
                    {completed ? (
                      <Check size={17} />
                    ) : !unlocked ? (
                      <Lock size={16} />
                    ) : (
                      <Play size={16} />
                    )}
                  </div>

                  <h3>
                    {lesson.title}
                  </h3>

                  <p>
                    {lesson.description}
                  </p>
                </button>
              );
            })}
          </section>

          <section className="music-practice-section">
            <h2>
              Practice Your Voice
            </h2>

            <p>
              Use AI to analyze your recording
              and get feedback.
            </p>

            <div className="music-practice-options">
              <div className="music-practice-card">
                <Mic
                  size={23}
                  color="#78ccef"
                />

                <h3>
                  Record Live
                </h3>

                <p>
                  Record directly through your
                  microphone.
                </p>

                <button
                  className="music-practice-button"
                  onClick={() =>
                    startRecording(
                      "scratch"
                    )
                  }
                  disabled={recording}
                >
                  <Mic size={17} />

                  {recording &&
                  recordingContext ===
                    "scratch"
                    ? "Recording..."
                    : "Start Recording"}
                </button>
              </div>

              <div className="music-practice-card">
                <Upload
                  size={23}
                  color="#78ccef"
                />

                <h3>
                  Upload Recording
                </h3>

                <p>
                  Upload an existing voice
                  recording for AI analysis.
                </p>

                <label className="music-practice-button">
                  <Upload size={17} />
                  Upload Recording

                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(event) =>
                      handleVoiceUpload(
                        event,
                        "scratch"
                      )
                    }
                    hidden
                  />
                </label>
              </div>
            </div>

            {recording &&
              recordingContext ===
                "scratch" && (
                <button
                  className="music-practice-button stop"
                  onClick={stopRecording}
                >
                  Stop Recording
                </button>
              )}
          </section>

          {loading && (
            <div className="music-analysis-status">
              Analyzing your recording...
            </div>
          )}

          {error && (
            <div className="music-analysis-status music-analysis-error">
              {error}
            </div>
          )}

          {voiceAnalysis && (
            <section className="music-voice-result">
              <div className="music-voice-score">
                <div className="music-voice-score-number">
                  {voiceAnalysis.accuracy ??
                    "—"}
                  {voiceAnalysis.accuracy !==
                    null &&
                    voiceAnalysis.accuracy !==
                      undefined
                    ? "%"
                    : ""}
                </div>

                <div>
                  <strong>
                    AI Voice Analysis
                  </strong>

                  <div className="music-voice-score-label">
                    Pitch analysis result
                  </div>
                </div>
              </div>

              <p className="music-voice-message">
                {voiceAnalysis.message}
              </p>

              {voicePitchPoints && (
                <div className="music-pitch-graph">
                  <svg
                    viewBox="0 0 900 260"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      points={
                        voicePitchPoints
                      }
                      className="music-pitch-line"
                    />
                  </svg>
                </div>
              )}
            </section>
          )}
        </main>
      )}

      {screen === "song" && (
        <main className="music-content-page">
          <button
            className="music-back-button"
            onClick={() =>
              setScreen("home")
            }
          >
            <ArrowLeft size={17} />
            Back to Music
          </button>

          <div className="music-page-heading">
            <h1>
              Learn a Song
            </h1>

            <p>
              Upload a song, study its pitch
              and compare your singing with it.
            </p>
          </div>

          <section className="music-upload-song">
            <label>
              <FileAudio size={22} />

              {songFile
                ? "Choose another song"
                : "Upload a Song"}

              <input
                type="file"
                accept="audio/*"
                onChange={(event) => {
                  const file =
                    event.target.files?.[0];

                  if (!file) return;

                  setSongFile(file);
                  setSongAnalysis(null);
                  setVoiceAnalysis(null);
                  setError("");
                }}
              />
            </label>

            {songFile && (
              <div className="music-selected-file">
                <FileAudio size={16} />
                {songFile.name}
              </div>
            )}

            {songFile && (
              <button
                className="music-practice-button"
                onClick={analyzeSong}
                disabled={loading}
              >
                <Music2 size={17} />

                {loading
                  ? "Analyzing..."
                  : "Analyze Song"}
              </button>
            )}
          </section>

          {error && (
            <div className="music-analysis-status music-analysis-error">
              {error}
            </div>
          )}

          {songAnalysis && (
            <section className="music-analysis-section">
              <div className="music-analysis-status">
                Song analysis completed.
                {songAnalysis.duration
                  ? ` Duration: ${Number(
                      songAnalysis.duration
                    ).toFixed(1)} seconds.`
                  : ""}
              </div>

              {songPitchPoints && (
                <div className="music-pitch-graph">
                  <svg
                    viewBox="0 0 900 260"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      points={
                        songPitchPoints
                      }
                      className="music-pitch-line"
                    />
                  </svg>
                </div>
              )}
            </section>
          )}

          <section className="music-practice-section">
            <h2>
              Sing the Song
            </h2>

            <p>
              Upload the song first, then
              record or upload your singing.
            </p>

            <div className="music-practice-options">
              <div className="music-practice-card">
                <Mic
                  size={23}
                  color="#78ccef"
                />

                <h3>
                  Record Live
                </h3>

                <p>
                  Sing along and let AI compare
                  your pitch with the song.
                </p>

                <button
                  className={`music-practice-button ${
                    !songFile
                      ? "disabled"
                      : ""
                  }`}
                  onClick={() =>
                    startRecording("song")
                  }
                  disabled={
                    !songFile ||
                    recording
                  }
                >
                  <Mic size={17} />

                  {recording &&
                  recordingContext ===
                    "song"
                    ? "Recording..."
                    : "Start Recording"}
                </button>
              </div>

              <div className="music-practice-card">
                <Upload
                  size={23}
                  color="#78ccef"
                />

                <h3>
                  Upload Recording
                </h3>

                <p>
                  Upload your singing for
                  comparison.
                </p>

                <label
                  className={`music-practice-button ${
                    !songFile
                      ? "disabled"
                      : ""
                  }`}
                >
                  <Upload size={17} />
                  Upload Recording

                  <input
                    type="file"
                    accept="audio/*"
                    disabled={!songFile}
                    onChange={(event) =>
                      handleVoiceUpload(
                        event,
                        "song"
                      )
                    }
                    hidden
                  />
                </label>
              </div>
            </div>

            {recording &&
              recordingContext ===
                "song" && (
                <button
                  className="music-practice-button stop"
                  onClick={stopRecording}
                >
                  Stop Recording
                </button>
              )}
          </section>

          {loading && (
            <div className="music-analysis-status">
              AI is comparing your singing
              with the song...
            </div>
          )}

          {voiceAnalysis && (
            <section className="music-voice-result">
              <div className="music-voice-score">
                <div className="music-voice-score-number">
                  {voiceAnalysis.accuracy ??
                    "—"}
                  {voiceAnalysis.accuracy !==
                    null &&
                    voiceAnalysis.accuracy !==
                      undefined
                    ? "%"
                    : ""}
                </div>

                <div>
                  <strong>
                    Song Performance
                  </strong>

                  <div className="music-voice-score-label">
                    AI pitch comparison
                  </div>
                </div>
              </div>

              <p className="music-voice-message">
                {voiceAnalysis.message}
              </p>

              {referencePitchPoints &&
                voicePitchPoints && (
                  <>
                    <div className="music-pitch-graph">
                      <svg
                        viewBox="0 0 900 260"
                        preserveAspectRatio="none"
                      >
                        <polyline
                          points={
                            referencePitchPoints
                          }
                          className="reference-pitch-line"
                        />

                        <polyline
                          points={
                            voicePitchPoints
                          }
                          className="music-pitch-line"
                        />
                      </svg>

                      <div className="music-pitch-legend">
                        <span className="music-pitch-legend-item">
                          <span className="music-pitch-legend-line" />
                          Your Voice
                        </span>

                        <span className="music-pitch-legend-item">
                          <span className="music-pitch-legend-reference" />
                          Original Song
                        </span>
                      </div>
                    </div>
                  </>
                )}
            </section>
          )}
        </main>
      )}

      {selectedLesson && (
        <div
          className="music-modal-overlay"
          onClick={closeLesson}
        >
          <div
            className="music-lesson-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="music-modal-header">
              <div>
                <h2>
                  Lesson{" "}
                  {selectedLesson.id}:{" "}
                  {selectedLesson.title}
                </h2>

                <p>
                  Complete the lesson and
                  answer the quiz to continue.
                </p>
              </div>

              <button
                className="music-modal-close"
                onClick={closeLesson}
              >
                <X size={18} />
              </button>
            </div>

            <div className="music-lesson-video">
              <div className="music-lesson-video-placeholder">
                <Play size={36} />

                <strong>
                  Lesson Video
                </strong>

                <span>
                  Your lesson video will appear
                  here once you upload it to the
                  Music lessons folder.
                </span>
              </div>
            </div>

            <div className="music-quiz">
              <h3>
                {selectedLesson.question}
              </h3>

              {selectedLesson.options.map(
                (option, index) => (
                  <button
                    key={option}
                    className={`music-quiz-option ${
                      selectedAnswer ===
                      index
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedAnswer(
                        index
                      )
                    }
                  >
                    {option}
                  </button>
                )
              )}

              {quizResult && (
                <div
                  className={`music-quiz-result ${quizResult}`}
                >
                  {quizResult ===
                  "correct"
                    ? selectedLesson
                        .id ===
                      completedLessons
                      ? "Correct! The next lesson is now unlocked."
                      : "Correct! Keep going."
                    : "Not quite. Try again."}
                </div>
              )}

              <button
                className="music-quiz-submit"
                onClick={checkAnswer}
              >
                Check Answer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
