import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Music,
  Swords,
  Dumbbell,
  Palette,
  Code2,
  Sparkles,
  Lightbulb,
  LightbulbOff,
  LogIn,
  LogOut,
  ChevronDown,
  User,
  Phone,
  Mail,
  ArrowRight,
  Loader2,
  X,
  ShieldCheck,
  BookOpen,
  Target,
  Trophy,
} from "lucide-react";

import {
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import { auth } from "../firebase";

import {
  getLessonsLearned,
} from "../utils/progress";

import "./Home.css";


/* =========================================================
   CONSTANTS
========================================================= */

const THEME_KEY = "skillsensai_theme";

const getSavedTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);

    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch (error) {
    console.error(error);
  }

  return "dark";
};


/* =========================================================
   GLOBAL THEME
========================================================= */

const applyGlobalTheme = (theme) => {
  const root = document.documentElement;
  const body = document.body;

  root.classList.remove(
    "skillsensai-light-theme",
    "skillsensai-dark-theme"
  );

  body.classList.remove(
    "skillsensai-light-theme",
    "skillsensai-dark-theme"
  );

  const themeClass =
    theme === "light"
      ? "skillsensai-light-theme"
      : "skillsensai-dark-theme";

  root.classList.add(themeClass);
  body.classList.add(themeClass);

  root.setAttribute("data-theme", theme);
  body.setAttribute("data-theme", theme);

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.error(error);
  };

  window.dispatchEvent(
    new CustomEvent("skillsensai-theme-changed", {
      detail: { theme },
    })
  );
};


/* =========================================================
   HOME
========================================================= */

function Home() {
  const navigate = useNavigate();

  /* -------------------------------------------------------
     AUTH
  ------------------------------------------------------- */

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [showLogin, setShowLogin] = useState(false);
  const [loginMethod, setLoginMethod] = useState("google");

  const [phoneNumber, setPhoneNumber] = useState("+91 ");
  const [otp, setOtp] = useState("");

  const [confirmationResult, setConfirmationResult] =
    useState(null);

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const recaptchaRef = useRef(null);


  /* -------------------------------------------------------
     THEME
  ------------------------------------------------------- */

  const [theme, setTheme] = useState(getSavedTheme);


  /* -------------------------------------------------------
     PROGRESS
  ------------------------------------------------------- */

  const [lessonsLearned, setLessonsLearned] = useState(0);


  /* -------------------------------------------------------
     AUTH LISTENER
  ------------------------------------------------------- */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);


  /* -------------------------------------------------------
     INITIAL THEME
  ------------------------------------------------------- */

  useEffect(() => {
    applyGlobalTheme(theme);

    const handleThemeChange = (event) => {
      if (
        event.detail?.theme === "light" ||
        event.detail?.theme === "dark"
      ) {
        setTheme(event.detail.theme);
      }
    };

    window.addEventListener(
      "skillsensai-theme-changed",
      handleThemeChange
    );

    return () => {
      window.removeEventListener(
        "skillsensai-theme-changed",
        handleThemeChange
      );
    };
  }, [theme]);


  /* -------------------------------------------------------
     PROGRESS LISTENER
  ------------------------------------------------------- */

  useEffect(() => {
    const updateProgress = () => {
      try {
        const lessons = getLessonsLearned();
        setLessonsLearned(
          Array.isArray(lessons) ? lessons.length : 0
        );
      } catch (error) {
        console.error(error);
        setLessonsLearned(0);
      }
    };

    updateProgress();

    window.addEventListener(
      "skillsensai-progress-updated",
      updateProgress
    );

    window.addEventListener(
      "storage",
      updateProgress
    );

    return () => {
      window.removeEventListener(
        "skillsensai-progress-updated",
        updateProgress
      );

      window.removeEventListener(
        "storage",
        updateProgress
      );
    };
  }, []);


  /* =========================================================
     LOGIN
  ========================================================= */

  const openLogin = () => {
    setLoginError("");
    setLoginMethod("google");
    setShowLogin(true);
  };


  const closeLogin = () => {
    if (loginLoading) return;

    setShowLogin(false);
    setLoginError("");
    setOtp("");
    setConfirmationResult(null);
  };


  /* -------------------------------------------------------
     GOOGLE LOGIN
  ------------------------------------------------------- */

  const handleGoogleLogin = async () => {
    try {
      setLoginLoading(true);
      setLoginError("");

      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(auth, provider);

      setShowLogin(false);
    } catch (error) {
      console.error("Google login error:", error);

      if (error.code === "auth/popup-closed-by-user") {
        setLoginError("Login window was closed.");
      } else if (
        error.code === "auth/popup-blocked"
      ) {
        setLoginError(
          "Your browser blocked the login popup."
        );
      } else {
        setLoginError(
          error.message || "Google login failed."
        );
      }
    } finally {
      setLoginLoading(false);
    }
  };


  /* -------------------------------------------------------
     PHONE FORMAT
  ------------------------------------------------------- */

  const formatPhoneNumber = (value) => {
    let cleaned = value.replace(/[^\d+]/g, "");

    if (!cleaned.startsWith("+91")) {
      cleaned = "+91" + cleaned.replace(/^\+?91/, "");
    }

    let digits = cleaned
      .replace("+91", "")
      .replace(/\D/g, "")
      .slice(0, 10);

    return `+91 ${digits}`;
  };


  const handlePhoneChange = (event) => {
    setPhoneNumber(
      formatPhoneNumber(event.target.value)
    );
  };


  /* -------------------------------------------------------
     PHONE LOGIN
  ------------------------------------------------------- */

  const handleSendOtp = async () => {
    try {
      setLoginLoading(true);
      setLoginError("");

      const digits = phoneNumber
        .replace("+91", "")
        .replace(/\D/g, "");

      if (digits.length !== 10) {
        setLoginError(
          "Please enter a valid 10-digit Indian mobile number."
        );

        setLoginLoading(false);
        return;
      }

      if (!recaptchaRef.current) {
        recaptchaRef.current =
          new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "invisible",
            }
          );
      }

      const confirmation =
        await signInWithPhoneNumber(
          auth,
          `+91${digits}`,
          recaptchaRef.current
        );

      setConfirmationResult(confirmation);
      setLoginError("");
    } catch (error) {
      console.error("Phone login error:", error);

      setLoginError(
        error.message ||
          "Unable to send OTP. Please try again."
      );

      try {
        if (recaptchaRef.current) {
          recaptchaRef.current.clear();
        }

        recaptchaRef.current = null;
      } catch {}
    } finally {
      setLoginLoading(false);
    }
  };


  /* -------------------------------------------------------
     VERIFY OTP
  ------------------------------------------------------- */

  const handleVerifyOtp = async () => {
    if (!confirmationResult) return;

    try {
      setLoginLoading(true);
      setLoginError("");

      if (!otp || otp.length < 6) {
        setLoginError(
          "Please enter the 6-digit OTP."
        );

        setLoginLoading(false);
        return;
      }

      await confirmationResult.confirm(otp);

      setShowLogin(false);
      setOtp("");
      setConfirmationResult(null);
    } catch (error) {
      console.error("OTP error:", error);

      setLoginError(
        "Invalid OTP. Please check the code and try again."
      );
    } finally {
      setLoginLoading(false);
    }
  };


  /* -------------------------------------------------------
     LOGOUT
  ------------------------------------------------------- */

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };


  /* -------------------------------------------------------
     THEME TOGGLE
  ------------------------------------------------------- */

  const toggleTheme = () => {
    const nextTheme =
      theme === "dark"
        ? "light"
        : "dark";

    setTheme(nextTheme);
    applyGlobalTheme(nextTheme);
  };


  /* =========================================================
     SKILLS
  ========================================================= */

  const skills = [
    {
      id: "music",
      name: "Music",
      icon: Music,
      color: "music",
      active: true,
      path: "/music",
    },

    {
      id: "martial",
      name: "Martial Arts",
      icon: Swords,
      color: "martial",
      active: true,
      path: "/martial-arts",
    },

    {
      id: "dance",
      name: "Dance",
      icon: Dumbbell,
      color: "dance",
      active: false,
    },

    {
      id: "art",
      name: "Art",
      icon: Palette,
      color: "art",
      active: false,
    },

    {
      id: "coding",
      name: "Coding",
      icon: Code2,
      color: "coding",
      active: false,
    },

    {
      id: "more",
      name: "More",
      icon: Sparkles,
      color: "more",
      active: false,
    },
  ];


  const handleSkillClick = (skill) => {
    if (!skill.active) return;

    navigate(skill.path);
  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="home-page">

      {/* =====================================================
          ROOM
      ===================================================== */}

      <div className="room-background">

        <div className="room-wall" />

        <div className="room-floor" />

        <div className="room-corner-glow" />

        {/* CEILING */}
        <div className="ceiling">

          <div className="ceiling-line" />

          {/* FAN */}
          <div className="ceiling-fan">

            <div className="fan-rod" />

            <div className="fan-motor">
              <span />
            </div>

            <div className="fan-blades">
              <span className="blade blade-one" />
              <span className="blade blade-two" />
              <span className="blade blade-three" />
              <span className="blade blade-four" />
            </div>

          </div>

        </div>


        {/* ===================================================
            HANGING BULB
        =================================================== */}

        <div className="hanging-bulb">

          <div className="bulb-wire" />

          <button
            type="button"
            className={`bulb-button ${
              theme === "light"
                ? "bulb-on"
                : "bulb-off"
            }`}
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "Turn on light"
                : "Turn off light"
            }
            title={
              theme === "dark"
                ? "Turn on light"
                : "Turn off light"
            }
          >
            <span className="bulb-neck" />

            <span className="bulb-glass">
              {theme === "light" ? (
                <Lightbulb
                  size={27}
                  strokeWidth={1.8}
                />
              ) : (
                <LightbulbOff
                  size={27}
                  strokeWidth={1.8}
                />
              )}
            </span>

          </button>

        </div>


        {/* LOGIN */}
        <div className="room-login">

          {authLoading ? (
            <div className="auth-loading">
              <Loader2
                size={18}
                className="spin"
              />
            </div>
          ) : user ? (

            <div className="profile-area">

              <button
                type="button"
                className="profile-button"
              >
                <span className="profile-avatar">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                    />
                  ) : (
                    <User size={17} />
                  )}
                </span>

                <span className="profile-name">
                  {user.displayName ||
                    user.phoneNumber ||
                    "Learner"}
                </span>

                <ChevronDown size={16} />
              </button>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Sign out
              </button>

            </div>

          ) : (

            <button
              type="button"
              className="login-button"
              onClick={openLogin}
            >
              <LogIn size={18} />
              <span>Login</span>
            </button>

          )}

        </div>


        {/* =================================================
            MAIN ROOM CONTENT
        ================================================= */}

        <main className="home-content">

          {/* SMALL INTRO */}
          <section className="home-intro">

            <div className="brand-small">
              <span>Skill</span>
              <strong>SensAI</strong>
            </div>

            <h1>
              Learn.
              <span> Practice.</span>
              <strong> Master.</strong>
            </h1>

            <p>
              Your skills. Your pace. Your AI coach.
            </p>

          </section>


          {/* =================================================
              CENTRAL CHARACTER + SKILLS
          ================================================= */}

          <section className="skills-room">

            {/* SOFT FLOOR SHADOW */}
            <div className="character-shadow" />


            {/* CENTER CHARACTER */}
            <div className="samurai-container">

              <div className="samurai-aura" />

              <img
                src="/samurai.png"
                alt="SkillSensAI learner"
                className="samurai-image"
              />

            </div>


            {/* SKILLS */}
            <div className="skills-orbit">

              {skills.map((skill, index) => {

                const Icon = skill.icon;

                return (
                  <button
                    key={skill.id}
                    type="button"
                    className={`skill-circle skill-${skill.color} skill-position-${index + 1} ${
                      skill.active
                        ? "skill-active"
                        : "skill-coming"
                    }`}
                    onClick={() =>
                      handleSkillClick(skill)
                    }
                    disabled={!skill.active}
                  >

                    <span className="skill-circle-glow" />

                    <span className="skill-icon">
                      <Icon
                        size={25}
                        strokeWidth={2}
                      />
                    </span>

                    <span className="skill-name">
                      {skill.name}
                    </span>

                    {!skill.active && (
                      <span className="coming-label">
                        Soon
                      </span>
                    )}

                  </button>
                );
              })}

            </div>

          </section>


          {/* =================================================
              LEARN / PRACTICE / MASTER
          ================================================= */}

          <section className="learning-flow">

            <div className="flow-heading">
              <span>Your journey</span>
              <h2>
                Learn. Practice. Master.
              </h2>
            </div>


            <div className="flow-cards">

              <div className="flow-card flow-learn">

                <div className="flow-icon">
                  <BookOpen size={23} />
                </div>

                <div>
                  <span>01</span>
                  <h3>Learn</h3>
                  <p>
                    Start with guided lessons
                    designed for your level.
                  </p>
                </div>

              </div>


              <div className="flow-line" />


              <div className="flow-card flow-practice">

                <div className="flow-icon">
                  <Target size={23} />
                </div>

                <div>
                  <span>02</span>
                  <h3>Practice</h3>
                  <p>
                    Record, upload and practice
                    with AI-powered feedback.
                  </p>
                </div>

              </div>


              <div className="flow-line" />


              <div className="flow-card flow-master">

                <div className="flow-icon">
                  <Trophy size={23} />
                </div>

                <div>
                  <span>03</span>
                  <h3>Master</h3>
                  <p>
                    Track your progress and
                    improve one step at a time.
                  </p>
                </div>

              </div>

            </div>


            {/* PROGRESS */}
            <div className="home-progress">

              <div className="progress-top">

                <span>
                  Your progress
                </span>

                <strong>
                  {lessonsLearned} lessons learned
                </strong>

              </div>

              <div className="progress-track">

                <div
                  className="progress-fill"
                  style={{
                    width:
                      lessonsLearned > 0
                        ? `${Math.min(
                            lessonsLearned * 10,
                            100
                          )}%`
                        : "0%",
                  }}
                />

              </div>

            </div>

          </section>

        </main>


        {/* ===================================================
            LOGIN MODAL
        =================================================== */}

        {showLogin && (

          <div
            className="login-overlay"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget
              ) {
                closeLogin();
              }
            }}
          >

            <div className="login-modal">

              <button
                type="button"
                className="login-close"
                onClick={closeLogin}
                disabled={loginLoading}
              >
                <X size={20} />
              </button>


              <div className="login-header">

                <div className="login-shield">
                  <ShieldCheck size={27} />
                </div>

                <h2>
                  Welcome to SkillSensAI
                </h2>

                <p>
                  Sign in to save your learning
                  progress.
                </p>

              </div>


              <div className="login-tabs">

                <button
                  type="button"
                  className={
                    loginMethod === "google"
                      ? "login-tab active"
                      : "login-tab"
                  }
                  onClick={() => {
                    setLoginMethod("google");
                    setLoginError("");
                  }}
                >
                  <Mail size={17} />
                  Google
                </button>

                <button
                  type="button"
                  className={
                    loginMethod === "phone"
                      ? "login-tab active"
                      : "login-tab"
                  }
                  onClick={() => {
                    setLoginMethod("phone");
                    setLoginError("");
                  }}
                >
                  <Phone size={17} />
                  Phone
                </button>

              </div>


              {/* GOOGLE */}
              {loginMethod === "google" && (

                <div className="login-method">

                  <button
                    type="button"
                    className="google-login-button"
                    onClick={handleGoogleLogin}
                    disabled={loginLoading}
                  >

                    {loginLoading ? (
                      <Loader2
                        size={20}
                        className="spin"
                      />
                    ) : (
                      <span className="google-g">
                        G
                      </span>
                    )}

                    <span>
                      Continue with Google
                    </span>

                    {!loginLoading && (
                      <ArrowRight size={18} />
                    )}

                  </button>

                  <small>
                    Your Google account will be used
                    securely through Firebase.
                  </small>

                </div>

              )}


              {/* PHONE */}
              {loginMethod === "phone" && (

                <div className="login-method">

                  {!confirmationResult ? (

                    <>

                      <label>
                        Mobile number
                      </label>

                      <div className="phone-input-wrap">

                        <Phone size={18} />

                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={handlePhoneChange}
                          placeholder="+91 9876543210"
                          disabled={loginLoading}
                        />

                      </div>


                      <button
                        type="button"
                        className="otp-button"
                        onClick={handleSendOtp}
                        disabled={loginLoading}
                      >

                        {loginLoading ? (
                          <>
                            <Loader2
                              size={18}
                              className="spin"
                            />
                            Sending...
                          </>
                        ) : (
                          <>
                            Send OTP
                            <ArrowRight size={18} />
                          </>
                        )}

                      </button>

                    </>

                  ) : (

                    <>

                      <label>
                        Enter OTP
                      </label>

                      <input
                        className="otp-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(event) =>
                          setOtp(
                            event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6)
                          )
                        }
                        placeholder="000000"
                        disabled={loginLoading}
                      />


                      <button
                        type="button"
                        className="otp-button"
                        onClick={handleVerifyOtp}
                        disabled={loginLoading}
                      >

                        {loginLoading ? (
                          <>
                            <Loader2
                              size={18}
                              className="spin"
                            />
                            Verifying...
                          </>
                        ) : (
                          <>
                            Verify OTP
                            <ShieldCheck
                              size={18}
                            />
                          </>
                        )}

                      </button>


                      <button
                        type="button"
                        className="change-number"
                        onClick={() => {
                          setConfirmationResult(
                            null
                          );
                          setOtp("");
                          setLoginError("");
                        }}
                      >
                        Change number
                      </button>

                    </>

                  )}

                </div>

              )}


              {loginError && (
                <div className="login-error">
                  {loginError}
                </div>
              )}


              <div
                id="recaptcha-container"
              />

              <p className="login-footer">
                Secure authentication powered by
                Firebase.
              </p>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}


export default Home;
