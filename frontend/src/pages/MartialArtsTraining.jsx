
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Camera,
  Sun,
  Moon,
  Trophy,
  Flame,
  LockKeyhole,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  addMartialXP,
  getMartialXP,
  completeLesson,
  getCompletedLessons,
  getMartialTrainingStreak,
  recordMartialTrainingActivity
} from "../utils/progress";
import "./MartialArtsTraining.css";

const THEME_KEY = "skillsensai_martial_theme";
const QUIZ_KEY = "skillsensai_martial_quiz_passed";

export const MARTIAL_ARTS_LESSONS = {
  boxing: [
    {
      id: "boxing-lesson-1",
      title: "Boxing Stance",
      short: "Stance & balance",
      description:
        "Build a balanced boxing stance, protect your chin and keep your hands ready.",
      video:
        "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794245428/b1.mp4",
      steps: [
        "Stand in a comfortable staggered stance with knees relaxed.",
        "Keep your chin slightly tucked and your hands near your cheeks.",
        "Extend the lead hand smoothly without locking the elbow.",
        "Return the hand to guard and regain balance."
      ],
      question: "What should you focus on first in a boxing stance?",
      answers: [
        "Balanced feet and a ready guard",
        "Locked knees",
        "Leaning far forward"
      ],
      correct: 0,
      cue: "Start with balance, relaxed knees and hands ready to protect your face."
    },
    {
      id: "boxing-lesson-2",
      title: "Jab",
      short: "Lead-hand straight punch",
      description:
        "Learn to extend the lead hand with control and return immediately to guard.",
      video:
        "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794245676/b2.mp4",
      steps: [
        "Start in your boxing stance with the lead hand in front.",
        "Send the lead fist straight forward along your centre line.",
        "Keep the rear hand up and avoid locking the punching elbow.",
        "Bring the lead hand back to guard and reset your stance."
      ],
      question: "Which hand delivers a standard jab?",
      answers: [
        "Lead hand",
        "Rear hand only",
        "Both hands together"
      ],
      correct: 0,
      cue: "A jab is a straight punch from the lead hand; return it to guard."
    },
    {
      id: "boxing-lesson-3",
      title: "Cross",
      short: "Rear-hand straight punch",
      description:
        "Practise a controlled rear-hand cross while rotating comfortably and recovering your guard.",
      video:
        "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794245522/b3.mp4",
      steps: [
        "Start in your boxing stance with both hands protecting your face.",
        "Drive the rear hand forward while gently rotating your hips and shoulder.",
        "Keep the lead hand up and avoid forcing the elbow into a hard lock.",
        "Return the rear hand to guard and regain balance."
      ],
      question: "What helps a cross stay controlled?",
      answers: [
        "Over-rotating and losing balance",
        "Controlled rotation and returning to guard",
        "Locking the elbow hard"
      ],
      correct: 1,
      cue: "Rotate comfortably, protect your face and recover your stance."
    }
  ],

  karate: [
    {
      id: "karate-lesson-1",
      title: "Karate Stance",
      short: "Stance & balance",
      description:
        "Learn a stable stance, relaxed posture and balanced body positioning.",
      video:
        "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794246003/k1.mp4",
      steps: [
        "Place your feet in a comfortable, stable stance.",
        "Keep your knees soft and your spine tall.",
        "Distribute your weight so you can move without wobbling.",
        "Practise slowly and stop if anything hurts."
      ],
      question: "What helps maintain a stable karate stance?",
      answers: [
        "Locked knees",
        "Balanced weight and soft knees",
        "Leaning as far as possible"
      ],
      correct: 1,
      cue: "A balanced stance keeps your weight controlled and knees relaxed."
    },
    {
      id: "karate-lesson-2",
      title: "Basic Punch",
      short: "Straight punch basics",
      description:
        "Practise a basic straight punch from a stable stance, then return to guard.",
      video:
        "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794246016/k2.mp4",
      steps: [
        "Begin in a stable karate stance with your hands in the taught guard.",
        "Drive one fist forward in a straight line, keeping your wrist aligned.",
        "Keep your shoulders relaxed and avoid locking your elbow.",
        "Retract the fist under control before repeating."
      ],
      question: "What should you do after a basic karate punch?",
      answers: [
        "Return to your guard",
        "Leave your arm extended",
        "Drop your hands"
      ],
      correct: 0,
      cue: "Practise with control and return to a protective position."
    },
    {
      id: "karate-lesson-3",
      title: "Roundhouse Kick",
      short: "Controlled roundhouse kick",
      description:
        "Learn the roundhouse kick slowly, prioritising balance, control and safe distance.",
      video:
        "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794245673/k3.mp4",
      steps: [
        "Start from a stable stance with your guard up and clear space around you.",
        "Turn the supporting foot and hip as shown in the demonstration.",
        "Lift the knee and extend the lower leg only as far as you can control.",
        "Re-chamber the leg, place the foot down carefully and regain balance."
      ],
      question: "What is most important when learning a roundhouse kick?",
      answers: [
        "Balance and controlled movement",
        "Kicking as high as possible immediately",
        "Locking the supporting knee"
      ],
      correct: 0,
      cue: "Start low and slowly, keep balance and practise in a clear space."
    }
  ]
};

export default function MartialArtsTraining({ discipline }) {
  const navigate = useNavigate();

  const isBoxing = discipline === "boxing";
  const prefix = isBoxing ? "boxing" : "karate";
  const lessons = MARTIAL_ARTS_LESSONS[prefix] || [];

  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || "dark"
  );
  const [completed, setCompleted] = useState(
    () => getCompletedLessons()
  );
  const [xp, setXp] = useState(() => getMartialXP());
  const [quizPassed, setQuizPassed] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(QUIZ_KEY) || "{}"
      );
    } catch {
      return {};
    }
  });
  const [streak, setStreak] = useState(
    () => getMartialTrainingStreak()
  );

  const [answer, setAnswer] = useState(null);
  const [checked, setChecked] = useState({});
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const [practiceUrl, setPracticeUrl] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reviewChecks, setReviewChecks] = useState([
    false,
    false,
    false
  ]);
  const [quizMessage, setQuizMessage] = useState("");

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const liveVideoRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (recording && stream && liveVideoRef.current) {
      liveVideoRef.current.srcObject = stream;
    }
  }, [recording, stream]);

  useEffect(() => {
    const refresh = () => {
      setCompleted(getCompletedLessons());
      setXp(getMartialXP());
      setStreak(getMartialTrainingStreak());
    };

    window.addEventListener(
      "skillsensai-progress-updated",
      refresh
    );

    return () => {
      window.removeEventListener(
        "skillsensai-progress-updated",
        refresh
      );
    };
  }, []);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (practiceUrl.startsWith("blob:")) {
        URL.revokeObjectURL(practiceUrl);
      }
    };
  }, [stream, practiceUrl]);

  const doneCount = lessons.filter((lesson) =>
    completed.includes(lesson.id)
  ).length;

  const boxingDone = completed.filter((id) =>
    id.startsWith("boxing-")
  ).length;

  const karateDone = completed.filter((id) =>
    id.startsWith("karate-")
  ).length;

  const badges = [
    {
      id: "first",
      icon: "🥇",
      title: "First Move",
      detail: "Complete your first lesson",
      earned: completed.length >= 1
    },
    {
      id: "focus",
      icon: "🎯",
      title: "Focused Learner",
      detail: "Complete all 3 lessons in one discipline",
      earned: boxingDone >= 3 || karateDone >= 3
    },
    {
      id: "cross",
      icon: "🥊",
      title: "Cross-Trainer",
      detail: "Try both boxing and karate",
      earned: boxingDone > 0 && karateDone > 0
    },
    {
      id: "xp",
      icon: "⚡",
      title: "XP Collector",
      detail: "Earn 100 XP",
      earned: xp >= 100
    }
  ];

  const earnedBadges = badges.filter(
    (badge) => badge.earned
  ).length;

  const rankTiers = [
    { level: 1, name: "White Belt", minXP: 0, nextXP: 50, icon: "🥋" },
    { level: 2, name: "Yellow Belt", minXP: 50, nextXP: 120, icon: "🌟" },
    { level: 3, name: "Orange Belt", minXP: 120, nextXP: 220, icon: "🔥" },
    { level: 4, name: "Green Belt", minXP: 220, nextXP: 350, icon: "💚" },
    { level: 5, name: "Blue Belt", minXP: 350, nextXP: 500, icon: "💠" },
    { level: 6, name: "Black Belt Candidate", minXP: 500, nextXP: 500, icon: "🏆" }
  ];

  const rank =
    [...rankTiers].reverse().find((item) => xp >= item.minXP) ||
    rankTiers[0];

  const rankProgress =
    rank.nextXP === rank.minXP
      ? 100
      : Math.min(
          100,
          Math.round(
            ((xp - rank.minXP) /
              (rank.nextXP - rank.minXP)) *
              100
          )
        );

  const isUnlocked = (index) =>
    index === 0 ||
    lessons
      .slice(0, index)
      .every((lesson) => completed.includes(lesson.id));

  const submitQuiz = (lesson) => {
    if (answer === null) {
      setQuizMessage("Choose an answer first.");
      return;
    }

    if (answer === lesson.correct) {
      if (!quizPassed[lesson.id]) {
        const next = {
          ...quizPassed,
          [lesson.id]: true
        };

        setQuizPassed(next);
        localStorage.setItem(
          QUIZ_KEY,
          JSON.stringify(next)
        );

        addMartialXP(10);
        setXp(getMartialXP());
      }

      recordMartialTrainingActivity();
      setStreak(getMartialTrainingStreak());
      setQuizMessage(
        "Correct! Your quiz reward is saved. You can now complete the practice steps."
      );
    } else {
      setQuizMessage(
        "Not quite. Review the demonstration and try again."
      );
    }
  };

  const markComplete = (lesson) => {
    const checklistDone = lesson.steps.every(
      (_, index) => checked[index]
    );

    if (!quizPassed[lesson.id]) {
      setFeedback(
        "Answer the lesson question correctly to complete this lesson."
      );
      return;
    }

    if (!checklistDone) {
      setFeedback(
        "Tick each practice checkpoint after trying it, then complete the lesson."
      );
      return;
    }

    const newlyCompleted = completeLesson(lesson.id);

    if (newlyCompleted) {
      addMartialXP(25);
      recordMartialTrainingActivity();

      setCompleted(getCompletedLessons());
      setXp(getMartialXP());
      setStreak(getMartialTrainingStreak());

      setFeedback(
        "Lesson complete! +25 XP earned. The next lesson is unlocked."
      );
    } else {
      setCompleted(getCompletedLessons());
      setFeedback(
        "Lesson already completed. Your progress has been refreshed."
      );
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is unavailable.");
      }

      const media =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

      const recorder = new MediaRecorder(media);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm"
        });

        const url = URL.createObjectURL(blob);
        setPracticeUrl(url);
        setPracticeName("Live practice recording");
        setFeedback(
          "Recording ready. Review your clip and complete the self-review checklist. Automatic pose-based AI scoring is not connected yet."
        );

        media.getTracks().forEach((track) => track.stop());
        setStream(null);
        setRecording(false);
      };

      setStream(media);

      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = media;
      }

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);

      setFeedback(
        "Recording live. Match your stance to the guide and practise slowly in a clear space."
      );
    } catch {
      setFeedback(
        "Camera access failed. Allow camera permission or upload a practice video instead."
      );
    }
  };

  const stopRecording = () => {
    if (
      recorderRef.current &&
      recorderRef.current.state !== "inactive"
    ) {
      recorderRef.current.stop();
    }
  };

  const chooseUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setFeedback("Please select a video file.");
      event.target.value = "";
      return;
    }

    if (practiceUrl.startsWith("blob:")) {
      URL.revokeObjectURL(practiceUrl);
    }

    setPracticeUrl(URL.createObjectURL(file));
    setPracticeName(file.name);
    setFeedback(
      "Video loaded. Review it against the checkpoints. Automatic pose-based AI scoring is not connected yet."
    );

    setReviewChecks([false, false, false]);
  };

  const reviewPractice = () => {
    const count = reviewChecks.filter(Boolean).length;

    setFeedback(
      `Self-review: ${count}/3 checkpoints marked. ${
        count === 3
          ? "Great job checking stance, control and guard recovery."
          : "Rewatch your clip and focus on the unchecked checkpoints."
      } This is a guided self-review, not an automated AI movement score.`
    );
  };

  if (!lessons.length) {
    return (
      <main className="martial-training">
        <h2>Training discipline not found</h2>
        <button
          className="mt-primary"
          onClick={() => navigate("/martial-arts")}
        >
          Back to Martial Arts
        </button>
      </main>
    );
  }

  return (
    <div
      className={`martial-training ${
        theme === "light" ? "theme-light" : "theme-dark"
      } ${prefix}-training`}
    >
      <header className="mt-header">
        <button
          className="mt-ghost"
          onClick={() => navigate("/martial-arts")}
        >
          <ArrowLeft size={18} /> Martial Arts
        </button>

        <div className="mt-brand">
          <span className="mt-brand-icon">
            {isBoxing ? "🥊" : "🥋"}
          </span>
          <span>
            SkillSensAI
            <small>
              {isBoxing ? "BOXING DOJO" : "KARATE DOJO"}
            </small>
          </span>
        </div>

        <div className="mt-stats">
          <span className="mt-xp">
            <Sparkles size={16} /> {xp} XP
          </span>
          <span className="mt-streak">
            <Flame size={16} /> {streak} day{streak === 1 ? "" : "s"}
          </span>
          <button
            className="mt-theme"
            aria-label="Toggle theme"
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
          >
            {theme === "dark" ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>
        </div>
      </header>

      <main className="mt-layout">
        <section className="mt-main">
          <div className="mt-welcome">
            <div className="mt-eyebrow">YOUR TRAINING PATH</div>
            <h1>
              Level up your{" "}
              <span>{isBoxing ? "boxing" : "karate"}</span>
            </h1>
            <p>
              Watch a demo, learn the technique, answer a quick question,
              then practise and earn XP.
            </p>

            <div className="mt-progress-head">
              <strong>Beginner journey</strong>
              <span>
                {doneCount} of {lessons.length} lessons
              </span>
            </div>

            <div className="mt-progress-track">
              <div
                style={{
                  width: `${(doneCount / lessons.length) * 100}%`
                }}
              />
            </div>

            <div className="mt-dashboard-stats">
              <div>
                <strong>
                  {Math.round((doneCount / lessons.length) * 100)}%
                </strong>
                <span>{isBoxing ? "Boxing" : "Karate"} progress</span>
              </div>
              <div>
                <strong>{completed.length}/6</strong>
                <span>All martial arts lessons</span>
              </div>
              <div>
                <strong>
                  {earnedBadges}/{badges.length}
                </strong>
                <span>Badges earned</span>
              </div>
            </div>
          </div>

          <div className="mt-path">
            {lessons.map((lesson, index) => {
              const done = completed.includes(lesson.id);
              const unlocked = isUnlocked(index);

              return (
                <div
                  className={`mt-path-row ${
                    index % 2 ? "offset" : ""
                  }`}
                  key={lesson.id}
                >
                  <div className="mt-path-node-wrap">
                    <button
                      className={`mt-path-node ${
                        done ? "done" : ""
                      }`}
                      disabled={!unlocked}
                      onClick={() =>
                        navigate(
                          `/martial-arts/${prefix}/lesson/${lesson.id}`
                        )
                      }
                      aria-label={lesson.title}
                    >
                      {done ? (
                        <CheckCircle2 />
                      ) : unlocked ? (
                        <span>{index + 1}</span>
                      ) : (
                        <LockKeyhole />
                      )}
                    </button>

                    <span className="mt-node-label">
                      {done
                        ? "COMPLETED"
                        : unlocked
                        ? "+35 XP"
                        : "LOCKED"}
                    </span>
                  </div>

                  <button
                    className="mt-path-card"
                    disabled={!unlocked}
                    onClick={() =>
                      navigate(
                        `/martial-arts/${prefix}/lesson/${lesson.id}`
                      )
                    }
                  >
                    <div>
                      <span className="mt-card-kicker">
                        LESSON {index + 1}
                      </span>
                      <h3>{lesson.title}</h3>
                      <p>{lesson.description}</p>
                    </div>
                    <span className="mt-card-play">
                      {done
                        ? "Review"
                        : unlocked
                        ? "Start lesson →"
                        : <LockKeyhole size={16} />}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="mt-sidebar">
          <section className="mt-side-card mt-badges-card">
            <div className="mt-badges-heading">
              <h3>
                <Trophy size={18} /> Achievement badges
              </h3>
              <span>
                {earnedBadges}/{badges.length}
              </span>
            </div>

            <div className="mt-badge-grid">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`mt-badge ${
                    badge.earned ? "earned" : "locked"
                  }`}
                  title={badge.detail}
                >
                  <span className="mt-badge-icon">
                    {badge.earned ? badge.icon : "🔒"}
                  </span>
                  <strong>{badge.title}</strong>
                  <small>{badge.detail}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-side-card mt-rank-card">
            <div className="mt-rank-top">
              <span className="mt-rank-emblem">{rank.icon}</span>
              <div>
                <span className="mt-card-kicker">
                  YOUR CURRENT RANK
                </span>
                <h3>{rank.name}</h3>
                <p>
                  Level {rank.level} · {xp} total XP
                </p>
              </div>
            </div>

            <div className="mt-rank-track">
              <div style={{ width: `${rankProgress}%` }} />
            </div>

            <div className="mt-rank-foot">
              {rank.level === 6
                ? "Top rank reached — keep training!"
                : `${Math.max(
                    0,
                    rank.nextXP - xp
                  )} XP to ${rankTiers[rank.level].name}`}
            </div>
          </section>

          <section className="mt-side-card mt-reward-card">
            <div className="mt-reward-icon">
              <Trophy size={25} />
            </div>
            <div>
              <span className="mt-card-kicker">YOUR REWARDS</span>
              <h3>{xp} XP</h3>
              <p>10 XP for each correct quiz · 25 XP per completed lesson</p>
            </div>
          </section>

          <section className="mt-side-card">
            <h3>
              <Flame size={18} /> Training rules
            </h3>
            <ul>
              <li>Warm up before practising.</li>
              <li>Use an open, clear space.</li>
              <li>Move slowly before adding speed.</li>
              <li>Stop if you feel pain or dizziness.</li>
            </ul>
          </section>

          <section className="mt-side-card">
            <h3>
              <Camera size={18} /> Practice studio
            </h3>
            <p>
              Open a lesson to record yourself or upload a clip for guided
              self-review.
            </p>
            <button
              className="mt-primary mt-full"
              onClick={() =>
                navigate(
                  `/martial-arts/${prefix}/lesson/${lessons[0].id}`
                )
              }
            >
              Open first lesson
            </button>
          </section>
        </aside>
      </main>
    </div>
  );
}
