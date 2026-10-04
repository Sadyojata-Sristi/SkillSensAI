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
  Phone,
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
   COMPONENT
   ========================================================= */

export default function Home() {
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
     THEME EFFECT
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
      setLessonsLearned(count || 0);
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
     OPEN LOGIN
     ======================================================= */

  const openLogin = () => {
    setShowProfile(false);
    setShowLogin(true);

    setLoginMethod("google");
    setLoginError("");
    setOtp("");
    setConfirmationResult(null);
  };


  /* =======================================================
     CLOSE LOGIN
     ======================================================= */

  const closeLogin = () => {
    setShowLogin(false);

    setLoginError("");
    setOtp("");
    setConfirmationResult(null);

    setLoginLoading(false);

    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (error) {
        console.log(error);
      }

      recaptchaVerifierRef.current = null;
    }
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

      closeLogin();
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
          "Google login was cancelled."
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
            "Unable to sign in with Google."
        );
      }
    } finally {
      setLoginLoading(false);
    }
  };


  /* =======================================================
     PHONE FORMAT
     ======================================================= */

  const formatPhoneNumber = (value) => {
    let cleaned = value.replace(
      /[^\d+]/g,
      ""
    );

    if (!cleaned.startsWith("+91")) {
      const digits = cleaned.replace(
        /\D/g,
        ""
      );

      cleaned = "+91" + digits;
    }

    const numberOnly =
      cleaned
        .replace("+91", "")
        .replace(/\D/g, "")
        .slice(0, 10);

    return "+91 " + numberOnly;
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
    setLoginError("");

    const digits =
      phoneNumber
        .replace("+91", "")
        .replace(/\D/g, "");

    if (digits.length !== 10) {
      setLoginError(
        "Please enter a valid 10-digit Indian mobile number."
      );

      return;
    }

    setLoginLoading(true);

    try {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (error) {
          console.log(error);
        }

        recaptchaVerifierRef.current = null;
      }

      const verifier =
        new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "normal",
          }
        );

      recaptchaVerifierRef.current =
        verifier;

      const fullPhoneNumber =
        "+91" + digits;

      const confirmation =
        await signInWithPhoneNumber(
          auth,
          fullPhoneNumber,
          verifier
        );

      setConfirmationResult(
        confirmation
      );

      setOtp("");

      setLoginError("");
    } catch (error) {
      console.error(
        "OTP error:",
        error
      );

      if (
        recaptchaVerifierRef.current
      ) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (clearError) {
          console.log(clearError);
        }

        recaptchaVerifierRef.current =
          null;
      }

      setLoginError(
        error?.message ||
          "Unable to send OTP. Please try again."
      );
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

    if (otp.trim().length < 6) {
      setLoginError(
        "Please enter the 6-digit OTP."
      );

      return;
    }

    setLoginLoading(true);
    setLoginError("");

    try {
      await confirmationResult.confirm(
        otp.trim()
      );

      closeLogin();
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

      setUser(null);
      setShowProfile(false);
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
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
     USER DISPLAY
     ======================================================= */

  const getUserName = () => {
    if (!user) {
      return "";
    }

    if (user.displayName) {
      return user.displayName;
    }

    if (user.phoneNumber) {
      return user.phoneNumber;
    }

    return "Learner";
  };


  const getUserInitial = () => {
    const name = getUserName();

    return (
      name
        ?.charAt(0)
        ?.toUpperCase() || "U"
    );
  };


  /* =======================================================
     JSX
     ======================================================= */

  return (
    <div className="home-page">

      {/* =================================================
          ROOM BACKGROUND
          ================================================= */}

      <div className="room-background">

        <div className="room-wall" />

        <div className="room-floor" />

        <div className="room-corner-glow" />

        {/* Ceiling */}
        <div className="ceiling">

          <div className="ceiling-line" />

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

            <span>
              Login
            </span>

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
                    alt="Profile"
                  />

                ) : (

                  getUserInitial()

                )}

              </span>

              <span className="profile-name">
                {getUserName()}
              </span>

              <ChevronDown size={15} />

            </button>


            {showProfile && (

              <div className="profile-dropdown">

                <div className="profile-dropdown-header">

                  <div className="profile-dropdown-avatar">

                    {user.photoURL ? (

                      <img
                        src={user.photoURL}
                        alt="Profile"
                      />

                    ) : (

                      getUserInitial()

                    )}

                  </div>

                  <div className="profile-dropdown-user">

                    <strong>
                      {getUserName()}
                    </strong>

                    <span>
                      {user.email ||
                        user.phoneNumber ||
                        "SkillSensAI Learner"}
                    </span>

                  </div>

                </div>


                <div className="profile-stat">

                  <span>
                    Lessons learned
                  </span>

                  <strong>
                    {lessonsLearned}
                  </strong>

                </div>


                <button
                  type="button"
                  className="logout-button"
                  onClick={handleLogout}
                >

                  <LogOut size={16} />

                  <span>
                    Sign Out
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
            <span>
              Master.
            </span>
          </h1>

          <p>
            Learn real-world skills with
            guided lessons, practical
            training and intelligent
            feedback.
          </p>

        </section>


        {/* =================================================
            SKILLS ROOM
            ================================================= */}

        <section className="skills-room">


          {/* =================================================
              SOFA
              ================================================= */}

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
              CHARACTER
              ================================================= */}

          <div className="character-shadow" />

          <div className="samurai-container">

            <div className="samurai-aura" />

            <img
              src="/samurai.png"
              alt="SkillSensAI learner"
              className="samurai-image"
            />

          </div>


          {/* =================================================
              SKILLS ORBIT
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
            LEARNING JOURNEY
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

                <span>
                  01
                </span>

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

                <span>
                  02
                </span>

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

                <span>
                  03
                </span>

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


          <div className="home-bottom-note">

            <Sparkles size={16} />

            <span>
              Your progress grows with
              every practice.
            </span>

          </div>

        </section>

      </main>


      {/* =================================================
          LOGIN MODAL
          ================================================= */}

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

                <ShieldCheck size={29} />

              </div>

              <h2>
                Welcome to SkillSensAI
              </h2>

              <p>
                Sign in to save your
                learning progress.
              </p>

            </div>


            {/* =================================================
                TABS
                ================================================= */}

            <div className="login-tabs">

              <button
                type="button"
                className={`login-tab ${
                  loginMethod === "google"
                    ? "active"
                    : ""
                }`}
                onClick={() => {

                  setLoginMethod(
                    "google"
                  );

                  setLoginError("");

                }}
              >

                <span
                  style={{
                    fontWeight: 900,
                    color: "#4285F4",
                  }}
                >
                  G
                </span>

                Google

              </button>


              <button
                type="button"
                className={`login-tab ${
                  loginMethod === "phone"
                    ? "active"
                    : ""
                }`}
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
                GOOGLE LOGIN
                ================================================= */}

            {loginMethod === "google" && (

              <div>

                <button
                  type="button"
                  className="google-login-button"
                  onClick={
                    handleGoogleLogin
                  }
                  disabled={
                    loginLoading
                  }
                >

                  {loginLoading ? (

                    <Loader2
                      size={19}
                      className="login-spinner"
                    />

                  ) : (

                    <span className="google-letter">
                      G
                    </span>

                  )}

                  <span>
                    {loginLoading
                      ? "Signing in..."
                      : "Continue with Google"}
                  </span>

                </button>

              </div>

            )}


            {/* =================================================
                PHONE LOGIN
                ================================================= */}

            {loginMethod === "phone" && (

              <div className="phone-login-container">


                {!confirmationResult ? (

                  <>

                    <input
                      type="tel"
                      className="phone-login-input"
                      value={phoneNumber}
                      onChange={
                        handlePhoneChange
                      }
                      placeholder="+91 9876543210"
                      maxLength={14}
                      autoComplete="tel"
                    />


                    <div
                      id="recaptcha-container"
                      className="phone-recaptcha"
                    />


                    <button
                      type="button"
                      className="send-otp-button"
                      onClick={sendOtp}
                      disabled={
                        loginLoading
                      }
                    >

                      {loginLoading ? (

                        <Loader2
                          size={18}
                          className="login-spinner"
                        />

                      ) : (

                        <Phone size={18} />

                      )}

                      <span>
                        {loginLoading
                          ? "Sending OTP..."
                          : "Send OTP"}
                      </span>

                    </button>

                  </>

                ) : (

                  <>

                    <input
                      type="text"
                      inputMode="numeric"
                      className="otp-input"
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
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      autoComplete="one-time-code"
                    />


                    <button
                      type="button"
                      className="verify-otp-button"
                      onClick={verifyOtp}
                      disabled={
                        loginLoading
                      }
                    >

                      {loginLoading ? (

                        <Loader2
                          size={18}
                          className="login-spinner"
                        />

                      ) : (

                        <ShieldCheck size={18} />

                      )}

                      <span>
                        {loginLoading
                          ? "Verifying..."
                          : "Verify OTP"}
                      </span>

                    </button>


                    <button
                      type="button"
                      className="change-phone-button"
                      onClick={() => {

                        setConfirmationResult(
                          null
                        );

                        setOtp("");

                        setLoginError("");

                        if (
                          recaptchaVerifierRef.current
                        ) {
                          try {
                            recaptchaVerifierRef.current.clear();
                          } catch (error) {
                            console.log(
                              error
                            );
                          }

                          recaptchaVerifierRef.current =
                            null;
                        }

                      }}
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

              <div className="login-message">
                {loginError}
              </div>

            )}


            {/* =================================================
                SECURITY NOTE
                ================================================= */}

            <div className="login-security-note">

              <ShieldCheck size={16} />

              <span>
                Your account is securely
                authenticated using Firebase.
                Your learning progress stays
                connected to your account.
              </span>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
