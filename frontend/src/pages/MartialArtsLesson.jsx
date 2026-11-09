import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Camera, CheckCircle2, Play, Sparkles, Upload, X } from "lucide-react";
import { completeLesson, getCompletedLessons } from "../utils/progress";
import { MARTIAL_ARTS_LESSONS } from "./MartialArtsTraining";
import "./MartialArtsLesson.css";

const THEME_KEY = "skillsensai_martial_theme";
const XP_KEY = "skillsensai_martial_xp";
const QUIZ_KEY = "skillsensai_martial_quiz_passed";

export default function MartialArtsLesson({ discipline }) {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const lesson = (MARTIAL_ARTS_LESSONS[discipline] || []).find(item => item.id === lessonId);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "dark");
  const [xp, setXp] = useState(() => Number(localStorage.getItem(XP_KEY) || 0));
  const [completed, setCompleted] = useState(() => getCompletedLessons());
  const [quizPassed, setQuizPassed] = useState(() => { try { return JSON.parse(localStorage.getItem(QUIZ_KEY) || "{}"); } catch { return {}; } });
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

  useEffect(() => { localStorage.setItem(THEME_KEY, theme); }, [theme]);
  useEffect(() => { if (recording && stream && videoRef.current) videoRef.current.srcObject = stream; }, [recording, stream]);
  useEffect(() => () => { if (stream) stream.getTracks().forEach(track => track.stop()); if (practiceUrl.startsWith("blob:")) URL.revokeObjectURL(practiceUrl); }, [stream, practiceUrl]);

  if (!lesson) return <div className={`martial-lesson-page ${theme === "light" ? "theme-light" : "theme-dark"}`}><button className="ml-button" onClick={() => navigate(`/martial-arts/${discipline}`)}><ArrowLeft size={18}/> Back to lessons</button><h1>Lesson not found</h1></div>;

  const addXP = amount => { const next = Number(localStorage.getItem(XP_KEY) || 0) + amount; localStorage.setItem(XP_KEY, String(next)); setXp(next); };
  const submitQuiz = () => {
    if (answer === null) { setQuizMessage("Choose an answer first."); return; }
    if (answer === lesson.correct) {
      if (!quizPassed[lesson.id]) { const next = { ...quizPassed, [lesson.id]: true }; setQuizPassed(next); localStorage.setItem(QUIZ_KEY, JSON.stringify(next)); addXP(10); }
      setQuizMessage("Correct! +10 XP. Continue to the practice checkpoints.");
    } else setQuizMessage("Not quite. Review the lesson steps and try again.");
  };
  const startRecording = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(media); chunksRef.current = [];
      recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => { const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" }); setPracticeUrl(URL.createObjectURL(blob)); setPracticeName("Live practice recording"); setFeedback("Recording ready. Compare your movement with the guide and review the checkpoints below. Automated AI pose scoring is not connected yet."); media.getTracks().forEach(track => track.stop()); setStream(null); setRecording(false); };
      setStream(media); if (videoRef.current) videoRef.current.srcObject = media; recorderRef.current = recorder; recorder.start(); setRecording(true); setFeedback("Recording live. Match the guide as closely as comfortable and move slowly in a clear space.");
    } catch { setFeedback("Camera access failed. Allow camera permission or upload a practice video instead."); }
  };
  const stopRecording = () => { if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop(); };
  const uploadPractice = event => { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith("video/")) { setFeedback("Please select a video file."); return; } if (practiceUrl.startsWith("blob:")) URL.revokeObjectURL(practiceUrl); setPracticeUrl(URL.createObjectURL(file)); setPracticeName(file.name); setReview([false, false, false]); setFeedback("Video loaded. Review it against the checkpoints below. This is guided self-review, not automatic AI scoring."); };
  const reviewPractice = () => { const count = review.filter(Boolean).length; setFeedback(`Self-review: ${count}/3 checkpoints marked. ${count === 3 ? "Great work reviewing your movement." : "Rewatch your clip and focus on the unchecked checkpoints."} This is not an automated AI movement score.`); };
  const markComplete = () => {
    if (!quizPassed[lesson.id]) { setFeedback("Answer the lesson question correctly before completing this lesson."); return; }
    if (!lesson.steps.every((_, index) => checks[index])) { setFeedback("Tick each technique checkpoint after practising it."); return; }
    if (!completed.includes(lesson.id)) { completeLesson(lesson.id); setCompleted(getCompletedLessons()); addXP(25); setFeedback("Lesson complete! +25 XP earned. The next lesson is now unlocked."); }
    else setFeedback("Lesson already completed. You can revisit it anytime.");
  };

  return <div className={`martial-lesson-page ${theme === "light" ? "theme-light" : "theme-dark"} ${discipline === "boxing" ? "ml-boxing" : "ml-karate"}`}>
    <header className="ml-header"><button className="ml-button" onClick={() => navigate(`/martial-arts/${discipline}`)}><ArrowLeft size={18}/> Lesson path</button><div className="ml-brand">{discipline === "boxing" ? "🥊 BOXING DOJO" : "🥋 KARATE DOJO"}</div><div className="ml-header-right"><span className="ml-xp"><Sparkles size={16}/> {xp} XP</span><button className="ml-button" onClick={() => setTheme(current => current === "dark" ? "light" : "dark")}>{theme === "dark" ? "☀ Light" : "☾ Dark"}</button></div></header>
    <main className="ml-content"><div className="ml-lesson-heading"><span className="ml-eyebrow">TECHNIQUE LESSON</span><h1>{lesson.title}</h1><p>{lesson.description}</p></div>
      <section className="ml-section"><h2><Play size={19}/> 1. Watch the demonstration</h2><video className="ml-demo" controls playsInline preload="metadata" src={lesson.video}>Your browser does not support video playback.</video><p className="ml-muted">Watch once before practising. Move slowly, use a clear space and avoid striking another person.</p></section>
      <section className="ml-section"><h2><BookOpen size={19}/> 2. Learn the technique</h2>{lesson.steps.map((step, index) => <label className="ml-check" key={step}><input type="checkbox" checked={Boolean(checks[index])} onChange={event => setChecks(old => ({ ...old, [index]: event.target.checked }))}/><span><b>{index + 1}.</b> {step}</span></label>)}</section>
      <section className="ml-section"><div className="ml-quiz-title"><h2>3. Quick question</h2><span>+10 XP</span></div><h3>{lesson.question}</h3><div className="ml-answers">{lesson.answers.map((item, index) => <button key={item} className={`ml-answer ${answer === index ? "selected" : ""}`} onClick={() => setAnswer(index)}>{String.fromCharCode(65 + index)}. {item}</button>)}</div><button className="ml-primary" onClick={submitQuiz}>Check answer</button>{quizMessage && <p className="ml-feedback">{quizMessage}</p>}</section>
      <section className="ml-section"><h2><Camera size={19}/> 4. Practise your movement</h2><p className="ml-muted">Record yourself with a reference guide or upload a saved clip. The guide is a visual reference, not a live pose match.</p><div className="ml-practice-grid"><div className="ml-camera">{recording ? <><video ref={videoRef} autoPlay muted playsInline className="ml-camera-video"/><div className="ml-guide" aria-hidden="true"><svg viewBox="0 0 220 360"><circle cx="110" cy="48" r="24"/><path d="M110 73 L110 180 M110 100 L65 145 L45 118 M110 100 L155 145 L176 118 M110 180 L78 255 L70 330 M110 180 L145 255 L155 330"/></svg><span>REFERENCE STANCE</span></div></> : practiceUrl ? <video src={practiceUrl} controls playsInline className="ml-camera-video"/> : <div className="ml-camera-empty"><Camera size={36}/><b>Practice preview</b><span>Start a recording or upload your own video.</span></div>}</div><div className="ml-practice-controls"><h3>Record or upload</h3><div className="ml-actions">{!recording ? <button className="ml-primary" onClick={startRecording}><Camera size={17}/> Record live</button> : <button className="ml-danger" onClick={stopRecording}><X size={17}/> Stop recording</button>}<label className="ml-secondary"><Upload size={17}/> Upload video<input hidden type="file" accept="video/*" onChange={uploadPractice}/></label></div>{practiceName && <p className="ml-file">Selected: {practiceName}</p>}{practiceUrl && <><h4>Self-review checklist</h4>{["I kept a stable stance and balance.", "I performed the movement with control.", "I returned to a safe guard or ready position."].map((text, index) => <label className="ml-check" key={text}><input type="checkbox" checked={review[index]} onChange={event => setReview(old => old.map((value, i) => i === index ? event.target.checked : value))}/><span>{text}</span></label>)}<button className="ml-secondary" onClick={reviewPractice}>Review my practice</button></>}</div></div>{feedback && <p className="ml-feedback">{feedback}</p>}<p className="ml-disclaimer">Practice feedback currently uses your checklist. Automatic AI pose detection and technique scoring are not connected yet.</p></section>
      <footer className="ml-footer"><button className="ml-secondary" onClick={() => navigate(`/martial-arts/${discipline}`)}>Back to lesson path</button><button className="ml-primary" onClick={markComplete} disabled={completed.includes(lesson.id)}>{completed.includes(lesson.id) ? <><CheckCircle2 size={17}/> Completed</> : "Complete lesson · +25 XP"}</button></footer>
    </main>
  </div>;
}
