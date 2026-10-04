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
   GLOBAL THEME HELPER
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

  const className =
    theme === "dark"
      ? "skillsensai-dark-theme"
      : "skillsensai-light-theme";

  root.classList.add(className);
  body.classList.add(className);
};

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
   HOME
   ========================================================= */

export default function Home() {
  const navigate = useNavigate();

  /* =======================================================
     THEME
     ======================================================= */

  const [theme, setTheme] = useState(
    localStorage.getItem("skillsensai_theme") || "light"
  );

  /* =======================================================
     AUTH
     ======================================================= */

  const [user, setUser] = useState(null);

  const [profileOpen, setProfileOpen] = useState(false);

  const [loginOpen, setLoginOpen] = useState(false);

  const [loginMethod, setLoginMethod] = useState("google");

  /* =======================================================
     PHONE LOGIN
     ======================================================= */

  const [phoneNumber, setPhoneNumber] = useState("");

  const [otp, setOtp] = useState("");

  const [confirmationResult, setConfirmationResult] =
    useState(null);

  const [phoneStep, setPhoneStep] = useState("phone");

  const [loading, setLoading] = useState(false);

  const [loginError, setLoginError] = useState("");

  const recaptchaRef = useRef(null);

  /* =======================================================
     PROGRESS
     ======================================================= */

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
    const loadProgress = () => {
      try {
        const count = getLessonsLearned();
        setLessonsLearned(
          typeof count === "number" ? count : 0
        );
      } catch (error) {
        console.error(
          "Unable to load lesson progress:",
          error
        );

        setLessonsLearned(0);
      }
    };

    loadProgress();

    const handleStorage = () => {
      loadProgress();
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    window.addEventListener(
      "skillsensai-progress-updated",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.removeEventListener(
        "skillsensai-progress-updated",
        handleStorage
      );
    };
  }, []);

  /* =======================================================
     CLOSE PROFILE WHEN CLICKING OUTSIDE
     ======================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        !event.target.closest(".profile-area")
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
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
     SKILL CLICK
     ======================================================= */

  const handleSkillClick = (skill) => {
    if (!skill.active) {
      return;
    }

    if (skill.path) {
      navigate(skill.path);
    }
  };

  /* =======================================================
     OPEN LOGIN
     ======================================================= */

  const openLogin = () => {
    setLoginOpen(true);
    setProfileOpen(false);
    setLoginError("");
  };

  /* =======================================================
     CLOSE LOGIN
     ======================================================= */

  const closeLogin = () => {
    setLoginOpen(false);

    setLoginError("");

    setLoading(false);

    setOtp("");

    setPhoneStep("phone");

    setConfirmationResult(null);

    if (recaptchaRef.current) {
      try {
        recaptchaRef.current.clear();
      } catch (error) {
        console.warn(
          "reCAPTCHA cleanup failed:",
          error
        );
      }

      recaptchaRef.current = null;
    }
  };

  /* =======================================================
     GOOGLE LOGIN
     ======================================================= */

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setLoginError("");

      const provider =
        new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(
        auth,
        provider
      );

      setLoginOpen(false);
      setProfileOpen(false);
    } catch (error) {
      console.error(
        "Google login error:",
        error
      );

      if (
        error?.code ===
        "auth/popup-closed-by-user"
      ) {
        setLoginError(
          "Login window was closed."
        );
      } else if (
        error?.code ===
        "auth/popup-blocked"
      ) {
        setLoginError(
          "Your browser blocked the login popup. Please allow popups for this site."
        );
      } else {
        setLoginError(
          error?.message ||
            "Google login failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     NORMALIZE PHONE NUMBER
     ======================================================= */

  const getFormattedPhoneNumber = () => {
    let value = phoneNumber.trim();

    value = value.replace(
      /[\s()-]/g,
      ""
    );

    if (!value) {
      return "";
    }

    if (value.startsWith("+")) {
      return value;
    }

    if (value.startsWith("91")) {
      return `+${value}`;
    }

    return `+91${value}`;
  };

  /* =======================================================
     SEND OTP
     ======================================================= */

  const handleSendOtp = async () => {
    try {
      setLoginError("");

      const formattedNumber =
        getFormattedPhoneNumber();

      if (!formattedNumber) {
        setLoginError(
          "Please enter your phone number."
        );
        return;
      }

      const digits =
        formattedNumber.replace(
          /\D/g,
          ""
        );

      if (
        digits.length < 10 ||
        digits.length > 15
      ) {
        setLoginError(
          "Please enter a valid phone number."
        );
        return;
      }

      setLoading(true);

      /* ---------------------------------------------
         Clear old reCAPTCHA if one exists
      --------------------------------------------- */

      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch (error) {
          console.warn(
            "Old reCAPTCHA cleanup:",
            error
          );
        }

        recaptchaRef.current = null;
      }

      /* ---------------------------------------------
         Create Firebase reCAPTCHA
      --------------------------------------------- */

      recaptchaRef.current =
        new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => {
              console.log(
                "reCAPTCHA verified"
              );
            },
            "expired-callback": () => {
              setLoginError(
                "reCAPTCHA expired. Please try again."
              );
            },
          }
        );

      await recaptchaRef.current.render();

      /* ---------------------------------------------
         Send OTP
      --------------------------------------------- */

      const result =
        await signInWithPhoneNumber(
          auth,
          formattedNumber,
          recaptchaRef.current
        );

      setConfirmationResult(result);

      setPhoneNumber(
        formattedNumber
      );

      setPhoneStep("otp");

      setOtp("");

      setLoginError("");
    } catch (error) {
      console.error(
        "Phone OTP error:",
        error
      );

      if (
        error?.code ===
        "auth/invalid-phone-number"
      ) {
        setLoginError(
          "The phone number is invalid. Please check it and try again."
        );
      } else if (
        error?.code ===
        "auth/too-many-requests"
      ) {
        setLoginError(
          "Too many attempts. Please wait and try again later."
        );
      } else if (
        error?.code ===
        "auth/quota-exceeded"
      ) {
        setLoginError(
          "SMS quota exceeded. Please try again later."
        );
      } else {
        setLoginError(
          error?.message ||
            "Unable to send OTP. Please try again."
        );
      }

      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch (cleanupError) {
          console.warn(
            "reCAPTCHA cleanup:",
            cleanupError
          );
        }

        recaptchaRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     VERIFY OTP
     ======================================================= */

  const handleVerifyOtp = async () => {
    try {
      setLoginError("");

      if (!confirmationResult) {
        setLoginError(
          "Please request a new OTP."
        );
        return;
      }

      if (!otp || otp.length < 6) {
        setLoginError(
          "Please enter the 6-digit OTP."
        );
        return;
      }

      setLoading(true);

      await confirmationResult.confirm(
        otp
      );

      setLoginOpen(false);

      setProfileOpen(false);

      setOtp("");

      setConfirmationResult(null);

      setPhoneStep("phone");
    } catch (error) {
      console.error(
        "OTP verification error:",
        error
      );

      if (
        error?.code ===
        "auth/invalid-verification-code"
      ) {
        setLoginError(
          "Incorrect OTP. Please check the code and try again."
        );
      } else if (
        error?.code ===
        "auth/code-expired"
      ) {
        setLoginError(
          "This OTP has expired. Please request a new one."
        );
      } else {
        setLoginError(
          error?.message ||
            "OTP verification failed."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     CHANGE PHONE NUMBER
     ======================================================= */

  const handleChangePhone = () => {
    setPhoneStep("phone");

    setOtp("");

    setConfirmationResult(null);

    setLoginError("");

    if (recaptchaRef.current) {
      try {
        recaptchaRef.current.clear();
      } catch (error) {
        console.warn(
          "reCAPTCHA cleanup:",
          error
        );
      }

      recaptchaRef.current = null;
    }
  };

  /* =======================================================
     LOGOUT
     ======================================================= */

  const handleLogout = async () => {
    try {
      await signOut(auth);

      setUser(null);

      setProfileOpen(false);
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };

  /* =======================================================
     PHONE INPUT
     ======================================================= */

  const handlePhoneChange = (event) => {
    let value =
      event.target.value;

    value = value.replace(
      /[^\d+]/g,
      ""
    );

    if (
      value.includes("+") &&
      !value.startsWith("+")
    ) {
      value =
        "+" +
        value.replace(/\+/g, "");
    }

    setPhoneNumber(value);
  };

  /* =======================================================
     OTP INPUT
     ======================================================= */

  const handleOtpChange = (event) => {
    const value =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 6);

    setOtp(value);
  };

  /* =======================================================
     DISPLAY USER NAME
     ======================================================= */

  const displayName =
    user?.displayName ||
    user?.phoneNumber ||
    "Learner";

  /* =======================================================
     DISPLAY USER EMAIL / PHONE
     ======================================================= */

  const displayContact =
    user?.email ||
    user?.phoneNumber ||
    "SkillSensAI learner";

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="home-page">
      <main className="room-background">

        {/* =================================================
            BACKGROUND
        ================================================= */}

        <div className="room-wall" />

        <div className="room-floor" />

        <div className="room-corner-glow" />

        {/* =================================================
            CEILING
        ================================================= */}

        <div className="ceiling">
          <div className="ceiling-line" />

          {/* Fan elements intentionally remain in JSX
              because your CSS hides them completely. */}
          <div className="ceiling-fan">
            <div className="fan-ceiling-mount" />
            <div className="fan-rod">
              <span />
            </div>

            <div className="fan-motor">
              <span className="motor-top" />
              <span className="motor-middle" />
              <span className="motor-bottom" />
            </div>

            <div className="fan-blades">
              <div className="blade blade-one" />
              <div className="blade blade-two" />
              <div className="blade blade-three" />
              <div className="blade blade-four" />
            </div>
          </div>
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
              <LogIn size={16} />
              <span>Login</span>
            </button>
          ) : (
            <div className="profile-area">
              <button
                type="button"
                className="profile-button"
                onClick={() =>
                  setProfileOpen(
                    (previous) =>
                      !previous
                  )
                }
                aria-expanded={profileOpen}
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

                <ChevronDown
                  size={15}
                  className={
                    profileOpen
                      ? "profile-chevron-open"
                      : ""
                  }
                />
              </button>

              {profileOpen && (
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
                      <strong>
                        {displayName}
                      </strong>

                      <span>
                        {displayContact}
                      </span>
                    </div>
                  </div>

                  <div className="profile-progress-mini">
                    <div>
                      <span>
                        Lessons learned
                      </span>

                      <strong>
                        {lessonsLearned}
                      </strong>
                    </div>

                    <div className="profile-mini-icon">
                      <Trophy size={18} />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="logout-button"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
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

            IMPORTANT:
            Only the room itself is inside skills-room.
            This matches your current CSS positions.
        ================================================= */}

        <div className="home-content">

          {/* =================================================
              INTRO
          ================================================= */}

          <section className="home-intro">
            <span className="home-eyebrow">
              WELCOME TO SKILLSENSAI
            </span>

            <h1>
              Learn Skills.
              <span> Your Way.</span>
            </h1>

            <p>
              Learn from structured lessons,
              practice with real activities,
              and improve with intelligent
              feedback.
            </p>
          </section>

          {/* =================================================
              SKILL ROOM
          ================================================= */}

          <section className="skills-room">

            {/* ===============================================
                SOFA
            =============================================== */}

            <div className="room-sofa">
              <div className="sofa-back">
                <span className="sofa-cushion sofa-cushion-one" />
                <span className="sofa-cushion sofa-cushion-two" />
                <span className="sofa-cushion sofa-cushion-three" />
              </div>

              <div className="sofa-seat">
                <span />
              </div>

              <div className="sofa-arm sofa-arm-left" />
              <div className="sofa-arm sofa-arm-right" />

              <div className="sofa-leg sofa-leg-left" />
              <div className="sofa-leg sofa-leg-right" />
            </div>

            {/* ===============================================
                RUG
            =============================================== */}

            <div className="room-rug">
              <div className="rug-inner" />
            </div>

            {/* ===============================================
                PLANT
            =============================================== */}

            <div className="room-plant">

              <div className="plant-stem stem-one" />
              <div className="plant-stem stem-two" />
              <div className="plant-stem stem-three" />
              <div className="plant-stem stem-four" />

              <div className="plant-leaf leaf-one" />
              <div className="plant-leaf leaf-two" />
              <div className="plant-leaf leaf-three" />
              <div className="plant-leaf leaf-four" />
              <div className="plant-leaf leaf-five" />
              <div className="plant-leaf leaf-six" />

              <div className="plant-pot">
                <span />
              </div>

            </div>

            {/* ===============================================
                CHARACTER SHADOW
            =============================================== */}

            <div className="character-shadow" />

            {/* ===============================================
                SAMURAI
            =============================================== */}

            <div className="samurai-container">

              <div className="samurai-aura" />

              <img
                src="/samurai.png"
                alt="SkillSensAI learner"
                className="samurai-image"
              />

            </div>

            {/* ===============================================
                SKILL ORBIT

                This MUST stay inside .skills-room.
                Your CSS positions all six buttons relative
                to this room.
            =============================================== */}

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
                      aria-label={
                        skill.active
                          ? `Open ${skill.name}`
                          : `${skill.name} coming soon`
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
              LEARNING JOURNEY

              Only ONE learning journey section.
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
                Build your skill step by
                step with SkillSensAI.
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
                    Follow structured
                    lessons and understand
                    the fundamentals.
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
                    Use feedback and
                    progress tracking to
                    continuously improve.
                  </p>
                </div>

              </div>

            </div>

            <div className="home-bottom-note">
              <Sparkles size={16} />

              <span>
                Your progress grows with
                every practice.
              </span>
            </div>

          </section>

        </div>

        {/* =================================================
            LOGIN MODAL
        ================================================= */}

        {loginOpen && (
          <div
            className="login-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeLogin();
              }
            }}
          >
            <div
              className="login-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              {/* CLOSE */}

              <button
                type="button"
                className="login-close"
                onClick={closeLogin}
                aria-label="Close login"
              >
                <X size={18} />
              </button>

              {/* HEADER */}

              <div className="login-modal-header">

                <div className="login-modal-icon">
                  <ShieldCheck size={27} />
                </div>

                <span>
                  SKILLSENSAI ACCOUNT
                </span>

                <h2>
                  Welcome to{" "}
                  <strong>
                    SkillSensAI
                  </strong>
                </h2>

                <p>
                  Sign in to save your
                  learning progress and
                  continue your journey.
                </p>

              </div>

              {/* TABS */}

              <div className="login-tabs">

                <button
                  type="button"
                  className={
                    loginMethod ===
                    "google"
                      ? "login-tab login-tab-active"
                      : "login-tab"
                  }
                  onClick={() => {
                    setLoginMethod(
                      "google"
                    );
                    setLoginError("");
                  }}
                >
                  <Mail size={15} />
                  Google
                </button>

                <button
                  type="button"
                  className={
                    loginMethod ===
                    "phone"
                      ? "login-tab login-tab-active"
                      : "login-tab"
                  }
                  onClick={() => {
                    setLoginMethod(
                      "phone"
                    );
                    setLoginError("");
                  }}
                >
                  <Phone size={15} />
                  Phone
                </button>

              </div>

              {/* =================================================
                  GOOGLE
              ================================================= */}

              {loginMethod ===
                "google" && (
                <div className="login-method-content">

                  <button
                    type="button"
                    className="google-login-button"
                    onClick={
                      handleGoogleLogin
                    }
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2
                        size={18}
                        className="login-spinner"
                      />
                    ) : (
                      <span className="google-symbol">
                        G
                      </span>
                    )}

                    <span>
                      {loading
                        ? "Signing in..."
                        : "Continue with Google"}
                    </span>
                  </button>

                </div>
              )}

              {/* =================================================
                  PHONE
              ================================================= */}

              {loginMethod ===
                "phone" && (
                <div className="login-method-content">

                  {phoneStep ===
                  "phone" ? (
                    <>
                      <label className="login-input-label">
                        Phone number
                      </label>

                      <div className="login-phone-input">

                        <Phone
                          size={16}
                        />

                        <input
                          type="tel"
                          value={
                            phoneNumber
                          }
                          onChange={
                            handlePhoneChange
                          }
                          placeholder="+91 9876543210"
                          autoComplete="tel"
                          disabled={loading}
                        />

                      </div>

                      <button
                        type="button"
                        className="phone-login-button"
                        onClick={
                          handleSendOtp
                        }
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2
                              size={17}
                              className="login-spinner"
                            />

                            Sending OTP...
                          </>
                        ) : (
                          <>
                            <Phone
                              size={17}
                            />

                            Send OTP
                          </>
                        )}
                      </button>

                    </>
                  ) : (
                    <>
                      <label className="login-input-label">
                        Enter the OTP
                      </label>

                      <div className="otp-input-wrapper">

                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otp}
                          onChange={
                            handleOtpChange
                          }
                          placeholder="000000"
                          autoComplete="one-time-code"
                          disabled={loading}
                          autoFocus
                        />

                      </div>

                      <button
                        type="button"
                        className="phone-login-button"
                        onClick={
                          handleVerifyOtp
                        }
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2
                              size={17}
                              className="login-spinner"
                            />

                            Verifying...
                          </>
                        ) : (
                          <>
                            <ShieldCheck
                              size={17}
                            />

                            Verify OTP
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="change-number-button"
                        onClick={
                          handleChangePhone
                        }
                        disabled={loading}
                      >
                        Change phone number
                      </button>
                    </>
                  )}

                </div>
              )}

              {/* =================================================
                  ERROR
              ================================================= */}

              {loginError && (
                <div className="login-error">
                  {loginError}
                </div>
              )}

              {/* =================================================
                  SECURITY
              ================================================= */}

              <div className="login-security-note">
                <ShieldCheck size={13} />

                <span>
                  Your account and learning
                  progress are securely
                  protected by Firebase
                  Authentication.
                </span>
              </div>

            </div>
          </div>
        )}

        {/* =================================================
            INVISIBLE FIREBASE RECAPTCHA

            Must exist in DOM for phone authentication.
        ================================================= */}

        <div id="recaptcha-container" />

      </main>
    </div>
  );
}
