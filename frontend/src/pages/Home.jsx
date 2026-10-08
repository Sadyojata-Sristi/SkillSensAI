import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AIChat from "../components/AIChat";

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
  Camera,
  Upload,
  Check,
  Settings,
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
      "Learn singing, pitch, rhythm and musical expression.",
    lessons: 15,
  },
  {
    name: "Martial Arts",
    icon: Swords,
    color: "martial",
    active: true,
    path: "/martial-arts",
    description:
      "Build discipline, technique, movement and confidence.",
    lessons: 10,
  },
  {
    name: "Dance",
    icon: Dumbbell,
    color: "dance",
    active: false,
    description:
      "Dance lessons will be available soon.",
    lessons: 0,
  },
  {
    name: "Art",
    icon: Palette,
    color: "art",
    active: false,
    description:
      "Creative art learning will be available soon.",
    lessons: 0,
  },
  {
    name: "Coding",
    icon: Code2,
    color: "coding",
    active: false,
    description:
      "Practical coding lessons will be available soon.",
    lessons: 0,
  },
  {
    name: "More",
    icon: Sparkles,
    color: "more",
    active: false,
    description:
      "More skills are coming soon.",
    lessons: 0,
  },
];


/* =========================================================
   TOTAL LESSONS
   ========================================================= */

const TOTAL_LESSONS = 15;


/* =========================================================
   CHARACTER OPTIONS
   ========================================================= */

const defaultCharacters = [
  {
    id: "samurai",
    name: "Samurai",
    image: "/samurai.png",
    description: "Your original SkillSensAI warrior.",
  },
  {
    id: "dancer",
    name: "Dancer",
    image: "/Dancer.png",
    description: "Your Michael Jackson",
  },
  {
    id: "karate",
    name: "Karate",
    image: "/Karate.png",
    description: "Martial Arts character.",
  },
  {
    id: "lady",
    name: "Lady",
    image: "/Lady.png",
    description: "Your SkillSensAI learning companion.",
  },
  {
    id: "shadowboxer",
    name: "Shadow Boxer",
    image: "/ShadowBoxer.png",
    description: "Your boxing learning companion.",
  },
];


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
     ACCOUNT PANEL
  ------------------------------------------------------- */

  const [accountTab, setAccountTab] = useState("profile");

  const [profileImage, setProfileImage] = useState(null);

  const [selectedCharacter, setSelectedCharacter] =
    useState("samurai");

  const [customCharacter, setCustomCharacter] =
    useState(null);

  const [selectedSkill, setSelectedSkill] =
    useState(null);

  const profileImageInputRef = useRef(null);

  const characterImageInputRef = useRef(null);


  /* -------------------------------------------------------
     PHONE LOGIN
  ------------------------------------------------------- */

  const [phoneNumber, setPhoneNumber] = useState("");

  const [otp, setOtp] = useState("");

  const [confirmationResult, setConfirmationResult] =
    useState(null);

  const [phoneStep, setPhoneStep] =
    useState("phone");

  const recaptchaRef = useRef(null);


  /* -------------------------------------------------------
     PROGRESS
  ------------------------------------------------------- */

  const [lessonsLearned, setLessonsLearned] =
    useState(0);


  /* -------------------------------------------------------
     BULB

     IMPORTANT:
     DARK THEME  = BULB ON
     LIGHT THEME = BULB OFF
  ------------------------------------------------------- */

  const [bulbOn, setBulbOn] = useState(() => {
    try {
      return (
        localStorage.getItem(
          "skillsensai_theme"
        ) === "dark"
      );
    } catch {
      return false;
    }
  });


  /* =========================================================
     LOAD ACCOUNT SETTINGS
  ========================================================= */

  useEffect(() => {
    try {
      const savedProfileImage =
        localStorage.getItem(
          "skillsensai_profile_image"
        );

      if (savedProfileImage) {
        setProfileImage(savedProfileImage);
      }

      const savedCharacter =
        localStorage.getItem(
          "skillsensai_character"
        );

      if (savedCharacter) {
        setSelectedCharacter(savedCharacter);
      }

      const savedCustomCharacter =
        localStorage.getItem(
          "skillsensai_custom_character"
        );

      if (savedCustomCharacter) {
        setCustomCharacter(
          savedCustomCharacter
        );
      }
    } catch (error) {
      console.error(
        "Could not load account settings:",
        error
      );
    }
  }, []);


  /* =========================================================
     THEME

     Bulb and theme are kept synchronized here.

     DARK  -> bulb ON
     LIGHT -> bulb OFF
  ========================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        "skillsensai_theme",
        theme
      );
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

    /*
      Keep bulb state synchronized with theme.
    */
    setBulbOn(
      theme === "dark"
    );
  }, [theme]);


  /* =========================================================
     FIREBASE AUTH STATE
  ========================================================= */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          console.log(
            "SkillSensAI auth state:",
            currentUser
          );

          setUser(currentUser);

          if (!currentUser) {
            setProfileOpen(false);
          }
        },
        (error) => {
          console.error(
            "Firebase auth state error:",
            error
          );
        }
      );

    return () => unsubscribe();
  }, []);


  /* =========================================================
     LOAD REAL PROGRESS
  ========================================================= */

  const loadProgress = () => {
    try {
      const completed =
        getLessonsLearned();

      const numericValue =
        Number(completed);

      if (
        Number.isFinite(
          numericValue
        )
      ) {
        setLessonsLearned(
          Math.max(
            0,
            numericValue
          )
        );
      } else {
        setLessonsLearned(0);
      }
    } catch (error) {
      console.error(
        "Could not load lesson progress:",
        error
      );

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
    const handleOutsideClick =
      (event) => {
        if (
          !event.target.closest(
            ".profile-area"
          )
        ) {
          setProfileOpen(false);
          setSelectedSkill(null);
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

  const handleGoogleLogin =
    async () => {
      setLoading(true);
      setLoginError("");

      try {
        const provider =
          new GoogleAuthProvider();

        provider.setCustomParameters(
          {
            prompt:
              "select_account",
          }
        );

        const result =
          await signInWithPopup(
            auth,
            provider
          );

        console.log(
          "Google login successful:",
          result.user
        );

        setUser(result.user);

        setLoginOpen(false);
        setProfileOpen(true);
        setAccountTab("profile");

        loadProgress();

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
            "Your browser blocked the login popup. Please allow popups for SkillSensAI."
          );
        } else if (
          error?.code ===
          "auth/unauthorized-domain"
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

  const formatPhoneNumber =
    (value) => {
      let digits =
        value.replace(
          /\D/g,
          ""
        );

      if (
        digits.startsWith("91")
      ) {
        digits =
          digits.substring(2);
      }

      digits =
        digits.substring(
          0,
          10
        );

      if (!digits) {
        return "";
      }

      return `+91 ${digits}`;
    };


  const handlePhoneChange =
    (event) => {
      const formatted =
        formatPhoneNumber(
          event.target.value
        );

      setPhoneNumber(
        formatted
      );
    };


  /* =========================================================
     PHONE OTP
  ========================================================= */

  const handleSendOtp =
    async () => {
      setLoginError("");

      const digits =
        phoneNumber.replace(
          /\D/g,
          ""
        );

      if (
        digits.length !==
        10
      ) {
        setLoginError(
          "Please enter a valid 10-digit Indian mobile number."
        );

        return;
      }

      setLoading(true);

      try {
        if (
          recaptchaRef.current
        ) {
          try {
            recaptchaRef.current.clear();
          } catch {
            // Ignore.
          }

          recaptchaRef.current =
            null;
        }

        const verifier =
          new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "invisible",
            }
          );

        recaptchaRef.current =
          verifier;

        const fullPhoneNumber =
          `+91${digits}`;

        const result =
          await signInWithPhoneNumber(
            auth,
            fullPhoneNumber,
            verifier
          );

        setConfirmationResult(
          result
        );

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

        if (
          recaptchaRef.current
        ) {
          try {
            recaptchaRef.current.clear();
          } catch {
            // Ignore.
          }

          recaptchaRef.current =
            null;
        }
      } finally {
        setLoading(false);
      }
    };


  /* =========================================================
     VERIFY OTP
  ========================================================= */

  const handleVerifyOtp =
    async () => {
      if (
        !confirmationResult
      ) {
        setLoginError(
          "Please request a new OTP."
        );

        return;
      }

      if (
        otp.length < 6
      ) {
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
        setAccountTab("profile");

        setPhoneStep("phone");
        setOtp("");
        setConfirmationResult(
          null
        );

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

  const handleLogout =
    async () => {
      try {
        await signOut(auth);

        setUser(null);
        setProfileOpen(false);
        setLoginOpen(false);
        setSelectedSkill(null);

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

  const getUserName =
    () => {
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
        return user.email.split(
          "@"
        )[0];
      }

      return "Learner";
    };


  const getUserContact =
    () => {
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


  const getInitial =
    () => {
      const name =
        getUserName();

      if (!name) {
        return "U";
      }

      return name
        .charAt(0)
        .toUpperCase();
    };


  /* =========================================================
     PROFILE IMAGE
  ========================================================= */

  const handleProfileImage =
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) return;

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        return;
      }

      const reader =
        new FileReader();

      reader.onload = () => {
        const image =
          reader.result;

        setProfileImage(
          image
        );

        try {
          localStorage.setItem(
            "skillsensai_profile_image",
            image
          );
        } catch (error) {
          console.error(
            "Could not save profile image:",
            error
          );
        }
      };

      reader.readAsDataURL(file);

      event.target.value = "";
    };


  /* =========================================================
     CHARACTER IMAGE
  ========================================================= */

  const handleCharacterUpload =
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) return;

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        return;
      }

      const reader =
        new FileReader();

      reader.onload = () => {
        const image =
          reader.result;

        setCustomCharacter(
          image
        );

        setSelectedCharacter(
          "custom"
        );

        try {
          localStorage.setItem(
            "skillsensai_custom_character",
            image
          );

          localStorage.setItem(
            "skillsensai_character",
            "custom"
          );
        } catch (error) {
          console.error(
            "Could not save character:",
            error
          );
        }
      };

      reader.readAsDataURL(file);

      event.target.value = "";
    };


  /* =========================================================
     CHARACTER SELECTION
  ========================================================= */

  const handleCharacterSelect =
    (characterId) => {
      setSelectedCharacter(
        characterId
      );

      try {
        localStorage.setItem(
          "skillsensai_character",
          characterId
        );
      } catch (error) {
        console.error(
          "Could not save character:",
          error
        );
      }
    };


  const getCharacterImage =
    () => {
      if (
        selectedCharacter ===
        "custom"
      ) {
        return (
          customCharacter ||
          "/samurai.png"
        );
      }

      const character =
        defaultCharacters.find(
          (item) =>
            item.id ===
            selectedCharacter
        );

      return (
        character?.image ||
        "/samurai.png"
      );
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
     SKILL PROGRESS
  ========================================================= */

  const getSkillProgress =
    (skill) => {
      if (
        skill.name ===
        "Music"
      ) {
        return {
          completed:
            lessonsLearned,
          total:
            skill.lessons,
          percentage:
            skill.lessons > 0
              ? Math.min(
                  100,
                  Math.round(
                    (lessonsLearned /
                      skill.lessons) *
                      100
                  )
                )
              : 0,
        };
      }

      if (
        skill.name ===
        "Martial Arts"
      ) {
        return {
          completed: 0,
          total: skill.lessons,
          percentage: 0,
        };
      }

      return {
        completed: 0,
        total: skill.lessons,
        percentage: 0,
      };
    };


  /* =========================================================
     SKILL NAVIGATION
  ========================================================= */

  const handleSkillClick =
    (skill) => {
      if (!skill.active) {
        return;
      }

      navigate(skill.path);
    };


  /* =========================================================
     BULB

     ONLY CHANGE:
     BULB ON  = DARK
     BULB OFF = LIGHT
  ========================================================= */

  const handleBulbClick =
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      const nextTheme =
        theme === "light"
          ? "dark"
          : "light";

      setTheme(nextTheme);

      /*
        Keep bulb exactly synchronized
        with the selected theme.
      */
      setBulbOn(
        nextTheme === "dark"
      );

      try {
        localStorage.setItem(
          "skillsensai_theme",
          nextTheme
        );
      } catch {
        // Ignore.
      }
    };


  /* =========================================================
     THEME TOGGLE
  ========================================================= */

  const handleThemeToggle =
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      setTheme(
        (current) =>
          current ===
          "light"
            ? "dark"
            : "light"
      );
    };


  /* =========================================================
     OPEN ACCOUNT TAB
  ========================================================= */

  const openAccountTab =
    (tab) => {
      setAccountTab(tab);
      setSelectedSkill(null);
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
                  event.preventDefault();
                  event.stopPropagation();

                  setProfileOpen(
                    (current) =>
                      !current
                  );

                  setSelectedSkill(
                    null
                  );
                }}
              >

                <span className="profile-avatar">

                  {profileImage ||
                  user.photoURL ? (
                    <img
                      src={
                        profileImage ||
                        user.photoURL
                      }
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


              {/* =================================================
                  ACCOUNT PANEL
              ================================================= */}

              {profileOpen && (

                <div className="profile-dropdown account-dropdown">


                  {/* -------------------------------------------
                      ACCOUNT HEADER
                  ------------------------------------------- */}

                  <div className="account-panel-header">

                    <div className="account-header-avatar">

                      {profileImage ||
                      user.photoURL ? (
                        <img
                          src={
                            profileImage ||
                            user.photoURL
                          }
                          alt={getUserName()}
                        />
                      ) : (
                        getInitial()
                      )}

                    </div>


                    <div className="account-header-info">

                      <strong>
                        {getUserName()}
                      </strong>

                      <span>
                        {getUserContact()}
                      </span>

                    </div>

                  </div>


                  {/* -------------------------------------------
                      ACCOUNT TABS
                  ------------------------------------------- */}

                  <div className="account-tabs">

                    <button
                      type="button"
                      className={
                        accountTab ===
                        "profile"
                          ? "account-tab active"
                          : "account-tab"
                      }
                      onClick={() =>
                        openAccountTab(
                          "profile"
                        )
                      }
                    >
                      <User
                        size={16}
                      />

                      <span>
                        Profile
                      </span>
                    </button>


                    <button
                      type="button"
                      className={
                        accountTab ===
                        "skills"
                          ? "account-tab active"
                          : "account-tab"
                      }
                      onClick={() =>
                        openAccountTab(
                          "skills"
                        )
                      }
                    >
                      <Target
                        size={16}
                      />

                      <span>
                        Skills
                      </span>
                    </button>


                    <button
                      type="button"
                      className={
                        accountTab ===
                        "character"
                          ? "account-tab active"
                          : "account-tab"
                      }
                      onClick={() =>
                        openAccountTab(
                          "character"
                        )
                      }
                    >
                      <Award
                        size={16}
                      />

                      <span>
                        Character
                      </span>
                    </button>

                  </div>


                  {/* =================================================
                      PROFILE TAB
                  ================================================= */}

                  {accountTab ===
                    "profile" && (

                    <div className="account-panel-content">

                      <div className="account-profile-photo-section">

                        <div className="large-profile-avatar">

                          {profileImage ||
                          user.photoURL ? (
                            <img
                              src={
                                profileImage ||
                                user.photoURL
                              }
                              alt={getUserName()}
                            />
                          ) : (
                            getInitial()
                          )}

                        </div>


                        <button
                          type="button"
                          className="profile-camera-button"
                          onClick={() =>
                            profileImageInputRef.current?.click()
                          }
                          title="Change profile picture"
                        >
                          <Camera
                            size={16}
                          />
                        </button>


                        <input
                          ref={
                            profileImageInputRef
                          }
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={
                            handleProfileImage
                          }
                        />

                      </div>


                      <div className="account-name-section">

                        <span className="account-label">
                          Your Name
                        </span>

                        <strong>
                          {getUserName()}
                        </strong>

                      </div>


                      <div className="account-contact-section">

                        <span className="account-label">
                          Account
                        </span>

                        <span>
                          {getUserContact() ||
                            "Connected account"}
                        </span>

                      </div>


                      <div className="account-stat-grid">

                        <div className="account-stat">

                          <BookOpen
                            size={18}
                          />

                          <strong>
                            {lessonsLearned}
                          </strong>

                          <span>
                            Lessons
                          </span>

                        </div>


                        <div className="account-stat">

                          <Trophy
                            size={18}
                          />

                          <strong>
                            {lessonPercentage}%
                          </strong>

                          <span>
                            Progress
                          </span>

                        </div>

                      </div>


                      <div className="account-progress-section">

                        <div className="account-progress-heading">

                          <span>
                            Overall Learning
                          </span>

                          <strong>
                            {lessonPercentage}%
                          </strong>

                        </div>


                        <div className="account-progress-bar">

                          <div
                            className="account-progress-fill"
                            style={{
                              width: `${lessonPercentage}%`,
                            }}
                          />

                        </div>

                      </div>


                      <button
                        type="button"
                        className="account-settings-button"
                        onClick={() =>
                          openAccountTab(
                            "character"
                          )
                        }
                      >
                        <Settings
                          size={17}
                        />

                        <span>
                          Customize Character
                        </span>

                      </button>


                      <button
                        type="button"
                        className="logout-button"
                        onClick={
                          handleLogout
                        }
                      >
                        <LogOut
                          size={17}
                        />

                        <span>
                          Logout
                        </span>

                      </button>

                    </div>
                  )}


                  {/* =================================================
                      SKILLS TAB
                  ================================================= */}

                  {accountTab ===
                    "skills" && (

                    <div className="account-panel-content">

                      {!selectedSkill ? (

                        <>

                          <div className="account-section-title">

                            <div>
                              <h3>
                                My Skills
                              </h3>

                              <p>
                                Track everything you are learning.
                              </p>
                            </div>

                          </div>


                          <div className="account-skills-list">

                            {skills
                              .filter(
                                (skill) =>
                                  skill.active
                              )
                              .map(
                                (skill) => {
                                  const Icon =
                                    skill.icon;

                                  const progress =
                                    getSkillProgress(
                                      skill
                                    );

                                  return (

                                    <button
                                      key={
                                        skill.name
                                      }
                                      type="button"
                                      className={`account-skill-card skill-card-${skill.color}`}
                                      onClick={() =>
                                        setSelectedSkill(
                                          skill
                                        )
                                      }
                                    >

                                      <div className="account-skill-icon">
                                        <Icon
                                          size={21}
                                        />
                                      </div>


                                      <div className="account-skill-info">

                                        <div className="account-skill-title-row">

                                          <strong>
                                            {skill.name}
                                          </strong>

                                          <span>
                                            {
                                              progress.percentage
                                            }%
                                          </span>

                                        </div>


                                        <div className="account-skill-progress">

                                          <div
                                            style={{
                                              width: `${progress.percentage}%`,
                                            }}
                                          />

                                        </div>


                                        <small>
                                          {
                                            progress.completed
                                          } /{" "}
                                          {
                                            progress.total
                                          }{" "}
                                          lessons
                                        </small>

                                      </div>


                                      <ChevronDown
                                        size={17}
                                        className="skill-card-arrow"
                                      />

                                    </button>

                                  );
                                }
                              )}

                          </div>


                          <div className="coming-skills-account">

                            <Sparkles
                              size={16}
                            />

                            <span>
                              More skills will appear here as they become available.
                            </span>

                          </div>

                        </>

                      ) : (

                        <>

                          <button
                            type="button"
                            className="account-back-button"
                            onClick={() =>
                              setSelectedSkill(
                                null
                              )
                            }
                          >
                            ← Back to Skills
                          </button>


                          <div className="selected-skill-detail">

                            <div
                              className={`selected-skill-icon skill-${selectedSkill.color}`}
                            >
                              {React.createElement(
                                selectedSkill.icon,
                                {
                                  size: 30,
                                }
                              )}
                            </div>


                            <h3>
                              {selectedSkill.name}
                            </h3>

                            <p>
                              {
                                selectedSkill.description
                              }
                            </p>


                            <div className="selected-skill-stat">

                              <div>

                                <span>
                                  Lessons Completed
                                </span>

                                <strong>
                                  {
                                    getSkillProgress(
                                      selectedSkill
                                    ).completed
                                  }
                                </strong>

                              </div>


                              <div>

                                <span>
                                  Total Lessons
                                </span>

                                <strong>
                                  {
                                    getSkillProgress(
                                      selectedSkill
                                    ).total
                                  }
                                </strong>

                              </div>


                              <div>

                                <span>
                                  Completion
                                </span>

                                <strong>
                                  {
                                    getSkillProgress(
                                      selectedSkill
                                    ).percentage
                                  }%
                                </strong>

                              </div>

                            </div>


                            <div className="selected-skill-progress">

                              <div className="selected-skill-progress-header">

                                <span>
                                  Your Progress
                                </span>

                                <strong>
                                  {
                                    getSkillProgress(
                                      selectedSkill
                                    ).percentage
                                  }%
                                </strong>

                              </div>


                              <div className="selected-skill-progress-bar">

                                <div
                                  style={{
                                    width: `${
                                      getSkillProgress(
                                        selectedSkill
                                      ).percentage
                                    }%`,
                                  }}
                                />

                              </div>

                            </div>


                            <button
                              type="button"
                              className="open-skill-button"
                              onClick={() =>
                                navigate(
                                  selectedSkill.path
                                )
                              }
                            >

                              <span>
                                Continue Learning
                              </span>

                              <ArrowRight
                                size={17}
                              />

                            </button>

                          </div>

                        </>

                      )}

                    </div>
                  )}


                  {/* =================================================
                      CHARACTER TAB
                  ================================================= */}

                  {accountTab ===
                    "character" && (

                    <div className="account-panel-content">

                      <div className="account-section-title">

                        <div>
                          <h3>
                            Change Character
                          </h3>

                          <p>
                            Choose who represents your learning journey.
                          </p>
                        </div>

                      </div>


                      <div className="character-preview-card">

                        <div className="character-preview-glow" />

                        <img
                          src={getCharacterImage()}
                          alt="Selected SkillSensAI character"
                        />

                      </div>


                      <div className="character-grid">

                        {defaultCharacters.map(
                          (character) => (

                            <button
                              type="button"
                              key={
                                character.id
                              }
                              className={`character-option ${
                                selectedCharacter ===
                                character.id
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() =>
                                handleCharacterSelect(
                                  character.id
                                )
                              }
                            >

                              <div className="character-option-image">

                                <img
                                  src={
                                    character.image
                                  }
                                  alt={
                                    character.name
                                  }
                                />

                              </div>


                              <strong>
                                {
                                  character.name
                                }
                              </strong>

                              <span>
                                {
                                  character.description
                                }
                              </span>


                              {selectedCharacter ===
                                character.id && (

                                <div className="character-selected-check">
                                  <Check
                                    size={14}
                                  />
                                </div>

                              )}

                            </button>
                          )
                        )}


                        {customCharacter && (

                          <button
                            type="button"
                            className={`character-option ${
                              selectedCharacter ===
                              "custom"
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              handleCharacterSelect(
                                "custom"
                              )
                            }
                          >

                            <div className="character-option-image">

                              <img
                                src={
                                  customCharacter
                                }
                                alt="Custom character"
                              />

                            </div>

                            <strong>
                              My Character
                            </strong>

                            <span>
                              Your uploaded character
                            </span>


                            {selectedCharacter ===
                              "custom" && (

                              <div className="character-selected-check">
                                <Check
                                  size={14}
                                />
                              </div>

                            )}

                          </button>

                        )}

                      </div>


                      <button
                        type="button"
                        className="upload-character-button"
                        onClick={() =>
                          characterImageInputRef.current?.click()
                        }
                      >

                        <Upload
                          size={18}
                        />

                        <span>
                          Upload Character
                        </span>

                      </button>


                      <input
                        ref={
                          characterImageInputRef
                        }
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={
                          handleCharacterUpload
                        }
                      />


                      <div className="character-info-note">

                        <Sparkles
                          size={16}
                        />

                        <span>
                          Your selected character will appear on the Home screen.
                        </span>

                      </div>

                    </div>
                  )}


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
            onClick={
              handleBulbClick
            }
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
                <Lightbulb
                  size={20}
                />
              ) : (
                <LightbulbOff
                  size={20}
                />
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


            {/* SOFA */}

            <div className="room-sofa">

              <div className="sofa-back" />

              <div className="sofa-seat" />

              <div className="sofa-arm sofa-arm-left" />

              <div className="sofa-arm sofa-arm-right" />

              <div className="sofa-leg sofa-leg-left" />

              <div className="sofa-leg sofa-leg-right" />

            </div>


            {/* RUG */}

            <div className="room-rug">
              <div className="rug-pattern" />
            </div>


            {/* PLANT */}

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


            {/* CHARACTER SHADOW */}

            <div className="character-shadow" />


            {/* CHARACTER */}

            <div className="samurai-container">

              <img
                src={getCharacterImage()}
                alt="SkillSensAI character"
                className="samurai-image"
              />

            </div>


            {/* SKILLS ORBIT */}

            <div className="skills-orbit">

              {skills.map(
                (skill, index) => {

                  const Icon =
                    skill.icon;

                  return (
                    <button
                      key={
                        skill.name
                      }
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


              <div className="flow-card flow-learn">

                <div className="flow-card-icon">
                  <BookOpen
                    size={25}
                  />
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


              <ArrowRight
                className="flow-arrow"
                size={24}
              />


              <div className="flow-card flow-practice">

                <div className="flow-card-icon">
                  <Target
                    size={25}
                  />
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


              <ArrowRight
                className="flow-arrow"
                size={24}
              />


              <div className="flow-card flow-master">

                <div className="flow-card-icon">
                  <Trophy
                    size={25}
                  />
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


            <div className="home-bottom-note">

              <ShieldCheck
                size={17}
              />

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


              <button
                type="button"
                className="login-close"
                onClick={
                  closeLogin
                }
                aria-label="Close login"
                disabled={
                  loading
                }
              >
                <X size={20} />
              </button>


              <div className="login-modal-icon">
                <User size={27} />
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

                    if (loading)
                      return;

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
                    loginMethod ===
                    "phone"
                      ? "login-tab-active"
                      : ""
                  }
                  onClick={() => {

                    if (loading)
                      return;

                    setLoginMethod(
                      "phone"
                    );

                    setLoginError("");

                  }}
                >
                  Phone
                </button>

              </div>


              {loginMethod ===
                "google" && (

                <div className="login-method-content">

                  <button
                    type="button"
                    className="google-login-button"
                    onClick={
                      handleGoogleLogin
                    }
                    disabled={
                      loading
                    }
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


              {loginMethod ===
                "phone" && (

                <div className="login-method-content">

                  {phoneStep ===
                  "phone" ? (
                    <>

                      <label
                        className="login-input-label"
                        htmlFor="phone-number"
                      >
                        Mobile Number
                      </label>


                      <div className="login-phone-input">

                        <Phone
                          size={18}
                        />

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
                          maxLength={
                            14
                          }
                          disabled={
                            loading
                          }
                        />

                      </div>


                      <button
                        type="button"
                        className="phone-login-button"
                        onClick={
                          handleSendOtp
                        }
                        disabled={
                          loading
                        }
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
                          maxLength={
                            6
                          }
                          disabled={
                            loading
                          }
                        />

                      </div>


                      <button
                        type="button"
                        className="phone-login-button"
                        onClick={
                          handleVerifyOtp
                        }
                        disabled={
                          loading
                        }
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

                          if (loading)
                            return;

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


              {loginError && (
                <div className="login-error">
                  {loginError}
                </div>
              )}

            </div>

          </div>
        )}

      </div>

      <AIChat />

    </div>
  );
}
