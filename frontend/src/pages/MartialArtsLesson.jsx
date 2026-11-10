
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Camera,
  Play,
  Sparkles,
} from "lucide-react";

import {
  addMartialXP,
  completeLesson,
  getCompletedLessons,
  getMartialXP,
  recordMartialTrainingActivity,
} from "../utils/progress";

import { MARTIAL_ARTS_LESSONS } from "./MartialArtsTraining";
import PosePracticeStudio from "./PosePracticeStudio";
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
            Record yourself or upload a saved clip. Free browser-based pose tracking
            marks visible joints and provides preliminary posture feedback; it is not
            a certified assessment of technique.
          </p>
          <PosePracticeStudio discipline={discipline} />
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
