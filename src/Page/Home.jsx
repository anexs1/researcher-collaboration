import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
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

      {/* How It Works Section */}
      <section className="py-16 px-6">
        <h2 className="text-3xl font-semibold mb-12 text-center text-gray-800 animate-slide-in-left">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="step-card bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow animate-rotate">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              1. Create a Profile
            </h3>
            <p className="text-gray-600">
              Sign up and showcase your research expertise.
            </p>
          </div>
          <div className="step-card bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow animate-rotate delay-100">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              2. Find Collaboration Projects
            </h3>
            <p className="text-gray-600">
              Search for collaboration projects and apply easily.
            </p>
          </div>
          <div className="step-card bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow animate-rotate delay-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              3. Connect & Collaborate
            </h3>
            <p className="text-gray-600">
              Chat with researchers and start working on projects together.
            </p>
          </div>
        </div>
      </section>

      {/* Research Categories Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-gray-200 to-blue-200">
        <h2 className="text-3xl font-semibold mb-12 text-center text-gray-800 animate-slide-in-right">
          Explore Research Categories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="category-item bg-white p-5 rounded-3xl shadow-md hover:shadow-lg transition-transform hover:scale-105 text-center">
            Artificial Intelligence
          </div>
          <div className="category-item bg-white p-5 rounded-3xl shadow-md hover:shadow-lg transition-transform hover:scale-105 text-center">
            Data Science
          </div>
          <div className="category-item bg-white p-5 rounded-3xl shadow-md hover:shadow-lg transition-transform hover:scale-105 text-center">
            Cybersecurity
          </div>
          <div className="category-item bg-white p-5 rounded-3xl shadow-md hover:shadow-lg transition-transform hover:scale-105 text-center">
            Biomedical Research
          </div>
          <div className="category-item bg-white p-5 rounded-3xl shadow-md hover:shadow-lg transition-transform hover:scale-105 text-center">
            Climate Science
          </div>
          <div className="category-item bg-white p-5 rounded-3xl shadow-md hover:shadow-lg transition-transform hover:scale-105 text-center">
            Social Sciences
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-6">
        <h2 className="text-3xl font-semibold mb-12 text-center text-gray-800 animate-slide-in-left">
          About Us
        </h2>
        <p className="text-gray-700 leading-relaxed text-center animate-fade-in">
          The Researcher Collaboration Portal is designed to help academics and
          professionals connect effortlessly. Our platform enables seamless
          networking and collaboration for research projects.
        </p>
      </section>
      {/* Testimonials Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-gray-200 to-blue-200">
        <h2 className="text-3xl font-semibold mb-12 text-center text-gray-800 animate-slide-in-right">
          What Our Users Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="testimonial-card bg-white p-8 rounded-3xl shadow-md hover:shadow-lg transition-transform hover:scale-105 animate-fade-in"
            >
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-blue-300"
                />
                <div>
                  <h4 className="text-lg font-semibold text-gray-700">
                    {testimonial.name}
                  </h4>
                  <p className="text-gray-600">{testimonial.title}</p>
                </div>
              </div>
              <p className="text-gray-600">{testimonial.quote}</p>
            </div>
          ))}
        </div>
      </section>
      {/* FAQ Section */}
      <section className="py-16 px-6 bg-gray-100">
        <h2 className="text-3xl font-semibold mb-12 text-center text-gray-800 animate-slide-in-left">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div className="faq-card p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow animate-fade-in">
            <h3 className="text-xl font-semibold mb-4">
              How can I find a research partner?
            </h3>
            <p>
              You can browse collaboration opportunities or search for
              researchers by expertise, field, or location. The platform also
              allows you to filter researchers by their qualifications and
              previous projects to ensure the best fit.
            </p>
          </div>
          <div className="faq-card p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow animate-fade-in delay-100">
            <h3 className="text-xl font-semibold mb-4">Is my data secure?</h3>
            <p>
              Yes! We ensure end-to-end encryption for all communications. We
              follow industry best practices to secure your personal and project
              data, using secure protocols and regular security audits to
              protect your information.
            </p>
          </div>
          <div className="faq-card p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow animate-fade-in delay-200">
            <h3 className="text-xl font-semibold mb-4">
              Can I send direct messages to researchers?
            </h3>
            <p>
              Absolutely! Our platform provides real-time messaging
              functionality, allowing you to connect with researchers directly.
              You can send inquiries or project proposals through private chats.
            </p>
          </div>
          <div className="faq-card p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow animate-fade-in delay-300">
            <h3 className="text-xl font-semibold mb-4">
              How can I update my profile?
            </h3>
            <p>
              You can easily update your profile by accessing the "My Profile"
              section from your dashboard. There, you can update your
              qualifications, research interests, and contact details at any
              time.
            </p>
          </div>
          <div className="faq-card p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow animate-fade-in delay-400">
            <h3 className="text-xl font-semibold mb-4">
              What happens after I send a collaboration request?
            </h3>
            <p>
              Once you send a request, the researcher will be notified and can
              either approve or deny your request. If approved, you will be able
              to start collaborating and sharing relevant materials securely.
            </p>
          </div>
          <div className="faq-card p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow animate-fade-in delay-500">
            <h3 className="text-xl font-semibold mb-4">
              Do I need to pay to use the platform?
            </h3>
            <p>
              No, the platform is completely free for all registered users. We
              provide access to all research tools and collaboration features at
              no cost to help foster academic collaboration.
            </p>
          </div>
        </div>
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
          © 2025 Researcher Collaboration Portal. All Rights Reserved. Worked by
          G4 IT
        </p>
      </footer>
    </div>
  );
};

export default Home;
