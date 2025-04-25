import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaStar,
  FaHeart,
  FaEye,
  FaSearch,
  FaRegBookmark,
  FaBookmark,
  FaUniversity,
  FaGraduationCap,
} from "react-icons/fa";
import { IoMdNotificationsOutline, IoMdNotifications } from "react-icons/io";
import { RiTeamFill } from "react-icons/ri";
import { BsGraphUp, BsCalendarCheck } from "react-icons/bs";

const Home = () => {
  const navigate = useNavigate();
  const [publications, setPublications] = useState([]);
  const [refreshPublications, setRefreshPublications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOptions, setFilterOptions] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingPublications, setLoadingPublications] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [savedPublications, setSavedPublications] = useState([]);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New collaboration request",
      message: "Dr. Smith wants to collaborate on your AI research",
      read: false,
      date: "2025-04-10",
    },
    {
      id: 2,
      title: "Publication update",
      message: "Your paper has been cited 5 times this week",
      read: true,
      date: "2025-04-08",
    },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const observer = useRef();

  const testimonials = [
    {
      id: 1,
      name: "Dr. Amanuel Tesfaye",
      title: "Neuroscience Researcher, Addis Ababa University",
      image: "/assets/researcher1.jpg",
      quote:
        "This platform transformed how I find collaborators. Within weeks of joining, I connected with three researchers working on complementary projects to mine.",
      rating: 5,
    },
    {
      id: 2,
      name: "Prof. Mulu Alemayehu",
      title: "Professor of Computer Science, University of Gondar",
      image: "/assets/researcher2.jpg",
      quote:
        "The collaboration tools saved me countless hours. Our cross-institutional team now coordinates seamlessly through the platform's integrated workspace.",
      rating: 4,
    },
    {
      id: 3,
      name: "Dr. John Samuel",
      title: "Senior Research Fellow, African Institute of Technology",
      image: "/assets/researcher3.jpg",
      quote:
        "As an early-career researcher, finding mentors was challenging. This platform connected me with senior researchers who guided my work.",
      rating: 5,
    },
  ];

  const researchCategories = [
    {
      name: "Artificial Intelligence",
      icon: <BsGraphUp className="text-2xl" />,
      color: "bg-purple-100 text-purple-800",
    },
    {
      name: "Data Science",
      icon: <FaGraduationCap className="text-2xl" />,
      color: "bg-blue-100 text-blue-800",
    },
    {
      name: "Cybersecurity",
      icon: <RiTeamFill className="text-2xl" />,
      color: "bg-green-100 text-green-800",
    },
    {
      name: "Biomedical Research",
      icon: <FaUniversity className="text-2xl" />,
      color: "bg-red-100 text-red-800",
    },
    {
      name: "Climate Science",
      icon: <BsCalendarCheck className="text-2xl" />,
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      name: "Social Sciences",
      icon: <FaGraduationCap className="text-2xl" />,
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      name: "Machine Learning",
      icon: <BsGraphUp className="text-2xl" />,
      color: "bg-pink-100 text-pink-800",
    },
    {
      name: "Public Health",
      icon: <RiTeamFill className="text-2xl" />,
      color: "bg-teal-100 text-teal-800",
    },
  ];

  const filteredPublications = publications.filter((publication) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (publication.title?.toLowerCase().includes(searchTermLower) ||
        publication.author?.toLowerCase().includes(searchTermLower) ||
        publication.abstract?.toLowerCase().includes(searchTermLower) ||
        publication.keywords?.some((kw) =>
          kw.toLowerCase().includes(searchTermLower)
        )) &&
      Object.keys(filterOptions).every(
        (key) =>
          filterOptions[key] === "" ||
          (Array.isArray(publication[key])
            ? publication[key].includes(filterOptions[key])
            : publication[key] === filterOptions[key])
      )
    );
  });

  const lastPublicationElementRef = useCallback(
    (node) => {
      if (loadingPublications) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && filteredPublications.length > 0) {
          setCurrentPage((prevPageNumber) => prevPageNumber + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingPublications, filteredPublications]
  );

  const handleGetStartedClick = () => {
    navigate("/login");
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(
        `Thank you, ${data.name}! Your message has been sent successfully. We'll respond within 2 business days.`
      );
      e.target.reset();
    } catch (error) {
      alert("Failed to send message. Please try again later.");
    }
  };

  const toggleSavePublication = (pubId) => {
    setSavedPublications((prev) =>
      prev.includes(pubId)
        ? prev.filter((id) => id !== pubId)
        : [...prev, pubId]
    );
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    // Mark notifications as read when opened
    if (!showNotifications) {
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
    }
  };

  useEffect(() => {
    const fetchPublicationsData = async () => {
      setLoadingPublications(true);
      setApiError(null);
      try {
        // More realistic mock data
        await new Promise((resolve) => setTimeout(resolve, 800));
        const mockData = Array(8)
          .fill()
          .map((_, i) => {
            const categories = [
              "Artificial Intelligence",
              "Data Science",
              "Neuroscience",
              "Climate Science",
              "Biomedical Engineering",
            ];
            const keywords = [
              ["machine learning", "deep learning", "neural networks"],
              ["data analysis", "statistics", "big data"],
              ["cognitive science", "brain imaging", "psychology"],
              ["climate change", "sustainability", "environment"],
              ["biomechanics", "tissue engineering", "medical devices"],
            ];
            const institutions = [
              "Addis Ababa University",
              "University of Johannesburg",
              "Makerere University",
              "University of Nairobi",
              "Stellenbosch University",
            ];
            const index = i % 5;

            return {
              id: `${Date.now()}-${currentPage}-${i}`,
              title: `${
                [
                  "Advancements in Quantum Machine Learning Algorithms",
                  "Longitudinal Study of Cognitive Development in Adolescents",
                  "Novel Approaches to Climate-Resilient Agriculture",
                  "Biodegradable Neural Implants for Neurorehabilitation",
                  "Cross-Cultural Analysis of Digital Privacy Concerns",
                ][index]
              }`,
              author: `${
                [
                  "Dr. Alemayehu Kebede",
                  "Prof. Nomsa Dlamini",
                  "Dr. Jamal Mohammed",
                  "Dr. Wanjiku Mwangi",
                  "Prof. Pieter van der Merwe",
                ][index]
              }`,
              institution: institutions[index],
              abstract: `This study presents groundbreaking findings in ${
                [
                  "quantum computing applications for machine learning, demonstrating a 40% improvement in optimization tasks.",
                  "cognitive development patterns across diverse socioeconomic groups, with implications for educational policy.",
                  "sustainable agricultural practices that increased yields by 35% while reducing water usage in semi-arid regions.",
                  "biocompatible materials that degrade safely while providing critical neural support during rehabilitation.",
                  "privacy perception differences between collectivist and individualist cultures in the digital age.",
                ][index]
              } The research involved ${
                [
                  "a novel hybrid quantum-classical algorithm tested across multiple benchmark datasets.",
                  "a 5-year longitudinal study tracking 1,200 participants from diverse backgrounds.",
                  "field trials across 15 sites in East Africa with rigorous control conditions.",
                  "in vitro and in vivo testing with promising results for clinical applications.",
                  "survey data from 8 countries analyzed through cultural dimensions theory.",
                ][index]
              }`,
              category: categories[index],
              keywords: keywords[index],
              likes: Math.floor(Math.random() * 100),
              views: Math.floor(Math.random() * 500),
              citations: Math.floor(Math.random() * 50),
              publicationDate: `202${5 - (index % 3)}-${String(
                index + 1
              ).padStart(2, "0")}-${String(((i * 2) % 28) + 1).padStart(
                2,
                "0"
              )}`,
              collaborationOpportunities: [
                "Seeking data scientists",
                "Looking for field researchers",
                "Need clinical trial partners",
                "Requesting survey participants",
              ][index % 4],
            };
          });

        setPublications((prev) => [...prev, ...mockData]);
      } catch (error) {
        console.error("Error fetching publications:", error);
        setApiError("Failed to load publications. Please try again later.");
      } finally {
        setLoadingPublications(false);
      }
    };
    fetchPublicationsData();
  }, [currentPage, refreshPublications]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const HowItWorks = () => {
    const steps = [
      {
        title: "1. Create Your Research Profile",
        description:
          "Showcase your expertise, publications, and research interests in a comprehensive profile.",
        icon: <FaGraduationCap className="text-4xl mb-4 text-blue-600" />,
        delay: 0,
      },
      {
        title: "2. Discover & Connect",
        description:
          "Find collaborators using advanced filters or let our AI suggest perfect matches.",
        icon: <RiTeamFill className="text-4xl mb-4 text-green-600" />,
        delay: 0.2,
      },
      {
        title: "3. Collaborate Seamlessly",
        description:
          "Use our integrated workspace with version control, task management, and secure file sharing.",
        icon: <BsGraphUp className="text-4xl mb-4 text-purple-600" />,
        delay: 0.4,
      },
      {
        title: "4. Publish & Grow",
        description:
          "Get support for co-authoring, peer review, and dissemination of your joint research.",
        icon: <FaBookmark className="text-4xl mb-4 text-red-600" />,
        delay: 0.6,
      },
    ];

    return (
      <div>
        {/* How It Works Section */}
        <section className="py-16 px-6 bg-white">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold mb-12 text-center text-gray-800"
          >
            How Research Collaboration Works
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: step.delay, duration: 0.5 }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 border border-gray-100"
              >
                <div className="flex flex-col items-center">
                  {step.icon}
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-center">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Research Categories Section */}
        <section className="py-16 px-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold mb-12 text-center text-gray-800"
          >
            Explore Research Domains
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {researchCategories.map((category, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${category.color} p-6 rounded-2xl shadow-md hover:shadow-lg flex flex-col items-center cursor-pointer transition-all`}
              >
                <div className="mb-3">{category.icon}</div>
                <h3 className="text-lg font-medium text-center">
                  {category.name}
                </h3>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="text-5xl font-bold text-blue-600 mb-2">
                4,200+
              </div>
              <div className="text-gray-600">Active Researchers</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="text-5xl font-bold text-green-600 mb-2">
                1,500+
              </div>
              <div className="text-gray-600">Collaborations Formed</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <div className="text-5xl font-bold text-purple-600 mb-2">
                300+
              </div>
              <div className="text-gray-600">Institutions</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center"
            >
              <div className="text-5xl font-bold text-red-600 mb-2">50+</div>
              <div className="text-gray-600">Countries</div>
            </motion.div>
          </div>
        </section>

        {/* About Us Section */}
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold mb-12 text-center text-gray-800"
            >
              About Researcher Collaboration Portal
            </motion.h2>

            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="lg:w-1/2"
              >
                <div className="bg-white p-8 rounded-3xl shadow-lg">
                  <h3 className="text-2xl font-semibold mb-4 text-gray-800">
                    Our Mission
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Researcher Collaboration Portal was founded in 2020 to break
                    down barriers in academic collaboration. We believe
                    groundbreaking research happens when diverse minds connect
                    across disciplines and borders.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Our platform combines sophisticated matching algorithms with
                    intuitive tools to help researchers at all career stages
                    find the right partners and work together effectively.
                  </p>
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Why Choose Researcher Collaboration Portal?
                    </h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      <li>Verified academic profiles</li>
                      <li>Secure collaboration environment</li>
                      <li>Funding opportunity alerts</li>
                      <li>Multilingual support</li>
                      <li>Dedicated success team</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="lg:w-1/2"
              >
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-lg">
                  <h3 className="text-2xl font-semibold mb-4">Our Team</h3>
                  <p className="mb-6 leading-relaxed">
                    We're a diverse team of researchers, developers, and
                    collaboration experts passionate about advancing science
                    through connection.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/10 p-4 rounded-xl">
                      <div className="font-medium mb-1">Dr. Sarah Johnson</div>
                      <div className="text-sm opacity-80">
                        Co-Founder, Neuroscientist
                      </div>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl">
                      <div className="font-medium mb-1">Prof. Kwame Osei</div>
                      <div className="text-sm opacity-80">
                        Co-Founder, Computer Scientist
                      </div>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl">
                      <div className="font-medium mb-1">Amina Mohammed</div>
                      <div className="text-sm opacity-80">Head of Product</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl">
                      <div className="font-medium mb-1">David Zhang</div>
                      <div className="text-sm opacity-80">Lead Developer</div>
                    </div>
                  </div>
                  <button className="bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors">
                    Meet the Full Team
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-semibold mb-12 text-center text-gray-800">
              Contact Our Team
            </h2>
            <div className="flex flex-col lg:flex-row gap-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="lg:w-1/2"
              >
                <div className="bg-gray-50 p-8 rounded-3xl h-full">
                  <h3 className="text-2xl font-semibold mb-6 text-gray-800">
                    Get In Touch
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Email</h4>
                      <p className="text-blue-600">
                        contact@Researcher Collaboration Portal.org
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Phone</h4>
                      <p className="text-gray-800">+251 (910698621) </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Headquarters
                      </h4>
                      <p className="text-gray-800">
                        Innovation Hub, Research Park
                      </p>
                      <p className="text-gray-800">AMU Ethiopia</p>
                    </div>
                    <div></div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="lg:w-1/2"
              >
                <form
                  className="bg-gray-50 p-8 rounded-3xl"
                  onSubmit={handleContactSubmit}
                  aria-label="Contact Form"
                >
                  <h3 className="text-2xl font-semibold mb-6 text-gray-800">
                    Send Us a Message
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        aria-label="Your Name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        aria-label="Your Email"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        required
                        className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        aria-label="Message Subject"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows="5"
                        required
                        className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        aria-label="Your Message"
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                      aria-label="Send Message"
                    >
                      Send Message
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Researcher Collaboration Portal
                </h3>
                <p className="text-gray-400">
                  Connecting researchers across Africa and beyond to accelerate
                  scientific discovery.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Home
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Publications
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Researchers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Funding
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Resources</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Research Tools
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Collaboration Guide
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      FAQs
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Connect With Us</h4>
                <div className="flex space-x-4 mb-4">
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <span className="sr-only">Twitter</span>
                    <svg
                      className="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <span className="sr-only">LinkedIn</span>
                    <svg
                      className="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <span className="sr-only">Facebook</span>
                    <svg
                      className="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </div>
                <p className="text-gray-400">
                  Subscribe to our newsletter for updates
                </p>
                <div className="mt-2 flex">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="px-4 py-2 rounded-l-lg focus:outline-none text-gray-900 w-full"
                  />
                  <button className="bg-blue-600 px-4 py-2 rounded-r-lg hover:bg-blue-700 transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>
                © 2025 Researcher Collaboration Portal. All rights reserved. |
                <a href="#" className="hover:text-white ml-2 transition-colors">
                  Privacy Policy
                </a>{" "}
                |
                <a href="#" className="hover:text-white ml-2 transition-colors">
                  Terms of Service
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 font-sans overflow-hidden">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                >
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">
                      Notifications
                    </h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 ${
                            !notification.read ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {notification.message}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {notification.date}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No new notifications
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-center border-t border-gray-200">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View All
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-32 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/science-pattern.svg')] bg-repeat opacity-20"></div>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight"
          >
            Accelerate Research Through{" "}
            <span className="text-blue-300">Collaboration</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Connect with researchers across Africa and beyond to solve complex
            challenges and drive innovation.
          </motion.p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="bg-white text-blue-600 font-bold py-4 px-8 rounded-full hover:bg-blue-100 transition-colors shadow-lg"
              onClick={handleGetStartedClick}
            >
              Join Now - It's Free
            </motion.button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute -bottom-20 left-0 right-0 flex justify-center"
        >
          <div className="bg-white rounded-t-3xl shadow-2xl w-full max-w-5xl h-24 flex items-center justify-center">
            <div className="flex space-x-8">
              {[
                {
                  name: "Amu ",
                  logo: "/assets/harvard-logo.png",
                },
                {
                  name: "University of Cape Town",
                  logo: "/assets/uct-logo.png",
                },
                {
                  name: "African Academy of Sciences",
                  logo: "/assets/aas-logo.png",
                },
                { name: "ETH Zurich", logo: "/assets/eth-logo.png" },
              ].map((uni, index) => (
                <motion.img
                  key={index}
                  src={uni.logo}
                  alt={uni.name}
                  className="h-12 object-contain opacity-70 hover:opacity-100 transition-opacity"
                  whileHover={{ scale: 1.1 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="py-12 px-6 bg-white mt-20">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl font-semibold mb-8 text-center text-gray-800"
          >
            Discover Research Opportunities
          </motion.h2>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-2/3">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search publications, researchers, or keywords..."
                  className="w-full pl-12 p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex w-full md:w-auto space-x-2">
                <select
                  className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  onChange={(e) =>
                    setFilterOptions({
                      ...filterOptions,
                      category: e.target.value,
                    })
                  }
                >
                  <option value="">All Categories</option>
                  <option value="Artificial Intelligence">AI</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Neuroscience">Neuroscience</option>
                  <option value="Climate Science">Climate Science</option>
                  <option value="Biomedical Engineering">Biomedical</option>
                </select>
                <button className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                  Advanced Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl font-semibold mb-12 text-center text-gray-800"
          >
            Why Researchers Choose Our Platform
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Intelligent Matching",
                description:
                  "Our AI suggests collaborators based on your research profile and interests.",
                icon: (
                  <svg
                    className="w-10 h-10 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    ></path>
                  </svg>
                ),
                color: "bg-blue-100",
              },
              {
                title: "Secure Workspace",
                description:
                  "End-to-end encrypted collaboration tools with version control and task management.",
                icon: (
                  <svg
                    className="w-10 h-10 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    ></path>
                  </svg>
                ),
                color: "bg-green-100",
              },
              {
                title: "Funding Network",
                description:
                  "Access to grants, fellowships, and partnership opportunities across Africa.",
                icon: (
                  <svg
                    className="w-10 h-10 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                ),
                color: "bg-purple-100",
              },
              {
                title: "Publication Support",
                description:
                  "Tools for co-authoring, peer review, and journal submission tracking.",
                icon: (
                  <svg
                    className="w-10 h-10 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    ></path>
                  </svg>
                ),
                color: "bg-red-100",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`${feature.color} p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow h-full`}
              >
                <div className="mb-6">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Publications Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl font-semibold mb-8 text-center text-gray-800"
          >
            Trending Research Publications
          </motion.h2>

          <div className="flex justify-between items-center mb-6">
            <div className="text-gray-600">
              Showing {filteredPublications.length} of {publications.length}{" "}
              publications
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Newest
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Most Viewed
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Top Rated
              </button>
            </div>
          </div>

          {apiError && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6"
              role="alert"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {apiError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPublications.length > 0 ? (
              filteredPublications.map((publication, index) => (
                <motion.div
                  key={publication.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden"
                  ref={
                    filteredPublications.length === index + 1
                      ? lastPublicationElementRef
                      : null
                  }
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {publication.category}
                      </span>
                      <button
                        onClick={() => toggleSavePublication(publication.id)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        aria-label={
                          savedPublications.includes(publication.id)
                            ? "Unsave publication"
                            : "Save publication"
                        }
                      >
                        {savedPublications.includes(publication.id) ? (
                          <FaBookmark className="text-blue-600" />
                        ) : (
                          <FaRegBookmark />
                        )}
                      </button>
                    </div>

                    <h4 className="text-xl font-semibold text-gray-800 mb-2 leading-snug">
                      {publication.title}
                    </h4>
                    <p className="text-gray-600 mb-2">{publication.author}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      {publication.institution} • Published{" "}
                      {publication.publicationDate}
                    </p>

                    <p className="text-gray-500 text-sm mb-6 line-clamp-3">
                      {publication.abstract}
                    </p>

                    <div className="mt-auto">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {publication.keywords.slice(0, 3).map((keyword, i) => (
                          <span
                            key={i}
                            className="bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex space-x-4">
                          <span className="flex items-center">
                            <FaEye className="mr-1" /> {publication.views}
                          </span>
                          <span className="flex items-center">
                            <FaHeart className="mr-1" /> {publication.likes}
                          </span>
                          <span className="flex items-center">
                            <FaStar className="mr-1" /> {publication.citations}
                          </span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {loadingPublications
                    ? "Loading publications..."
                    : "No publications found"}
                </h3>
                <p className="mt-1 text-gray-500">
                  {loadingPublications
                    ? "We're fetching the latest research for you..."
                    : "Try adjusting your search or filter criteria"}
                </p>
                {!loadingPublications && (
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterOptions({});
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {loadingPublications && (
            <div className="col-span-full text-center py-8">
              <div className="animate-pulse flex justify-center">
                <div className="h-8 w-8 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-3xl font-semibold mb-12 text-center text-gray-800"
          >
            Trusted by Researchers Worldwide
          </motion.h2>

          <div className="relative">
            <div className="max-w-4xl mx-auto relative h-96">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? 100 : -100 }}
                  animate={{
                    opacity: activeTestimonial === index ? 1 : 0,
                    x:
                      activeTestimonial === index
                        ? 0
                        : index % 2 === 0
                        ? 100
                        : -100,
                    zIndex: activeTestimonial === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.5 }}
                  className={`absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-8 px-4 ${
                    activeTestimonial === index ? "" : "pointer-events-none"
                  }`}
                >
                  <div className="w-48 h-48 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden shadow-lg">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg">
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`${
                            i < testimonial.rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          } mr-1`}
                        />
                      ))}
                    </div>
                    <p className="text-xl text-gray-700 mb-6 italic leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <p className="text-lg font-semibold text-gray-800">
                        {testimonial.name}
                      </p>
                      <p className="text-blue-600">{testimonial.title}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    activeTestimonial === index
                      ? "bg-blue-600 w-6"
                      : "bg-gray-300"
                  }`}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold mb-6"
          >
            Ready to Transform Your Research?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl mb-10 max-w-2xl mx-auto"
          >
            Join thousands of researchers already accelerating their work
            through collaboration.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <button
              className="bg-white text-blue-600 font-bold py-4 px-8 rounded-full hover:bg-blue-100 transition-colors shadow-lg"
              onClick={handleGetStartedClick}
            >
              Get Started - Free Forever
            </button>
            <button className="bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors shadow-lg">
              Schedule a Demo
            </button>
          </motion.div>
        </div>
      </section>

      <HowItWorks />
    </div>
  );
};

export default Home;
