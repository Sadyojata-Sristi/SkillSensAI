import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
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
  Trophy,
  Upload,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import Music from "./pages/Music";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const STORAGE_KEY = "skillsensai_music_progress_v3";

const lessons = [
  {
    id: 1,
    title: "Meet Your Voice",
    subtitle: "Understand your natural voice",
    level: "Beginner",
    xp: 50,
    color: "lavender",
    description:
      "Learn how your voice works and discover your comfortable natural singing range.",
    video:
      "https://www.youtube.com/embed/placeholder",
    questions: [
      {
        question: "What is the main source of your singing voice?",
        options: [
          "Vocal folds",
          "Fingers",
          "Teeth",
          "Ears",
        ],
        answer: 0,
      },
      {
        question: "Why is warming up useful before singing?",
        options: [
          "It prepares the voice",
          "It makes the microphone louder",
          "It changes the song",
          "It increases room temperature",
        ],
        answer: 0,
      },
    ],
  },
  {
    id: 2,
    title: "Pitch Basics",
    subtitle: "Learn high and low notes",
    level: "Beginner",
    xp: 75,
    color: "violet",
    description:
      "Understand pitch and practise moving between high and low notes with control.",
    video:
      "https://www.youtube.com/embed/placeholder",
    questions: [
      {
        question: "What does pitch describe?",
        options: [
          "How high or low a sound is",
          "How long a song is",
          "How loud the speaker is",
          "How fast you clap",
        ],
        answer: 0,
      },
      {
        question: "A higher pitch generally has a...",
        options: [
          "Higher frequency",
          "Lower frequency",
          "Slower recording",
          "Longer silence",
        ],
        answer: 0,
      },
    ],
  },
  {
    id: 3,
    title: "Rhythm & Timing",
    subtitle: "Stay with the beat",
    level: "Beginner",
    xp: 75,
    color: "purple",
    description:
      "Learn how rhythm works and practise keeping your voice aligned with the beat.",
    video:
      "https://www.youtube.com/embed/placeholder",
    questions: [
      {
        question: "What helps a singer stay in time?",
        options: [
          "The beat",
          "Changing the lyrics",
          "Ignoring the rhythm",
          "Increasing the volume",
        ],
        answer: 0,
      },
      {
        question: "Rhythm is mainly related to...",
        options: [
          "Timing",
          "Colour",
          "Pitch only",
          "Microphone size",
        ],
        answer: 0,
      },
    ],
  },
  {
    id: 4,
    title: "Breath Control",
    subtitle: "Build stable singing",
    level: "Intermediate",
    xp: 100,
    color: "indigo",
    description:
      "Develop controlled breathing so you can sustain notes and sing phrases smoothly.",
    video:
      "https://www.youtube.com/embed/placeholder",
    questions: [
      {
        question: "Good breath control helps with...",
        options: [
          "Stable singing",
          "Changing the song",
          "Increasing screen brightness",
          "Making lyrics longer",
        ],
        answer: 0,
      },
      {
        question: "A singer should generally avoid...",
        options: [
          "Uncontrolled shallow breathing",
          "Relaxed breathing",
          "Practising phrases",
          "Using breath support",
        ],
        answer: 0,
      },
    ],
  },
  {
    id: 5,
    title: "Voice Control",
    subtitle: "Connect pitch and expression",
    level: "Intermediate",
    xp: 125,
    color: "blue",
    description:
      "Combine pitch, rhythm and breath control to make your singing more consistent.",
    video:
      "https://www.youtube.com/embed/placeholder",
    questions: [
      {
        question: "Good voice control combines...",
        options: [
          "Pitch, rhythm and breath",
          "Only volume",
          "Only lyrics",
          "Only speed",
        ],
        answer: 0,
      },
      {
        question: "Expression in singing can be improved through...",
        options: [
          "Controlled practice",
          "Avoiding practice",
          "Ignoring rhythm",
          "Speaking randomly",
        ],
        answer: 0,
      },
    ],
  },
  {
    id: 6,
    title: "Your First Performance",
    subtitle: "Bring everything together",
    level: "Advanced",
    xp: 200,
    color: "gold",
    description:
      "Use everything you have learned and complete your first SkillSensAI performance challenge.",
    video:
      "https://www.youtube.com/embed/placeholder",
    questions: [
      {
        question: "What is the goal of the final lesson?",
        options: [
          "Apply everything you learned",
          "Skip all previous lessons",
          "Only memorise lyrics",
          "Avoid recording",
        ],
        answer: 0,
      },
      {
        question: "What improves musical skill most effectively?",
        options: [
          "Consistent practice",
          "Never practising",
          "Only watching videos",
          "Ignoring feedback",
        ],
        answer: 0,
      },
    ],
  },
];

function getInitialProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      return {
        completedLessons: parsed.completedLessons || [],
        xp: parsed.xp || 0,
      };
    }
  } catch (error) {
    console.error("Unable to load music progress:", error);
  }

  return {
    completedLessons: [],
    xp: 0,
  };
}

export default function Music() {
  const [page, setPage] = useState("home");

  const [progress, setProgress] = useState(getInitialProgress);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const completedCount = progress.completedLessons.length;

  const progressPercent = Math.round(
    (completedCount / lessons.length) * 100
  );

  const allLessonsCompleted =
    completedCount === lessons.length;

  return (
    <div className="music-page">
      <div className="music-background-glow glow-one" />
      <div className="music-background-glow glow-two" />
      <div className="music-background-glow glow-three" />

      {page === "home" && (
        <MusicHome
          progress={progress}
          progressPercent={progressPercent}
          completedCount={completedCount}
          onLearnFromScratch={() => setPage("learn")}
          onLearnSong={() => setPage("song")}
        />
      )}

      {page === "learn" && (
        <LearnFromScratch
          progress={progress}
          setProgress={setProgress}
          allLessonsCompleted={allLessonsCompleted}
          onBack={() => setPage("home")}
        />
      )}

      {page === "song" && (
        <LearnSong
          onBack={() => setPage("home")}
        />
      )}
    </div>
  );
}


/* =========================================================
   MUSIC HOME
========================================================= */

function MusicHome({
  progress,
  progressPercent,
  completedCount,
  onLearnFromScratch,
  onLearnSong,
}) {
  return (
    <main className="music-home">

      <header className="music-topbar">
        <div className="music-brand">
          <div className="music-brand-icon">
            <Music2 size={25} />
          </div>

          <div>
            <h1>Music</h1>
            <span>Learn. Practise. Perform.</span>
          </div>
        </div>

        <div className="music-xp-pill">
          <Zap size={17} />
          <span>{progress.xp} XP</span>
        </div>
      </header>

      <section className="music-hero">

        <div className="hero-copy">

          <div className="hero-badge">
            <Sparkles size={15} />
            AI-powered music learning
          </div>

          <h2>
            Your musical journey
            <span> starts here.</span>
          </h2>

          <p>
            Learn the fundamentals, practise your voice,
            analyse songs and improve through personalised
            feedback.
          </p>

          <div className="hero-actions">

            <button
              className="primary-music-button"
              onClick={onLearnFromScratch}
            >
              <Play size={19} fill="currentColor" />
              Learn From Scratch
              <ArrowRight size={18} />
            </button>

            <button
              className="secondary-music-button"
              onClick={onLearnSong}
            >
              <Music2 size={19} />
              Learn a Song
            </button>

          </div>

          <div className="mini-progress">

            <div className="mini-progress-info">
              <span>Your progress</span>
              <strong>{progressPercent}%</strong>
            </div>

            <div className="mini-progress-track">
              <div
                className="mini-progress-fill"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>

            <small>
              {completedCount} of {lessons.length} lessons completed
            </small>

          </div>

        </div>

        <div className="hero-character-area">

          <MusicianCharacter
            completedCount={completedCount}
            totalLessons={lessons.length}
            awakened={progressPercent === 100}
          />

        </div>

      </section>


      <section className="music-options">

        <div
          className="music-option-card learn-card"
          onClick={onLearnFromScratch}
        >

          <div className="option-card-icon">
            <Sparkles size={25} />
          </div>

          <div className="option-card-content">

            <div className="option-card-title-row">
              <h3>Learn From Scratch</h3>

              {completedCount > 0 && (
                <span className="small-progress-badge">
                  {completedCount}/{lessons.length}
                </span>
              )}
            </div>

            <p>
              Build your musical foundation through
              guided lessons, quizzes and practice.
            </p>

            <span className="option-link">
              Continue learning <ArrowRight size={16} />
            </span>

          </div>

        </div>


        <div
          className="music-option-card song-card"
          onClick={onLearnSong}
        >

          <div className="option-card-icon">
            <Music2 size={25} />
          </div>

          <div className="option-card-content">

            <h3>Learn a Song</h3>

            <p>
              Upload a song, analyse its pitch and
              practise your own voice with AI feedback.
            </p>

            <span className="option-link">
              Analyse a song <ArrowRight size={16} />
            </span>

          </div>

        </div>

      </section>

    </main>
  );
}


/* =========================================================
   LEARN FROM SCRATCH
========================================================= */

function LearnFromScratch({
  progress,
  setProgress,
  allLessonsCompleted,
  onBack,
}) {
  const [selectedLesson, setSelectedLesson] = useState(
    Math.min(progress.completedLessons.length + 1, lessons.length)
  );

  const [showLesson, setShowLesson] = useState(false);

  const lesson =
    lessons.find((item) => item.id === selectedLesson) ||
    lessons[0];

  const completed = progress.completedLessons.includes(
    lesson.id
  );

  const previousCompleted =
    lesson.id === 1 ||
    progress.completedLessons.includes(lesson.id - 1);

  const selectLesson = (lessonItem) => {
    const unlocked =
      lessonItem.id === 1 ||
      progress.completedLessons.includes(lessonItem.id - 1);

    if (!unlocked) return;

    setSelectedLesson(lessonItem.id);
    setShowLesson(true);
  };

  const completeLesson = (lessonId) => {
    if (progress.completedLessons.includes(lessonId)) {
      setShowLesson(false);
      return;
    }

    setProgress((prev) => ({
      completedLessons: [
        ...prev.completedLessons,
        lessonId,
      ].sort((a, b) => a - b),

      xp:
        prev.xp +
        (lessons.find((item) => item.id === lessonId)?.xp || 0),
    }));

    setShowLesson(false);
  };

  return (
    <main className="learn-page">

      <header className="inner-topbar">

        <button
          className="back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          Music
        </button>

        <div className="inner-title">
          <Music2 size={20} />
          <span>Learn From Scratch</span>
        </div>

        <div className="music-xp-pill">
          <Zap size={16} />
          {progress.xp} XP
        </div>

      </header>


      <section className="learn-header">

        <div>

          <div className="hero-badge">
            <Sparkles size={14} />
            Build your musical foundation
          </div>

          <h2>
            Bring the musician
            <span> to life.</span>
          </h2>

          <p>
            Complete each lesson to gradually awaken
            your musician. Every lesson unlocks another
            part of the journey.
          </p>

        </div>

        <MusicianCharacter
          completedCount={progress.completedLessons.length}
          totalLessons={lessons.length}
          awakened={allLessonsCompleted}
          compact
        />

      </section>


      <section className="learn-progress-card">

        <div className="learn-progress-top">

          <div>
            <span>Learning progress</span>
            <strong>
              {progress.completedLessons.length}/{lessons.length}
            </strong>
          </div>

          <span>
            {Math.round(
              (progress.completedLessons.length /
                lessons.length) *
                100
            )}
            %
          </span>

        </div>

        <div className="large-progress-track">
          <div
            className="large-progress-fill"
            style={{
              width: `${
                (progress.completedLessons.length /
                  lessons.length) *
                100
              }%`,
            }}
          />
        </div>

      </section>


      <section className="lesson-section">

        <div className="lesson-section-heading">
          <div>
            <h3>Your lessons</h3>
            <p>Complete them in order to unlock your musician.</p>
          </div>

          <div className="streak-pill">
            <Flame size={17} />
            Keep practising
          </div>
        </div>


        <div className="lesson-grid">

          {lessons.map((lessonItem) => {

            const isCompleted =
              progress.completedLessons.includes(
                lessonItem.id
              );

            const unlocked =
              lessonItem.id === 1 ||
              progress.completedLessons.includes(
                lessonItem.id - 1
              );

            return (
              <button
                key={lessonItem.id}
                className={`lesson-card ${
                  isCompleted ? "completed" : ""
                } ${!unlocked ? "locked" : ""}`}
                onClick={() => selectLesson(lessonItem)}
                disabled={!unlocked}
              >

                <div className={`lesson-number ${lessonItem.color}`}>
                  {isCompleted ? (
                    <Check size={20} />
                  ) : unlocked ? (
                    lessonItem.id
                  ) : (
                    <Lock size={18} />
                  )}
                </div>

                <div className="lesson-info">

                  <div className="lesson-top-line">

                    <span>
                      Lesson {lessonItem.id}
                    </span>

                    <span>
                      +{lessonItem.xp} XP
                    </span>

                  </div>

                  <h4>{lessonItem.title}</h4>

                  <p>{lessonItem.subtitle}</p>

                  <div className="lesson-bottom-line">

                    <span>{lessonItem.level}</span>

                    {isCompleted && (
                      <span className="completed-label">
                        Completed
                      </span>
                    )}

                  </div>

                </div>

              </button>
            );
          })}

        </div>

      </section>


      <section className="practice-section">

        <div className="practice-heading">
          <div className="practice-icon">
            <Mic size={22} />
          </div>

          <div>
            <h3>Practice what you learned</h3>
            <p>
              Record yourself or upload a recording
              and practise your voice.
            </p>
          </div>
        </div>

        <PracticeRecorder />

      </section>


      {showLesson && (
        <LessonModal
          lesson={lesson}
          completed={completed}
          previousCompleted={previousCompleted}
          onClose={() => setShowLesson(false)}
          onComplete={() => completeLesson(lesson.id)}
        />
      )}

    </main>
  );
}


/* =========================================================
   MUSICIAN CHARACTER
========================================================= */

function MusicianCharacter({
  completedCount,
  totalLessons,
  awakened,
  compact = false,
}) {
  const progress =
    totalLessons === 0
      ? 0
      : completedCount / totalLessons;

  const glowIntensity = Math.max(0.15, progress);

  return (
    <div
      className={`musician-stage ${
        compact ? "compact-character" : ""
      } ${awakened ? "fully-awakened" : ""}`}
      style={{
        "--character-progress": glowIntensity,
      }}
    >

      {awakened && (
        <div className="musical-particles">
          <span>♪</span>
          <span>♫</span>
          <span>♬</span>
          <span>♪</span>
          <span>♫</span>
        </div>
      )}

      <div className="character-aura" />

      <div className="musician-character">

        <div className="character-hair" />

        <div className="character-head">

          <div className="character-eye left-eye" />
          <div className="character-eye right-eye" />

        </div>

        <div className="character-neck" />

        <div className="character-body">

          <div className="character-shirt" />

          <div className="character-arm left-arm" />
          <div className="character-arm right-arm" />

        </div>

        <div className="character-instrument">
          <div className="instrument-neck" />
          <div className="instrument-body" />
          <div className="instrument-hole" />
        </div>

        <div className="character-glow-fill" />

      </div>

      <div className="character-floor-glow" />

      <div className="character-progress-label">
        {awakened
          ? "MUSICIAN AWAKENED"
          : `${completedCount}/${totalLessons} lessons`}
      </div>

    </div>
  );
}


/* =========================================================
   LESSON MODAL
========================================================= */

function LessonModal({
  lesson,
  completed,
  previousCompleted,
  onClose,
  onComplete,
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [finishedQuiz, setFinishedQuiz] = useState(false);

  const currentQuestion =
    lesson.questions[questionIndex];

  const chooseAnswer = (index) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(index);

    if (index === currentQuestion.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (questionIndex < lesson.questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      setFinishedQuiz(true);
    }
  };

  return (
    <div className="modal-overlay">

      <div className="lesson-modal">

        <button
          className="modal-close"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {!finishedQuiz ? (
          <>

            <div className="modal-header">

              <div className="modal-lesson-number">
                Lesson {lesson.id}
              </div>

              <h2>{lesson.title}</h2>

              <p>{lesson.description}</p>

            </div>


            <div className="lesson-video">

              <div className="video-placeholder">

                <CirclePlay size={45} />

                <span>
                  Lesson video
                </span>

                <small>
                  Replace this video URL with your lesson content.
                </small>

              </div>

            </div>


            <div className="lesson-practice-tip">

              <Volume2 size={19} />

              <div>
                <strong>Practice tip</strong>
                <p>
                  Watch the lesson carefully and practise
                  before answering the questions.
                </p>
              </div>

            </div>


            <div className="quiz-box">

              <div className="quiz-header">

                <span>
                  Quick Check
                </span>

                <small>
                  {questionIndex + 1}/
                  {lesson.questions.length}
                </small>

              </div>

              <h3>
                {currentQuestion.question}
              </h3>


              <div className="quiz-options">

                {currentQuestion.options.map(
                  (option, index) => {

                    let className = "quiz-option";

                    if (selectedAnswer !== null) {

                      if (
                        index ===
                        currentQuestion.answer
                      ) {
                        className += " correct";
                      }

                      if (
                        index === selectedAnswer &&
                        index !==
                          currentQuestion.answer
                      ) {
                        className += " incorrect";
                      }
                    }

                    return (
                      <button
                        key={option}
                        className={className}
                        onClick={() =>
                          chooseAnswer(index)
                        }
                      >
                        <span>
                          {String.fromCharCode(
                            65 + index
                          )}
                        </span>

                        {option}
                      </button>
                    );
                  }
                )}

              </div>


              {selectedAnswer !== null && (
                <button
                  className="quiz-next-button"
                  onClick={nextQuestion}
                >
                  {questionIndex <
                  lesson.questions.length - 1
                    ? "Next Question"
                    : "Finish Quiz"}

                  <ArrowRight size={17} />
                </button>
              )}

            </div>

          </>
        ) : (
          <div className="quiz-result">

            <div className="result-icon">
              <Trophy size={38} />
            </div>

            <span className="result-label">
              Lesson complete
            </span>

            <h2>
              Great work!
            </h2>

            <p>
              You scored{" "}
              <strong>
                {score}/{lesson.questions.length}
              </strong>{" "}
              and earned{" "}
              <strong>{lesson.xp} XP</strong>.
            </p>

            <div className="result-character">
              <Sparkles size={28} />
            </div>

            <button
              className="primary-music-button result-button"
              onClick={onComplete}
            >
              {completed
                ? "Continue"
                : "Complete Lesson"}

              <ArrowRight size={18} />
            </button>

          </div>
        )}

      </div>

    </div>
  );
}


/* =========================================================
   PRACTICE RECORDER
========================================================= */

function PracticeRecorder() {
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [status, setStatus] = useState("");
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      streamRef.current = stream;
      chunksRef.current = [];

      const recorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(
          chunksRef.current,
          { type: "audio/webm" }
        );

        const url = URL.createObjectURL(blob);

        setRecordedUrl(url);

        stream.getTracks().forEach((track) =>
          track.stop()
        );
      };

      recorder.start();

      setRecording(true);
      setStatus("Recording...");
    } catch (error) {
      console.error(error);
      setStatus(
        "Microphone permission was not granted."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    setRecording(false);
    setStatus("Recording ready.");
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadedFile(file);
    setRecordedUrl("");
    setStatus(`Selected: ${file.name}`);
  };

  const reset = () => {
    setRecordedUrl("");
    setUploadedFile(null);
    setStatus("");
  };

  return (
    <div className="practice-recorder">

      <div className="practice-buttons">

        {!recording ? (
          <button
            className="practice-button record"
            onClick={startRecording}
          >
            <Mic size={19} />
            Record Live
          </button>
        ) : (
          <button
            className="practice-button stop"
            onClick={stopRecording}
          >
            <Pause size={19} />
            Stop Recording
          </button>
        )}


        <label className="practice-button upload">

          <Upload size={19} />
          Upload Recording

          <input
            type="file"
            accept="audio/*"
            onChange={handleUpload}
            hidden
          />

        </label>

      </div>


      {status && (
        <div className="recording-status">
          <span className={recording ? "recording-dot" : ""} />
          {status}
        </div>
      )}


      {recordedUrl && (
        <div className="audio-result">

          <audio
            controls
            src={recordedUrl}
          />

          <button
            className="small-reset-button"
            onClick={reset}
          >
            <RotateCcw size={15} />
            Reset
          </button>

        </div>
      )}


      {uploadedFile && (
        <div className="uploaded-audio">

          <div>
            <Upload size={17} />
            <span>{uploadedFile.name}</span>
          </div>

          <button
            className="small-reset-button"
            onClick={reset}
          >
            <X size={15} />
          </button>

        </div>
      )}

    </div>
  );
}


/* =========================================================
   LEARN A SONG
========================================================= */

function LearnSong({ onBack }) {

  const [songFile, setSongFile] = useState(null);
  const [songAnalysis, setSongAnalysis] = useState(null);

  const [voiceFile, setVoiceFile] = useState(null);
  const [voiceResult, setVoiceResult] = useState(null);

  const [analyzingSong, setAnalyzingSong] =
    useState(false);

  const [analyzingVoice, setAnalyzingVoice] =
    useState(false);

  const [recording, setRecording] =
    useState(false);

  const [recordedVoiceUrl, setRecordedVoiceUrl] =
    useState("");

  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);


  const handleSongUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSongFile(file);
    setSongAnalysis(null);
    setVoiceResult(null);
    setError("");
  };


  const analyzeSong = async () => {

    if (!songFile) {
      setError("Please upload a song first.");
      return;
    }

    setAnalyzingSong(true);
    setError("");

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
          `Server returned ${response.status}`
        );
      }

      const data = await response.json();

      setSongAnalysis(data);

    } catch (err) {

      console.error(err);

      setError(
        "Unable to analyse the song. Make sure the SkillSensAI backend is running."
      );

    } finally {
      setAnalyzingSong(false);
    }
  };


  const startVoiceRecording = async () => {

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      streamRef.current = stream;
      chunksRef.current = [];

      const recorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {

        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }

      };

      recorder.onstop = () => {

        const blob = new Blob(
          chunksRef.current,
          {
            type: "audio/webm",
          }
        );

        const url =
          URL.createObjectURL(blob);

        setRecordedVoiceUrl(url);

        stream
          .getTracks()
          .forEach((track) => track.stop());

      };

      recorder.start();

      setRecording(true);
      setError("");

    } catch (err) {

      console.error(err);

      setError(
        "Unable to access your microphone."
      );

    }
  };


  const stopVoiceRecording = () => {

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    setRecording(false);

  };


  const handleVoiceUpload = (event) => {

    const file = event.target.files?.[0];

    if (!file) return;

    setVoiceFile(file);
    setRecordedVoiceUrl("");
    setVoiceResult(null);
    setError("");

  };


  const getRecordedBlob = async () => {

    if (!recordedVoiceUrl) return null;

    const response =
      await fetch(recordedVoiceUrl);

    return await response.blob();

  };


  const analyzeVoice = async () => {

    if (!songFile) {
      setError(
        "Please analyse a song before analysing your voice."
      );
      return;
    }

    if (!voiceFile && !recordedVoiceUrl) {
      setError(
        "Please record your voice or upload a recording."
      );
      return;
    }

    setAnalyzingVoice(true);
    setError("");

    try {

      let audioBlob = voiceFile;

      if (!audioBlob && recordedVoiceUrl) {
        audioBlob = await getRecordedBlob();
      }

      const formData = new FormData();

      formData.append(
        "file",
        audioBlob,
        voiceFile?.name || "recording.webm"
      );

      const response = await fetch(
        `${API_URL}/analyze-voice`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data = await response.json();

      setVoiceResult(data);

    } catch (err) {

      console.error(err);

      setError(
        "Unable to analyse your recording. Make sure the backend is running."
      );

    } finally {

      setAnalyzingVoice(false);

    }

  };


  const accuracy = useMemo(() => {

    if (!voiceResult) return null;

    const possibleValues = [
      voiceResult.accuracy,
      voiceResult.pitch_accuracy,
      voiceResult.score,
    ];

    const value = possibleValues.find(
      (item) =>
        typeof item === "number"
    );

    return value !== undefined
      ? Math.max(
          0,
          Math.min(100, Math.round(value))
        )
      : null;

  }, [voiceResult]);


  return (
    <main className="song-page">

      <header className="inner-topbar">

        <button
          className="back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          Music
        </button>

        <div className="inner-title">
          <Music2 size={20} />
          <span>Learn a Song</span>
        </div>

        <div />

      </header>


      <section className="song-header">

        <div>

          <div className="hero-badge">
            <Sparkles size={14} />
            AI Song Coach
          </div>

          <h2>
            Learn any song,
            <span> your way.</span>
          </h2>

          <p>
            Upload a song, understand its pitch and
            practise your own recording with AI-powered
            feedback.
          </p>

        </div>

        <div className="song-visual">

          <div className="song-visual-ring">
            <Music2 size={58} />
          </div>

          <span>AI MUSIC</span>

        </div>

      </section>


      {error && (
        <div className="music-error">
          <X size={18} />
          {error}
        </div>
      )}


      <section className="song-workspace">

        <div className="song-card-large">

          <div className="song-card-header">

            <div className="song-step">
              01
            </div>

            <div>
              <h3>Upload your song</h3>
              <p>
                Give SkillSensAI the song you want
                to practise.
              </p>
            </div>

          </div>


          <label className="song-upload-area">

            <input
              type="file"
              accept="audio/*"
              onChange={handleSongUpload}
              hidden
            />

            <div className="song-upload-icon">
              <Upload size={25} />
            </div>

            <strong>
              {songFile
                ? songFile.name
                : "Choose an audio file"}
            </strong>

            <span>
              MP3, WAV, M4A and other audio formats
            </span>

          </label>


          <button
            className="primary-music-button full-button"
            onClick={analyzeSong}
            disabled={
              !songFile || analyzingSong
            }
          >
            {analyzingSong ? (
              <>
                <span className="loading-spinner" />
                Analysing Song...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Analyse Song
              </>
            )}
          </button>


          {songAnalysis && (
            <SongAnalysis
              data={songAnalysis}
            />
          )}

        </div>


        <div className="song-card-large">

          <div className="song-card-header">

            <div className="song-step">
              02
            </div>

            <div>
              <h3>Practise your voice</h3>
              <p>
                Record live or upload your own
                recording.
              </p>
            </div>

          </div>


          <div className="song-practice-options">

            {!recording ? (
              <button
                className="song-practice-button"
                onClick={startVoiceRecording}
              >
                <Mic size={22} />
                <div>
                  <strong>Record Live</strong>
                  <span>
                    Use your microphone
                  </span>
                </div>
              </button>
            ) : (
              <button
                className="song-practice-button recording-active"
                onClick={stopVoiceRecording}
              >
                <Pause size={22} />
                <div>
                  <strong>Stop Recording</strong>
                  <span>
                    Recording in progress...
                  </span>
                </div>
              </button>
            )}


            <label className="song-practice-button">

              <Upload size={22} />

              <div>
                <strong>Upload Recording</strong>
                <span>
                  Use an existing recording
                </span>
              </div>

              <input
                type="file"
                accept="audio/*"
                onChange={handleVoiceUpload}
                hidden
              />

            </label>

          </div>


          {recordedVoiceUrl && (
            <div className="song-audio-preview">

              <span>Your recording</span>

              <audio
                controls
                src={recordedVoiceUrl}
              />

            </div>
          )}


          {voiceFile && (
            <div className="selected-voice-file">

              <Volume2 size={17} />

              <span>
                {voiceFile.name}
              </span>

              <Check size={17} />

            </div>
          )}


          <button
            className="primary-music-button full-button"
            onClick={analyzeVoice}
            disabled={
              analyzingVoice ||
              (!voiceFile && !recordedVoiceUrl)
            }
          >
            {analyzingVoice ? (
              <>
                <span className="loading-spinner" />
                Analysing Voice...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Analyse My Voice
              </>
            )}
          </button>


          {voiceResult && (
            <VoiceResult
              result={voiceResult}
              accuracy={accuracy}
            />
          )}

        </div>

      </section>

    </main>
  );
}


/* =========================================================
   SONG ANALYSIS
========================================================= */

function SongAnalysis({ data }) {

  const duration =
    data?.duration ??
    data?.song_duration ??
    data?.length;

  const detectedPitch =
    data?.average_pitch ??
    data?.mean_pitch ??
    data?.pitch;

  return (
    <div className="analysis-result">

      <div className="analysis-result-header">

        <Sparkles size={18} />

        <div>
          <strong>AI Song Analysis</strong>
          <span>
            Your song has been analysed.
          </span>
        </div>

      </div>


      <div className="analysis-stats">

        <div>
          <span>Duration</span>
          <strong>
            {duration
              ? `${Number(duration).toFixed(1)}s`
              : "Detected"}
          </strong>
        </div>

        <div>
          <span>Pitch</span>
          <strong>
            {detectedPitch
              ? Number(detectedPitch).toFixed(1)
              : "Detected"}
          </strong>
        </div>

        <div>
          <span>Status</span>
          <strong>
            Ready
          </strong>
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   VOICE RESULT
========================================================= */

function VoiceResult({
  result,
  accuracy,
}) {

  const score =
    accuracy !== null
      ? accuracy
      : 0;

  let message =
    "Keep practising — you're building your musical control.";

  if (score >= 90) {
    message =
      "Excellent! Your pitch control is very strong.";
  } else if (score >= 75) {
    message =
      "Great job! Your pitch is getting more consistent.";
  } else if (score >= 60) {
    message =
      "Good start! Keep practising the difficult notes.";
  }

  return (
    <div className="voice-result">

      <div className="voice-score-circle">

        <div>
          <strong>{score}</strong>
          <span>%</span>
        </div>

      </div>

      <div className="voice-result-info">

        <span className="result-small-label">
          AI feedback
        </span>

        <h4>
          {score >= 90
            ? "Outstanding performance"
            : score >= 75
            ? "Very good performance"
            : score >= 60
            ? "You're improving"
            : "Keep practising"}
        </h4>

        <p>{message}</p>

      </div>

    </div>
  );
}
