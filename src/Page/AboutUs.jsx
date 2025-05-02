// src/Page/AboutUs.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaBullseye,
  FaRocket,
  FaLightbulb,
  FaNetworkWired,
  FaShareAlt,
  FaComments,
  FaBookOpen,
  FaProjectDiagram,
  FaLinkedin,
  FaTwitter,
  FaHandshake,
  FaHeart,
  FaStar,
} from "react-icons/fa";

// Modern animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
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

// Sleek Card Component
const FeatureCard = ({ icon, title, children }) => (
  <motion.div
    variants={itemVariants}
    className="group bg-white p-8 rounded-xl border border-gray-200 hover:border-blue-500 transition-all duration-300 flex flex-col items-center text-center h-full"
  >
    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
      {React.createElement(icon, { className: "text-blue-600 text-xl" })}
    </div>
    <h3 className="text-xl font-medium text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{children}</p>
  </motion.div>
);

const AboutUs = () => {
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
      description: "Fostering connections across disciplines.",
    },
    {
      icon: FaLightbulb,
      title: "Innovation",
      description: "Encouraging forward-thinking research.",
    },
    {
      icon: FaHeart,
      title: "Integrity",
      description: "Upholding academic honesty and ethics.",
    },
    {
      icon: FaShareAlt,
      title: "Openness",
      description: "Promoting knowledge sharing for collective advancement.",
    },
  ];

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
        <motion.div
          className="text-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <FaNetworkWired className="text-blue-600 text-3xl" />
            </div>
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight"
          >
            Empowering Research Through{" "}
            <span className="text-blue-600">Collaboration</span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-lg text-gray-600 max-w-3xl mx-auto"
          >
            Ethiopia's premier platform connecting researchers to accelerate
            discovery and innovation.
          </motion.p>
        </motion.div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid md:grid-cols-2 gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "0px 0px -100px 0px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <FaUsers className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Who We Are
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                The{" "}
                <strong className="text-gray-900">
                  Researcher Collaboration Portal
                </strong>{" "}
                is a dedicated platform designed to empower Ethiopia's academic
                community by connecting researchers, students, and institutions
                for meaningful collaboration and knowledge exchange.
              </p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <FaBullseye className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Our Purpose
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                We break down barriers between researchers by providing
                intuitive tools to find partners, share breakthroughs, manage
                projects, and amplify the impact of academic work across
                disciplines and institutions.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              Platform Features
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-gray-600 max-w-2xl mx-auto"
            >
              Discover tools designed to enhance your research experience
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <FeatureCard icon={FaHandshake} title="Find Collaborators">
              Connect with researchers across diverse fields and institutions.
            </FeatureCard>
            <FeatureCard icon={FaBookOpen} title="Share Publications">
              Upload and discover research papers, articles, and presentations.
            </FeatureCard>
            <FeatureCard icon={FaProjectDiagram} title="Manage Projects">
              Organize and track collaborative research projects efficiently.
            </FeatureCard>
            <FeatureCard icon={FaUsers} title="Build Your Profile">
              Showcase your expertise, publications, and research impact.
            </FeatureCard>
            <FeatureCard icon={FaComments} title="Connect & Communicate">
              Engage through messaging and real-time chat with collaborators.
            </FeatureCard>
            <FeatureCard icon={FaStar} title="Recognize Peers">
              Endorse skills and recommend colleagues for their contributions.
            </FeatureCard>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 px-6 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid md:grid-cols-2 gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <FaBullseye className="text-white" />
                </div>
                <h2 className="text-2xl font-semibold">Our Mission</h2>
              </div>
              <p className="text-blue-100 leading-relaxed">
                To cultivate an intelligent, inclusive research ecosystem that
                accelerates knowledge exchange and drives academic progress
                within Ethiopia and beyond.
              </p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <FaRocket className="text-white" />
                </div>
                <h2 className="text-2xl font-semibold">Our Vision</h2>
              </div>
              <p className="text-blue-100 leading-relaxed">
                To be Ethiopia's definitive digital research commons, empowering
                generations of scientists and innovators by bridging
                disciplinary and institutional boundaries.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              Our Core Values
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-gray-600 max-w-2xl mx-auto"
            >
              Principles that guide everything we do
            </motion.p>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {values.map((value) => (
              <FeatureCard
                key={value.title}
                icon={value.icon}
                title={value.title}
              >
                {value.description}
              </FeatureCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              Meet Our Team
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-gray-600 max-w-2xl mx-auto"
            >
              The passionate people behind this initiative
            </motion.p>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {teamMembers.map((member) => (
              <motion.div
                key={member.id}
                variants={itemVariants}
                className="bg-white p-8 rounded-xl text-center"
              >
                <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-6 overflow-hidden">
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.src = "/default-avatar.png")}
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-blue-600 mb-4">{member.role}</p>
                <div className="flex justify-center space-x-4">
                  {member.social?.linkedin && (
                    <a
                      href={member.social.linkedin}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      aria-label={`${member.name} LinkedIn`}
                    >
                      <FaLinkedin size={18} />
                    </a>
                  )}
                  {member.social?.twitter && (
                    <a
                      href={member.social.twitter}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      aria-label={`${member.name} Twitter`}
                    >
                      <FaTwitter size={18} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-white">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.h2
            variants={itemVariants}
            className="text-3xl font-bold text-gray-900 mb-5"
          >
            Ready to Join Our Research Community?
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-gray-600 mb-8 max-w-2xl mx-auto"
          >
            Connect with researchers across Ethiopia and beyond to advance your
            work.
          </motion.p>
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              to="/signup"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/projects"
              className="px-8 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Browse Projects
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
};

export default AboutUs;
