import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Activity, ArrowUpRight, House, Music2, Settings2, Shield, Swords, Trophy } from "lucide-react";
import "./AppLayout.css";

const navItems = [
  { to: "/music", label: "Music Studio", icon: Music2 },
  { to: "/martial-arts", label: "Martial Arts", icon: Swords },
  { to: "/progress", label: "My Progress", icon: Trophy },
  { to: "/settings", label: "Settings", icon: Settings2 },
];

export default function AppLayout() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <button className="app-shell-brand" onClick={() => navigate("/")} aria-label="Go to SkillSensAI home">
          <span className="app-shell-logo"><Activity size={20} strokeWidth={2.5} /></span>
          <span className="app-shell-brand-copy">
            <strong>SkillSens<span>AI</span></strong>
            <small>Learn. Practice. Improve.</small>
          </span>
        </button>

        <nav className="app-shell-nav" aria-label="Main navigation">
          <NavLink to="/" end className="app-shell-nav-link"><House size={17} /><span>Home</span></NavLink>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `app-shell-nav-link${isActive ? " is-active" : ""}`}>
              <Icon size={17} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="app-shell-home-cta" onClick={() => navigate("/")}>
          Explore skills <ArrowUpRight size={16} />
        </button>
      </header>
      <div className="app-shell-content"><Outlet /></div>
      <footer className="app-shell-footer">
        <span><Shield size={13} /> Your learning journey, your pace.</span>
        <span>SkillSensAI · Learn. Practice. Analyze. Improve.</span>
      </footer>
    </div>
  );
}
