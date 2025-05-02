// src/Page/AboutUs.jsx (Ensure the file path matches your import in App.jsx)

import React from "react";
import { motion } from "framer-motion"; // For animations
import { Link } from "react-router-dom"; // For CTA buttons
import {
  FaUsers,
  FaBullseye,
  FaRocket,
  FaCogs,
  FaLightbulb,
  FaNetworkWired,
  FaShareAlt,
  FaComments,
  FaStar,
  FaHeart,
  FaHandshake,
  FaBookOpen,
  FaProjectDiagram,
  FaLinkedin,
  FaTwitter, // Added social icons for team
} from "react-icons/fa";

// Animation Variants for Framer Motion (CORRECTED EASE VALUE)
const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      // Use a valid preset easing function
      ease: "easeOut", // <<< CORRECTED
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  // Use a valid preset easing function
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }, // <<< CORRECTED
};

// Reusable Card Component for Features/Values (Refined)
const InfoCard = ({ icon, title, children }) => (
  <motion.div
    variants={itemVariants} // Use item variants for staggered animation
    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center border border-gray-100 hover:border-transparent hover:border-t-4 hover:border-t-indigo-500 transform hover:-translate-y-1"
  >
    {/* Added background circle to icon */}
    <div className="text-indigo-600 mb-4 p-3 bg-indigo-100 rounded-full w-fit">
      {React.createElement(icon, { size: 32 })}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
    <p className="text-gray-600 leading-relaxed text-sm flex-grow">
      {children}
    </p>
  </motion.div>
);

// Main AboutUs Component
const AboutUs = () => {
  // --- Placeholder Data (Replace with real data/fetch from API) ---
  const teamMembers = [
    {
      id: 1,
      name: "Dr. Almaz Bekele",
      role: "Founder & Lead Researcher",
      imageUrl: "/placeholder-avatar-1.png",
      social: { linkedin: "#", twitter: "#" },
    },
    {
      id: 2,
      name: "Ato Tesfaye Lemma",
      role: "Lead Developer",
      imageUrl: "/placeholder-avatar-2.png",
      social: { linkedin: "#" },
    },
    {
      id: 3,
      name: "W/ro Sara Gebre",
      role: "Community Manager",
      imageUrl: "/placeholder-avatar-3.png",
      social: { twitter: "#" },
    },
  ];

  const values = [
    {
      icon: FaHandshake,
      title: "Collaboration",
      description: "Fostering connections and teamwork across disciplines.",
    },
    {
      icon: FaLightbulb,
      title: "Innovation",
      description: "Encouraging new ideas and forward-thinking research.",
    },
    {
      icon: FaHeart,
      title: "Integrity",
      description:
        "Upholding the highest standards of academic honesty and ethics.",
    },
    {
      icon: FaShareAlt,
      title: "Openness",
      description:
        "Promoting the sharing of knowledge for collective advancement.",
    },
  ];
  // --- End Placeholder Data ---

  return (
    // Use a slightly different background for page content area if desired
    <div className="bg-gray-50 py-16 md:py-20">
      {" "}
      {/* Adjusted padding slightly */}
      {/* --- Hero Section --- */}
      <motion.section
        className="max-w-6xl mx-auto px-6 text-center mb-16 md:mb-20"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <motion.div variants={itemVariants} className="text-indigo-600 mb-4">
          {" "}
          {/* Changed color */}
          <FaNetworkWired size={50} className="inline-block" />
        </motion.div>
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
        >
          Connecting Researchers, Advancing Knowledge
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto"
        >
          Welcome to the Researcher Collaboration Portal – Ethiopia's hub for
          academic networking, discovery, and joint innovation.
        </motion.p>
      </motion.section>
      {/* --- Who We Are & Purpose Section --- */}
      <motion.section
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-20 grid md:grid-cols-2 gap-12 items-start" // Changed to items-start
        initial="hidden"
        whileInView="visible" // Animate when scrolling into view
        viewport={{ once: true, amount: 0.3 }} // Trigger animation once
        variants={sectionVariants}
      >
        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-semibold mb-4 text-gray-900 flex items-center">
            <FaUsers className="mr-3 text-indigo-600" /> Who We Are{" "}
            {/* Changed color */}
          </h2>
          <p className="text-lg leading-relaxed text-gray-700 mb-6">
            The <strong>Researcher Collaboration Portal</strong> is a dedicated
            digital space conceived and built to empower the academic community
            in Ethiopia and connect it globally. We serve researchers,
            postgraduate students, professors, and institutions seeking
            meaningful collaboration.
          </p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-semibold mb-4 text-gray-900 flex items-center">
            <FaBullseye className="mr-3 text-indigo-600" /> Our Purpose{" "}
            {/* Changed color */}
          </h2>
          <p className="text-lg leading-relaxed text-gray-700">
            Our core purpose is to break down the silos that can isolate
            researchers. We provide a dynamic, secure, and intuitive platform to
            find partners, share breakthroughs, manage projects, and amplify the
            impact of academic work.
          </p>
        </motion.div>
      </motion.section>
      {/* --- Key Features Section (Using Cards) --- */}
      <motion.section
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <h2 className="text-3xl font-semibold text-center mb-12 text-gray-900">
          Platform Highlights
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature Cards */}
          <InfoCard icon={FaHandshake} title="Find Collaborators">
            {" "}
            Post research needs or discover ongoing projects seeking partners
            across diverse fields.{" "}
          </InfoCard>
          <InfoCard icon={FaBookOpen} title="Share Publications">
            {" "}
            Upload, share, and discover research papers, articles, and
            presentations.{" "}
          </InfoCard>
          <InfoCard icon={FaProjectDiagram} title="Manage Projects">
            {" "}
            Organize collaborative projects, track progress, and communicate
            effectively within teams.{" "}
          </InfoCard>
          <InfoCard icon={FaUsers} title="Build Your Profile">
            {" "}
            Showcase your skills, expertise, publications, and research impact
            to the community.{" "}
          </InfoCard>
          <InfoCard icon={FaComments} title="Connect & Communicate">
            {" "}
            Engage through private messaging and real-time chat with approved
            collaborators.{" "}
          </InfoCard>
          <InfoCard icon={FaStar} title="Recognize Peers">
            {" "}
            Endorse skills and recommend colleagues for their valuable
            contributions.{" "}
          </InfoCard>
        </div>
      </motion.section>
      {/* --- Mission & Vision Section (Added Gradient) --- */}
      <motion.section
        // Added a subtle gradient background
        className="bg-gradient-to-br from-indigo-700 to-blue-800 text-white py-16 md:py-20 mb-16 md:mb-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 text-center md:text-left">
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl font-semibold mb-4 flex items-center justify-center md:justify-start">
              <FaBullseye className="mr-3 opacity-90" /> Our Mission{" "}
              {/* Slightly adjusted opacity */}
            </h2>
            <p className="text-lg leading-relaxed text-indigo-100">
              {" "}
              {/* Adjusted text color for contrast */}
              To cultivate an intelligent, inclusive, and interconnected
              research ecosystem that accelerates knowledge exchange and drives
              academic progress within Ethiopia and beyond.
            </p>
          </motion.div>
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl font-semibold mb-4 flex items-center justify-center md:justify-start">
              <FaRocket className="mr-3 opacity-90" /> Our Vision{" "}
              {/* Slightly adjusted opacity */}
            </h2>
            <p className="text-lg leading-relaxed text-indigo-100">
              {" "}
              {/* Adjusted text color for contrast */}
              To be the definitive digital research commons for Ethiopia,
              empowering generations of scientists, innovators, and thought
              leaders by bridging disciplinary and institutional boundaries.
            </p>
          </motion.div>
        </div>
      </motion.section>
      {/* --- Our Values Section --- */}
      <motion.section
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <h2 className="text-3xl font-semibold text-center mb-12 text-gray-900">
          Our Core Values
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value) => (
            <InfoCard key={value.title} icon={value.icon} title={value.title}>
              {value.description}
            </InfoCard>
          ))}
        </div>
      </motion.section>
      {/* --- Meet the Team Section (Placeholder - Polished) --- */}
      <motion.section
        className="bg-gray-100 py-16 md:py-20 mb-16 md:mb-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-semibold text-center mb-12 text-gray-900">
            Meet the Team
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {teamMembers.map((member) => (
              <motion.div
                key={member.id}
                variants={itemVariants}
                className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <img
                  src={member.imageUrl} // Replace with actual image URL
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover ring-2 ring-indigo-200" // Changed ring color
                  onError={(e) => (e.target.src = "/default-avatar.png")}
                />
                <h3 className="text-xl font-semibold text-gray-800 mb-1">
                  {member.name}
                </h3>
                <p className="text-indigo-600 mb-3">{member.role}</p>{" "}
                {/* Changed color */}
                {/* Added placeholder social icons */}
                <div className="flex justify-center space-x-3">
                  {member.social?.linkedin && (
                    <a
                      href={member.social.linkedin}
                      aria-label={`${member.name} LinkedIn Profile`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <FaLinkedin size={20} />
                    </a>
                  )}
                  {member.social?.twitter && (
                    <a
                      href={member.social.twitter}
                      aria-label={`${member.name} Twitter Profile`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <FaTwitter size={20} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
      <motion.section
        className="text-center bg-gray-100 py-16 md:py-20" // Changed background
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <div className="max-w-4xl mx-auto px-6">
          <motion.h2
            variants={itemVariants}
            className="text-3xl font-bold text-gray-900 mb-6"
          >
            {" "}
            {/* Bolder heading */}
            Ready to Collaborate?
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
          >
            Join a growing community of researchers making a difference. Sign up
            today or explore the ongoing projects and publications.
          </motion.p>
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            {/* Enhanced Button Styles */}
            <Link
              to="/signup" // Make sure this path is correct
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-md shadow-md hover:shadow-lg transition duration-300 transform hover:scale-105"
            >
              Join the Portal
            </Link>
            <Link
              to="/projects" // Make sure this path is correct
              className="inline-block bg-white hover:bg-gray-200 border border-indigo-600 text-indigo-700 font-bold py-3 px-8 rounded-md shadow-sm hover:shadow-md transition duration-300 transform hover:scale-105"
            >
              Explore Projects
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div> // End of main container
  );
};

export default AboutUs;
