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
  X,
  ShieldCheck,
  BookOpen,
  Target,
  Trophy,
  ArrowRight,
  Loader2,
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
   THEME HELPER
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

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("skillsensai_theme") || "light";
  });

  /* =======================================================
     AUTH
     ======================================================= */

  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  /* =======================================================
     LOGIN
     ======================================================= */

  const [loginOpen, setLoginOpen] = useState(false);
  const [loginMethod, setLoginMethod] = useState("google");

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
     LIGHT BULB
     ======================================================= */

  const [bulbOn, setBulbOn] = useState(true);

  /* =======================================================
     APPLY THEME
     ======================================================= */

  useEffect(() => {
    applyGlobalTheme(theme);
  }, [theme]);

  /* =======================================================
     THEME TOGGLE
     ======================================================= */

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme =
        currentTheme === "light" ? "dark" : "light";

      applyGlobalTheme(nextTheme);

      localStorage.setItem(
        "skillsensai_theme",
        nextTheme
      );

      return nextTheme;
    });
  };

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
     LOAD PROGRESS
     ======================================================= */

  useEffect(() => {
    const loadProgress = () => {
      try {
        const value = getLessonsLearned();

        if (typeof value === "number") {
          setLessonsLearned(value);
        } else {
          setLessonsLearned(0);
        }
      } catch (error) {
        console.error(
          "Unable to load lesson progress:",
          error
        );

        setLessonsLearned(0);
      }
    };

    loadProgress();

    window.addEventListener(
      "storage",
      loadProgress
    );

    window.addEventListener(
      "skillsensai-progress-updated",
      loadProgress
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadProgress
      );

      window.removeEventListener(
        "skillsensai-progress-updated",
        loadProgress
      );
    };
  }, []);

  /* =======================================================
     CLOSE PROFILE WHEN CLICKING OUTSIDE
     ======================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const profileArea =
        document.querySelector(".profile-area");

      if (
        profileArea &&
        !profileArea.contains(event.target)
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
     OPEN LOGIN
     ======================================================= */

  const openLogin = () => {
    setLoginError("");
    setLoginMethod("google");
    setPhoneStep("phone");
    setPhoneNumber("");
    setOtp("");
    setConfirmationResult(null);
    setLoginOpen(true);
  };

  /* =======================================================
     CLOSE LOGIN
     ======================================================= */

  const closeLogin = () => {
    if (loading) return;

    setLoginOpen(false);
    setLoginError("");
    setPhoneNumber("");
    setOtp("");
    setConfirmationResult(null);
    setPhoneStep("phone");
  };

  /* =======================================================
     GOOGLE LOGIN
     ======================================================= */

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLoginError("");

    try {
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(auth, provider);

      setLoginOpen(false);
      setProfileOpen(false);
    } catch (error) {
      console.error("Google login error:", error);

      if (
        error?.code ===
        "auth/popup-closed-by-user"
      ) {
        setLoginError(
          "The Google sign-in window was closed."
        );
      } else if (
        error?.code ===
        "auth/popup-blocked"
      ) {
        setLoginError(
          "Your browser blocked the Google sign-in popup. Please allow popups for this site."
        );
      } else if (
        error?.code ===
        "auth/unauthorized-domain"
      ) {
        setLoginError(
          "This website is not authorized in Firebase Authentication."
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
     PHONE NUMBER FORMAT
     ======================================================= */

  const formatPhoneNumber = (value) => {
    let cleaned = value.replace(/\D/g, "");

    if (cleaned.startsWith("91")) {
      cleaned = cleaned.substring(2);
    }

    cleaned = cleaned.substring(0, 10);

    if (cleaned.length === 0) {
      return "";
    }

    return `+91${cleaned}`;
  };

  const handlePhoneChange = (event) => {
    const formatted = formatPhoneNumber(
      event.target.value
    );

    setPhoneNumber(formatted);
    setLoginError("");
  };

  /* =======================================================
     SEND OTP
     ======================================================= */

  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length !== 13) {
      setLoginError(
        "Please enter a valid 10-digit Indian mobile number."
      );

      return;
    }

    setLoading(true);
    setLoginError("");

    try {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }

      recaptchaRef.current =
        new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => {},
            "expired-callback": () => {
              setLoginError(
                "reCAPTCHA expired. Please try again."
              );
            },
          }
        );

      const result =
        await signInWithPhoneNumber(
          auth,
          phoneNumber,
          recaptchaRef.current
        );

      setConfirmationResult(result);
      setPhoneStep("otp");
      setOtp("");
    } catch (error) {
      console.error(
        "Phone authentication error:",
        error
      );

      if (
        error?.code ===
        "auth/billing-not-enabled"
      ) {
        setLoginError(
          "Phone authentication requires Firebase billing to be enabled. Google login is available without this."
        );
      } else if (
        error?.code ===
        "auth/invalid-phone-number"
      ) {
        setLoginError(
          "The phone number is invalid."
        );
      } else if (
        error?.code ===
        "auth/too-many-requests"
      ) {
        setLoginError(
          "Too many attempts. Please try again later."
        );
      } else {
        setLoginError(
          error?.message ||
            "Unable to send OTP."
        );
      }

      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch (recaptchaError) {
          console.error(
            recaptchaError
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

  const verifyOTP = async () => {
    if (!confirmationResult) {
      setLoginError(
        "Please request a new OTP."
      );

      return;
    }

    if (otp.length !== 6) {
      setLoginError(
        "Please enter the 6-digit OTP."
      );

      return;
    }

    setLoading(true);
    setLoginError("");

    try {
      await confirmationResult.confirm(otp);

      setLoginOpen(false);
      setPhoneStep("phone");
      setPhoneNumber("");
      setOtp("");
      setConfirmationResult(null);
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
            "Unable to verify OTP."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     CHANGE PHONE NUMBER
     ======================================================= */

  const changePhoneNumber = () => {
    setPhoneStep("phone");
    setOtp("");
    setConfirmationResult(null);
    setLoginError("");
  };

  /* =======================================================
     LOGOUT
     ======================================================= */

  const handleLogout = async () => {
    try {
      await signOut(auth);

      setProfileOpen(false);
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };

  /* =======================================================
     DISPLAY NAME
     ======================================================= */

  const displayName =
    user?.displayName ||
    user?.phoneNumber ||
    "Learner";

  const displayContact =
    user?.email ||
    user?.phoneNumber ||
    "SkillSensAI learner";

  /* =======================================================
     SKILL CLICK
     ======================================================= */

  const handleSkillClick = (skill) => {
    if (!skill.active) {
      return;
    }

    navigate(skill.path);
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="home-page">
      <main className="room-background">

        {/* =================================================
            ROOM BACKGROUND
        ================================================= */}

        <div className="room-wall" />
        <div className="room-floor" />
        <div className="room-corner-glow" />

        {/* =================================================
            CEILING
        ================================================= */}

        <div className="ceiling">
          <div className="ceiling-line" />

          {/* FAN IS INTENTIONALLY NOT RENDERED
              BECAUSE HOME.CSS HIDES IT COMPLETELY */}

          <div className="hanging-bulb">

            <div className="bulb-wire" />

            <button
              type="button"
              className={`bulb-button ${
                bulbOn
                  ? "bulb-on"
                  : "bulb-off"
              }`}
              onClick={() =>
                setBulbOn((current) => !current)
              }
              aria-label={
                bulbOn
                  ? "Turn light off"
                  : "Turn light on"
              }
              title={
                bulbOn
                  ? "Turn light off"
                  : "Turn light on"
              }
            >
              <span className="bulb-neck" />

              <span className="bulb-glass">
                {bulbOn ? (
                  <Lightbulb size={20} />
                ) : (
                  <LightbulbOff size={20} />
                )}
              </span>
            </button>
          </div>
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
              <LogIn size={15} />
              Login
            </button>
          ) : (
            <div className="profile-area">

              <button
                type="button"
                className="profile-button"
                onClick={() =>
                  setProfileOpen(
                    (current) => !current
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
                    <User size={16} />
                  )}
                </span>

                <span className="profile-name">
                  {displayName}
                </span>

                <ChevronDown
                  size={14}
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
                        <User size={20} />
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
                        Lessons completed
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
                    Logout
                  </button>

                </div>
              )}

            </div>
          )}

        </div>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <div className="home-content">

          {/* =================================================
              INTRO
          ================================================= */}

          <section className="home-intro">

            <span className="home-eyebrow">
              AI-POWERED SKILL LEARNING
            </span>

            <h1>
              Learn Skills.
              <br />
              <span>Become Your Best.</span>
            </h1>

            <p>
              Learn practical skills at your own pace
              with AI guidance, expert knowledge and
              real-world practice.
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

                <div className="sofa-cushion sofa-cushion-one" />
                <div className="sofa-cushion sofa-cushion-two" />
                <div className="sofa-cushion sofa-cushion-three" />

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
                RUG
            ================================================= */}

            <div className="room-rug">
              <div className="rug-inner" />
            </div>

            {/* =================================================
                PLANT
            ================================================= */}

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
                alt="SkillSensAI character"
                className="samurai-image"
              />

            </div>

            {/* =================================================
                SKILL ORBIT
            ================================================= */}

            <div className="skills-orbit">

              {skills.map(
                (skill, index) => {
                  const Icon = skill.icon;

                  return (
                    <button
                      key={skill.name}
                      type="button"
                      className={[
                        "skill-circle",
                        `skill-${skill.color}`,
                        `skill-position-${
                          index + 1
                        }`,
                        skill.active
                          ? "skill-active"
                          : "skill-disabled",
                      ].join(" ")}
                      onClick={() =>
                        handleSkillClick(skill)
                      }
                      disabled={!skill.active}
                      title={
                        skill.active
                          ? `Learn ${skill.name}`
                          : `${skill.name} coming soon`
                      }
                    >

                      <Icon
                        className="skill-icon"
                        size={25}
                      />

                      <span className="skill-name">
                        {skill.name}
                      </span>

                      {!skill.active && (
                        <span className="coming-soon">
                          Coming Soon
                        </span>
                      )}

                    </button>
                  );
                }
              )}

            </div>

          </section>

          {/* =================================================
              LEARNING FLOW
          ================================================= */}

          <section className="learning-flow">

            <div className="flow-heading">

              <span>
                YOUR JOURNEY
              </span>

              <h2>
                Learn. Practice. Master.
              </h2>

              <p>
                Turn your curiosity into real-world
                skills.
              </p>

            </div>

            <div className="flow-cards">

              {/* =================================================
                  LEARN
              ================================================= */}

              <div className="flow-card flow-learn">

                <div className="flow-card-icon">
                  <BookOpen size={19} />
                </div>

                <div>
                  <span>
                    STEP 01
                  </span>

                  <h3>
                    Learn
                  </h3>

                  <p>
                    Follow structured lessons
                    designed around your pace
                    and skill level.
                  </p>
                </div>

                <ArrowRight
                  size={15}
                  className="flow-arrow"
                />

              </div>

              {/* =================================================
                  PRACTICE
              ================================================= */}

              <div className="flow-card flow-practice">

                <div className="flow-card-icon">
                  <Target size={19} />
                </div>

                <div>
                  <span>
                    STEP 02
                  </span>

                  <h3>
                    Practice
                  </h3>

                  <p>
                    Put your knowledge into
                    practice with real activities
                    and AI feedback.
                  </p>
                </div>

                <ArrowRight
                  size={15}
                  className="flow-arrow"
                />

              </div>

              {/* =================================================
                  MASTER
              ================================================= */}

              <div className="flow-card flow-master">

                <div className="flow-card-icon">
                  <Trophy size={19} />
                </div>

                <div>
                  <span>
                    STEP 03
                  </span>

                  <h3>
                    Master
                  </h3>

                  <p>
                    Build confidence through
                    continuous practice and
                    measurable progress.
                  </p>
                </div>

              </div>

            </div>

            <div className="home-bottom-note">
              <Sparkles size={13} />
              <span>
                SkillSensAI grows with you.
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

            <div className="login-modal">

              {/* CLOSE */}

              <button
                type="button"
                className="login-close"
                onClick={closeLogin}
                disabled={loading}
                aria-label="Close login"
              >
                <X size={17} />
              </button>

              {/* ICON */}

              <div className="login-modal-icon">
                {loginMethod === "google" ? (
                  <Mail size={25} />
                ) : (
                  <Phone size={25} />
                )}
              </div>

              {/* HEADER */}

              <div className="login-modal-header">

                <span>
                  WELCOME TO SKILLSENSAI
                </span>

                <h2>
                  Start your{" "}
                  <strong>
                    learning journey.
                  </strong>
                </h2>

                <p>
                  Sign in to save your progress,
                  continue your lessons and build
                  your skills.
                </p>

              </div>

              {/* TABS */}

              <div className="login-tabs">

                <button
                  type="button"
                  className={
                    loginMethod === "google"
                      ? "login-tab-active"
                      : ""
                  }
                  onClick={() => {
                    if (loading) return;

                    setLoginMethod(
                      "google"
                    );

                    setLoginError("");
                  }}
                >
                  <Mail size={14} />
                  Google
                </button>

                <button
                  type="button"
                  className={
                    loginMethod === "phone"
                      ? "login-tab-active"
                      : ""
                  }
                  onClick={() => {
                    if (loading) return;

                    setLoginMethod(
                      "phone"
                    );

                    setLoginError("");
                  }}
                >
                  <Phone size={14} />
                  Phone
                </button>

              </div>

              {/* =================================================
                  GOOGLE
              ================================================= */}

              {loginMethod === "google" && (
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

                    {loading
                      ? "Signing in..."
                      : "Continue with Google"}

                  </button>

                  <div className="login-security-note">
                    <ShieldCheck
                      size={13}
                    />

                    <span>
                      Your account and progress
                      are securely protected.
                    </span>
                  </div>

                </div>
              )}

              {/* =================================================
                  PHONE
              ================================================= */}

              {loginMethod === "phone" && (
                <div className="login-method-content">

                  {phoneStep === "phone" ? (
                    <>
                      <label className="login-input-label">
                        Mobile Number
                      </label>

                      <div className="login-phone-input">

                        <Phone size={16} />

                        <input
                          type="tel"
                          inputMode="numeric"
                          value={phoneNumber}
                          onChange={
                            handlePhoneChange
                          }
                          placeholder="+91 9876543210"
                          maxLength={13}
                          disabled={loading}
                        />

                      </div>

                      <button
                        type="button"
                        className="phone-login-button"
                        onClick={sendOTP}
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
                            <Phone size={17} />

                            Send OTP
                          </>
                        )}

                      </button>

                    </>
                  ) : (
                    <>
                      <label className="login-input-label">
                        Enter OTP
                      </label>

                      <div className="otp-input-wrapper">

                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={otp}
                          onChange={(event) =>
                            setOtp(
                              event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6)
                            )
                          }
                          placeholder="000000"
                          maxLength={6}
                          disabled={loading}
                        />

                      </div>

                      <button
                        type="button"
                        className="phone-login-button"
                        onClick={verifyOTP}
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
                          changePhoneNumber
                        }
                        disabled={loading}
                      >
                        Change phone number
                      </button>

                    </>
                  )}

                  <div className="login-security-note">
                    <ShieldCheck
                      size={13}
                    />

                    <span>
                      Your phone number is used
                      only for secure authentication.
                    </span>
                  </div>

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

            </div>

          </div>
        )}

        {/* =================================================
            FIREBASE RECAPTCHA
        ================================================= */}

        <div id="recaptcha-container" />

      </main>
    </div>
  );
}
