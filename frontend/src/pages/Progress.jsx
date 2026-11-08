import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ArrowRight, CalendarDays, Music2, RefreshCw, Target, Trophy } from "lucide-react";
import { getLessonsLearned, getCompletedLessons } from "../utils/progress";
import "./WorkspacePages.css";

function readHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem("skillsensai-music-progress-history") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export default function Progress() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState(() => { try { return getLessonsLearned(); } catch { return 0; } });
  const [boxingLessons, setBoxingLessons] = useState(() => { try { return getCompletedLessons().length; } catch { return 0; } });
  const [history, setHistory] = useState(readHistory);

  useEffect(() => {
    const refresh = () => {
      try { setLessons(getLessonsLearned()); } catch { setLessons(0); }
      try { setBoxingLessons(getCompletedLessons().length); } catch { setBoxingLessons(0); }
      setHistory(readHistory());
    };
    window.addEventListener("skillsensai-progress-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("skillsensai-progress-updated", refresh); window.removeEventListener("storage", refresh); };
  }, []);

  const validHistory = history.filter(item => Number.isFinite(Number(item?.overall_score)));
  const latest = validHistory[0];
  const average = validHistory.length ? Math.round(validHistory.reduce((sum, item) => sum + Number(item.overall_score), 0) / validHistory.length) : null;

  return (
    <main className="workspace-page">
      <div className="workspace-hero">
        <div className="workspace-eyebrow"><Activity size={14} /> YOUR LEARNING OVERVIEW</div>
        <h1>Progress that <span>moves with you.</span></h1>
        <p>See your completed lessons and saved singing assessments in one place. Keep practising to build your personal learning streak.</p>
        <button className="workspace-primary" onClick={() => navigate("/music")}>Continue learning <ArrowRight size={17} /></button>
      </div>

      <section className="workspace-stat-grid" aria-label="Learning statistics">
        <article className="workspace-stat-card"><span className="workspace-stat-icon violet"><Music2 size={19} /></span><small>Music lessons completed</small><strong>{lessons}<em> / 6</em></strong><div className="workspace-progress-track"><span style={{ width: `${Math.min(100, lessons / 6 * 100)}%` }} /></div></article>
        <article className="workspace-stat-card"><span className="workspace-stat-icon blue"><Target size={19} /></span><small>Martial arts lessons</small><strong>{boxingLessons}<em> completed</em></strong><p>Boxing lesson progress saved on this device.</p></article>
        <article className="workspace-stat-card"><span className="workspace-stat-icon gold"><Trophy size={19} /></span><small>Saved singing sessions</small><strong>{validHistory.length}</strong><p>{average === null ? "Your first saved score will appear here." : `Average score: ${average}/100`}</p></article>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading"><div><span className="workspace-eyebrow">RECENT PRACTICE</span><h2>Your singing reports</h2></div><button className="workspace-subtle-button" onClick={() => setHistory(readHistory())}><RefreshCw size={14} /> Refresh</button></div>
        {validHistory.length ? <div className="workspace-history-list">{validHistory.slice(0, 8).map((item, index) => <article className="workspace-history-row" key={`${item.date || "session"}-${index}`}><span className="workspace-history-icon"><Music2 size={18} /></span><div className="workspace-history-info"><strong>{item.song || "Singing practice"}</strong><small><CalendarDays size={12} /> {item.date ? new Date(item.date).toLocaleString() : "Date not available"} · {item.level || "Practice"}</small></div><div className="workspace-history-score"><strong>{Math.round(Number(item.overall_score))}</strong><small>/100</small></div></article>)}</div> : <div className="workspace-empty"><span className="workspace-empty-icon"><Trophy size={24} /></span><h3>Your progress starts with one practice.</h3><p>Complete a song analysis and save your result. Your recent sessions will appear here when progress saving is enabled.</p><button className="workspace-primary" onClick={() => navigate("/music/upload-song")}>Start song practice <ArrowRight size={16} /></button></div>}
      </section>
    </main>
  );
}
