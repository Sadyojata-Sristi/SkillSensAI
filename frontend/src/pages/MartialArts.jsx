import {
  ArrowLeft,
  Swords,
  Shield,
  Zap,
  Target,
  CircleDot,
  Footprints,
  Flame,
  Trophy,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "./MartialArts.css";

function MartialArts() {
  const navigate = useNavigate();

  const martialArts = [
    {
      name: "Boxing",
      description:
        "Learn punches, footwork, defence and combinations.",
      icon: Swords,
      color: "boxing",
      active: true,
    },
    {
      name: "Karate",
      description:
        "Learn strikes, blocks, kicks and traditional stances.",
      icon: Shield,
      color: "karate",
      active: true,
    },
    {
      name: "Kung Fu",
      description:
        "Explore traditional movements, forms and techniques.",
      icon: Zap,
      color: "kungfu",
      active: false,
    },
    {
      name: "Kickboxing",
      description:
        "Combine powerful punches with effective kicking techniques.",
      icon: Target,
      color: "kickboxing",
      active: false,
    },
    {
      name: "Muay Thai",
      description:
        "Learn striking techniques using hands, elbows, knees and legs.",
      icon: Flame,
      color: "muaythai",
      active: false,
    },
    {
      name: "Taekwondo",
      description:
        "Develop speed, balance, flexibility and powerful kicks.",
      icon: Footprints,
      color: "taekwondo",
      active: false,
    },
    {
      name: "Judo",
      description:
        "Learn balance, throws, grips and controlled movement.",
      icon: Trophy,
      color: "judo",
      active: false,
    },
    {
      name: "MMA",
      description:
        "Explore techniques from multiple martial arts disciplines.",
      icon: CircleDot,
      color: "mma",
      active: false,
    },
  ];

  const handleSelect = (art) => {
    if (!art.active) {
      alert(art.name + " is coming soon!");
      return;
    }

    if (art.name === "Boxing") {
      navigate("/martial-arts/boxing");
      return;
    }

    if (art.name === "Karate") {
      navigate("/martial-arts/karate");
      return;
    }
  };

  return (
    <div className="martial-page">
      <button
        className="martial-back-button"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={20} />
        Back to Home
      </button>

      <section className="martial-header">
        <div className="martial-header-icon">
          <Swords size={42} />
        </div>

        <span className="martial-label">
          SKILLSENSAI TRAINING
        </span>

        <h1>
          Learn <span>Martial Arts</span>
        </h1>

        <p>
          Choose your discipline and learn through structured
          lessons, visual demonstrations and AI-powered practice.
        </p>
      </section>

      <section className="martial-selection">
        <div className="selection-heading">
          <h2>Choose Your Martial Art</h2>

          <p>
            Boxing and Karate are currently available.
            More disciplines are coming soon.
          </p>
        </div>

        <div className="martial-grid">
          {martialArts.map((art) => {
            const Icon = art.icon;

            return (
              <button
                key={art.name}
                className={`martial-card ${art.color} ${
                  !art.active ? "coming-soon-card" : ""
                }`}
                onClick={() => handleSelect(art)}
              >
                <div className="martial-card-icon">
                  <Icon size={34} />
                </div>

                <div className="martial-card-content">
                  <h3>{art.name}</h3>

                  <p>{art.description}</p>
                </div>

                <div className="martial-card-footer">
                  <span>
                    {art.active
                      ? "START TRAINING →"
                      : "COMING SOON"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="martial-ai-info">
        <div className="ai-info-icon">
          <Zap size={25} />
        </div>

        <div>
          <h3>AI-Powered Training</h3>

          <p>
            Learn a technique, practise it yourself and upload
            your performance. SkillSensAI will analyse your
            movement and provide personalised feedback to help
            improve your technique.
          </p>
        </div>
      </section>
    </div>
  );
}

export default MartialArts;
