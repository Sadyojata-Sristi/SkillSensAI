import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, ChevronRight, Music2, Save, Settings2, ShieldCheck, SlidersHorizontal } from "lucide-react";
import "./WorkspacePages.css";

export default function Settings() {
  const navigate = useNavigate();
  const [saveProgress, setSaveProgress] = useState(() => { try { return localStorage.getItem("skillsensai-save-music-progress") !== "false"; } catch { return true; } });
  const [level, setLevel] = useState(() => { try { return localStorage.getItem("skillsensai-music-level") || "beginner"; } catch { return "beginner"; } });
  const [saved, setSaved] = useState(false);

  function saveSettings() {
    try {
      localStorage.setItem("skillsensai-save-music-progress", String(saveProgress));
      localStorage.setItem("skillsensai-music-level", level);
      window.dispatchEvent(new Event("skillsensai-settings-updated"));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch {
      setSaved(false);
    }
  }

  return (
    <main className="workspace-page">
      <div className="workspace-hero workspace-hero-compact">
        <div className="workspace-eyebrow"><Settings2 size={14} /> PERSONALISE YOUR EXPERIENCE</div>
        <h1>Make SkillSensAI <span>work for you.</span></h1>
        <p>Adjust your music coaching preferences. These settings are stored in this browser on this device.</p>
      </div>

      <section className="workspace-settings-card">
        <div className="workspace-settings-title"><span className="workspace-stat-icon violet"><SlidersHorizontal size={19} /></span><div><h2>Practice preferences</h2><p>Choose how your music learning sessions behave.</p></div></div>
        <div className="workspace-setting-row"><div className="workspace-setting-copy"><strong>Save practice progress</strong><p>Keep your singing assessment history on this device so you can compare previous attempts.</p></div><button type="button" role="switch" aria-checked={saveProgress} className={`workspace-switch${saveProgress ? " is-on" : ""}`} onClick={() => setSaveProgress(value => !value)}><span /></button></div>
        <div className="workspace-setting-row"><div className="workspace-setting-copy"><strong>Starting coaching level</strong><p>Used to tailor exercise suggestions in the music practice flow.</p></div><div className="workspace-level-options">{[{ value: "beginner", label: "Beginner" }, { value: "intermediate", label: "Intermediate" }, { value: "advanced", label: "Advanced" }].map(option => <button type="button" key={option.value} className={level === option.value ? "is-selected" : ""} onClick={() => setLevel(option.value)}>{option.label}</button>)}</div></div>
        <div className="workspace-settings-actions"><span className="workspace-local-note"><ShieldCheck size={14} /> Saved locally in your browser</span><button className="workspace-primary" onClick={saveSettings}>{saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save preferences</>}</button></div>
      </section>

      <section className="workspace-settings-card workspace-shortcuts-card">
        <div className="workspace-settings-title"><span className="workspace-stat-icon blue"><Music2 size={19} /></span><div><h2>Quick access</h2><p>Jump straight into a learning activity.</p></div></div>
        <button className="workspace-shortcut" onClick={() => navigate("/music/upload-song")}><span><strong>Song practice & AI report</strong><small>Upload a song, practise and review feedback</small></span><ChevronRight size={18} /></button>
        <button className="workspace-shortcut" onClick={() => navigate("/music/learn")}><span><strong>Learn music from scratch</strong><small>Continue through structured lessons</small></span><ChevronRight size={18} /></button>
        <button className="workspace-shortcut" onClick={() => navigate("/martial-arts")}><span><strong>Martial arts studio</strong><small>Explore boxing and karate learning paths</small></span><ChevronRight size={18} /></button>
      </section>
    </main>
  );
}
