import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import { motion } from "framer-motion";
import { FaStar, FaHeart, FaEye } from "react-icons/fa"; //Import heart and eye icon

const Home = () => {
  const navigate = useNavigate();
  const [publications, setPublications] = useState([]);
  const [refreshPublications, setRefreshPublications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOptions, setFilterOptions] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingPublications, setLoadingPublications] = useState(false);
  const [apiError, setApiError] = useState(null);

  const observer = useRef();
  const [showFullAbout, setShowFullAbout] = useState(false); // State for About Us
  const [showLess, setShowLess] = useState(true); //State for controlling height

  const testimonials = [
    {
      id: 1,
      name: "Dr. Amanuel T.",
      title: "Researcher",
      image: "/assets/react.svg",
      quote: "This platform helped me find the perfect research partner!",
    },
    {
      id: 2,
      name: "Prof. Mulu A.",
      title: "Professor",
      image: "/assets/react.svg",
      quote: "Collaborating has never been easier. Great experience!",
    },
    {
      id: 3,
      name: "Dr. John S.",
      title: "Researcher",
      image: "/assets/react.svg",
      quote: "The platform is user-friendly and connects people seamlessly!",
    },
  ];

  const filteredPublications = publications.filter((publication) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      publication.title?.toLowerCase().includes(searchTermLower) &&
      Object.keys(filterOptions).every(
        (key) =>
          filterOptions[key] === "" || publication[key] === filterOptions[key]
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
    alert("Message sent successfully!");
    e.target.reset();
  };

  useEffect(() => {
    const fetchPublicationsData = async () => {
      setLoadingPublications(true);
      setApiError(null);
      try {
        const response = await fetch(
          `/api/publications?page=${currentPage}&limit=5`
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch publications (HTTP ${response.status})`
          );
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("API returned non-array data");
        }
        setPublications((prevPublications) => [...prevPublications, ...data]);
      } catch (error) {
        console.error("Error fetching publications:", error);
        setApiError(error.message);
      } finally {
        setLoadingPublications(false);
      }
    };
    fetchPublicationsData();
  }, [currentPage, refreshPublications]);

  useEffect(() => {
    const handleNewPublicationPost = () => {
      setRefreshPublications((prev) => !prev);
    };

    window.addEventListener("newpublicationpost", handleNewPublicationPost);

    return () => {
      window.removeEventListener(
        "newpublicationpost",
        handleNewPublicationPost
      );
    };
  }, []);

  const toggleAboutSection = () => {
    setShowFullAbout(!showFullAbout);
  };

  const HowItWorks = () => {
    const steps = [
      {
        title: "1. Create a Profile",
        description: "Sign up and showcase your research expertise.",
        delay: 0,
      },
      {
        title: "2. Find Collaboration Projects",
        description: "Search for collaboration projects and apply easily.",
        delay: 0.2,
      },
      {
        title: "3. Connect & Collaborate",
        description:
          "Chat with researchers and start working on projects together.",
        delay: 0.4,
      },
    ];

    const categories = [
      "Artificial Intelligence",
      "Data Science",
      "Cybersecurity",
      "Biomedical Research",
      "Climate Science",
      "Social Sciences",
    ];

    return (
      <div>
        {/* How It Works Section */}
        <section className="py-16 px-6">
          <motion.h2
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold mb-12 text-center text-gray-800"
          >
            How It Works
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: step.delay, duration: 0.5 }}
                className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-transform hover:scale-105"
              >
                <h3 className="text-xl font-semibold mb-4 text-gray-700">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Research Categories Section */}
        <section className="py-16 px-6 bg-gradient-to-br from-gray-200 to-blue-200">
          <motion.h2
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold mb-12 text-center text-gray-800"
          >
            Explore Research Categories
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.1 }}
                className="bg-white p-5 rounded-3xl shadow-md hover:shadow-lg text-center cursor-pointer"
              >
                {category}
              </motion.div>
            ))}
          </div>
        </section>

        {/* About Us Section */}
        <section className="py-16 px-6">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold mb-12 text-center text-gray-800"
          >
            About Us
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-gray-700 leading-relaxed text-center"
          >
            The Researcher Collaboration Portal is designed to help academics
            and professionals connect effortlessly. Our platform enables
            seamless networking and collaboration for research projects.
          </motion.p>
        </section>

        {/* Contact Section */}
        <section className="py-16 px-6 bg-gradient-to-br from-gray-200 to-blue-200">
          <h2 className="text-3xl font-semibold mb-12 text-center text-gray-800 animate-slide-in-right">
            Contact Us
          </h2>
          <p className="text-gray-700 leading-relaxed text-center mb-8 animate-fade-in">
            Have any questions? Reach out to us!
          </p>
          <form
            className="max-w-md mx-auto"
            onSubmit={handleContactSubmit}
            aria-label="Contact Form"
          >
            <input
              type="text"
              placeholder="Your Name"
              required
              className="w-full p-4 rounded-md border border-gray-300 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 animate-slide-in-bottom"
              aria-label="Your Name"
            />
            <input
              type="email"
              placeholder="Your Email"
              required
              className="w-full p-4 rounded-md border border-gray-300 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 animate-slide-in-bottom delay-100"
              aria-label="Your Email"
            />
            <textarea
              placeholder="Your Message"
              rows="4"
              required
              className="w-full p-4 rounded-md border border-gray-300 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 animate-slide-in-bottom delay-200"
              aria-label="Your Message"
            ></textarea>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-md hover:bg-blue-700 transition-colors animate-pulse"
              aria-label="Send Message"
            >
              Send Message
            </button>
          </form>
        </section>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8 px-6 text-center">
          <p>
            © 2025 Researcher Collaboration Portal. All Rights Reserved. Worked
            by G4 IT
          </p>
        </footer>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-100 to-blue-100 font-sans overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-blue-600 text-white py-24 px-6 text-center">
        <div className="absolute inset-0 bg-blue-700 opacity-20 animate-pulse"></div>
        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold mb-6 animate-fade-in-down">
            Welcome to the Researcher Collaboration Portal
          </h1>
          <p className="text-xl mb-10 animate-fade-in">
            Connect, collaborate, and innovate with researchers worldwide.
          </p>
          <button
            className="bg-white text-blue-600 font-bold py-4 px-12 rounded-full hover:bg-blue-100 transition-colors animate-bounce"
            onClick={handleGetStartedClick}
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 px-6 bg-gray-100">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          <input
            type="search"
            placeholder="Search publications..."
            className="w-full md:w-1/2 p-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 animate-slide-in-bottom"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="w-full md:w-1/4 p-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 animate-slide-in-bottom delay-100"
            onChange={(e) => setFilterOptions({ category: e.target.value })}
          >
            {" "}
            {/* Adjust to publication property */}
            <option value="">All Categories</option>
            <option value="AI">Artificial Intelligence</option>
            <option value="DS">Data Science</option>
            {/* Add other categories */}
          </select>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <h2 className="text-3xl font-semibold mb-12 text-center text-gray-800 animate-slide-in-left">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="feature-card bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow animate-fade-in">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              Find Collaborators
            </h3>
            <p className="text-gray-600">
              Search for researchers based on their expertise and interests.
            </p>
          </div>
          <div className="feature-card bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow animate-fade-in delay-100">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              Post Opportunities
            </h3>
            <p className="text-gray-600">
              Create collaboration requests for specific research topics.
            </p>
          </div>
          <div className="feature-card bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow animate-fade-in delay-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              Chat & Messaging
            </h3>
            <p className="text-gray-600">
              Communicate in real-time with potential collaborators.
            </p>
          </div>
          <div className="feature-card bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow animate-fade-in delay-300">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              Secure Networking
            </h3>
            <p className="text-gray-600">
              Connect with verified researchers and maintain data privacy.
            </p>
          </div>
        </div>
      </section>

      {/* Showcase New Publications Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-gray-200 to-blue-200">
        <h2 className="text-3xl font-semibold mb-12 text-center text-gray-800 animate-slide-in-right">
          Explore the New Publications
        </h2>
        {apiError && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline">{apiError}</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPublications.length > 0 ? (
            filteredPublications.map((publication, index) => {
              if (filteredPublications.length === index + 1) {
                return (
                  <div
                    key={publication.id}
                    className="bg-white rounded-3xl shadow-md hover:shadow-lg transition-shadow animate-zoom-in"
                    ref={lastPublicationElementRef}
                  >
                    <div className="p-6 flex flex-col h-full">
                      <h4 className="text-xl font-semibold text-gray-700 mb-2">
                        {publication.title}
                      </h4>
                      <p className="text-gray-600 mb-4">
                        {publication.author || "Unknown Author"}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <button className="text-blue-600 hover:text-blue-800">
                          <FaEye className="inline-block mr-1" /> View Details
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <FaHeart className="inline-block mr-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div
                    key={publication.id}
                    className="bg-white rounded-3xl shadow-md hover:shadow-lg transition-shadow animate-zoom-in"
                  >
                    <div className="p-6 flex flex-col h-full">
                      <h4 className="text-xl font-semibold text-gray-700 mb-2">
                        {publication.title}
                      </h4>
                      <p className="text-gray-600 mb-4">
                        {publication.author || "Unknown Author"}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <button className="text-blue-600 hover:text-blue-800">
                          <FaEye className="inline-block mr-1" /> View Details
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <FaHeart className="inline-block mr-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            })
          ) : (
            <p className="text-center text-gray-500">
              No new publications to showcase yet. Check back soon!
            </p>
          )}
          {loadingPublications && <p>Loading new publications...</p>}
        </div>
      </section>
      <HowItWorks />
    </div>
  );
};

export default Home;
