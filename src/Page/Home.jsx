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
} from "react-icons/fa";
import { RiTeamFill, RiSeedlingLine } from "react-icons/ri";
import { BsGraphUp, BsShieldCheck } from "react-icons/bs";
import { FiGlobe } from "react-icons/fi";

// Animation Variants
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

// Card Components
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

const EventCard = ({ event }) => (
  <motion.div
    variants={itemVariants}
    className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200"
  >
    <div className="h-40 bg-gray-100 overflow-hidden">
      <img
        src={event.image || "/default-event.jpg"}
        alt={event.title}
        className="w-full h-full object-cover"
      />
    </div>
    <div className="p-4">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
          {event.type}
        </span>
        <div className="flex items-center text-xs text-gray-500">
          <FaCalendarAlt className="mr-1" />
          {event.date}
        </div>
      </div>
      <h3 className="font-medium text-gray-800 mb-2">{event.title}</h3>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {event.description}
      </p>
      <a
        href={event.link}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
      >
        Learn more <FaArrowRight className="ml-1 text-xs" />
      </a>
    </div>
  </motion.div>
);

const ResearcherCard = ({ researcher }) => (
  <motion.div
    variants={itemVariants}
    className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200 text-center"
  >
    <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden mx-auto mb-3">
      <img
        src={researcher.image || "/default-avatar.png"}
        alt={researcher.name}
        className="w-full h-full object-cover"
      />
    </div>
    <h3 className="font-semibold text-gray-800">{researcher.name}</h3>
    <p className="text-sm text-blue-600 mb-2">{researcher.title}</p>
    <p className="text-xs text-gray-500 mb-3">{researcher.institution}</p>
    <div className="flex justify-center space-x-2">
      <a
        href={researcher.linkedin}
        className="text-gray-400 hover:text-blue-600"
      >
        <FaLinkedin />
      </a>
      <a
        href={researcher.twitter}
        className="text-gray-400 hover:text-blue-400"
      >
        <FaTwitter />
      </a>
    </div>
  </motion.div>
);

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Sample data
  const features = [
    {
      icon: <RiTeamFill className="text-xl" />,
      title: "Find Collaborators",
      description:
        "Connect with researchers across disciplines and institutions",
    },
    {
      icon: <FaBookOpen className="text-xl" />,
      title: "Share Publications",
      description: "Upload and discover research papers and articles",
    },
    {
      icon: <BsGraphUp className="text-xl" />,
      title: "Manage Projects",
      description: "Organize and track collaborative research projects",
    },
    {
      icon: <BsShieldCheck className="text-xl" />,
      title: "Secure Workspace",
      description: "Encrypted tools with version control and task management",
    },
  ];

  const events = [
    {
      id: 1,
      type: "Conference",
      title: "African AI Research Summit 2023",
      date: "Nov 15-17",
      description: "Join leading AI researchers from across the continent",
      link: "#",
      image: "/ai-summit.jpg",
    },
    {
      id: 2,
      type: "Workshop",
      title: "Data Visualization Techniques",
      date: "Oct 20",
      description: "Hands-on workshop covering cutting-edge tools",
      link: "#",
      image: "/data-viz.jpg",
    },
    {
      id: 3,
      type: "Call for Papers",
      title: "Journal of Sustainable Development",
      date: "Dec 1",
      description: "Seeking original research on water scarcity solutions",
      link: "#",
      image: "/journal-cfp.jpg",
    },
  ];

  const researchers = [
    {
      id: 1,
      name: "Dr. Almaz Bekele",
      title: "Lead Researcher",
      institution: "Addis Ababa University",
      linkedin: "#",
      twitter: "#",
      image: "/researcher1.jpg",
    },
    {
      id: 2,
      name: "Prof. Tesfaye Lemma",
      title: "Professor of Computer Science",
      institution: "Arba Minch University",
      linkedin: "#",
      image: "/researcher2.jpg",
    },
    {
      id: 3,
      name: "Dr. Sara Gebre",
      title: "Postdoctoral Fellow",
      institution: "University of Nairobi",
      twitter: "#",
      image: "/researcher3.jpg",
    },
  ];

  const testimonials = [
    {
      id: 1,
      name: "Dr. Amanuel Tesfaye",
      title: "Researcher, AAU",
      quote:
        "This platform transformed how I find collaborators. Essential tool!",
      image: "/testimonial1.jpg",
    },
    {
      id: 2,
      name: "Prof. Mulu Alemayehu",
      title: "Professor, UoG",
      quote:
        "The collaboration tools saved countless hours coordinating our team.",
      image: "/testimonial2.jpg",
    },
    {
      id: 2,
      name: "Prof. Anuwar Addisu",
      title: "Professor, UoG",
      quote:
        "its a great platform for researchers to collaborate and share knowledge.",
      image: "/testimonial2.jpg",
    },
  ];

  // Auto-rotate testimonials
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
        <div className="absolute inset-0 opacity-10 bg-[url('/pattern.svg')]"></div>
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
                className="bg-white text-blue-800 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Join Now
              </button>
              <button
                onClick={() => navigate("/explore")}
                className="bg-transparent border-2 border-white text-white py-3 px-8 rounded-lg hover:bg-white/10 transition-colors"
              >
                Explore Projects
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Partners Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="py-8 bg-white shadow-sm -mt-16 relative z-20 mx-6 rounded-lg"
      >
        <div className="container mx-auto">
          <p className="text-center text-sm text-gray-500 mb-6">
            TRUSTED BY LEADING INSTITUTIONS
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-70">
            {["aau", "amu", "uog", "uon"].map((uni) => (
              <img
                key={uni}
                src={`/${uni}-logo.png`}
                alt={`${uni.toUpperCase()} logo`}
                className="h-10 object-contain"
                onError={(e) => (e.target.style.display = "none")}
              />
            ))}
          </div>
        </div>
      </motion.section>

      {/* Search Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl font-bold text-center mb-8 text-gray-800"
            >
              Find Collaboration Opportunities
            </motion.h2>
            <motion.div variants={itemVariants} className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search collaborators, projects, publications..."
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors">
                Search
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true }}
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
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Events Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true }}
          >
            <div className="flex justify-between items-center mb-8">
              <motion.h2
                variants={itemVariants}
                className="text-3xl font-bold text-gray-800"
              >
                Upcoming Events
              </motion.h2>
              <motion.a
                variants={itemVariants}
                href="/events"
                className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
              >
                View all <FaArrowRight className="ml-1" />
              </motion.a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Researchers Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true }}
          >
            <div className="flex justify-between items-center mb-8">
              <motion.h2
                variants={itemVariants}
                className="text-3xl font-bold text-gray-800"
              >
                Featured Collaborators
              </motion.h2>
              <motion.a
                variants={itemVariants}
                href="/researchers"
                className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
              >
                View all <FaArrowRight className="ml-1" />
              </motion.a>
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
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl font-bold mb-12 text-gray-800"
            >
              What Our Users Say
            </motion.h2>

            <div className="relative h-64">
              <AnimatePresence mode="wait">
                {testimonials.map(
                  (testimonial, index) =>
                    activeTestimonial === index && (
                      <motion.div
                        key={testimonial.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-8"
                      >
                        <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                          <img
                            src={testimonial.image}
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="max-w-2xl relative">
                          <FaQuoteLeft className="absolute -top-6 left-0 text-blue-200 text-3xl" />
                          <blockquote className="text-lg italic text-gray-700 mb-4">
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

            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    activeTestimonial === index ? "bg-blue-600" : "bg-gray-300"
                  }`}
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
            viewport={{ once: true }}
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
                className="bg-white text-blue-800 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Get Started Free
              </button>
              <button
                onClick={() => navigate("/contact")}
                className="bg-transparent border-2 border-white text-white py-3 px-8 rounded-lg hover:bg-white/10 transition-colors"
              >
                Contact Us
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-2">
        <div className="container mx-auto px-1">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-1">
            <div>
              <h3 className="text-white font-semibold mb-4">
                searcher Collaboration Portal
              </h3>
              <p className="text-sm">
                Connecting innovators across Africa to foster collaboration and
                accelerate discovery.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Explore</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/projects" className="hover:text-white">
                    Projects
                  </Link>
                </li>

                <li>
                  <Link to="/resources" className="hover:text-white">
                    Resources
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/about" className="hover:text-white">
                    About Us
                  </Link>
                </li>

                <li>
                  <Link to="/terms" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white">
                  <FaTwitter />
                </a>
                <a href="#" className="hover:text-white">
                  <FaLinkedin />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            © {new Date().getFullYear()} Researcher Collaboration Portal. All
            rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
