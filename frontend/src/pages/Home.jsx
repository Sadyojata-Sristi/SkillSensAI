import React, { useEffect, useRef, useState } from "react";

import {
  Music2,
  Swords,
  PersonStanding,
  Code2,
  Guitar,
  Palette,
  Sparkles,
  Flower2,
  ArrowRight,
  UserRound,
  Flame,
  Trophy,
  Target,
  BarChart3,
  X,
  Phone,
  LoaderCircle,
  LogOut,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase";

import "./Home.css";
import "./LoginModal.css";

const skills = [
  {
    name: "Music",
    description: "Learn, Sing & Play",
    icon: Music2,
    color: "#ff2d91",
    position: "music",
    active: true,
  },
  {
    name: "Martial Arts",
    description: "Train Your Body & Mind",
    icon: Swords,
    color: "#ff6b18",
    position: "martial",
    active: true,
  },
  {
    name: "Dance",
    description: "Express, Move & Inspire",
    icon: PersonStanding,
    color: "#b84cff",
    position: "dance",
    active: false,
  },
  {
    name: "Instruments",
    description: "Play Your Passion",
    icon: Guitar,
    color: "#ffc928",
    position: "instruments",
    active: false,
  },
  {
    name: "Yoga",
    description: "Balance Body & Soul",
    icon: Flower2,
    color: "#72e51d",
    position: "yoga",
    active: false,
  },
  {
    name: "Coding",
    description: "Build, Code & Innovate",
    icon: Code2,
    color: "#00cfff",
    position: "coding",
    active: false,
  },
  {
    name: "Art & Creativity",
    description: "Draw, Paint & Create",
    icon: Palette,
    color: "#9d4dff",
    position: "art",
    active: false,
  },
  {
    name: "More Skills",
    description: "Coming Soon",
    icon: Sparkles,
    color: "#3caeff",
    position: "more",
    active: false,
  },
];

function Home() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [loginMethod, setLoginMethod] = useState("google");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");

  const [confirmationResult, setConfirmationResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const recaptchaVerifierRef = useRef(null);

  /*
   * ---------------------------------------------------------
   * AUTH STATE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  /*
   * ---------------------------------------------------------
   * CLOSE LOGIN
   * ---------------------------------------------------------
   */

  const closeLogin = () => {
    setShowLogin(false);
    setError("");
    setSuccess("");
    setPhoneNumber("");
    setOtp("");
    setConfirmationResult(null);

    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch {
        // Ignore cleanup errors.
      }

      recaptchaVerifierRef.current = null;
    }
  };

  /*
   * ---------------------------------------------------------
   * GOOGLE LOGIN
   * ---------------------------------------------------------
   */

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(auth, provider);

      setSuccess("Login successful!");

      setTimeout(() => {
        closeLogin();
      }, 700);
    } catch (err) {
      console.error(err);

      if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else if (err.code === "auth/popup-blocked") {
        setError(
          "Your browser blocked the Google login popup. Please allow popups and try again."
        );
      } else if (err.code === "auth/unauthorized-domain") {
        setError(
          "This website domain is not authorized in Firebase Authentication."
        );
      } else {
        setError("Unable to sign in with Google. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * PHONE NUMBER FORMAT
   * ---------------------------------------------------------
   */

  const formatPhoneNumber = (value) => {
    let cleaned = value.trim();

    if (/^\d{10}$/.test(cleaned)) {
      cleaned = `+91${cleaned}`;
    }

    return cleaned;
  };

  /*
   * ---------------------------------------------------------
   * SEND OTP
   * ---------------------------------------------------------
   */

  const handleSendOtp = async () => {
    setError("");
    setSuccess("");

    const formattedPhone = formatPhoneNumber(phoneNumber);

    if (!/^\+[1-9]\d{7,14}$/.test(formattedPhone)) {
      setError(
        "Enter a valid phone number with country code, for example +91 9876543210."
      );
      return;
    }

    setLoading(true);

    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          "phone-recaptcha",
          {
            size: "normal",
            callback: () => {
              // reCAPTCHA completed.
            },
            "expired-callback": () => {
              setError("reCAPTCHA expired. Please verify again.");
            },
          }
        );
      }

      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(result);

      setSuccess("OTP sent successfully. Check your phone.");

      setPhoneNumber("");
    } catch (err) {
      console.error(err);

      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // Ignore cleanup errors.
        }

        recaptchaVerifierRef.current = null;
      }

      if (err.code === "auth/invalid-phone-number") {
        setError("The phone number is invalid.");
      } else if (err.code === "auth/too-many-requests") {
        setError(
          "Too many attempts. Please wait a while before trying again."
        );
      } else if (err.code === "auth/operation-not-allowed") {
        setError(
          "Phone authentication is not enabled in your Firebase project."
        );
      } else {
        setError("Unable to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * VERIFY OTP
   * ---------------------------------------------------------
   */

  const handleVerifyOtp = async () => {
    if (!confirmationResult) {
      setError("Please request an OTP first.");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit OTP sent to your phone.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await confirmationResult.confirm(otp.trim());

      setSuccess("Login successful!");

      setTimeout(() => {
        closeLogin();
      }, 700);
    } catch (err) {
      console.error(err);

      if (err.code === "auth/invalid-verification-code") {
        setError("Incorrect OTP. Please check the code and try again.");
      } else if (err.code === "auth/code-expired") {
        setError("This OTP has expired. Please request a new one.");
      } else {
        setError("Unable to verify OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * LOGOUT
   * ---------------------------------------------------------
   */

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowProfile(false);
    } catch (err) {
      console.error(err);
    }
  };

  /*
   * ---------------------------------------------------------
   * SKILL NAVIGATION
   * ---------------------------------------------------------
   */

  const handleSkillClick = (skill) => {
    if (!skill.active) {
      alert(`${skill.name} will be available soon!`);
      return;
    }

    if (skill.name === "Music") {
      navigate("/music");
    }

    if (skill.name === "Martial Arts") {
      navigate("/martial-arts");
    }
  };

  /*
   * ---------------------------------------------------------
   * USER DISPLAY
   * ---------------------------------------------------------
   */

  const getUserName = () => {
    if (!user) return "";

    if (user.displayName) {
      return user.displayName.split(" ")[0];
    }

    if (user.phoneNumber) {
      return user.phoneNumber;
    }

    if (user.email) {
      return user.email.split("@")[0];
    }

    return "User";
  };

  const getUserInitial = () => {
    const name = getUserName();

    return name.charAt(0).toUpperCase() || "U";
  };

  return (
    <div className="app">
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="navbar">
        <div className="brand">
          <div className="brand-logo">S</div>

          <div>
            <h1>
              SkillSens<span>AI</span>
            </h1>

            <p>Learn. Train. Master.</p>
          </div>
        </div>

        <nav>
          <a className="active-link">Home</a>
          <a>Progress</a>
          <a>AI Coach</a>
          <a>Leaderboard</a>
          <a>About Us</a>
        </nav>

        {/* =================================================
            LOGIN / USER BUTTON
        ================================================= */}

        {!user ? (
          <button
            className="login-button"
            onClick={() => {
              setShowLogin(true);
              setShowProfile(false);
              setError("");
              setSuccess("");
            }}
          >
            <UserRound size={18} />
            Login
          </button>
        ) : (
          <div className="user-menu-wrapper">
            <button
              className="logged-user-button"
              onClick={() => setShowProfile((previous) => !previous)}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={getUserName()}
                  className="user-avatar-image"
                />
              ) : (
                <span className="user-avatar">
                  {getUserInitial()}
                </span>
              )}

              <span className="user-name">
                {getUserName()}
              </span>
            </button>

            {showProfile && (
              <div className="profile-dropdown">
                <div className="profile-header">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={getUserName()}
                      className="profile-avatar"
                    />
                  ) : (
                    <div className="profile-avatar profile-avatar-letter">
                      {getUserInitial()}
                    </div>
                  )}

                  <div>
                    <strong>{getUserName()}</strong>

                    <span>
                      {user.email ||
                        user.phoneNumber ||
                        "SkillSensAI User"}
                    </span>
                  </div>
                </div>

                <button
                  className="logout-button"
                  onClick={handleLogout}
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <main className="hero">
        <div className="skill-orbit">
          <div className="orbit-ring"></div>

          <div className="orbit-dot dot-1"></div>
          <div className="orbit-dot dot-2"></div>
          <div className="orbit-dot dot-3"></div>
          <div className="orbit-dot dot-4"></div>

          <div className="samurai-container">
            <div className="samurai-glow"></div>

            <img
              src="/samurai.png"
              alt="SkillSensAI Samurai"
              className="samurai"
            />
          </div>

          {skills.map((skill) => {
            const Icon = skill.icon;

            return (
              <button
                key={skill.name}
                className={`skill-button ${skill.position}`}
                style={{
                  "--skill-color": skill.color,
                }}
                onClick={() => handleSkillClick(skill)}
              >
                <div className="skill-icon">
                  <Icon size={34} strokeWidth={1.8} />
                </div>

                <div className="skill-name">
                  {skill.name}
                </div>

                <div className="skill-description">
                  {skill.description}
                </div>

                <div className="skill-arrow">
                  <ArrowRight size={16} />
                </div>
              </button>
            );
          })}
        </div>

        <section className="hero-text">
          <h2>
            Unleash Your <span>Potential</span>
          </h2>

          <p>
            AI-powered learning. Personalized for you.
          </p>

          <button
            className="journey-button"
            onClick={() => navigate("/music")}
          >
            Start Your Journey
            <ArrowRight size={21} />
          </button>
        </section>

        {/* =================================================
            STATS
        ================================================= */}

        <section className="stats">
          <div className="stat">
            <div className="stat-icon orange">
              <Flame />
            </div>

            <div>
              <small>Daily Streak</small>
              <strong>7 Days</strong>
              <p>Keep it up!</p>
            </div>
          </div>

          <div className="stat">
            <div className="stat-icon blue">
              <BarChart3 />
            </div>

            <div>
              <small>Skills Explored</small>
              <strong>3</strong>
              <p>Keep exploring!</p>
            </div>
          </div>

          <div className="stat">
            <div className="stat-icon yellow">
              <Trophy />
            </div>

            <div>
              <small>Lessons Completed</small>
              <strong>24</strong>
              <p>You're doing great!</p>
            </div>
          </div>

          <div className="stat">
            <div className="stat-icon green">
              <Target />
            </div>

            <div>
              <small>Accuracy</small>
              <strong>92%</strong>
              <p>Excellent!</p>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================
          LOGIN MODAL
      ===================================================== */}

      {showLogin && (
        <div
          className="login-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeLogin();
            }
          }}
        >
          <div className="login-modal">
            <button
              className="login-close"
              onClick={closeLogin}
              aria-label="Close login"
            >
              <X size={21} />
            </button>

            <div className="login-logo">
              S
            </div>

            <h2>
              Welcome to SkillSens<span>AI</span>
            </h2>

            <p className="login-subtitle">
              Sign in to save your learning progress and continue your journey.
            </p>

            {/* =================================================
                METHOD SWITCH
            ================================================= */}

            <div className="login-tabs">
              <button
                className={
                  loginMethod === "google"
                    ? "login-tab active"
                    : "login-tab"
                }
                onClick={() => {
                  setLoginMethod("google");
                  setError("");
                  setSuccess("");
                }}
              >
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
                  setError("");
                  setSuccess("");
                }}
              >
                Phone
              </button>
            </div>

            {/* =================================================
                GOOGLE LOGIN
            ================================================= */}

            {loginMethod === "google" && (
              <div className="login-method-content">
                <button
                  className="google-login-button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <LoaderCircle
                      size={20}
                      className="login-spinner"
                    />
                  ) : (
                    <span className="google-letter">G</span>
                  )}

                  <span>
                    {loading
                      ? "Signing in..."
                      : "Continue with Google"}
                  </span>
                </button>

                <div className="login-security-note">
                  <span>🔒</span>
                  <p>
                    Your account is securely handled by
                    Firebase Authentication.
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                PHONE LOGIN
            ================================================= */}

            {loginMethod === "phone" && (
              <div className="login-method-content">
                {!confirmationResult ? (
                  <>
                    <label className="login-label">
                      Phone Number
                    </label>

                    <div className="phone-input-wrapper">
                      <Phone size={19} />

                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(event) =>
                          setPhoneNumber(event.target.value)
                        }
                        placeholder="+91 9876543210"
                        autoComplete="tel"
                      />
                    </div>

                    <p className="phone-hint">
                      Enter your phone number with country code.
                    </p>

                    <div
                      id="phone-recaptcha"
                      className="phone-recaptcha"
                    ></div>

                    <button
                      className="send-otp-button"
                      onClick={handleSendOtp}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <LoaderCircle
                            size={19}
                            className="login-spinner"
                          />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          <Phone size={18} />
                          Send OTP
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <label className="login-label">
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
                          event.target.value.replace(/\D/g, "")
                        )
                      }
                      placeholder="000000"
                      autoComplete="one-time-code"
                    />

                    <p className="phone-hint">
                      Enter the 6-digit code sent to your phone.
                    </p>

                    <button
                      className="send-otp-button"
                      onClick={handleVerifyOtp}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <LoaderCircle
                            size={19}
                            className="login-spinner"
                          />
                          Verifying...
                        </>
                      ) : (
                        "Verify & Login"
                      )}
                    </button>

                    <button
                      className="change-phone-button"
                      onClick={() => {
                        setConfirmationResult(null);
                        setOtp("");
                        setError("");
                        setSuccess("");

                        if (recaptchaVerifierRef.current) {
                          try {
                            recaptchaVerifierRef.current.clear();
                          } catch {
                            // Ignore cleanup errors.
                          }

                          recaptchaVerifierRef.current = null;
                        }
                      }}
                    >
                      Use a different phone number
                    </button>
                  </>
                )}
              </div>
            )}

            {/* =================================================
                STATUS
            ================================================= */}

            {error && (
              <div className="login-message error-message">
                {error}
              </div>
            )}

            {success && (
              <div className="login-message success-message">
                {success}
              </div>
            )}

            <p className="login-footer">
              By continuing, you agree to use SkillSensAI
              responsibly and securely.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
