import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Play,
  Square,
  Upload,
  Mic,
  CheckCircle2,
  Lock,
  RotateCcw,
  Sparkles,
  ChevronRight,
} from "lucide-react";

import {
  completeLesson,
  completeNextLesson,
  isLessonCompleted,
} from "../utils/progress";

import "./Lesson.css";

/* =========================================================
   LESSON DATA
   ========================================================= */

const LESSONS = [
  {
    id: "1",
    title: "Understanding Your Voice",
    description:
      "Discover how your voice is produced and learn the foundation of controlled singing.",

    theory: [
      "Your voice is produced when air from your lungs passes through your vocal folds.",
      "Good singing begins with controlled breathing and relaxed vocal production.",
      "During your performance, SkillSensAI will analyze your pitch, stability and accuracy.",
    ],

    question: {
      text:
        "Which of these is important for producing a controlled singing voice?",
      options: [
        "Controlled breathing",
        "Singing as loudly as possible",
        "Holding your breath",
      ],
      answer: 0,
    },
  },

  {
    id: "2",
    title: "Breathing & Voice Control",
    description:
      "Learn how breathing supports your voice and how to maintain better control.",

    theory: [
      "Breathing provides the airflow needed to produce sound.",
      "A controlled breath helps you maintain a steady voice.",
      "Avoid forcing the voice. Relaxation and controlled airflow are important.",
    ],

    question: {
      text:
        "What helps you maintain a steady singing voice?",
      options: [
        "Controlled airflow",
        "Holding your breath",
        "Shouting",
      ],
      answer: 0,
    },
  },

  {
    id: "3",
    title: "Finding Your Pitch",
    description:
      "Learn what pitch is and begin identifying whether your voice is high or low.",

    theory: [
      "Pitch describes how high or low a sound is.",
      "Different vocal notes correspond to different frequencies.",
      "SkillSensAI compares your detected pitch against the lesson reference.",
    ],

    question: {
      text:
        "Pitch mainly describes what property of a sound?",
      options: [
        "How high or low it sounds",
        "How loud it sounds",
        "How long it lasts",
      ],
      answer: 0,
    },
  },

  {
    id: "4",
    title: "Singing Basic Notes",
    description:
      "Practice basic notes and begin improving your ability to match a target pitch.",

    theory: [
      "A note represents a specific musical pitch.",
      "Pitch matching means trying to reproduce the same pitch as the reference.",
      "Small corrections can improve your accuracy significantly.",
    ],

    question: {
      text:
        "What does pitch matching mean?",
      options: [
        "Reproducing the target pitch",
        "Singing louder than the reference",
        "Singing faster than the reference",
      ],
      answer: 0,
    },
  },

  {
    id: "5",
    title: "Pitch Stability & Accuracy",
    description:
      "Learn how to keep your pitch steady and improve accuracy while singing.",

    theory: [
      "Pitch stability means maintaining a note without unwanted fluctuations.",
      "Accuracy improves when you listen carefully and make small corrections.",
      "The AI analysis measures both pitch accuracy and stability.",
    ],

    question: {
      text:
        "What does pitch stability mean?",
      options: [
        "Maintaining a steady pitch",
        "Changing notes constantly",
        "Singing as loudly as possible",
      ],
      answer: 0,
    },
  },

  {
    id: "6",
    title: "Your First Complete Performance",
    description:
      "Bring everything together and perform the complete lesson.",

    theory: [
      "A complete performance combines breathing, pitch, control and stability.",
      "Focus on the complete lesson instead of individual notes only.",
      "Your final performance is analyzed to give you an overall assessment.",
    ],

    question: {
      text:
        "What should you focus on during your complete performance?",
      options: [
        "Combining the skills you learned",
        "Only singing loudly",
        "Ignoring pitch",
      ],
      answer: 0,
    },
  },
];

/* =========================================================
   API
   ========================================================= */

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

/* =========================================================
   HELPERS
   ========================================================= */

function clamp(value, min, max) {
  return Math.min(
    Math.max(value, min),
    max
  );
}

function getPitchGuidance(
  pitch,
  referencePitch
) {
  if (!pitch) {
    return {
      text: "Sing a note...",
      className: "waiting",
    };
  }

  if (!referencePitch) {
    return {
      text: "Listening...",
      className: "listening",
    };
  }

  const difference =
    pitch - referencePitch;

  if (Math.abs(difference) < 15) {
    return {
      text: "Perfect match ✓",
      className: "perfect",
    };
  }

  if (difference > 35) {
    return {
      text: "Too high ↑",
      className: "high",
    };
  }

  if (difference > 15) {
    return {
      text: "Slightly high ↑",
      className: "high",
    };
  }

  if (difference < -35) {
    return {
      text: "Too low ↓",
      className: "low",
    };
  }

  return {
    text: "Slightly low ↓",
    className: "low",
  };
}

/* =========================================================
   COMPONENT
   ========================================================= */

function Lesson() {
  const navigate = useNavigate();
  const { lessonId } = useParams();

  const lesson =
    LESSONS.find(
      (item) => item.id === lessonId
    );

  /* =======================================================
     STATE
  ======================================================= */

  /*
    lessonStep:

    1 = Learn + Theory
    2 = Questions
    3 = Performance
    4 = Results
  */

  const [lessonStep, setLessonStep] =
    useState(1);

  const [selectedAnswer, setSelectedAnswer] =
    useState(null);

  const [answerChecked, setAnswerChecked] =
    useState(false);

  const [recording, setRecording] =
    useState(false);

  const [recordedBlob, setRecordedBlob] =
    useState(null);

  const [recordedUrl, setRecordedUrl] =
    useState("");

  const [uploadedFile, setUploadedFile] =
    useState(null);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [analysis, setAnalysis] =
    useState(null);

  const [analysisError, setAnalysisError] =
    useState("");

  const [recordingSeconds, setRecordingSeconds] =
    useState(0);

  const [livePitch, setLivePitch] =
    useState(null);

  const [liveReferencePitch, setLiveReferencePitch] =
    useState(null);

  const [pitchHistory, setPitchHistory] =
    useState([]);

  const [performanceMode, setPerformanceMode] =
    useState(null);

  const [completed, setCompleted] =
    useState(false);

  const [theme, setTheme] =
    useState(
      localStorage.getItem(
        "skillsensai_theme"
      ) || "light"
    );

  /* =======================================================
     REFS
  ======================================================= */

  const mediaRecorderRef =
    useRef(null);

  const mediaStreamRef =
    useRef(null);

  const audioContextRef =
    useRef(null);

  const analyserRef =
    useRef(null);

  const animationFrameRef =
    useRef(null);

  const chunksRef =
    useRef([]);

  const recordingStartRef =
    useRef(null);

  const timerRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  /* =======================================================
     THEME
  ======================================================= */

  useEffect(() => {
    const updateTheme = () => {
      setTheme(
        localStorage.getItem(
          "skillsensai_theme"
        ) || "light"
      );
    };

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
     LOAD COMPLETION STATE
  ======================================================= */

  useEffect(() => {
    if (!lesson) {
      return;
    }

    const lessonCompleted =
      isLessonCompleted(
        `music-${lesson.id}`
      );

    setCompleted(
      lessonCompleted
    );

    /*
      If the lesson is already completed,
      immediately show the results/completion
      state when the user returns to it.
    */
    if (lessonCompleted) {
      setLessonStep(4);
    } else {
      setLessonStep(1);
    }

    setSelectedAnswer(null);
    setAnswerChecked(false);
    setAnalysis(null);
    setAnalysisError("");
    setPerformanceMode(null);
    setRecordedBlob(null);
    setUploadedFile(null);
    setRecordingSeconds(0);
    setLivePitch(null);
    setLiveReferencePitch(null);
    setPitchHistory([]);
  }, [lessonId, lesson]);

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      stopRecordingCleanup();

      if (recordedUrl) {
        URL.revokeObjectURL(
          recordedUrl
        );
      }
    };
  }, [recordedUrl]);

  /* =======================================================
     INVALID LESSON
  ======================================================= */

  if (!lesson) {
    return (
      <div
        className={`lesson-page ${theme}`}
      >
        <div className="lesson-error">
          <h1>
            Lesson Not Found
          </h1>

          <p>
            The lesson you are trying to open
            does not exist.
          </p>

          <button
            onClick={() =>
              navigate(
                "/music/learn"
              )
            }
          >
            Back to Learn From Scratch
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     VIDEO
  ======================================================= */

  const videoPath =
    `/music/lessons/lesson-${lesson.id}.mp4`;

  /* =======================================================
     LIVE PITCH DETECTION
  ======================================================= */

  const detectPitch = (
    buffer,
    sampleRate
  ) => {
    const SIZE =
      buffer.length;

    let rms = 0;

    for (
      let i = 0;
      i < SIZE;
      i++
    ) {
      rms +=
        buffer[i] *
        buffer[i];
    }

    rms =
      Math.sqrt(
        rms / SIZE
      );

    if (rms < 0.012) {
      return null;
    }

    let bestOffset = -1;
    let bestCorrelation = 0;

    for (
      let offset = 20;
      offset < 1000;
      offset++
    ) {
      let correlation = 0;

      for (
        let i = 0;
        i < SIZE - offset;
        i += 2
      ) {
        correlation +=
          Math.abs(
            buffer[i] -
              buffer[i + offset]
          );
      }

      correlation =
        1 -
        correlation /
          (SIZE - offset);

      if (
        correlation >
        bestCorrelation
      ) {
        bestCorrelation =
          correlation;

        bestOffset =
          offset;
      }
    }

    if (
      bestOffset === -1 ||
      bestCorrelation < 0.45
    ) {
      return null;
    }

    const frequency =
      sampleRate /
      bestOffset;

    if (
      frequency < 70 ||
      frequency > 1000
    ) {
      return null;
    }

    return frequency;
  };

  const startLivePitchTracking =
    async (stream) => {
      try {
        const AudioContext =
          window.AudioContext ||
          window.webkitAudioContext;

        const audioContext =
          new AudioContext();

        audioContextRef.current =
          audioContext;

        const source =
          audioContext.createMediaStreamSource(
            stream
          );

        const analyser =
          audioContext.createAnalyser();

        analyser.fftSize =
          2048;

        analyser.smoothingTimeConstant =
          0.65;

        source.connect(
          analyser
        );

        analyserRef.current =
          analyser;

        const buffer =
          new Float32Array(
            analyser.fftSize
          );

        const updatePitch =
          () => {
            if (
              !analyserRef.current ||
              !recordingStartRef.current
            ) {
              return;
            }

            analyser.getFloatTimeDomainData(
              buffer
            );

            const pitch =
              detectPitch(
                buffer,
                audioContext.sampleRate
              );

            if (pitch) {
              setLivePitch(
                pitch
              );

              setPitchHistory(
                (previous) => [
                  ...previous.slice(
                    -99
                  ),
                  pitch,
                ]
              );
            }

            animationFrameRef.current =
              requestAnimationFrame(
                updatePitch
              );
          };

        updatePitch();
      } catch (error) {
        console.error(
          "Live pitch tracking error:",
          error
        );
      }
    };

  /* =======================================================
     RECORDING TIMER
  ======================================================= */

  const startTimer = () => {
    recordingStartRef.current =
      Date.now();

    setRecordingSeconds(0);

    timerRef.current =
      setInterval(() => {
        const elapsed =
          Math.floor(
            (Date.now() -
              recordingStartRef.current) /
              1000
          );

        setRecordingSeconds(
          elapsed
        );
      }, 250);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(
        timerRef.current
      );

      timerRef.current =
        null;
    }

    recordingStartRef.current =
      null;
  };

  /* =======================================================
     START RECORDING
  ======================================================= */

  const startRecording =
    async () => {
      try {
        setAnalysis(null);
        setAnalysisError("");
        setRecordedBlob(null);
        setUploadedFile(null);
        setPerformanceMode(
          "live"
        );
        setPitchHistory([]);
        setLivePitch(null);
        setLiveReferencePitch(
          null
        );

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        mediaStreamRef.current =
          stream;

        chunksRef.current =
          [];

        const recorder =
          new MediaRecorder(
            stream
          );

        mediaRecorderRef.current =
          recorder;

        recorder.ondataavailable =
          (event) => {
            if (
              event.data &&
              event.data.size > 0
            ) {
              chunksRef.current.push(
                event.data
              );
            }
          };

        recorder.onstop = () => {
          const blob =
            new Blob(
              chunksRef.current,
              {
                type:
                  recorder.mimeType ||
                  "audio/webm",
              }
            );

          setRecordedBlob(
            blob
          );

          const url =
            URL.createObjectURL(
              blob
            );

          setRecordedUrl(
            url
          );

          stopRecordingCleanup();
        };

        recorder.start(250);

        setRecording(true);

        setLessonStep(3);

        startTimer();

        startLivePitchTracking(
          stream
        );
      } catch (error) {
        console.error(
          error
        );

        setAnalysisError(
          "Microphone permission was not granted. Please allow microphone access and try again."
        );
      }
    };

  /* =======================================================
     STOP RECORDING
  ======================================================= */

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current
        .state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setRecording(false);

    stopTimer();

    if (
      animationFrameRef.current
    ) {
      cancelAnimationFrame(
        animationFrameRef.current
      );

      animationFrameRef.current =
        null;
    }

    if (
      mediaStreamRef.current
    ) {
      mediaStreamRef.current
        .getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

      mediaStreamRef.current =
        null;
    }

    if (
      audioContextRef.current
    ) {
      audioContextRef.current
        .close()
        .catch(() => {});

      audioContextRef.current =
        null;
    }
  };

  const stopRecordingCleanup =
    () => {
      setRecording(false);

      stopTimer();

      if (
        animationFrameRef.current
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current =
          null;
      }

      if (
        mediaStreamRef.current
      ) {
        mediaStreamRef.current
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        mediaStreamRef.current =
          null;
      }

      if (
        audioContextRef.current
      ) {
        audioContextRef.current
          .close()
          .catch(() => {});

        audioContextRef.current =
          null;
      }
    };

  /* =======================================================
     FILE SELECTION
  ======================================================= */

  const handleFileChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadedFile(file);
    setRecordedBlob(null);
    setAnalysis(null);
    setAnalysisError("");
    setPerformanceMode(
      "upload"
    );
    setLessonStep(3);

    if (recordedUrl) {
      URL.revokeObjectURL(
        recordedUrl
      );

      setRecordedUrl("");
    }
  };

  /* =======================================================
     ANALYZE RECORDING
  ======================================================= */

  const analyzeAudio =
    async () => {
      const audioFile =
        uploadedFile ||
        recordedBlob;

      if (!audioFile) {
        setAnalysisError(
          "Please record or upload your complete lesson performance first."
        );

        return;
      }

      if (
        !uploadedFile &&
        recordingSeconds < 3
      ) {
        setAnalysisError(
          "Please record the complete lesson. The recording is too short."
        );

        return;
      }

      try {
        setAnalyzing(true);
        setAnalysisError("");
        setAnalysis(null);

        const formData =
          new FormData();

        formData.append(
          "file",
          audioFile,
          uploadedFile
            ? uploadedFile.name
            : `lesson-${lesson.id}-performance.webm`
        );

        const response =
          await fetch(
            `${API_BASE}/analyze-voice`,
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

        const result =
          await response.json();

        setAnalysis(
          result
        );

        setLessonStep(4);
      } catch (error) {
        console.error(
          "Audio analysis failed:",
          error
        );

        setAnalysisError(
          "Unable to analyze your recording. Make sure the SkillSensAI backend is running and try again."
        );
      } finally {
        setAnalyzing(false);
      }
    };

  /* =======================================================
     STEP NAVIGATION
  ======================================================= */

  const goToQuestions =
    () => {
      setLessonStep(2);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  const goToPerformance =
    () => {
      if (
        !answerChecked ||
        selectedAnswer !==
          lesson.question.answer
      ) {
        return;
      }

      setLessonStep(3);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  /* =======================================================
     COMPLETE LESSON
  ======================================================= */

  const handleCompleteLesson =
    () => {
      if (
        !analysis ||
        !answerChecked ||
        selectedAnswer !==
          lesson.question.answer
      ) {
        return;
      }

      const lessonKey =
        `music-${lesson.id}`;

      const alreadyCompleted =
        isLessonCompleted(
          lessonKey
        );

      /*
        IMPORTANT:

        completedLessons stores which lesson
        was completed.

        music_lessons_completed stores the
        numeric progress used by the Music
        Room character.

        We update BOTH systems together.
      */

      if (!alreadyCompleted) {
        completeLesson(
          lessonKey
        );

        /*
          Lesson 1:
          0 → 1

          Lesson 2:
          1 → 2

          ...

          Lesson 6:
          5 → 6
        */
        completeNextLesson();
      }

      setCompleted(true);

      setLessonStep(4);

      window.dispatchEvent(
        new Event(
          "skillsensai-progress-updated"
        )
      );

      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    };

  /* =======================================================
     RETRY
  ======================================================= */

  const resetPerformance =
    () => {
      stopRecordingCleanup();

      setRecordedBlob(null);
      setUploadedFile(null);
      setAnalysis(null);
      setAnalysisError("");
      setPerformanceMode(null);
      setRecordingSeconds(0);
      setLivePitch(null);
      setPitchHistory([]);

      if (recordedUrl) {
        URL.revokeObjectURL(
          recordedUrl
        );

        setRecordedUrl("");
      }

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }

      setLessonStep(3);
    };

  /* =======================================================
     NEXT LESSON
  ======================================================= */

  const goToNextLesson =
    () => {
      const nextId =
        Number(lesson.id) + 1;

      if (nextId <= 6) {
        navigate(
          `/music/learn/lesson/${nextId}`
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        navigate(
          "/music/learn"
        );
      }
    };

  /* =======================================================
     LIVE GUIDANCE
  ======================================================= */

  const guidance =
    getPitchGuidance(
      livePitch,
      liveReferencePitch
    );

  /* =======================================================
     STEP INDICATOR
  ======================================================= */

  const stepLabel =
    lessonStep === 1
      ? "Learn"
      : lessonStep === 2
      ? "Questions"
      : lessonStep === 3
      ? "Performance"
      : "Results";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className={`lesson-page ${theme}`}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="lesson-header">

        <button
          className="lesson-back-button"
          onClick={() =>
            navigate(
              "/music/learn"
            )
          }
        >
          <ArrowLeft size={17} />

          Back to Journey
        </button>

        <div className="lesson-header-progress">

          <div className="lesson-header-title">

            <span>
              SKILLSENSAI MUSIC
            </span>

            <strong>
              Lesson {lesson.id} of 6
            </strong>

          </div>

          <div className="lesson-step-indicator">
            Step {lessonStep} · {stepLabel}
          </div>

        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="lesson-container">

        {/* =================================================
            TITLE
        ================================================= */}

        <div className="lesson-intro">

          <div className="lesson-number">
            LESSON {lesson.id}
          </div>

          <h1>
            {lesson.title}
          </h1>

          <p className="lesson-description">
            {lesson.description}
          </p>

        </div>

        {/* =================================================
            STEP 1
        ================================================= */}

        {lessonStep === 1 && (
          <>
            {/* VIDEO */}

            <section className="lesson-card">

              <div className="lesson-section-title">

                <span>🎬</span>

                <div>
                  <h2>
                    Step 1 — Learn
                  </h2>

                  <p>
                    Watch the complete lesson
                    before attempting the
                    performance.
                  </p>
                </div>

              </div>

              <div className="lesson-video">

                <video
                  controls
                  preload="metadata"
                  src={videoPath}
                >
                  Your browser does not support
                  video playback.
                </video>

                <div className="video-note">
                  <Play size={15} />

                  Watch the entire lesson
                  carefully. You will be asked
                  to perform it later.
                </div>

              </div>

            </section>

            {/* THEORY */}

            <section className="lesson-card">

              <div className="lesson-section-title">

                <span>📖</span>

                <div>
                  <h2>
                    Step 2 — Understand
                  </h2>

                  <p>
                    Know what you are practicing
                    before performing it.
                  </p>
                </div>

              </div>

              <div className="theory-content">

                {lesson.theory.map(
                  (point, index) => (
                    <div
                      className="theory-point"
                      key={index}
                    >
                      <span>
                        {index + 1}
                      </span>

                      <p>
                        {point}
                      </p>
                    </div>
                  )
                )}

              </div>

              {/* NEXT */}

              <div className="step-action">

                <button
                  className="step-next-button"
                  onClick={
                    goToQuestions
                  }
                >
                  I've learned this — Next

                  <ChevronRight
                    size={18}
                  />
                </button>

              </div>

            </section>
          </>
        )}

        {/* =================================================
            STEP 2 — QUESTIONS
        ================================================= */}

        {lessonStep === 2 && (
          <section className="lesson-card">

            <div className="lesson-section-title">

              <span>🧠</span>

              <div>
                <h2>
                  Step 3 — Quick Check
                </h2>

                <p>
                  Check your understanding before
                  moving to your full performance.
                </p>
              </div>

            </div>

            <div className="question-box">

              <h3>
                {lesson.question.text}
              </h3>

              <div className="question-options">

                {lesson.question.options.map(
                  (option, index) => (
                    <label
                      key={option}
                      className={
                        selectedAnswer ===
                        index
                          ? "selected"
                          : ""
                      }
                    >

                      <input
                        type="radio"
                        name={`lesson-${lesson.id}`}
                        checked={
                          selectedAnswer ===
                          index
                        }
                        onChange={() => {
                          setSelectedAnswer(
                            index
                          );

                          setAnswerChecked(
                            false
                          );
                        }}
                      />

                      <span>
                        {option}
                      </span>

                    </label>
                  )
                )}

              </div>

              <button
                className="check-answer-button"
                disabled={
                  selectedAnswer ===
                  null
                }
                onClick={() =>
                  setAnswerChecked(
                    true
                  )
                }
              >
                Check Answer
              </button>

              {answerChecked && (
                <div
                  className={
                    selectedAnswer ===
                    lesson.question.answer
                      ? "answer-result correct"
                      : "answer-result incorrect"
                  }
                >
                  {selectedAnswer ===
                  lesson.question.answer
                    ? "✓ Correct! Great understanding."
                    : "✕ Not quite. Review the lesson and select the correct answer."}
                </div>
              )}

              {answerChecked &&
                selectedAnswer ===
                  lesson.question.answer && (
                  <div className="step-action">

                    <button
                      className="step-next-button"
                      onClick={
                        goToPerformance
                      }
                    >
                      Continue to Performance

                      <ChevronRight
                        size={18}
                      />
                    </button>

                  </div>
                )}

            </div>

          </section>
        )}

        {/* =================================================
            STEP 3 — PERFORMANCE
        ================================================= */}

        {lessonStep === 3 && (
          <section className="lesson-card performance-card">

            <div className="lesson-section-title">

              <span>🎤</span>

              <div>
                <h2>
                  Step 4 — Perform the Complete Lesson
                </h2>

                <p>
                  This is mandatory. You must
                  perform the complete lesson,
                  not just a small part of it.
                </p>
              </div>

            </div>

            <div className="performance-rule">

              <Lock size={18} />

              <span>
                Lesson completion is locked until
                your full performance has been
                analyzed.
              </span>

            </div>

            {/* MODE BUTTONS */}

            {!recording &&
              !recordedBlob &&
              !uploadedFile && (
                <div className="performance-options">

                  <button
                    className="performance-option live"
                    onClick={
                      startRecording
                    }
                  >
                    <Mic size={23} />

                    <strong>
                      Record Live
                    </strong>

                    <span>
                      Sing while SkillSensAI
                      tracks your pitch
                      in real time
                    </span>
                  </button>

                  <button
                    className="performance-option upload"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                  >
                    <Upload size={23} />

                    <strong>
                      Upload Voice
                    </strong>

                    <span>
                      Upload your complete
                      lesson recording
                    </span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    hidden
                    onChange={
                      handleFileChange
                    }
                  />

                </div>
              )}

            {/* LIVE RECORDING */}

            {recording && (
              <div className="live-recording-panel">

                <div className="recording-top">

                  <div className="recording-indicator">
                    <span />
                    RECORDING
                  </div>

                  <div className="recording-time">
                    {String(
                      Math.floor(
                        recordingSeconds /
                          60
                      )
                    ).padStart(2, "0")}
                    :
                    {String(
                      recordingSeconds %
                        60
                    ).padStart(2, "0")}
                  </div>

                </div>

                <div
                  className={`live-guidance ${guidance.className}`}
                >
                  {guidance.text}
                </div>

                <div className="pitch-visualizer">

                  <div className="pitch-scale">

                    <span>
                      HIGH ↑
                    </span>

                    <div className="pitch-track">

                      <div className="pitch-center" />

                      {livePitch && (
                        <div
                          className="pitch-dot"
                          style={{
                            top: `${
                              50 -
                              clamp(
                                (
                                  livePitch -
                                  220
                                ) /
                                  4,
                                -42,
                                42
                              )
                            }%`,
                          }}
                        />
                      )}

                    </div>

                    <span>
                      LOW ↓
                    </span>

                  </div>

                </div>

                <div className="live-pitch-number">

                  {livePitch
                    ? `${Math.round(
                        livePitch
                      )} Hz`
                    : "-- Hz"}

                </div>

                <p className="live-instruction">
                  Sing the entire lesson.
                  Watch the pitch indicator
                  and make small corrections
                  when needed.
                </p>

                <button
                  className="stop-recording-button"
                  onClick={
                    stopRecording
                  }
                >
                  <Square size={18} />

                  Stop Recording
                </button>

              </div>
            )}

            {/* RECORDED PERFORMANCE */}

            {!recording &&
              recordedBlob && (
                <div className="recorded-performance">

                  <div className="recorded-success">
                    <CheckCircle2 size={20} />

                    Full recording captured.
                  </div>

                  {recordedUrl && (
                    <audio
                      controls
                      src={recordedUrl}
                    />
                  )}

                  <div className="recorded-actions">

                    <button
                      className="analyze-button"
                      onClick={
                        analyzeAudio
                      }
                      disabled={analyzing}
                    >
                      <Sparkles size={18} />

                      {analyzing
                        ? "Analyzing..."
                        : "Analyze My Performance"}
                    </button>

                    <button
                      className="retry-button"
                      onClick={
                        resetPerformance
                      }
                    >
                      <RotateCcw size={17} />

                      Record Again
                    </button>

                  </div>

                </div>
              )}

            {/* UPLOADED PERFORMANCE */}

            {!recording &&
              uploadedFile && (
                <div className="recorded-performance">

                  <div className="recorded-success">
                    <CheckCircle2 size={20} />

                    <span>
                      {uploadedFile.name}
                    </span>
                  </div>

                  <p className="upload-size">
                    {(
                      uploadedFile.size /
                      (1024 * 1024)
                    ).toFixed(2)}{" "}
                    MB
                  </p>

                  <div className="recorded-actions">

                    <button
                      className="analyze-button"
                      onClick={
                        analyzeAudio
                      }
                      disabled={analyzing}
                    >
                      <Sparkles size={18} />

                      {analyzing
                        ? "Analyzing..."
                        : "Analyze My Performance"}
                    </button>

                    <button
                      className="retry-button"
                      onClick={
                        resetPerformance
                      }
                    >
                      <RotateCcw size={17} />

                      Choose Another
                    </button>

                  </div>

                </div>
              )}

            {analysisError && (
              <div className="analysis-error">
                {analysisError}
              </div>
            )}

          </section>
        )}

        {/* =================================================
            STEP 4 — RESULTS
        ================================================= */}

        {analysis && lessonStep === 4 && (
          <>
            <section className="lesson-card results-card">

              <div className="lesson-section-title">

                <span>📊</span>

                <div>
                  <h2>
                    Step 5 — Your AI Analysis
                  </h2>

                  <p>
                    SkillSensAI has analyzed
                    your performance.
                  </p>
                </div>

              </div>

              {/* SCORE */}

              <div className="score-hero">

                <div className="score-circle">

                  <strong>
                    {Math.round(
                      Number(
                        analysis.overall_score ||
                          0
                      )
                    )}
                  </strong>

                  <span>
                    / 100
                  </span>

                </div>

                <div className="score-summary">

                  <div className="score-label">
                    OVERALL PERFORMANCE
                  </div>

                  <h3>
                    Your Performance Score
                  </h3>

                  <p>
                    {analysis.feedback ||
                      "Good work! Keep practicing to improve your accuracy and stability."}
                  </p>

                </div>

              </div>

              {/* STATS */}

              <div className="analysis-grid">

                <div className="analysis-stat">

                  <span>
                    Pitch Accuracy
                  </span>

                  <strong>
                    {Math.round(
                      Number(
                        analysis.pitch_accuracy ||
                          0
                      )
                    )}
                    %
                  </strong>

                  <div className="stat-bar">
                    <span
                      style={{
                        width: `${clamp(
                          Number(
                            analysis.pitch_accuracy ||
                              0
                          ),
                          0,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                </div>

                <div className="analysis-stat">

                  <span>
                    Note Match
                  </span>

                  <strong>
                    {Math.round(
                      Number(
                        analysis.note_match ||
                          0
                      )
                    )}
                    %
                  </strong>

                  <div className="stat-bar">
                    <span
                      style={{
                        width: `${clamp(
                          Number(
                            analysis.note_match ||
                              0
                          ),
                          0,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                </div>

                <div className="analysis-stat">

                  <span>
                    Stability
                  </span>

                  <strong>
                    {Math.round(
                      Number(
                        analysis.stability ||
                          0
                      )
                    )}
                    %
                  </strong>

                  <div className="stat-bar">
                    <span
                      style={{
                        width: `${clamp(
                          Number(
                            analysis.stability ||
                              0
                          ),
                          0,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                </div>

                <div className="analysis-stat">

                  <span>
                    Average Pitch Error
                  </span>

                  <strong>
                    {Math.round(
                      Number(
                        analysis.average_pitch_error_cents ||
                          0
                      )
                    )}{" "}
                    cents
                  </strong>

                  <small>
                    Lower is better
                  </small>

                </div>

              </div>

              {/* PICTORIAL COMPARISON */}

              <div className="comparison-section">

                <h3>
                  Pictorial Pitch Comparison
                </h3>

                <p>
                  The graph shows your pitch
                  movement during the live
                  performance.
                </p>

                <div className="comparison-graph">

                  <div className="reference-line">
                    <span>
                      Target
                    </span>
                  </div>

                  {pitchHistory.length >
                    0 ? (
                    <svg
                      className="pitch-svg"
                      viewBox="0 0 1000 240"
                      preserveAspectRatio="none"
                    >
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={pitchHistory
                          .map(
                            (
                              pitch,
                              index
                            ) => {
                              const x =
                                (index /
                                  Math.max(
                                    pitchHistory.length -
                                      1,
                                    1
                                  )) *
                                1000;

                              const normalized =
                                clamp(
                                  (
                                    pitch -
                                    220
                                  ) /
                                    4,
                                  -42,
                                  42
                                );

                              const y =
                                120 -
                                normalized *
                                  2;

                              return `${x},${y}`;
                            }
                          )
                          .join(" ")}
                      />
                    </svg>
                  ) : (
                    <div className="no-graph-data">
                      <div>
                        <strong>
                          Pitch graph unavailable
                        </strong>

                        <span>
                          The numerical AI analysis
                          above is still valid. Live
                          pitch tracking is available
                          when using Record Live.
                        </span>
                      </div>
                    </div>
                  )}

                </div>

                <div className="graph-legend">

                  <span>
                    <i className="legend-target" />
                    Target pitch
                  </span>

                  <span>
                    <i className="legend-user" />
                    Your pitch
                  </span>

                </div>

              </div>

              {/* THEORY COMPARISON */}

              <div className="theory-comparison">

                <h3>
                  Theoretical Comparison
                </h3>

                <p className="comparison-subtitle">
                  How your performance compares
                  with the lesson goals.
                </p>

                <div className="comparison-row">

                  <div>

                    <div className="comparison-card-label">
                      REFERENCE
                    </div>

                    <strong>
                      Target Performance
                    </strong>

                    <p>
                      Stable target pitch,
                      controlled voice,
                      accurate note placement
                      and consistent delivery.
                    </p>

                  </div>

                  <div>

                    <div className="comparison-card-label">
                      YOUR RESULT
                    </div>

                    <strong>
                      AI Assessment
                    </strong>

                    <p>
                      {analysis.feedback ||
                        "Your performance has been analyzed using pitch, note matching and stability measurements."}
                    </p>

                  </div>

                </div>

              </div>

            </section>

            {/* COMPLETION */}

            <section
              className={`lesson-completion ${
                completed
                  ? "completed"
                  : ""
              }`}
            >

              {completed ? (
                <>
                  <div className="completion-icon">
                    <CheckCircle2
                      size={35}
                    />
                  </div>

                  <div className="completion-content">

                    <span>
                      LESSON COMPLETE
                    </span>

                    <h2>
                      You brought this lesson
                      to life!
                    </h2>

                    <p>
                      Your progress has been
                      saved and your musician
                      has advanced to the next
                      stage.
                    </p>

                  </div>

                  <button
                    className="next-lesson-button"
                    onClick={
                      goToNextLesson
                    }
                  >
                    {lesson.id === "6"
                      ? "Return to Journey"
                      : "Next Lesson"}

                    <ChevronRight
                      size={17}
                    />
                  </button>
                </>
              ) : (
                <>
                  <div className="completion-lock">
                    <Lock size={30} />
                  </div>

                  <div className="completion-content">

                    <span>
                      FINAL STEP
                    </span>

                    <h2>
                      Ready to complete
                      Lesson {lesson.id}?
                    </h2>

                    <p>
                      Your questions and full
                      performance must both be
                      completed.
                    </p>

                  </div>

                  <button
                    className="complete-lesson-button"
                    disabled={
                      !analysis ||
                      !answerChecked ||
                      selectedAnswer !==
                        lesson.question.answer
                    }
                    onClick={
                      handleCompleteLesson
                    }
                  >
                    <CheckCircle2 size={18} />

                    Complete Lesson
                  </button>
                </>
              )}

            </section>
          </>
        )}

      </main>

    </div>
  );
}

export default Lesson;
