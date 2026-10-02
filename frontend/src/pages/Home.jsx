import React, { useEffect, useRef, useState } from "react";
import "./Home.css";

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

import "./LoginModal.css";

function Home() {
  const navigate = useNavigate();

  // =========================
  // AUTH STATE
  // =========================

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

  const recaptchaVerifier = useRef(null);

  // =========================
  // FIREBASE AUTH LISTENER
  // =========================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // =========================
  // GOOGLE LOGIN
  // =========================

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
        setShowLogin(false);
        setSuccess("");
      }, 800);
    } catch (err) {
      console.error("Google login error:", err);

      if (err.code === "auth/popup-closed-by-user") {
        setError("Login window was closed.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Your browser blocked the login popup.");
      } else {
        setError(err.message || "Google login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // RECAPTCHA
  // =========================

  const setupRecaptcha = () => {
    if (recaptchaVerifier.current) {
      return recaptchaVerifier.current;
    }

    recaptchaVerifier.current = new RecaptchaVerifier(
      auth,
      "phone-recaptcha",
      {
        size: "normal",
        callback: () => {
          console.log("reCAPTCHA verified");
        },
        "expired-callback": () => {
          setError("reCAPTCHA expired. Please verify again.");
        },
      }
    );

    return recaptchaVerifier.current;
  };

  // =========================
  // SEND PHONE OTP
  // =========================

  const handleSendOTP = async () => {
    setError("");
    setSuccess("");

    if (!phoneNumber.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!phoneNumber.startsWith("+")) {
      setError(
        "Please enter your phone number with country code. Example: +919876543210"
      );
      return;
    }

    setLoading(true);

    try {
      const appVerifier = setupRecaptcha();

      const result = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );

      setConfirmationResult(result);

      setSuccess("OTP sent successfully!");
    } catch (err) {
      console.error("Phone login error:", err);

      if (recaptchaVerifier.current) {
        try {
          recaptchaVerifier.current.clear();
        } catch (e) {
          console.log(e);
        }

        recaptchaVerifier.current = null;
      }

      if (err.code === "auth/invalid-phone-number") {
        setError("Please enter a valid phone number.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError(err.message || "Unable to send OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // VERIFY OTP
  // =========================

  const handleVerifyOTP = async () => {
    setError("");
    setSuccess("");

    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    if (!confirmationResult) {
      setError("Please request an OTP first.");
      return;
    }

    setLoading(true);

    try {
      await confirmationResult.confirm(otp);

      setSuccess("Phone login successful!");

      setTimeout(() => {
        setShowLogin(false);
        setConfirmationResult(null);
        setOtp("");
        setPhoneNumber("");
        setSuccess("");
      }, 800);
    } catch (err) {
      console.error("OTP verification error:", err);

      if (err.code === "auth/invalid-verification-code") {
        setError("Invalid OTP. Please check and try again.");
      } else if (err.code === "auth/code-expired") {
        setError("OTP expired. Please request a new OTP.");
      } else {
        setError(err.message || "OTP verification failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowProfile(false);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // =========================
  // CLOSE LOGIN MODAL
  // =========================

  const closeLogin = () => {
    setShowLogin(false);
    setError("");
    setSuccess("");
    setOtp("");
    setPhoneNumber("");
    setConfirmationResult(null);

    if (recaptchaVerifier.current) {
      try {
        recaptchaVerifier.current.clear();
      } catch (e) {
        console.log(e);
      }

      recaptchaVerifier.current = null;
    }
  };

  // =========================
  // SKILLS
  // =========================

  const skills = [
    {
      name: "Music",
      icon: Music2,
      active: true,
      path: "/music",
      position: "skill-music",
    },
    {
      name: "Martial Arts",
      icon: Swords,
      active: true,
      path: "/martial-arts",
      position: "skill-martial",
    },
    {
      name: "Dance",
      icon: PersonStanding,
      active: false,
      position: "skill-dance",
    },
    {
      name: "Coding",
      icon: Code2,
      active: false,
      position: "skill-coding",
    },
    {
      name: "Instruments",
      icon: Guitar,
      active: false,
      position: "skill-instruments",
    },
    {
      name: "Art",
      icon: Palette,
      active: false,
      position: "skill-art",
    },
    {
      name: "Speaking",
      icon: Sparkles,
      active: false,
      position: "skill-speaking",
    },
    {
      name: "Yoga",
      icon: Flower2,
      active: false,
      position: "skill-yoga",
    },
  ];

  // =========================
  // NAVIGATION
  // =========================

  const handleSkillClick = (skill) => {
    if (skill.active && skill.path) {
      navigate(skill.path);
    } else {
      alert(`${skill.name} is coming soon!`);
    }
  };

  const displayName =
    user?.displayName ||
    user?.phoneNumber ||
    user?.email?.split("@")[0] ||
    "User";

  const profilePhoto = user?.photoURL;

  // =========================
  // UI
  // =========================

  return (
    <div className="home-page">
      {/* ================= NAVBAR ================= */}

      <nav className="navbar">
        <div
          className="logo"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <span className="logo-skill">Skill</span>
          <span className="logo-sensai">SensAI</span>
        </div>

        <div className="nav-right">
          <button
            className="nav-link"
            onClick={() => {
              document
                .querySelector(".skills-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Explore
          </button>

          <button
            className="nav-link"
            onClick={() => {
              document
                .querySelector(".about-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            About
          </button>

          {!user ? (
            <button
              className="login-button"
              onClick={() => {
                setShowLogin(true);
                setError("");
                setSuccess("");
              }}
            >
              <UserRound size={18} />
              Login
            </button>
          ) : (
            <div className="profile-container">
              <button
                className="profile-button"
                onClick={() => setShowProfile(!showProfile)}
              >
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-placeholder">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <span>{displayName}</span>
              </button>

              {showProfile && (
                <div className="profile-dropdown">
                  <div className="profile-info">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="profile-dropdown-image"
                      />
                    ) : (
                      <div className="profile-dropdown-placeholder">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <strong>{displayName}</strong>

                      {user.email && <small>{user.email}</small>}

                      {user.phoneNumber && (
                        <small>{user.phoneNumber}</small>
                      )}
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
        </div>
      </nav>

      {/* ================= HERO ================= */}

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <p className="hero-small-text">
              LEARN • PRACTICE • MASTER
            </p>

            <h1>
              Turn Your
              <span className="hero-highlight"> Passion </span>
              Into
              <br />
              <span className="hero-highlight">Skill.</span>
            </h1>

            <p className="hero-description">
              Learn real-world skills with AI-powered guidance,
              expert knowledge and practical experience.
            </p>

            <button
              className="hero-button"
              onClick={() => {
                document
                  .querySelector(".skills-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Start Learning
              <ArrowRight size={20} />
            </button>
          </div>

          {/* ================= SAMURAI ================= */}

          <div className="hero-visual">
            <div className="samurai-container">
              <img
                src="/samurai.png"
                alt="SkillSensAI learner"
                className="samurai-image"
              />

              <div className="samurai-glow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SKILLS ================= */}

      <section className="skills-section">
        <div className="section-heading">
          <p>CHOOSE YOUR PATH</p>

          <h2>
            Discover a Skill.
            <span> Build Yourself.</span>
          </h2>

          <div className="heading-line"></div>
        </div>

        <div className="skills-orbit">
          <div className="orbit-ring orbit-ring-one"></div>
          <div className="orbit-ring orbit-ring-two"></div>

          {/* CENTER */}

          <div className="orbit-center">
            <div className="center-icon">
              <Sparkles size={38} />
            </div>

            <h3>SkillSensAI</h3>
            <p>Learn at your pace</p>
          </div>

          {/* SKILL BUTTONS */}

          {skills.map((skill) => {
            const Icon = skill.icon;

            return (
              <button
                key={skill.name}
                className={`skill-orbit-button ${skill.position} ${
                  skill.active ? "active-skill" : "inactive-skill"
                }`}
                onClick={() => handleSkillClick(skill)}
              >
                <div className="skill-icon">
                  <Icon size={26} />
                </div>

                <span>{skill.name}</span>

                {!skill.active && (
                  <small>Coming Soon</small>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= STATS ================= */}

      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">
            <Flame size={28} />
          </div>

          <div>
            <h3>Learn</h3>
            <p>Build skills from scratch</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Target size={28} />
          </div>

          <div>
            <h3>Practice</h3>
            <p>Improve with AI feedback</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Trophy size={28} />
          </div>

          <div>
            <h3>Master</h3>
            <p>Track your progress</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={28} />
          </div>

          <div>
            <h3>Progress</h3>
            <p>See yourself improve</p>
          </div>
        </div>
      </section>

      {/* ================= ABOUT ================= */}

      <section className="about-section">
        <div className="about-content">
          <p className="about-label">WHY SKILLSENSAI?</p>

          <h2>
            Learning should be
            <span> practical.</span>
          </h2>

          <p>
            SkillSensAI combines artificial intelligence,
            expert guidance and hands-on practice to help
            learners develop skills that they can actually use.
          </p>

          <p>
            Whether you're learning music, martial arts or
            another skill, your learning journey happens at
            your own pace.
          </p>
        </div>
      </section>

      {/* ================= LOGIN MODAL ================= */}

      {showLogin && (
        <div
          className="login-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeLogin();
            }
          }}
        >
          <div className="login-modal">
            <button
              className="login-close"
              onClick={closeLogin}
            >
              <X size={22} />
            </button>

            <div className="login-header">
              <div className="login-logo">
                <Sparkles size={28} />
              </div>

              <h2>Welcome to SkillSensAI</h2>

              <p>
                Login to continue your learning journey.
              </p>
            </div>

            {/* ================= LOGIN METHOD TABS ================= */}

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

            {/* ================= GOOGLE LOGIN ================= */}

            {loginMethod === "google" && (
              <div className="google-login-section">
                <button
                  className="google-login-button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <span className="google-icon">G</span>

                  {loading
                    ? "Signing in..."
                    : "Continue with Google"}
                </button>
              </div>
            )}

            {/* ================= PHONE LOGIN ================= */}

            {loginMethod === "phone" && (
              <div className="phone-login-section">
                <label>Phone Number</label>

                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={!!confirmationResult}
                />

                {!confirmationResult && (
                  <>
                    <div
                      id="phone-recaptcha"
                      className="recaptcha-container"
                    ></div>

                    <button
                      className="phone-login-button"
                      onClick={handleSendOTP}
                      disabled={loading}
                    >
                      {loading ? "Sending OTP..." : "Send OTP"}
                    </button>
                  </>
                )}

                {confirmationResult && (
                  <>
                    <label>Enter OTP</label>

                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength="6"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) =>
                        setOtp(
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                    />

                    <button
                      className="phone-login-button"
                      onClick={handleVerifyOTP}
                      disabled={loading}
                    >
                      {loading
                        ? "Verifying..."
                        : "Verify OTP"}
                    </button>

                    <button
                      className="change-number-button"
                      onClick={() => {
                        setConfirmationResult(null);
                        setOtp("");
                        setError("");
                        setSuccess("");

                        if (recaptchaVerifier.current) {
                          try {
                            recaptchaVerifier.current.clear();
                          } catch (e) {
                            console.log(e);
                          }

                          recaptchaVerifier.current = null;
                        }
                      }}
                    >
                      Change phone number
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ================= STATUS ================= */}

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            {success && (
              <div className="login-success">
                {success}
              </div>
            )}

            <p className="login-footer">
              By continuing, you agree to use SkillSensAI
              responsibly and respectfully.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
