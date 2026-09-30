import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CirclePlay,
  Flame,
  Lock,
  Mic,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Upload,
  Volume2,
  X,
  Zap,
} from "lucide-react";

import "./music.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const STORAGE_KEY = "skillsensai_music_progress_v3";

const LESSONS = [
  {
    id: 1,
    title: "Meet Your Voice",
    subtitle: "Understand your voice and how it works",
    type: "Basics",
    xp: 50,
    description:
      "Learn how your voice is produced and understand the basic parts involved in singing.",
    points: [
      "Understand how sound is produced",
      "Learn about vocal control",
      "Practice comfortable breathing",
    ],
    question: "What is one important part of good singing?",
    options: [
      "Controlling your breath",
      "Holding your breath",
      "Always singing loudly",
      "Avoiding warm-ups",
    ],
    answer: 0,
  },
  {
    id: 2,
    title: "Pitch Basics",
    subtitle: "Learn to recognize high and low notes",
    type: "Pitch",
    xp: 60,
    description:
      "Pitch tells us how high or low a musical note sounds. Train your ears and voice to recognize the difference.",
    points: [
      "Understand high and low pitch",
      "Match a simple note",
      "Improve pitch awareness",
    ],
    question: "What does pitch describe?",
    options: [
      "How high or low a sound is",
      "How long a song is",
      "How loud a speaker is",
      "How fast a video loads",
    ],
    answer: 0,
  },
  {
    id: 3,
    title: "Rhythm & Timing",
    subtitle: "Stay in time with the music",
    type: "Rhythm",
    xp: 60,
    description:
      "Rhythm gives music its movement. Learn to recognize beats and keep your voice synchronized with them.",
    points: [
      "Recognize the beat",
      "Count simple rhythms",
      "Practice staying in time",
    ],
    question: "What helps a singer stay in time?",
    options: [
      "Ignoring the beat",
      "Following the rhythm",
      "Changing tempo randomly",
      "Stopping between every note",
    ],
    answer: 1,
  },
  {
    id: 4,
    title: "Breath Control",
    subtitle: "Build stable and controlled breathing",
    type: "Voice Control",
    xp: 70,
    description:
      "Good breath control helps you sing longer phrases with greater stability and control.",
    points: [
      "Practice controlled breathing",
      "Support longer phrases",
      "Reduce unnecessary tension",
    ],
    question: "Why is breath control useful while singing?",
    options: [
      "It helps support phrases",
      "It makes every note louder",
      "It removes rhythm",
      "It prevents practice",
    ],
    answer: 0,
  },
  {
    id: 5,
    title: "Voice Control",
    subtitle: "Develop smoother vocal movement",
    type: "Technique",
    xp: 80,
    description:
      "Learn how to move between notes smoothly while keeping your voice stable.",
    points: [
      "Practice note transitions",
      "Improve vocal stability",
      "Control volume and expression",
    ],
    question: "What does vocal control help you do?",
    options: [
      "Control your voice intentionally",
      "Avoid learning notes",
      "Sing every song at one volume",
      "Ignore breathing",
    ],
    answer: 0,
  },
  {
    id: 6,
    title: "Your First Performance",
    subtitle: "Put your skills together",
    type: "Performance",
    xp: 100,
    description:
      "Bring together pitch, rhythm, breathing and voice control in your first performance challenge.",
    points: [
      "Combine your learned skills",
      "Record your performance",
      "Review your progress",
    ],
    question: "What should you use in a performance?",
    options: [
      "Only volume",
      "Pitch, rhythm and control",
      "Only breathing",
      "No preparation",
    ],
    answer: 1,
  },
];

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return {
        completedLessons: [],
        xp: 0,
        streak: 0,
      };
    }

    const parsed = JSON.parse(saved);

    return {
      completedLessons: Array.isArray(parsed.completedLessons)
        ? parsed.completedLessons
        : [],
      xp: Number(parsed.xp) || 0,
      streak: Number(parsed.streak) || 0,
    };
  } catch {
    return {
      completedLessons: [],
      xp: 0,
      streak: 0,
    };
  }
}

function AppButton({
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}) {
  return (
    <button
      type={type}
      className={`music-btn ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function Music() {
  const [screen, setScreen] = useState("home");

  const [progress, setProgress] = useState(loadProgress);

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizFinished, setQuizFinished] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordingMessage, setRecordingMessage] = useState("");

  const [songFile, setSongFile] = useState(null);
  const [songLoading, setSongLoading] = useState(false);
  const [songResult, setSongResult] = useState(null);
  const [songError, setSongError] = useState("");

  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const [voiceError, setVoiceError] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const completedCount = progress.completedLessons.length;

  const progressPercent = useMemo(() => {
    return Math.round((completedCount / LESSONS.length) * 100);
  }, [completedCount]);

  const allLessonsComplete = completedCount === LESSONS.length;

  const currentLesson = LESSONS.find(
    (lesson) => !progress.completedLessons.includes(lesson.id)
  );

  const characterStage = Math.min(completedCount, 6);

  const completeLesson = () => {
    if (!selectedLesson) return;

    const alreadyCompleted = progress.completedLessons.includes(
      selectedLesson.id
    );

    if (!alreadyCompleted) {
      setProgress((previous) => ({
        ...previous,
        completedLessons: [
          ...previous.completedLessons,
          selectedLesson.id,
        ],
        xp: previous.xp + selectedLesson.xp,
        streak: previous.streak + 1,
      }));
    }

    setQuizFinished(true);
  };

  const openLesson = (lesson) => {
    setSelectedLesson(lesson);
    setSelectedAnswer(null);
    setQuizFinished(
      progress.completedLessons.includes(lesson.id)
    );
    setLessonOpen(true);
  };

  const closeLesson = () => {
    setLessonOpen(false);
    setSelectedLesson(null);
    setSelectedAnswer(null);
    setQuizFinished(false);
  };

  const startRecording = async () => {
    setRecordingMessage("");
    setRecordedAudio(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordingMessage(
        "Your browser does not support audio recording."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
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
      setRecording(true);
    } catch (error) {
      console.error(error);
      setRecordingMessage(
        "Microphone access was denied or unavailable."
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

  const handleVoiceFile = async (file) => {
    if (!file) return;

    setVoiceError("");
    setVoiceResult(null);
    setVoiceLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/analyze-voice`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      setVoiceResult(data);
    } catch (error) {
      console.error(error);

      setVoiceError(
        "Unable to analyse the recording. Make sure the SkillSensAI backend is running and the API URL is correct."
      );
    } finally {
      setVoiceLoading(false);
    }
  };

  const uploadRecording = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setRecordedAudio({
      blob: file,
      url: URL.createObjectURL(file),
      name: file.name,
    });

    await handleVoiceFile(file);
  };

  const analyseLiveRecording = async () => {
    if (!recordedAudio?.blob) return;

    const file = new File(
      [recordedAudio.blob],
      recordedAudio.name || "recording.webm",
      {
        type: recordedAudio.blob.type || "audio/webm",
      }
    );

    await handleVoiceFile(file);
  };

  const analyseSong = async () => {
    if (!songFile) return;

    setSongError("");
    setSongResult(null);
    setSongLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", songFile);

      const response = await fetch(`${API_URL}/analyze-song`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      setSongResult(data);
    } catch (error) {
      console.error(error);

      setSongError(
        "Unable to analyse the song. Make sure the SkillSensAI backend is running and the API URL is correct."
      );
    } finally {
      setSongLoading(false);
    }
  };

  const resetProgress = () => {
    const confirmed = window.confirm(
      "Reset all Music learning progress?"
    );

    if (!confirmed) return;

    setProgress({
      completedLessons: [],
      xp: 0,
      streak: 0,
    });
  };

  const renderCharacter = () => {
    if (allLessonsComplete) {
      return (
        <div className="musician-character awakened">
          <div className="aura aura-one" />
          <div className="aura aura-two" />
          <div className="music-particle particle-one">♪</div>
          <div className="music-particle particle-two">♫</div>
          <div className="music-particle particle-three">♬</div>

          <div className="character-head">
            <div className="character-hair" />
            <div className="character-face">
              <span className="eye left" />
              <span className="eye right" />
            </div>
          </div>

          <div className="character-body">
            <div className="character-arm left-arm" />
            <div className="character-arm right-arm" />
            <div className="character-torso" />
          </div>

          <div className="character-legs">
            <div />
            <div />
          </div>

          <div className="character-instrument">
            <Music2 size={34} />
          </div>
        </div>
      );
    }

    return (
      <div className={`musician-character stage-${characterStage}`}>
        <div className="character-head">
          <div className="character-hair" />
          <div className="character-face">
            <span className="eye left" />
            <span className="eye right" />
          </div>
        </div>

        <div className="character-body">
          <div className="character-arm left-arm" />
          <div className="character-arm right-arm" />
          <div className="character-torso" />
        </div>

        <div className="character-legs">
          <div />
          <div />
        </div>

        <div className="character-instrument">
          <Music2 size={34} />
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="music-page">
      <header className="music-header">
        <button
          className="back-button"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="music-title">
          <div className="title-icon">
            <Music2 size={26} />
          </div>

          <div>
            <h1>Music</h1>
            <p>Learn. Practice. Perform.</p>
          </div>
        </div>

        <div className="header-stats">
          <div className="stat-pill">
            <Zap size={17} />
            {progress.xp} XP
          </div>

          <div className="stat-pill">
            <Flame size={17} />
            {progress.streak}
          </div>
        </div>
      </header>

      <main className="music-content">
        <section className="music-hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={15} />
              AI-powered music learning
            </span>

            <h2>
              Bring your inner
              <span> musician </span>
              to life.
            </h2>

            <p>
              Learn music step by step, practice with your own voice,
              and watch your progress come alive.
            </p>

            <div className="hero-actions">
              <AppButton
                className="primary-btn"
                onClick={() =>
                  setScreen("scratch")
                }
              >
                <Sparkles size={18} />
                Learn From Scratch
                <ArrowRight size={18} />
              </AppButton>

              <AppButton
                className="secondary-btn"
                onClick={() =>
                  setScreen("song")
                }
              >
                <Music2 size={18} />
                Learn a Song
              </AppButton>
            </div>
          </div>

          <div className="hero-character-area">
            {renderCharacter()}

            <div className="character-floor" />

            {allLessonsComplete && (
              <div className="awakening-message">
                <Trophy size={18} />
                Musician Awakened!
              </div>
            )}
          </div>
        </section>

        <section className="progress-card">
          <div className="progress-top">
            <div>
              <span className="small-label">
                YOUR JOURNEY
              </span>

              <h3>
                {completedCount}/{LESSONS.length} lessons completed
              </h3>
            </div>

            <strong>{progressPercent}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="progress-footer">
            <span>
              {allLessonsComplete
                ? "You've completed the full beginner journey!"
                : currentLesson
                ? `Next: ${currentLesson.title}`
                : "Keep practicing!"}
            </span>

            <button
              className="reset-progress"
              onClick={resetProgress}
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </section>

        <section className="feature-grid">
          <button
            className="feature-card"
            onClick={() => setScreen("scratch")}
          >
            <div className="feature-icon purple">
              <Sparkles size={24} />
            </div>

            <div>
              <h3>Learn From Scratch</h3>
              <p>
                Start from the basics and progressively unlock
                your musician.
              </p>
            </div>

            <ArrowRight size={20} />
          </button>

          <button
            className="feature-card"
            onClick={() => setScreen("song")}
          >
            <div className="feature-icon red">
              <Music2 size={24} />
            </div>

            <div>
              <h3>Learn a Song</h3>
              <p>
                Upload a song and use AI analysis to understand
                pitch and performance.
              </p>
            </div>

            <ArrowRight size={20} />
          </button>
        </section>
      </main>
    </div>
  );

  const renderScratch = () => (
    <div className="music-page inner-page">
      <header className="inner-header">
        <button
          className="back-button"
          onClick={() => setScreen("home")}
        >
          <ArrowLeft size={20} />
          Music
        </button>

        <div>
          <h1>Learn From Scratch</h1>
          <p>Build your musical foundation</p>
        </div>

        <div className="stat-pill">
          <Zap size={17} />
          {progress.xp} XP
        </div>
      </header>

      <main className="scratch-layout">
        <section className="scratch-character-card">
          <div className="section-heading">
            <span className="eyebrow">
              <Sparkles size={15} />
              Your musician
            </span>

            <h2>
              {allLessonsComplete
                ? "You've awakened your musician!"
                : "Watch yourself come alive."}
            </h2>

            <p>
              Complete lessons to progressively bring the
              character to life.
            </p>
          </div>

          <div className="large-character">
            {renderCharacter()}
          </div>

          <div className="character-progress">
            {LESSONS.map((lesson, index) => (
              <div
                key={lesson.id}
                className={`character-step ${
                  index < completedCount ? "complete" : ""
                }`}
              >
                <span>{index + 1}</span>
              </div>
            ))}
          </div>

          <div className="practice-box">
            <div className="practice-box-icon">
              <Mic size={22} />
            </div>

            <div>
              <strong>Practice your voice</strong>
              <p>
                Record yourself or upload a recording for
                AI-powered feedback.
              </p>
            </div>

            <AppButton
              className="small-primary"
              onClick={() => setScreen("practice")}
            >
              Practice
              <ArrowRight size={16} />
            </AppButton>
          </div>
        </section>

        <section className="lessons-section">
          <div className="section-heading">
            <span className="eyebrow">
              <Trophy size={15} />
              Learning path
            </span>

            <h2>Your lessons</h2>

            <p>
              Complete each lesson to unlock the next stage.
            </p>
          </div>

          <div className="lesson-list">
            {LESSONS.map((lesson, index) => {
              const completed =
                progress.completedLessons.includes(
                  lesson.id
                );

              const unlocked =
                index === 0 ||
                progress.completedLessons.includes(
                  LESSONS[index - 1].id
                );

              return (
                <div
                  className={`lesson-card ${
                    completed ? "completed" : ""
                  } ${!unlocked ? "locked" : ""}`}
                  key={lesson.id}
                >
                  <div className="lesson-number">
                    {completed ? (
                      <Check size={20} />
                    ) : !unlocked ? (
                      <Lock size={18} />
                    ) : (
                      lesson.id
                    )}
                  </div>

                  <div className="lesson-info">
                    <div className="lesson-meta">
                      <span>{lesson.type}</span>
                      <small>+{lesson.xp} XP</small>
                    </div>

                    <h3>{lesson.title}</h3>
                    <p>{lesson.subtitle}</p>
                  </div>

                  <button
                    className="lesson-open"
                    disabled={!unlocked}
                    onClick={() =>
                      unlocked && openLesson(lesson)
                    }
                  >
                    {completed ? "Review" : "Start"}
                    <ArrowRight size={17} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );

  const renderPractice = () => (
    <div className="music-page inner-page">
      <header className="inner-header">
        <button
          className="back-button"
          onClick={() => setScreen("scratch")}
        >
          <ArrowLeft size={20} />
          Learn From Scratch
        </button>

        <div>
          <h1>Voice Practice</h1>
          <p>Record and analyse your performance</p>
        </div>
      </header>

      <main className="practice-page">
        <section className="practice-header-card">
          <div className="practice-big-icon">
            <Mic size={34} />
          </div>

          <div>
            <h2>Practice your voice</h2>
            <p>
              Record live using your microphone or upload an
              existing recording.
            </p>
          </div>
        </section>

        <section className="record-grid">
          <div className="record-card">
            <div className="record-card-icon">
              <Mic size={25} />
            </div>

            <h3>Record Live</h3>

            <p>
              Use your microphone and record your voice directly
              in SkillSensAI.
            </p>

            {!recording ? (
              <AppButton
                className="primary-btn full-btn"
                onClick={startRecording}
              >
                <Mic size={18} />
                Start Recording
              </AppButton>
            ) : (
              <AppButton
                className="stop-btn full-btn"
                onClick={stopRecording}
              >
                <Pause size={18} />
                Stop Recording
              </AppButton>
            )}
          </div>

          <div className="record-card">
            <div className="record-card-icon upload">
              <Upload size={25} />
            </div>

            <h3>Upload Recording</h3>

            <p>
              Already have a recording? Upload it and let AI
              analyse your voice.
            </p>

            <label className="upload-label">
              <Upload size={18} />
              Choose Audio
              <input
                type="file"
                accept="audio/*"
                onChange={uploadRecording}
                hidden
              />
            </label>
          </div>
        </section>

        {recordingMessage && (
          <div className="message error-message">
            {recordingMessage}
          </div>
        )}

        {recordedAudio && (
          <section className="audio-preview-card">
            <div>
              <span className="small-label">
                YOUR RECORDING
              </span>
              <h3>{recordedAudio.name}</h3>
            </div>

            <audio
              controls
              src={recordedAudio.url}
            />

            <AppButton
              className="primary-btn"
              onClick={analyseLiveRecording}
              disabled={voiceLoading}
            >
              {voiceLoading ? (
                "Analysing..."
              ) : (
                <>
                  <Sparkles size={18} />
                  Analyse Recording
                </>
              )}
            </AppButton>
          </section>
        )}

        {voiceLoading && (
          <div className="loading-card">
            <div className="loader" />
            <h3>AI is analysing your voice...</h3>
            <p>
              Checking your recording and preparing feedback.
            </p>
          </div>
        )}

        {voiceError && (
          <div className="message error-message">
            {voiceError}
          </div>
        )}

        {voiceResult && (
          <section className="analysis-card">
            <div className="analysis-title">
              <div>
                <span className="small-label">
                  AI FEEDBACK
                </span>
                <h2>Your Voice Analysis</h2>
              </div>

              <div className="score-circle">
                <strong>
                  {Math.round(
                    Number(
                      voiceResult.accuracy ??
                        voiceResult.pitch_accuracy ??
                        0
                    )
                  )}
                </strong>
                <span>%</span>
              </div>
            </div>

            <div className="analysis-content">
              <div className="analysis-item">
                <Volume2 size={20} />
                <div>
                  <strong>Pitch Accuracy</strong>
                  <p>
                    {voiceResult.pitch_accuracy ??
                      voiceResult.accuracy ??
                      "Analysis completed"}
                  </p>
                </div>
              </div>

              <div className="analysis-item">
                <Sparkles size={20} />
                <div>
                  <strong>Feedback</strong>
                  <p>
                    {voiceResult.feedback ||
                      voiceResult.message ||
                      "Keep practicing consistently to improve your performance."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );

  const renderSong = () => (
    <div className="music-page inner-page">
      <header className="inner-header">
        <button
          className="back-button"
          onClick={() => setScreen("home")}
        >
          <ArrowLeft size={20} />
          Music
        </button>

        <div>
          <h1>Learn a Song</h1>
          <p>Analyse and practice your favourite music</p>
        </div>
      </header>

      <main className="song-page">
        <section className="song-hero-card">
          <div className="song-hero-icon">
            <Music2 size={36} />
          </div>

          <div>
            <span className="eyebrow">
              <Sparkles size={15} />
              AI Song Analysis
            </span>

            <h2>Understand your song.</h2>

            <p>
              Upload an audio file and let SkillSensAI analyse
              the musical characteristics.
            </p>
          </div>
        </section>

        <section className="song-upload-card">
          <div className="upload-zone">
            <div className="upload-big-icon">
              <Upload size={30} />
            </div>

            <h3>
              {songFile
                ? songFile.name
                : "Upload your song"}
            </h3>

            <p>
              MP3, WAV, M4A and other supported audio formats
            </p>

            <label className="upload-label large-upload">
              <Upload size={18} />
              Choose Audio File

              <input
                type="file"
                accept="audio/*"
                hidden
                onChange={(event) => {
                  const file =
                    event.target.files?.[0];

                  if (file) {
                    setSongFile(file);
                    setSongResult(null);
                    setSongError("");
                  }
                }}
              />
            </label>
          </div>

          {songFile && (
            <AppButton
              className="primary-btn full-btn"
              onClick={analyseSong}
              disabled={songLoading}
            >
              {songLoading ? (
                "Analysing Song..."
              ) : (
                <>
                  <Sparkles size={18} />
                  Analyse Song
                </>
              )}
            </AppButton>
          )}
        </section>

        {songLoading && (
          <div className="loading-card">
            <div className="loader" />
            <h3>AI is analysing your song...</h3>
            <p>
              This may take a few seconds depending on the
              audio file.
            </p>
          </div>
        )}

        {songError && (
          <div className="message error-message">
            {songError}
          </div>
        )}

        {songResult && (
          <section className="song-result-card">
            <div className="result-header">
              <div>
                <span className="small-label">
                  ANALYSIS COMPLETE
                </span>
                <h2>Song Analysis</h2>
              </div>

              <div className="result-check">
                <Check size={22} />
              </div>
            </div>

            <div className="result-grid">
              <div className="result-box">
                <span>Duration</span>
                <strong>
                  {songResult.duration
                    ? `${Number(
                        songResult.duration
                      ).toFixed(1)} sec`
                    : "Available"}
                </strong>
              </div>

              <div className="result-box">
                <span>Average Pitch</span>
                <strong>
                  {songResult.average_pitch ??
                    songResult.avg_pitch ??
                    "Detected"}
                </strong>
              </div>

              <div className="result-box">
                <span>Notes</span>
                <strong>
                  {songResult.notes ??
                    songResult.num_notes ??
                    "Detected"}
                </strong>
              </div>
            </div>

            <div className="song-feedback">
              <Sparkles size={20} />

              <div>
                <strong>AI Feedback</strong>
                <p>
                  {songResult.feedback ||
                    songResult.message ||
                    "Your song has been analysed successfully. Use the results to guide your practice."}
                </p>
              </div>
            </div>

            {(songResult.pitch_data ||
              songResult.pitch ||
              songResult.pitches) && (
              <div className="pitch-graph">
                <div className="graph-label">
                  <span>Pitch pattern</span>
                  <Music2 size={17} />
                </div>

                <div className="fake-graph">
                  {(songResult.pitch_data ||
                    songResult.pitch ||
                    songResult.pitches ||
                    [])
                    .slice(0, 80)
                    .map((value, index) => {
                      const numericValue =
                        Number(value) || 0;

                      const height = Math.max(
                        8,
                        Math.min(
                          95,
                          (numericValue % 100) + 10
                        )
                      );

                      return (
                        <span
                          key={index}
                          style={{
                            height: `${height}%`,
                          }}
                        />
                      );
                    })}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="song-practice-card">
          <div className="song-practice-icon">
            <Mic size={26} />
          </div>

          <div>
            <h3>Ready to practice?</h3>
            <p>
              Record your voice and compare your performance
              with the song.
            </p>
          </div>

          <AppButton
            className="secondary-btn"
            onClick={() => setScreen("practice")}
          >
            Record Live
            <ArrowRight size={17} />
          </AppButton>
        </section>
      </main>
    </div>
  );

  return (
    <>
      {screen === "home" && renderHome()}
      {screen === "scratch" && renderScratch()}
      {screen === "practice" && renderPractice()}
      {screen === "song" && renderSong()}

      {lessonOpen && selectedLesson && (
        <div className="modal-backdrop">
          <div className="lesson-modal">
            <button
              className="modal-close"
              onClick={closeLesson}
            >
              <X size={21} />
            </button>

            <div className="modal-icon">
              {quizFinished ? (
                <Trophy size={28} />
              ) : (
                <CirclePlay size={28} />
              )}
            </div>

            <span className="eyebrow">
              LESSON {selectedLesson.id}
            </span>

            <h2>{selectedLesson.title}</h2>

            <p className="modal-subtitle">
              {selectedLesson.description}
            </p>

            <div className="lesson-points">
              {selectedLesson.points.map((point) => (
                <div key={point}>
                  <Check size={17} />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            {!quizFinished && (
              <>
                <div className="quiz-divider" />

                <div className="quiz-section">
                  <span className="small-label">
                    QUICK CHECK
                  </span>

                  <h3>{selectedLesson.question}</h3>

                  <div className="quiz-options">
                    {selectedLesson.options.map(
                      (option, index) => (
                        <button
                          key={option}
                          className={`quiz-option ${
                            selectedAnswer === index
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedAnswer(index)
                          }
                        >
                          <span>
                            {String.fromCharCode(
                              65 + index
                            )}
                          </span>
                          {option}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <AppButton
                  className="primary-btn full-btn"
                  disabled={selectedAnswer === null}
                  onClick={() => {
                    if (
                      selectedAnswer ===
                      selectedLesson.answer
                    ) {
                      completeLesson();
                    } else {
                      setSelectedAnswer(null);
                      window.alert(
                        "Not quite. Try the question again!"
                      );
                    }
                  }}
                >
                  Complete Lesson
                  <Check size={18} />
                </AppButton>
              </>
            )}

            {quizFinished && (
              <div className="lesson-complete">
                <div className="complete-icon">
                  <Trophy size={28} />
                </div>

                <h3>Lesson Complete!</h3>

                <p>
                  Your musician is one step closer to coming
                  alive.
                </p>

                <div className="xp-earned">
                  <Zap size={18} />
                  +{selectedLesson.xp} XP
                </div>

                <AppButton
                  className="primary-btn full-btn"
                  onClick={closeLesson}
                >
                  Continue Learning
                  <ArrowRight size={18} />
                </AppButton>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Music;
