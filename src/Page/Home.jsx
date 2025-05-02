// src/Page/Home.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // Default calendar CSS
import {
  // Ensure ALL used icons are imported
  FaStar,
  FaSearch,
  FaUniversity,
  FaGraduationCap,
  FaTimes,
  FaMapMarkerAlt,
  FaArrowRight,
  FaQuoteLeft,
  FaBullseye,
  FaUsers,
  FaLightbulb,
  FaAward,
  FaCogs,
  FaBookOpen,
  FaLinkedin,
  FaTwitter,
} from "react-icons/fa";
import { RiTeamFill, RiSeedlingLine } from "react-icons/ri";
import { BsGraphUp, BsCalendarCheck, BsShieldCheck } from "react-icons/bs";
import { FiCalendar, FiGlobe } from "react-icons/fi";

// --- Custom Calendar Styles ---
// Recommendation: Move these styles to your main CSS file (e.g., index.css or App.css)
const calendarStyles = `
  .react-calendar { /* Basic overrides */
    border: 1px solid #e5e7eb; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); width: 330px; max-width: 100%; background: white; font-family: inherit; line-height: 1.125em;
  }
  .react-calendar__navigation button { color: #3b82f6; min-width: 40px; background: none; font-size: 1rem; margin-top: 8px; }
  .react-calendar__navigation button:enabled:hover, .react-calendar__navigation button:enabled:focus { background-color: #f3f4f6; }
  .react-calendar__month-view__weekdays { text-align: center; text-transform: uppercase; font-weight: 600; font-size: 0.7em; color: #6b7280; }
  .react-calendar__month-view__days__day--weekend { color: #ef4444; }
  .react-calendar__tile { padding: 0.75em 0.5em; background: none; text-align: center; line-height: 16px; border-radius: 0.375rem; }
  .react-calendar__tile:disabled { background-color: #f9fafb; color: #d1d5db; }
  .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background-color: #eff6ff; }
  .react-calendar__tile--now { background: #bfdbfe; font-weight: 600; }
  .react-calendar__tile--active { background: #3b82f6; color: white; }
  .highlight-event-date { /* Custom class for event dates */
    background-color: #60a5fa !important; color: white !important; border-radius: 9999px !important; font-weight: bold !important; position: relative;
  }
  .highlight-event-date abbr { color: white !important; } /* Target number inside highlighted date */
  .highlight-event-date::after { /* Optional: add a small dot */
    content: ''; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; border-radius: 50%; background-color: #1e40af;
  }
`;

// --- Animation Variants ---
const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut", staggerChildren: 0.15 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};
const cardHover = { scale: 1.03, transition: { duration: 0.2 } };
const buttonHover = {
  scale: 1.05,
  transition: { type: "spring", stiffness: 300, damping: 15 },
};

// --- Helper: Badge Styles ---
const getTypeBadgeStyle = (type) => {
  switch (type?.toLowerCase()) {
    case "conference":
      return "bg-blue-100 text-blue-800 ring-1 ring-blue-200";
    case "call for papers":
      return "bg-green-100 text-green-800 ring-1 ring-green-200";
    case "workshop":
      return "bg-purple-100 text-purple-800 ring-1 ring-purple-200";
    case "news":
      return "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 ring-1 ring-gray-200";
  }
};

// --- Reusable Sub-Components ---

const NewsEventCard = ({ item, index }) => (
  <motion.div
    key={item.id}
    variants={itemVariants}
    whileHover={cardHover}
    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 overflow-hidden flex flex-col group"
  >
    {item.image && (
      <div className="overflow-hidden h-48">
        <img
          src={item.image}
          alt={`${item.title} image`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/default-placeholder.png";
          }} // Added fallback
        />
      </div>
    )}
    <div className="p-5 flex flex-col flex-grow">
      <div className="mb-3">
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getTypeBadgeStyle(
            item.type
          )}`}
        >
          {item.type}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2 leading-snug">
        {item.title}
      </h3>
      <div className="flex items-center text-xs text-gray-500 mb-4 space-x-3 flex-wrap">
        <span className="flex items-center whitespace-nowrap">
          <FiCalendar className="mr-1.5 w-3.5 h-3.5 flex-shrink-0" />
          {item.date}{" "}
          {item.type?.toLowerCase() === "call for papers" ||
          item.location?.toLowerCase() === "submission deadline"
            ? "(Deadline)"
            : ""}
        </span>
        {item.location && item.location !== "Submission Deadline" && (
          <span className="flex items-center whitespace-nowrap">
            <FaMapMarkerAlt className="mr-1.5 w-3.5 h-3.5 flex-shrink-0" />
            {item.location}
          </span>
        )}
      </div>
      <p className="text-gray-600 text-sm mb-5 line-clamp-3 flex-grow">
        {item.description}
      </p>
      <div className="mt-auto pt-3 border-t border-gray-100">
        <a
          href={item.link || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm inline-flex items-center transition-colors duration-200 group" // Added group for arrow animation
          aria-label={`Learn more about ${item.title}`}
        >
          Learn More{" "}
          <FaArrowRight className="w-3 h-3 ml-1.5 group-hover:translate-x-1 transition-transform duration-200" />
        </a>
      </div>
    </div>
  </motion.div>
);

const FeatureCard = ({ icon, title, description, delay = 0 }) => (
  <motion.div
    variants={itemVariants}
    whileHover={cardHover}
    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 text-center h-full"
  >
    <div className="inline-block p-4 bg-indigo-100 text-indigo-600 rounded-full mb-5">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-3 text-gray-800">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const CategoryCard = ({ icon, name, color }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ ...cardHover, backgroundColor: "#ffffff" }}
    className={`${color} p-5 rounded-xl shadow-md hover:shadow-lg flex flex-col items-center justify-center aspect-square cursor-pointer transition-all duration-300`}
  >
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="text-base font-medium text-center">{name}</h3>
  </motion.div>
);

const StatItem = ({ value, label, delay = 0 }) => (
  <motion.div variants={itemVariants} className="text-center">
    <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">
      {value}
    </div>
    <div className="text-sm md:text-base text-gray-600 uppercase tracking-wider">
      {label}
    </div>
  </motion.div>
);

const HowItWorksStep = ({ icon, title, description, delay = 0 }) => (
  <motion.div
    variants={itemVariants}
    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 flex flex-col items-center text-center h-full"
  >
    <div className="text-4xl mb-4 text-indigo-600">{icon}</div>
    <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const TestimonialSlide = ({ testimonial, isActive }) => (
  <motion.div
    key={testimonial.id}
    initial={{ opacity: 0, x: 100 }}
    animate={{
      opacity: isActive ? 1 : 0,
      x: isActive ? 0 : testimonial.id % 2 === 0 ? 100 : -100,
      zIndex: isActive ? 1 : 0,
    }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5, type: "tween" }}
    className={`absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-8 px-4 ${
      !isActive ? "pointer-events-none" : ""
    }`}
  >
    <motion.div
      className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden shadow-lg border-4 border-white"
      initial={{ scale: 0.8 }}
      animate={{ scale: isActive ? 1 : 0.8 }}
      transition={{ delay: 0.1 }}
    >
      <img
        src={testimonial.image}
        alt={testimonial.name}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/default-avatar.png";
        }} // Corrected fallback
      />
    </motion.div>
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl max-w-md text-center md:text-left relative">
      <FaQuoteLeft className="absolute top-4 left-4 text-indigo-100 text-3xl opacity-70 z-0" />
      <div className="relative z-10">
        <div className="flex mb-4 justify-center md:justify-start">
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              className={`${
                i < testimonial.rating ? "text-yellow-400" : "text-gray-300"
              } w-5 h-5 mr-1`}
            />
          ))}
        </div>
        <p className="text-md md:text-lg text-gray-700 mb-5 italic leading-relaxed">
          "{testimonial.quote}"
        </p>
        <div>
          <p className="text-md font-semibold text-gray-900">
            {testimonial.name}
          </p>
          <p className="text-sm text-indigo-600">{testimonial.title}</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const Footer = () => (
  // Keep Footer as a separate component for clarity
  <footer className="bg-gray-900 text-gray-400 py-12 px-6">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
        {/* Column 1: Brand */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-3 text-white">
            Researcher Collaboration Portal
          </h3>
          <p className="text-sm leading-relaxed pr-4">
            Connecting researchers across Africa and beyond to foster innovation
            and accelerate scientific discovery through collaboration.
          </p>
        </div>
        {/* Column 2: Explore */}
        <div>
          <h4 className="font-semibold mb-3 text-white text-sm uppercase tracking-wider">
            Explore
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/projects"
                className="hover:text-white transition-colors"
              >
                Projects
              </Link>
            </li>
            <li>
              <Link
                to="/publications"
                className="hover:text-white transition-colors"
              >
                Publications
              </Link>
            </li>
            <li>
              <Link
                to="/researchers"
                className="hover:text-white transition-colors"
              >
                Researchers
              </Link>
            </li>
          </ul>
        </div>
        {/* Column 3: Resources */}
        <div>
          <h4 className="font-semibold mb-3 text-white text-sm uppercase tracking-wider">
            Resources
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/about" className="hover:text-white transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-white transition-colors">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/help" className="hover:text-white transition-colors">
                Help Center
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="hover:text-white transition-colors"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>
        {/* Column 4: Legal */}
        <div>
          <h4 className="font-semibold mb-3 text-white text-sm uppercase tracking-wider">
            Legal
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                to="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                to="/guidelines"
                className="hover:text-white transition-colors"
              >
                Community Guidelines
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
        <p>
          © {new Date().getFullYear()} Researcher Collaboration Portal. All
          rights reserved.
        </p>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <a
            href="#"
            className="hover:text-white transition-colors"
            aria-label="Twitter"
          >
            <FaTwitter />
          </a>
          <a
            href="#"
            className="hover:text-white transition-colors"
            aria-label="LinkedIn"
          >
            <FaLinkedin />
          </a>
        </div>
      </div>
    </div>
  </footer>
);

// --- Main Home Component ---
const Home = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // --- Calendar State & Logic ---
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const calendarRef = useRef(null);
  const calendarIconRef = useRef(null);

  // Placeholder event data
  const upcomingEvents = [
    { id: "ev1", date: "2025-08-15" },
    { id: "ev2", date: "2025-08-22" },
    { id: "ev3", date: new Date().toISOString().split("T")[0] },
    { id: "ev4", date: "2025-09-10" },
  ];
  const eventDates = upcomingEvents.map((event) => event.date);

  const getTileClassName = ({ date, view }) => {
    if (view === "month") {
      const dateString = date.toISOString().split("T")[0];
      if (eventDates.includes(dateString)) return "highlight-event-date";
    }
    return null;
  };

  useEffect(() => {
    // Close calendar on outside click
    const handleClickOutside = (event) => {
      if (
        showCalendar &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target) &&
        calendarIconRef.current &&
        !calendarIconRef.current.contains(event.target)
      ) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCalendar]);
  // --- End Calendar Logic ---

  // --- Testimonial State & Logic ---
  const testimonials = [
    // Placeholder Data
    {
      id: 1,
      name: "Dr. Amanuel Tesfaye",
      title: "Researcher, AAU",
      image: "/assets/researcher1.jpg",
      quote:
        "This platform transformed how I find collaborators. Essential tool!",
      rating: 5,
    },
    {
      id: 2,
      name: "Prof. Mulu Alemayehu",
      title: "Professor, UoG",
      image: "/assets/researcher2.jpg",
      quote:
        "The collaboration tools saved countless hours coordinating our team.",
      rating: 4,
    },
    {
      id: 3,
      name: "Dr. Fatima Yusuf",
      title: "Postdoc Fellow, KEMRI",
      image: "/assets/researcher3.jpg",
      quote:
        "Connected me with mentors and opportunities I wouldn't have found otherwise.",
      rating: 5,
    },
  ];
  useEffect(() => {
    // Auto-cycle testimonials
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 7000); // Cycle every 7 seconds
    return () => clearInterval(interval);
  }, [testimonials.length]);
  // --- End Testimonial Logic ---

  // --- Placeholder Data Definitions ---
  const newsAndEventsData = [
    {
      id: "ne1",
      type: "Conference",
      title: "Pan-African AI Research Summit 2025",
      date: "2025-11-10",
      location: "Nairobi & Online",
      description: "Join leading AI researchers from across the continent.",
      link: "#",
      image: "/assets/conference_image_1.jpg",
    },
    {
      id: "ne2",
      type: "Call for Papers",
      title: "Journal of Sustainable Development - Water Scarcity",
      date: "2025-10-15",
      location: "Submission Deadline",
      description: "Seeking original research on water scarcity solutions.",
      link: "#",
      image: "/assets/journal_cfp.jpg",
    },
    {
      id: "ne3",
      type: "Workshop",
      title: "Advanced Data Visualization Techniques",
      date: "2025-09-20",
      location: "Online",
      description: "Hands-on workshop covering cutting-edge tools.",
      link: "#",
      image: "/assets/workshop_data_viz.jpg",
    },
    {
      id: "ne4",
      type: "News",
      title: "Portal Reaches 5,000 Active Researchers",
      date: "2025-08-01",
      location: "Platform Update",
      description: "Community continues to grow, fostering collaborations.",
      link: "#",
    },
  ];

  const researchCategories = [
    {
      name: "AI & ML",
      icon: <BsGraphUp />,
      color: "bg-purple-100 text-purple-800",
    },
    {
      name: "Health Sciences",
      icon: <RiSeedlingLine />,
      color: "bg-red-100 text-red-800",
    },
    {
      name: "Climate & Env.",
      icon: <FiGlobe />,
      color: "bg-green-100 text-green-800",
    },
    {
      name: "Data Science",
      icon: <FaGraduationCap />,
      color: "bg-blue-100 text-blue-800",
    },
    {
      name: "Social Sciences",
      icon: <FaUsers />,
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      name: "Engineering",
      icon: <FaCogs />,
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      name: "Agriculture",
      icon: <RiTeamFill />,
      color: "bg-teal-100 text-teal-800",
    },
    {
      name: "Policy & Gov.",
      icon: <FaUniversity />,
      color: "bg-pink-100 text-pink-800",
    },
  ];

  const howItWorksSteps = [
    {
      title: "1. Profile",
      description: "Showcase your expertise & interests.",
      icon: <FaGraduationCap />,
      delay: 0,
    },
    {
      title: "2. Discover",
      description: "Find collaborators via advanced search & AI matches.",
      icon: <RiTeamFill />,
      delay: 0.15,
    },
    {
      title: "3. Collaborate",
      description: "Use integrated workspaces for seamless teamwork.",
      icon: <BsGraphUp />,
      delay: 0.3,
    },
    {
      title: "4. Impact",
      description: "Publish jointly, track impact, & access funding.",
      icon: <FaAward />,
      delay: 0.45,
    },
  ];

  const features = [
    {
      title: "Intelligent Matching",
      description:
        "AI suggests collaborators based on your profile and research interests.",
      icon: <FaLightbulb className="w-8 h-8" />,
    },
    {
      title: "Secure Workspace",
      description: "Encrypted tools with version control and task management.",
      icon: <BsShieldCheck className="w-8 h-8" />,
    },
    {
      title: "Funding Network",
      description: "Access grants, fellowships, and partnership opportunities.",
      icon: <RiSeedlingLine className="w-8 h-8" />,
    },
    {
      title: "Publication Support",
      description: "Tools for co-authoring, peer review, and tracking.",
      icon: <FaBookOpen className="w-8 h-8" />,
    },
  ];

  const featuredContent = [
    // Placeholder Data
    {
      type: "Project",
      title: "Mapping Malaria Hotspots using Satellite Imagery",
      lead: "Dr. Lena Hassan",
      image: "/assets/featured_project1.jpg",
      link: "#",
    },
    {
      type: "Researcher",
      title: "Prof. David Adekunle - AI Ethics Pioneer",
      image: "/assets/featured_researcher1.jpg",
      link: "#",
    },
    {
      type: "Publication",
      title: "Climate Resilient Crops for East Africa: A Meta-Analysis",
      image: "/assets/featured_pub1.jpg",
      link: "#",
    },
  ];

  // --- Render Page Structure ---
  return (
    <div className="bg-gray-50 font-sans overflow-x-hidden">
      <style>{calendarStyles}</style> {/* Inject Calendar Styles */}
      {/* --- Hero Section --- */}
      <section className="relative bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-800 text-white pt-32 pb-40 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] bg-[url('/assets/subtle-network.svg')] bg-repeat"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.h1
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight"
          >
            Unlock Research Synergies.{" "}
            <span className="text-blue-300 block md:inline">
              Collaborate Globally.
            </span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-indigo-100 leading-relaxed"
          >
            Connect with leading researchers, join innovative projects, and
            amplify your impact on the premier platform for academic
            collaboration in Africa and beyond.
          </motion.p>
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <motion.button
              whileHover={buttonHover}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-indigo-700 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-indigo-100 transition-colors text-lg"
              onClick={() => navigate("/signup")}
            >
              Join the Network
            </motion.button>
            <motion.button
              whileHover={buttonHover}
              whileTap={{ scale: 0.95 }}
              className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-full hover:bg-white/10 transition-colors text-lg"
              onClick={() => navigate("/explore")}
            >
              Explore Research
            </motion.button>
          </motion.div>
        </div>
      </section>
      {/* --- University Logos --- */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="-mt-16 relative z-20 px-6"
      >
        <div className="bg-white rounded-2xl shadow-xl max-w-5xl mx-auto p-6">
          <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Trusted by Leading Institutions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:gap-x-12 lg:gap-x-16">
            {[
              { name: "Arba Minch University", logo: "/assets/amu-logo.png" },
              { name: "University of Cape Town", logo: "/assets/uct-logo.png" },
              {
                name: "African Academy of Sciences",
                logo: "/assets/aas-logo.png",
              },
              { name: "Addis Ababa University", logo: "/assets/aau-logo.png" },
              { name: "University of Nairobi", logo: "/assets/uon-logo.png" },
            ].map((uni) => (
              <motion.img
                key={uni.name}
                src={uni.logo}
                alt={`${uni.name} logo`}
                className="h-8 md:h-10 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0 grayscale hover:grayscale-0"
                whileHover={{ scale: 1.1 }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
      {/* --- Discover Section --- */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="pt-20 pb-16 px-6 bg-gray-50"
      >
        <div className="max-w-5xl mx-auto">
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-4 text-center text-gray-800"
          >
            Discover Opportunities
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-center text-gray-600 mb-10 max-w-2xl mx-auto"
          >
            Find researchers, projects, publications, and funding relevant to
            your expertise.
          </motion.p>
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl shadow-lg p-5 md:p-6 mb-8 relative border border-gray-100"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:flex-grow">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search by keyword, name, institution, topic..."
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex w-full md:w-auto items-center space-x-2 flex-shrink-0">
                <motion.button
                  whileHover={buttonHover}
                  whileTap={{ scale: 0.95 }}
                  className="bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-base font-medium flex-grow md:flex-grow-0"
                >
                  Search
                </motion.button>
                <div className="relative">
                  <motion.button
                    ref={calendarIconRef}
                    onClick={() => setShowCalendar(!showCalendar)}
                    whileHover={buttonHover}
                    whileTap={{ scale: 0.95 }}
                    className="text-gray-500 hover:text-indigo-600 p-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center"
                    aria-label="Toggle Calendar"
                  >
                    <FiCalendar className="w-5 h-5" />
                  </motion.button>
                  <AnimatePresence>
                    {showCalendar && (
                      <motion.div
                        ref={calendarRef}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 origin-top-right z-50"
                      >
                        <Calendar
                          onChange={setCalendarDate}
                          value={calendarDate}
                          tileClassName={getTileClassName}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>
      {/* --- Featured Content Section --- */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-16 px-6 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-800"
          >
            Featured Highlights
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredContent.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={cardHover}
                className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl border border-gray-100 group bg-white"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/default-placeholder.png";
                    }}
                  />
                  <span className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {item.type}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-2 text-gray-800 leading-snug">
                    {item.title}
                  </h3>
                  {item.lead && (
                    <p className="text-sm text-gray-500 mb-3">
                      Lead: {item.lead}
                    </p>
                  )}
                  <a
                    href={item.link}
                    className="text-indigo-600 hover:text-indigo-800 font-medium text-sm inline-flex items-center transition-colors duration-200"
                  >
                    View Details{" "}
                    <FaArrowRight className="w-3 h-3 ml-1.5 group-hover:translate-x-1 transition-transform duration-200" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
      {/* --- Features Section (Why Choose Us) --- */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-16 px-6 bg-indigo-50"
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-800"
          >
            Why Collaborate Here?
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </motion.section>
      {/* --- News & Events Section --- */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="py-16 px-6 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-800"
          >
            Latest News & Opportunities
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {newsAndEventsData.length > 0 ? (
              newsAndEventsData.map((item, index) => (
                <NewsEventCard item={item} index={index} />
              ))
            ) : (
              <motion.div
                variants={itemVariants}
                className="col-span-full text-center py-10 text-gray-500"
              >
                No news or events available.
              </motion.div>
            )}
          </div>
          {newsAndEventsData.length > 3 && (
            <motion.div variants={itemVariants} className="text-center mt-12">
              <motion.button
                whileHover={buttonHover}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/news-events")}
                className="bg-indigo-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
              >
                View All News & Events
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.section>
      {/* --- How It Works Section --- */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-16 px-6 bg-gray-100"
      >
        {" "}
        {/* Changed background */}
        <div className="max-w-6xl mx-auto">
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-800"
          >
            How Collaboration Works
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, index) => (
              <HowItWorksStep
                key={index}
                icon={step.icon}
                title={step.title}
                description={step.description}
                delay={step.delay}
              />
            ))}
          </div>
        </div>
      </motion.section>
      {/* --- Research Categories Section --- */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="py-16 px-6 bg-white"
      >
        {" "}
        {/* Changed background */}
        <div className="max-w-6xl mx-auto">
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-800"
          >
            Explore Research Domains
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-6">
            {researchCategories.map((category, index) => (
              <CategoryCard
                key={index}
                icon={category.icon}
                name={category.name}
                color={category.color}
              />
            ))}
          </div>
        </div>
      </motion.section>
      {/* --- Stats Section --- */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="py-16 px-6 bg-indigo-50"
      >
        {" "}
        {/* Changed background */}
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatItem value="5K+" label="Researchers" delay={0} />
          <StatItem value="1.8K+" label="Collaborations" delay={0.1} />
          <StatItem value="350+" label="Institutions" delay={0.2} />
          <StatItem value="60+" label="Countries" delay={0.3} />
        </div>
      </motion.section>
      {/* --- Testimonials Section --- */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-16 px-6 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden"
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-16 text-center text-gray-800"
          >
            Success Stories
          </motion.h2>
          <div className="relative h-[26rem] md:h-[22rem]">
            <AnimatePresence initial={false}>
              {testimonials.map(
                (testimonial, index) =>
                  activeTestimonial === index && (
                    <TestimonialSlide
                      key={testimonial.id}
                      testimonial={testimonial}
                      isActive={activeTestimonial === index}
                    />
                  )
              )}
            </AnimatePresence>
          </div>
          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ease-in-out ${
                  activeTestimonial === index
                    ? "bg-indigo-600 scale-125"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`View testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </motion.section>
      {/* --- Final Call to Action --- */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="py-20 px-6 bg-gradient-to-r from-indigo-700 to-blue-700 text-white"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-5"
          >
            Ready to Transform Your Research?
          </motion.h2>
          <motion.p
            variants={itemVariants}
            transition={{ delay: 0.1 }}
            className="text-lg text-indigo-100 mb-10 max-w-2xl mx-auto"
          >
            Join thousands of researchers leveraging collaboration to achieve
            breakthroughs.
          </motion.p>
          <motion.div
            variants={itemVariants}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <motion.button
              whileHover={buttonHover}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-indigo-700 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-indigo-100 transition-colors text-base"
              onClick={() => navigate("/signup")}
            >
              Get Started Free
            </motion.button>
            <motion.button
              whileHover={buttonHover}
              whileTap={{ scale: 0.95 }}
              className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-full hover:bg-white/10 transition-colors text-base"
              onClick={() => navigate("/contact")}
            >
              Request a Demo
            </motion.button>
          </motion.div>
        </div>
      </motion.section>
      {/* --- Footer --- */}
      <Footer />
    </div> // End Main Container
  );
};

export default Home;
