import React, { useEffect, useState } from "react";
import "./Home.css";

import {
  Music2,
  Swords,
  PersonStanding,
  Guitar,
  Flower2,
  Code2,
  Palette,
  Sparkles,
  UserRound,
  LogOut,
  X,
  Sun,
  Moon,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase";

import "./LoginModal.css";

function Home() {
  const navigate = useNavigate();

  /* =====================================================
     STATE
     ===================================================== */

  const [user, setUser] = useState(null);

  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [loginMethod, setLoginMethod] = useState("google");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");

  const [confirmationResult, setConfirmationResult] =
    useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [darkMode, setDarkMode] = useState(true);

  /* =====================================================
     FIREBASE AUTH STATE
     ===================================================== */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );

    return () => unsubscribe();
  }, []);

  /* =====================================================
     SKILLS
     ===================================================== */

  const skills = [
    {
      name: "Music",
      icon: <Music2 size={24} />,
      className: "skill-music",
      active: true,
      action: () => navigate("/music"),
    },
    {
      name: "Martial Arts",
      icon: <Swords size={24} />,
      className: "skill-martial",
      active: true,
      action: () => navigate("/martial-arts"),
    },
    {
      name: "Dance",
      icon: <PersonStanding size={24} />,
      className: "skill-dance",
      active: false,
    },
    {
      name: "Instruments",
      icon: <Guitar size={24} />,
      className: "skill-instruments",
      active: false,
    },
    {
      name: "Yoga",
      icon: <Flower2 size={24} />,
      className: "skill-yoga",
      active: false,
    },
    {
      name: "Coding",
      icon: <Code2 size={24} />,
      className: "skill-coding",
      active: false,
    },
    {
      name: "Art & Creativity",
      icon: <Palette size={24} />,
      className: "skill-art",
      active: false,
    },
    {
      name: "More Skills",
      icon: <Sparkles size={24} />,
      className: "skill-speaking",
      active: false,
    },
  ];

  const handleSkillClick = (skill) => {
    if (skill.active && skill.action) {
      skill.action();
    } else {
      alert(`${skill.name} is coming soon!`);
    }
  };

  /* =====================================================
     GOOGLE LOGIN
     ===================================================== */

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(auth, provider);

      setSuccess("Login successful!");

      setTimeout(() => {
        setShowLogin(false);
      }, 800);
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Google login failed."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     PHONE LOGIN
     ===================================================== */

  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      return window.recaptchaVerifier;
    }

    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "phone-recaptcha",
      {
        size: "normal",

        callback: () => {
          console.log("reCAPTCHA verified");
        },

        "expired-callback": () => {
          setError(
            "reCAPTCHA expired. Please verify again."
          );
        },
      }
    );

    return window.recaptchaVerifier;
  };

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const appVerifier = setupRecaptcha();

      const result = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );

      setConfirmationResult(result);

      setSuccess("OTP sent successfully.");
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to send OTP. Please check your phone number."
      );

      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    if (!confirmationResult) {
      setError("Please request an OTP first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await confirmationResult.confirm(otp);

      setSuccess("Login successful!");

      setTimeout(() => {
        setShowLogin(false);
      }, 800);
    } catch (err) {
      console.error(err);

      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     LOGOUT
     ===================================================== */

  const handleLogout = async () => {
    try {
      await signOut(auth);

      setShowProfile(false);
      setShowLogin(false);
    } catch (err) {
      console.error(err);
    }
  };

  /* =====================================================
     LOGIN MODAL
     ===================================================== */

  const openLogin = () => {
    setShowLogin(true);
    setShowProfile(false);
    setError("");
    setSuccess("");
  };

  const closeLogin = () => {
    setShowLogin(false);
    setError("");
    setSuccess("");
  };

  const changeLoginMethod = (method) => {
    setLoginMethod(method);

    setError("");
    setSuccess("");

    setConfirmationResult(null);
    setOtp("");

    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  };

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div
      className={`app ${
        darkMode ? "dark-theme" : "light-theme"
      }`}
    >

      {/* =================================================
          NAVBAR
          ================================================= */}

      <nav className="navbar">

        <div className="logo">
          <span className="logo-skill">
            Skill
          </span>

          <span className="logo-sensai">
            SensAI
          </span>
        </div>

        <div className="tagline">
          Learn. Train. Master.
        </div>

        <div className="nav-right">

          <button
            className="nav-link active-nav"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
          >
            Home
          </button>

          <button
            className="nav-link"
            onClick={() =>
              document
                .getElementById("stats")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            Progress
          </button>

          <button
            className="nav-link"
            onClick={() =>
              document
                .getElementById("skills")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            AI Coach
          </button>

          <button
            className="nav-link"
            onClick={() =>
              document
                .getElementById("stats")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            Leaderboard
          </button>

          <button
            className="nav-link"
            onClick={() =>
              document
                .getElementById("about")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            About Us
          </button>

          {/* THEME SWITCH */}

          <div className="theme-toggle">

            <button
              className={`theme-option ${
                !darkMode ? "selected" : ""
              }`}
              onClick={() => setDarkMode(false)}
              title="Light Theme"
            >
              <Sun size={15} />
              <span>Light</span>
            </button>

            <button
              className={`theme-option ${
                darkMode ? "selected" : ""
              }`}
              onClick={() => setDarkMode(true)}
              title="Dark Theme"
            >
              <Moon size={15} />
              <span>Dark</span>
            </button>

          </div>

          {/* LOGIN / PROFILE */}

          {user ? (
            <div className="profile-container">

              <button
                className="profile-button"
                onClick={() =>
                  setShowProfile(!showProfile)
                }
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-placeholder">
                    <UserRound size={20} />
                  </div>
                )}
              </button>

              {showProfile && (
                <div className="profile-dropdown">

                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="profile-dropdown-image"
                    />
                  ) : (
                    <div className="profile-dropdown-placeholder">
                      <UserRound size={28} />
                    </div>
                  )}

                  <div className="profile-info">

                    <strong>
                      {user.displayName ||
                        "SkillSensAI User"}
                    </strong>

                    <small>
                      {user.email ||
                        user.phoneNumber}
                    </small>

                  </div>

                  <button
                    className="logout-button"
                    onClick={handleLogout}
                  >
                    <LogOut size={17} />
                    Logout
                  </button>

                </div>
              )}

            </div>
          ) : (
            <button
              className="login-button"
              onClick={openLogin}
            >
              Login
            </button>
          )}

        </div>

      </nav>


      {/* =================================================
          HERO
          ================================================= */}

      <section className="hero">

        <div className="hero-content">

          <div className="hero-text">

            <p className="hero-small-text">
              AI-POWERED SKILL DEVELOPMENT
            </p>

            <h1>
              Unleash Your{" "}
              <span className="hero-highlight">
                Potential
              </span>
            </h1>

            <p className="hero-description">
              AI-powered learning.
              <br />
              Personalized for you.
            </p>

            <button
              className="hero-button"
              onClick={() =>
                document
                  .getElementById("skills")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Start Your Journey

              <span>
                →
              </span>
            </button>

          </div>


          {/* HERO VISUAL */}

          <div className="hero-visual">

            <div className="skill-orbit">

              <div className="orbit-ring orbit-ring-one"></div>

              <div className="orbit-ring orbit-ring-two"></div>

              <div className="orbit-dot dot-one"></div>

              <div className="orbit-dot dot-two"></div>

              <div className="orbit-dot dot-three"></div>

              <div className="orbit-dot dot-four"></div>


              {/* SAMURAI */}

              <div className="samurai-container">

                <div className="samurai-glow"></div>

                <img
                  src="/samurai.png"
                  alt="SkillSensAI Samurai"
                  className="samurai"
                />

              </div>


              {/* SKILLS */}

              {skills.map((skill) => (
                <button
                  key={skill.name}
                  className={`skill-card ${
                    skill.className
                  } ${
                    skill.active
                      ? "active-skill"
                      : "inactive-skill"
                  }`}
                  onClick={() =>
                    handleSkillClick(skill)
                  }
                >

                  <div className="skill-icon">
                    {skill.icon}
                  </div>

                  <span>
                    {skill.name}
                  </span>

                  {!skill.active && (
                    <small>
                      Coming Soon
                    </small>
                  )}

                </button>
              ))}

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          STATS
          ================================================= */}

      <section
        className="stats-section"
        id="stats"
      >

        <div className="stats-grid">

          <div className="stat-card">
            <strong>7</strong>
            <span>Days</span>
          </div>

          <div className="stat-card">
            <strong>3</strong>
            <span>Skills</span>
          </div>

          <div className="stat-card">
            <strong>24</strong>
            <span>Lessons</span>
          </div>

          <div className="stat-card">
            <strong>92%</strong>
            <span>Progress</span>
          </div>

        </div>

      </section>


      {/* =================================================
          SKILLS
          ================================================= */}

      <section
        className="skills-section"
        id="skills"
      >

        <div className="section-heading">

          <div className="heading-line"></div>

          <p>
            MASTER WHAT MATTERS
          </p>

          <h2>
            Choose Your{" "}
            <span>Skill</span>
          </h2>

        </div>

        <div className="skills-info">

          <p>
            Learn at your own pace.
            Practice with AI.
            Track your progress.
          </p>

        </div>

      </section>


      {/* =================================================
          ABOUT
          ================================================= */}

      <section
        className="about-section"
        id="about"
      >

        <div className="about-content">

          <p className="about-label">
            ABOUT SKILLSENSAI
          </p>

          <h2>
            Learn.
            <span> Train.</span>
            <br />
            Master.
          </h2>

          <p>
            SkillSensAI combines artificial
            intelligence, expert knowledge and
            practical learning to help anyone
            develop real-world skills.
          </p>

        </div>

      </section>


      {/* =================================================
          LOGIN MODAL
          ================================================= */}

      {showLogin && (

        <div
          className="login-overlay"
          onClick={closeLogin}
        >

          <div
            className="login-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="login-close"
              onClick={closeLogin}
            >
              <X size={22} />
            </button>


            <div className="login-header">

              <div className="login-logo">

                <span>
                  Skill
                </span>

                <strong>
                  SensAI
                </strong>

              </div>

              <h2>
                Welcome to SkillSensAI
              </h2>

              <p>
                Login to continue your
                learning journey.
              </p>

            </div>


            {/* LOGIN TABS */}

            <div className="login-tabs">

              <button
                className={`login-tab ${
                  loginMethod === "google"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  changeLoginMethod("google")
                }
              >
                Google
              </button>

              <button
                className={`login-tab ${
                  loginMethod === "phone"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  changeLoginMethod("phone")
                }
              >
                Phone
              </button>

            </div>


            {/* GOOGLE LOGIN */}

            {loginMethod === "google" && (

              <div className="google-login-section">

                <button
                  className="google-login-button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >

                  <span className="google-icon">
                    G
                  </span>

                  {loading
                    ? "Signing in..."
                    : "Continue with Google"}

                </button>

              </div>

            )}


            {/* PHONE LOGIN */}

            {loginMethod === "phone" && (

              <div className="phone-login-section">

                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(
                      e.target.value
                    )
                  }
                  disabled={
                    !!confirmationResult
                  }
                />


                {!confirmationResult && (
                  <>

                    <div
                      id="phone-recaptcha"
                      className="recaptcha-container"
                    ></div>

                    <button
                      className="phone-login-button"
                      onClick={handleSendOTP}
                      disabled={loading}
                    >
                      {loading
                        ? "Sending OTP..."
                        : "Send OTP"}
                    </button>

                  </>
                )}


                {confirmationResult && (
                  <>

                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value)
                      }
                    />

                    <button
                      className="phone-login-button"
                      onClick={handleVerifyOTP}
                      disabled={loading}
                    >
                      {loading
                        ? "Verifying..."
                        : "Verify OTP"}
                    </button>

                    <button
                      className="change-number-button"
                      onClick={() => {

                        setConfirmationResult(
                          null
                        );

                        setOtp("");

                        setError("");

                        setSuccess("");

                        if (
                          window.recaptchaVerifier
                        ) {
                          window.recaptchaVerifier.clear();

                          window.recaptchaVerifier =
                            null;
                        }

                      }}
                    >
                      Change phone number
                    </button>

                  </>
                )}

              </div>

            )}


            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            {success && (
              <div className="login-success">
                {success}
              </div>
            )}


            <div className="login-footer">
              Secure authentication powered by Firebase
            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Home;
