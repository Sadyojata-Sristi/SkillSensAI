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
  Camera,
  Upload,
  Settings,
  ChevronRight,
  Check,
  PlayCircle,
  Award,
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
    description:
      "Learn music from the fundamentals through structured lessons, practical exercises, recording and AI-powered feedback.",
    features: [
      "Learn From Scratch",
      "Structured music lessons",
      "Voice recording",
      "Upload your practice",
      "Pitch and accuracy feedback",
      "Progress tracking",
    ],
  },
  {
    name: "Martial Arts",
    icon: Swords,
    color: "martial",
    active: true,
    path: "/martial-arts",
    description:
      "Build martial arts skills through guided lessons, practical training and progressive learning paths.",
    features: [
      "Boxing lessons",
      "Karate lessons",
      "Video-based learning",
      "Record your practice",
      "Upload practice videos",
      "Progress tracking",
    ],
  },
  {
    name: "Dance",
    icon: Dumbbell,
    color: "dance",
    active: false,
    description:
      "Dance learning will be available soon.",
    features: [],
  },
  {
    name: "Art",
    icon: Palette,
    color: "art",
    active: false,
    description:
      "Creative art learning will be available soon.",
    features: [],
  },
  {
    name: "Coding",
    icon: Code2,
    color: "coding",
    active: false,
    description:
      "Practical coding learning will be available soon.",
    features: [],
  },
  {
    name: "More",
    icon: Sparkles,
    color: "more",
    active: false,
    description:
      "More skills are coming soon to SkillSensAI.",
    features: [],
  },
];

/* =========================================================
   CHARACTER OPTIONS
   =========================================================
   Replace these image paths later when you upload your
   actual character images.
   ========================================================= */

const characterOptions = [
  {
    id: "samurai",
    name: "Samurai",
    image: "/samurai.png",
  },
  {
    id: "character-2",
    name: "Musician",
    image: "/characters/character-2.png",
  },
  {
    id: "character-3",
    name: "Fighter",
    image: "/characters/character-3.png",
  },
  {
    id: "character-4",
    name: "Character 4",
    image: "/characters/character-4.png",
  },
  {
    id: "character-5",
    name: "Character 5",
    image: "/characters/character-5.png",
  },
  {
    id: "character-6",
    name: "Character 6",
    image: "/characters/character-6.png",
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
     NEW PROFILE STATE
     ======================================================= */

  const [profilePanelOpen, setProfilePanelOpen] =
    useState(false);

  const [skillsPanelOpen, setSkillsPanelOpen] =
    useState(false);

  const [selectedSkill, setSelectedSkill] =
    useState(null);

  const [characterPanelOpen, setCharacterPanelOpen] =
    useState(false);

  const [customName, setCustomName] = useState(
    localStorage.getItem("skillsensai_custom_name") || ""
  );

  const [editingName, setEditingName] = useState(false);

  const [nameInput, setNameInput] = useState("");

  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("skillsensai_profile_image") || ""
  );

  const [selectedCharacter, setSelectedCharacter] =
    useState(
      localStorage.getItem(
        "skillsensai_character"
      ) || "samurai"
    );

  const [temporaryCharacter, setTemporaryCharacter] =
    useState(
      localStorage.getItem(
        "skillsensai_character"
      ) || "samurai"
    );

  const profileImageInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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
        !event.target.closest(".profile-area") &&
        !event.target.closest(
          "[data-skillsensai-panel]"
        )
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
    customName ||
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
     CURRENT CHARACTER
     ======================================================= */

  const currentCharacter =
    characterOptions.find(
      (character) =>
        character.id ===
        selectedCharacter
    ) ||
    characterOptions[0];

  /* =======================================================
     PROFILE OPEN
     ======================================================= */

  const openProfilePanel = () => {
    setProfileOpen(false);

    setNameInput(displayName);

    setEditingName(false);

    setProfilePanelOpen(true);
  };

  /* =======================================================
     SKILLS PANEL
     ======================================================= */

  const openSkillsPanel = () => {
    setProfileOpen(false);

    setSelectedSkill(null);

    setSkillsPanelOpen(true);
  };

  /* =======================================================
     SAVE NAME
     ======================================================= */

  const saveName = () => {
    const trimmedName =
      nameInput.trim();

    if (!trimmedName) {
      return;
    }

    setCustomName(trimmedName);

    localStorage.setItem(
      "skillsensai_custom_name",
      trimmedName
    );

    setEditingName(false);
  };

  /* =======================================================
     PROFILE IMAGE HANDLER
     ======================================================= */

  const handleProfileImageChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith("image/")
    ) {
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        "Please choose an image smaller than 5 MB."
      );
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      const imageData =
        reader.result;

      setProfileImage(imageData);

      localStorage.setItem(
        "skillsensai_profile_image",
        imageData
      );
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  /* =======================================================
     CHARACTER PANEL
     ======================================================= */

  const openCharacterPanel = () => {
    setTemporaryCharacter(
      selectedCharacter
    );

    setCharacterPanelOpen(true);
  };

  /* =======================================================
     SAVE CHARACTER
     ======================================================= */

  const saveCharacter = () => {
    setSelectedCharacter(
      temporaryCharacter
    );

    localStorage.setItem(
      "skillsensai_character",
      temporaryCharacter
    );

    setCharacterPanelOpen(false);
  };

  /* =======================================================
     CHARACTER IMAGE FALLBACK
     ======================================================= */

  const handleCharacterImageError = (
    event
  ) => {
    event.currentTarget.src =
      "/samurai.png";
  };

  /* =======================================================
     PROFILE IMAGE
     ======================================================= */

  const profileImageSource =
    profileImage ||
    user?.photoURL ||
    "";

  /* =======================================================
     INLINE PANEL STYLES
     These do not affect the existing Home layout.
     ======================================================= */

  const panelOverlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 8000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background:
      "rgba(12, 10, 25, 0.72)",
    backdropFilter: "blur(12px)",
  };

  const panelStyle = {
    position: "relative",
    width: "min(520px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    borderRadius: "28px",
    padding: "28px",
    background:
      theme === "dark"
        ? "rgba(29, 25, 47, 0.98)"
        : "rgba(255, 255, 255, 0.98)",
    color:
      theme === "dark"
        ? "#ffffff"
        : "#171326",
    boxShadow:
      "0 30px 90px rgba(0,0,0,0.30)",
    border:
      theme === "dark"
        ? "1px solid rgba(255,255,255,0.10)"
        : "1px solid rgba(98,69,216,0.12)",
  };

  const panelCloseStyle = {
    position: "absolute",
    top: "18px",
    right: "18px",
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background:
      theme === "dark"
        ? "rgba(255,255,255,0.08)"
        : "#f1eeff",
    color:
      theme === "dark"
        ? "#ffffff"
        : "#6245d8",
  };

  const panelTitleStyle = {
    margin: 0,
    fontSize: "26px",
    fontWeight: 800,
    letterSpacing: "-0.5px",
  };

  const panelSubtitleStyle = {
    margin: "7px 0 0",
    fontSize: "14px",
    lineHeight: 1.6,
    opacity: 0.68,
  };

  const actionButtonStyle = {
    width: "100%",
    minHeight: "48px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    fontWeight: 700,
    fontSize: "14px",
  };

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

          {/* HANGING BULB MUST BE INSIDE CEILING */}
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
                  {profileImageSource ? (
                    <img
                      src={
                        profileImageSource
                      }
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
                      {profileImageSource ? (
                        <img
                          src={
                            profileImageSource
                          }
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

                  {/* PROFILE */}

                  <button
                    type="button"
                    onClick={
                      openProfilePanel
                    }
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "11px 12px",
                      marginBottom: "5px",
                      border: "none",
                      borderRadius: "10px",
                      background:
                        "transparent",
                      color: "inherit",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <User size={17} />

                    <span
                      style={{
                        flex: 1,
                        fontWeight: 600,
                      }}
                    >
                      Profile
                    </span>

                    <ChevronRight
                      size={15}
                    />
                  </button>

                  {/* MY SKILLS */}

                  <button
                    type="button"
                    onClick={
                      openSkillsPanel
                    }
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "11px 12px",
                      marginBottom: "7px",
                      border: "none",
                      borderRadius: "10px",
                      background:
                        "transparent",
                      color: "inherit",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <Award size={17} />

                    <span
                      style={{
                        flex: 1,
                        fontWeight: 600,
                      }}
                    >
                      My Skills
                    </span>

                    <ChevronRight
                      size={15}
                    />
                  </button>

                  {/* LOGOUT */}

                  <button
                    type="button"
                    className="logout-button"
                    onClick={
                      handleLogout
                    }
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

            {/* CHARACTER SHADOW */}

            <div className="character-shadow" />

            {/* CHARACTER */}

            <div className="samurai-container">
              <div className="samurai-aura" />

              <img
                src={
                  currentCharacter.image
                }
                alt={
                  currentCharacter.name
                }
                className="samurai-image"
                onError={
                  handleCharacterImageError
                }
              />
            </div>

            {/* SKILL ORBIT */}

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

              <button
                type="button"
                className="login-close"
                onClick={closeLogin}
                aria-label="Close login"
              >
                <X size={18} />
              </button>

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

              {/* PHONE */}

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

                        <Phone size={16} />

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

              {loginError && (
                <div className="login-error">
                  {loginError}
                </div>
              )}

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
            FIREBASE RECAPTCHA
        ================================================= */}

        <div id="recaptcha-container" />

      </main>

      {/* =====================================================
          PROFILE PANEL
          ===================================================== */}

      {profilePanelOpen && (
        <div
          data-skillsensai-panel="profile"
          style={panelOverlayStyle}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setProfilePanelOpen(false);
            }
          }}
        >
          <div
            style={panelStyle}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              style={panelCloseStyle}
              onClick={() =>
                setProfilePanelOpen(false)
              }
              aria-label="Close profile"
            >
              <X size={18} />
            </button>

            <div
              style={{
                marginBottom: "25px",
              }}
            >
              <h2 style={panelTitleStyle}>
                Your Profile
              </h2>

              <p
                style={
                  panelSubtitleStyle
                }
              >
                Manage your personal
                information and your
                SkillSensAI character.
              </p>
            </div>

            {/* PROFILE PHOTO */}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: "28px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "112px",
                  height: "112px",
                  borderRadius: "50%",
                  padding: "4px",
                  background:
                    "linear-gradient(135deg, #7c5cfc, #6245d8)",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      theme === "dark"
                        ? "#302a49"
                        : "#f1eeff",
                  }}
                >
                  {profileImageSource ? (
                    <img
                      src={
                        profileImageSource
                      }
                      alt={displayName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <User
                      size={45}
                      opacity={0.55}
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    cameraInputRef.current?.click()
                  }
                  style={{
                    position:
                      "absolute",
                    right: "-2px",
                    bottom: "2px",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "3px solid white",
                    background:
                      "#6245d8",
                    color: "white",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    cursor: "pointer",
                  }}
                  title="Take a profile photo"
                >
                  <Camera size={17} />
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={
                  handleProfileImageChange
                }
                style={{
                  display: "none",
                }}
              />

              <input
                ref={
                  profileImageInputRef
                }
                type="file"
                accept="image/*"
                onChange={
                  handleProfileImageChange
                }
                style={{
                  display: "none",
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: "9px",
                  marginTop: "15px",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    cameraInputRef.current?.click()
                  }
                  style={{
                    padding:
                      "9px 13px",
                    borderRadius:
                      "10px",
                    border:
                      "1px solid rgba(124,92,252,0.22)",
                    background:
                      theme === "dark"
                        ? "rgba(124,92,252,0.12)"
                        : "#f7f4ff",
                    color:
                      theme === "dark"
                        ? "#dcd4ff"
                        : "#6245d8",
                    cursor:
                      "pointer",
                    display: "flex",
                    alignItems:
                      "center",
                    gap: "6px",
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                >
                  <Camera size={14} />
                  Camera
                </button>

                <button
                  type="button"
                  onClick={() =>
                    profileImageInputRef.current?.click()
                  }
                  style={{
                    padding:
                      "9px 13px",
                    borderRadius:
                      "10px",
                    border:
                      "1px solid rgba(124,92,252,0.22)",
                    background:
                      theme === "dark"
                        ? "rgba(124,92,252,0.12)"
                        : "#f7f4ff",
                    color:
                      theme === "dark"
                        ? "#dcd4ff"
                        : "#6245d8",
                    cursor:
                      "pointer",
                    display: "flex",
                    alignItems:
                      "center",
                    gap: "6px",
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                >
                  <Upload size={14} />
                  Upload
                </button>
              </div>
            </div>

            {/* NAME */}

            <div
              style={{
                padding:
                  "18px",
                borderRadius:
                  "17px",
                marginBottom:
                  "14px",
                background:
                  theme === "dark"
                    ? "rgba(255,255,255,0.045)"
                    : "#f8f6ff",
                border:
                  "1px solid rgba(124,92,252,0.10)",
              }}
            >
              <div
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    700,
                  opacity:
                    0.55,
                  marginBottom:
                    "8px",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.7px",
                }}
              >
                Your Name
              </div>

              {!editingName ? (
                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "10px",
                  }}
                >
                  <strong
                    style={{
                      flex: 1,
                      fontSize:
                        "17px",
                    }}
                  >
                    {displayName}
                  </strong>

                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(
                        displayName
                      );
                      setEditingName(
                        true
                      );
                    }}
                    style={{
                      border:
                        "none",
                      background:
                        "transparent",
                      color:
                        "#7c5cfc",
                      cursor:
                        "pointer",
                      fontWeight:
                        700,
                      fontSize:
                        "12px",
                    }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={
                      nameInput
                    }
                    onChange={(event) =>
                      setNameInput(
                        event
                          .target
                          .value
                      )
                    }
                    autoFocus
                    maxLength={40}
                    style={{
                      width:
                        "100%",
                      boxSizing:
                        "border-box",
                      padding:
                        "12px 13px",
                      borderRadius:
                        "11px",
                      border:
                        "1px solid rgba(124,92,252,0.30)",
                      outline:
                        "none",
                      background:
                        theme ===
                        "dark"
                          ? "#211c35"
                          : "white",
                      color:
                        "inherit",
                      fontSize:
                        "14px",
                    }}
                  />

                  <div
                    style={{
                      display:
                        "flex",
                      gap: "8px",
                      marginTop:
                        "9px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={
                        saveName
                      }
                      style={{
                        padding:
                          "8px 14px",
                        border:
                          "none",
                        borderRadius:
                          "9px",
                        background:
                          "#6245d8",
                        color:
                          "white",
                        cursor:
                          "pointer",
                        fontWeight:
                          700,
                      }}
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingName(
                          false
                        )
                      }
                      style={{
                        padding:
                          "8px 14px",
                        border:
                          "none",
                        borderRadius:
                          "9px",
                        background:
                          theme ===
                          "dark"
                            ? "rgba(255,255,255,0.08)"
                            : "#eae6f8",
                        color:
                          "inherit",
                        cursor:
                          "pointer",
                        fontWeight:
                          600,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ACCOUNT */}

            <div
              style={{
                padding:
                  "18px",
                borderRadius:
                  "17px",
                marginBottom:
                  "14px",
                background:
                  theme === "dark"
                    ? "rgba(255,255,255,0.045)"
                    : "#f8f6ff",
                border:
                  "1px solid rgba(124,92,252,0.10)",
              }}
            >
              <div
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    700,
                  opacity:
                    0.55,
                  marginBottom:
                    "8px",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.7px",
                }}
              >
                Account
              </div>

              <div
                style={{
                  fontSize:
                    "14px",
                    lineHeight:
                      1.6,
                  opacity:
                    0.75,
                  wordBreak:
                    "break-word",
                }}
              >
                {displayContact}
              </div>
            </div>

            {/* CHARACTER */}

            <div
              style={{
                padding:
                  "18px",
                borderRadius:
                  "17px",
                background:
                  theme === "dark"
                    ? "rgba(255,255,255,0.045)"
                    : "#f8f6ff",
                border:
                  "1px solid rgba(124,92,252,0.10)",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  marginBottom:
                    "15px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "12px",
                      fontWeight:
                        700,
                      opacity:
                        0.55,
                      marginBottom:
                        "5px",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.7px",
                    }}
                  >
                    Your Character
                  </div>

                  <strong>
                    {
                      currentCharacter.name
                    }
                  </strong>
                </div>

                <Settings
                  size={19}
                  opacity={0.5}
                />
              </div>

              <button
                type="button"
                onClick={
                  openCharacterPanel
                }
                style={{
                  ...actionButtonStyle,
                  background:
                    "#6245d8",
                  color: "white",
                }}
              >
                <Sparkles
                  size={17}
                />
                Change Character
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          MY SKILLS PANEL
          ===================================================== */}

      {skillsPanelOpen && (
        <div
          data-skillsensai-panel="skills"
          style={panelOverlayStyle}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSkillsPanelOpen(
                false
              );
              setSelectedSkill(null);
            }
          }}
        >
          <div
            style={panelStyle}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              style={panelCloseStyle}
              onClick={() => {
                setSkillsPanelOpen(
                  false
                );
                setSelectedSkill(null);
              }}
              aria-label="Close skills"
            >
              <X size={18} />
            </button>

            {!selectedSkill ? (
              <>
                <div
                  style={{
                    marginBottom:
                      "25px",
                  }}
                >
                  <h2
                    style={
                      panelTitleStyle
                    }
                  >
                    My Skills
                  </h2>

                  <p
                    style={
                      panelSubtitleStyle
                    }
                  >
                    Skills you're
                    currently learning
                    with SkillSensAI.
                  </p>
                </div>

                {/* MUSIC */}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedSkill(
                      skills[0]
                    )
                  }
                  style={{
                    width:
                      "100%",
                    padding:
                      "18px",
                    borderRadius:
                      "18px",
                    border:
                      "1px solid rgba(124,92,252,0.15)",
                    background:
                      theme ===
                      "dark"
                        ? "rgba(124,92,252,0.10)"
                        : "#f8f6ff",
                    color:
                      "inherit",
                    cursor:
                      "pointer",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "15px",
                    textAlign:
                      "left",
                    marginBottom:
                      "12px",
                  }}
                >
                  <div
                    style={{
                      width:
                        "50px",
                      height:
                        "50px",
                      flexShrink: 0,
                      borderRadius:
                        "15px",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      background:
                        "linear-gradient(135deg,#7c5cfc,#6245d8)",
                      color:
                        "white",
                    }}
                  >
                    <Music
                      size={24}
                    />
                  </div>

                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <strong
                      style={{
                        display:
                          "block",
                        fontSize:
                          "16px",
                        marginBottom:
                          "4px",
                      }}
                    >
                      Music
                    </strong>

                    <span
                      style={{
                        fontSize:
                          "12px",
                        opacity:
                          0.65,
                      }}
                    >
                      {lessonsLearned}{" "}
                      lesson
                      {lessonsLearned ===
                      1
                        ? ""
                        : "s"}{" "}
                      learned
                    </span>
                  </div>

                  <ChevronRight
                    size={19}
                    opacity={0.55}
                  />
                </button>

                {/* MARTIAL ARTS */}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedSkill(
                      skills[1]
                    )
                  }
                  style={{
                    width:
                      "100%",
                    padding:
                      "18px",
                    borderRadius:
                      "18px",
                    border:
                      "1px solid rgba(124,92,252,0.15)",
                    background:
                      theme ===
                      "dark"
                        ? "rgba(124,92,252,0.10)"
                        : "#f8f6ff",
                    color:
                      "inherit",
                    cursor:
                      "pointer",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "15px",
                    textAlign:
                      "left",
                    marginBottom:
                      "12px",
                  }}
                >
                  <div
                    style={{
                      width:
                        "50px",
                      height:
                        "50px",
                      flexShrink: 0,
                      borderRadius:
                        "15px",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      background:
                        "linear-gradient(135deg,#e85b5b,#b83232)",
                      color:
                        "white",
                    }}
                  >
                    <Swords
                      size={24}
                    />
                  </div>

                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <strong
                      style={{
                        display:
                          "block",
                        fontSize:
                          "16px",
                        marginBottom:
                          "4px",
                      }}
                    >
                      Martial Arts
                    </strong>

                    <span
                      style={{
                        fontSize:
                          "12px",
                        opacity:
                          0.65,
                      }}
                    >
                      Boxing +
                      Karate
                    </span>
                  </div>

                  <ChevronRight
                    size={19}
                    opacity={0.55}
                  />
                </button>

                {/* COMING SOON */}

                <div
                  style={{
                    marginTop:
                      "20px",
                    padding:
                      "14px",
                    borderRadius:
                      "14px",
                    background:
                      theme ===
                      "dark"
                        ? "rgba(255,255,255,0.04)"
                        : "#faf9fd",
                    fontSize:
                      "12px",
                    opacity:
                      0.6,
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "8px",
                  }}
                >
                  <Sparkles
                    size={15}
                  />
                  More skills will
                  become available
                  soon.
                </div>
              </>
            ) : (
              <>
                {/* BACK */}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedSkill(
                      null
                    )
                  }
                  style={{
                    border:
                      "none",
                    background:
                      "transparent",
                    color:
                      "#7c5cfc",
                    cursor:
                      "pointer",
                    fontWeight:
                      700,
                    padding:
                      "0",
                    marginBottom:
                      "18px",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "6px",
                  }}
                >
                  ← Back to My Skills
                </button>

                {/* SKILL HEADER */}

                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "14px",
                    marginBottom:
                      "22px",
                  }}
                >
                  <div
                    style={{
                      width:
                        "58px",
                      height:
                        "58px",
                      borderRadius:
                        "17px",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      background:
                        selectedSkill.color ===
                        "music"
                          ? "linear-gradient(135deg,#7c5cfc,#6245d8)"
                          : "linear-gradient(135deg,#e85b5b,#b83232)",
                      color:
                        "white",
                    }}
                  >
                    {selectedSkill.name ===
                    "Music" ? (
                      <Music
                        size={27}
                      />
                    ) : (
                      <Swords
                        size={27}
                      />
                    )}
                  </div>

                  <div>
                    <h2
                      style={{
                        ...panelTitleStyle,
                        fontSize:
                          "23px",
                      }}
                    >
                      {
                        selectedSkill.name
                      }
                    </h2>

                    <span
                      style={{
                        fontSize:
                          "12px",
                        opacity:
                          0.6,
                      }}
                    >
                      Currently
                      learning
                    </span>
                  </div>
                </div>

                {/* DESCRIPTION */}

                <p
                  style={{
                    fontSize:
                      "14px",
                    lineHeight:
                      1.7,
                    opacity:
                      0.72,
                    marginBottom:
                      "22px",
                  }}
                >
                  {
                    selectedSkill.description
                  }
                </p>

                {/* PROGRESS */}

                <div
                  style={{
                    padding:
                      "18px",
                    borderRadius:
                      "17px",
                    background:
                      theme ===
                      "dark"
                        ? "rgba(255,255,255,0.045)"
                        : "#f8f6ff",
                    marginBottom:
                      "18px",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      marginBottom:
                        "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          "13px",
                        fontWeight:
                          600,
                      }}
                    >
                      Progress
                    </span>

                    <strong
                      style={{
                        color:
                          "#7c5cfc",
                      }}
                    >
                      {selectedSkill.name ===
                      "Music"
                        ? `${Math.min(
                            lessonsLearned *
                              10,
                            100
                          )}%`
                        : "Learning"}
                    </strong>
                  </div>

                  <div
                    style={{
                      width:
                        "100%",
                      height:
                        "8px",
                      borderRadius:
                        "10px",
                      overflow:
                        "hidden",
                      background:
                        theme ===
                        "dark"
                          ? "rgba(255,255,255,0.10)"
                          : "#e5e0f5",
                    }}
                  >
                    <div
                      style={{
                        width:
                          selectedSkill.name ===
                          "Music"
                            ? `${Math.min(
                                lessonsLearned *
                                  10,
                                100
                              )}%`
                            : "20%",
                        height:
                          "100%",
                        borderRadius:
                          "10px",
                        background:
                          "linear-gradient(90deg,#7c5cfc,#6245d8)",
                      }}
                    />
                  </div>
                </div>

                {/* FEATURES */}

                <div
                  style={{
                    fontSize:
                      "12px",
                    fontWeight:
                      700,
                    opacity:
                      0.55,
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.7px",
                    marginBottom:
                      "10px",
                  }}
                >
                  What's Included
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap: "9px",
                  }}
                >
                  {selectedSkill.features.map(
                    (feature) => (
                      <div
                        key={feature}
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "9px",
                          padding:
                            "10px 12px",
                          borderRadius:
                            "10px",
                          background:
                            theme ===
                            "dark"
                              ? "rgba(255,255,255,0.04)"
                              : "#faf9fd",
                          fontSize:
                            "13px",
                        }}
                      >
                        <Check
                          size={15}
                          color="#7c5cfc"
                        />

                        <span>
                          {feature}
                        </span>
                      </div>
                    )
                  )}
                </div>

                {/* OPEN SKILL */}

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      selectedSkill.path
                    )
                  }
                  style={{
                    ...actionButtonStyle,
                    marginTop:
                      "22px",
                    background:
                      selectedSkill.name ===
                      "Music"
                        ? "#6245d8"
                        : "#b83232",
                    color:
                      "white",
                  }}
                >
                  <PlayCircle
                    size={18}
                  />
                  Continue Learning
                  <ArrowRight
                    size={17}
                  />
                </button>
              </>
            )}

          </div>
        </div>
      )}

      {/* =====================================================
          CHARACTER SELECTION PANEL
          ===================================================== */}

      {characterPanelOpen && (
        <div
          data-skillsensai-panel="character"
          style={panelOverlayStyle}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setCharacterPanelOpen(
                false
              );
            }
          }}
        >
          <div
            style={{
              ...panelStyle,
              width:
                "min(700px, 100%)",
            }}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              style={panelCloseStyle}
              onClick={() =>
                setCharacterPanelOpen(
                  false
                )
              }
              aria-label="Close character selection"
            >
              <X size={18} />
            </button>

            <div
              style={{
                marginBottom:
                  "25px",
              }}
            >
              <h2
                style={
                  panelTitleStyle
                }
              >
                Choose Your Character
              </h2>

              <p
                style={
                  panelSubtitleStyle
                }
              >
                Choose a character that
                represents your learning
                journey. Your selected
                character will appear on
                the SkillSensAI home page.
              </p>
            </div>

            {/* CHARACTER GRID */}

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              {characterOptions.map(
                (character) => {
                  const isSelected =
                    temporaryCharacter ===
                    character.id;

                  return (
                    <button
                      key={
                        character.id
                      }
                      type="button"
                      onClick={() =>
                        setTemporaryCharacter(
                          character.id
                        )
                      }
                      style={{
                        position:
                          "relative",
                        minHeight:
                          "190px",
                        borderRadius:
                          "20px",
                        overflow:
                          "hidden",
                        border: isSelected
                          ? "2px solid #7c5cfc"
                          : "1px solid rgba(124,92,252,0.12)",
                        background:
                          theme ===
                          "dark"
                            ? "rgba(255,255,255,0.045)"
                            : "#f8f6ff",
                        color:
                          "inherit",
                        cursor:
                          "pointer",
                        padding:
                          "10px",
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        alignItems:
                          "center",
                        justifyContent:
                          "flex-end",
                      }}
                    >
                      {/* SELECTED CHECK */}

                      {isSelected && (
                        <span
                          style={{
                            position:
                              "absolute",
                            top:
                              "9px",
                            right:
                              "9px",
                            zIndex:
                              3,
                            width:
                              "27px",
                            height:
                              "27px",
                            borderRadius:
                              "50%",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            background:
                              "#6245d8",
                            color:
                              "white",
                          }}
                        >
                          <Check
                            size={15}
                          />
                        </span>
                      )}

                      {/* CHARACTER IMAGE */}

                      <div
                        style={{
                          width:
                            "100%",
                          height:
                            "135px",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                        }}
                      >
                        <img
                          src={
                            character.image
                          }
                          alt={
                            character.name
                          }
                          onError={
                            handleCharacterImageError
                          }
                          style={{
                            maxWidth:
                              "100%",
                            maxHeight:
                              "135px",
                            objectFit:
                              "contain",
                            filter:
                              "drop-shadow(0 10px 14px rgba(0,0,0,0.18))",
                          }}
                        />
                      </div>

                      <strong
                        style={{
                          fontSize:
                            "13px",
                          marginTop:
                            "6px",
                        }}
                      >
                        {
                          character.name
                        }
                      </strong>
                    </button>
                  );
                }
              )}
            </div>

            {/* NOTE */}

            <div
              style={{
                marginTop:
                  "17px",
                padding:
                  "12px 14px",
                borderRadius:
                  "12px",
                background:
                  theme ===
                  "dark"
                    ? "rgba(124,92,252,0.10)"
                    : "#f1eeff",
                color:
                  theme ===
                  "dark"
                    ? "#ddd5ff"
                    : "#6245d8",
                fontSize:
                  "12px",
                lineHeight:
                  1.5,
              }}
            >
              <Sparkles
                size={14}
                style={{
                  verticalAlign:
                    "middle",
                  marginRight:
                    "6px",
                }}
              />

              Character images can be
              replaced later with your
              final SkillSensAI artwork.
            </div>

            {/* SAVE */}

            <button
              type="button"
              onClick={
                saveCharacter
              }
              style={{
                ...actionButtonStyle,
                marginTop:
                  "18px",
                background:
                  "#6245d8",
                color:
                  "white",
              }}
            >
              <Check size={18} />
              Save Character
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
