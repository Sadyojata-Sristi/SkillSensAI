/* =========================================================
   SKILLSENSAI — HOME PAGE
   Global Theme + Firebase Authentication + Skill Navigation
   ========================================================= */

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
import "./LoginModal.css";


/* =========================================================
   SKILLS
   ========================================================= */

const skills = [
  {
    id: "music",
    name: "Music",
    icon: Music,
    active: true,
    route: "/music",
  },
  {
    id: "martial-arts",
    name: "Martial Arts",
    icon: Swords,
    active: true,
    route: "/martial-arts",
  },
  {
    id: "dance",
    name: "Dance",
    icon: Dumbbell,
    active: false,
  },
  {
    id: "coding",
    name: "Coding",
    icon: Code2,
    active: false,
  },
  {
    id: "art",
    name: "Art & Creativity",
    icon: Palette,
    active: false,
  },
  {
    id: "more",
    name: "More Skills",
    icon: Sparkles,
    active: false,
  },
];


/* =========================================================
   THEME HELPERS
   ========================================================= */

const THEME_KEY = "skillsensai_theme";

const getSavedTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);

    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch (error) {
    console.error("Unable to read SkillSensAI theme:", error);
  }

  return "dark";
};

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
    console.error("Unable to save SkillSensAI theme:", error);
  }

  window.dispatchEvent(
    new CustomEvent("skillsensai-theme-changed", {
      detail: { theme },
    })
  );
};


/* =========================================================
   LOGIN MODAL
   ========================================================= */

function LoginModal({ onClose }) {
  const [activeTab, setActiveTab] = useState("google");

  const [phone, setPhone] = useState("+91 ");
  const [otp, setOtp] = useState("");

  const [confirmationResult, setConfirmationResult] =
    useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const recaptchaVerifierRef = useRef(null);


  /* ---------------------------------------------------------
     CLEANUP RECAPTCHA
     --------------------------------------------------------- */

  const cleanupRecaptcha = () => {
    try {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } catch (error) {
      console.error("reCAPTCHA cleanup error:", error);
    }
  };


  useEffect(() => {
    return () => {
      cleanupRecaptcha();
    };
  }, []);


  /* ---------------------------------------------------------
     GOOGLE LOGIN
     --------------------------------------------------------- */

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(auth, provider);

      setSuccessMessage("Login successful!");

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("Google login error:", error);

      if (error?.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else if (error?.code === "auth/popup-blocked") {
        setError(
          "The browser blocked the login popup. Please allow popups for SkillSensAI."
        );
      } else {
        setError(
          error?.message ||
            "Unable to sign in with Google. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };


  /* ---------------------------------------------------------
     PHONE FORMAT
     --------------------------------------------------------- */

  const formatIndianPhone = (value) => {
    let cleaned = value.replace(/[^\d+]/g, "");

    if (!cleaned.startsWith("+91")) {
      const digits = cleaned.replace(/\D/g, "");

      if (digits.startsWith("91")) {
        cleaned = `+${digits}`;
      } else {
        cleaned = `+91${digits}`;
      }
    }

    const digitsAfterCode = cleaned
      .replace("+91", "")
      .replace(/\D/g, "")
      .slice(0, 10);

    if (digitsAfterCode.length === 0) {
      return "+91 ";
    }

    return `+91 ${digitsAfterCode}`;
  };


  const handlePhoneChange = (event) => {
    const formatted = formatIndianPhone(event.target.value);

    setPhone(formatted);
    setError("");
    setSuccessMessage("");
  };


  /* ---------------------------------------------------------
     SEND OTP
     --------------------------------------------------------- */

  const handleSendOtp = async () => {
    setError("");
    setSuccessMessage("");

    const phoneNumber = phone.replace(/\s/g, "");

    if (!/^\+91\d{10}$/.test(phoneNumber)) {
      setError(
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    setLoading(true);

    try {
      cleanupRecaptcha();

      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",

          callback: () => {
            console.log("reCAPTCHA verified.");
          },

          "expired-callback": () => {
            setError(
              "reCAPTCHA expired. Please try sending the OTP again."
            );
          },
        }
      );

      const appVerifier = recaptchaVerifierRef.current;

      const result = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );

      setConfirmationResult(result);

      setOtp("");

      setSuccessMessage(
        "OTP sent successfully to your mobile number."
      );
    } catch (error) {
      console.error("Phone login error:", error);

      cleanupRecaptcha();

      if (error?.code === "auth/invalid-phone-number") {
        setError("The phone number is invalid.");
      } else if (
        error?.code === "auth/too-many-requests"
      ) {
        setError(
          "Too many attempts. Please wait and try again."
        );
      } else if (
        error?.code === "auth/quota-exceeded"
      ) {
        setError(
          "SMS quota exceeded. Please try again later."
        );
      } else {
        setError(
          error?.message ||
            "Unable to send OTP. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };


  /* ---------------------------------------------------------
     VERIFY OTP
     --------------------------------------------------------- */

  const handleVerifyOtp = async () => {
    if (!confirmationResult) {
      setError("Please request an OTP first.");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await confirmationResult.confirm(otp.trim());

      setSuccessMessage("Phone verification successful!");

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("OTP verification error:", error);

      if (
        error?.code === "auth/invalid-verification-code"
      ) {
        setError("Incorrect OTP. Please check and try again.");
      } else if (
        error?.code === "auth/code-expired"
      ) {
        setError(
          "This OTP has expired. Please request a new one."
        );
      } else {
        setError(
          error?.message ||
            "Unable to verify OTP. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };


  /* ---------------------------------------------------------
     CHANGE PHONE NUMBER
     --------------------------------------------------------- */

  const handleChangeNumber = () => {
    setConfirmationResult(null);
    setOtp("");
    setError("");
    setSuccessMessage("");

    cleanupRecaptcha();
  };


  /* ---------------------------------------------------------
     TAB SWITCH
     --------------------------------------------------------- */

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    setError("");
    setSuccessMessage("");

    if (tab === "google") {
      setConfirmationResult(null);
      setOtp("");
      cleanupRecaptcha();
    }
  };


  /* ---------------------------------------------------------
     CLOSE ON ESCAPE
     --------------------------------------------------------- */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [loading, onClose]);


  return (
    <div
      className="login-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <div className="login-modal">

        {/* CLOSE */}
        <button
          className="login-close"
          onClick={onClose}
          disabled={loading}
          aria-label="Close login"
        >
          <X size={20} />
        </button>


        {/* HEADER */}
        <div className="login-header">

          <div className="login-logo">
            <Sparkles size={23} />
          </div>

          <h2>Welcome to SkillSensAI</h2>

          <p>
            Learn skills at your pace with AI-powered
            guidance.
          </p>

        </div>


        {/* TABS */}
        <div className="login-tabs">

          <button
            type="button"
            className={
              activeTab === "google"
                ? "login-tab active"
                : "login-tab"
            }
            onClick={() =>
              handleTabChange("google")
            }
            disabled={loading}
          >
            <Mail size={17} />
            Google
          </button>

          <button
            type="button"
            className={
              activeTab === "phone"
                ? "login-tab active"
                : "login-tab"
            }
            onClick={() =>
              handleTabChange("phone")
            }
            disabled={loading}
          >
            <Phone size={17} />
            Phone
          </button>

        </div>


        {/* ERROR */}
        {error && (
          <div className="login-message error">
            {error}
          </div>
        )}


        {/* SUCCESS */}
        {successMessage && (
          <div className="login-message success">
            <ShieldCheck size={17} />
            {successMessage}
          </div>
        )}


        {/* GOOGLE */}
        {activeTab === "google" && (
          <div className="login-content">

            <button
              className="google-login-button"
              onClick={handleGoogleLogin}
              disabled={loading}
            >

              {loading ? (
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
                {loading
                  ? "Signing in..."
                  : "Continue with Google"}
              </span>

            </button>


            <div className="login-divider">
              <span>Secure authentication</span>
            </div>


            <div className="login-security">
              <ShieldCheck size={18} />

              <span>
                Your account is securely handled by
                Firebase Authentication.
              </span>
            </div>

          </div>
        )}


        {/* PHONE */}
        {activeTab === "phone" && (
          <div className="login-content">

            {!confirmationResult ? (
              <>
                <label className="login-label">
                  Mobile Number
                </label>

                <div className="login-input-wrapper">

                  <Phone size={18} />

                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+91 9876543210"
                    maxLength={15}
                    disabled={loading}
                  />

                </div>


                <button
                  className="phone-login-button"
                  onClick={handleSendOtp}
                  disabled={loading}
                >

                  {loading ? (
                    <>
                      <Loader2
                        size={19}
                        className="spin"
                      />

                      Sending OTP...
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
                <label className="login-label">
                  Enter OTP
                </label>

                <p className="otp-description">
                  We sent a 6-digit verification code
                  to <strong>{phone}</strong>
                </p>


                <div className="login-input-wrapper otp-input">

                  <ShieldCheck size={18} />

                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(event) =>
                      setOtp(
                        event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6)
                      )
                    }
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    disabled={loading}
                  />

                </div>


                <button
                  className="phone-login-button"
                  onClick={handleVerifyOtp}
                  disabled={loading}
                >

                  {loading ? (
                    <>
                      <Loader2
                        size={19}
                        className="spin"
                      />

                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Continue
                      <ArrowRight size={18} />
                    </>
                  )}

                </button>


                <button
                  type="button"
                  className="change-number-button"
                  onClick={handleChangeNumber}
                  disabled={loading}
                >
                  Change phone number
                </button>

              </>
            )}


            {/* Firebase reCAPTCHA */}
            <div
              id="recaptcha-container"
              className="recaptcha-container"
            />

          </div>
        )}


        {/* FOOTER */}
        <div className="login-footer">

          <p>
            By continuing, you agree to use
            SkillSensAI responsibly.
          </p>

        </div>

      </div>
    </div>
  );
}


/* =========================================================
   HOME
   ========================================================= */

export default function Home() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [lessonsLearned, setLessonsLearned] =
    useState(() => {
      try {
        return getLessonsLearned().length;
      } catch {
        return 0;
      }
    });


  /* =======================================================
     THEME STATE
     ======================================================= */

  const [theme, setTheme] = useState(getSavedTheme);


  /* ---------------------------------------------------------
     INITIAL GLOBAL THEME
     --------------------------------------------------------- */

  useEffect(() => {
    applyGlobalTheme(theme);
  }, []);


  /* ---------------------------------------------------------
     THEME TOGGLE
     --------------------------------------------------------- */

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme =
        currentTheme === "dark"
          ? "light"
          : "dark";

      applyGlobalTheme(nextTheme);

      return nextTheme;
    });
  };


  /* ---------------------------------------------------------
     FIREBASE AUTH LISTENER
     --------------------------------------------------------- */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);

        if (!currentUser) {
          setShowProfile(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);


  /* ---------------------------------------------------------
     PROGRESS
     --------------------------------------------------------- */

  const updateLessonCount = () => {
    try {
      setLessonsLearned(
        getLessonsLearned().length
      );
    } catch (error) {
      console.error(
        "Unable to update lesson progress:",
        error
      );
    }
  };


  useEffect(() => {
    updateLessonCount();

    const handleProgressUpdate = () => {
      updateLessonCount();
    };

    window.addEventListener(
      "skillsensai-progress-updated",
      handleProgressUpdate
    );

    return () => {
      window.removeEventListener(
        "skillsensai-progress-updated",
        handleProgressUpdate
      );
    };
  }, []);


  /* ---------------------------------------------------------
     GLOBAL THEME SYNC
     --------------------------------------------------------- */

  useEffect(() => {
    const handleThemeChange = (event) => {
      const nextTheme = event?.detail?.theme;

      if (
        nextTheme === "light" ||
        nextTheme === "dark"
      ) {
        setTheme(nextTheme);
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
  }, []);


  /* ---------------------------------------------------------
     NAVIGATION
     --------------------------------------------------------- */

  const handleSkillClick = (skill) => {
    if (!skill.active) {
      return;
    }

    navigate(skill.route);
  };


  /* ---------------------------------------------------------
     LOGOUT
     --------------------------------------------------------- */

  const handleLogout = async () => {
    try {
      await signOut(auth);

      setShowProfile(false);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };


  /* ---------------------------------------------------------
     PROFILE NAME
     --------------------------------------------------------- */

  const getDisplayName = () => {
    if (!user) return "";

    if (user.displayName) {
      return user.displayName;
    }

    if (user.phoneNumber) {
      return user.phoneNumber;
    }

    if (user.email) {
      return user.email.split("@")[0];
    }

    return "Learner";
  };


  /* ---------------------------------------------------------
     USER INITIAL
     --------------------------------------------------------- */

  const getUserInitial = () => {
    const name = getDisplayName();

    if (!name) return "U";

    return name.charAt(0).toUpperCase();
  };


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div
      className={`home-page ${
        theme === "light"
          ? "light-theme"
          : "dark-theme"
      }`}
    >

      {/* ===================================================
          NAVBAR
          =================================================== */}

      <header className="home-navbar">

        {/* BRAND */}
        <button
          className="home-brand"
          onClick={() => navigate("/")}
          type="button"
        >
          <span className="brand-skill">
            Skill
          </span>

          <span className="brand-sensai">
            SensAI
          </span>
        </button>


        {/* NAVBAR RIGHT */}
        <div className="navbar-actions">

          {/* LESSON PROGRESS */}
          {user && (
            <div className="navbar-progress">
              <Sparkles size={16} />

              <span>
                {lessonsLearned}{" "}
                {lessonsLearned === 1
                  ? "Lesson"
                  : "Lessons"}
              </span>
            </div>
          )}


          {/* LIGHT BULB THEME BUTTON */}
          <button
            type="button"
            className={`theme-toggle ${
              theme === "light"
                ? "theme-toggle-on"
                : ""
            }`}
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "Turn light mode on"
                : "Turn dark mode on"
            }
            title={
              theme === "dark"
                ? "Turn on light mode"
                : "Turn on dark mode"
            }
          >

            {theme === "light" ? (
              <Lightbulb
                size={21}
                strokeWidth={2.2}
              />
            ) : (
              <LightbulbOff
                size={21}
                strokeWidth={2.2}
              />
            )}

          </button>


          {/* LOGIN */}
          {!user && (
            <button
              type="button"
              className="login-button"
              onClick={() => {
                setShowLogin(true);
                setShowProfile(false);
              }}
            >
              <LogIn size={17} />
              <span>Login</span>
            </button>
          )}


          {/* PROFILE */}
          {user && (
            <div className="profile-container">

              <button
                type="button"
                className="profile-button"
                onClick={() =>
                  setShowProfile(
                    (current) => !current
                  )
                }
              >

                <div className="profile-avatar">

                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={getDisplayName()}
                    />
                  ) : (
                    <span>
                      {getUserInitial()}
                    </span>
                  )}

                </div>

                <span className="profile-name">
                  {getDisplayName()}
                </span>

                <ChevronDown
                  size={16}
                  className={
                    showProfile
                      ? "profile-chevron open"
                      : "profile-chevron"
                  }
                />

              </button>


              {/* PROFILE DROPDOWN */}
              {showProfile && (
                <div className="profile-dropdown">

                  <div className="profile-dropdown-header">

                    <div className="profile-dropdown-avatar">

                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={getDisplayName()}
                        />
                      ) : (
                        <User size={21} />
                      )}

                    </div>

                    <div className="profile-details">

                      <strong>
                        {getDisplayName()}
                      </strong>

                      {user.email && (
                        <span>
                          {user.email}
                        </span>
                      )}

                      {user.phoneNumber && (
                        <span>
                          {user.phoneNumber}
                        </span>
                      )}

                    </div>

                  </div>


                  <div className="profile-dropdown-divider" />


                  <button
                    type="button"
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

      </header>


      {/* ===================================================
          MAIN HERO
          =================================================== */}

      <main className="home-main">

        <div className="hero-content">

          <div className="hero-heading">

            <span className="hero-small-text">
              LEARN • PRACTICE • MASTER
            </span>

            <h1>
              Your skills.
              <br />
              <span>Reimagined.</span>
            </h1>

            <p>
              AI-powered learning that helps you
              build real skills through practice,
              feedback and experience.
            </p>

          </div>


          {/* =================================================
              SAMURAI + SKILL ORBIT
              ================================================= */}

          <div className="skills-stage">

            {/* ORBIT RINGS */}
            <div className="orbit-ring orbit-ring-one" />
            <div className="orbit-ring orbit-ring-two" />
            <div className="orbit-ring orbit-ring-three" />


            {/* CENTER GLOW */}
            <div className="center-glow" />


            {/* CENTER SAMURAI */}
            <div className="samurai-container">

              <div className="samurai-glow" />

              <img
                src="/samurai.png"
                alt="SkillSensAI learning guide"
                className="samurai-image"
              />

            </div>


            {/* SKILLS */}
            <div className="skills-grid">

              {skills.map((skill) => {
                const Icon = skill.icon;

                return (
                  <button
                    key={skill.id}
                    type="button"
                    className={`skill-card ${
                      skill.active
                        ? "active"
                        : "coming-soon"
                    }`}
                    onClick={() =>
                      handleSkillClick(skill)
                    }
                    disabled={!skill.active}
                  >

                    <span className="skill-icon">

                      <Icon
                        size={28}
                        strokeWidth={1.8}
                      />

                    </span>


                    <span className="skill-name">
                      {skill.name}
                    </span>


                    {!skill.active && (
                      <span className="coming-soon-label">
                        Coming Soon
                      </span>
                    )}

                  </button>
                );
              })}

            </div>

          </div>


          {/* =================================================
              BOTTOM VALUE SECTION
              ================================================= */}

          <section className="home-value-section">

            <div className="value-card">

              <div className="value-icon">
                <Sparkles size={23} />
              </div>

              <div>
                <h3>
                  Learn by doing
                </h3>

                <p>
                  Practice your skill, get AI
                  feedback and improve step by step.
                </p>
              </div>

            </div>


            <div className="value-card">

              <div className="value-icon">
                <ArrowRight size={23} />
              </div>

              <div>
                <h3>
                  Learn at your pace
                </h3>

                <p>
                  Build your skills through an
                  experience designed around you.
                </p>
              </div>

            </div>


            <div className="value-card">

              <div className="value-icon">
                <ShieldCheck size={23} />
              </div>

              <div>
                <h3>
                  Real progress
                </h3>

                <p>
                  Track your learning journey and
                  turn practice into mastery.
                </p>
              </div>

            </div>

          </section>

        </div>

      </main>


      {/* ===================================================
          LOGIN MODAL
          =================================================== */}

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
        />
      )}

    </div>
  );
}
