import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Camera, Upload, Sun, Moon, Trophy, Flame, LockKeyhole, Play, X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { completeLesson, getCompletedLessons } from "../utils/progress";
import "./MartialArtsTraining.css";

const THEME_KEY = "skillsensai_martial_theme";
const XP_KEY = "skillsensai_martial_xp";
const QUIZ_KEY = "skillsensai_martial_quiz_passed";

export const MARTIAL_ARTS_LESSONS = {
  boxing: [
    { id: "boxing-lesson-1", title: "Boxing Stance", short: "Stance & balance", description: "Build a balanced boxing stance, protect your chin and keep your hands ready.", video: "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794245428/b1.mp4", steps: ["Stand in a comfortable staggered stance with knees relaxed.", "Keep your chin slightly tucked and your other hand near your cheek.", "Extend the lead hand smoothly without locking the elbow.", "Return the hand to guard and regain balance."], question: "What should you focus on first in a boxing stance?", answers: ["Balanced feet and a ready guard", "Locked knees", "Leaning far forward"], correct: 0, cue: "Start with balance, relaxed knees and hands ready to protect your face." },
    { id: "boxing-lesson-2", title: "Jab", short: "Lead-hand straight punch", description: "Learn to extend the lead hand with control and return immediately to guard.", video: "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794245676/b2.mp4", steps: ["Keep your hands up without tensing your shoulders.", "Take small, balanced steps rather than crossing your feet.", "Keep your eyes forward and knees soft.", "Pause and check your balance before repeating."], question: "Which hand delivers a standard jab?", answers: ["Lead hand", "Rear hand only", "Both hands together"], correct: 0, cue: "A jab is a straight punch from the lead hand; return it to guard." },
    { id: "boxing-lesson-3", title: "Cross", short: "Rear-hand straight punch", description: "Practise a controlled rear-hand cross while rotating comfortably and recovering your guard.", video: "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794245522/b3.mp4", steps: ["Warm up shoulders and wrists first.", "Begin slowly and use comfortable range of motion.", "Keep your non-punching hand protecting your face.", "Finish balanced and reset before the next repetition."], question: "What helps a cross stay controlled?", answers: ["Over-rotating and losing balance", "Controlled rotation and returning to guard", "Locking the elbow hard"], correct: 1, cue: "Rotate comfortably, keep the other hand protecting your face and recover your stance." }
  ],
  karate: [
    { id: "karate-lesson-1", title: "Karate stance", short: "Stance & balance", description: "Learn a stable stance, relaxed posture and balanced body positioning.", video: "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794246003/k1.mp4", steps: ["Place your feet in a comfortable, stable stance.", "Keep knees soft and spine tall.", "Distribute your weight so you can move without wobbling.", "Practise slowly and stop if anything hurts."], question: "What helps maintain a stable karate stance?", answers: ["Locked knees", "Balanced weight and soft knees", "Leaning as far as possible"], correct: 1, cue: "A balanced stance keeps your weight controlled and knees relaxed." },
    { id: "karate-lesson-2", title: "Basic Punch", short: "Straight punch basics", description: "Practise a basic straight punch from a stable stance, then return to guard.", video: "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794246016/k2.mp4", steps: ["Keep your hands in a comfortable protective position.", "Relax your shoulders and keep your chin neutral.", "Keep your elbows controlled and posture upright.", "Return to guard after every repetition."], question: "What should you do after a basic karate punch?", answers: ["Return to your guard", "Leave your arm extended", "Drop your hands"], correct: 0, cue: "Practise with control and return to a protective position." },
    { id: "karate-lesson-3", title: "Roundhouse Kick", short: "Controlled roundhouse kick", description: "Learn the roundhouse kick slowly, prioritising balance, control and safe distance.", video: "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794245673/k3.mp4", steps: ["Start from a stable stance and protective guard.", "Extend the arm in a controlled straight line.", "Do not forcefully lock the elbow at extension.", "Return to guard and reset your balance."], question: "What is most important when learning a roundhouse kick?", answers: ["Balance and controlled movement", "Kicking as high as possible immediately", "Locking the supporting knee"], correct: 0, cue: "Start low and slowly, keep balance and practise in a clear space." }
  ]
};

export default function MartialArtsTraining({ discipline }) {
  const navigate = useNavigate();
  const lessons = MARTIAL_ARTS_LESSONS[discipline];
  const isBoxing = discipline === "boxing";
  const prefix = isBoxing ? "boxing" : "karate";
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "dark");
  const [completed, setCompleted] = useState(() => getCompletedLessons());
  const [xp, setXp] = useState(() => Number(localStorage.getItem(XP_KEY) || 0));
  const [quizPassed, setQuizPassed] = useState(() => { try { return JSON.parse(localStorage.getItem(QUIZ_KEY) || "{}"); } catch { return {}; } });
  const [active, setActive] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [checked, setChecked] = useState({});
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const [practiceUrl, setPracticeUrl] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reviewChecks, setReviewChecks] = useState([false, false, false]);
  const [quizMessage, setQuizMessage] = useState("");
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const liveVideoRef = useRef(null);

  useEffect(() => { localStorage.setItem(THEME_KEY, theme); }, [theme]);
  useEffect(() => { if (recording && stream && liveVideoRef.current) liveVideoRef.current.srcObject = stream; }, [recording, stream]);
  useEffect(() => {
    const refresh = () => setCompleted(getCompletedLessons());
    window.addEventListener("skillsensai-progress-updated", refresh);
    return () => window.removeEventListener("skillsensai-progress-updated", refresh);
  }, []);
  useEffect(() => () => { if (stream) stream.getTracks().forEach(t => t.stop()); if (practiceUrl.startsWith("blob:")) URL.revokeObjectURL(practiceUrl); }, [stream, practiceUrl]);

  const doneCount = lessons.filter(l => completed.includes(l.id)).length;
  const currentIndex = active ? lessons.findIndex(l => l.id === active.id) : -1;
  const isUnlocked = index => index === 0 || lessons.slice(0, index).every(l => completed.includes(l.id));
  const selectLesson = lesson => { setActive(lesson); setAnswer(null); setChecked({}); setFeedback(""); setQuizMessage(""); setPracticeUrl(""); setPracticeName(""); setReviewChecks([false,false,false]); };
  const addXP = amount => { const next = Number(localStorage.getItem(XP_KEY) || 0) + amount; localStorage.setItem(XP_KEY, String(next)); setXp(next); };
  const submitQuiz = () => {
    if (answer === null) { setQuizMessage("Choose an answer first."); return; }
    if (answer === active.correct) {
      if (!quizPassed[active.id]) { const next = { ...quizPassed, [active.id]: true }; setQuizPassed(next); localStorage.setItem(QUIZ_KEY, JSON.stringify(next)); addXP(10); }
      setQuizMessage("Correct! +10 XP. You can now complete the practice steps.");
    } else setQuizMessage("Not quite. Review the demonstration and try again.");
  };
  const markComplete = () => {
    const checklistDone = active.steps.every((_, i) => checked[i]);
    if (!quizPassed[active.id]) { setFeedback("Answer the lesson question correctly to complete this lesson."); return; }
    if (!checklistDone) { setFeedback("Tick each practice checkpoint after trying it, then complete the lesson."); return; }
    if (!completed.includes(active.id)) { completeLesson(active.id); setCompleted(getCompletedLessons()); addXP(25); setFeedback("Lesson complete! +25 XP earned. The next lesson is unlocked."); }
    else setFeedback("Lesson already completed. Revisit it anytime to practise again.");
  };
  const startRecording = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(media); chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = () => { const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" }); const url = URL.createObjectURL(blob); setPracticeUrl(url); setPracticeName("Live practice recording"); setFeedback("Recording ready. Review your clip and complete the self-review checklist below. Automatic pose-based AI scoring is not connected yet."); media.getTracks().forEach(t => t.stop()); setStream(null); setRecording(false); };
      setStream(media); if (liveVideoRef.current) liveVideoRef.current.srcObject = media; recorderRef.current = recorder; recorder.start(); setRecording(true); setFeedback("Recording live. Match your stance to the guide and practise slowly in a clear space.");
    } catch { setFeedback("Camera access failed. Allow camera permission or upload a practice video instead."); }
  };
  const stopRecording = () => { if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop(); };
  const chooseUpload = e => { const file = e.target.files?.[0]; if (!file) return; if (!file.type.startsWith("video/")) { setFeedback("Please select a video file."); return; } if (practiceUrl.startsWith("blob:")) URL.revokeObjectURL(practiceUrl); const url = URL.createObjectURL(file); setPracticeUrl(url); setPracticeName(file.name); setFeedback("Video loaded. Review it against the checkpoints below. Automatic pose-based AI scoring is not connected yet."); setReviewChecks([false,false,false]); };
  const reviewPractice = () => { const count = reviewChecks.filter(Boolean).length; setFeedback(`Self-review: ${count}/3 checkpoints marked. ${count === 3 ? "Great job checking stance, control and guard recovery." : "Rewatch your clip and focus on the unchecked checkpoints."} This is a guided self-review, not an automated AI movement score.`); };

  return <div className={`martial-training ${theme === "light" ? "theme-light" : "theme-dark"} ${prefix}-training`}>
    <header className="mt-header"><button className="mt-ghost" onClick={() => navigate("/martial-arts")}><ArrowLeft size={18}/> Martial Arts</button><div className="mt-brand"><span className="mt-brand-icon">{isBoxing ? "🥊" : "🥋"}</span><span>SkillSensAI <small>{isBoxing ? "BOXING DOJO" : "KARATE DOJO"}</small></span></div><div className="mt-stats"><span className="mt-xp"><Sparkles size={16}/> {xp} XP</span><span className="mt-streak"><Flame size={16}/> {doneCount} / 3</span><button className="mt-theme" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}</button></div></header>
    <main className="mt-layout"><section className="mt-main"><div className="mt-welcome"><div className="mt-eyebrow">YOUR TRAINING PATH</div><h1>Level up your <span>{isBoxing ? "boxing" : "karate"}</span></h1><p>Watch a demo, learn the technique, answer a quick question, then practise and earn XP.</p><div className="mt-progress-head"><strong>Beginner journey</strong><span>{doneCount} of {lessons.length} lessons</span></div><div className="mt-progress-track"><div style={{width: `${doneCount / lessons.length * 100}%`}}/></div></div>
    <div className="mt-path">{lessons.map((lesson, i) => { const done = completed.includes(lesson.id); const unlocked = isUnlocked(i); return <div className={`mt-path-row ${i % 2 ? "offset" : ""}`} key={lesson.id}><div className="mt-path-node-wrap"><button className={`mt-path-node ${done ? "done" : ""} ${active?.id === lesson.id ? "selected" : ""}`} disabled={!unlocked} onClick={() => navigate(`/martial-arts/${discipline}/lesson/${lesson.id}`)} aria-label={lesson.title}>{done ? <CheckCircle2/> : unlocked ? <span>{i + 1}</span> : <LockKeyhole/>}</button><span className="mt-node-label">{done ? "COMPLETED" : unlocked ? `+${35} XP` : "LOCKED"}</span></div><button className={`mt-path-card ${active?.id === lesson.id ? "active" : ""}`} disabled={!unlocked} onClick={() => navigate(`/martial-arts/${discipline}/lesson/${lesson.id}`)}><div><span className="mt-card-kicker">LESSON {i + 1}</span><h3>{lesson.title}</h3><p>{lesson.description}</p></div><span className="mt-card-play">{done ? "Review" : unlocked ? "Start lesson →" : <LockKeyhole size={16}/>}</span></button></div>; })}</div>
    </section><aside className="mt-sidebar"><section className="mt-side-card mt-reward-card"><div className="mt-reward-icon"><Trophy size={25}/></div><div><span className="mt-card-kicker">YOUR REWARDS</span><h3>{xp} XP</h3><p>10 XP for each correct quiz · 25 XP per completed lesson</p></div></section><section className="mt-side-card"><h3><Flame size={18}/> Training rules</h3><ul><li>Warm up before practising.</li><li>Use an open, clear space.</li><li>Move slowly before adding speed.</li><li>Stop if you feel pain or dizziness.</li></ul></section><section className="mt-side-card"><h3><Camera size={18}/> Practice studio</h3><p>Record yourself with a stance guide overlay or upload a saved clip for self-review.</p><button className="mt-primary mt-full" onClick={()=>navigate(`/martial-arts/${discipline}/lesson/${lessons.find(l => isUnlocked(lessons.indexOf(l)))?.id}`)}>Open practice studio</button></section></aside>
    </main>
  </div>;
}
