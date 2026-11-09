import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Play,
  CheckCircle,
  Swords,
  Video,
  Upload,
  Camera,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  completeLesson,
  isLessonCompleted,
  getCompletedLessons,
} from "../utils/progress";
import "./Boxing.css";

const BOXING_LESSONS = [
  {
    id: "boxing-lesson-1",
    title: "Lesson 1 — Boxing Basics",
    description: "Watch the first demonstration and focus on stance, balance, and keeping your guard up.",
    video: "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794245428/b1.mp4",
    steps: ["Stand with feet comfortably staggered.", "Keep knees relaxed and chin slightly tucked.", "Keep both hands up and return to guard after each movement."],
  },
  {
    id: "boxing-lesson-2",
    title: "Lesson 2 — Basic Technique",
    description: "Follow the second demonstration slowly, paying attention to controlled movement and returning to a balanced stance.",
    video: "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794245676/b2.mp4",
    steps: ["Warm up your shoulders and wrists first.", "Move slowly before increasing speed.", "Keep your balance and avoid locking your joints."],
  },
  {
    id: "boxing-lesson-3",
    title: "Lesson 3 — Practice and Control",
    description: "Use the third demonstration to practise smooth, controlled technique without a training partner.",
    video: "https://res.cloudinary.com/r5v9dk9w/video/upload/v1794245522/b3.mp4",
    steps: ["Review the demonstration once before practising.", "Repeat the movement slowly with control.", "Finish each repetition in a stable guard position."],
  },
];

function Boxing() {
  const navigate = useNavigate();
  const [completedLessons, setCompletedLessons] = useState(getCompletedLessons());
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState({});
  const [videoFile, setVideoFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const refresh = () => setCompletedLessons(getCompletedLessons());
    window.addEventListener("skillsensai-progress-updated", refresh);
    return () => window.removeEventListener("skillsensai-progress-updated", refresh);
  }, []);

  const completedCount = BOXING_LESSONS.filter((lesson) => completedLessons.includes(lesson.id)).length;

  const markComplete = (lessonId) => {
    const newlyCompleted = completeLesson(lessonId);
    setCompletedLessons(getCompletedLessons());
    setMessage(newlyCompleted ? "Lesson completed! Your progress has been saved." : "This lesson is already completed.");
  };

  const startRecording = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const mediaRecorder = new MediaRecorder(media);
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setVideoFile(new File([blob], "boxing-practice.webm", { type: "video/webm" }));
        media.getTracks().forEach((track) => track.stop());
        setStream(null);
      };
      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setStream(media);
      setIsRecording(true);
      setMessage("Recording started. Practise in a clear, safe space.");
    } catch (error) {
      setMessage("Camera access failed. Allow camera permission or upload a practice video.");
    }
  };

  const stopRecording = () => {
    if (recorder && recorder.state !== "inactive") recorder.stop();
    if (stream) stream.getTracks().forEach((track) => track.stop());
    setRecorder(null);
    setStream(null);
    setIsRecording(false);
    setMessage("Recording finished. Your practice video is ready to review.");
  };

  return (
    <div className="boxing-page">
      <header className="boxing-header">
        <div className="boxing-logo"><span>Skill</span><span>SensAI</span></div>
        <button className="boxing-back" onClick={() => navigate("/martial-arts")}><ArrowLeft size={18} /> Back to Martial Arts</button>
      </header>

      <section className="boxing-hero">
        <h1>Boxing <span>Training</span></h1>
        <p>Learn the basics through video demonstrations, practise safely, and save your lesson progress.</p>
      </section>

      <main className="boxing-content">
        <section className="boxing-progress">
          <strong>{completedCount} / {BOXING_LESSONS.length}</strong><span>lessons completed</span>
          <div style={{ height: 7, background: "#172033", borderRadius: 99, marginTop: 14, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${completedCount / BOXING_LESSONS.length * 100}%`, background: "#ef4444", transition: "width .2s" }} />
          </div>
        </section>

        <section className="boxing-lessons">
          {BOXING_LESSONS.map((lesson, index) => {
            const completed = completedLessons.includes(lesson.id);
            return <article className="boxing-lesson-card" key={lesson.id}>
              <div className="boxing-lesson-info">
                <div className="boxing-lesson-number">{completed ? <CheckCircle size={22} /> : index + 1}</div>
                <div><h3>{lesson.title}</h3><p>{lesson.description}</p>{completed && <span className="boxing-completed">✓ Completed</span>}</div>
              </div>
              <button className="boxing-lesson-button" onClick={() => { setSelectedLesson(lesson); setCheckedSteps({}); }}><Play size={16} /> {completed ? "Review lesson" : "Open lesson"}</button>
            </article>;
          })}
        </section>

        {selectedLesson && <section className="boxing-lesson-viewer">
          <h2>{selectedLesson.title}</h2>
          <p>{selectedLesson.description}</p>
          <video className="boxing-video" controls playsInline preload="metadata" src={selectedLesson.video}>
            Your browser does not support video playback.
          </video>
          <h3>Practice checklist</h3>
          <p>Tick each step as you practise. Train slowly, avoid striking people or hard surfaces, and stop if you feel pain.</p>
          {selectedLesson.steps.map((step, index) => <label key={step} style={{ display: "flex", gap: 10, alignItems: "flex-start", margin: "12px 0", color: "#cbd5e1" }}>
            <input type="checkbox" checked={Boolean(checkedSteps[index])} onChange={(event) => setCheckedSteps((old) => ({ ...old, [index]: event.target.checked }))} />{step}
          </label>)}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="boxing-complete-button" onClick={() => markComplete(selectedLesson.id)} disabled={completedLessons.includes(selectedLesson.id)}>{completedLessons.includes(selectedLesson.id) ? "Lesson Completed" : "Mark Lesson Complete"}</button>
            <button className="boxing-action-button" onClick={() => setSelectedLesson(null)}>Close lesson</button>
          </div>
        </section>}

        <section className="boxing-practice">
          <div className="boxing-practice-card">
            <h3><Video size={20} /> Practise your technique</h3>
            <p>Record a practice clip or upload a video to review your movement. Automated AI movement scoring is not connected by this page yet.</p>
            <div className="boxing-action-row">
              {!isRecording ? <button className="boxing-action-button primary" onClick={startRecording}><Camera size={18} /> Record live video</button> : <button className="boxing-action-button recording" onClick={stopRecording}><Camera size={18} /> Stop recording</button>}
              <label className="boxing-action-button"><Upload size={18} /> Upload video<input className="boxing-upload" type="file" accept="video/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) { setVideoFile(file); setMessage(`Selected practice video: ${file.name}`); } }} /></label>
            </div>
            {videoFile && <p>Practice clip ready: <strong>{videoFile.name}</strong></p>}
          </div>
          <div className="boxing-practice-card">
            <h3><BookOpen size={20} /> Training tip</h3>
            <p>Prioritise balance, relaxed shoulders, a protected chin, and controlled movements. Learn the technique before trying to move faster.</p>
          </div>
        </section>
        {message && <div className="boxing-message" role="status">{message}</div>}
      </main>
    </div>
  );
}

export default Boxing;
