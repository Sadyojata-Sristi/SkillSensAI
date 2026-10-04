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
import { getLessonsLearned } from "../utils/progress";

import "./Home.css";


/* =========================================================
   SKILLS
   ========================================================= */

const skills = [
  {
    name: "Music",
    icon: Music,
    color: "music",
    active: true,
    path: "/music",
  },
  {
    name: "Martial Arts",
    icon: Swords,
    color: "martial",
    active: true,
    path: "/martial-arts",
  },
  {
    name: "Dance",
    icon: Dumbbell,
    color: "dance",
    active: false,
  },
  {
    name: "Art",
    icon: Palette,
    color: "art",
    active: false,
  },
  {
    name: "Coding",
    icon: Code2,
    color: "coding",
    active: false,
  },
  {
    name: "More",
    icon: Sparkles,
    color: "more",
    active: false,
  },
];


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

  root.classList.add(
    theme === "dark"
      ? "skillsensai-dark-theme"
      : "skillsensai-light-theme"
  );

  body.classList.add(
    theme === "dark"
      ? "skillsensai-dark-theme"
      : "skillsensai-light-theme"
  );
};


/* =========================================================
   HOME COMPONENT
   ========================================================= */

function Home() {
  const navigate = useNavigate();

  /* -------------------------------------------------------
     AUTH
     ------------------------------------------------------- */

  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const [showLogin, setShowLogin] = useState(false);
  const [loginMethod, setLoginMethod] = useState("google");

  const [phoneNumber, setPhoneNumber] = useState("+91 ");
  const [otp, setOtp] = useState("");

  const [confirmationResult, setConfirmationResult] =
    useState(null);

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const recaptchaVerifierRef = useRef(null);


  /* -------------------------------------------------------
     THEME
     ------------------------------------------------------- */

  const [theme, setTheme] = useState(
    localStorage.getItem("skillsensai_theme") || "light"
  );


  /* -------------------------------------------------------
     PROGRESS
     ------------------------------------------------------- */

  const [lessonsLearned, setLessonsLearned] = useState(0);


  /* =======================================================
     APPLY THEME
     ======================================================= */

  useEffect(() => {
    applyGlobalTheme(theme);

    localStorage.setItem(
      "skillsensai_theme",
      theme
    );
  }, [theme]);


  /* =======================================================
     FIREBASE AUTH LISTENER
     ======================================================= */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );

    return () => unsubscribe();
  }, []);


  /* =======================================================
     LOAD LESSON PROGRESS
     ======================================================= */

  useEffect(() => {
    try {
      const count = getLessonsLearned();
      setLessonsLearned(count);
    } catch (error) {
      console.error(
        "Unable to load lesson progress:",
        error
      );

      setLessonsLearned(0);
    }
  }, [user]);


  /* =======================================================
     CLOSE PROFILE WHEN CLICKING OUTSIDE
     ======================================================= */

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (
        !event.target.closest(".profile-area")
      ) {
        setShowProfile(false);
      }
    };

    document.addEventListener(
      "click",
      handleDocumentClick
    );

    return () => {
      document.removeEventListener(
        "click",
        handleDocumentClick
      );
    };
  }, []);


  /* =======================================================
     THEME TOGGLE
     ======================================================= */

  const toggleTheme = () => {
    setTheme((previous) =>
      previous === "light"
        ? "dark"
        : "light"
    );
  };


  /* =======================================================
     LOGIN
     ======================================================= */

  const openLogin = () => {
    setShowProfile(false);
    setLoginError("");
    setOtp("");
    setConfirmationResult(null);
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


  /* =======================================================
     GOOGLE LOGIN
     ======================================================= */

  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    setLoginError("");

    try {
      const provider =
        new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(
        auth,
        provider
      );

      setShowLogin(false);
    } catch (error) {
      console.error(
        "Google login error:",
        error
      );

      setLoginError(
        error?.message ||
          "Google sign-in failed. Please try again."
      );
    } finally {
      setLoginLoading(false);
    }
  };


  /* =======================================================
     PHONE FORMATTER
     ======================================================= */

  const formatPhoneNumber = (value) => {
    let cleaned = value.replace(
      /[^\d+]/g,
      ""
    );

    if (!cleaned.startsWith("+91")) {
      cleaned = "+91" + cleaned.replace(/\+/g, "");
    }

    let digits = cleaned
      .replace("+91", "")
      .replace(/\D/g, "");

    digits = digits.slice(0, 10);

    return `+91 ${digits}`;
  };


  /* =======================================================
     PHONE INPUT
     ======================================================= */

  const handlePhoneChange = (event) => {
    const formatted =
      formatPhoneNumber(
        event.target.value
      );

    setPhoneNumber(formatted);
  };


  /* =======================================================
     SEND OTP
     ======================================================= */

  const sendOtp = async () => {
    setLoginLoading(true);
    setLoginError("");

    try {
      const digits =
        phoneNumber
          .replace("+91", "")
          .replace(/\D/g, "");

      if (digits.length !== 10) {
        throw new Error(
          "Please enter a valid 10-digit Indian mobile number."
        );
      }


      if (
        !recaptchaVerifierRef.current
      ) {
        recaptchaVerifierRef.current =
          new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "invisible",
              callback: () => {},
            }
          );
      }


      const confirmation =
        await signInWithPhoneNumber(
          auth,
          `+91${digits}`,
          recaptchaVerifierRef.current
        );

      setConfirmationResult(
        confirmation
      );

      setLoginError("");
    } catch (error) {
      console.error(
        "Phone OTP error:",
        error
      );

      setLoginError(
        error?.message ||
          "Unable to send OTP. Please try again."
      );

      if (
        recaptchaVerifierRef.current
      ) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // Ignore cleanup errors
        }

        recaptchaVerifierRef.current =
          null;
      }
    } finally {
      setLoginLoading(false);
    }
  };


  /* =======================================================
     VERIFY OTP
     ======================================================= */

  const verifyOtp = async () => {
    if (!confirmationResult) {
      setLoginError(
        "Please request an OTP first."
      );

      return;
    }

    if (otp.length < 6) {
      setLoginError(
        "Please enter the 6-digit OTP."
      );

      return;
    }

    setLoginLoading(true);
    setLoginError("");

    try {
      await confirmationResult.confirm(
        otp
      );

      setShowLogin(false);
      setOtp("");
      setConfirmationResult(null);
    } catch (error) {
      console.error(
        "OTP verification error:",
        error
      );

      setLoginError(
        "Invalid OTP. Please check the code and try again."
      );
    } finally {
      setLoginLoading(false);
    }
  };


  /* =======================================================
     LOGOUT
     ======================================================= */

  const handleLogout = async () => {
    try {
      await signOut(auth);

      setShowProfile(false);
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };


  /* =======================================================
     SKILL NAVIGATION
     ======================================================= */

  const handleSkillClick = (skill) => {
    if (!skill.active) return;

    navigate(skill.path);
  };


  /* =======================================================
     USER DISPLAY INFORMATION
     ======================================================= */

  const displayName =
    user?.displayName ||
    "SkillSensAI Learner";

  const displayEmail =
    user?.email ||
    user?.phoneNumber ||
    "Learner";


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="home-page">

      {/* ===================================================
          ROOM BACKGROUND
          =================================================== */}

      <div className="room-background">

        <div className="room-wall" />

        <div className="room-floor" />

        <div className="room-corner-glow" />


        {/* =================================================
            CEILING
            ================================================= */}

        <div className="ceiling">
          <div className="ceiling-line" />

          {/*
            Ceiling fan intentionally removed.
          */}
        </div>


        {/* =================================================
            HANGING LIGHT
            ================================================= */}

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
              theme === "light"
                ? "Turn lights off"
                : "Turn lights on"
            }
            title={
              theme === "light"
                ? "Turn lights off"
                : "Turn lights on"
            }
          >

            <span className="bulb-neck" />

            <span className="bulb-glass">

              {theme === "light" ? (
                <Lightbulb size={22} />
              ) : (
                <LightbulbOff size={22} />
              )}

            </span>

          </button>

        </div>


        {/* =================================================
            LOGIN / PROFILE
            ================================================= */}

        <div className="room-login">

          {!user ? (

            <button
              type="button"
              className="login-button"
              onClick={openLogin}
            >
              <LogIn size={18} />

              <span>Login</span>
            </button>

          ) : (

            <div className="profile-area">

              <button
                type="button"
                className="profile-button"
                onClick={(event) => {
                  event.stopPropagation();

                  setShowProfile(
                    (previous) =>
                      !previous
                  );
                }}
              >

                <span className="profile-avatar">

                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={displayName}
                    />
                  ) : (
                    <User size={18} />
                  )}

                </span>

                <span className="profile-name">
                  {displayName}
                </span>

                <ChevronDown
                  size={16}
                  className={
                    showProfile
                      ? "profile-chevron-open"
                      : ""
                  }
                />

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
                        <User size={24} />
                      )}

                    </div>

                    <div>

                      <strong>
                        {displayName}
                      </strong>

                      <span>
                        {displayEmail}
                      </span>

                    </div>

                  </div>


                  <div className="profile-progress">

                    <div className="profile-progress-icon">
                      <BookOpen size={18} />
                    </div>

                    <div>

                      <strong>
                        {lessonsLearned}
                      </strong>

                      <span>
                        Lessons completed
                      </span>

                    </div>

                  </div>


                  <button
                    type="button"
                    className="logout-button"
                    onClick={handleLogout}
                  >
                    <LogOut size={17} />

                    <span>
                      Sign out
                    </span>
                  </button>

                </div>

              )}

            </div>

          )}

        </div>


        {/* =================================================
            MAIN CONTENT
            ================================================= */}

        <main className="home-content">

          {/* =================================================
              INTRO
              ================================================= */}

          <section className="home-intro">

            <span className="home-eyebrow">
              AI-POWERED SKILL LEARNING
            </span>

            <h1>
              Learn. Practice.{" "}
              <span>Master.</span>
            </h1>

            <p>
              Learn real-world skills with
              guided lessons, practical
              training and intelligent
              feedback.
            </p>

          </section>


          {/* =================================================
              SKILL ROOM
              ================================================= */}

          <section className="skills-room">

            {/* =================================================
                SOFA
                ================================================= */}

            <div className="room-sofa">

              <div className="sofa-back">

                <span
                  className="sofa-cushion sofa-cushion-one"
                />

                <span
                  className="sofa-cushion sofa-cushion-two"
                />

                <span
                  className="sofa-cushion sofa-cushion-three"
                />

              </div>


              <div className="sofa-seat">
                <span />
              </div>


              <div className="sofa-arm sofa-arm-left" />

              <div className="sofa-arm sofa-arm-right" />


              <div className="sofa-leg sofa-leg-left" />

              <div className="sofa-leg sofa-leg-right" />

            </div>


            {/* =================================================
                FLOOR MAT / RUG
                ================================================= */}

            <div className="room-rug">

              <div className="rug-inner" />

            </div>


            {/* =================================================
                PLANT
                ================================================= */}

            <div className="room-plant">

              <div className="plant-pot">
                <span />
              </div>

              <div className="plant-stem stem-one" />

              <div className="plant-stem stem-two" />

              <div className="plant-stem stem-three" />

              <div className="plant-stem stem-four" />


              <span className="plant-leaf leaf-one" />

              <span className="plant-leaf leaf-two" />

              <span className="plant-leaf leaf-three" />

              <span className="plant-leaf leaf-four" />

              <span className="plant-leaf leaf-five" />

              <span className="plant-leaf leaf-six" />

            </div>


            {/* =================================================
                CHARACTER SHADOW
                ================================================= */}

            <div className="character-shadow" />


            {/* =================================================
                SAMURAI
                ================================================= */}

            <div className="samurai-container">

              <div className="samurai-aura" />

              <img
                src="/samurai.png"
                alt="SkillSensAI learner"
                className="samurai-image"
              />

            </div>


            {/* =================================================
                SKILL ORBIT
                ================================================= */}

            <div className="skills-orbit">

              {skills.map(
                (skill, index) => {

                  const Icon =
                    skill.icon;

                  return (
                    <button
                      key={skill.name}
                      type="button"
                      className={`
                        skill-circle
                        skill-${skill.color}
                        skill-position-${index + 1}
                        ${
                          skill.active
                            ? "skill-active"
                            : "skill-disabled"
                        }
                      `}
                      onClick={() =>
                        handleSkillClick(
                          skill
                        )
                      }
                      disabled={
                        !skill.active
                      }
                    >

                      <span className="skill-icon">

                        <Icon size={25} />

                      </span>


                      <span className="skill-name">
                        {skill.name}
                      </span>


                      {!skill.active && (
                        <span className="coming-soon">
                          Soon
                        </span>
                      )}

                    </button>
                  );

                }
              )}

            </div>

          </section>


          {/* =================================================
              ONE — LEARN / PRACTICE / MASTER
              ================================================= */}

          <section className="learning-flow">

            <div className="flow-heading">

              <span>
                YOUR LEARNING JOURNEY
              </span>

              <h2>
                Learn. Practice. Master.
              </h2>

              <p>
                Build your skill step by step
                with SkillSensAI.
              </p>

            </div>


            <div className="flow-cards">

              {/* LEARN */}

              <div className="flow-card flow-learn">

                <div className="flow-card-icon">
                  <BookOpen size={24} />
                </div>

                <div>

                  <span>01</span>

                  <h3>
                    Learn
                  </h3>

                  <p>
                    Follow structured lessons
                    and understand the
                    fundamentals.
                  </p>

                </div>

                <ArrowRight
                  className="flow-arrow"
                  size={20}
                />

              </div>


              {/* PRACTICE */}

              <div className="flow-card flow-practice">

                <div className="flow-card-icon">
                  <Target size={24} />
                </div>

                <div>

                  <span>02</span>

                  <h3>
                    Practice
                  </h3>

                  <p>
                    Record, upload and
                    practise your skill in
                    a practical environment.
                  </p>

                </div>

                <ArrowRight
                  className="flow-arrow"
                  size={20}
                />

              </div>


              {/* MASTER */}

              <div className="flow-card flow-master">

                <div className="flow-card-icon">
                  <Trophy size={24} />
                </div>

                <div>

                  <span>03</span>

                  <h3>
                    Master
                  </h3>

                  <p>
                    Use feedback and progress
                    tracking to continuously
                    improve.
                  </p>

                </div>

              </div>

            </div>


            {/* =================================================
                BOTTOM NOTE
                ================================================= */}

            <div className="home-bottom-note">

              <Sparkles size={16} />

              <span>
                Your progress grows with
                every practice.
              </span>

            </div>

          </section>

        </main>

      </div>


      {/* =====================================================
          LOGIN MODAL
          ===================================================== */}

      {showLogin && (

        <div
          className="login-overlay"
          onClick={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeLogin();
            }

          }}
        >

          <div className="login-modal">

            {/* CLOSE */}

            <button
              type="button"
              className="login-close"
              onClick={closeLogin}
              aria-label="Close login"
            >
              <X size={20} />
            </button>


            {/* HEADER */}

            <div className="login-header">

              <div className="login-shield">
                <ShieldCheck size={28} />
              </div>

              <h2>
                Welcome to SkillSensAI
              </h2>

              <p>
                Sign in to save your
                learning progress.
              </p>

            </div>


            {/* TABS */}

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

              <div className="login-method-content">

                <button
                  type="button"
                  className="google-login-button"
                  onClick={
                    handleGoogleLogin
                  }
                  disabled={loginLoading}
                >

                  {loginLoading ? (
                    <Loader2
                      size={20}
                      className="login-spinner"
                    />
                  ) : (
                    <span className="google-logo">
                      G
                    </span>
                  )}

                  <span>
                    Continue with Google
                  </span>

                </button>

              </div>

            )}


            {/* PHONE */}

            {loginMethod === "phone" && (

              <div className="login-method-content">

                <label className="login-label">
                  Mobile number
                </label>

                <div className="login-input-wrapper">

                  <Phone size={18} />

                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={
                      handlePhoneChange
                    }
                    placeholder="+91 9876543210"
                    disabled={
                      loginLoading ||
                      !!confirmationResult
                    }
                  />

                </div>


                {!confirmationResult ? (

                  <button
                    type="button"
                    className="otp-button"
                    onClick={sendOtp}
                    disabled={loginLoading}
                  >

                    {loginLoading ? (
                      <>
                        <Loader2
                          size={18}
                          className="login-spinner"
                        />

                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Send OTP
                        <ArrowRight
                          size={18}
                        />
                      </>
                    )}

                  </button>

                ) : (

                  <>

                    <label className="login-label">
                      Enter OTP
                    </label>

                    <div className="login-input-wrapper">

                      <ShieldCheck
                        size={18}
                      />

                      <input
                        type="text"
                        value={otp}
                        onChange={(event) =>
                          setOtp(
                            event.target.value
                              .replace(
                                /\D/g,
                                ""
                              )
                              .slice(0, 6)
                          )
                        }
                        placeholder="6-digit OTP"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        disabled={
                          loginLoading
                        }
                      />

                    </div>


                    <button
                      type="button"
                      className="otp-button"
                      onClick={
                        verifyOtp
                      }
                      disabled={
                        loginLoading
                      }
                    >

                      {loginLoading ? (
                        <>
                          <Loader2
                            size={18}
                            className="login-spinner"
                          />

                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify OTP
                          <ArrowRight
                            size={18}
                          />
                        </>
                      )}

                    </button>


                    <button
                      type="button"
                      className="change-number-button"
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


            {/* ERROR */}

            {loginError && (

              <div className="login-error">
                {loginError}
              </div>

            )}


            {/* SECURITY */}

            <div className="login-security">

              <ShieldCheck size={16} />

              <span>
                Your account is securely
                authenticated by Firebase.
              </span>

            </div>


            {/* INVISIBLE RECAPTCHA */}

            <div
              id="recaptcha-container"
            />

          </div>

        </div>

      )}

    </div>
  );
}


export default Home;
