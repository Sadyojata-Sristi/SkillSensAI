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
   TOTAL LESSONS
   ========================================================= */

const TOTAL_LESSONS = 15;


/* =========================================================
   HOME
   ========================================================= */

export default function Home() {
  const navigate = useNavigate();

  /* -------------------------------------------------------
     THEME
  ------------------------------------------------------- */

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("skillsensai_theme") || "light";
    } catch {
      return "light";
    }
  });


  /* -------------------------------------------------------
     AUTH
  ------------------------------------------------------- */

  const [user, setUser] = useState(null);

  const [profileOpen, setProfileOpen] = useState(false);

  const [loginOpen, setLoginOpen] = useState(false);

  const [loginMethod, setLoginMethod] = useState("google");

  const [loading, setLoading] = useState(false);

  const [loginError, setLoginError] = useState("");


  /* -------------------------------------------------------
     PHONE LOGIN
  ------------------------------------------------------- */

  const [phoneNumber, setPhoneNumber] = useState("");

  const [otp, setOtp] = useState("");

  const [confirmationResult, setConfirmationResult] = useState(null);

  const [phoneStep, setPhoneStep] = useState("phone");

  const recaptchaRef = useRef(null);


  /* -------------------------------------------------------
     PROGRESS
  ------------------------------------------------------- */

  const [lessonsLearned, setLessonsLearned] = useState(0);


  /* -------------------------------------------------------
     BULB
  ------------------------------------------------------- */

  const [bulbOn, setBulbOn] = useState(true);


  /* =========================================================
     THEME
  ========================================================= */

  useEffect(() => {
    try {
      localStorage.setItem("skillsensai_theme", theme);
    } catch {
      // Ignore localStorage errors.
    }

    document.body.classList.remove(
      "skillsensai-light-theme",
      "skillsensai-dark-theme"
    );

    document.body.classList.add(
      theme === "dark"
        ? "skillsensai-dark-theme"
        : "skillsensai-light-theme"
    );
  }, [theme]);


  /* =========================================================
     FIREBASE AUTH STATE
     ========================================================= */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        console.log("SkillSensAI auth state:", currentUser);

        setUser(currentUser);

        if (!currentUser) {
          setProfileOpen(false);
        }
      },
      (error) => {
        console.error("Firebase auth state error:", error);
      }
    );

    return () => unsubscribe();
  }, []);


  /* =========================================================
     LOAD REAL PROGRESS
     ========================================================= */

  const loadProgress = () => {
    try {
      const completed = getLessonsLearned();

      const numericValue = Number(completed);

      if (Number.isFinite(numericValue)) {
        setLessonsLearned(Math.max(0, numericValue));
      } else {
        setLessonsLearned(0);
      }
    } catch (error) {
      console.error("Could not load lesson progress:", error);
      setLessonsLearned(0);
    }
  };


  useEffect(() => {
    loadProgress();

    const handleProgressUpdate = () => {
      loadProgress();
    };

    window.addEventListener(
      "skillsensai-progress-updated",
      handleProgressUpdate
    );

    window.addEventListener(
      "storage",
      handleProgressUpdate
    );

    return () => {
      window.removeEventListener(
        "skillsensai-progress-updated",
        handleProgressUpdate
      );

      window.removeEventListener(
        "storage",
        handleProgressUpdate
      );
    };
  }, []);


  /* =========================================================
     CLOSE PROFILE WHEN CLICKING OUTSIDE
     ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest(".profile-area")) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);


  /* =========================================================
     LOGIN MODAL
  ========================================================= */

  const openLogin = () => {
    setLoginError("");
    setLoginMethod("google");
    setPhoneStep("phone");
    setOtp("");
    setConfirmationResult(null);
    setLoginOpen(true);
    setProfileOpen(false);
  };


  const closeLogin = () => {
    if (loading) return;

    setLoginOpen(false);
    setLoginError("");
    setPhoneStep("phone");
    setOtp("");
    setConfirmationResult(null);
  };


  /* =========================================================
     GOOGLE LOGIN
  ========================================================= */

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLoginError("");

    try {
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(
        auth,
        provider
      );

      console.log(
        "Google login successful:",
        result.user
      );

      /*
       * Update immediately so the Home page changes
       * without waiting for another render cycle.
       */
      setUser(result.user);

      setLoginOpen(false);
      setProfileOpen(true);

      loadProgress();
    } catch (error) {
      console.error("Google login error:", error);

      if (error?.code === "auth/popup-closed-by-user") {
        setLoginError("Login window was closed.");
      } else if (
        error?.code === "auth/popup-blocked"
      ) {
        setLoginError(
          "Your browser blocked the login popup. Please allow popups for SkillSensAI."
        );
      } else if (
        error?.code === "auth/unauthorized-domain"
      ) {
        setLoginError(
          "This website is not authorized for Firebase login."
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


  /* =========================================================
     PHONE NUMBER FORMAT
  ========================================================= */

  const formatPhoneNumber = (value) => {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("91")) {
      digits = digits.substring(2);
    }

    digits = digits.substring(0, 10);

    if (!digits) {
      return "";
    }

    return `+91 ${digits}`;
  };


  const handlePhoneChange = (event) => {
    const formatted = formatPhoneNumber(
      event.target.value
    );

    setPhoneNumber(formatted);
  };


  /* =========================================================
     PHONE OTP
  ========================================================= */

  const handleSendOtp = async () => {
    setLoginError("");

    const digits = phoneNumber.replace(/\D/g, "");

    if (digits.length !== 10) {
      setLoginError(
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * Clear any previous verifier.
       */
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          // Ignore cleanup error.
        }

        recaptchaRef.current = null;
      }

      const verifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        }
      );

      recaptchaRef.current = verifier;

      const fullPhoneNumber = `+91${digits}`;

      const result =
        await signInWithPhoneNumber(
          auth,
          fullPhoneNumber,
          verifier
        );

      setConfirmationResult(result);
      setPhoneStep("otp");
      setOtp("");

    } catch (error) {
      console.error(
        "Phone OTP error:",
        error
      );

      if (
        error?.code ===
        "auth/billing-not-enabled"
      ) {
        setLoginError(
          "Phone authentication requires Firebase billing to be enabled."
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
            "Could not send OTP."
        );
      }

      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          // Ignore.
        }

        recaptchaRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };


  /* =========================================================
     VERIFY OTP
  ========================================================= */

  const handleVerifyOtp = async () => {
    if (!confirmationResult) {
      setLoginError(
        "Please request a new OTP."
      );
      return;
    }

    if (otp.length < 6) {
      setLoginError(
        "Please enter the 6-digit OTP."
      );
      return;
    }

    setLoading(true);
    setLoginError("");

    try {
      const result =
        await confirmationResult.confirm(
          otp
        );

      console.log(
        "Phone login successful:",
        result.user
      );

      setUser(result.user);

      setLoginOpen(false);
      setProfileOpen(true);

      setPhoneStep("phone");
      setOtp("");
      setConfirmationResult(null);

      loadProgress();

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


  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    try {
      await signOut(auth);

      setUser(null);
      setProfileOpen(false);
      setLoginOpen(false);

    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };


  /* =========================================================
     USER DISPLAY
  ========================================================= */

  const getUserName = () => {
    if (!user) {
      return "Learner";
    }

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


  const getUserContact = () => {
    if (!user) {
      return "";
    }

    if (user.email) {
      return user.email;
    }

    if (user.phoneNumber) {
      return user.phoneNumber;
    }

    return "";
  };


  const getInitial = () => {
    const name = getUserName();

    if (!name) {
      return "U";
    }

    return name
      .charAt(0)
      .toUpperCase();
  };


  /* =========================================================
     LESSON PERCENTAGE
  ========================================================= */

  const lessonPercentage =
    TOTAL_LESSONS > 0
      ? Math.min(
          100,
          Math.round(
            (lessonsLearned /
              TOTAL_LESSONS) *
              100
          )
        )
      : 0;


  /* =========================================================
     SKILL NAVIGATION
  ========================================================= */

  const handleSkillClick = (skill) => {
    if (!skill.active) {
      return;
    }

    navigate(skill.path);
  };


  /* =========================================================
     BULB
  ========================================================= */

  const handleBulbClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setBulbOn((current) => !current);
  };


  /* =========================================================
     THEME TOGGLE
  ========================================================= */

  const handleThemeToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setTheme((current) =>
      current === "light"
        ? "dark"
        : "light"
    );
  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className={`home-page ${
        theme === "dark"
          ? "skillsensai-dark-theme"
          : "skillsensai-light-theme"
      }`}
    >
      <div className="room-background">

        {/* =================================================
            TOP LOGIN / PROFILE
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
                  event.preventDefault();
                  event.stopPropagation();

                  setProfileOpen(
                    (current) => !current
                  );
                }}
              >

                <span className="profile-avatar">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={getUserName()}
                    />
                  ) : (
                    getInitial()
                  )}
                </span>

                <span className="profile-name">
                  {getUserName()}
                </span>

                <ChevronDown
                  size={16}
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

                    <div className="profile-dropdown-avatar">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={getUserName()}
                        />
                      ) : (
                        getInitial()
                      )}
                    </div>

                    <div className="profile-dropdown-info">

                      <strong>
                        {getUserName()}
                      </strong>

                      <span>
                        {getUserContact()}
                      </span>

                    </div>

                  </div>


                  <div className="profile-progress">

                    <div className="profile-progress-icon">
                      <BookOpen size={17} />
                    </div>

                    <div className="profile-progress-text">

                      <span>
                        Lessons Learned
                      </span>

                      <strong>
                        {lessonsLearned}
                      </strong>

                    </div>

                  </div>


                  <div className="profile-progress-bar">

                    <div
                      className="profile-progress-fill"
                      style={{
                        width: `${lessonPercentage}%`,
                      }}
                    />

                  </div>


                  <button
                    type="button"
                    className="logout-button"
                    onClick={handleLogout}
                  >
                    <LogOut size={17} />
                    <span>Logout</span>
                  </button>

                </div>
              )}

            </div>
          )}

        </div>


        {/* =================================================
            HANGING BULB
        ================================================= */}

        <div className="hanging-bulb">

          <div className="bulb-wire" />

          <button
            type="button"
            className={`bulb-button ${
              bulbOn
                ? "bulb-on"
                : "bulb-off"
            }`}
            onClick={handleBulbClick}
            onMouseDown={(event) =>
              event.stopPropagation()
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


        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <main className="home-content">


          {/* =================================================
              ROOM / SKILLS AREA
          ================================================= */}

          <section className="skills-room">


            {/* ---------------------------------------------
                SOFA
            --------------------------------------------- */}

            <div className="room-sofa">
              <div className="sofa-back" />
              <div className="sofa-seat" />
              <div className="sofa-arm sofa-arm-left" />
              <div className="sofa-arm sofa-arm-right" />
              <div className="sofa-leg sofa-leg-left" />
              <div className="sofa-leg sofa-leg-right" />
            </div>


            {/* ---------------------------------------------
                RUG
            --------------------------------------------- */}

            <div className="room-rug">
              <div className="rug-pattern" />
            </div>


            {/* ---------------------------------------------
                PLANT
            --------------------------------------------- */}

            <div className="room-plant">

              <div className="plant-pot">
                <div className="plant-pot-top" />
                <div className="plant-pot-body" />
              </div>

              <div className="plant-stem plant-stem-1" />
              <div className="plant-stem plant-stem-2" />
              <div className="plant-stem plant-stem-3" />
              <div className="plant-stem plant-stem-4" />

              <div className="plant-leaf plant-leaf-1" />
              <div className="plant-leaf plant-leaf-2" />
              <div className="plant-leaf plant-leaf-3" />
              <div className="plant-leaf plant-leaf-4" />
              <div className="plant-leaf plant-leaf-5" />
              <div className="plant-leaf plant-leaf-6" />

            </div>


            {/* ---------------------------------------------
                CHARACTER SHADOW
            --------------------------------------------- */}

            <div className="character-shadow" />


            {/* ---------------------------------------------
                SAMURAI
            --------------------------------------------- */}

            <div className="samurai-container">

              <img
                src="/samurai.png"
                alt="SkillSensAI character"
                className="samurai-image"
              />

            </div>


            {/* ---------------------------------------------
                SKILLS ORBIT
            --------------------------------------------- */}

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
                        `skill-position-${index + 1}`,
                        skill.active
                          ? "skill-active"
                          : "skill-disabled",
                      ].join(" ")}
                      onClick={() =>
                        handleSkillClick(
                          skill
                        )
                      }
                      disabled={
                        !skill.active
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

            <h2 className="flow-heading">
              Learn. Practice. Master.
            </h2>


            <div className="flow-cards">


              {/* -------------------------------------------
                  LEARN
              ------------------------------------------- */}

              <div className="flow-card flow-learn">

                <div className="flow-card-icon">
                  <BookOpen size={25} />
                </div>

                <div>
                  <h3>
                    Learn
                  </h3>

                  <p>
                    Learn skills step by step
                    with guided lessons.
                  </p>
                </div>

              </div>


              {/* -------------------------------------------
                  ARROW
              ------------------------------------------- */}

              <ArrowRight
                className="flow-arrow"
                size={24}
              />


              {/* -------------------------------------------
                  PRACTICE
              ------------------------------------------- */}

              <div className="flow-card flow-practice">

                <div className="flow-card-icon">
                  <Target size={25} />
                </div>

                <div>
                  <h3>
                    Practice
                  </h3>

                  <p>
                    Practice what you learn
                    with real activities.
                  </p>
                </div>

              </div>


              {/* -------------------------------------------
                  ARROW
              ------------------------------------------- */}

              <ArrowRight
                className="flow-arrow"
                size={24}
              />


              {/* -------------------------------------------
                  MASTER
              ------------------------------------------- */}

              <div className="flow-card flow-master">

                <div className="flow-card-icon">
                  <Trophy size={25} />
                </div>

                <div>
                  <h3>
                    Master
                  </h3>

                  <p>
                    Improve your skills and
                    become confident.
                  </p>
                </div>

              </div>

            </div>


            {/* ---------------------------------------------
                PROGRESS NOTE
            --------------------------------------------- */}

            <div className="home-bottom-note">

              <ShieldCheck size={17} />

              <span>
                Your learning journey is
                personalized to your pace.
              </span>

            </div>

          </section>

        </main>


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


              {/* -------------------------------------------
                  CLOSE
              ------------------------------------------- */}

              <button
                type="button"
                className="login-close"
                onClick={closeLogin}
                aria-label="Close login"
                disabled={loading}
              >
                <X size={20} />
              </button>


              {/* -------------------------------------------
                  ICON
              ------------------------------------------- */}

              <div className="login-modal-icon">
                <User size={27} />
              </div>


              {/* -------------------------------------------
                  HEADER
              ------------------------------------------- */}

              <div className="login-modal-header">

                <h2>
                  Welcome to SkillSensAI
                </h2>

                <p>
                  Sign in to continue your
                  learning journey.
                </p>

              </div>


              {/* -------------------------------------------
                  LOGIN TABS
              ------------------------------------------- */}

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
                  Phone
                </button>

              </div>


              {/* -------------------------------------------
                  GOOGLE LOGIN
              ------------------------------------------- */}

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
                        className="login-spinner"
                        size={20}
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

                    <ShieldCheck
                      size={16}
                    />

                    <span>
                      Your account is
                      securely handled by
                      Firebase Authentication.
                    </span>

                  </div>

                </div>
              )}


              {/* -------------------------------------------
                  PHONE LOGIN
              ------------------------------------------- */}

              {loginMethod === "phone" && (
                <div className="login-method-content">

                  {phoneStep === "phone" ? (
                    <>
                      <label
                        className="login-input-label"
                        htmlFor="phone-number"
                      >
                        Mobile Number
                      </label>

                      <div className="login-phone-input">

                        <Phone size={18} />

                        <input
                          id="phone-number"
                          type="tel"
                          value={
                            phoneNumber
                          }
                          onChange={
                            handlePhoneChange
                          }
                          placeholder="+91 9876543210"
                          maxLength={14}
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
                              className="login-spinner"
                              size={18}
                            />

                            Sending OTP...
                          </>
                        ) : (
                          <>
                            <Phone
                              size={18}
                            />

                            Send OTP
                          </>
                        )}

                      </button>
                    </>
                  ) : (
                    <>
                      <label
                        className="login-input-label"
                        htmlFor="otp"
                      >
                        Enter OTP
                      </label>

                      <div className="otp-input-wrapper">

                        <input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={otp}
                          onChange={(event) =>
                            setOtp(
                              event.target.value
                                .replace(
                                  /\D/g,
                                  ""
                                )
                                .slice(
                                  0,
                                  6
                                )
                            )
                          }
                          placeholder="6-digit OTP"
                          maxLength={6}
                          disabled={loading}
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
                              className="login-spinner"
                              size={18}
                            />

                            Verifying...
                          </>
                        ) : (
                          <>
                            <ShieldCheck
                              size={18}
                            />

                            Verify OTP
                          </>
                        )}

                      </button>


                      <button
                        type="button"
                        className="change-number-button"
                        onClick={() => {
                          if (loading) return;

                          setPhoneStep(
                            "phone"
                          );
                          setOtp("");
                          setConfirmationResult(
                            null
                          );
                          setLoginError("");
                        }}
                      >
                        Change number
                      </button>

                    </>
                  )}


                  <div
                    id="recaptcha-container"
                  />


                  <div className="login-security-note">

                    <ShieldCheck
                      size={16}
                    />

                    <span>
                      Your phone number is
                      used only for secure
                      authentication.
                    </span>

                  </div>

                </div>
              )}


              {/* -------------------------------------------
                  ERROR
              ------------------------------------------- */}

              {loginError && (
                <div className="login-error">
                  {loginError}
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
