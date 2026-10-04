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
    theme === "dark"
      ? "skillsensai-dark-theme"
      : "skillsensai-light-theme";

  root.classList.add(themeClass);
  body.classList.add(themeClass);
};

export default function Home() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const [loginMethod, setLoginMethod] = useState("google");

  const [phoneNumber, setPhoneNumber] = useState("+91 ");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [theme, setTheme] = useState(
    localStorage.getItem("skillsensai_theme") || "light"
  );

  const [lessonsLearned, setLessonsLearned] = useState(0);

  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    applyGlobalTheme(theme);
    localStorage.setItem("skillsensai_theme", theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      setLessonsLearned(getLessonsLearned());
    } catch {
      setLessonsLearned(0);
    }
  }, [user]);

  useEffect(() => {
    const closeProfile = (event) => {
      if (!event.target.closest(".profile-area")) {
        setShowProfile(false);
      }
    };

    document.addEventListener("click", closeProfile);

    return () => {
      document.removeEventListener("click", closeProfile);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((previous) =>
      previous === "light" ? "dark" : "light"
    );
  };

  const openLogin = () => {
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

    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch {
        // ignore cleanup errors
      }

      recaptchaVerifierRef.current = null;
    }
  };

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
      console.error(error);

      setLoginError(
        error?.message ||
          "Google sign-in failed. Please try again."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("91")) {
      digits = digits.substring(2);
    }

    digits = digits.substring(0, 10);

    if (!digits) {
      return "+91 ";
    }

    return `+91 ${digits}`;
  };

  const handlePhoneChange = (event) => {
    setPhoneNumber(formatPhoneNumber(event.target.value));
  };

  const sendOtp = async () => {
    try {
      setLoginLoading(true);
      setLoginError("");

      const digits = phoneNumber.replace(/\D/g, "");

      if (digits.length !== 10) {
        throw new Error(
          "Please enter a valid 10-digit Indian mobile number."
        );
      }

      const fullNumber = `+91${digits}`;

      if (!recaptchaVerifierRef.current) {
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

      const result = await signInWithPhoneNumber(
        auth,
        fullNumber,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(result);
    } catch (error) {
      console.error(error);

      setLoginError(
        error?.message ||
          "Unable to send OTP. Please try again."
      );

      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore
        }

        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setLoginLoading(true);
      setLoginError("");

      if (!confirmationResult) {
        throw new Error("Please request an OTP first.");
      }

      if (!otp || otp.length < 6) {
        throw new Error("Please enter the 6-digit OTP.");
      }

      await confirmationResult.confirm(otp);

      setShowLogin(false);
      setConfirmationResult(null);
      setOtp("");
    } catch (error) {
      console.error(error);

      setLoginError(
        error?.message ||
          "Invalid OTP. Please try again."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowProfile(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSkillClick = (skill) => {
    if (!skill.active) return;

    navigate(skill.path);
  };

  return (
    <div className="home-page">
      <div className="room-background">

        {/* ROOM */}
        <div className="room-wall" />
        <div className="room-floor" />
        <div className="room-corner-glow" />

        {/* CEILING */}
        <div className="ceiling">
          <div className="ceiling-line" />

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
              <span className="blade blade-one" />
              <span className="blade blade-two" />
              <span className="blade blade-three" />
              <span className="blade blade-four" />
            </div>
          </div>
        </div>

        {/* HANGING BULB */}
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
                <Lightbulb size={22} />
              ) : (
                <LightbulbOff size={22} />
              )}
            </span>
          </button>
        </div>

        {/* LOGIN */}
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
            <div className="profile-area">
              <button
                className="profile-button"
                onClick={(event) => {
                  event.stopPropagation();
                  setShowProfile((value) => !value);
                }}
              >
                <span className="profile-avatar">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
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
                          alt="Profile"
                        />
                      ) : (
                        <User size={24} />
                      )}
                    </div>

                    <div>
                      <strong>
                        {user.displayName ||
                          "SkillSensAI Learner"}
                      </strong>

                      <span>
                        {user.email ||
                          user.phoneNumber ||
                          "Welcome back"}
                      </span>
                    </div>
                  </div>

                  <div className="profile-progress-mini">
                    <div>
                      <span>Lessons Learned</span>
                      <strong>{lessonsLearned}</strong>
                    </div>

                    <div className="profile-mini-icon">
                      <Trophy size={18} />
                    </div>
                  </div>

                  <button
                    className="logout-button"
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

        {/* MAIN */}
        <main className="home-content">

          {/* MAIN ROOM */}
          <section className="skills-room">

            {/* SOFA */}
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

            {/* RUG */}
            <div className="room-rug">
              <div className="rug-inner" />
            </div>

            {/* PLANT */}
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

            {/* CHARACTER */}
            <div className="character-shadow" />

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
                    key={skill.name}
                    className={`skill-circle skill-${skill.color} skill-position-${
                      index + 1
                    } ${
                      skill.active
                        ? "skill-active"
                        : "skill-disabled"
                    }`}
                    onClick={() =>
                      handleSkillClick(skill)
                    }
                    disabled={!skill.active}
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
              })}
            </div>
          </section>

          {/* TITLE BELOW CHARACTER */}
          <section className="home-intro">
            <span className="home-eyebrow">
              AI-POWERED SKILL LEARNING
            </span>

            <h1>
              Learn. Practice.{" "}
              <span>Master.</span>
            </h1>

            <p>
              Learn real-world skills with guided lessons,
              practical training and intelligent feedback.
            </p>
          </section>

          {/* LEARNING FLOW */}
          <section className="learning-flow">
            <div className="flow-heading">
              <span>YOUR LEARNING JOURNEY</span>

              <h2>
                Learn. Practice. Master.
              </h2>

              <p>
                Build your skill step by step with
                SkillSensAI.
              </p>
            </div>

            <div className="flow-cards">

              <div className="flow-card flow-learn">
                <div className="flow-card-icon">
                  <BookOpen size={24} />
                </div>

                <div>
                  <span>01</span>
                  <h3>Learn</h3>

                  <p>
                    Follow structured lessons and
                    understand the fundamentals.
                  </p>
                </div>

                <ArrowRight
                  className="flow-arrow"
                  size={20}
                />
              </div>

              <div className="flow-card flow-practice">
                <div className="flow-card-icon">
                  <Target size={24} />
                </div>

                <div>
                  <span>02</span>
                  <h3>Practice</h3>

                  <p>
                    Record, upload and practise your
                    skill in a practical environment.
                  </p>
                </div>

                <ArrowRight
                  className="flow-arrow"
                  size={20}
                />
              </div>

              <div className="flow-card flow-master">
                <div className="flow-card-icon">
                  <Trophy size={24} />
                </div>

                <div>
                  <span>03</span>
                  <h3>Master</h3>

                  <p>
                    Use feedback and progress tracking
                    to continuously improve.
                  </p>
                </div>
              </div>

            </div>

            <div className="home-bottom-note">
              <Sparkles size={16} />

              <span>
                Your progress grows with every practice.
              </span>
            </div>
          </section>
        </main>

        {/* LOGIN MODAL */}
        {showLogin && (
          <div
            className="login-overlay"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !loginLoading
              ) {
                closeLogin();
              }
            }}
          >
            <div className="login-modal">

              <button
                className="login-close"
                onClick={closeLogin}
                disabled={loginLoading}
              >
                <X size={20} />
              </button>

              <div className="login-modal-icon">
                <ShieldCheck size={27} />
              </div>

              <div className="login-modal-header">
                <span>WELCOME TO SKILLSENSAI</span>

                <h2>
                  Start Your{" "}
                  <strong>Learning Journey</strong>
                </h2>

                <p>
                  Sign in to save your progress,
                  lessons and achievements.
                </p>
              </div>

              <div className="login-tabs">
                <button
                  className={
                    loginMethod === "google"
                      ? "login-tab-active"
                      : ""
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
                  className={
                    loginMethod === "phone"
                      ? "login-tab-active"
                      : ""
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

              {loginMethod === "google" ? (
                <div className="login-method-content">
                  <button
                    className="google-login-button"
                    onClick={handleGoogleLogin}
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <Loader2
                        size={20}
                        className="login-spinner"
                      />
                    ) : (
                      <span className="google-symbol">
                        G
                      </span>
                    )}

                    <span>
                      {loginLoading
                        ? "Signing in..."
                        : "Continue with Google"}
                    </span>
                  </button>

                  <div className="login-security-note">
                    <ShieldCheck size={15} />

                    <span>
                      Secure authentication powered by
                      Firebase.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="login-method-content">

                  {!confirmationResult ? (
                    <>
                      <label className="login-input-label">
                        Mobile Number
                      </label>

                      <div className="login-phone-input">
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
                        className="phone-login-button"
                        onClick={sendOtp}
                        disabled={loginLoading}
                      >
                        {loginLoading ? (
                          <Loader2
                            size={19}
                            className="login-spinner"
                          />
                        ) : (
                          <Phone size={19} />
                        )}

                        {loginLoading
                          ? "Sending OTP..."
                          : "Send OTP"}
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
                          disabled={loginLoading}
                        />
                      </div>

                      <button
                        className="phone-login-button"
                        onClick={verifyOtp}
                        disabled={loginLoading}
                      >
                        {loginLoading ? (
                          <Loader2
                            size={19}
                            className="login-spinner"
                          />
                        ) : (
                          <ShieldCheck size={19} />
                        )}

                        {loginLoading
                          ? "Verifying..."
                          : "Verify OTP"}
                      </button>

                      <button
                        className="change-number-button"
                        onClick={() => {
                          setConfirmationResult(null);
                          setOtp("");
                          setLoginError("");
                        }}
                      >
                        Change number
                      </button>
                    </>
                  )}

                  <div className="login-security-note">
                    <ShieldCheck size={15} />

                    <span>
                      Your phone number is securely
                      verified by Firebase.
                    </span>
                  </div>
                </div>
              )}

              {loginError && (
                <div className="login-error">
                  {loginError}
                </div>
              )}

              <div id="recaptcha-container" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
