import React, { useEffect, useState } from "react";
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
import { getLessonsLearned } from "../utils/progress";

import "./Home.css";


/* =========================================================
   SKILLS
   ========================================================= */

const skills = [
  {
    name: "Music",
    icon: Music,
    color: "blue",
    path: "/music",
    active: true,
  },
  {
    name: "Martial Arts",
    icon: Swords,
    color: "red",
    path: "/martial-arts",
    active: true,
  },
  {
    name: "Dance",
    icon: Dumbbell,
    color: "pink",
    path: "#",
    active: false,
  },
  {
    name: "Art",
    icon: Palette,
    color: "orange",
    path: "#",
    active: false,
  },
  {
    name: "Coding",
    icon: Code2,
    color: "green",
    path: "#",
    active: false,
  },
  {
    name: "More Skills",
    icon: Sparkles,
    color: "purple",
    path: "#",
    active: false,
  },
];


/* =========================================================
   GLOBAL THEME
   ========================================================= */

const applyGlobalTheme = (theme) => {
  const html = document.documentElement;
  const body = document.body;

  html.classList.remove(
    "skillsensai-light-theme",
    "skillsensai-dark-theme"
  );

  body.classList.remove(
    "skillsensai-light-theme",
    "skillsensai-dark-theme"
  );

  html.classList.add(`skillsensai-${theme}-theme`);
  body.classList.add(`skillsensai-${theme}-theme`);
};


/* =========================================================
   HOME
   ========================================================= */

export default function Home() {
  const navigate = useNavigate();

  /* -----------------------------------------
     AUTH
  ----------------------------------------- */

  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const [loginMethod, setLoginMethod] = useState("google");

  const [phoneNumber, setPhoneNumber] = useState("+91 ");
  const [otp, setOtp] = useState("");

  const [confirmationResult, setConfirmationResult] =
    useState(null);

  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");


  /* -----------------------------------------
     PROGRESS
  ----------------------------------------- */

  const [lessonsLearned, setLessonsLearned] = useState(0);


  /* -----------------------------------------
     THEME
  ----------------------------------------- */

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("skillsensai_theme") || "light";
  });


  /* =========================================================
     AUTH LISTENER
  ========================================================= */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);


  /* =========================================================
     THEME
  ========================================================= */

  useEffect(() => {
    applyGlobalTheme(theme);
    localStorage.setItem("skillsensai_theme", theme);
  }, [theme]);


  /* =========================================================
     LOAD PROGRESS
  ========================================================= */

  useEffect(() => {
    const loadProgress = () => {
      try {
        const learned = getLessonsLearned();
        setLessonsLearned(
          Array.isArray(learned) ? learned.length : Number(learned) || 0
        );
      } catch (error) {
        console.error("Unable to load progress:", error);
        setLessonsLearned(0);
      }
    };

    loadProgress();

    window.addEventListener(
      "skillsensai-progress-updated",
      loadProgress
    );

    window.addEventListener(
      "storage",
      loadProgress
    );

    return () => {
      window.removeEventListener(
        "skillsensai-progress-updated",
        loadProgress
      );

      window.removeEventListener(
        "storage",
        loadProgress
      );
    };
  }, []);


  /* =========================================================
     THEME TOGGLE
  ========================================================= */

  const toggleTheme = () => {
    setTheme((previous) =>
      previous === "light" ? "dark" : "light"
    );
  };


  /* =========================================================
     GOOGLE LOGIN
  ========================================================= */

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      setAuthError("");
      setAuthMessage("");

      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(auth, provider);

      setShowLogin(false);
      setShowProfile(false);
    } catch (error) {
      console.error("Google login error:", error);

      setAuthError(
        error?.message ||
          "Google sign-in failed. Please try again."
      );
    } finally {
      setAuthLoading(false);
    }
  };


  /* =========================================================
     PHONE NUMBER FORMAT
  ========================================================= */

  const handlePhoneChange = (event) => {
    let value = event.target.value;

    value = value.replace(/[^\d+ ]/g, "");

    if (!value.startsWith("+91")) {
      const digits = value.replace(/\D/g, "");
      value = `+91 ${digits}`;
    }

    const digitsAfterCode = value
      .replace("+91", "")
      .replace(/\D/g, "")
      .slice(0, 10);

    setPhoneNumber(`+91 ${digitsAfterCode}`);
  };


  /* =========================================================
     SEND OTP
  ========================================================= */

  const sendOtp = async () => {
    try {
      setAuthLoading(true);
      setAuthError("");
      setAuthMessage("");

      const cleanNumber =
        "+91" +
        phoneNumber
          .replace("+91", "")
          .replace(/\D/g, "");

      if (cleanNumber.length !== 13) {
        setAuthError(
          "Please enter a valid 10-digit Indian mobile number."
        );
        setAuthLoading(false);
        return;
      }

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
          }
        );
      }

      const result = await signInWithPhoneNumber(
        auth,
        cleanNumber,
        window.recaptchaVerifier
      );

      setConfirmationResult(result);

      setAuthMessage(
        "OTP sent successfully. Check your phone."
      );
    } catch (error) {
      console.error("Phone authentication error:", error);

      setAuthError(
        error?.message ||
          "Unable to send OTP. Please try again."
      );

      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {
          // Ignore cleanup errors.
        }

        window.recaptchaVerifier = null;
      }
    } finally {
      setAuthLoading(false);
    }
  };


  /* =========================================================
     VERIFY OTP
  ========================================================= */

  const verifyOtp = async () => {
    if (!confirmationResult) {
      setAuthError("Please request an OTP first.");
      return;
    }

    try {
      setAuthLoading(true);
      setAuthError("");
      setAuthMessage("");

      await confirmationResult.confirm(otp);

      setShowLogin(false);
      setConfirmationResult(null);
      setOtp("");
      setPhoneNumber("+91 ");
    } catch (error) {
      console.error("OTP verification error:", error);

      setAuthError(
        "Invalid OTP. Please check the code and try again."
      );
    } finally {
      setAuthLoading(false);
    }
  };


  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowProfile(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };


  /* =========================================================
     OPEN LOGIN
  ========================================================= */

  const openLogin = () => {
    setAuthError("");
    setAuthMessage("");
    setLoginMethod("google");
    setShowLogin(true);
  };


  /* =========================================================
     CLOSE LOGIN
  ========================================================= */

  const closeLogin = () => {
    if (authLoading) return;

    setShowLogin(false);
    setAuthError("");
    setAuthMessage("");
    setConfirmationResult(null);
    setOtp("");
  };


  /* =========================================================
     SKILL CLICK
  ========================================================= */

  const handleSkillClick = (skill) => {
    if (!skill.active) {
      setAuthMessage(`${skill.name} is coming soon.`);
      setAuthError("");
      return;
    }

    navigate(skill.path);
  };


  /* =========================================================
     DISPLAY USER NAME
  ========================================================= */

  const displayName =
    user?.displayName ||
    user?.phoneNumber ||
    "Learner";


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="home-page">

      {/* =====================================================
          ROOM
      ===================================================== */}

      <div className="room-background">

        {/* WALL */}
        <div className="room-wall">
          <div className="wall-highlight" />
          <div className="wall-panel-left" />
          <div className="wall-panel-right" />
        </div>


        {/* FLOOR */}
        <div className="room-floor">
          <div className="floor-perspective" />
        </div>


        {/* ===================================================
            CEILING
        =================================================== */}

        <div className="ceiling">

          <div className="ceiling-border" />

          <div className="ceiling-fan">

            <div className="fan-ceiling-mount" />

            <div className="fan-downrod">
              <span />
            </div>

            <div className="fan-canopy">
              <span />
            </div>

            <div className="fan-motor">
              <div className="fan-motor-top" />
              <div className="fan-motor-body" />
              <div className="fan-motor-bottom" />
            </div>

            <div className="fan-blades">

              <span className="real-blade blade-one">
                <i />
              </span>

              <span className="real-blade blade-two">
                <i />
              </span>

              <span className="real-blade blade-three">
                <i />
              </span>

              <span className="real-blade blade-four">
                <i />
              </span>

            </div>

          </div>

        </div>


        {/* ===================================================
            SOFA
        =================================================== */}

        <div className="living-sofa">

          <div className="sofa-back">
            <div className="sofa-back-seam" />
          </div>

          <div className="sofa-seat">
            <div className="seat-cushion cushion-left" />
            <div className="seat-cushion cushion-center" />
            <div className="seat-cushion cushion-right" />
          </div>

          <div className="sofa-arm sofa-arm-left" />
          <div className="sofa-arm sofa-arm-right" />

          <div className="sofa-leg sofa-leg-left" />
          <div className="sofa-leg sofa-leg-right" />

          <div className="sofa-pillow pillow-one" />
          <div className="sofa-pillow pillow-two" />

        </div>


        {/* ===================================================
            FLOOR RUG
        =================================================== */}

        <div className="living-rug">
          <div className="rug-inner">
            <div className="rug-pattern">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>


        {/* ===================================================
            SMALL COFFEE TABLE
        =================================================== */}

        <div className="coffee-table">
          <div className="table-top">
            <div className="table-reflection" />
          </div>

          <div className="table-leg table-leg-left" />
          <div className="table-leg table-leg-right" />
        </div>


        {/* ===================================================
            SIDE PLANT
        =================================================== */}

        <div className="room-plant">

          <div className="plant-pot">
            <span />
          </div>

          <div className="plant-stem stem-one" />
          <div className="plant-stem stem-two" />
          <div className="plant-stem stem-three" />

          <div className="plant-leaf leaf-one" />
          <div className="plant-leaf leaf-two" />
          <div className="plant-leaf leaf-three" />
          <div className="plant-leaf leaf-four" />
          <div className="plant-leaf leaf-five" />

        </div>


        {/* ===================================================
            HANGING BULB
        =================================================== */}

        <div className="hanging-bulb">

          <div className="bulb-wire" />

          <button
            className={`bulb-button ${
              theme === "light"
                ? "bulb-on"
                : "bulb-off"
            }`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >

            <span className="bulb-neck" />

            <span className="bulb-glass">

              {theme === "light" ? (
                <Lightbulb size={24} />
              ) : (
                <LightbulbOff size={24} />
              )}

            </span>

          </button>

        </div>


        {/* ===================================================
            LOGIN / PROFILE
        =================================================== */}

        <div className="room-login">

          {!user ? (
            <button
              className="login-button"
              onClick={openLogin}
            >
              <LogIn size={17} />
              <span>Login</span>
            </button>
          ) : (
            <div className="profile-wrapper">

              <button
                className="profile-button"
                onClick={() =>
                  setShowProfile((previous) => !previous)
                }
              >

                <span className="profile-avatar">

                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={displayName}
                    />
                  ) : (
                    <User size={17} />
                  )}

                </span>

                <span className="profile-name">
                  {displayName}
                </span>

                <ChevronDown size={16} />

              </button>


              {showProfile && (
                <div className="profile-dropdown">

                  <div className="profile-dropdown-header">

                    <div className="profile-large-avatar">

                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={displayName}
                        />
                      ) : (
                        <User size={22} />
                      )}

                    </div>

                    <div>
                      <strong>{displayName}</strong>

                      <span>
                        {user.email ||
                          user.phoneNumber ||
                          "SkillSensAI Learner"}
                      </span>
                    </div>

                  </div>


                  <div className="profile-divider" />


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
          )}

        </div>


        {/* ===================================================
            MAIN CONTENT
        =================================================== */}

        <main className="home-content">

          {/* INTRO — KEPT SMALL SO CHARACTER REMAINS MAIN FOCUS */}

          <section className="home-intro">

            <div className="brand-name">
              <span className="brand-skill">Skill</span>
              <span className="brand-sensai">SensAI</span>
            </div>

            <p>
              Learn. Practice. Analyze. Improve.
            </p>

          </section>


          {/* =================================================
              MAIN CHARACTER + SKILLS
          ================================================= */}

          <section className="skills-room">

            <div className="character-shadow" />

            <div className="samurai-container">

              <div className="samurai-aura" />

              <img
                src="/samurai.png"
                alt="SkillSensAI learner"
                className="samurai-image"
              />

            </div>


            {/* SKILL ORBIT */}

            <div className="skills-orbit">

              {skills.map((skill, index) => {

                const Icon = skill.icon;

                return (
                  <button
                    key={skill.name}
                    className={`
                      skill-circle
                      skill-${skill.color}
                      skill-position-${index + 1}
                      ${skill.active ? "skill-active" : "skill-coming"}
                    `}
                    onClick={() =>
                      handleSkillClick(skill)
                    }
                    aria-label={skill.name}
                  >

                    <span className="skill-icon">
                      <Icon size={24} />
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
              LEARNING TEXT — DIRECTLY BELOW SAMURAI + SKILLS
          ================================================= */}

          <section className="learning-flow">

            <div className="learning-flow-heading">

              <span>
                YOUR LEARNING JOURNEY
              </span>

              <h2>
                Learn. Practice. Master.
              </h2>

              <p>
                Build your skill step by step with
                SkillSensAI.
              </p>

            </div>


            <div className="learning-flow-cards">

              {/* LEARN */}

              <div className="flow-card flow-learn">

                <div className="flow-icon">
                  <BookOpen size={21} />
                </div>

                <div>
                  <span className="flow-number">
                    01
                  </span>

                  <h3>
                    Learn
                  </h3>

                  <p>
                    Follow structured lessons and
                    understand the fundamentals.
                  </p>
                </div>

              </div>


              <div className="flow-arrow">
                <ArrowRight size={19} />
              </div>


              {/* PRACTICE */}

              <div className="flow-card flow-practice">

                <div className="flow-icon">
                  <Target size={21} />
                </div>

                <div>
                  <span className="flow-number">
                    02
                  </span>

                  <h3>
                    Practice
                  </h3>

                  <p>
                    Record yourself and practise
                    what you have learned.
                  </p>
                </div>

              </div>


              <div className="flow-arrow">
                <ArrowRight size={19} />
              </div>


              {/* MASTER */}

              <div className="flow-card flow-master">

                <div className="flow-icon">
                  <Trophy size={21} />
                </div>

                <div>
                  <span className="flow-number">
                    03
                  </span>

                  <h3>
                    Master
                  </h3>

                  <p>
                    Improve through AI feedback and
                    track your progress.
                  </p>
                </div>

              </div>

            </div>


            {/* PROGRESS */}

            <div className="home-progress">

              <div className="home-progress-top">

                <span>
                  Lessons learned
                </span>

                <strong>
                  {lessonsLearned}
                </strong>

              </div>

              <div className="home-progress-track">
                <div
                  className="home-progress-fill"
                  style={{
                    width: `${Math.min(
                      lessonsLearned * 10,
                      100
                    )}%`,
                  }}
                />
              </div>

            </div>

          </section>

        </main>


        {/* COMING SOON MESSAGE */}

        {authMessage && !showLogin && (
          <div className="home-toast">
            <Sparkles size={17} />
            <span>{authMessage}</span>

            <button
              onClick={() => setAuthMessage("")}
            >
              <X size={15} />
            </button>
          </div>
        )}


        {/* ===================================================
            LOGIN MODAL
        =================================================== */}

        {showLogin && (

          <div
            className="login-overlay"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !authLoading
              ) {
                closeLogin();
              }
            }}
          >

            <div className="login-modal">

              <button
                className="login-close"
                onClick={closeLogin}
                disabled={authLoading}
                aria-label="Close"
              >
                <X size={20} />
              </button>


              <div className="login-header">

                <div className="login-logo">
                  <Sparkles size={25} />
                </div>

                <h2>
                  Welcome to{" "}
                  <span>SkillSensAI</span>
                </h2>

                <p>
                  Sign in to save your learning progress.
                </p>

              </div>


              {/* METHOD SWITCH */}

              <div className="login-tabs">

                <button
                  className={
                    loginMethod === "google"
                      ? "login-tab active"
                      : "login-tab"
                  }
                  onClick={() => {
                    setLoginMethod("google");
                    setAuthError("");
                    setAuthMessage("");
                  }}
                >
                  <Mail size={17} />
                  Google
                </button>

                <button
                  className={
                    loginMethod === "phone"
                      ? "login-tab active"
                      : "login-tab"
                  }
                  onClick={() => {
                    setLoginMethod("phone");
                    setAuthError("");
                    setAuthMessage("");
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
                    className="google-login-button"
                    onClick={handleGoogleLogin}
                    disabled={authLoading}
                  >

                    {authLoading ? (
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

                  </button>


                  <div className="login-security">

                    <ShieldCheck size={16} />

                    <span>
                      Secure authentication powered by
                      Firebase
                    </span>

                  </div>

                </div>
              )}


              {/* PHONE */}

              {loginMethod === "phone" && (

                <div className="login-method">

                  <label>
                    Mobile Number
                  </label>

                  <div className="phone-input-wrapper">

                    <Phone size={18} />

                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="+91 9876543210"
                      disabled={
                        authLoading ||
                        Boolean(confirmationResult)
                      }
                    />

                  </div>


                  {!confirmationResult ? (

                    <button
                      className="otp-button"
                      onClick={sendOtp}
                      disabled={authLoading}
                    >

                      {authLoading ? (
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

                  ) : (

                    <>
                      <label className="otp-label">
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
                        placeholder="••••••"
                        disabled={authLoading}
                      />

                      <button
                        className="otp-button"
                        onClick={verifyOtp}
                        disabled={
                          authLoading ||
                          otp.length !== 6
                        }
                      >

                        {authLoading ? (
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
                            <ShieldCheck size={18} />
                          </>
                        )}

                      </button>

                    </>
                  )}


                  <div className="login-security">

                    <ShieldCheck size={16} />

                    <span>
                      Your phone number is securely
                      authenticated with Firebase.
                    </span>

                  </div>

                </div>
              )}


              {/* ERROR */}

              {authError && (
                <div className="login-error">
                  {authError}
                </div>
              )}


              {/* MESSAGE */}

              {authMessage && (
                <div className="login-success">
                  {authMessage}
                </div>
              )}


              <div
                id="recaptcha-container"
              />

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
