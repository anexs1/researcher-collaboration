import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

const Home = () => {
  const navigate = useNavigate();
  const [newUsers, setNewUsers] = useState([]);
  const [refreshUsers, setRefreshUsers] = useState(false); // Trigger state

  // Function to navigate to the login page
  const handleGetStartedClick = () => {
    navigate("/login");
  };

  // Fetch New Users from API
  useEffect(() => {
    const fetchNewUsers = async () => {
      try {
        const response = await fetch("/api/new-users");
        if (!response.ok) {
          throw new Error("Failed to fetch new users");
        }
        const data = await response.json();
        setNewUsers(data);
      } catch (error) {
        console.error("Error fetching new users:", error);
      }
    };
    fetchNewUsers();
  }, [refreshUsers]); // Add refreshUsers as a dependency

  useEffect(() => {
    // Listen for a custom event triggered by SignupPage
    const handleNewUserSignup = () => {
      setRefreshUsers((prev) => !prev); // Toggle refreshUsers state
    };

    window.addEventListener("newusersignup", handleNewUserSignup);

    // Cleanup the event listener
    return () => {
      window.removeEventListener("newusersignup", handleNewUserSignup);
    };
  }, []);

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
            {/* Add an icon or small graphic here if you have one */}
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

      {/* Showcase New Users Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-gray-200 to-blue-200">
        <h2 className="text-3xl font-semibold mb-12 text-center text-gray-800 animate-slide-in-right">
          Meet Our New Researchers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {newUsers.length > 0 ? (
            newUsers.map((user) => (
              <div
                key={user.id}
                className="user-card bg-white p-6 rounded-3xl shadow-md hover:shadow-lg transition-shadow text-center animate-zoom-in"
              >
                <img
                  src={user.profileImage || "/assets/default-avatar.png"}
                  alt={user.username}
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-blue-300"
                />
                <h4 className="text-lg font-semibold text-gray-700">
                  {user.username}
                </h4>
                <p className="text-gray-600">
                  {user.expertise || "Researcher"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              No new researchers to showcase yet. Check back soon!
            </p>
          )}
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
          {/* Testimonial Item 1 */}
          <div className="testimonial-card bg-white p-8 rounded-3xl shadow-md hover:shadow-lg transition-transform hover:scale-105 animate-fade-in">
            <div className="flex items-center mb-4">
              <img
                src="../assets/react.svg"
                alt="Dr. Amanuel T."
                className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-blue-300"
              />
              <div>
                <h4 className="text-lg font-semibold text-gray-700">
                  Dr. Amanuel T.
                </h4>
                <p className="text-gray-600">Researcher</p>
              </div>
            </div>
            <p className="text-gray-600">
              "This platform helped me find the perfect research partner!"
            </p>
          </div>

          {/* Testimonial Item 2 */}
          <div className="testimonial-card bg-white p-8 rounded-3xl shadow-md hover:shadow-lg transition-transform hover:scale-105 animate-fade-in delay-100">
            <div className="flex items-center mb-4">
              <img
                src="../assets/react.svg"
                alt="Prof. Mulu A."
                className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-blue-300"
              />
              <div>
                <h4 className="text-lg font-semibold text-gray-700">
                  Prof. Mulu A.
                </h4>
                <p className="text-gray-600">Professor</p>
              </div>
            </div>
            <p className="text-gray-600">
              "Collaborating has never been easier. Great experience!"
            </p>
          </div>

          {/* Testimonial Item 3 */}
          <div className="testimonial-card bg-white p-8 rounded-3xl shadow-md hover:shadow-lg transition-transform hover:scale-105 animate-fade-in delay-200">
            <div className="flex items-center mb-4">
              <img
                src="../assets/react.svg"
                alt="Dr. John S."
                className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-blue-300"
              />
              <div>
                <h4 className="text-lg font-semibold text-gray-700">
                  Dr. John S.
                </h4>
                <p className="text-gray-600">Researcher</p>
              </div>
            </div>
            <p className="text-gray-600">
              "The platform is user-friendly and connects people seamlessly!"
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6">
        <h2 className="text-3xl font-semibold mb-12 text-center text-gray-800 animate-slide-in-left">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          <div className="faq-card bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow animate-fade-in">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              How can I find a research partner?
            </h3>
            <p className="text-gray-600">
              You can browse collaboration opportunities or search for
              researchers by expertise, field, or location. The platform also
              allows you to filter researchers by their qualifications and
              previous projects to ensure the best fit.
            </p>
          </div>

          <div className="faq-card bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow animate-fade-in delay-100">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              Is my data secure?
            </h3>
            <p className="text-gray-600">
              Yes! We ensure end-to-end encryption for all communications. We
              follow industry best practices to secure your personal and project
              data, using secure protocols and regular security audits to
              protect your information.
            </p>
          </div>

          <div className="faq-card bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow animate-fade-in delay-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              Can I send direct messages to researchers?
            </h3>
            <p className="text-gray-600">
              Absolutely! Our platform provides real-time messaging
              functionality, allowing you to connect with researchers directly.
              You can send inquiries or project proposals through private chats.
            </p>
          </div>

          <div className="faq-card bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow animate-fade-in delay-300">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              How can I update my profile?
            </h3>
            <p className="text-gray-600">
              You can easily update your profile by accessing the "My Profile"
              section from your dashboard. There, you can update your
              qualifications, research interests, and contact details at any
              time.
            </p>
          </div>

          <div className="faq-card bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow animate-fade-in delay-400">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              What happens after I send a collaboration request?
            </h3>
            <p className="text-gray-600">
              Once you send a request, the researcher will be notified and can
              either approve or deny your request. If approved, you will be able
              to start collaborating and sharing relevant materials securely.
            </p>
          </div>

          <div className="faq-card bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow animate-fade-in delay-500">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              Do I need to pay to use the platform?
            </h3>
            <p className="text-gray-600">
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
        <form className="max-w-md mx-auto">
          <input
            type="text"
            placeholder="Your Name"
            required
            className="w-full p-4 rounded-md border border-gray-300 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 animate-slide-in-bottom"
          />
          <input
            type="email"
            placeholder="Your Email"
            required
            className="w-full p-4 rounded-md border border-gray-300 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 animate-slide-in-bottom delay-100"
          />
          <textarea
            placeholder="Your Message"
            rows="4"
            required
            className="w-full p-4 rounded-md border border-gray-300 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 animate-slide-in-bottom delay-200"
          ></textarea>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-md hover:bg-blue-700 transition-colors animate-pulse"
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
