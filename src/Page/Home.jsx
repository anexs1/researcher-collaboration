import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaUniversity,
  FaGraduationCap,
  FaMapMarkerAlt,
  FaArrowRight,
  FaQuoteLeft,
  FaUsers,
  FaLightbulb,
  FaBookOpen,
  FaLinkedin,
  FaTwitter,
  FaCalendarAlt,
  FaProjectDiagram, // For Projects Hosted
  FaHandsHelping, // For Collaborations Formed
  FaChartLine, // For overall impact
} from "react-icons/fa";
import { RiTeamFill, RiSeedlingLine } from "react-icons/ri";
import { BsGraphUp, BsShieldCheck } from "react-icons/bs";
import { FiGlobe } from "react-icons/fi";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    variants={itemVariants}
    className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-500 transition-all duration-300 h-full flex flex-col"
  >
    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 text-blue-600">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2 text-gray-800">{title}</h3>
    <p className="text-gray-600 text-sm flex-grow">{description}</p>
  </motion.div>
);

const ResearcherCard = ({ researcher }) => (
  <motion.div
    variants={itemVariants}
    className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200 text-center"
  >
    <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden mx-auto mb-3">
      <img
        src={researcher.image || "/placeholder-image.jpg"}
        alt={researcher.name}
        className="w-full h-full object-cover"
        onError={(e) => (e.target.src = "/placeholder-image.jpg")}
      />
    </div>
    <h3 className="font-semibold text-gray-800">{researcher.name}</h3>
    <p className="text-sm text-blue-600 mb-2">{researcher.title}</p>
    <p className="text-xs text-gray-500 mb-3">{researcher.institution}</p>
    <div className="flex justify-center space-x-2">
      <a
        href={researcher.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-blue-600"
      >
        <FaLinkedin />
      </a>
      <a
        href={researcher.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-blue-400"
      >
        <FaTwitter />
      </a>
    </div>
  </motion.div>
);

// --- NEW: StatisticCard Component ---
const StatisticCard = ({ icon, value, label, color }) => (
  <motion.div
    variants={itemVariants}
    className={`bg-gradient-to-br ${
      color || "from-blue-50 to-indigo-50"
    } p-6 rounded-lg shadow-md text-center h-full flex flex-col justify-center items-center border border-gray-200`}
  >
    <div className={`text-4xl mb-3 ${color ? "text-white" : "text-blue-600"}`}>
      {icon}
    </div>
    <div
      className={`text-3xl font-bold ${color ? "text-white" : "text-gray-800"}`}
    >
      {value}
    </div>
    <p
      className={`text-sm mt-1 ${color ? "text-indigo-100" : "text-gray-600"}`}
    >
      {label}
    </p>
  </motion.div>
);
// --- End of StatisticCard Component ---

const Home = () => {
  const navigate = useNavigate();
  // const [searchQuery, setSearchQuery] = useState(""); // State remains, though input field removed from this component
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const features = [
    {
      icon: <RiTeamFill className="text-xl" />,
      title: "Find Collaborators",
      description:
        "Connect with researchers across disciplines and institutions.",
    },
    {
      icon: <FaBookOpen className="text-xl" />,
      title: "Share Publications",
      description: "Upload and discover research papers and articles.",
    },
    {
      icon: <BsGraphUp className="text-xl" />,
      title: "Manage Projects",
      description:
        "Organize and track collaborative research projects effectively.",
    },
    {
      icon: <BsShieldCheck className="text-xl" />,
      title: "Secure Workspace",
      description:
        "Utilize encrypted tools with version control and task management.",
    },
    {
      icon: <FaLightbulb className="text-xl" />,
      title: "Discover Funding",
      description:
        "Find relevant grants, fellowships, and funding calls tailored to your research area.",
    },
    {
      icon: <FiGlobe className="text-xl" />,
      title: "Access Shared Datasets",
      description:
        "Explore and utilize diverse datasets contributed by the research community securely.",
    },
    {
      icon: <FaUsers className="text-xl" />,
      title: "Join Interest Groups",
      description:
        "Connect with peers in specialized groups to discuss niche topics and innovations.",
    },
    {
      icon: <FaGraduationCap className="text-xl" />,
      title: "Skill Development Hub",
      description:
        "Access workshops, courses, and resources to enhance your research skills.",
    },
  ];

  const researchers = [
    {
      id: 1,
      name: "Dr. Almaz Bekele",
      title: "Lead Researcher",
      institution: "Addis Ababa University",
      linkedin: "https://linkedin.com", // Added full links
      twitter: "https://twitter.com",
      image: "https://randomuser.me/api/portraits/women/68.jpg", // Placeholder user image
    },
    {
      id: 2,
      name: "Prof. Tesfaye Lemma",
      title: "Professor of AgriTech",
      institution: "Arba Minch University",
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
      image: "https://randomuser.me/api/portraits/men/75.jpg",
    },
    {
      id: 3,
      name: "Dr. Sara Gebre",
      title: "Postdoctoral Fellow",
      institution: "Hawassa University", // Changed for variety
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
      image: "https://randomuser.me/api/portraits/women/78.jpg",
    },
  ];

  const testimonials = [
    {
      id: 1,
      name: "Dr. Amanuel Tesfaye",
      title: "Researcher, AAU",
      quote:
        "This platform transformed how I find collaborators. Essential tool for modern research!",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      id: 2,
      name: "Prof. Mulu Alemayehu",
      title: "Professor, UoG",
      quote:
        "The collaboration tools saved countless hours coordinating our interdisciplinary team. Highly recommended.",
      image: "https://randomuser.me/api/portraits/women/45.jpg",
    },
    {
      id: 3,
      name: "Dr. Anuwar Addisu", // Changed to Dr. for variety
      title: "Data Scientist, MoSHE", // Changed for variety
      quote:
        "It's a great platform for researchers to collaborate, share knowledge, and push the boundaries of science.",
      image: "https://randomuser.me/api/portraits/men/55.jpg",
    },
  ];

  // --- NEW: Dummy Statistics Data ---
  const platformStats = [
    {
      icon: <FaUsers />,
      value: "1,200+",
      label: "Active Researchers",
      color: "from-teal-500 to-cyan-500",
    },
    {
      icon: <FaProjectDiagram />,
      value: "350+",
      label: "Projects Hosted",
      color: "from-purple-500 to-indigo-500",
    },
    {
      icon: <FaBookOpen />,
      value: "2,500+",
      label: "Publications Shared",
      color: "from-orange-500 to-amber-500",
    },
    {
      icon: <FaHandsHelping />,
      value: "800+",
      label: "Collaborations Formed",
      color: "from-green-500 to-lime-500",
    },
  ];
  // --- End of Dummy Statistics Data ---

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-800 to-blue-600 text-white pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/pattern.svg')]"></div>{" "}
        {/* Ensure pattern.svg is in public */}
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight"
              style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.3)" }}
            >
              Researcher Collaboration Portal
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl mb-10 opacity-90 max-w-2xl mx-auto"
            >
              Uniting Minds, Powering Projects. Ethiopia's Premier Platform for
              Collaborative Success.
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <button
                onClick={() => navigate("/signup")}
                className="bg-white text-blue-800 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors shadow-md"
              >
                Join Now
              </button>
              <button
                onClick={() => navigate("/explore")} // Changed to /explore for projects
                className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white/10 transition-colors"
              >
                Explore Projects
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="py-8 bg-white shadow-sm -mt-16 relative z-20 mx-4 sm:mx-6 rounded-lg"
      >
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-500 mb-6 tracking-wider font-medium">
            TRUSTED BY LEADING INSTITUTIONS
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 md:gap-x-12 opacity-70">
            {/* Replace with actual logos if available */}
            <img
              src="/logos/aau-logo.png"
              alt="AAU Logo"
              className="h-8 md:h-10 object-contain"
              onError={(e) => (e.target.style.display = "none")}
            />
            <img
              src="/logos/amu-logo.png"
              alt="AMU Logo"
              className="h-8 md:h-10 object-contain"
              onError={(e) => (e.target.style.display = "none")}
            />
            <img
              src="/logos/uog-logo.png"
              alt="UoG Logo"
              className="h-8 md:h-10 object-contain"
              onError={(e) => (e.target.style.display = "none")}
            />
            <img
              src="/logos/hu-logo.png"
              alt="HU Logo"
              className="h-8 md:h-10 object-contain"
              onError={(e) => (e.target.style.display = "none")}
            />
            <img
              src="/logos/ju-logo.png"
              alt="JU Logo"
              className="h-8 md:h-10 object-contain"
              onError={(e) => (e.target.style.display = "none")}
            />
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        {" "}
        {/* Changed background for consistency */}
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl font-bold text-center mb-4 text-gray-800"
            >
              Why Collaborate With Us?
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-gray-600 text-center mb-12 max-w-2xl mx-auto"
            >
              Powerful tools designed to enhance your collaborative experience
              and accelerate research outcomes.
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- NEW: Platform Impact at a Glance Section --- */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl font-bold text-center mb-12 text-gray-800"
            >
              Platform Impact at a Glance
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {platformStats.map((stat, index) => (
                <StatisticCard
                  key={index}
                  icon={stat.icon}
                  value={stat.value}
                  label={stat.label}
                  color={stat.color}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      {/* --- End of Platform Impact Section --- */}

      {/* Featured Collaborators Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <motion.h2
                variants={itemVariants}
                className="text-3xl font-bold text-gray-800 text-center sm:text-left"
              >
                Featured Collaborators
              </motion.h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {researchers.map((researcher) => (
                <ResearcherCard key={researcher.id} researcher={researcher} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true, amount: 0.2 }}
            className="text-center"
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl font-bold mb-12 text-gray-800"
            >
              What Our Users Say
            </motion.h2>

            <div className="relative h-72 md:h-64 overflow-hidden">
              {" "}
              {/* Adjusted height and added overflow */}
              <AnimatePresence mode="wait">
                {testimonials.map(
                  (testimonial, index) =>
                    activeTestimonial === index && (
                      <motion.div
                        key={testimonial.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 flex flex-col items-center justify-center p-4"
                      >
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mb-4 shadow-lg">
                          <img
                            src={testimonial.image || "/placeholder-image.jpg"}
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                            onError={(e) =>
                              (e.target.src = "/placeholder-image.jpg")
                            }
                          />
                        </div>
                        <div className="max-w-xl relative text-center">
                          <FaQuoteLeft className="absolute -top-2 -left-2 md:-top-4 md:-left-4 text-blue-200 text-2xl md:text-3xl opacity-70" />
                          <blockquote className="text-md md:text-lg italic text-gray-700 mb-3">
                            "{testimonial.quote}"
                          </blockquote>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {testimonial.name}
                            </p>
                            <p className="text-blue-600 text-sm">
                              {testimonial.title}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-center gap-2.5 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none ${
                    activeTestimonial === index
                      ? "bg-blue-600 scale-125"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-800 to-blue-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={fadeIn}
            viewport={{ once: true, amount: 0.2 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Supercharge Your Collaboration?
            </h2>
            <p className="text-lg mb-10 max-w-2xl mx-auto opacity-90">
              Join thousands of users leveraging collaboration to achieve
              breakthroughs.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => navigate("/signup")}
                className="bg-white text-blue-800 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors shadow-md"
              >
                Get Started Free
              </button>
              <button
                onClick={() => navigate("/contact")}
                className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white/10 transition-colors"
              >
                Contact Us
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg text-white font-semibold mb-4">
                Researcher Portal
              </h3>
              <p className="text-sm leading-relaxed">
                Connecting innovators across Ethiopia and beyond to foster
                collaboration and accelerate discovery.
              </p>
            </div>
            <div>
              <h3 className="text-lg text-white font-semibold mb-4">Explore</h3>
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
                    to="/explore-researchers"
                    className="hover:text-white transition-colors"
                  >
                    Researchers
                  </Link>
                </li>
                {/* <li><Link to="/resources" className="hover:text-white transition-colors">Resources</Link></li> */}
              </ul>
            </div>
            <div>
              <h3 className="text-lg text-white font-semibold mb-4">
                Platform
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-white transition-colors"
                  >
                    About Us
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
                <li>
                  <Link
                    to="/faq"
                    className="hover:text-white transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg text-white font-semibold mb-4">
                Connect With Us
              </h3>
              <div className="flex space-x-4 mb-4">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <FaTwitter size={20} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin size={20} />
                </a>
              </div>
              <p className="text-sm">contact@researchportal.et</p>{" "}
              {/* Example email */}
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            © {new Date().getFullYear()} Researcher Collaboration Portal. All
            rights reserved. Built with passion in Ethiopia.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
