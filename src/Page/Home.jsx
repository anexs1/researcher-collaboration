import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Calendar from "react-calendar"; // Import react-calendar
import "react-calendar/dist/Calendar.css"; // Import default CSS
import {
  FaStar,
  FaHeart,
  FaEye,
  FaSearch,
  FaRegBookmark,
  FaBookmark,
  FaUniversity,
  FaGraduationCap,
  FaTimes,
  FaMapMarkerAlt, // Import location icon (optional)
} from "react-icons/fa";
// Removed notification icons as nav is gone
import { RiTeamFill } from "react-icons/ri";
import { BsGraphUp, BsCalendarCheck } from "react-icons/bs";
import { FiCalendar } from "react-icons/fi"; // Calendar Icon

// Custom CSS for react-calendar (keep this or integrate into your main CSS)
/*
.react-calendar {
  border: none; // Example: Remove default border
  font-family: inherit;
  width: 320px;
  max-width: 100%;
  background: white;
  line-height: 1.125em;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
// ... (rest of the calendar styles from previous example) ...
.highlight-date {
  background-color: #60a5fa !important; // Blue-400
  color: white !important;
  border-radius: 9999px; // Make it a circle
  font-weight: bold;
}
.highlight-date abbr { // Target the number inside
    color: white !important;
}
*/

// --- Helper function for styling News & Events badges based on type ---
const getTypeBadgeStyle = (type) => {
  switch (
    type?.toLowerCase() // Added optional chaining for safety
  ) {
    case "conference":
      return "bg-blue-100 text-blue-800";
    case "call for papers":
      return "bg-green-100 text-green-800";
    case "workshop":
      return "bg-purple-100 text-purple-800";
    case "news":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
// --- End Helper Function ---

const Home = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOptions, setFilterOptions] = useState({});
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [savedPublications, setSavedPublications] = useState([]); // Keep if used elsewhere

  // --- State for Calendar ---
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const calendarRef = useRef(null);
  const calendarIconRef = useRef(null);

  // --- State for Upcoming Events (Used by Corner Notifications & Calendar) ---
  const [upcomingEvents, setUpcomingEvents] = useState([
    {
      id: `evt-${Date.now()}-1`,
      title: "AI Ethics & Governance Webinar",
      date: "2025-08-15",
      time: "14:00 UTC",
      description: "Join experts discussing the future of AI ethics.",
    },
    {
      id: `evt-${Date.now()}-2`,
      title: "Climate Data Hackathon Kick-off",
      date: "2025-08-22",
      time: "09:00 UTC",
      description: "Collaborate on analyzing climate change data.",
    },
    {
      id: `evt-${Date.now()}-3`,
      title: "Grant Writing Workshop",
      date: new Date().toISOString().split("T")[0],
      time: "11:00 UTC",
      description: "Learn tips for successful grant applications.",
    },
    {
      id: `evt-${Date.now()}-4`,
      title: "Quantum Computing Seminar",
      date: "2025-09-10",
      time: "16:00 UTC",
      description: "Exploring the latest breakthroughs.",
    },
  ]);
  // Extract dates for calendar highlighting (Recalculated on re-render)
  const eventDates = upcomingEvents.map((event) => event.date);
  // -----------------------------------------------------------------------

  // --- State/Data for News & Events ---
  const [newsAndEventsData, setNewsAndEventsData] = useState([
    {
      id: "ne1",
      type: "Conference", // Type for styling/filtering
      title: "Pan-African AI Research Summit 2025",
      date: "2025-11-10",
      location: "Nairobi, Kenya & Online",
      description:
        "Join leading AI researchers from across the continent to discuss the future of artificial intelligence in Africa. Keynotes, workshops, and networking opportunities.",
      link: "#", // Replace with actual link
      image: "/assets/conference_image_1.jpg", // Replace with actual image path
    },
    {
      id: "ne2",
      type: "Call for Papers",
      title:
        "Journal of Sustainable Development - Special Issue: Water Scarcity",
      date: "2025-10-15", // Usually a deadline
      location: "Submission Deadline",
      description:
        "Seeking original research articles and reviews focusing on innovative solutions and policies for water scarcity challenges in arid and semi-arid regions.",
      link: "#",
      image: "/assets/journal_cfp.jpg",
    },
    {
      id: "ne3",
      type: "Workshop",
      title: "Advanced Data Visualization Techniques Workshop",
      date: "2025-09-20",
      location: "Online",
      description:
        "Hands-on workshop covering cutting-edge data visualization tools and best practices for researchers. Limited spots available.",
      link: "#",
      image: "/assets/workshop_data_viz.jpg", // Example image path
    },
    {
      id: "ne4",
      type: "News",
      title: "Collaboration Portal Reaches 5,000 Active Researchers",
      date: "2025-08-01",
      location: "Platform Update",
      description:
        "We're thrilled to announce a major milestone! Our community continues to grow, fostering more cross-border collaborations than ever before.",
      link: "#",
      // No image for this news item example
    },
    {
      id: "ne5",
      type: "Conference",
      title: "Global Health Innovations Forum",
      date: "2025-12-05",
      location: "Cape Town, South Africa",
      description:
        "Explore breakthroughs in medical technology, public health policy, and collaborative research models impacting global health outcomes.",
      link: "#",
      image: "/assets/conference_health.jpg",
    },
    {
      id: "ne6",
      type: "Call for Papers",
      title: "International Conference on Renewable Energy (ICRE 2026)",
      date: "2025-11-30", // Deadline
      location: "Accra, Ghana (Conference in 2026)",
      description:
        "Submit abstracts for ICRE 2026. Topics include solar, wind, geothermal, biomass, and energy policy in emerging economies.",
      link: "#",
      // No image
    },
  ]);
  // ---------------------------------------

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

  const handleGetStartedClick = () => {
    navigate("/login");
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(
        `Thank you, ${data.name}! Your message has been sent successfully.`
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

  // --- Function to remove an event (for corner notifications) ---
  const removeEvent = (eventId) => {
    setUpcomingEvents((prevEvents) =>
      prevEvents.filter((event) => event.id !== eventId)
    );
  };
  // -------------------------------------------------------------

  // --- Calendar Tile Highlighting ---
  const getTileClassName = ({ date, view }) => {
    if (view === "month") {
      const dateString = date.toISOString().split("T")[0];
      if (eventDates.includes(dateString)) {
        return "highlight-date";
      }
    }
    return null;
  };
  // --------------------------------

  // --- Close calendar dropdown on outside click ---
  useEffect(() => {
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);
  // --------------------------------------------------

  // --- Testimonial cycling ---
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [testimonials.length]);
  // ---------------------------

  // --- Add new event periodically for corner notifications ---
  useEffect(() => {
    const eventInterval = setInterval(() => {
      const newEventId = `evt-${Date.now()}-${upcomingEvents.length + 1}`;
      const potentialEvents = [
        {
          title: "Bioinformatics Workshop",
          date: "2025-09-12",
          time: "10:00 UTC",
          description: "Hands-on sequence analysis.",
        },
        {
          title: "Research Ethics Forum",
          date: "2025-09-18",
          time: "13:00 UTC",
          description: "Discussing responsible conduct.",
        },
        {
          title: "Open Science Meetup",
          date: "2025-09-25",
          time: "18:00 UTC",
          description: "Networking for open research advocates.",
        },
      ];
      if (upcomingEvents.length < 5) {
        // Add only if less than 5 events
        const newEvent = {
          id: newEventId,
          ...potentialEvents[
            Math.floor(Math.random() * potentialEvents.length)
          ],
        };
        setUpcomingEvents((prevEvents) => [...prevEvents, newEvent]);
      }
    }, 20000); // Add a new event every 20 seconds (adjust as needed)

    return () => clearInterval(eventInterval); // Cleanup interval
  }, [upcomingEvents.length]); // Depend on length to re-evaluate adding
  // ---------------------------------------------------------

  // --- News & Events Section Component ---
  const NewsAndEventsSection = ({ data }) => (
    <section className="py-16 px-6 bg-white">
      {" "}
      {/* White background for contrast */}
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl font-semibold mb-12 text-center text-gray-800"
        >
          News & Events
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.length > 0 ? (
            data.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden flex flex-col" // Ensure flex column layout
              >
                {/* Optional Image */}
                {item.image && (
                  <img
                    src={item.image}
                    alt={`${item.title} image`}
                    className="w-full h-48 object-cover" // Fixed height for consistency
                    onError={(e) => {
                      e.target.style.display = "none";
                    }} // Hide broken images
                  />
                )}

                <div className="p-6 flex flex-col flex-grow">
                  {" "}
                  {/* flex-grow makes this div take remaining space */}
                  {/* Type Badge */}
                  <div className="mb-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded ${getTypeBadgeStyle(
                        item.type
                      )}`}
                    >
                      {item.type}
                    </span>
                  </div>
                  {/* Title */}
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 leading-snug">
                    {item.title}
                  </h3>
                  {/* Date & Location */}
                  <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4 flex-wrap">
                    {" "}
                    {/* Added flex-wrap */}
                    <span className="flex items-center whitespace-nowrap">
                      {" "}
                      {/* Prevent wrap within date */}
                      <FiCalendar className="mr-1.5 w-4 h-4 flex-shrink-0" />
                      {item.date}{" "}
                      {item.type?.toLowerCase() === "call for papers" ||
                      item.location?.toLowerCase() === "submission deadline"
                        ? "(Deadline)"
                        : ""}
                    </span>
                    {item.location &&
                      item.location !== "Submission Deadline" && (
                        <span className="flex items-center whitespace-nowrap">
                          {" "}
                          {/* Prevent wrap within location */}
                          <FaMapMarkerAlt className="mr-1.5 w-4 h-4 flex-shrink-0" />{" "}
                          {/* Location Icon */}
                          {item.location}
                        </span>
                      )}
                  </div>
                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-6 line-clamp-3 flex-grow">
                    {" "}
                    {/* flex-grow allows description to expand */}
                    {item.description}
                  </p>
                  {/* Link/Button */}
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    {" "}
                    {/* mt-auto pushes this to the bottom */}
                    <a
                      href={item.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center transition-colors duration-200"
                      aria-label={`Learn more about ${item.title}`}
                    >
                      Learn More
                      <svg
                        className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-200"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500">
              No news or events available at the moment.
            </div>
          )}
        </div>

        {/* Optional: View All Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate("/news-events")} // Example: navigate to a dedicated page
            className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            View All News & Events
          </button>
        </div>
      </div>
    </section>
  );
  // --- End News & Events Section ---

  // HowItWorks component (no changes needed)
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
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 font-sans overflow-hidden relative">
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
        {/* University Logos Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute -bottom-20 left-0 right-0 flex justify-center z-20"
        >
          <div className="bg-white rounded-t-3xl shadow-2xl w-full max-w-5xl h-24 flex items-center justify-center">
            <div className="flex space-x-8 overflow-x-auto px-4">
              {[
                { name: "Arba Minch University", logo: "/assets/amu-logo.png" },
                {
                  name: "University of Cape Town",
                  logo: "/assets/uct-logo.png",
                },
                {
                  name: "African Academy of Sciences",
                  logo: "/assets/aas-logo.png",
                },
                {
                  name: "Addis Ababa University",
                  logo: "/assets/aau-logo.png",
                },
              ].map((uni, index) => (
                <motion.img
                  key={index}
                  src={uni.logo}
                  alt={`${uni.name} logo`}
                  className="h-10 md:h-12 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
                  whileHover={{ scale: 1.1 }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Discover Section with Integrated Calendar Button */}
      <section className="py-12 px-6 bg-white mt-24">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl font-semibold mb-8 text-center text-gray-800"
          >
            Discover Research Opportunities
          </motion.h2>
          {/* Search Bar and Calendar Button Container */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative w-full md:flex-grow">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search researchers, topics, or keywords..."
                  className="w-full pl-12 p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* Action Buttons (Search & Calendar) */}
              <div className="flex w-full md:w-auto items-center space-x-2 flex-shrink-0">
                <button className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex-grow md:flex-grow-0">
                  Search
                </button>
                {/* Calendar Button */}
                <div className="relative">
                  <button
                    ref={calendarIconRef}
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="text-gray-500 hover:text-blue-600 p-4 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm flex items-center justify-center"
                    aria-label="Toggle Calendar"
                  >
                    <FiCalendar className="w-5 h-5" />
                  </button>
                  {/* Calendar Dropdown */}
                  <AnimatePresence>
                    {showCalendar && (
                      <motion.div
                        ref={calendarRef}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 origin-top-right bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-2"
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
                    {" "}
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    ></path>{" "}
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
                    {" "}
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    ></path>{" "}
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
                    {" "}
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>{" "}
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
                    {" "}
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    ></path>{" "}
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
                  {" "}
                  {feature.title}{" "}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- News & Events Section --- */}
      <NewsAndEventsSection data={newsAndEventsData} />
      {/* --------------------------- */}

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
            <div className="max-w-4xl mx-auto relative h-96 overflow-hidden">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? 100 : -100 }}
                  animate={{
                    opacity: activeTestimonial === index ? 1 : 0,
                    x:
                      activeTestimonial === index
                        ? 0
                        : index > activeTestimonial
                        ? 100
                        : -100,
                    zIndex: activeTestimonial === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.5, type: "tween" }}
                  className={`absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-8 px-4 ${
                    activeTestimonial === index ? "" : "pointer-events-none"
                  }`}
                >
                  <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden shadow-lg">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg max-w-lg text-center md:text-left">
                    <div className="flex mb-4 justify-center md:justify-start">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`${
                            i < testimonial.rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          } mr-1 w-5 h-5`}
                        />
                      ))}
                    </div>
                    <p className="text-lg md:text-xl text-gray-700 mb-6 italic leading-relaxed">
                      {" "}
                      "{testimonial.quote}"{" "}
                    </p>
                    <div>
                      <p className="text-md md:text-lg font-semibold text-gray-800">
                        {" "}
                        {testimonial.name}{" "}
                      </p>
                      <p className="text-sm md:text-base text-blue-600">
                        {testimonial.title}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-2 mt-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ease-in-out ${
                    activeTestimonial === index
                      ? "bg-blue-600 w-6"
                      : "bg-gray-300 hover:bg-gray-400"
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
            {" "}
            Ready to Transform Your Research?{" "}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl mb-10 max-w-2xl mx-auto"
          >
            {" "}
            Join thousands of researchers already accelerating their work
            through collaboration.{" "}
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
              {" "}
              Get Started - Free Forever{" "}
            </button>
            <button className="bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors shadow-lg">
              {" "}
              Schedule a Demo{" "}
            </button>
          </motion.div>
        </div>
      </section>

      {/* How It Works, About, Contact, Footer Sections */}
      <HowItWorks />

      {/* Upcoming Events Corner Feature */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end space-y-2">
        <AnimatePresence>
          {upcomingEvents.map((event, index) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, transition: { duration: 0.3 } }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: index * 0.05,
              }}
              className="bg-white rounded-lg shadow-xl p-4 w-72 border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <FiCalendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">
                      {event.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {" "}
                      {event.date} at {event.time}{" "}
                    </p>
                    {event.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeEvent(event.id)}
                  className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0"
                  aria-label={`Dismiss event: ${event.title}`}
                >
                  {" "}
                  <FaTimes className="w-3 h-3" />{" "}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Home;
