
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
  Clock,
  RotateCcw,
} from "lucide-react";

import {
  completeLesson,
  getCompletedLessons,
  recordMartialTrainingActivity,
} from "../utils/progress";

import { MARTIAL_ARTS_LESSONS } from "./MartialArtsTraining";
import "./MartialArtsLesson.css";

const THEME_KEY = "skillsensai_martial_theme";
const XP_KEY = "skillsensai_martial_xp";
const QUIZ_KEY = "skillsensai_martial_quiz_passed";
const MAX_RECORDING_SECONDS = 300;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

export default function MartialArtsLesson({ discipline }) {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const lesson = (MARTIAL_ARTS_LESSONS[discipline] || []).find(
    (item) => item.id === lessonId
  );

  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || "dark"
  );
  const [xp, setXp] = useState(
    () => Number(localStorage.getItem(XP_KEY) || 0)
  );
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
  const [elapsed, setElapsed] = useState(0);
  const [practiceUrl, setPracticeUrl] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [review, setReview] = useState([false, false, false]);

  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const practiceUrlRef = useRef("");
  const recordingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Attach the live camera feed to the preview.
  useEffect(() => {
    if (recording && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [recording, stream]);

  // Timer and automatic stop after five minutes.
  useEffect(() => {
    if (!recording) return;

    const timer = window.setInterval(() => {
      setElapsed((previous) => {
        const next = previous + 1;

        if (next >= MAX_RECORDING_SECONDS) {
          window.clearInterval(timer);

          if (
            recorderRef.current &&
            recorderRef.current.state !== "inactive"
          ) {
            recorderRef.current.stop();
          }

          setFeedback(
            "The five-minute recording limit was reached. Your practice video is ready to review."
          );

          return MAX_RECORDING_SECONDS;
        }

        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [recording]);

  // Release camera/microphone and temporary video URL on unmount.
  useEffect(() => {
    return () => {
      recordingRef.current = false;

      if (
        recorderRef.current &&
        recorderRef.current.state !== "inactive"
      ) {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());

      if (practiceUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(practiceUrlRef.current);
      }
    };
  }, []);

  if (!lesson) {
    return (
      <div
        className={`martial-lesson-page ${
          theme === "light" ? "theme-light" : "theme-dark"
        }`}
      >
        <button
          className="ml-button"
          onClick={() => navigate(`/martial-arts/${discipline}`)}
        >
          <ArrowLeft size={18} /> Back to lessons
        </button>
        <h1>Lesson not found</h1>
      </div>
    );
  }

  const addXP = (amount) => {
    const next = Number(localStorage.getItem(XP_KEY) || 0) + amount;

    localStorage.setItem(XP_KEY, String(next));
    setXp(next);
  };

  const submitQuiz = () => {
    if (answer === null) {
      setQuizMessage("Choose an answer first.");
      return;
    }

    if (answer === lesson.correct) {
      recordMartialTrainingActivity();

      if (!quizPassed[lesson.id]) {
        const next = { ...quizPassed, [lesson.id]: true };

        setQuizPassed(next);
        localStorage.setItem(QUIZ_KEY, JSON.stringify(next));
        addXP(10);
        setQuizMessage("Correct! +10 XP. Continue to the practice checkpoints.");
      } else {
        setQuizMessage("Correct! You have already earned XP for this question.");
      }
    } else {
      setQuizMessage("Not quite. Review the lesson steps and try again.");
    }
  };

  const replacePracticeVideo = (url, name) => {
    const oldUrl = practiceUrlRef.current;

    if (oldUrl.startsWith("blob:")) {
      URL.revokeObjectURL(oldUrl);
    }

    practiceUrlRef.current = url;
    setPracticeUrl(url);
    setPracticeName(name);
    setReview([false, false, false]);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setFeedback(
        "Live recording is not supported by this browser. Try a recent browser or upload a practice video."
      );
      return;
    }

    try {
      setFeedback("Requesting camera and microphone permission...");

      const media = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = media;
      setStream(media);
      chunksRef.current = [];
      setElapsed(0);

      const supportedTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];

      const mimeType = supportedTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      const recorder = mimeType
        ? new MediaRecorder(media, { mimeType })
        : new MediaRecorder(media);

      recorderRef.current = recorder;
      recordingRef.current = true;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setFeedback(
          "A recording error occurred. Please try again or upload a video."
        );
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });

        if (blob.size > 0) {
          replacePracticeVideo(
            URL.createObjectURL(blob),
            "Live practice recording"
          );

          setFeedback(
            "Recording saved for this session. Play it back and review the checkpoints below."
          );
        } else {
          setFeedback("No video data was captured. Please try recording again.");
        }

        media.getTracks().forEach((track) => track.stop());

        if (streamRef.current === media) {
          streamRef.current = null;
        }

        recordingRef.current = false;
        setStream(null);
        setRecording(false);
      };

      recorder.start(1000);
      setRecording(true);

      setFeedback(
        "Recording live. Practise slowly in a clear space. The recording stops automatically after five minutes."
      );
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
      recordingRef.current = false;
      setRecording(false);

      setFeedback(
        error?.name === "NotAllowedError"
          ? "Camera or microphone permission was denied. Allow access in your browser settings or upload a practice video."
          : "Could not start the camera. Check that it is connected and not being used by another application."
      );
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      setFeedback("Stopping recording and preparing your video...");
    }
  };

  const uploadPractice = (event) => {
    const file = event.target.files?.[0];

    // Let the user choose the same file again if needed.
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setFeedback("Please select a video file.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setFeedback("This video exceeds the 100 MB upload limit.");
      return;
    }

    if (recordingRef.current) {
      setFeedback("Stop your live recording before uploading another video.");
      return;
    }

    replacePracticeVideo(URL.createObjectURL(file), file.name);
    setElapsed(0);

    setFeedback(
      "Video loaded. Play it back and compare your movement with the checkpoints. This is guided self-review, not automatic AI scoring."
    );
  };

  const clearPractice = () => {
    if (recordingRef.current) {
      setFeedback("Stop the live recording before clearing your practice video.");
      return;
    }

    const oldUrl = practiceUrlRef.current;

    if (oldUrl.startsWith("blob:")) {
      URL.revokeObjectURL(oldUrl);
    }

    practiceUrlRef.current = "";
    setPracticeUrl("");
    setPracticeName("");
    setReview([false, false, false]);
    setElapsed(0);
    setFeedback("Practice video cleared. You can record again or upload a new clip.");
  };

  const reviewPractice = () => {
    const count = review.filter(Boolean).length;

    setFeedback(
      `Self-review: ${count}/3 checkpoints marked. ${
        count === 3
          ? "Great work reviewing your movement."
          : "Rewatch your clip and focus on the unchecked checkpoints."
      } This is not an automated AI movement score.`
    );
  };

  const markComplete = () => {
    if (!quizPassed[lesson.id]) {
      setFeedback("Answer the lesson question correctly before completing this lesson.");
      return;
    }

    if (!lesson.steps.every((_, index) => checks[index])) {
      setFeedback("Tick each technique checkpoint after practising it.");
      return;
    }

    if (!completed.includes(lesson.id)) {
      completeLesson(lesson.id);
      setCompleted(getCompletedLessons());
      addXP(25);
      recordMartialTrainingActivity();
      setFeedback("Lesson complete! +25 XP earned. The next lesson is now unlocked.");
    } else {
      setFeedback("Lesson already completed. You can revisit it anytime.");
    }
  };

  return (
    <div
      className={`martial-lesson-page ${
        theme === "light" ? "theme-light" : "theme-dark"
      } ${discipline === "boxing" ? "ml-boxing" : "ml-karate"}`}
    >
      <header className="ml-header">
        <button
          className="ml-button"
          onClick={() => navigate(`/martial-arts/${discipline}`)}
        >
          <ArrowLeft size={18} /> Lesson path
        </button>

        <div className="ml-brand">
          {discipline === "boxing" ? "🥊 BOXING DOJO" : "🥋 KARATE DOJO"}
        </div>

        <div className="ml-header-right">
          <span className="ml-xp">
            <Sparkles size={16} /> {xp} XP
          </span>
          <button
            className="ml-button"
            onClick={() =>
              setTheme((current) => (current === "dark" ? "light" : "dark"))
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
        </div>

        <section className="ml-section">
          <h2><Play size={19} /> 1. Watch the demonstration</h2>
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
            Watch once before practising. Move slowly, use a clear space and avoid striking another person.
          </p>
        </section>

        <section className="ml-section">
          <h2><BookOpen size={19} /> 2. Learn the technique</h2>
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
              <span><b>{index + 1}.</b> {step}</span>
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
                className={`ml-answer ${answer === index ? "selected" : ""}`}
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
          <h2><Camera size={19} /> 4. Practice studio</h2>
          <p className="ml-muted">
            Record yourself with a visual reference or upload a saved clip.
            The guide is for comparison only; it does not track your body or score your technique.
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
                  <span>Start a recording or upload your own video.</span>
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

                <label
                  className={`ml-secondary ${recording ? "ml-disabled" : ""}`}
                >
                  <Upload size={17} /> Upload video
                  <input
                    hidden
                    type="file"
                    accept="video/*"
                    disabled={recording}
                    onChange={uploadPractice}
                  />
                </label>
              </div>

              {recording && (
                <div className="ml-recording-status" role="status">
                  <span className="ml-recording-dot" />
                  <span>Recording</span>
                  <strong>{formatTime(elapsed)}</strong>
                  <span>/ {formatTime(MAX_RECORDING_SECONDS)}</span>
                </div>
              )}

              {practiceName && !recording && (
                <p className="ml-file">Selected: {practiceName}</p>
              )}

              {practiceUrl && !recording && (
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

                  <div className="ml-actions">
                    <button className="ml-secondary" onClick={reviewPractice}>
                      <CheckCircle2 size={17} /> Review my practice
                    </button>

                    <button className="ml-secondary" onClick={clearPractice}>
                      <RotateCcw size={17} /> Retake / clear
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {feedback && <p className="ml-feedback" role="status">{feedback}</p>}

          <p className="ml-disclaimer">
            Practice feedback currently uses your checklist. Automatic AI pose detection and technique scoring are not connected yet.
          </p>
        </section>

        <footer className="ml-footer">
          <button
            className="ml-secondary"
            onClick={() => navigate(`/martial-arts/${discipline}`)}
          >
            Back to lesson path
          </button>

          <button
            className="ml-primary"
            onClick={markComplete}
            disabled={completed.includes(lesson.id)}
          >
            {completed.includes(lesson.id) ? (
              <><CheckCircle2 size={17} /> Completed</>
            ) : (
              "Complete lesson · +25 XP"
            )}
          </button>
        </footer>
      </main>
    </div>
  );
}
