```jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Music2,
  Swords,
  Code2,
  Palette,
  Dumbbell,
  Sparkles,
  LogIn,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase";

import {
  getLessonsLearned,
} from "../utils/progress";

import "./Home.css";
import "./LoginModal.css";


function Home() {

  const navigate = useNavigate();

  /* =========================================================
     AUTH
  ========================================================= */

  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );

    return () => unsubscribe();

  }, []);


  /* =========================================================
     LOGIN MODAL
  ========================================================= */

  const [showLogin, setShowLogin] = useState(false);


  /* =========================================================
     PROGRESS
  ========================================================= */

  const [lessonsLearned, setLessonsLearned] =
    useState(() => getLessonsLearned());


  useEffect(() => {

    const updateProgress = () => {
      setLessonsLearned(getLessonsLearned());
    };

    updateProgress();

    window.addEventListener(
      "skillsensai-progress-updated",
      updateProgress
    );

    return () => {

      window.removeEventListener(
        "skillsensai-progress-updated",
        updateProgress
      );

    };

  }, []);


  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {

    try {

      await signOut(auth);

      setShowProfile(false);

    } catch (error) {

      console.error(
        "Logout failed:",
        error
      );

    }

  };


  /* =========================================================
     SKILLS
  ========================================================= */

  const skills = [

    {
      id: "music",
      title: "Music",
      description:
        "Learn singing, pitch, rhythm and improve through AI feedback.",
      icon: <Music2 size={30} />,
      className: "skill-music",
      active: true,
      route: "/music",
    },

    {
      id: "martial-arts",
      title: "Martial Arts",
      description:
        "Learn practical martial arts techniques step by step.",
      icon: <Swords size={30} />,
      className: "skill-martial",
      active: true,
      route: "/martial-arts",
    },

    {
      id: "dance",
      title: "Dance",
      description:
        "AI-assisted movement learning and practice.",
      icon: <Dumbbell size={30} />,
      className: "skill-coming",
      active: false,
    },

    {
      id: "coding",
      title: "Coding",
      description:
        "Build practical coding skills with guided learning.",
      icon: <Code2 size={30} />,
      className: "skill-coming",
      active: false,
    },

    {
      id: "art",
      title: "Art & Creativity",
      description:
        "Develop creative skills through practical learning.",
      icon: <Palette size={30} />,
      className: "skill-coming",
      active: false,
    },

    {
      id: "more",
      title: "More Skills",
      description:
        "More skill categories are coming soon.",
      icon: <Sparkles size={30} />,
      className: "skill-coming",
      active: false,
    },

  ];


  /* =========================================================
     SKILL CLICK
  ========================================================= */

  const handleSkillClick = (skill) => {

    if (!skill.active) {

      return;

    }

    navigate(skill.route);

  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div className="home-page">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="home-navbar">

        <div
          className="home-logo"
          onClick={() => navigate("/")}
        >

          <span className="logo-skill">
            Skill
          </span>

          <span className="logo-sensai">
            SensAI
          </span>

        </div>


        <div className="home-nav-right">

          {/* PROGRESS */}

          <div className="home-progress-mini">

            <Sparkles size={15} />

            <span>
              {lessonsLearned.length} learned
            </span>

          </div>


          {/* USER */}

          {user ? (

            <div className="profile-wrapper">

              <button
                className="profile-button"
                onClick={() =>
                  setShowProfile(
                    (previous) => !previous
                  )
                }
              >

                {user.photoURL ? (

                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="profile-avatar"
                  />

                ) : (

                  <div className="profile-avatar-placeholder">
                    <User size={18} />
                  </div>

                )}

                <span className="profile-name">

                  {user.displayName ||
                    user.phoneNumber ||
                    "User"}

                </span>

                <ChevronDown
                  size={16}
                />

              </button>


              {showProfile && (

                <div className="profile-dropdown">

                  <div className="profile-dropdown-header">

                    <strong>
                      {user.displayName ||
                        "SkillSensAI User"}
                    </strong>

                    <span>
                      {user.email ||
                        user.phoneNumber ||
                        ""}
                    </span>

                  </div>


                  <button
                    className="profile-logout"
                    onClick={handleLogout}
                  >

                    <LogOut size={17} />

                    Sign Out

                  </button>

                </div>

              )}

            </div>

          ) : (

            <button
              className="home-login-button"
              onClick={() =>
                setShowLogin(true)
              }
            >

              <LogIn size={18} />

              Login

            </button>

          )}

        </div>

      </header>


      {/* =====================================================
          HERO
      ===================================================== */}

      <main className="home-main">

        <section className="home-hero">

          <div className="home-hero-content">

            <p className="home-eyebrow">
              AI-POWERED SKILL LEARNING
            </p>


            <h1>

              Learn.

              <span>
                Practice.
              </span>

              Improve.

            </h1>


            <p className="home-description">

              SkillSensAI helps you learn real-world
              skills through guided lessons, practical
              training and intelligent feedback.

            </p>


            <div className="home-hero-actions">

              {!user && (

                <button
                  className="hero-primary-button"
                  onClick={() =>
                    setShowLogin(true)
                  }
                >

                  <LogIn size={18} />

                  Start Learning

                </button>

              )}

              {user && (

                <button
                  className="hero-primary-button"
                  onClick={() =>
                    navigate("/music")
                  }
                >

                  <Music2 size={18} />

                  Continue Learning

                </button>

              )}

            </div>

          </div>


          {/* =================================================
              SAMURAI / CHARACTER
          ================================================= */}

          <div className="home-character">

            <div className="character-glow" />

            <img
              src="/samurai.png"
              alt="SkillSensAI character"
              className="samurai-image"
            />

          </div>

        </section>


        {/* =====================================================
            SKILLS
        ===================================================== */}

        <section className="skills-section">

          <div className="skills-heading">

            <p>
              EXPLORE SKILLS
            </p>

            <h2>
              Choose Your Skill
            </h2>

            <span>
              Learn at your own pace with
              SkillSensAI.
            </span>

          </div>


          <div className="skills-grid">

            {skills.map((skill) => (

              <button
                key={skill.id}
                className={`skill-card ${skill.className}`}
                onClick={() =>
                  handleSkillClick(skill)
                }
                disabled={!skill.active}
              >

                <div className="skill-card-icon">

                  {skill.icon}

                </div>


                <div className="skill-card-content">

                  <h3>
                    {skill.title}
                  </h3>

                  <p>
                    {skill.description}
                  </p>

                </div>


                {!skill.active && (

                  <span className="coming-soon-badge">
                    Coming Soon
                  </span>

                )}

              </button>

            ))}

          </div>

        </section>


        {/* =====================================================
            VALUE PROPOSITION
        ===================================================== */}

        <section className="home-value-section">

          <div>

            <span>
              WHY SKILLSENSAI?
            </span>

            <h2>
              More than watching.
              <br />
              Start actually learning.
            </h2>

          </div>


          <div className="home-value-grid">

            <div className="home-value-card">

              <strong>
                Learn
              </strong>

              <p>
                Structured lessons designed
                for beginners.
              </p>

            </div>


            <div className="home-value-card">

              <strong>
                Practice
              </strong>

              <p>
                Record yourself or upload
                your practice.
              </p>

            </div>


            <div className="home-value-card">

              <strong>
                Analyze
              </strong>

              <p>
                AI analyzes your performance
                and identifies areas to improve.
              </p>

            </div>


            <div className="home-value-card">

              <strong>
                Improve
              </strong>

              <p>
                Track your progress and
                keep building your skill.
              </p>

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          LOGIN MODAL
      ===================================================== */}

      {showLogin && (

        <LoginModal
          onClose={() =>
            setShowLogin(false)
          }
        />

      )}

    </div>

  );

}


/* ============================================================
   LOGIN MODAL
   ============================================================ */

function LoginModal({ onClose }) {

  /*
     IMPORTANT:
     We intentionally keep the authentication
     implementation inside the modal component.

     Your existing Firebase login logic can be
     connected here without changing the Home
     page structure.
  */

  const [activeTab, setActiveTab] =
    useState("google");


  return (

    <div
      className="login-overlay"
      onMouseDown={(event) => {

        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }

      }}
    >

      <div className="login-modal">

        <button
          className="login-close"
          onClick={onClose}
        >
          ×
        </button>


        <div className="login-header">

          <div className="login-icon">
            <Sparkles size={26} />
          </div>

          <h2>
            Welcome to SkillSensAI
          </h2>

          <p>
            Sign in to save your learning
            progress and continue your journey.
          </p>

        </div>


        <div className="login-tabs">

          <button
            className={
              activeTab === "google"
                ? "login-tab active"
                : "login-tab"
            }
            onClick={() =>
              setActiveTab("google")
            }
          >
            Google
          </button>

          <button
            className={
              activeTab === "phone"
                ? "login-tab active"
                : "login-tab"
            }
            onClick={() =>
              setActiveTab("phone")
            }
          >
            Phone
          </button>

        </div>


        {activeTab === "google" ? (

          <button
            className="google-login-button"
            onClick={() => {

              /*
                The existing Google Firebase
                handler should be connected here.
              */

              console.log(
                "Google login"
              );

            }}
          >

            Continue with Google

          </button>

        ) : (

          <div className="phone-login-placeholder">

            <p>
              Enter your phone number to
              continue with OTP verification.
            </p>

            <input
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              className="phone-login-input"
            />

            <button
              className="phone-login-button"
            >
              Send OTP
            </button>

          </div>

        )}


        <p className="login-footer">

          By continuing, you agree to use
          SkillSensAI responsibly.

        </p>

      </div>

    </div>

  );

}


export default Home;
```
