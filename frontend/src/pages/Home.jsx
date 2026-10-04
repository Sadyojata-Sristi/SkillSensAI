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
   THEME
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
     STATE
     ======================================================= */

  const [theme, setTheme] = useState(
    localStorage.getItem("skillsensai_theme") || "light"
  );

  const [user, setUser] = useState(null);

  const [profileOpen, setProfileOpen] = useState(false);

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
     THEME TOGGLE
     ======================================================= */

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme =
        currentTheme === "light"
          ? "dark"
          : "light";

      applyGlobalTheme(nextTheme);

      localStorage.setItem(
        "skillsensai_theme",
        nextTheme
      );

      return nextTheme;
    });
  };

  /* =======================================================
     FIREBASE AUTH
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
     LESSON PROGRESS
     ======================================================= */

  useEffect(() => {
    const loadProgress = () => {
      try {
        const count = getLessonsLearned();

        setLessonsLearned(
          typeof count === "number"
            ? count
            : 0
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

    const handleProgressUpdate = () => {
      loadProgress();
    };

    window.addEventListener(
      "storage",
      handleProgressUpdate
    );

    window.addEventListener(
      "skillsensai-progress-updated",
      handleProgressUpdate
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleProgressUpdate
      );

      window.removeEventListener(
        "skillsensai-progress-updated",
        handleProgressUpdate
      );
    };
  }, []);

  /* =======================================================
     CLOSE PROFILE OUTSIDE
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
     LOGIN
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
      } else if (
        error?.code ===
        "auth/unauthorized-domain"
      ) {
        setLoginError(
          "This website is not authorized in Firebase. Add skillsensai.vercel.app to Authorized domains."
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
     PHONE FORMAT
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
      setLoading(true);
      setLoginError("");

      const formattedNumber =
        getFormattedPhoneNumber();

      if (
        !formattedNumber ||
        formattedNumber.length < 12
      ) {
        setLoginError(
          "Please enter a valid Indian phone number."
        );

        setLoading(false);
        return;
      }

      if (!recaptchaRef.current) {
        recaptchaRef.current =
          new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "invisible",
              callback: () => {},
              "expired-callback": () => {
                recaptchaRef.current = null;
              },
            }
          );
      }

      await recaptchaRef.current.render();

      const result =
        await signInWithPhoneNumber(
          auth,
          formattedNumber,
          recaptchaRef.current
        );

      setConfirmationResult(result);
      setPhoneStep("otp");
      setOtp("");
    } catch (error) {
      console.error(
        "Phone login error:",
        error
      );

      if (
        error?.code ===
        "auth/invalid-phone-number"
      ) {
        setLoginError(
          "Please enter a valid phone number."
        );
      } else if (
        error?.code ===
        "auth/too-many-requests"
      ) {
        setLoginError(
          "Too many attempts. Please try again later."
        );
      } else if (
        error?.code ===
        "auth/quota-exceeded"
      ) {
        setLoginError(
          "SMS quota has been exceeded."
        );
      } else if (
        error?.code ===
        "auth/billing-not-enabled"
      ) {
        setLoginError(
          "Phone authentication requires Firebase billing."
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

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      setLoginError("");

      if (!confirmationResult) {
        setLoginError(
          "Please request an OTP first."
        );

        setLoading(false);
        return;
      }

      if (!otp || otp.length < 6) {
        setLoginError(
          "Please enter the 6-digit OTP."
        );

        setLoading(false);
        return;
      }

      await confirmationResult.confirm(
        otp
      );

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
          "Incorrect OTP. Please try again."
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
     CHANGE PHONE
     ======================================================= */

  const handleChangeNumber = () => {
    setPhoneStep("phone");
    setOtp("");
    setConfirmationResult(null);
    setLoginError("");

    if (recaptchaRef.current) {
      try {
        recaptchaRef.current.clear();
      } catch (error) {
        console.error(error);
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
     DISPLAY USER
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
     JSX
     ======================================================= */

  return (
    <div className="home-page">
      <main className="room-background">
        <div className="room-wall" />
        <div className="room-floor" />
        <div className="room-corner-glow" />

        {/* =================================================
            CEILING
        ================================================= */}

        <div className="ceiling">
          <div className="ceiling-line" />

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
              <LogIn size={17} />
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

              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-avatar">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={displayName}
                        />
                      ) : (
                        <User size={18} />
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

                  <div className="profile-progress">
                    <div className="profile-progress-icon">
                      <BookOpen size={16} />
                    </div>

                    <div>
                      <strong>
                        {lessonsLearned} lessons
                      </strong>

                      <span>
                        completed
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="logout-button"
                    onClick={
                      handleLogout
                    }
                  >
                    <LogOut size={17} />
                    <span>
                      Logout
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

        <div className="home-content">
          {/* =================================================
              INTRO
          ================================================= */}

          <section className="home-intro">
            <span className="home-eyebrow">
              WELCOME TO SKILLSENSAI
            </span>

            <h1>
              Learn Skills.{" "}
              <span>Your Way.</span>
            </h1>

            <p>
              Learn from structured lessons,
              practice with real activities,
              and improve with intelligent
              feedback.
            </p>
          </section>

          {/* =================================================
              SKILLS ROOM
          ================================================= */}

          <section className="skills-room">
            {/* SOFA */}

            <div className="room-sofa">
              <div className="sofa-back" />
              <div className="sofa-seat" />
              <div className="sofa-arm sofa-arm-left" />
              <div className="sofa-arm sofa-arm-right" />
            </div>

            {/* RUG */}

            <div className="room-rug">
              <div className="rug-inner" />
            </div>

            {/* PLANT */}

            <div className="room-plant">
              <div className="plant-stem" />

              <div className="plant-leaf leaf-1" />
              <div className="plant-leaf leaf-2" />
              <div className="plant-leaf leaf-3" />
              <div className="plant-leaf leaf-4" />
              <div className="plant-leaf leaf-5" />
              <div className="plant-leaf leaf-6" />

              <div className="plant-pot">
                <div className="plant-pot-rim" />
              </div>
            </div>

            {/* CHARACTER SHADOW */}

            <div className="character-shadow" />

            {/* SAMURAI */}

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
              {skills.map(
                (skill, index) => {
                  const Icon =
                    skill.icon;

                  return (
                    <button
                      key={skill.name}
                      type="button"
                      className={`skill-circle skill-${skill.color} skill-position-${
                        index + 1
                      } ${
                        skill.active
                          ? "skill-active"
                          : "skill-coming-soon"
                      }`}
                      onClick={() => {
                        if (
                          skill.active &&
                          skill.path
                        ) {
                          navigate(
                            skill.path
                          );
                        }
                      }}
                      disabled={
                        !skill.active
                      }
                    >
                      <Icon
                        className="skill-icon"
                        size={25}
                      />

                      {/* IMPORTANT:
                          CSS uses .skill-name,
                          not .skill-label.
                      */}

                      <span className="skill-name">
                        {skill.name}
                      </span>

                      {!skill.active && (
                        <span className="skill-coming-text">
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
            <div className="learning-step">
              <div className="learning-icon">
                <BookOpen size={21} />
              </div>

              <div className="learning-text">
                <span className="learning-number">
                  01
                </span>

                <h3>
                  Learn
                </h3>

                <p>
                  Follow structured
                  lessons designed for
                  your level.
                </p>
              </div>
            </div>

            <div className="learning-arrow">
              <ArrowRight size={22} />
            </div>

            <div className="learning-step">
              <div className="learning-icon">
                <Target size={21} />
              </div>

              <div className="learning-text">
                <span className="learning-number">
                  02
                </span>

                <h3>
                  Practice
                </h3>

                <p>
                  Apply what you learn
                  through real activities.
                </p>
              </div>
            </div>

            <div className="learning-arrow">
              <ArrowRight size={22} />
            </div>

            <div className="learning-step">
              <div className="learning-icon">
                <Trophy size={21} />
              </div>

              <div className="learning-text">
                <span className="learning-number">
                  03
                </span>

                <h3>
                  Improve
                </h3>

                <p>
                  Get intelligent
                  feedback and keep
                  progressing.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* =================================================
            LOGIN MODAL
        ================================================= */}

        {loginOpen && (
          <div
            className="login-overlay"
            onClick={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setLoginOpen(false);
              }
            }}
          >
            <div className="login-modal">
              <button
                type="button"
                className="login-close"
                onClick={() =>
                  setLoginOpen(false)
                }
              >
                <X size={20} />
              </button>

              <div className="login-modal-icon">
                <ShieldCheck size={28} />
              </div>

              <div className="login-modal-header">
                <h2>
                  Welcome to SkillSensAI
                </h2>

                <p>
                  Sign in to continue your
                  learning journey.
                </p>
              </div>

              {/* TABS */}

              <div className="login-tabs">
                <button
                  type="button"
                  className={
                    loginMethod ===
                    "google"
                      ? "login-tab-active"
                      : ""
                  }
                  onClick={() => {
                    setLoginMethod(
                      "google"
                    );
                    setLoginError("");
                  }}
                >
                  <Mail size={17} />
                  Google
                </button>

                <button
                  type="button"
                  className={
                    loginMethod ===
                    "phone"
                      ? "login-tab-active"
                      : ""
                  }
                  onClick={() => {
                    setLoginMethod(
                      "phone"
                    );
                    setLoginError("");
                  }}
                >
                  <Phone size={17} />
                  Phone
                </button>
              </div>

              {/* GOOGLE */}

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
                        size={19}
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

                  <div className="login-security-note">
                    <ShieldCheck size={15} />

                    <span>
                      Secure authentication
                      powered by Firebase.
                    </span>
                  </div>
                </div>
              )}

              {/* PHONE */}

              {loginMethod ===
                "phone" && (
                <div className="login-method-content">
                  {phoneStep ===
                  "phone" ? (
                    <>
                      <label className="login-input-label">
                        Phone Number
                      </label>

                      <div className="login-phone-input">
                        <Phone size={18} />

                        <input
                          type="tel"
                          placeholder="9876543210"
                          value={
                            phoneNumber
                          }
                          onChange={(event) =>
                            setPhoneNumber(
                              event.target.value
                            )
                          }
                          maxLength={15}
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
                          <Loader2
                            size={18}
                            className="login-spinner"
                          />
                        ) : (
                          <Phone size={18} />
                        )}

                        <span>
                          {loading
                            ? "Sending OTP..."
                            : "Send OTP"}
                        </span>
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
                          placeholder="6-digit OTP"
                          value={otp}
                          onChange={(event) =>
                            setOtp(
                              event.target.value.replace(
                                /\D/g,
                                ""
                              )
                            )
                          }
                          maxLength={6}
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
                          <Loader2
                            size={18}
                            className="login-spinner"
                          />
                        ) : (
                          <ShieldCheck size={18} />
                        )}

                        <span>
                          {loading
                            ? "Verifying..."
                            : "Verify OTP"}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="change-number-button"
                        onClick={
                          handleChangeNumber
                        }
                      >
                        Change phone number
                      </button>
                    </>
                  )}

                  <div className="login-security-note">
                    <ShieldCheck size={15} />

                    <span>
                      Your login is secured
                      by Firebase
                      Authentication.
                    </span>
                  </div>
                </div>
              )}

              {loginError && (
                <div className="login-error">
                  {loginError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RECAPTCHA */}

        <div id="recaptcha-container" />
      </main>
    </div>
  );
}
