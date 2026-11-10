
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Camera,
  CheckCircle2,
  Play,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import {
  addMartialXP,
  completeLesson,
  getCompletedLessons,
  getMartialXP,
  recordMartialTrainingActivity,
} from "../utils/progress";

import { MARTIAL_ARTS_LESSONS } from "./MartialArtsTraining";
import "./MartialArtsLesson.css";

const THEME_KEY = "skillsensai_martial_theme";
const QUIZ_KEY = "skillsensai_martial_quiz_passed";

export default function MartialArtsLesson({ discipline }) {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const lesson = (MARTIAL_ARTS_LESSONS[discipline] || []).find(
    (item) => String(item.id) === String(lessonId)
  );

  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || "dark"
  );

  const [xp, setXp] = useState(() => getMartialXP());
  const [completed, setCompleted] = useState(() => getCompletedLessons());

  const [quizPassed, setQuizPassed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(QUIZ_KEY) || "{}");
    } catch {
      return {};
    }
  });

  const [answer, setAnswer] = useState(null);
  const [quizMessage, setQuizMessage] = useState("");
  const [checks, setChecks] = useState({});
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const [practiceUrl, setPracticeUrl] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [review, setReview] = useState([false, false, false]);

  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const isBoxing = discipline === "boxing";

  const lessonPath = `/martial-arts/${discipline}`;

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Keep XP and lesson progress synchronized with other pages.
  useEffect(() => {
    const refreshProgress = () => {
      setXp(getMartialXP());
      setCompleted(getCompletedLessons());

      try {
        setQuizPassed(
          JSON.parse(localStorage.getItem(QUIZ_KEY) || "{}")
        );
      } catch {
        setQuizPassed({});
      }
    };

    window.addEventListener(
      "skillsensai-progress-updated",
      refreshProgress
    );

    window.addEventListener("storage", refreshProgress);

    return () => {
      window.removeEventListener(
        "skillsensai-progress-updated",
        refreshProgress
      );

      window.removeEventListener("storage", refreshProgress);
    };
  }, []);

  // Attach the camera stream to the preview.
  useEffect(() => {
    if (recording && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [recording, stream]);

  // Clean up camera access and temporary video URLs.
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (practiceUrl.startsWith("blob:")) {
        URL.revokeObjectURL(practiceUrl);
      }
    };
  }, [practiceUrl]);

  const awardXP = (amount) => {
    const updatedXP = addMartialXP(amount);
    setXp(updatedXP);
  };

  const submitQuiz = () => {
    if (answer === null) {
      setQuizMessage("Choose an answer before checking.");
      return;
    }

    if (answer !== lesson.correct) {
      setQuizMessage(
        "Not quite. Review the technique steps and try again."
      );
      return;
    }

    recordMartialTrainingActivity();

    if (!quizPassed[lesson.id]) {
      const updatedQuiz = {
        ...quizPassed,
        [lesson.id]: true,
      };

      localStorage.setItem(QUIZ_KEY, JSON.stringify(updatedQuiz));
      setQuizPassed(updatedQuiz);

      awardXP(10);

      setQuizMessage(
        "Correct! You earned 10 XP. Your quiz reward is saved. Continue to the practice checkpoints."
      );
    } else {
      setQuizMessage(
        "Correct! You have already earned this quiz's XP reward."
      );
    }
  };

  const startRecording = async () => {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setFeedback(
        "Recording is not supported in this browser or connection. Try a supported browser on HTTPS, or upload a practice video."
      );
      return;
    }

    let media;

    try {
      media = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = media;

      const recorder = new MediaRecorder(media);

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setFeedback(
          "Recording encountered an error. Please try again or upload a video."
        );

        media.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setStream(null);
        setRecording(false);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });

        if (blob.size > 0) {
          setPracticeUrl(URL.createObjectURL(blob));
          setPracticeName("Live practice recording");
          setReview([false, false, false]);

          setFeedback(
            "Recording saved for this session. Watch your clip and complete the self-review checkpoints. Automatic AI pose scoring is not connected."
          );
        } else {
          setFeedback("No video data was recorded. Please try again.");
        }

        media.getTracks().forEach((track) => track.stop());

        if (streamRef.current === media) {
          streamRef.current = null;
        }

        setStream(null);
        setRecording(false);
      };

      setStream(media);

      if (videoRef.current) {
        videoRef.current.srcObject = media;
      }

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);

      setFeedback(
        "Recording started. Practise slowly, keep enough clear space around you, and stop if you feel pain or dizziness."
      );
    } catch (error) {
      if (media) {
        media.getTracks().forEach((track) => track.stop());
      }

      streamRef.current = null;
      setStream(null);
      setRecording(false);

      setFeedback(
        error?.name === "NotAllowedError"
          ? "Camera or microphone permission was denied. Allow access in your browser settings or upload a practice video."
          : "Unable to start recording. Check your camera, microphone, and browser permissions."
      );
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const uploadPractice = (event) => {
    const file = event.target.files?.[0];

    // Allow the same file to be selected again later.
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setFeedback("Please select a valid video file.");
      return;
    }

    if (practiceUrl.startsWith("blob:")) {
      URL.revokeObjectURL(practiceUrl);
    }

    setPracticeUrl(URL.createObjectURL(file));
    setPracticeName(file.name);
    setReview([false, false, false]);

    setFeedback(
      "Video loaded. Compare it with the technique checkpoints below. This is guided self-review, not automatic AI scoring."
    );
  };

  const reviewPractice = () => {
    const count = review.filter(Boolean).length;

    setFeedback(
      `Self-review: ${count}/3 checkpoints completed. ${
        count === 3
          ? "Great job reviewing your movement."
          : "Rewatch your video and focus on the unchecked checkpoints."
      } Automatic AI movement scoring is not connected.`
    );
  };

  const markComplete = () => {
    if (!quizPassed[lesson.id]) {
      setFeedback(
        "Answer the lesson question correctly before completing this lesson."
      );
      return;
    }

    if (!lesson.steps.every((_, index) => checks[index])) {
      setFeedback(
        "Complete every technique checkpoint after practising it."
      );
      return;
    }

    const newlyCompleted = completeLesson(lesson.id);

    setCompleted(getCompletedLessons());

    if (newlyCompleted) {
      awardXP(25);
      recordMartialTrainingActivity();

      setFeedback(
        "Lesson complete! You earned 25 XP. Your progress has been saved."
      );
    } else {
      setFeedback(
        "This lesson is already completed. Your existing rewards have been preserved."
      );
    }
  };

  if (!lesson) {
    return (
      <div
        className={`martial-lesson-page ${
          theme === "light" ? "theme-light" : "theme-dark"
        }`}
      >
        <button className="ml-button" onClick={() => navigate(lessonPath)}>
          <ArrowLeft size={18} /> Back to lessons
        </button>

        <h1>Lesson not found</h1>
        <p className="ml-muted">
          This lesson could not be found. Return to the lesson path and choose
          an available lesson.
        </p>
      </div>
    );
  }

  const alreadyCompleted = completed.includes(lesson.id);

  return (
    <div
      className={`martial-lesson-page ${
        theme === "light" ? "theme-light" : "theme-dark"
      } ${isBoxing ? "ml-boxing" : "ml-karate"}`}
    >
      <header className="ml-header">
        <button className="ml-button" onClick={() => navigate(lessonPath)}>
          <ArrowLeft size={18} /> Lesson path
        </button>

        <div className="ml-brand">
          {isBoxing ? "🥊 BOXING DOJO" : "🥋 KARATE DOJO"}
        </div>

        <div className="ml-header-right">
          <span className="ml-xp">
            <Sparkles size={16} /> {xp} XP
          </span>

          <button
            className="ml-button"
            onClick={() =>
              setTheme((current) =>
                current === "dark" ? "light" : "dark"
              )
            }
          >
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
      </header>

      <main className="ml-content">
        <div className="ml-lesson-heading">
          <span className="ml-eyebrow">TECHNIQUE LESSON</span>
          <h1>{lesson.title}</h1>
          <p>{lesson.description}</p>

          {alreadyCompleted && (
            <p className="ml-feedback">
              <CheckCircle2 size={16} /> Lesson completed
            </p>
          )}
        </div>

        <section className="ml-section">
          <h2>
            <Play size={19} /> 1. Watch the demonstration
          </h2>

          <video
            className="ml-demo"
            controls
            playsInline
            preload="metadata"
            src={lesson.video}
          >
            Your browser does not support video playback.
          </video>

          <p className="ml-muted">
            Watch the demonstration before practising. Move slowly, use a clear
            space, and avoid striking another person.
          </p>
        </section>

        <section className="ml-section">
          <h2>
            <BookOpen size={19} /> 2. Learn the technique
          </h2>

          {lesson.steps.map((step, index) => (
            <label className="ml-check" key={step}>
              <input
                type="checkbox"
                checked={Boolean(checks[index])}
                onChange={(event) =>
                  setChecks((old) => ({
                    ...old,
                    [index]: event.target.checked,
                  }))
                }
              />

              <span>
                <b>{index + 1}.</b> {step}
              </span>
            </label>
          ))}
        </section>

        <section className="ml-section">
          <div className="ml-quiz-title">
            <h2>3. Quick question</h2>
            <span>+10 XP</span>
          </div>

          <h3>{lesson.question}</h3>

          <div className="ml-answers">
            {lesson.answers.map((item, index) => (
              <button
                key={item}
                className={`ml-answer ${
                  answer === index ? "selected" : ""
                }`}
                onClick={() => setAnswer(index)}
              >
                {String.fromCharCode(65 + index)}. {item}
              </button>
            ))}
          </div>

          <button className="ml-primary" onClick={submitQuiz}>
            Check answer
          </button>

          {quizMessage && <p className="ml-feedback">{quizMessage}</p>}
        </section>

        <section className="ml-section">
          <h2>
            <Camera size={19} /> 4. Practise your movement
          </h2>

          <p className="ml-muted">
            Record yourself or upload a saved clip. The on-screen guide is a
            visual reference, not a live pose match.
          </p>

          <div className="ml-practice-grid">
            <div className="ml-camera">
              {recording ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="ml-camera-video"
                  />

                  <div className="ml-guide" aria-hidden="true">
                    <svg viewBox="0 0 220 360">
                      <circle cx="110" cy="48" r="24" />
                      <path d="M110 73 L110 180 M110 100 L65 145 L45 118 M110 100 L155 145 L176 118 M110 180 L78 255 L70 330 M110 180 L145 255 L155 330" />
                    </svg>
                    <span>REFERENCE STANCE</span>
                  </div>
                </>
              ) : practiceUrl ? (
                <video
                  src={practiceUrl}
                  controls
                  playsInline
                  className="ml-camera-video"
                />
              ) : (
                <div className="ml-camera-empty">
                  <Camera size={36} />
                  <b>Practice preview</b>
                  <span>Start recording or upload a video.</span>
                </div>
              )}
            </div>

            <div className="ml-practice-controls">
              <h3>Record or upload</h3>

              <div className="ml-actions">
                {!recording ? (
                  <button className="ml-primary" onClick={startRecording}>
                    <Camera size={17} /> Record live
                  </button>
                ) : (
                  <button className="ml-danger" onClick={stopRecording}>
                    <X size={17} /> Stop recording
                  </button>
                )}

                <label className="ml-secondary">
                  <Upload size={17} /> Upload video
                  <input
                    hidden
                    type="file"
                    accept="video/*"
                    onChange={uploadPractice}
                  />
                </label>
              </div>

              {practiceName && (
                <p className="ml-file">Selected: {practiceName}</p>
              )}

              {practiceUrl && (
                <>
                  <h4>Self-review checklist</h4>

                  {[
                    "I kept a stable stance and balance.",
                    "I performed the movement with control.",
                    "I returned to a safe guard or ready position.",
                  ].map((text, index) => (
                    <label className="ml-check" key={text}>
                      <input
                        type="checkbox"
                        checked={review[index]}
                        onChange={(event) =>
                          setReview((old) =>
                            old.map((value, i) =>
                              i === index ? event.target.checked : value
                            )
                          )
                        }
                      />

                      <span>{text}</span>
                    </label>
                  ))}

                  <button
                    className="ml-secondary"
                    onClick={reviewPractice}
                  >
                    Review my practice
                  </button>
                </>
              )}
            </div>
          </div>

          {feedback && <p className="ml-feedback">{feedback}</p>}

          <p className="ml-disclaimer">
            Practice feedback uses your checklist. Automatic AI pose detection
            and technique scoring are not connected.
          </p>
        </section>

        <footer className="ml-footer">
          <button
            className="ml-secondary"
            onClick={() => navigate(lessonPath)}
          >
            Back to lesson path
          </button>

          <button
            className="ml-primary"
            onClick={markComplete}
            disabled={alreadyCompleted}
          >
            {alreadyCompleted ? (
              <>
                <CheckCircle2 size={17} /> Completed
              </>
            ) : (
              "Complete lesson · +25 XP"
            )}
          </button>
        </footer>
      </main>
    </div>
  );
}
