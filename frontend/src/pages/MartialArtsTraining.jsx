import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Camera, Upload, Sun, Moon, Trophy, Flame, LockKeyhole, Play, X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { completeLesson, getCompletedLessons } from "../utils/progress";
import "./MartialArtsTraining.css";

const THEME_KEY = "skillsensai_martial_theme";
const XP_KEY = "skillsensai_martial_xp";
const QUIZ_KEY = "skillsensai_martial_quiz_passed";

const LESSONS = {
  boxing: [
    { id: "boxing-lesson-1", title: "Boxing stance & jab", short: "Jab basics", description: "Learn a balanced stance and practise a controlled jab, returning to guard each time.", video: "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794245428/b1.mp4", steps: ["Stand in a comfortable staggered stance with knees relaxed.", "Keep your chin slightly tucked and your other hand near your cheek.", "Extend the lead hand smoothly without locking the elbow.", "Return the hand to guard and regain balance."], question: "After a jab, where should your lead hand return?", answers: ["Stay fully extended", "Return to guard", "Drop beside your hip"], correct: 1, cue: "A safe jab returns to guard with balance maintained." },
    { id: "boxing-lesson-2", title: "Guard & footwork", short: "Guard & movement", description: "Practise keeping your hands protecting your head while moving in a controlled way.", video: "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794245676/b2.mp4", steps: ["Keep your hands up without tensing your shoulders.", "Take small, balanced steps rather than crossing your feet.", "Keep your eyes forward and knees soft.", "Pause and check your balance before repeating."], question: "What should you avoid when moving in stance?", answers: ["Small balanced steps", "Crossing your feet", "Keeping your guard up"], correct: 1, cue: "Crossing your feet can compromise balance." },
    { id: "boxing-lesson-3", title: "Controlled combinations", short: "Combinations", description: "Link simple movements with control and finish each repetition in a stable guard.", video: "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794245522/b3.mp4", steps: ["Warm up shoulders and wrists first.", "Begin slowly and use comfortable range of motion.", "Keep your non-punching hand protecting your face.", "Finish balanced and reset before the next repetition."], question: "What matters most when learning a new combination?", answers: ["Maximum speed first", "Control and balance", "Locking your joints"], correct: 1, cue: "Build control before increasing speed." }
  ],
  karate: [
    { id: "karate-lesson-1", title: "Karate stance", short: "Stance & balance", description: "Learn a stable stance, relaxed posture and balanced body positioning.", video: "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794246003/k1.mp4", steps: ["Place your feet in a comfortable, stable stance.", "Keep knees soft and spine tall.", "Distribute your weight so you can move without wobbling.", "Practise slowly and stop if anything hurts."], question: "What helps maintain a stable karate stance?", answers: ["Locked knees", "Balanced weight and soft knees", "Leaning as far as possible"], correct: 1, cue: "A balanced stance keeps your weight controlled and knees relaxed." },
    { id: "karate-lesson-2", title: "Basic guard", short: "Guard position", description: "Practise a protective guard and return to it after each controlled movement.", video: "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794246016/k2.mp4", steps: ["Keep your hands in a comfortable protective position.", "Relax your shoulders and keep your chin neutral.", "Keep your elbows controlled and posture upright.", "Return to guard after every repetition."], question: "After a technique, what should you do with your guard?", answers: ["Let both hands drop", "Return to a protective position", "Turn away from the target"], correct: 1, cue: "Resetting your guard helps you stay protected and ready." },
    { id: "karate-lesson-3", title: "Basic punch", short: "Controlled punch", description: "Learn the movement slowly and prioritise alignment, control and a safe return to guard.", video: "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794245673/k3.mp4", steps: ["Start from a stable stance and protective guard.", "Extend the arm in a controlled straight line.", "Do not forcefully lock the elbow at extension.", "Return to guard and reset your balance."], question: "What is the safest way to practise a new punch?", answers: ["Slowly with control", "As hard as possible against a wall", "With the elbow locked"], correct: 0, cue: "Practise slowly in open space; never strike hard surfaces." }
  ]
};

export default function MartialArtsTraining({ discipline }) {
  const navigate = useNavigate();
  const lessons = LESSONS[discipline];
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
    <div className="mt-path">{lessons.map((lesson, i) => { const done = completed.includes(lesson.id); const unlocked = isUnlocked(i); return <div className={`mt-path-row ${i % 2 ? "offset" : ""}`} key={lesson.id}><div className="mt-path-node-wrap"><button className={`mt-path-node ${done ? "done" : ""} ${active?.id === lesson.id ? "selected" : ""}`} disabled={!unlocked} onClick={() => selectLesson(lesson)} aria-label={lesson.title}>{done ? <CheckCircle2/> : unlocked ? <span>{i + 1}</span> : <LockKeyhole/>}</button><span className="mt-node-label">{done ? "COMPLETED" : unlocked ? `+${35} XP` : "LOCKED"}</span></div><button className={`mt-path-card ${active?.id === lesson.id ? "active" : ""}`} disabled={!unlocked} onClick={() => selectLesson(lesson)}><div><span className="mt-card-kicker">LESSON {i + 1}</span><h3>{lesson.title}</h3><p>{lesson.description}</p></div><span className="mt-card-play">{done ? "Review" : unlocked ? "Start lesson →" : <LockKeyhole size={16}/>}</span></button></div>; })}</div>
    {active && <section className="mt-lesson-panel" id="active-lesson"><div className="mt-panel-top"><div><span className="mt-card-kicker">LESSON {currentIndex + 1} · +35 XP</span><h2>{active.title}</h2><p>{active.description}</p></div><button className="mt-icon-btn" onClick={() => setActive(null)} aria-label="Close lesson"><X size={19}/></button></div><div className="mt-demo-grid"><div><h3><Play size={17}/> Demonstration</h3><video className="mt-demo-video" controls playsInline preload="metadata" src={active.video}>Your browser does not support video playback.</video><p className="mt-small-note">Watch the movement first, then practise slowly with control.</p></div><div className="mt-steps"><h3><BookOpen size={17}/> Technique checkpoints</h3>{active.steps.map((step,i)=><label className="mt-check-row" key={step}><input type="checkbox" checked={Boolean(checked[i])} onChange={e=>setChecked(old=>({...old,[i]:e.target.checked}))}/><span>{step}</span></label>)}</div></div><div className="mt-quiz"><div className="mt-quiz-heading"><span className="mt-quiz-badge">QUICK QUIZ</span><strong>Earn 10 XP</strong></div><h3>{active.question}</h3><div className="mt-answer-list">{active.answers.map((a,i)=><button key={a} className={`mt-answer ${answer===i?"chosen":""} ${quizPassed[active.id] && i===active.correct?"right":""}`} onClick={()=>setAnswer(i)}>{String.fromCharCode(65+i)}. {a}</button>)}</div><button className="mt-primary" onClick={submitQuiz}>Check answer</button>{quizMessage&&<p className={`mt-feedback ${quizMessage.startsWith("Correct")?"good":""}`}>{quizMessage}</p>}</div><div className="mt-complete-row"><button className="mt-primary" onClick={markComplete} disabled={completed.includes(active.id)}>{completed.includes(active.id)?<><CheckCircle2 size={18}/> Lesson completed</>:<>Complete lesson · +25 XP</>}</button>{feedback&&<p className="mt-feedback">{feedback}</p>}</div></section>}
    </section><aside className="mt-sidebar"><section className="mt-side-card mt-reward-card"><div className="mt-reward-icon"><Trophy size={25}/></div><div><span className="mt-card-kicker">YOUR REWARDS</span><h3>{xp} XP</h3><p>10 XP for each correct quiz · 25 XP per completed lesson</p></div></section><section className="mt-side-card"><h3><Flame size={18}/> Training rules</h3><ul><li>Warm up before practising.</li><li>Use an open, clear space.</li><li>Move slowly before adding speed.</li><li>Stop if you feel pain or dizziness.</li></ul></section><section className="mt-side-card"><h3><Camera size={18}/> Practice studio</h3><p>Record yourself with a stance guide overlay or upload a saved clip for self-review.</p><button className="mt-primary mt-full" onClick={()=>document.getElementById("mt-practice-studio")?.scrollIntoView({behavior:"smooth",block:"start"})}>Open practice studio</button></section></aside>
    <section className="mt-practice-studio" id="mt-practice-studio"><div className="mt-studio-heading"><div><span className="mt-card-kicker">PRACTICE STUDIO</span><h2>Now it's your turn</h2><p>Compare your posture with the guide, then review your recording.</p></div></div><div className="mt-studio-grid"><div className="mt-camera-frame">{recording?<><video ref={liveVideoRef} autoPlay muted playsInline className="mt-live-video"/><div className="mt-pose-guide" aria-hidden="true"><svg viewBox="0 0 220 360"><circle cx="110" cy="48" r="24"/><path d="M110 73 L110 180 M110 100 L65 145 L45 118 M110 100 L155 145 L176 118 M110 180 L78 255 L70 330 M110 180 L145 255 L155 330"/></svg><span>ALIGN YOUR STANCE</span></div></>:practiceUrl?<video src={practiceUrl} controls playsInline className="mt-live-video"/>:<div className="mt-camera-placeholder"><Camera size={38}/><strong>Camera practice guide</strong><span>Start recording to see your live camera with a posture guide.</span></div>}</div><div className="mt-studio-controls"><h3>Record or upload</h3><p>Place your full body in frame where possible. The guide is a visual reference, not a personalized pose match.</p><div className="mt-studio-buttons">{!recording?<button className="mt-primary" onClick={startRecording}><Camera size={18}/> Record live</button>:<button className="mt-danger" onClick={stopRecording}><Circle size={17}/> Stop recording</button>}<label className="mt-secondary"><Upload size={18}/> Upload video<input type="file" accept="video/*" hidden onChange={chooseUpload}/></label></div>{practiceName&&<p className="mt-file-name">Selected: {practiceName}</p>}{practiceUrl&&<><h4>Self-review checklist</h4>{["I stayed balanced and kept a stable stance.","I used a controlled movement without locking joints.","I returned to a protective guard after the movement."].map((label,i)=><label className="mt-check-row" key={label}><input type="checkbox" checked={reviewChecks[i]} onChange={e=>setReviewChecks(old=>old.map((v,j)=>j===i?e.target.checked:v))}/><span>{label}</span></label>)}<button className="mt-primary" onClick={reviewPractice}>Review my practice</button></>}</div></div><p className="mt-disclaimer"><Sparkles size={15}/> Practice feedback currently uses your self-review checklist. Automatic AI pose detection and technique scoring are not connected yet.</p></section>
    </main>
  </div>;
}
