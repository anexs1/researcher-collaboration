import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserGraduate,
  faBuilding,
  faStethoscope,
  faUser,
  faFlask,
  faArrowLeft, // Added for Back to Home link
  faRightToBracket, // Added for Login link
} from "@fortawesome/free-solid-svg-icons";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles"; // loads tsparticles engine
import { useCallback } from "react";

// --- Enhanced SignUpCard ---
const SignUpCard = ({ icon, label, description, onClick }) => (
  <div
    onClick={onClick}
    className="cursor-pointer relative group overflow-hidden bg-white rounded-3xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 hover:scale-[1.03] transition-all duration-300 ease-in-out"
  >
    {/* Enhanced Glow Border - pulses slightly on hover */}
    <div className="absolute inset-0 rounded-3xl z-0 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 opacity-30 group-hover:opacity-60 group-hover:animate-pulse transition-opacity duration-300"></div>

    {/* Content */}
    <div className="relative z-10 p-6 md:p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[180px]">
      {/* Icon container with hover effect */}
      <div className="bg-indigo-100 p-4 rounded-full transition-transform duration-300 group-hover:scale-110">
        <FontAwesomeIcon
          icon={icon}
          className="text-indigo-700 text-3xl transition-colors duration-300 group-hover:text-pink-600"
        />
      </div>
      {/* Label */}
      <h2 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors duration-300">
        {label}
      </h2>
      {/* Description (optional) */}
      {description && (
        <p className="text-xs text-gray-500 px-2">{description}</p>
      )}
    </div>
  </div>
);

// --- Main SignUp Component ---
const SignUp = () => {
  const navigate = useNavigate();

  // --- Particle Initialization ---
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    // Optional: console.log("Particles container loaded", container);
  }, []);

  // --- Particle Configuration ---
  const particlesOptions = {
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "repulse",
        },
        resize: true,
      },
      modes: {
        repulse: {
          distance: 100,
          duration: 0.4,
        },
      },
    },
    particles: {
      color: {
        value: ["#ffffff", "#db2777", "#8b5cf6", "#6366f1"],
      },
      links: {
        color: "#ffffff",
        distance: 150,
        enable: true,
        opacity: 0.2,
        width: 1,
      },
      collisions: {
        enable: false,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: {
          default: "out",
        },
        random: true,
        speed: 1.5,
        straight: false,
      },
      number: {
        density: {
          enable: true,
          area: 800,
        },
        value: 60,
      },
      opacity: {
        value: { min: 0.1, max: 0.6 },
        animation: {
          enable: true,
          speed: 0.5,
          minimumValue: 0.1,
          sync: false,
        },
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1, max: 4 },
        animation: {
          enable: true,
          speed: 2,
          minimumValue: 0.5,
          sync: false,
        },
      },
    },
    detectRetina: true,
  };

  // --- Navigation Handler ---
  const handleSignUpClick = (userType) => {
    navigate(`/signup/${userType}`);
  };

  return (
    // Use a relative container to position particles behind content
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      {/* --- Animated Particle Background --- */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={particlesOptions}
        className="absolute inset-0 z-0" // Position behind content
      />

      {/* --- Main Content Area --- */}
      {/* Use z-10 to ensure content is above particles */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-7xl bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-10 md:mb-12">
            <div className="inline-block bg-white/20 p-3 rounded-full mb-4 shadow-md">
              <FontAwesomeIcon icon={faFlask} className="text-3xl text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
              Join Our Research Community
            </h1>
            <p className="mt-3 text-gray-200 text-base md:text-lg font-light max-w-2xl mx-auto">
              Select the profile that best describes you to get started on your
              collaborative journey.
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <SignUpCard
              icon={faUserGraduate}
              label="Academic / Student"
              description="University researchers, faculty, postdocs, and students."
              onClick={() => handleSignUpClick("academic")}
            />
            <SignUpCard
              icon={faBuilding}
              label="Corporate / Gov / NGO"
              description="Industry R&D, government agencies, non-profits."
              onClick={() => handleSignUpClick("corporate")}
            />
            <SignUpCard
              icon={faStethoscope}
              label="Medical Professional"
              description="Clinicians, hospital researchers, healthcare providers."
              onClick={() => handleSignUpClick("medical")}
            />
            <SignUpCard
              icon={faUser}
              label="Community Member"
              description="Enthusiasts, citizen scientists, or other interested parties."
              onClick={() => handleSignUpClick("not-researcher")}
            />
          </div>

          {/* Footer -- EDITED SECTION -- */}
          <div className="text-center mt-10 md:mt-12 space-y-4">
            {" "}
            {/* Added space-y-4 for spacing */}
            <p className="text-sm text-gray-200">
              Already have an account?{" "}
              <Link
                to="/login"
                className="group inline-flex items-center font-medium text-yellow-300 hover:text-yellow-100 transition duration-200 ease-in-out"
              >
                <span className="group-hover:underline underline-offset-2">
                  Log in here
                </span>
                <FontAwesomeIcon
                  icon={faRightToBracket}
                  className="ml-1.5 opacity-70 group-hover:opacity-100 transform group-hover:translate-x-0.5 transition-all duration-200"
                />
              </Link>
            </p>
            <Link
              to="/"
              className="group inline-flex items-center text-sm text-gray-300 hover:text-white transition duration-200 ease-in-out transform hover:-translate-y-0.5" // Added transform
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                className="mr-1.5 opacity-80 group-hover:opacity-100 transition-opacity duration-200"
              />
              <span className="group-hover:underline underline-offset-2">
                Back to Home
              </span>
            </Link>
          </div>
          {/* -- END EDITED SECTION -- */}
        </div>
      </div>
    </div>
  );
};

export default SignUp;
