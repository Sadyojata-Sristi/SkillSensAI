import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Music2,
  Swords,
  Code2,
  Palette,
  Dumbbell,
  Sparkles,
  LogIn,
  User,
  LogOut,
  ChevronDown,
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

import {
  getLessonsLearned,
} from "../utils/progress";

import "./Home.css";
import "./LoginModal.css";


/* =========================================================
   SKILLSENSAI — HOME PAGE
   REAL FIREBASE AUTHENTICATION
   ========================================================= */

function Home() {

  const navigate = useNavigate();

  /* =========================================================
     AUTH
     ========================================================= */

  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );

    return () => unsubscribe();

  }, []);


  /* =========================================================
     LOGIN MODAL
     ========================================================= */

  const [showLogin, setShowLogin] = useState(false);


  /* =========================================================
     PROGRESS
     ========================================================= */

  const [lessonsLearned, setLessonsLearned] =
    useState(() => getLessonsLearned());


  useEffect(() => {

    const updateProgress = () => {
      setLessonsLearned(getLessonsLearned());
    };

    updateProgress();

    window.addEventListener(
      "skillsensai-progress-updated",
      updateProgress
    );

    return () => {

      window.removeEventListener(
        "skillsensai-progress-updated",
        updateProgress
      );

    };

  }, []);


  /* =========================================================
     CLOSE LOGIN WHEN AUTHENTICATED
     ========================================================= */

  useEffect(() => {

    if (user) {
      setShowLogin(false);
    }

  }, [user]);


  /* =========================================================
     LOGOUT
     ========================================================= */

  const handleLogout = async () => {

    try {

      await signOut(auth);

      setShowProfile(false);

    } catch (error) {

      console.error(
        "Logout failed:",
        error
      );

      alert(
        "Unable to sign out. Please try again."
      );

    }

  };


  /* =========================================================
     SKILLS
     ========================================================= */

  const skills = [

    {
      id: "music",
      title: "Music",
      description:
        "Learn singing, pitch, rhythm and improve through AI feedback.",
      icon: <Music2 size={30} />,
      className: "skill-music",
      active: true,
      route: "/music",
    },

    {
      id: "martial-arts",
      title: "Martial Arts",
      description:
        "Learn practical martial arts techniques step by step.",
      icon: <Swords size={30} />,
      className: "skill-martial",
      active: true,
      route: "/martial-arts",
    },

    {
      id: "dance",
      title: "Dance",
      description:
        "AI-assisted movement learning and practice.",
      icon: <Dumbbell size={30} />,
      className: "skill-coming",
      active: false,
    },

    {
      id: "coding",
      title: "Coding",
      description:
        "Build practical coding skills with guided learning.",
      icon: <Code2 size={30} />,
      className: "skill-coming",
      active: false,
    },

    {
      id: "art",
      title: "Art & Creativity",
      description:
        "Develop creative skills through practical learning.",
      icon: <Palette size={30} />,
      className: "skill-coming",
      active: false,
    },

    {
      id: "more",
      title: "More Skills",
      description:
        "More skill categories are coming soon.",
      icon: <Sparkles size={30} />,
      className: "skill-coming",
      active: false,
    },

  ];


  /* =========================================================
     SKILL CLICK
     ========================================================= */

  const handleSkillClick = (skill) => {

    if (!skill.active) {
      return;
    }

    navigate(skill.route);

  };


  /* =========================================================
     RENDER
     ========================================================= */

  return (

    <div className="home-page">

      {/* =====================================================
          NAVBAR
          ===================================================== */}

      <header className="home-navbar">

        <div
          className="home-logo"
          onClick={() => navigate("/")}
        >

          <span className="logo-skill">
            Skill
          </span>

          <span className="logo-sensai">
            SensAI
          </span>

        </div>


        <div className="home-nav-right">

          {/* PROGRESS */}

          <div className="home-progress-mini">

            <Sparkles size={15} />

            <span>
              {lessonsLearned.length} learned
            </span>

          </div>


          {/* USER */}

          {user ? (

            <div className="profile-wrapper">

              <button
                className="profile-button"
                onClick={() =>
                  setShowProfile(
                    (previous) => !previous
                  )
                }
              >

                {user.photoURL ? (

                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="profile-avatar"
                  />

                ) : (

                  <div className="profile-avatar-placeholder">
                    <User size={18} />
                  </div>

                )}

                <span className="profile-name">

                  {user.displayName ||
                    user.phoneNumber ||
                    "User"}

                </span>

                <ChevronDown
                  size={16}
                />

              </button>


              {showProfile && (

                <div className="profile-dropdown">

                  <div className="profile-dropdown-header">

                    <strong>
                      {user.displayName ||
                        "SkillSensAI User"}
                    </strong>

                    <span>
                      {user.email ||
                        user.phoneNumber ||
                        ""}
                    </span>

                  </div>


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

          ) : (

            <button
              className="home-login-button"
              onClick={() =>
                setShowLogin(true)
              }
            >

              <LogIn size={18} />

              Login

            </button>

          )}

        </div>

      </header>


      {/* =====================================================
          HERO
          ===================================================== */}

      <main className="home-main">

        <section className="home-hero">

          <div className="home-hero-content">

            <p className="home-eyebrow">
              AI-POWERED SKILL LEARNING
            </p>


            <h1>

              Learn.

              <span>
                Practice.
              </span>

              Improve.

            </h1>


            <p className="home-description">

              SkillSensAI helps you learn real-world
              skills through guided lessons, practical
              training and intelligent feedback.

            </p>


            <div className="home-hero-actions">

              {!user && (

                <button
                  className="hero-primary-button"
                  onClick={() =>
                    setShowLogin(true)
                  }
                >

                  <LogIn size={18} />

                  Start Learning

                </button>

              )}

              {user && (

                <button
                  className="hero-primary-button"
                  onClick={() =>
                    navigate("/music")
                  }
                >

                  <Music2 size={18} />

                  Continue Learning

                </button>

              )}

            </div>

          </div>


          {/* =================================================
              CHARACTER
              ================================================= */}

          <div className="home-character">

            <div className="character-glow" />

            <img
              src="/samurai.png"
              alt="SkillSensAI character"
              className="samurai-image"
            />

          </div>

        </section>


        {/* =====================================================
            SKILLS
            ===================================================== */}

        <section className="skills-section">

          <div className="skills-heading">

            <p>
              EXPLORE SKILLS
            </p>

            <h2>
              Choose Your Skill
            </h2>

            <span>
              Learn at your own pace with
              SkillSensAI.
            </span>

          </div>


          <div className="skills-grid">

            {skills.map((skill) => (

              <button
                key={skill.id}
                className={`skill-card ${skill.className}`}
                onClick={() =>
                  handleSkillClick(skill)
                }
                disabled={!skill.active}
              >

                <div className="skill-card-icon">

                  {skill.icon}

                </div>


                <div className="skill-card-content">

                  <h3>
                    {skill.title}
                  </h3>

                  <p>
                    {skill.description}
                  </p>

                </div>


                {!skill.active && (

                  <span className="coming-soon-badge">
                    Coming Soon
                  </span>

                )}

              </button>

            ))}

          </div>

        </section>


        {/* =====================================================
            VALUE PROPOSITION
            ===================================================== */}

        <section className="home-value-section">

          <div>

            <span>
              WHY SKILLSENSAI?
            </span>

            <h2>
              More than watching.
              <br />
              Start actually learning.
            </h2>

          </div>


          <div className="home-value-grid">

            <div className="home-value-card">

              <strong>
                Learn
              </strong>

              <p>
                Structured lessons designed
                for beginners.
              </p>

            </div>


            <div className="home-value-card">

              <strong>
                Practice
              </strong>

              <p>
                Record yourself or upload
                your practice.
              </p>

            </div>


            <div className="home-value-card">

              <strong>
                Analyze
              </strong>

              <p>
                AI analyzes your performance
                and identifies areas to improve.
              </p>

            </div>


            <div className="home-value-card">

              <strong>
                Improve
              </strong>

              <p>
                Track your progress and
                keep building your skill.
              </p>

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          LOGIN MODAL
          ===================================================== */}

      {showLogin && (

        <LoginModal
          onClose={() =>
            setShowLogin(false)
          }
        />

      )}

    </div>

  );

}


/* ============================================================
   LOGIN MODAL
   REAL GOOGLE + PHONE OTP FIREBASE AUTH
   ============================================================ */

function LoginModal({ onClose }) {

  const [activeTab, setActiveTab] =
    useState("google");

  const [phoneNumber, setPhoneNumber] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [confirmationResult, setConfirmationResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const recaptchaVerifierRef =
    useRef(null);


  /* =========================================================
     CLEANUP RECAPTCHA
     ========================================================= */

  useEffect(() => {

    return () => {

      try {

        if (recaptchaVerifierRef.current) {

          recaptchaVerifierRef.current.clear();

          recaptchaVerifierRef.current = null;

        }

      } catch (error) {

        console.error(
          "reCAPTCHA cleanup failed:",
          error
        );

      }

    };

  }, []);


  /* =========================================================
     RESET TAB STATE
     ========================================================= */

  const handleTabChange = (tab) => {

    setActiveTab(tab);

    setErrorMessage("");

    setOtp("");

    setConfirmationResult(null);

  };


  /* =========================================================
     GOOGLE LOGIN
     ========================================================= */

  const handleGoogleLogin = async () => {

    setLoading(true);
    setErrorMessage("");

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

      onClose();

    } catch (error) {

      console.error(
        "Google login failed:",
        error
      );

      if (
        error.code ===
        "auth/popup-closed-by-user"
      ) {

        setErrorMessage(
          "Google sign-in was cancelled."
        );

      } else if (
        error.code ===
        "auth/popup-blocked"
      ) {

        setErrorMessage(
          "Your browser blocked the Google sign-in popup. Please allow popups for SkillSensAI."
        );

      } else {

        setErrorMessage(
          error.message ||
          "Google sign-in failed. Please try again."
        );

      }

    } finally {

      setLoading(false);

    }

  };


  /* =========================================================
     PHONE NUMBER FORMAT
     ========================================================= */

  const formatPhoneNumber = (value) => {

    let cleaned =
      value.replace(/\D/g, "");

    /*
      Automatically handle:

      9876543210
      919876543210
      +919876543210
    */

    if (cleaned.startsWith("91")) {

      cleaned =
        cleaned.substring(2);

    }

    cleaned =
      cleaned.substring(0, 10);

    if (!cleaned) {
      return "";
    }

    return `+91${cleaned}`;

  };


  /* =========================================================
     PHONE INPUT
     ========================================================= */

  const handlePhoneChange = (event) => {

    const formatted =
      formatPhoneNumber(
        event.target.value
      );

    setPhoneNumber(formatted);

    setErrorMessage("");

  };


  /* =========================================================
     CREATE RECAPTCHA
     ========================================================= */

  const createRecaptcha = () => {

    if (
      recaptchaVerifierRef.current
    ) {

      return recaptchaVerifierRef.current;

    }

    recaptchaVerifierRef.current =
      new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",

          callback: () => {
            console.log(
              "reCAPTCHA verified."
            );
          },

          "expired-callback": () => {

            console.log(
              "reCAPTCHA expired."
            );

          },

        }
      );

    return recaptchaVerifierRef.current;

  };


  /* =========================================================
     SEND OTP
     ========================================================= */

  const handleSendOTP = async () => {

    setErrorMessage("");

    const digits =
      phoneNumber.replace(/\D/g, "");

    if (digits.length !== 12) {

      setErrorMessage(
        "Please enter a valid 10-digit Indian mobile number."
      );

      return;

    }

    setLoading(true);

    try {

      const appVerifier =
        createRecaptcha();

      const result =
        await signInWithPhoneNumber(
          auth,
          phoneNumber,
          appVerifier
        );

      setConfirmationResult(result);

      setOtp("");

    } catch (error) {

      console.error(
        "Phone OTP failed:",
        error
      );

      /*
        Reset reCAPTCHA if Firebase
        reports a reCAPTCHA problem.
      */

      try {

        if (recaptchaVerifierRef.current) {

          recaptchaVerifierRef.current.clear();

          recaptchaVerifierRef.current =
            null;

        }

      } catch (cleanupError) {

        console.error(
          "reCAPTCHA reset failed:",
          cleanupError
        );

      }


      if (
        error.code ===
        "auth/invalid-phone-number"
      ) {

        setErrorMessage(
          "The phone number is invalid."
        );

      } else if (
        error.code ===
        "auth/too-many-requests"
      ) {

        setErrorMessage(
          "Too many attempts. Please wait and try again."
        );

      } else if (
        error.code ===
        "auth/quota-exceeded"
      ) {

        setErrorMessage(
          "SMS quota exceeded for this Firebase project."
        );

      } else {

        setErrorMessage(
          error.message ||
          "Unable to send OTP. Please try again."
        );

      }

    } finally {

      setLoading(false);

    }

  };


  /* =========================================================
     VERIFY OTP
     ========================================================= */

  const handleVerifyOTP = async () => {

    if (!confirmationResult) {

      setErrorMessage(
        "Please request an OTP first."
      );

      return;

    }

    if (
      otp.trim().length !== 6
    ) {

      setErrorMessage(
        "Please enter the 6-digit OTP."
      );

      return;

    }

    setLoading(true);
    setErrorMessage("");

    try {

      await confirmationResult.confirm(
        otp.trim()
      );

      onClose();

    } catch (error) {

      console.error(
        "OTP verification failed:",
        error
      );

      if (
        error.code ===
        "auth/invalid-verification-code"
      ) {

        setErrorMessage(
          "Incorrect OTP. Please check the code and try again."
        );

      } else if (
        error.code ===
        "auth/code-expired"
      ) {

        setErrorMessage(
          "This OTP has expired. Please request a new one."
        );

        setConfirmationResult(null);

      } else {

        setErrorMessage(
          error.message ||
          "OTP verification failed."
        );

      }

    } finally {

      setLoading(false);

    }

  };


  /* =========================================================
     RENDER
     ========================================================= */

  return (

    <div
      className="login-overlay"
      onMouseDown={(event) => {

        if (
          event.target ===
          event.currentTarget
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
        >
          ×
        </button>


        {/* HEADER */}

        <div className="login-header">

          <div className="login-icon">
            <Sparkles size={26} />
          </div>

          <h2>
            Welcome to SkillSensAI
          </h2>

          <p>
            Sign in to save your learning
            progress and continue your journey.
          </p>

        </div>


        {/* TABS */}

        <div className="login-tabs">

          <button
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
            Google
          </button>

          <button
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
            Phone
          </button>

        </div>


        {/* ERROR */}

        {errorMessage && (

          <div className="login-error">

            {errorMessage}

          </div>

        )}


        {/* ===================================================
            GOOGLE
            =================================================== */}

        {activeTab === "google" ? (

          <button
            className="google-login-button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >

            {loading ? (

              <>
                <Loader2
                  size={19}
                  className="login-spinner"
                />

                Signing in...

              </>

            ) : (

              <>
                <span className="google-g-icon">
                  G
                </span>

                Continue with Google

              </>

            )}

          </button>

        ) : (

          /* =================================================
             PHONE
             ================================================= */

          <div className="phone-login-container">

            {!confirmationResult ? (

              <>

                <p className="phone-login-description">

                  Enter your mobile number.
                  We'll send you a verification
                  code.

                </p>


                <input
                  type="tel"
                  value={
                    phoneNumber
                      ? phoneNumber
                          .replace(
                            "+91",
                            "+91 "
                          )
                      : ""
                  }
                  onChange={
                    handlePhoneChange
                  }
                  placeholder="+91 XXXXX XXXXX"
                  className="phone-login-input"
                  disabled={loading}
                  maxLength={14}
                />


                <button
                  className="phone-login-button"
                  onClick={
                    handleSendOTP
                  }
                  disabled={loading}
                >

                  {loading ? (

                    <>
                      <Loader2
                        size={18}
                        className="login-spinner"
                      />

                      Sending OTP...

                    </>

                  ) : (

                    "Send OTP"

                  )}

                </button>

              </>

            ) : (

              <>

                <p className="phone-login-description">

                  Enter the 6-digit OTP sent
                  to{" "}

                  <strong>
                    {phoneNumber}
                  </strong>

                </p>


                <input
                  type="text"
                  value={otp}
                  onChange={(event) => {

                    const value =
                      event.target.value
                        .replace(/\D/g, "")
                        .substring(0, 6);

                    setOtp(value);

                    setErrorMessage("");

                  }}
                  placeholder="Enter OTP"
                  className="phone-login-input otp-input"
                  inputMode="numeric"
                  maxLength={6}
                  disabled={loading}
                  autoFocus
                />


                <button
                  className="phone-login-button"
                  onClick={
                    handleVerifyOTP
                  }
                  disabled={loading}
                >

                  {loading ? (

                    <>
                      <Loader2
                        size={18}
                        className="login-spinner"
                      />

                      Verifying...

                    </>

                  ) : (

                    "Verify OTP"

                  )}

                </button>


                <button
                  className="change-number-button"
                  onClick={() => {

                    setConfirmationResult(
                      null
                    );

                    setOtp("");

                    setErrorMessage("");

                  }}
                  disabled={loading}
                >

                  Change phone number

                </button>

              </>

            )}


            {/* REQUIRED FOR FIREBASE PHONE AUTH */}

            <div
              id="recaptcha-container"
            />

          </div>

        )}


        {/* FOOTER */}

        <p className="login-footer">

          By continuing, you agree to use
          SkillSensAI responsibly.

        </p>

      </div>

    </div>

  );

}


export default Home;
