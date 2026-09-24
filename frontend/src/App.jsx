```jsx
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate
} from "react-router-dom";

import Music from "./pages/Music";
import MartialArts from "./pages/MartialArts";
import Boxing from "./pages/Boxing";
import Karate from "./pages/Karate";

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
  BarChart3
} from "lucide-react";

import "./App.css";


/* =================================================
   AVAILABLE SKILLS
================================================= */

const skills = [
  {
    name: "Music",
    description: "Learn, Sing & Play",
    icon: Music2,
    color: "#ff2d91",
    position: "music",
    active: true
  },

  {
    name: "Martial Arts",
    description: "Boxing & Karate",
    icon: Swords,
    color: "#ff6b18",
    position: "martial",
    active: true
  },

  {
    name: "Dance",
    description: "Express, Move & Inspire",
    icon: PersonStanding,
    color: "#b84cff",
    position: "dance",
    active: false
  },

  {
    name: "Instruments",
    description: "Play Your Passion",
    icon: Guitar,
    color: "#ffc928",
    position: "instruments",
    active: false
  },

  {
    name: "Yoga",
    description: "Balance Body & Soul",
    icon: Flower2,
    color: "#72e51d",
    position: "yoga",
    active: false
  },

  {
    name: "Coding",
    description: "Build, Code & Innovate",
    icon: Code2,
    color: "#00cfff",
    position: "coding",
    active: false
  },

  {
    name: "Art & Creativity",
    description: "Draw, Paint & Create",
    icon: Palette,
    color: "#9d4dff",
    position: "art",
    active: false
  },

  {
    name: "More Skills",
    description: "Coming Soon",
    icon: Sparkles,
    color: "#3caeff",
    position: "more",
    active: false
  }
];


/* =================================================
   HOME PAGE
================================================= */

function Home() {

  const navigate = useNavigate();


  /* -----------------------------------------------
     HANDLE SKILL CLICK
  ------------------------------------------------ */

  const handleSkillClick = (skill) => {

    /*
      Any skill which is not currently developed
      will show Coming Soon.
    */

    if (!skill.active) {

      alert(
        `${skill.name} will be available soon!`
      );

      return;
    }


    /* MUSIC */

    if (skill.name === "Music") {

      navigate("/music");

      return;
    }


    /* MARTIAL ARTS */

    if (skill.name === "Martial Arts") {

      navigate("/martial-arts");

      return;
    }

  };


  return (

    <div className="app">


      {/* =========================================
          NAVBAR
      ========================================= */}

      <header className="navbar">

        <div className="brand">

          <div className="brand-logo">
            S
          </div>

          <div>

            <h1>
              SkillSens<span>AI</span>
            </h1>

            <p>
              Learn. Train. Master.
            </p>

          </div>

        </div>


        <nav>

          <a className="active-link">
            Home
          </a>

          <a>
            Progress
          </a>

          <a>
            AI Coach
          </a>

          <a>
            Leaderboard
          </a>

          <a>
            About Us
          </a>

        </nav>


        <button className="login-button">

          <UserRound size={18} />

          Login

        </button>

      </header>


      {/* =========================================
          HERO
      ========================================= */}

      <main className="hero">

        <div className="skill-orbit">


          {/* ORBIT */}

          <div className="orbit-ring"></div>


          {/* GLOWING DOTS */}

          <div className="orbit-dot dot-1"></div>

          <div className="orbit-dot dot-2"></div>

          <div className="orbit-dot dot-3"></div>

          <div className="orbit-dot dot-4"></div>


          {/* SAMURAI */}

          <div className="samurai-container">

            <div className="samurai-glow"></div>

            <img
              src="/samurai.png"
              alt="SkillSensAI Samurai"
              className="samurai"
            />

          </div>


          {/* SKILLS */}

          {skills.map((skill) => {

            const Icon = skill.icon;

            return (

              <button
                key={skill.name}
                className={`skill-button ${
                  skill.position
                } ${
                  !skill.active
                    ? "coming-soon-skill"
                    : ""
                }`}
                style={{
                  "--skill-color":
                    skill.color
                }}
                onClick={() =>
                  handleSkillClick(skill)
                }
              >

                <div className="skill-icon">

                  <Icon
                    size={34}
                    strokeWidth={1.8}
                  />

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


        {/* =========================================
            HERO TEXT
        ========================================= */}

        <section className="hero-text">

          <h2>

            Unleash Your{" "}

            <span>
              Potential
            </span>

          </h2>


          <p>

            AI-powered learning.
            Personalized for you.

          </p>


          <button
            className="journey-button"
            onClick={() =>
              navigate("/martial-arts")
            }
          >

            Start Your Journey

            <ArrowRight size={21} />

          </button>

        </section>


        {/* =========================================
            STATS
        ========================================= */}

        <section className="stats">


          <div className="stat">

            <div className="stat-icon orange">
              <Flame />
            </div>

            <div>

              <small>
                Daily Streak
              </small>

              <strong>
                7 Days
              </strong>

              <p>
                Keep it up!
              </p>

            </div>

          </div>


          <div className="stat">

            <div className="stat-icon blue">
              <BarChart3 />
            </div>

            <div>

              <small>
                Skills Explored
              </small>

              <strong>
                2
              </strong>

              <p>
                Keep exploring!
              </p>

            </div>

          </div>


          <div className="stat">

            <div className="stat-icon yellow">
              <Trophy />
            </div>

            <div>

              <small>
                Lessons Completed
              </small>

              <strong>
                24
              </strong>

              <p>
                You're doing great!
              </p>

            </div>

          </div>


          <div className="stat">

            <div className="stat-icon green">
              <Target />
            </div>

            <div>

              <small>
                Accuracy
              </small>

              <strong>
                92%
              </strong>

              <p>
                Excellent!
              </p>

            </div>

          </div>


        </section>

      </main>

    </div>

  );

}


/* =================================================
   MAIN APPLICATION
================================================= */

function App() {

  return (

    <BrowserRouter>

      <Routes>


        {/* HOME */}

        <Route
          path="/"
          element={<Home />}
        />


        {/* MUSIC */}

        <Route
          path="/music"
          element={<Music />}
        />


        {/* MARTIAL ARTS */}

        <Route
          path="/martial-arts"
          element={<MartialArts />}
        />


        {/* BOXING */}

        <Route
          path="/martial-arts/boxing"
          element={<Boxing />}
        />


        {/* KARATE */}

        <Route
          path="/martial-arts/karate"
          element={<Karate />}
        />


      </Routes>

    </BrowserRouter>

  );

}


export default App;
```
