import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Music,
  Swords,
  Video,
  Palette,
  Code2,
  Sparkles,
  Lightbulb,
  LogOut,
  ChevronDown,
  ChevronRight,
  Camera,
  Upload,
  Check,
  Settings,
  Award,
  User,
  BookOpen,
} from "lucide-react";

import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase";
import { getLessonsLearned } from "../utils/progress";

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
    color: "music",
    active: true,
    route: "/music",
  },
  {
    id: "martial",
    name: "Martial Arts",
    icon: Swords,
    color: "martial",
    active: true,
    route: "/martial-arts",
  },
  {
    id: "dance",
    name: "Dance",
    icon: Video,
    color: "dance",
    active: false,
  },
  {
    id: "art",
    name: "Art & Creativity",
    icon: Palette,
    color: "art",
    active: false,
  },
  {
    id: "coding",
    name: "Coding",
    icon: Code2,
    color: "coding",
    active: false,
  },
  {
    id: "more",
    name: "More Skills",
    icon: Sparkles,
    color: "more",
    active: false,
  },
];

const TOTAL_LESSONS = 15;


/* =========================================================
   BUILT-IN CHARACTERS
   ========================================================= */

const defaultCharacters = [
  {
    id: "samurai",
    name: "Samurai",
    image: "/samurai.png",
    description: "Your original SkillSensAI warrior.",
  },
  {
    id: "singer",
    name: "Singer",
    image: "/samurai.png",
    description: "Music character — image can be replaced later.",
  },
  {
    id: "fighter",
    name: "Fighter",
    image: "/samurai.png",
    description: "Martial Arts character — image can be replaced later.",
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

  /*
    IMPORTANT:

    bulbOn is directly connected to theme.

    DARK  = BULB ON
    LIGHT = BULB OFF
  */
  const [bulbOn, setBulbOn] = useState(() => {
    try {
      return localStorage.getItem("skillsensai_theme") === "dark";
    } catch {
      return false;
    }
  });


  /* -------------------------------------------------------
     AUTH
     ------------------------------------------------------- */

  const [user, setUser] = useState(null);

  const [loginOpen, setLoginOpen] = useState(false);
  const [loginMethod, setLoginMethod] = useState("google");

  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");

  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneStep, setPhoneStep] = useState("phone");

  const recaptchaRef = useRef(null);


  /* -------------------------------------------------------
     ACCOUNT
     ------------------------------------------------------- */

  const [profileOpen, setProfileOpen] = useState(false);

  const [accountTab, setAccountTab] = useState("profile");

  const [profileImage, setProfileImage] = useState(() => {
    try {
      return localStorage.getItem("skillsensai_profile_image") || "";
    } catch {
      return "";
    }
  });

  const [selectedCharacter, setSelectedCharacter] = useState(() => {
    try {
      return localStorage.getItem("skillsensai_character") || "samurai";
    } catch {
      return "samurai";
    }
  });

  const [customCharacter, setCustomCharacter] = useState(() => {
    try {
      return (
        localStorage.getItem("skillsensai_custom_character") || ""
      );
    } catch {
      return "";
    }
  });

  const [selectedSkill, setSelectedSkill] = useState(null);

  const profileInputRef = useRef(null);
  const characterInputRef = useRef(null);

  const [lessonsLearned, setLessonsLearned] = useState(0);


  /* =========================================================
     THEME EFFECT
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

    /*
      Keep bulb synchronized with theme.
    */
    setBulbOn(theme === "dark");
  }, [theme]);


  /* =========================================================
     LOAD AUTH USER
     ========================================================= */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);


  /* =========================================================
     LOAD PROGRESS
     ========================================================= */

  useEffect(() => {
    loadProgress();
  }, [user]);

  async function loadProgress() {
    try {
      const count = await getLessonsLearned();
      setLessonsLearned(Number(count) || 0);
    } catch {
      setLessonsLearned(0);
    }
  }


  /* =========================================================
     CLOSE PROFILE WHEN CLICKING OUTSIDE
     ========================================================= */

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileOpen &&
        !event.target.closest(".profile-area")
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [profileOpen]);


  /* =========================================================
     GOOGLE LOGIN
     ========================================================= */

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLoginError("");

    try {
      const provider = new GoogleAuthProvider();

      await signInWithPopup(auth, provider);

      setLoginOpen(false);
      setPhoneStep("phone");
      setOtp("");
      setConfirmationResult(null);
    } catch (error) {
      console.error(error);

      setLoginError(
        error?.message ||
          "Google login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  /* =========================================================
     PHONE LOGIN
     ========================================================= */

  const setupRecaptcha = () => {
    if (recaptchaRef.current) {
      return recaptchaRef.current;
    }

    try {
      recaptchaRef.current =
        new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
          }
        );

      return recaptchaRef.current;
    } catch (error) {
      console.error(error);
      return null;
    }
  };


  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      setLoginError("Please enter your phone number.");
      return;
    }

    setLoading(true);
    setLoginError("");

    try {
      const formattedNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+91${phoneNumber.replace(/\D/g, "")}`;

      const appVerifier = setupRecaptcha();

      if (!appVerifier) {
        throw new Error(
          "Unable to initialize phone verification."
        );
      }

      const result = await signInWithPhoneNumber(
        auth,
        formattedNumber,
        appVerifier
      );

      setConfirmationResult(result);
      setPhoneStep("otp");
    } catch (error) {
      console.error(error);

      setLoginError(
        error?.message ||
          "Unable to send OTP."
      );
    } finally {
      setLoading(false);
    }
  };


  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setLoginError("Please enter the OTP.");
      return;
    }

    if (!confirmationResult) {
      setLoginError(
        "Please request an OTP first."
      );
      return;
    }

    setLoading(true);
    setLoginError("");

    try {
      await confirmationResult.confirm(otp);

      setLoginOpen(false);
      setPhoneStep("phone");
      setOtp("");
      setConfirmationResult(null);
    } catch (error) {
      console.error(error);

      setLoginError(
        error?.message ||
          "Invalid OTP."
      );
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

      setProfileOpen(false);
      setSelectedSkill(null);
    } catch (error) {
      console.error(error);
    }
  };


  /* =========================================================
     USER DETAILS
     ========================================================= */

  const getUserName = () => {
    if (!user) return "Guest";

    return (
      user.displayName ||
      user.phoneNumber ||
      "SkillSensAI User"
    );
  };


  const getUserContact = () => {
    if (!user) return "";

    return (
      user.email ||
      user.phoneNumber ||
      ""
    );
  };


  const getUserInitial = () => {
    const name = getUserName();

    return name
      .charAt(0)
      .toUpperCase();
  };


  /* =========================================================
     PROGRESS
     ========================================================= */

  const lessonPercentage = Math.min(
    100,
    Math.round(
      (lessonsLearned / TOTAL_LESSONS) * 100
    )
  );


  /* =========================================================
     SKILL PROGRESS
     ========================================================= */

  const getSkillProgress = (skillId) => {
    if (skillId === "music") {
      return Math.min(
        100,
        Math.round(
          (lessonsLearned / TOTAL_LESSONS) * 100
        )
      );
    }

    if (skillId === "martial") {
      return 0;
    }

    return 0;
  };


  /* =========================================================
     NAVIGATION
     ========================================================= */

  const handleSkillClick = (skill) => {
    if (!skill.active) return;

    navigate(skill.route);
  };


  /* =========================================================
     BULB / THEME

     ON  -> DARK
     OFF -> LIGHT
     ========================================================= */

  const handleBulbClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const nextTheme =
      theme === "light"
        ? "dark"
        : "light";

    setTheme(nextTheme);

    /*
      Immediately synchronize bulb.
    */
    setBulbOn(nextTheme === "dark");

    try {
      localStorage.setItem(
        "skillsensai_theme",
        nextTheme
      );
    } catch {
      // Ignore localStorage errors.
    }
  };


  /* =========================================================
     PROFILE IMAGE UPLOAD
     ========================================================= */

  const handleProfileImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = reader.result;

      setProfileImage(image);

      try {
        localStorage.setItem(
          "skillsensai_profile_image",
          image
        );
      } catch {
        // Ignore localStorage errors.
      }
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };


  /* =========================================================
     CHARACTER IMAGE
     ========================================================= */

  const getCharacterImage = () => {
    if (customCharacter) {
      return customCharacter;
    }

    const character = defaultCharacters.find(
      (item) => item.id === selectedCharacter
    );

    return character?.image || "/samurai.png";
  };


  /* =========================================================
     SELECT CHARACTER
     ========================================================= */

  const handleCharacterSelect = (characterId) => {
    setSelectedCharacter(characterId);

    /*
      Selecting a built-in character removes the
      custom uploaded character from active use.
    */
    setCustomCharacter("");

    try {
      localStorage.setItem(
        "skillsensai_character",
        characterId
      );

      localStorage.removeItem(
        "skillsensai_custom_character"
      );
    } catch {
      // Ignore localStorage errors.
    }
  };


  /* =========================================================
     CUSTOM CHARACTER UPLOAD
     ========================================================= */

  const handleCharacterUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = reader.result;

      setCustomCharacter(image);

      try {
        localStorage.setItem(
          "skillsensai_custom_character",
          image
        );
      } catch {
        // Ignore localStorage errors.
      }
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };


  /* =========================================================
     OPEN ACCOUNT
     ========================================================= */

  const openAccount = () => {
    if (!user) {
      setLoginOpen(true);
      return;
    }

    setProfileOpen((previous) => !previous);
  };


  /* =========================================================
     CHARACTER
     ========================================================= */

  const activeCharacter =
    defaultCharacters.find(
      (item) => item.id === selectedCharacter
    );


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

      {/* =====================================================
          ROOM BACKGROUND
          ===================================================== */}

      <div className="room-background">

        <div className="room-wall" />
        <div className="room-floor" />
        <div className="room-corner-glow" />


        {/* =================================================
            CEILING
            ================================================= */}

        <div className="ceiling">

          {/* Fan intentionally hidden by Home.css */}

        </div>


        {/* =================================================
            LIGHT BULB
            ================================================= */}

        <div
          className={`hanging-bulb ${
            bulbOn
              ? "bulb-on"
              : "bulb-off"
          }`}
          onClick={handleBulbClick}
          role="button"
          tabIndex={0}
          title={
            bulbOn
              ? "Turn off light — Light theme"
              : "Turn on light — Dark theme"
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              handleBulbClick(event);
            }
          }}
        >
          <div className="bulb-wire" />

          <div className="bulb-button">
            <Lightbulb size={26} />

            <div className="bulb-glass" />
          </div>
        </div>


        {/* =================================================
            LOGIN / PROFILE
            ================================================= */}

        <div className="room-login">

          {!user ? (
            <button
              className="login-button"
              onClick={() => {
                setLoginError("");
                setLoginOpen(true);
              }}
            >
              Login
            </button>
          ) : (
            <div className="profile-area">

              <button
                className="profile-button"
                onClick={openAccount}
              >

                <div className="profile-avatar">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                    />
                  ) : (
                    getUserInitial()
                  )}
                </div>

                <span className="profile-name">
                  {getUserName()}
                </span>

                <ChevronDown
                  size={17}
                  className={
                    profileOpen
                      ? "profile-chevron-open"
                      : ""
                  }
                />

              </button>


              {/* =================================================
                  ACCOUNT DROPDOWN
                  ================================================= */}

              {profileOpen && (
                <div className="account-dropdown">

                  {/* HEADER */}

                  <div className="account-header">

                    <div className="account-header-avatar">

                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                        />
                      ) : (
                        getUserInitial()
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


                  {/* TABS */}

                  <div className="account-tabs">

                    <button
                      className={
                        accountTab === "profile"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setAccountTab("profile")
                      }
                    >
                      <User size={16} />
                      Profile
                    </button>

                    <button
                      className={
                        accountTab === "skills"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setAccountTab("skills")
                      }
                    >
                      <Award size={16} />
                      Skills
                    </button>

                    <button
                      className={
                        accountTab === "character"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setAccountTab("character")
                      }
                    >
                      <Sparkles size={16} />
                      Character
                    </button>

                  </div>


                  {/* =================================================
                      PROFILE TAB
                      ================================================= */}

                  {accountTab === "profile" && (
                    <div className="account-content">

                      <div className="profile-main-card">

                        <div className="large-profile-avatar-wrapper">

                          <div className="large-profile-avatar">

                            {profileImage ? (
                              <img
                                src={profileImage}
                                alt="Profile"
                              />
                            ) : (
                              getUserInitial()
                            )}

                          </div>


                          <button
                            className="profile-camera-button"
                            title="Change profile picture"
                            onClick={() =>
                              profileInputRef.current?.click()
                            }
                          >
                            <Camera size={16} />
                          </button>

                        </div>


                        <h3>
                          {getUserName()}
                        </h3>

                        <p>
                          {getUserContact()}
                        </p>


                        <input
                          ref={profileInputRef}
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={
                            handleProfileImageUpload
                          }
                        />

                      </div>


                      {/* STATS */}

                      <div className="account-stats">

                        <div className="account-stat">

                          <strong>
                            {lessonsLearned}
                          </strong>

                          <span>
                            Lessons
                          </span>

                        </div>


                        <div className="account-stat">

                          <strong>
                            2
                          </strong>

                          <span>
                            Skills
                          </span>

                        </div>


                        <div className="account-stat">

                          <strong>
                            {lessonPercentage}%
                          </strong>

                          <span>
                            Progress
                          </span>

                        </div>

                      </div>


                      {/* PROGRESS */}

                      <div className="account-progress">

                        <div className="account-progress-top">

                          <span>
                            Overall Learning Progress
                          </span>

                          <strong>
                            {lessonPercentage}%
                          </strong>

                        </div>

                        <div className="account-progress-bar">

                          <div
                            style={{
                              width: `${lessonPercentage}%`,
                            }}
                          />

                        </div>

                      </div>


                      {/* CHARACTER BUTTON */}

                      <button
                        className="account-action-button"
                        onClick={() =>
                          setAccountTab("character")
                        }
                      >

                        <Settings size={17} />

                        Customize Character

                        <ChevronRight
                          size={17}
                        />

                      </button>


                      {/* LOGOUT */}

                      <button
                        className="logout-button"
                        onClick={handleLogout}
                      >

                        <LogOut size={17} />

                        Logout

                      </button>

                    </div>
                  )}


                  {/* =================================================
                      SKILLS TAB
                      ================================================= */}

                  {accountTab === "skills" && (
                    <div className="account-content">

                      {!selectedSkill ? (
                        <>
                          <div className="account-section-title">

                            <div>
                              <h3>
                                My Skills
                              </h3>

                              <p>
                                Skills you are currently learning
                              </p>
                            </div>

                          </div>


                          <div className="account-skills-list">

                            {skills
                              .filter(
                                (skill) =>
                                  skill.active
                              )
                              .map((skill) => {

                                const Icon =
                                  skill.icon;

                                const progress =
                                  getSkillProgress(
                                    skill.id
                                  );

                                return (
                                  <button
                                    key={skill.id}
                                    className={`account-skill-card ${skill.color}`}
                                    onClick={() =>
                                      setSelectedSkill(
                                        skill.id
                                      )
                                    }
                                  >

                                    <div className="account-skill-icon">

                                      <Icon
                                        size={22}
                                      />

                                    </div>


                                    <div className="account-skill-info">

                                      <strong>
                                        {skill.name}
                                      </strong>

                                      <span>
                                        {progress}% complete
                                      </span>

                                      <div className="account-skill-progress">

                                        <div
                                          style={{
                                            width: `${progress}%`,
                                          }}
                                        />

                                      </div>

                                    </div>


                                    <ChevronRight
                                      size={18}
                                    />

                                  </button>
                                );
                              })}

                          </div>


                          <div className="account-skills-note">

                            <BookOpen size={17} />

                            <span>
                              More skills will be available soon.
                            </span>

                          </div>
                        </>
                      ) : (
                        (() => {

                          const skill =
                            skills.find(
                              (item) =>
                                item.id ===
                                selectedSkill
                            );

                          const progress =
                            getSkillProgress(
                              selectedSkill
                            );

                          const Icon =
                            skill?.icon ||
                            Sparkles;

                          return (
                            <div className="skill-detail">

                              <button
                                className="account-back-button"
                                onClick={() =>
                                  setSelectedSkill(
                                    null
                                  )
                                }
                              >
                                ← Back to Skills
                              </button>


                              <div className="skill-detail-icon">

                                <Icon size={30} />

                              </div>


                              <h3>
                                {skill?.name}
                              </h3>

                              <p>
                                Your learning progress
                              </p>


                              <div className="skill-detail-progress">

                                <div className="skill-detail-progress-top">

                                  <span>
                                    Progress
                                  </span>

                                  <strong>
                                    {progress}%
                                  </strong>

                                </div>


                                <div className="account-progress-bar">

                                  <div
                                    style={{
                                      width: `${progress}%`,
                                    }}
                                  />

                                </div>

                              </div>


                              <button
                                className="skill-continue-button"
                                onClick={() =>
                                  navigate(
                                    skill.route
                                  )
                                }
                              >

                                Continue Learning

                                <ChevronRight
                                  size={18}
                                />

                              </button>

                            </div>
                          );

                        })()
                      )}

                    </div>
                  )}


                  {/* =================================================
                      CHARACTER TAB
                      ================================================= */}

                  {accountTab === "character" && (
                    <div className="account-content">

                      <div className="account-section-title">

                        <div>

                          <h3>
                            Change Character
                          </h3>

                          <p>
                            Choose how your learner appears
                          </p>

                        </div>

                      </div>


                      {/* PREVIEW */}

                      <div className="character-preview">

                        <img
                          src={getCharacterImage()}
                          alt="Selected character"
                        />

                      </div>


                      {/* CHARACTER GRID */}

                      <div className="character-grid">

                        {defaultCharacters.map(
                          (character) => {

                            const isSelected =
                              !customCharacter &&
                              selectedCharacter ===
                                character.id;

                            return (
                              <button
                                key={character.id}
                                className={`character-option ${
                                  isSelected
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

                                  {isSelected && (
                                    <span className="character-check">
                                      <Check
                                        size={15}
                                      />
                                    </span>
                                  )}

                                </div>


                                <strong>
                                  {character.name}
                                </strong>

                                <span>
                                  {character.description}
                                </span>

                              </button>
                            );
                          }
                        )}

                      </div>


                      {/* CUSTOM CHARACTER */}

                      <button
                        className={`character-upload-button ${
                          customCharacter
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          characterInputRef.current?.click()
                        }
                      >

                        <Upload size={18} />

                        <div>

                          <strong>
                            Upload Your Character
                          </strong>

                          <span>
                            PNG or JPG image
                          </span>

                        </div>

                      </button>


                      <input
                        ref={characterInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={
                          handleCharacterUpload
                        }
                      />

                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>


        {/* =====================================================
            MAIN HOME CONTENT
            ===================================================== */}

        <main className="home-content">

          {/* =================================================
              SKILLS ROOM
              ================================================= */}

          <section className="skills-room">

            {/* SOFA */}

            <div className="room-sofa">

              <div className="sofa-back" />
              <div className="sofa-seat" />

              <div className="sofa-arm left" />
              <div className="sofa-arm right" />

              <div className="sofa-leg left" />
              <div className="sofa-leg right" />

            </div>


            {/* RUG */}

            <div className="room-rug" />


            {/* PLANT */}

            <div className="room-plant">

              <div className="plant-pot" />

              <div className="plant-stem stem-one" />
              <div className="plant-stem stem-two" />
              <div className="plant-stem stem-three" />

              <div className="plant-leaf plant-leaf-1" />
              <div className="plant-leaf plant-leaf-2" />
              <div className="plant-leaf plant-leaf-3" />
              <div className="plant-leaf plant-leaf-4" />
              <div className="plant-leaf plant-leaf-5" />
              <div className="plant-leaf plant-leaf-6" />

            </div>


            {/* CHARACTER */}

            <div className="character-shadow" />

            <div className="samurai-container">

              <div className="samurai-aura" />

              <img
                className="samurai-image"
                src={getCharacterImage()}
                alt="SkillSensAI character"
              />

            </div>


            {/* =================================================
                SKILL ORBIT
                ================================================= */}

            <div className="skills-orbit">

              {skills.map((skill, index) => {

                const Icon = skill.icon;

                return (
                  <button
                    key={skill.id}
                    className={`skill-circle skill-${index + 1} ${skill.color} ${
                      skill.active
                        ? "skill-active"
                        : "skill-inactive"
                    }`}
                    onClick={() =>
                      handleSkillClick(skill)
                    }
                    disabled={!skill.active}
                  >

                    <Icon size={25} />

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

              })}

            </div>

          </section>


          {/* =================================================
              INTRO
              ================================================= */}

          <section className="home-intro">

            <div className="home-eyebrow">
              AI-POWERED SKILL LEARNING
            </div>

            <h1>
              Learn skills.
              <span> Build mastery.</span>
            </h1>

            <p>
              Learn at your own pace with AI-powered
              guidance, expert knowledge and practical
              experience.
            </p>

          </section>


          {/* =================================================
              LEARNING FLOW
              ================================================= */}

          <section className="learning-flow">

            <div className="flow-card flow-learn">

              <div className="flow-icon">
                <BookOpen size={24} />
              </div>

              <div>

                <span>
                  STEP 01
                </span>

                <h3>
                  Learn
                </h3>

                <p>
                  Understand the fundamentals through
                  structured lessons.
                </p>

              </div>

            </div>


            <div className="flow-arrow">
              <ChevronRight size={24} />
            </div>


            <div className="flow-card flow-practice">

              <div className="flow-icon">
                <Video size={24} />
              </div>

              <div>

                <span>
                  STEP 02
                </span>

                <h3>
                  Practice
                </h3>

                <p>
                  Apply what you learn through
                  real-world practice.
                </p>

              </div>

            </div>


            <div className="flow-arrow">
              <ChevronRight size={24} />
            </div>


            <div className="flow-card flow-master">

              <div className="flow-icon">
                <Award size={24} />
              </div>

              <div>

                <span>
                  STEP 03
                </span>

                <h3>
                  Master
                </h3>

                <p>
                  Get AI feedback and continuously
                  improve your skills.
                </p>

              </div>

            </div>


            <div className="learning-flow-note">

              <Sparkles size={16} />

              <span>
                Learn → Practice → Get AI Feedback → Master
              </span>

            </div>

          </section>

        </main>

      </div>


      {/* =====================================================
          LOGIN MODAL
          ===================================================== */}

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
              className="login-close"
              onClick={() =>
                setLoginOpen(false)
              }
            >
              ×
            </button>


            <div className="login-header">

              <div className="login-logo">
                <Sparkles size={25} />
              </div>

              <h2>
                Welcome to SkillSensAI
              </h2>

              <p>
                Sign in and start learning.
              </p>

            </div>


            {/* METHOD TABS */}

            <div className="login-method-tabs">

              <button
                className={
                  loginMethod === "google"
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setLoginMethod("google");
                  setLoginError("");
                }}
              >
                Google
              </button>

              <button
                className={
                  loginMethod === "phone"
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setLoginMethod("phone");
                  setLoginError("");
                }}
              >
                Phone
              </button>

            </div>


            {/* GOOGLE */}

            {loginMethod === "google" && (
              <div className="login-method-content">

                <button
                  className="google-login-button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >

                  <span className="google-logo">
                    G
                  </span>

                  {loading
                    ? "Signing in..."
                    : "Continue with Google"}

                </button>

              </div>
            )}


            {/* PHONE */}

            {loginMethod === "phone" && (
              <div className="login-method-content">

                {phoneStep === "phone" ? (
                  <>
                    <label>
                      Phone Number
                    </label>

                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={phoneNumber}
                      onChange={(event) =>
                        setPhoneNumber(
                          event.target.value
                        )
                      }
                    />

                    <button
                      className="phone-login-button"
                      onClick={handleSendOtp}
                      disabled={loading}
                    >
                      {loading
                        ? "Sending OTP..."
                        : "Send OTP"}
                    </button>
                  </>
                ) : (
                  <>
                    <label>
                      Enter OTP
                    </label>

                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(event) =>
                        setOtp(
                          event.target.value
                            .replace(/\D/g, "")
                        )
                      }
                    />

                    <button
                      className="phone-login-button"
                      onClick={handleVerifyOtp}
                      disabled={loading}
                    >
                      {loading
                        ? "Verifying..."
                        : "Verify OTP"}
                    </button>

                    <button
                      className="back-to-phone"
                      onClick={() => {
                        setPhoneStep("phone");
                        setOtp("");
                        setLoginError("");
                      }}
                    >
                      Change phone number
                    </button>
                  </>
                )}

                <div
                  id="recaptcha-container"
                />

              </div>
            )}


            {/* ERROR */}

            {loginError && (
              <div className="login-error">
                {loginError}
              </div>
            )}


            <div className="login-footer">
              By continuing, you agree to use
              SkillSensAI responsibly.
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
