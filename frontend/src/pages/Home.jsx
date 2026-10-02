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

import { getLessonsLearned } from "../utils/progress";


// =========================================
// TOTAL CURRENT MVP LESSONS
// =========================================
// Music   = 5
// Boxing  = 5
// Karate  = 5
// Total   = 15

const TOTAL_LESSONS = 15;


function Home() {

  const navigate = useNavigate();

  // =========================================
  // AUTH
  // =========================================

  const [user, setUser] = useState(null);

  const [showLogin, setShowLogin] = useState(false);

  const [loginMethod, setLoginMethod] = useState("google");

  const [phoneNumber, setPhoneNumber] = useState("");

  const [otp, setOtp] = useState("");

  const [confirmationResult, setConfirmationResult] =
    useState(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);


  // =========================================
  // THEME
  // =========================================

  const [darkMode, setDarkMode] = useState(true);


  // =========================================
  // REAL LESSON PROGRESS
  // =========================================

  const [lessonsLearned, setLessonsLearned] =
    useState(getLessonsLearned());


  // =========================================
  // AUTH STATE
  // =========================================

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );

    return () => unsubscribe();

  }, []);


  // =========================================
  // UPDATE LESSON COUNT
  // =========================================

  useEffect(() => {

    const updateProgress = () => {

      setLessonsLearned(
        getLessonsLearned()
      );

    };

    // Update when another page completes a lesson
    window.addEventListener(
      "skillsensai-progress-updated",
      updateProgress
    );

    // Also update whenever Home becomes active
    updateProgress();

    return () => {

      window.removeEventListener(
        "skillsensai-progress-updated",
        updateProgress
      );

    };

  }, []);


  // =========================================
  // REAL PROGRESS PERCENTAGE
  // =========================================

  const progressPercentage =
    TOTAL_LESSONS > 0
      ? Math.min(
          100,
          Math.round(
            (lessonsLearned / TOTAL_LESSONS) * 100
          )
        )
      : 0;


  // =========================================
  // GOOGLE LOGIN
  // =========================================

  const handleGoogleLogin = async () => {

    try {

      setLoading(true);
      setError("");
      setSuccess("");

      const provider =
        new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(
        auth,
        provider
      );

      setSuccess(
        "Successfully signed in!"
      );

      setTimeout(() => {

        setShowLogin(false);
        setSuccess("");

      }, 1000);

    } catch (error) {

      console.error(error);

      setError(
        error.message ||
        "Google sign-in failed."
      );

    } finally {

      setLoading(false);

    }

  };


  // =========================================
  // PHONE LOGIN
  // =========================================

  const setupRecaptcha = () => {

    if (window.recaptchaVerifier) {
      return window.recaptchaVerifier;
    }

    window.recaptchaVerifier =
      new RecaptchaVerifier(
        auth,
        "phone-recaptcha",
        {
          size: "normal",

          callback: () => {
            console.log(
              "reCAPTCHA verified"
            );
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


  const sendOTP = async () => {

    if (!phoneNumber) {

      setError(
        "Please enter your phone number."
      );

      return;
    }

    try {

      setLoading(true);
      setError("");
      setSuccess("");

      const appVerifier =
        setupRecaptcha();

      const result =
        await signInWithPhoneNumber(
          auth,
          phoneNumber,
          appVerifier
        );

      setConfirmationResult(result);

      setSuccess(
        "OTP sent successfully."
      );

    } catch (error) {

      console.error(error);

      setError(
        error.message ||
        "Unable to send OTP."
      );

      if (window.recaptchaVerifier) {

        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.log(e);
        }

        window.recaptchaVerifier =
          null;

      }

    } finally {

      setLoading(false);

    }

  };


  // =========================================
  // VERIFY OTP
  // =========================================

  const verifyOTP = async () => {

    if (!confirmationResult) {

      setError(
        "Please request an OTP first."
      );

      return;

    }

    if (!otp) {

      setError(
        "Please enter the OTP."
      );

      return;

    }

    try {

      setLoading(true);
      setError("");

      await confirmationResult.confirm(
        otp
      );

      setSuccess(
        "Successfully signed in!"
      );

      setTimeout(() => {

        setShowLogin(false);
        setConfirmationResult(null);
        setPhoneNumber("");
        setOtp("");
        setSuccess("");

      }, 1000);

    } catch (error) {

      console.error(error);

      setError(
        "Invalid OTP. Please try again."
      );

    } finally {

      setLoading(false);

    }

  };


  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = async () => {

    try {

      await signOut(auth);

      setProfileOpen(false);

    } catch (error) {

      console.error(
        "Logout failed:",
        error
      );

    }

  };


  // =========================================
  // CLOSE LOGIN
  // =========================================

  const closeLogin = () => {

    setShowLogin(false);

    setError("");

    setSuccess("");

    setOtp("");

    setPhoneNumber("");

    setConfirmationResult(null);

    if (window.recaptchaVerifier) {

      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.log(e);
      }

      window.recaptchaVerifier = null;

    }

  };


  // =========================================
  // SKILLS
  // =========================================

  const skills = [

    {
      name: "Music",
      icon: Music2,
      active: true,
      className: "skill-music",
      path: "/music",
    },

    {
      name: "Martial Arts",
      icon: Swords,
      active: true,
      className: "skill-martial",
      path: "/martial-arts",
    },

    {
      name: "Dance",
      icon: PersonStanding,
      active: false,
      className: "skill-dance",
    },

    {
      name: "Instruments",
      icon: Guitar,
      active: false,
      className: "skill-instruments",
    },

    {
      name: "Yoga",
      icon: Flower2,
      active: false,
      className: "skill-yoga",
    },

    {
      name: "Coding",
      icon: Code2,
      active: false,
      className: "skill-coding",
    },

    {
      name: "Art & Creativity",
      icon: Palette,
      active: false,
      className: "skill-art",
    },

    {
      name: "More Skills",
      icon: Sparkles,
      active: false,
      className: "skill-speaking",
    },

  ];


  // =========================================
  // OPEN SKILL
  // =========================================

  const handleSkillClick = (skill) => {

    if (skill.active && skill.path) {

      navigate(skill.path);

    }

  };


  return (

    <div
      className={`app ${
        darkMode
          ? "dark-theme"
          : "light-theme"
      }`}
    >

      {/* =========================================
          NAVBAR
      ========================================= */}

      <nav className="navbar">

        <div className="logo">

          <span className="logo-skill">
            Skill
          </span>

          <span className="logo-sensai">
            SensAI
          </span>

          <span className="tagline">
            Learn. Practice. Master.
          </span>

        </div>


        <div className="nav-right">

          <button
            className="nav-link"
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
                .getElementById("skills")
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
              alert(
                "AI Coach will be available soon!"
              )
            }
          >
            AI Coach
          </button>

          <button
            className="nav-link"
            onClick={() =>
              alert(
                "Leaderboard will be available soon!"
              )
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


          {/* THEME */}

          <div className="theme-toggle">

            <button
              className={`theme-option ${
                !darkMode
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setDarkMode(false)
              }
              title="Light Theme"
            >
              <Sun size={16} />
              Light
            </button>

            <button
              className={`theme-option ${
                darkMode
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setDarkMode(true)
              }
              title="Dark Theme"
            >
              <Moon size={16} />
              Dark
            </button>

          </div>


          {/* PROFILE / LOGIN */}

          {user ? (

            <div className="profile-container">

              <button
                className="profile-button"
                onClick={() =>
                  setProfileOpen(
                    !profileOpen
                  )
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

                <span>
                  {user.displayName ||
                    user.phoneNumber ||
                    "Profile"}
                </span>

              </button>


              {profileOpen && (

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
                        "SkillSensAI Learner"}
                    </strong>

                    <span>
                      {user.email ||
                        user.phoneNumber ||
                        ""}
                    </span>

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
              onClick={() => {
                setShowLogin(true);
                setError("");
                setSuccess("");
              }}
            >
              Login
            </button>

          )}

        </div>

      </nav>


      {/* =========================================
          HERO
      ========================================= */}

      <section className="hero">

        <div className="hero-content">

          <div className="hero-text">

            <p className="hero-small-text">
              AI-POWERED SKILL LEARNING
            </p>

            <h1>
              Unleash Your
              <span className="hero-highlight">
                Potential
              </span>
            </h1>

            <p className="hero-description">
              AI-powered learning.
              Personalized for you.
              Learn practical skills,
              practice with AI, and
              improve at your own pace.
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
              <Sparkles size={19} />
            </button>

          </div>


          {/* =====================================
              SAMURAI / HERO IMAGE
          ===================================== */}

          <div className="hero-visual">

            <div className="skill-orbit">

              <div className="orbit-ring orbit-ring-one" />
              <div className="orbit-ring orbit-ring-two" />

              <div className="orbit-dot dot-one" />
              <div className="orbit-dot dot-two" />
              <div className="orbit-dot dot-three" />
              <div className="orbit-dot dot-four" />


              <div className="samurai-container">

                <div className="samurai-glow" />

                <img
                  src="/samurai.png"
                  alt="SkillSensAI"
                  className="samurai"
                />

              </div>


              {skills.map(
                (skill, index) => {

                  const Icon =
                    skill.icon;

                  return (

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
                        handleSkillClick(
                          skill
                        )
                      }
                      title={
                        skill.active
                          ? `Learn ${skill.name}`
                          : "Coming Soon"
                      }
                    >

                      <div className="skill-icon">
                        <Icon size={24} />
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

                  );

                }
              )}

            </div>

          </div>

        </div>

      </section>


      {/* =========================================
          REAL STATISTICS
      ========================================= */}

      <section className="stats-section">

        <div className="stats-grid">

          <div className="stat-card">

            <span>7</span>

            <p>
              Days Active
            </p>

          </div>


          <div className="stat-card">

            <span>2</span>

            <p>
              Skills Available
            </p>

          </div>


          {/* REAL LESSON COUNT */}

          <div className="stat-card">

            <span>
              {lessonsLearned}/{TOTAL_LESSONS}
            </span>

            <p>
              Lessons Learned
            </p>

          </div>


          {/* REAL PROGRESS */}

          <div className="stat-card">

            <span>
              {progressPercentage}%
            </span>

            <p>
              Overall Progress
            </p>

          </div>

        </div>

      </section>


      {/* =========================================
          SKILLS
      ========================================= */}

      <section
        className="skills-section"
        id="skills"
      >

        <div className="section-heading">

          <div className="heading-line" />

          <h2>
            Choose Your Skill
          </h2>

          <div className="heading-line" />

        </div>

        <p className="skills-info">
          Learn at your own pace.
          Practice with AI.
          Build real skills.
        </p>


        <div className="skills-grid">

          {skills.map((skill) => {

            const Icon =
              skill.icon;

            return (

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
                  handleSkillClick(
                    skill
                  )
                }
              >

                <div className="skill-icon">
                  <Icon size={26} />
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

            );

          })}

        </div>

      </section>


      {/* =========================================
          ABOUT
      ========================================= */}

      <section
        className="about-section"
        id="about"
      >

        <div className="about-content">

          <span className="about-label">
            ABOUT SKILLSENSAI
          </span>

          <h2>
            Learn Skills.
            <br />
            Bring Your Potential to Life.
          </h2>

          <p>
            SkillSensAI combines AI-powered
            learning with practical skill
            development. Instead of simply
            watching recorded videos, learners
            practice, receive feedback and
            improve continuously.
          </p>

          <p>
            Whether you're learning music,
            martial arts or another skill,
            SkillSensAI helps you learn at
            your own pace.
          </p>

        </div>

      </section>


      {/* =========================================
          LOGIN MODAL
      ========================================= */}

      {showLogin && (

        <div
          className="login-overlay"
          onClick={(e) => {

            if (
              e.target === e.currentTarget
            ) {
              closeLogin();
            }

          }}
        >

          <div className="login-modal">

            <button
              className="login-close"
              onClick={closeLogin}
            >
              <X size={22} />
            </button>


            <div className="login-header">

              <div className="login-logo">

                <span className="logo-skill">
                  Skill
                </span>

                <span className="logo-sensai">
                  SensAI
                </span>

              </div>

              <h2>
                Welcome Back
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
                onClick={() => {

                  setLoginMethod("google");
                  setError("");
                  setSuccess("");

                }}
              >
                Google
              </button>

              <button
                className={`login-tab ${
                  loginMethod === "phone"
                    ? "active"
                    : ""
                }`}
                onClick={() => {

                  setLoginMethod("phone");
                  setError("");
                  setSuccess("");

                }}
              >
                Phone
              </button>

            </div>


            {/* GOOGLE */}

            {loginMethod === "google" && (

              <div className="google-login-section">

                <button
                  className="google-login-button"
                  onClick={
                    handleGoogleLogin
                  }
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


            {/* PHONE */}

            {loginMethod === "phone" && (

              <div className="phone-login-section">

                {!confirmationResult ? (

                  <>

                    <input
                      type="tel"
                      className="login-input"
                      placeholder="+91 9876543210"
                      value={phoneNumber}
                      onChange={(e) =>
                        setPhoneNumber(
                          e.target.value
                        )
                      }
                    />

                    <div
                      id="phone-recaptcha"
                      className="recaptcha-container"
                    />

                    <button
                      className="phone-login-button"
                      onClick={sendOTP}
                      disabled={loading}
                    >
                      {loading
                        ? "Sending OTP..."
                        : "Send OTP"}
                    </button>

                  </>

                ) : (

                  <>

                    <input
                      type="text"
                      className="login-input"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) =>
                        setOtp(
                          e.target.value
                        )
                      }
                    />

                    <button
                      className="phone-login-button"
                      onClick={verifyOTP}
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

                      }}
                    >
                      Change Number
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
              Your account helps us save your
              learning progress.
            </div>

          </div>

        </div>

      )}

    </div>

  );

}

export default Home;
