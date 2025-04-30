// src/pages/ExplorePage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";

// REMOVED: import NewLogForm from "../Component/NewLogForm.jsx"; // --- REMOVED THIS LINE ---
import ThinkingLogCard from "../Component/ThinkingLogCard.jsx"; // Keep this

// Mock Data (Replace with API Fetch) - Kept for displaying logs
const initialLogsData = [
  {
    id: "log1",
    author: { name: "Dr. Abebe Lemma", avatar: null },
    title: "Irrigation Optimization",
    text: "Can machine learning improve traditional irrigation in low-income farms? Needs data on current water usage patterns.",
    tags: ["AI", "Agriculture", "WaterManagement", "Ethiopia"],
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    logType: "question",
    likes: 5,
    commentsCount: 2,
    joinsCount: 1,
    isLikedByUser: false,
    isSavedByUser: false,
  },
  {
    id: "log2",
    author: { name: "Sara Getachew (MSc Student)", avatar: null },
    title: null,
    text: "Noticed lack of open data on Ethiopian doctoral research output – worth exploring source accessibility?",
    tags: ["OpenData", "ResearchMeta", "PhD"],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    logType: "observation",
    likes: 12,
    commentsCount: 3,
    joinsCount: 0,
    isLikedByUser: true,
    isSavedByUser: false,
  },
  {
    id: "log3",
    author: { name: "Prof. Kebede Taye", avatar: null },
    title: "Tracking Diaspora Impact",
    text: "How do we accurately track scientific diaspora impact on home countries beyond remittances? Looking at co-authorship patterns maybe?",
    tags: ["Diaspora", "SciencePolicy", "Collaboration"],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    logType: "idea_hypothesis",
    likes: 8,
    commentsCount: 1,
    joinsCount: 2,
    isLikedByUser: false,
    isSavedByUser: true,
  },
];
// End Mock Data

const ExplorePage = ({ isLoggedIn, currentUser }) => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("latest");

  // REMOVED: handleAddLog function is GONE from here

  console.log("[ExplorePage] Props:", { isLoggedIn, currentUser }); // Keep for debugging if needed

  // --- Fetch Logs Logic (Stays Here) ---
  const fetchLogs = useCallback(() => {
    setIsLoading(true);
    setError(null);
    console.log(
      `[ExplorePage] Fetching logs... Filter: ${filter}, Search: ${searchQuery}`
    );
    // TODO: Replace with actual API GET request to fetch logs
    setTimeout(() => {
      try {
        let fetchedData = initialLogsData;
        // Filtering/Sorting Simulation...
        if (filter === "latest") {
          fetchedData = [...fetchedData].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          );
        } else if (filter === "trending") {
          fetchedData = [...fetchedData].sort(
            (a, b) => b.likes + b.commentsCount - (a.likes + a.commentsCount)
          );
        } else if (filter.startsWith("tag:")) {
          const tagName = filter.split(":")[1]?.toLowerCase();
          if (tagName) {
            fetchedData = fetchedData.filter((log) =>
              log.tags.some((tag) => tag.toLowerCase() === tagName)
            );
          }
        }
        if (searchQuery) {
          const queryLower = searchQuery.toLowerCase();
          fetchedData = fetchedData.filter(
            (log) =>
              (log.title && log.title.toLowerCase().includes(queryLower)) ||
              log.text.toLowerCase().includes(queryLower) ||
              log.author.name.toLowerCase().includes(queryLower) ||
              log.tags.some((tag) => tag.toLowerCase().includes(queryLower))
          );
        }
        setLogs(fetchedData);
      } catch (err) {
        console.error("[ExplorePage] Fetch error (simulated):", err);
        setError("Failed to load thinking logs.");
      } finally {
        setIsLoading(false);
      }
    }, 800);
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);
  // --- End Fetch Logs Logic ---

  // --- Card Action Handlers (Stays Here) ---
  const handleLike = (logId) => {
    if (!isLoggedIn) return navigate("/login");
    console.log(`Like toggled for ${logId}`);
    /* TODO: API Call */ setLogs((prev) =>
      prev.map((l) =>
        l.id === logId
          ? {
              ...l,
              isLikedByUser: !l.isLikedByUser,
              likes: l.isLikedByUser ? l.likes - 1 : l.likes + 1,
            }
          : l
      )
    );
  };
  const handleSave = (logId) => {
    if (!isLoggedIn) return navigate("/login");
    console.log(`Save toggled for ${logId}`);
    /* TODO: API Call */ setLogs((prev) =>
      prev.map((l) =>
        l.id === logId ? { ...l, isSavedByUser: !l.isSavedByUser } : l
      )
    );
  };
  const handleJoin = (logId) => {
    if (!isLoggedIn) return navigate("/login");
    console.log(`Join requested for ${logId}`);
    /* TODO: API Call */ alert(`Join request (simulated) for ${logId}`);
  };
  const handleComment = (logId) => {
    if (!isLoggedIn) return navigate("/login");
    console.log(`Comment requested for ${logId}`);
    /* TODO: Navigate or show modal */ alert(
      `Show comments (simulated) for ${logId}`
    );
  };
  // --- End Card Action Handlers ---

  // --- Search/Filter Handlers (Stays Here) ---
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setSearchQuery("");
  };
  const handleTagClick = (tagName) => {
    setFilter(`tag:${tagName}`);
    setSearchQuery("");
  };
  // --- End Search/Filter Handlers ---

  // --- JSX Return ---
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        {" "}
        {/* Adjusted margin */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {" "}
          {/* Added flex layout */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {" "}
              {/* Adjusted heading style */}
              🧠 Thinking Logs
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Discover early-stage ideas, questions, and observations.
            </p>
          </div>
          {/* Link/Button to the dedicated Create Log page */}
          {isLoggedIn && (
            <Link
              to="/logs/new" // Matches the route for CreateLogPage
              className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Post New Log
            </Link>
          )}
        </div>
      </div>

      {/* --- FORM RENDERING BLOCK IS COMPLETELY REMOVED --- */}

      {/* Search and Filter Controls */}
      <div className="my-6 flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        {" "}
        {/* Added background/border */}
        <div className="relative flex-grow w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search logs, authors, tags..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search thinking logs"
          />{" "}
          {/* Adjusted focus style */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex space-x-2 flex-shrink-0">
          <button
            onClick={() => handleFilterChange("latest")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
              filter === "latest"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Latest
          </button>{" "}
          {/* Adjusted styles */}
          <button
            onClick={() => handleFilterChange("trending")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
              filter === "trending"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Trending
          </button>{" "}
          {/* Adjusted styles */}
          {filter.startsWith("tag:") && (
            <button
              onClick={() => handleFilterChange("latest")}
              className="px-3 py-1.5 rounded-md text-sm bg-blue-100 text-blue-700 font-medium flex items-center space-x-1 hover:bg-blue-200"
              title="Clear tag filter"
            >
              <span>#{filter.split(":")[1]}</span>
              <span className="font-bold text-xs ml-1">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Logs Feed Section */}
      <div className="space-y-6">
        {isLoading && (
          <p className="text-center text-gray-500 py-10">Loading logs...</p>
        )}
        {error && <p className="text-center text-red-600 py-10">{error}</p>}
        {!isLoading && !error && logs.length === 0 && (
          <div className="text-center py-10 bg-white rounded-lg border border-gray-200 shadow-sm">
            {" "}
            {/* Added style */}
            <p className="text-gray-700 font-semibold">
              No thinking logs found.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery || filter !== "latest"
                ? "Try adjusting your search or filter."
                : isLoggedIn
                ? "Be the first to share an idea!"
                : "No ideas here yet. Sign up or log in to contribute!"}
            </p>
            {/* Optional: Button to post when empty and logged in */}
            {isLoggedIn && !searchQuery && filter === "latest" && (
              <Link
                to="/logs/new"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Post Your First Log
              </Link>
            )}
          </div>
        )}
        {/* Logs List */}
        {!isLoading &&
          !error &&
          logs.length > 0 &&
          logs.map((log) =>
            log && log.id ? (
              <ThinkingLogCard
                key={log.id}
                log={log}
                isLoggedIn={isLoggedIn}
                onLike={handleLike}
                onComment={handleComment}
                onJoin={handleJoin}
                onSave={handleSave}
                onTagClick={handleTagClick}
              />
            ) : null
          )}
      </div>
    </div>
  );
};

export default ExplorePage;
