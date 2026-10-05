import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleHelp,
  Mic,
  Upload,
  Video,
  Play,
  Pause,
  RotateCcw,
  Lock,
  Sparkles,
  Volume2,
  Target,
  Brain,
} from "lucide-react";

import "./Lesson.css";

import {
  getLessonsLearned,
  completeNextLesson,
} from "../utils/progress";

/* =========================================================
   LESSON DATA
   ========================================================= */

const LESSONS = {
  1: {
    title: "Understanding Your Voice",
    subtitle:
      "Learn how your voice creates sound and understand the basics of pitch.",
    video: "/music/lessons/lesson-1.mp4",

    theory: [
      {
        title: "Your Voice Creates Sound",
        text:
          "Your voice is created when air from your lungs passes through your vocal cords. The vocal cords vibrate and create sound.",
      },
      {
        title: "What Is Pitch?",
        text:
          "Pitch tells us how high or low a sound is. Faster vocal-cord vibrations create higher pitch, while slower vibrations create lower pitch.",
      },
      {
        title: "Listen to Your Voice",
        text:
          "Before learning to sing accurately, you need to become familiar with your natural voice and how it moves between high and low sounds.",
      },
    ],

    questions: [
      {
        id: 1,
        question:
          "What creates the sound of your voice?",
        options: [
          "Your vocal cords vibrating",
          "Your teeth moving",
          "Your tongue becoming louder",
          "Your ears vibrating",
        ],
        answer: 0,
      },
      {
        id: 2,
        question:
          "What does pitch describe?",
        options: [
          "How loud a sound is",
          "How high or low a sound is",
          "How long a song is",
          "How fast you breathe",
        ],
        answer: 1,
      },
      {
        id: 3,
        question:
          "A faster vocal-cord vibration generally produces a...",
        options: [
          "Lower pitch",
          "Higher pitch",
          "Silent sound",
          "Slower song",
        ],
        answer: 1,
      },
    ],
  },

  2: {
    title: "Breathing & Voice Control",
    subtitle:
      "Learn how breathing supports controlled and consistent sound.",
    video: "/music/lessons/lesson-2.mp4",

    theory: [
      {
        title: "Breathing Supports Your Voice",
        text:
          "Controlled breathing provides the airflow needed to produce a steady sound.",
      },
      {
        title: "Control Your Airflow",
        text:
          "Instead of releasing all your air at once, learn to control the airflow gradually.",
      },
      {
        title: "Stay Relaxed",
        text:
          "Relax your shoulders and avoid unnecessary tension while breathing and producing sound.",
      },
    ],

    questions: [
      {
        id: 1,
        question:
          "Why is controlled breathing important for singing?",
        options: [
          "It supports steady sound",
          "It makes your ears bigger",
          "It changes your eye color",
          "It removes pitch completely",
        ],
        answer: 0,
      },
      {
        id: 2,
        question:
          "What should your shoulders generally do while breathing?",
        options: [
          "Stay relaxed",
          "Move constantly",
          "Become tense",
          "Shake",
        ],
        answer: 0,
      },
      {
        id: 3,
        question:
          "Good breath control helps you...",
        options: [
          "Control your sound",
          "Stop making sound",
          "Avoid listening",
          "Forget pitch",
        ],
        answer: 0,
      },
    ],
  },

  3: {
    title: "Finding Your Pitch",
    subtitle:
      "Learn to recognize and match different pitches.",
    video: "/music/lessons/lesson-3.mp4",

    theory: [
      {
        title: "Recognizing Pitch",
        text:
          "Pitch is the perceived highness or lowness of a sound.",
      },
      {
        title: "Matching Pitch",
        text:
          "Pitch matching means adjusting your voice until it reaches the same pitch as the reference sound.",
      },
      {
        title: "Listen Before You Sing",
        text:
          "Careful listening makes it easier to identify whether your voice is above or below the target.",
      },
    ],

    questions: [
      {
        id: 1,
        question:
          "What does pitch describe?",
        options: [
          "Highness or lowness",
          "Volume only",
          "Recording length",
          "Breathing speed",
        ],
        answer: 0,
      },
      {
        id: 2,
        question:
          "Pitch matching means...",
        options: [
          "Making your voice louder",
          "Matching the reference pitch",
          "Stopping your voice",
          "Changing the song",
        ],
        answer: 1,
      },
      {
        id: 3,
        question:
          "What should you do before trying to match a pitch?",
        options: [
          "Listen carefully",
          "Close your ears",
          "Speak faster",
          "Stop breathing",
        ],
        answer: 0,
      },
    ],
  },

  4: {
    title: "Singing Basic Notes",
    subtitle:
      "Practice producing clear and accurate basic notes.",
    video: "/music/lessons/lesson-4.mp4",

    theory: [
      {
        title: "Start With Simple Notes",
        text:
          "Learning individual notes gives you a foundation for melodies and songs.",
      },
      {
        title: "Listen and Repeat",
        text:
          "Listen to the reference note and reproduce it carefully with your voice.",
      },
      {
        title: "Accuracy Comes First",
        text:
          "Focus on reaching the correct pitch before worrying about speed or complexity.",
      },
    ],

    questions: [
      {
        id: 1,
        question:
          "What should you focus on first when learning a note?",
        options: [
          "Pitch accuracy",
          "Singing faster",
          "Singing louder",
          "Ignoring the reference",
        ],
        answer: 0,
      },
      {
        id: 2,
        question:
          "What is a useful way to practice a note?",
        options: [
          "Listen and repeat",
          "Never listen",
          "Change the pitch randomly",
          "Avoid repetition",
        ],
        answer: 0,
      },
      {
        id: 3,
        question:
          "Individual notes help build a foundation for...",
        options: [
          "Melodies and songs",
          "Silence",
          "Only breathing",
          "Nothing",
        ],
        answer: 0,
      },
    ],
  },

  5: {
    title: "Pitch Stability & Accuracy",
    subtitle:
      "Learn to hold your pitch steadily and accurately.",
    video: "/music/lessons/lesson-5.mp4",

    theory: [
      {
        title: "Stable Pitch",
        text:
          "A stable pitch stays close to the target instead of moving unpredictably.",
      },
      {
        title: "Small Corrections",
        text:
          "If your pitch is slightly high or low, make a small controlled adjustment.",
      },
      {
        title: "Practice Holding",
        text:
          "Try to maintain the same note for a period of time without drifting away from the target.",
      },
    ],

    questions: [
      {
        id: 1,
        question:
          "What does pitch stability mean?",
        options: [
          "Keeping pitch close to the target",
          "Changing pitch constantly",
          "Stopping sound",
          "Singing randomly",
        ],
        answer: 0,
      },
      {
        id: 2,
        question:
          "What should you make when slightly off pitch?",
        options: [
          "A small controlled correction",
          "A random jump",
          "No correction ever",
          "A loud shout",
        ],
        answer: 0,
      },
      {
        id: 3,
        question:
          "Pitch stability improves through...",
        options: [
          "Practice",
          "Ignoring the target",
          "Never repeating",
          "Avoiding listening",
        ],
        answer: 0,
      },
    ],
  },

  6: {
    title: "Your First Complete Performance",
    subtitle:
      "Put everything together and perform the complete lesson.",
    video: "/music/lessons/lesson-6.mp4",

    theory: [
      {
        title: "Put Everything Together",
        text:
          "Use breathing, pitch awareness, note accuracy and stability together.",
      },
      {
        title: "Perform With Confidence",
        text:
          "Focus on applying the techniques you have learned instead of trying to be perfect immediately.",
      },
      {
        title: "Your First Complete Performance",
        text:
          "This is your opportunity to demonstrate the skills you developed throughout the journey.",
      },
    ],

    questions: [
      {
        id: 1,
        question:
          "What should you combine in your final performance?",
        options: [
          "The skills you learned",
          "Only volume",
          "Only speed",
          "Nothing",
        ],
        answer: 0,
      },
      {
        id: 2,
        question:
          "What should you focus on during your performance?",
        options: [
          "Applying your techniques",
          "Ignoring pitch",
          "Stopping frequently",
          "Avoiding breathing",
        ],
        answer: 0,
      },
      {
        id: 3,
        question:
          "The final performance demonstrates your...",
        options: [
          "Learning progress",
          "Phone battery",
          "Internet speed",
          "Screen size",
        ],
        answer: 0,
      },
    ],
  },
};

/* =========================================================
   COMPONENT
   ========================================================= */

function Lesson() {
  const navigate = useNavigate();
  const { lessonId } = useParams();

  const numericLessonId = Number(lessonId);

  const lesson =
    LESSONS[numericLessonId] || LESSONS[1];

  const [theme, setTheme] = useState(
    localStorage.getItem("skillsensai_theme") || "light"
  );

  const [videoPlaying, setVideoPlaying] =
    useState(false);

  const videoRef = useRef(null);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState(null);

  const [answers, setAnswers] = useState([]);

  const [questionsComplete, setQuestionsComplete] =
    useState(false);

  const [practiceMode, setPracticeMode] =
    useState(null);

  const [recording, setRecording] =
    useState(false);

  const [recordingComplete, setRecordingComplete] =
    useState(false);

  const [uploadedFile, setUploadedFile] =
    useState(null);

  const [analysisComplete, setAnalysisComplete] =
    useState(false);

  const [completed, setCompleted] =
    useState(false);

  const [recordingTime, setRecordingTime] =
    useState(0);

  const recordingTimerRef = useRef(null);

  /* =======================================================
     THEME
     ======================================================= */

  useEffect(() => {
    const updateTheme = () => {
      setTheme(
        localStorage.getItem("skillsensai_theme") ||
          "light"
      );
    };

    updateTheme();

    window.addEventListener(
      "skillsensai-theme-changed",
      updateTheme
    );

    window.addEventListener(
      "storage",
      updateTheme
    );

    return () => {
      window.removeEventListener(
        "skillsensai-theme-changed",
        updateTheme
      );

      window.removeEventListener(
        "storage",
        updateTheme
      );
    };
  }, []);

  /* =======================================================
     RECORDING TIMER
     ======================================================= */

  useEffect(() => {
    if (recording) {
      recordingTimerRef.current =
        setInterval(() => {
          setRecordingTime(
            (previous) => previous + 1
          );
        }, 1000);
    } else {
      clearInterval(
        recordingTimerRef.current
      );
    }

    return () => {
      clearInterval(
        recordingTimerRef.current
      );
    };
  }, [recording]);

  /* =======================================================
     VIDEO
     ======================================================= */

  const toggleVideo = () => {
    if (!videoRef.current) {
      return;
    }

    if (videoPlaying) {
      videoRef.current.pause();
      setVideoPlaying(false);
    } else {
      videoRef.current.play();
      setVideoPlaying(true);
    }
  };

  /* =======================================================
     QUESTIONS
     ======================================================= */

  const selectAnswer = (index) => {
    setSelectedAnswer(index);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) {
      return;
    }

    const updatedAnswers = [
      ...answers,
      selectedAnswer,
    ];

    setAnswers(updatedAnswers);

    if (
      currentQuestion <
      lesson.questions.length - 1
    ) {
      setCurrentQuestion(
        currentQuestion + 1
      );

      setSelectedAnswer(null);
    } else {
      setQuestionsComplete(true);
    }
  };

  /* =======================================================
     PRACTICE MODE
     ======================================================= */

  const chooseRecordMode = () => {
    setPracticeMode("record");
    setRecordingComplete(false);
    setAnalysisComplete(false);
    setRecordingTime(0);
  };

  const chooseUploadMode = () => {
    setPracticeMode("upload");
    setRecordingComplete(false);
    setAnalysisComplete(false);
  };

  /* =======================================================
     RECORDING
     ======================================================= */

  const startRecording = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      setRecording(true);
      setRecordingComplete(false);
      setAnalysisComplete(false);
      setRecordingTime(0);
    } catch (error) {
      alert(
        "Microphone access is required to record your lesson."
      );
    }
  };

  const stopRecording = () => {
    setRecording(false);
    setRecordingComplete(true);
  };

  /* =======================================================
     UPLOAD
     ======================================================= */

  const handleUpload = (event) => {
    const file =
      event.target.files &&
      event.target.files[0];

    if (!file) {
      return;
    }

    setUploadedFile(file);
    setRecordingComplete(true);
    setAnalysisComplete(false);
  };

  /* =======================================================
     ANALYSIS
     ======================================================= */

  const analyzePerformance = () => {
    if (!recordingComplete) {
      return;
    }

    setAnalysisComplete(true);
  };

  /* =======================================================
     COMPLETE LESSON
     ======================================================= */

  const completeLessonHandler = () => {
    if (!analysisComplete) {
      return;
    }

    completeNextLesson();
    setCompleted(true);
  };

  /* =======================================================
     RESET
     ======================================================= */

  const resetPractice = () => {
    setRecording(false);
    setRecordingComplete(false);
    setAnalysisComplete(false);
    setRecordingTime(0);
    setUploadedFile(null);
    setPracticeMode(null);
  };

  /* =======================================================
     FORMAT TIME
     ======================================================= */

  const formatTime = (seconds) => {
    const minutes = Math.floor(
      seconds / 60
    );

    const remainingSeconds =
      seconds % 60;

    return (
      String(minutes).padStart(2, "0") +
      ":" +
      String(remainingSeconds).padStart(2, "0")
    );
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div
      className={
        theme === "dark"
          ? "lesson-page dark"
          : "lesson-page light"
      }
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="lesson-header">
        <button
          className="lesson-back-button"
          onClick={() =>
            navigate("/music/learn")
          }
        >
          <ArrowLeft size={20} />
          <span>
            Learning Journey
          </span>
        </button>

        <div className="lesson-header-title">
          <span>
            LESSON {numericLessonId}
          </span>

          <strong>
            {lesson.title}
          </strong>
        </div>

        <div className="lesson-header-progress">
          <Target size={17} />
          <span>
            Lesson {numericLessonId} of 6
          </span>
        </div>
      </header>

      <main className="lesson-content">

        {/* =================================================
            LESSON INTRO
        ================================================= */}

        <section className="lesson-intro">
          <div className="lesson-eyebrow">
            <Sparkles size={14} />
            MUSIC LESSON
          </div>

          <h1>
            {lesson.title}
          </h1>

          <p>
            {lesson.subtitle}
          </p>
        </section>

        {/* =================================================
            STEP 1 — VIDEO
        ================================================= */}

        <section className="lesson-section">
          <div className="lesson-section-heading">
            <div className="lesson-step-number">
              1
            </div>

            <div>
              <h2>
                Watch the Lesson
              </h2>

              <p>
                Watch the complete lesson before
                moving to the questions.
              </p>
            </div>
          </div>

          <div className="lesson-video-card">
            <div className="lesson-video-wrapper">

              <video
                ref={videoRef}
                src={lesson.video}
                className="lesson-video"
                controls
                onPlay={() =>
                  setVideoPlaying(true)
                }
                onPause={() =>
                  setVideoPlaying(false)
                }
              />

              <button
                className="lesson-video-play"
                onClick={toggleVideo}
              >
                {videoPlaying ? (
                  <Pause size={24} />
                ) : (
                  <Play size={24} />
                )}
              </button>
            </div>

            <div className="lesson-video-info">
              <Video size={20} />

              <span>
                Watch carefully and pay attention
                to the techniques demonstrated.
              </span>
            </div>
          </div>
        </section>

        {/* =================================================
            STEP 2 — THEORY
        ================================================= */}

        <section className="lesson-section">
          <div className="lesson-section-heading">
            <div className="lesson-step-number">
              2
            </div>

            <div>
              <h2>
                What You Learned
              </h2>

              <p>
                Understand the important concepts
                from this lesson.
              </p>
            </div>
          </div>

          <div className="theory-grid">
            {lesson.theory.map(
              (item, index) => (
                <div
                  className="theory-card"
                  key={index}
                >
                  <div className="theory-icon">
                    {index === 0 ? (
                      <Volume2 size={21} />
                    ) : index === 1 ? (
                      <Target size={21} />
                    ) : (
                      <Brain size={21} />
                    )}
                  </div>

                  <h3>
                    {item.title}
                  </h3>

                  <p>
                    {item.text}
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        {/* =================================================
            STEP 3 — QUESTIONS
        ================================================= */}

        <section className="lesson-section">
          <div className="lesson-section-heading">
            <div className="lesson-step-number">
              3
            </div>

            <div>
              <h2>
                Check Your Understanding
              </h2>

              <p>
                Answer all questions before starting
                your complete lesson performance.
              </p>
            </div>
          </div>

          {!questionsComplete ? (
            <div className="question-card">

              <div className="question-top">
                <span>
                  Question{" "}
                  {currentQuestion + 1}
                  {" / "}
                  {lesson.questions.length}
                </span>

                <CircleHelp size={20} />
              </div>

              <h3>
                {
                  lesson.questions[
                    currentQuestion
                  ].question
                }
              </h3>

              <div className="answer-list">
                {lesson.questions[
                  currentQuestion
                ].options.map(
                  (option, index) => (
                    <button
                      key={index}
                      className={
                        selectedAnswer ===
                        index
                          ? "answer-option selected"
                          : "answer-option"
                      }
                      onClick={() =>
                        selectAnswer(index)
                      }
                    >
                      <span className="answer-letter">
                        {String.fromCharCode(
                          65 + index
                        )}
                      </span>

                      <span>
                        {option}
                      </span>
                    </button>
                  )
                )}
              </div>

              <button
                className="primary-action"
                disabled={
                  selectedAnswer === null
                }
                onClick={submitAnswer}
              >
                {currentQuestion <
                lesson.questions.length - 1
                  ? "Next Question"
                  : "Finish Questions"}

                <ChevronRight size={19} />
              </button>
            </div>
          ) : (
            <div className="success-card">
              <div className="success-icon">
                <Check size={27} />
              </div>

              <div>
                <h3>
                  Questions Complete
                </h3>

                <p>
                  Great! Now complete the entire
                  lesson through a recording or upload.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* =================================================
            STEP 4 — COMPLETE PERFORMANCE
        ================================================= */}

        <section className="lesson-section">
          <div className="lesson-section-heading">
            <div className="lesson-step-number">
              4
            </div>

            <div>
              <h2>
                Perform the Complete Lesson
              </h2>

              <p>
                You must perform the entire lesson.
                Watching the video and answering questions
                alone will not complete it.
              </p>
            </div>
          </div>

          {!questionsComplete ? (
            <div className="locked-practice-card">
              <Lock size={25} />

              <h3>
                Complete the questions first
              </h3>

              <p>
                Finish the understanding check to
                unlock your practice session.
              </p>
            </div>
          ) : (
            <>
              {!practiceMode && (
                <div className="practice-choice-grid">

                  <button
                    className="practice-choice"
                    onClick={
                      chooseRecordMode
                    }
                  >
                    <div className="practice-choice-icon">
                      <Mic size={28} />
                    </div>

                    <h3>
                      Record Live
                    </h3>

                    <p>
                      Perform the complete lesson
                      while receiving live pitch guidance.
                    </p>

                    <span>
                      Start Recording
                      <ChevronRight size={18} />
                    </span>
                  </button>

                  <label className="practice-choice">
                    <div className="practice-choice-icon">
                      <Upload size={28} />
                    </div>

                    <h3>
                      Upload Voice
                    </h3>

                    <p>
                      Upload your complete lesson
                      recording for AI analysis.
                    </p>

                    <span>
                      Choose Recording
                      <ChevronRight size={18} />
                    </span>

                    <input
                      type="file"
                      accept="audio/*,video/*"
                      hidden
                      onChange={
                        handleUpload
                      }
                    />
                  </label>
                </div>
              )}

              {/* ===========================================
                  RECORD LIVE
              =========================================== */}

              {practiceMode === "record" && (
                <div className="practice-panel">

                  <div className="practice-panel-header">
                    <div>
                      <span>
                        LIVE PRACTICE
                      </span>

                      <h3>
                        Perform the Complete Lesson
                      </h3>
                    </div>

                    <button
                      className="reset-practice"
                      onClick={
                        resetPractice
                      }
                    >
                      <RotateCcw size={17} />
                      Reset
                    </button>
                  </div>

                  <div className="live-pitch-area">

                    <div className="pitch-target">
                      <Target size={21} />

                      <span>
                        Reference Pitch
                      </span>

                      <strong>
                        Listen and match
                      </strong>
                    </div>

                    <div className="pitch-tracker">
                      <div className="pitch-line">
                        <div className="pitch-marker">
                          ●
                        </div>
                      </div>

                      <div className="pitch-labels">
                        <span>
                          Low ↓
                        </span>

                        <span className="pitch-feedback">
                          {recording
                            ? "Listening..."
                            : recordingComplete
                            ? "Recording complete"
                            : "Ready"}
                        </span>

                        <span>
                          High ↑
                        </span>
                      </div>
                    </div>

                    <div className="live-feedback">
                      <span>
                        {recording
                          ? "Keep singing — match the reference pitch"
                          : recordingComplete
                          ? "Good job! Your complete lesson has been recorded."
                          : "Press Start Recording when you are ready."}
                      </span>
                    </div>
                  </div>

                  <div className="recording-controls">

                    <div className="recording-timer">
                      <span
                        className={
                          recording
                            ? "recording-dot active"
                            : "recording-dot"
                        }
                      />

                      {formatTime(
                        recordingTime
                      )}
                    </div>

                    {!recording ? (
                      <button
                        className="record-button"
                        onClick={
                          startRecording
                        }
                      >
                        <Mic size={21} />
                        Start Recording
                      </button>
                    ) : (
                      <button
                        className="stop-record-button"
                        onClick={
                          stopRecording
                        }
                      >
                        <span />
                        Stop Recording
                      </button>
                    )}
                  </div>

                  {recordingComplete &&
                    !analysisComplete && (
                      <button
                        className="primary-action analyze-button"
                        onClick={
                          analyzePerformance
                        }
                      >
                        <Sparkles size={19} />
                        Analyze My Performance
                      </button>
                    )}
                </div>
              )}

              {/* ===========================================
                  UPLOAD
              =========================================== */}

              {practiceMode === "upload" && (
                <div className="practice-panel">

                  <div className="practice-panel-header">
                    <div>
                      <span>
                        UPLOAD PRACTICE
                      </span>

                      <h3>
                        Upload Your Complete Lesson
                      </h3>
                    </div>

                    <button
                      className="reset-practice"
                      onClick={
                        resetPractice
                      }
                    >
                      <RotateCcw size={17} />
                      Reset
                    </button>
                  </div>

                  {!uploadedFile ? (
                    <label className="upload-area">
                      <Upload size={36} />

                      <h3>
                        Choose your recording
                      </h3>

                      <p>
                        Upload the complete lesson
                        performance.
                      </p>

                      <span>
                        Select File
                      </span>

                      <input
                        type="file"
                        accept="audio/*,video/*"
                        hidden
                        onChange={
                          handleUpload
                        }
                      />
                    </label>
                  ) : (
                    <div className="uploaded-file">

                      <div className="uploaded-file-icon">
                        <Volume2 size={24} />
                      </div>

                      <div>
                        <strong>
                          {uploadedFile.name}
                        </strong>

                        <span>
                          Recording ready for analysis
                        </span>
                      </div>

                      <Check size={23} />
                    </div>
                  )}

                  {uploadedFile &&
                    !analysisComplete && (
                      <button
                        className="primary-action analyze-button"
                        onClick={
                          analyzePerformance
                        }
                      >
                        <Sparkles size={19} />
                        Analyze My Performance
                      </button>
                    )}
                </div>
              )}
            </>
          )}
        </section>

        {/* =================================================
            STEP 5 — AI ANALYSIS
        ================================================= */}

        {analysisComplete && (
          <section className="lesson-section">
            <div className="lesson-section-heading">
              <div className="lesson-step-number">
                5
              </div>

              <div>
                <h2>
                  Your AI Performance Analysis
                </h2>

                <p>
                  Here is how your performance compares
                  with the lesson reference.
                </p>
              </div>
            </div>

            <div className="analysis-card">

              <div className="analysis-score">
                <div className="score-circle">
                  <strong>
                    82
                  </strong>

                  <span>
                    /100
                  </span>
                </div>

                <div>
                  <h3>
                    Good Start!
                  </h3>

                  <p>
                    Your performance shows a good
                    understanding of the lesson.
                  </p>
                </div>
              </div>

              <div className="analysis-metrics">

                <div className="metric-card">
                  <span>
                    Pitch Accuracy
                  </span>

                  <strong>
                    84%
                  </strong>
                </div>

                <div className="metric-card">
                  <span>
                    Note Match
                  </span>

                  <strong>
                    81%
                  </strong>
                </div>

                <div className="metric-card">
                  <span>
                    Stability
                  </span>

                  <strong>
                    80%
                  </strong>
                </div>

                <div className="metric-card">
                  <span>
                    Avg. Pitch Error
                  </span>

                  <strong>
                    18 cents
                  </strong>
                </div>

              </div>

              <div className="pitch-comparison">

                <div className="comparison-header">
                  <div>
                    <span className="reference-dot" />
                    Reference Pitch
                  </div>

                  <div>
                    <span className="user-dot" />
                    Your Pitch
                  </div>
                </div>

                <div className="pitch-chart">

                  <div className="reference-wave">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className="user-wave">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                </div>

                <div className="comparison-labels">
                  <span>
                    Lower
                  </span>

                  <span>
                    Pitch Comparison
                  </span>

                  <span>
                    Higher
                  </span>
                </div>
              </div>

              <div className="theoretical-feedback">

                <div className="feedback-icon">
                  <Brain size={23} />
                </div>

                <div>
                  <h3>
                    AI Feedback
                  </h3>

                  <p>
                    Your pitch was generally close
                    to the reference. A few sections
                    were slightly high. Try to listen
                    carefully before producing each
                    sound and make small corrections.
                    Your stability is developing well.
                  </p>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* =================================================
            STEP 6 — COMPLETE
        ================================================= */}

        {analysisComplete && (
          <section className="lesson-completion-section">

            {!completed ? (
              <>
                <div className="completion-lock">
                  <Check size={30} />
                </div>

                <h2>
                  Ready to Complete Lesson{" "}
                  {numericLessonId}?
                </h2>

                <p>
                  You watched the lesson, completed
                  the questions and performed the
                  complete lesson.
                </p>

                <button
                  className="complete-lesson-button"
                  onClick={
                    completeLessonHandler
                  }
                >
                  Complete Lesson
                  <ChevronRight size={20} />
                </button>
              </>
            ) : (
              <div className="lesson-completed">

                <div className="completed-celebration">
                  <Sparkles size={35} />
                </div>

                <h2>
                  Lesson Complete!
                </h2>

                <p>
                  Excellent work. You completed
                  the entire lesson and your next
                  lesson is now unlocked.
                </p>

                {numericLessonId <
                6 ? (
                  <button
                    className="complete-lesson-button"
                    onClick={() =>
                      navigate(
                        "/music/learn/lesson/" +
                          (numericLessonId + 1)
                      )
                    }
                  >
                    Continue to Lesson{" "}
                    {numericLessonId + 1}
                    <ChevronRight size={20} />
                  </button>
                ) : (
                  <button
                    className="complete-lesson-button"
                    onClick={() =>
                      navigate(
                        "/music/learn"
                      )
                    }
                  >
                    Back to Learning Journey
                    <ChevronRight size={20} />
                  </button>
                )}

              </div>
            )}
          </section>
        )}

      </main>
    </div>
  );
}

export default Lesson;
```

### Step 2 — Create `src/pages/Lesson.css`

:::writing{variant="document" id="30576" title="Lesson.css"}
```css
/* =========================================================
   SKILLSENSAI — LESSON PAGE
   ========================================================= */

.lesson-page {
  min-height: 100vh;
  box-sizing: border-box;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  background:
    radial-gradient(
      circle at 50% 0%,
      rgba(124, 92, 252, 0.08),
      transparent 35%
    ),
    #f7f5fc;

  color: #211d2d;

  transition:
    background 0.3s ease,
    color 0.3s ease;
}

.lesson-page.dark {
  background:
    radial-gradient(
      circle at 50% 0%,
      rgba(124, 92, 252, 0.16),
      transparent 35%
    ),
    #0d0b14;

  color: #f5f2ff;
}

/* =========================================================
   HEADER
   ========================================================= */

.lesson-header {
  position: sticky;
  top: 0;
  z-index: 100;

  min-height: 72px;
  padding: 0 32px;

  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;

  gap: 20px;

  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid #e5e0ee;

  backdrop-filter: blur(16px);
}

.lesson-page.dark .lesson-header {
  background: rgba(17, 14, 25, 0.9);
  border-bottom-color: #292333;
}

.lesson-back-button {
  width: fit-content;

  height: 44px;
  padding: 0 17px;

  border: none;
  border-radius: 13px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  background:
    linear-gradient(
      135deg,
      #7c5cfc,
      #6245d8
    );

  color: #ffffff;

  cursor: pointer;

  font-size: 13px;
  font-weight: 800;

  box-shadow:
    0 8px 22px rgba(98, 69, 216, 0.25);

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.lesson-back-button:hover {
  transform: translateY(-2px);

  box-shadow:
    0 12px 28px rgba(98, 69, 216, 0.34);
}

.lesson-header-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;

  text-align: center;
}

.lesson-header-title span {
  color: #7c5cfc;

  font-size: 10px;
  font-weight: 900;

  letter-spacing: 1.5px;
}

.lesson-header-title strong {
  font-size: 16px;
  font-weight: 900;
}

.lesson-header-progress {
  justify-self: end;

  display: flex;
  align-items: center;
  gap: 7px;

  color: #756d82;

  font-size: 12px;
  font-weight: 700;
}

.lesson-page.dark .lesson-header-progress {
  color: #aaa1b8;
}

/* =========================================================
   CONTENT
   ========================================================= */

.lesson-content {
  width: min(1000px, calc(100% - 40px));

  margin: 0 auto;

  padding:
    60px 0
    100px;
}

/* =========================================================
   INTRO
   ========================================================= */

.lesson-intro {
  text-align: center;

  max-width: 760px;

  margin:
    0 auto
    55px;
}

.lesson-eyebrow {
  width: fit-content;

  margin: 0 auto 15px;

  padding: 7px 12px;

  display: flex;
  align-items: center;
  gap: 7px;

  border-radius: 999px;

  background: #eeeaff;

  color: #6245d8;

  font-size: 10px;
  font-weight: 900;

  letter-spacing: 1.4px;
}

.lesson-page.dark .lesson-eyebrow {
  background: rgba(124, 92, 252, 0.14);
  color: #b7a8ff;
}

.lesson-intro h1 {
  margin: 0;

  font-size: clamp(34px, 5vw, 52px);
  line-height: 1.05;

  letter-spacing: -1.8px;

  font-weight: 950;
}

.lesson-intro p {
  max-width: 680px;

  margin:
    18px auto
    0;

  color: #746c80;

  font-size: 16px;
  line-height: 1.7;
}

.lesson-page.dark .lesson-intro p {
  color: #aaa2b5;
}

/* =========================================================
   SECTIONS
   ========================================================= */

.lesson-section {
  margin-bottom: 70px;
}

.lesson-section-heading {
  display: flex;
  align-items: flex-start;

  gap: 15px;

  margin-bottom: 22px;
}

.lesson-step-number {
  flex-shrink: 0;

  width: 38px;
  height: 38px;

  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background:
    linear-gradient(
      135deg,
      #7c5cfc,
      #6245d8
    );

  color: #ffffff;

  font-size: 15px;
  font-weight: 900;

  box-shadow:
    0 7px 18px rgba(98, 69, 216, 0.22);
}

.lesson-section-heading h2 {
  margin: 2px 0 4px;

  font-size: 23px;
  font-weight: 900;
}

.lesson-section-heading p {
  margin: 0;

  color: #7d7488;

  font-size: 13px;
  line-height: 1.6;
}

.lesson-page.dark .lesson-section-heading p {
  color: #aaa1b4;
}

/* =========================================================
   VIDEO
   ========================================================= */

.lesson-video-card {
  overflow: hidden;

  border: 1px solid #e4deed;
  border-radius: 22px;

  background: #ffffff;

  box-shadow:
    0 16px 45px rgba(54, 42, 81, 0.08);
}

.lesson-page.dark .lesson-video-card {
  border-color: #2c2638;
  background: #17131f;

  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.25);
}

.lesson-video-wrapper {
  position: relative;

  background: #08070b;

  aspect-ratio: 16 / 9;
}

.lesson-video {
  width: 100%;
  height: 100%;

  display: block;

  object-fit: contain;
}

.lesson-video-play {
  position: absolute;

  left: 50%;
  top: 50%;

  transform: translate(-50%, -50%);

  width: 58px;
  height: 58px;

  border: none;
  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(124, 92, 252, 0.95);

  color: #ffffff;

  cursor: pointer;

  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.3);
}

.lesson-video-info {
  min-height: 58px;

  padding: 0 20px;

  display: flex;
  align-items: center;

  gap: 10px;

  color: #756d81;

  font-size: 13px;
  font-weight: 650;
}

.lesson-video-info svg {
  color: #7c5cfc;
}

/* =========================================================
   THEORY
   ========================================================= */

.theory-grid {
  display: grid;

  grid-template-columns:
    repeat(3, 1fr);

  gap: 16px;
}

.theory-card {
  padding: 24px;

  border: 1px solid #e4deed;
  border-radius: 20px;

  background: #ffffff;

  box-shadow:
    0 12px 35px rgba(54, 42, 81, 0.06);
}

.lesson-page.dark .theory-card {
  border-color: #2d2738;
  background: #17131f;
}

.theory-icon {
  width: 42px;
  height: 42px;

  margin-bottom: 18px;

  border-radius: 13px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #eeeaff;

  color: #6245d8;
}

.lesson-page.dark .theory-icon {
  background: rgba(124, 92, 252, 0.14);
  color: #b7a8ff;
}

.theory-card h3 {
  margin: 0 0 9px;

  font-size: 16px;
  font-weight: 900;
}

.theory-card p {
  margin: 0;

  color: #756d81;

  font-size: 13px;
  line-height: 1.7;
}

.lesson-page.dark .theory-card p {
  color: #aaa1b4;
}

/* =========================================================
   QUESTIONS
   ========================================================= */

.question-card {
  padding: 30px;

  border: 1px solid #e4deed;
  border-radius: 22px;

  background: #ffffff;

  box-shadow:
    0 15px 40px rgba(54, 42, 81, 0.07);
}

.lesson-page.dark .question-card {
  border-color: #2d2738;
  background: #17131f;
}

.question-top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  color: #7c5cfc;

  font-size: 12px;
  font-weight: 850;
}

.question-card h3 {
  margin:
    25px 0
    22px;

  font-size: 21px;
  line-height: 1.45;
}

.answer-list {
  display: flex;
  flex-direction: column;

  gap: 11px;
}

.answer-option {
  width: 100%;

  min-height: 58px;

  padding: 10px 15px;

  border: 1px solid #ddd7e7;
  border-radius: 14px;

  display: flex;
  align-items: center;

  gap: 12px;

  background: #ffffff;

  color: #342d3d;

  text-align: left;

  cursor: pointer;

  font-size: 14px;
  font-weight: 650;

  transition:
    border 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.lesson-page.dark .answer-option {
  border-color: #393244;
  background: #1d1827;
  color: #eee9f5;
}

.answer-option:hover {
  border-color: #a293ee;
  transform: translateX(2px);
}

.answer-option.selected {
  border-color: #7c5cfc;

  background: #f0edff;

  color: #4c37ae;
}

.lesson-page.dark .answer-option.selected {
  background: rgba(124, 92, 252, 0.15);
  color: #c4baff;
}

.answer-letter {
  width: 30px;
  height: 30px;

  flex-shrink: 0;

  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #eeeaff;

  color: #6245d8;

  font-size: 12px;
  font-weight: 900;
}

.lesson-page.dark .answer-letter {
  background: rgba(124, 92, 252, 0.16);
  color: #c1b5ff;
}

.primary-action {
  margin-top: 24px;

  min-height: 48px;

  padding: 0 20px;

  border: none;
  border-radius: 13px;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 8px;

  background:
    linear-gradient(
      135deg,
      #7c5cfc,
      #6245d8
    );

  color: #ffffff;

  cursor: pointer;

  font-size: 13px;
  font-weight: 850;

  box-shadow:
    0 9px 24px rgba(98, 69, 216, 0.24);
}

.primary-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.success-card {
  padding: 22px 25px;

  border: 1px solid #d9d0ff;
  border-radius: 18px;

  display: flex;
  align-items: center;

  gap: 15px;

  background: #f5f2ff;
}

.lesson-page.dark .success-card {
  border-color: #403568;
  background: rgba(124, 92, 252, 0.1);
}

.success-icon {
  width: 44px;
  height: 44px;

  flex-shrink: 0;

  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #7c5cfc;

  color: #ffffff;
}

.success-card h3 {
  margin: 0 0 4px;

  font-size: 15px;
}

.success-card p {
  margin: 0;

  color: #746b81;

  font-size: 13px;
}

/* =========================================================
   PRACTICE CHOICE
   ========================================================= */

.practice-choice-grid {
  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 18px;
}

.practice-choice {
  min-height: 240px;

  padding: 28px;

  border: 1px solid #e2ddec;
  border-radius: 22px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  background: #ffffff;

  color: inherit;

  text-align: left;

  cursor: pointer;

  box-shadow:
    0 14px 38px rgba(54, 42, 81, 0.06);

  transition:
    transform 0.2s ease,
    border 0.2s ease,
    box-shadow 0.2s ease;
}

.practice-choice:hover {
  transform: translateY(-4px);

  border-color: #a395ed;

  box-shadow:
    0 20px 45px rgba(54, 42, 81, 0.1);
}

.lesson-page.dark .practice-choice {
  border-color: #302a3c;
  background: #17131f;
}

.practice-choice-icon {
  width: 52px;
  height: 52px;

  margin-bottom: 20px;

  border-radius: 15px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #eeeaff;

  color: #6245d8;
}

.lesson-page.dark .practice-choice-icon {
  background: rgba(124, 92, 252, 0.15);
  color: #b9adff;
}

.practice-choice h3 {
  margin: 0 0 8px;

  font-size: 19px;
}

.practice-choice p {
  margin: 0;

  color: #776f82;

  font-size: 13px;
  line-height: 1.65;
}

.practice-choice span {
  margin-top: auto;
  padding-top: 20px;

  display: flex;
  align-items: center;
  gap: 6px;

  color: #6245d8;

  font-size: 12px;
  font-weight: 850;
}

/* =========================================================
   LOCKED PRACTICE
   ========================================================= */

.locked-practice-card {
  min-height: 200px;

  border: 1px dashed #cfc6dc;
  border-radius: 22px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  text-align: center;

  color: #887e92;
}

.lesson-page.dark .locked-practice-card {
  border-color: #3a3246;
}

.locked-practice-card svg {
  color: #8b80a0;
  margin-bottom: 12px;
}

.locked-practice-card h3 {
  margin: 0 0 7px;
}

.locked-practice-card p {
  max-width: 450px;

  margin: 0;

  font-size: 13px;
  line-height: 1.6;
}

/* =========================================================
   PRACTICE PANEL
   ========================================================= */

.practice-panel {
  padding: 28px;

  border: 1px solid #e2ddec;
  border-radius: 22px;

  background: #ffffff;

  box-shadow:
    0 15px 42px rgba(54, 42, 81, 0.07);
}

.lesson-page.dark .practice-panel {
  border-color: #302a3c;
  background: #17131f;
}

.practice-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 25px;
}

.practice-panel-header span {
  color: #7c5cfc;

  font-size: 10px;
  font-weight: 900;

  letter-spacing: 1.3px;
}

.practice-panel-header h3 {
  margin: 5px 0 0;

  font-size: 20px;
}

.reset-practice {
  min-height: 38px;

  padding: 0 12px;

  border: 1px solid #ded7e7;
  border-radius: 10px;

  display: flex;
  align-items: center;
  gap: 6px;

  background: transparent;

  color: #766d80;

  cursor: pointer;

  font-size: 11px;
  font-weight: 750;
}

.lesson-page.dark .reset-practice {
  border-color: #3a3345;
  color: #aaa1b2;
}

/* =========================================================
   LIVE PITCH
   ========================================================= */

.live-pitch-area {
  padding: 28px;

  border-radius: 18px;

  background:
    radial-gradient(
      circle at 50% 20%,
      rgba(124, 92, 252, 0.13),
      transparent 55%
    ),
    #f7f5fc;
}

.lesson-page.dark .live-pitch-area {
  background:
    radial-gradient(
      circle at 50% 20%,
      rgba(124, 92, 252, 0.13),
      transparent 55%
    ),
    #100d17;
}

.pitch-target {
  display: flex;
  align-items: center;
  justify-content: center;

  gap: 8px;

  flex-wrap: wrap;

  color: #6f667a;

  font-size: 12px;
}

.pitch-target svg {
  color: #7c5cfc;
}

.pitch-target strong {
  width: 100%;

  text-align: center;

  color: #30283c;

  font-size: 17px;
}

.lesson-page.dark .pitch-target strong {
  color: #f1edf7;
}

.pitch-tracker {
  margin: 35px 0 20px;
}

.pitch-line {
  position: relative;

  width: 100%;
  height: 6px;

  border-radius: 999px;

  background:
    linear-gradient(
      90deg,
      #c7bce9,
      #7c5cfc,
      #c7bce9
    );
}

.pitch-marker {
  position: absolute;

  left: 50%;
  top: 50%;

  transform: translate(
    -50%,
    -50%
  );

  width: 48px;
  height: 48px;

  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #7c5cfc;

  color: #ffffff;

  font-size: 20px;

  box-shadow:
    0 7px 22px rgba(98, 69, 216, 0.3);
}

.pitch-labels {
  margin-top: 18px;

  display: flex;
  justify-content: space-between;

  color: #8a8095;

  font-size: 11px;
  font-weight: 750;
}

.pitch-feedback {
  color: #6245d8;
  font-weight: 900;
}

.live-feedback {
  margin-top: 25px;

  padding: 14px 17px;

  border-radius: 12px;

  background: rgba(124, 92, 252, 0.09);

  color: #5d536b;

  text-align: center;

  font-size: 12px;
  font-weight: 700;
}

.lesson-page.dark .live-feedback {
  color: #bdb4c8;
}

.recording-controls {
  margin-top: 25px;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 20px;
}

.recording-timer {
  min-width: 75px;

  display: flex;
  align-items: center;
  gap: 8px;

  color: #4d4558;

  font-size: 14px;
  font-weight: 850;
}

.lesson-page.dark .recording-timer {
  color: #e8e2ed;
}

.recording-dot {
  width: 9px;
  height: 9px;

  border-radius: 50%;

  background: #bcb5c5;
}

.recording-dot.active {
  background: #d74d68;

  box-shadow:
    0 0 0 5px rgba(215, 77, 104, 0.12);
}

.record-button,
.stop-record-button {
  min-height: 48px;

  padding: 0 22px;

  border: none;
  border-radius: 13px;

  display: flex;
  align-items: center;
  gap: 8px;

  color: #ffffff;

  cursor: pointer;

  font-size: 13px;
  font-weight: 850;
}

.record-button {
  background:
    linear-gradient(
      135deg,
      #7c5cfc,
      #6245d8
    );
}

.stop-record-button {
  background: #332d3b;
}

.stop-record-button span {
  width: 10px;
  height: 10px;

  border-radius: 2px;

  background: #ffffff;
}

.analyze-button {
  width: 100%;
}

/* =========================================================
   UPLOAD
   ========================================================= */

.upload-area {
  min-height: 260px;

  border: 2px dashed #d7cee5;
  border-radius: 18px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  text-align: center;

  cursor: pointer;

  color: #776d83;
}

.lesson-page.dark .upload-area {
  border-color: #3a3246;
}

.upload-area svg {
  color: #7c5cfc;

  margin-bottom: 15px;
}

.upload-area h3 {
  margin: 0 0 7px;

  color: #332c3c;

  font-size: 18px;
}

.lesson-page.dark .upload-area h3 {
  color: #f2edf7;
}

.upload-area p {
  margin: 0 0 18px;

  font-size: 13px;
}

.upload-area > span {
  padding: 10px 17px;

  border-radius: 10px;

  background: #eeeaff;

  color: #6245d8;

  font-size: 12px;
  font-weight: 850;
}

.uploaded-file {
  min-height: 85px;

  padding: 15px 18px;

  border: 1px solid #ddd5e8;
  border-radius: 15px;

  display: flex;
  align-items: center;

  gap: 14px;
}

.lesson-page.dark .uploaded-file {
  border-color: #3b3346;
}

.uploaded-file-icon {
  width: 45px;
  height: 45px;

  flex-shrink: 0;

  border-radius: 12px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #eeeaff;

  color: #6245d8;
}

.uploaded-file > div:nth-child(2) {
  flex: 1;

  display: flex;
  flex-direction: column;

  gap: 4px;

  min-width: 0;
}

.uploaded-file strong {
  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;

  font-size: 13px;
}

.uploaded-file span {
  color: #827889;

  font-size: 11px;
}

/* =========================================================
   ANALYSIS
   ========================================================= */

.analysis-card {
  padding: 30px;

  border: 1px solid #e2ddec;
  border-radius: 22px;

  background: #ffffff;

  box-shadow:
    0 15px 42px rgba(54, 42, 81, 0.07);
}

.lesson-page.dark .analysis-card {
  border-color: #302a3c;
  background: #17131f;
}

.analysis-score {
  display: flex;
  align-items: center;

  gap: 20px;

  padding-bottom: 25px;

  border-bottom: 1px solid #ebe6f0;
}

.lesson-page.dark .analysis-score {
  border-bottom-color: #302a3c;
}

.score-circle {
  width: 100px;
  height: 100px;

  flex-shrink: 0;

  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  background:
    radial-gradient(
      circle,
      #ffffff 58%,
      transparent 60%
    ),
    conic-gradient(
      #7c5cfc 82%,
      #e4deef 0
    );

  color: #6245d8;
}

.lesson-page.dark .score-circle {
  background:
    radial-gradient(
      circle,
      #17131f 58%,
      transparent 60%
    ),
    conic-gradient(
      #7c5cfc 82%,
      #332d3d 0
    );
}

.score-circle strong {
  font-size: 27px;
  line-height: 1;
}

.score-circle span {
  font-size: 10px;
  font-weight: 750;
}

.analysis-score h3 {
  margin: 0 0 5px;

  font-size: 21px;
}

.analysis-score p {
  margin: 0;

  color: #796f84;

  font-size: 13px;
  line-height: 1.6;
}

.analysis-metrics {
  margin:
    25px 0;

  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 12px;
}

.metric-card {
  padding: 17px;

  border-radius: 14px;

  background: #f6f3fa;

  display: flex;
  flex-direction: column;

  gap: 7px;
}

.lesson-page.dark .metric-card {
  background: #211c2a;
}

.metric-card span {
  color: #81778b;

  font-size: 10px;
  font-weight: 750;
}

.metric-card strong {
  color: #6245d8;

  font-size: 19px;
}

.pitch-comparison {
  padding: 22px;

  border-radius: 17px;

  background: #f7f5fc;
}

.lesson-page.dark .pitch-comparison {
  background: #100d17;
}

.comparison-header {
  display: flex;
  justify-content: space-between;

  color: #756c80;

  font-size: 11px;
  font-weight: 750;
}

.comparison-header > div {
  display: flex;
  align-items: center;
  gap: 7px;
}

.reference-dot,
.user-dot {
  width: 8px;
  height: 8px;

  border-radius: 50%;
}

.reference-dot {
  background: #7c5cfc;
}

.user-dot {
  background: #b7a8ff;
}

.pitch-chart {
  position: relative;

  height: 180px;

  margin: 20px 0;

  border-bottom: 1px solid #d9d2e2;

  overflow: hidden;
}

.lesson-page.dark .pitch-chart {
  border-bottom-color: #342d40;
}

.pitch-chart::before,
.pitch-chart::after {
  content: "";

  position: absolute;

  left: 0;
  right: 0;

  border-top: 1px dashed #ddd6e7;
}

.pitch-chart::before {
  top: 33%;
}

.pitch-chart::after {
  top: 66%;
}

.reference-wave,
.user-wave {
  position: absolute;

  left: 0;
  right: 0;

  height: 3px;

  display: flex;
  align-items: center;
  justify-content: space-around;
}

.reference-wave {
  top: 45%;
}

.user-wave {
  top: 51%;
}

.reference-wave span,
.user-wave span {
  width: 9px;
  height: 9px;

  border-radius: 50%;
}

.reference-wave span {
  background: #7c5cfc;
}

.user-wave span {
  background: #b7a8ff;
}

.reference-wave span:nth-child(2) {
  transform: translateY(-8px);
}

.reference-wave span:nth-child(3) {
  transform: translateY(-13px);
}

.reference-wave span:nth-child(4) {
  transform: translateY(-4px);
}

.reference-wave span:nth-child(5) {
  transform: translateY(4px);
}

.reference-wave span:nth-child(6) {
  transform: translateY(9px);
}

.reference-wave span:nth-child(7) {
  transform: translateY(3px);
}

.reference-wave span:nth-child(8) {
  transform: translateY(-6px);
}

.reference-wave span:nth-child(9) {
  transform: translateY(-11px);
}

.reference-wave span:nth-child(10) {
  transform: translateY(-4px);
}

.reference-wave span:nth-child(11) {
  transform: translateY(4px);
}

.user-wave span:nth-child(2) {
  transform: translateY(-4px);
}

.user-wave span:nth-child(3) {
  transform: translateY(-8px);
}

.user-wave span:nth-child(4) {
  transform: translateY(1px);
}

.user-wave span:nth-child(5) {
  transform: translateY(8px);
}

.user-wave span:nth-child(6) {
  transform: translateY(12px);
}

.user-wave span:nth-child(7) {
  transform: translateY(7px);
}

.user-wave span:nth-child(8) {
  transform: translateY(-2px);
}

.user-wave span:nth-child(9) {
  transform: translateY(-7px);
}

.user-wave span:nth-child(10) {
  transform: translateY(-1px);
}

.user-wave span:nth-child(11) {
  transform: translateY(7px);
}

.comparison-labels {
  display: flex;
  align-items: center;
  justify-content: space-between;

  color: #8a8192;

  font-size: 10px;
}

.theoretical-feedback {
  margin-top: 22px;

  padding: 18px;

  border-radius: 15px;

  display: flex;

  gap: 13px;

  background: #f2efff;
}

.lesson-page.dark .theoretical-feedback {
  background: rgba(124, 92, 252, 0.1);
}

.feedback-icon {
  width: 42px;
  height: 42px;

  flex-shrink: 0;

  border-radius: 12px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #7c5cfc;

  color: #ffffff;
}

.theoretical-feedback h3 {
  margin: 1px 0 5px;

  font-size: 15px;
}

.theoretical-feedback p {
  margin: 0;

  color: #6f667a;

  font-size: 12px;
  line-height: 1.7;
}

/* =========================================================
   COMPLETION
   ========================================================= */

.lesson-completion-section {
  padding: 45px 25px;

  border-radius: 25px;

  background:
    radial-gradient(
      circle at 50% 0%,
      rgba(124, 92, 252, 0.15),
      transparent 55%
    );

  text-align: center;
}

.completion-lock {
  width: 64px;
  height: 64px;

  margin: 0 auto 18px;

  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background:
    linear-gradient(
      135deg,
      #7c5cfc,
      #6245d8
    );

  color: #ffffff;

  box-shadow:
    0 10px 28px rgba(98, 69, 216, 0.28);
}

.lesson-completion-section h2 {
  margin: 0 0 9px;

  font-size: 25px;
}

.lesson-completion-section > p {
  max-width: 550px;

  margin:
    0 auto
    22px;

  color: #766d81;

  font-size: 13px;
  line-height: 1.7;
}

.complete-lesson-button {
  min-height: 50px;

  padding: 0 22px;

  border: none;
  border-radius: 13px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  gap: 8px;

  background:
    linear-gradient(
      135deg,
      #7c5cfc,
      #6245d8
    );

  color: #ffffff;

  cursor: pointer;

  font-size: 13px;
  font-weight: 850;

  box-shadow:
    0 10px 27px rgba(98, 69, 216, 0.25);
}

.completed-celebration {
  width: 75px;
  height: 75px;

  margin: 0 auto 18px;

  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background:
    linear-gradient(
      135deg,
      #7c5cfc,
      #6245d8
    );

  color: #ffffff;

  box-shadow:
    0 12px 35px rgba(98, 69, 216, 0.3);

  animation:
    completionPulse 2s ease-in-out infinite;
}

.lesson-completed h2 {
  margin-bottom: 10px;
}

.lesson-completed p {
  max-width: 550px;

  margin:
    0 auto
    22px;

  color: #756c80;

  font-size: 13px;
  line-height: 1.7;
}

@keyframes completionPulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.06);
  }
}

/* =========================================================
   RESPONSIVE
   ========================================================= */

@media (max-width: 800px) {
  .lesson-header {
    grid-template-columns: auto 1fr;

    padding: 0 18px;
  }

  .lesson-header-progress {
    display: none;
  }

  .lesson-header-title {
    align-items: flex-end;
    text-align: right;
  }

  .theory-grid {
    grid-template-columns: 1fr;
  }

  .analysis-metrics {
    grid-template-columns:
      repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .lesson-content {
    width: min(
      100% - 24px,
      1000px
    );

    padding-top: 40px;
  }

  .lesson-header {
    min-height: 65px;
  }

  .lesson-back-button span {
    display: none;
  }

  .lesson-header-title strong {
    font-size: 13px;
  }

  .lesson-intro h1 {
    font-size: 35px;
  }

  .lesson-intro p {
    font-size: 14px;
  }

  .practice-choice-grid {
    grid-template-columns: 1fr;
  }

  .question-card,
  .practice-panel,
  .analysis-card {
    padding: 20px;
  }

  .analysis-score {
    align-items: flex-start;
  }

  .score-circle {
    width: 80px;
    height: 80px;
  }

  .recording-controls {
    flex-direction: column;
  }

  .recording-timer {
    justify-content: center;
  }

  .upload-area {
    padding: 25px;
  }
}
```

### Step 3 — Update `App.jsx`

Keep everything you already have and add the Lesson import + route.

```jsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Home from "./pages/Home";
import Music from "./pages/Music";
import LearnFromScratch from "./pages/LearnFromScratch";
import Lesson from "./pages/Lesson";
import MartialArts from "./pages/MartialArts";
import Boxing from "./pages/Boxing";
import Karate from "./pages/Karate";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/music"
          element={<Music />}
        />

        <Route
          path="/music/learn"
          element={<LearnFromScratch />}
        />

        <Route
          path="/music/learn/lesson/:lessonId"
          element={<Lesson />}
        />

        <Route
          path="/martial-arts"
          element={<MartialArts />}
        />

        <Route
          path="/martial-arts/boxing"
          element={<Boxing />}
        />

        <Route
          path="/martial-arts/karate"
          element={<Karate />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
