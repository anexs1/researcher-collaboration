import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const ExplorePage = ({ researchData, isLoggedIn, currentUser }) => {
  const navigate = useNavigate();
  const [researchList, setResearchList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredResearch, setFilteredResearch] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editResearch, setEditResearch] = useState(null);

  // Initial sample data
  const initialData = [
    {
      id: 1,
      title: "AI in Agriculture",
      researcher: "Dr. Selam Tadesse",
      field: "Machine Learning",
      description: "Using AI to optimize crop yields in Ethiopian highlands",
      startDate: "2023-01-15",
      endDate: "",
      status: "Ongoing",
      bookmarked: false,
      collaborators: ["Dr. Michael Getachew", "Prof. Eden Teshome"],
    },
    {
      id: 2,
      title: "Renewable Energy Forecasting",
      researcher: "Prof. Biruk Alemu",
      field: "Energy Systems",
      description: "Predicting solar and wind energy output for national grid",
      startDate: "2022-06-01",
      endDate: "2023-05-30",
      status: "Completed",
      bookmarked: false,
      collaborators: ["Eng. Sara Lemma"],
    },
  ];

  // Load data on component mount
  useEffect(() => {
    const savedResearch = researchData || initialData;
    setResearchList(savedResearch);
    setFilteredResearch(savedResearch);
  }, [researchData]);

  // Filter research based on search query
  useEffect(() => {
    const filtered = researchList.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.researcher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredResearch(filtered);
  }, [searchQuery, researchList]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleBookmark = (id) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    const updated = researchList.map((item) =>
      item.id === id ? { ...item, bookmarked: !item.bookmarked } : item
    );
    updateResearchData(updated);
  };

  const handleAddClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      navigate("/research/create");
    }
  };

  const handleEditResearch = (research) => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      navigate(`/research/edit/${research.id}`);
    }
  };

  const handleDeleteResearch = (id) => {
    const updated = researchList.filter((item) => item.id !== id);
    updateResearchData(updated);
  };

  const updateResearchData = (data) => {
    setResearchList(data);
    setFilteredResearch(data);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-purple-800">
            Discover Research
          </h1>
          <p className="text-gray-600 mt-1">
            {filteredResearch.length}{" "}
            {filteredResearch.length === 1 ? "project" : "projects"} found
          </p>
        </div>

        {isLoggedIn && (
          <div className="flex space-x-3 w-full sm:w-auto">
            <button
              onClick={handleAddClick}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Research
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search research projects, fields, or researchers..."
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={searchQuery}
          onChange={handleSearch}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400 absolute left-3 top-2.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {filteredResearch.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResearch.map((research) => (
            <ResearchCard
              key={research.id}
              research={research}
              onBookmark={toggleBookmark}
              onEdit={handleEditResearch}
              onDelete={handleDeleteResearch}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mt-8">
          <div className="mx-auto h-20 w-20 text-gray-400 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-full"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-800">
            No research projects found
          </h3>
          <p className="mt-2 text-sm text-gray-500 mb-4">
            {searchQuery
              ? "Try adjusting your search"
              : "There are no research projects yet"}
          </p>
          {isLoggedIn && (
            <button
              onClick={handleAddClick}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Create New Research Project
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Research Card Component
const ResearchCard = ({
  research,
  onBookmark,
  onEdit,
  onDelete,
  isLoggedIn,
  currentUser,
}) => {
  const isOwner =
    currentUser?.name === research.researcher || currentUser?.role === "admin";

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition h-full flex flex-col">
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-purple-800 mb-1">
              {research.title}
            </h2>
            <p className="text-sm text-gray-600">
              <span className="font-medium">By:</span>{" "}
              <Link
                to={`/profile/${research.researcher}`}
                className="text-blue-500 hover:underline"
              >
                {research.researcher}
              </Link>
            </p>
          </div>
          <button
            onClick={() => onBookmark(research.id)}
            className={`p-1.5 rounded-full ${
              research.bookmarked
                ? "text-yellow-500"
                : "text-gray-400 hover:text-yellow-500"
            }`}
            aria-label={
              research.bookmarked ? "Remove bookmark" : "Add bookmark"
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
          </button>
        </div>

        <div className="mt-3 flex items-center space-x-2">
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              research.status === "Completed"
                ? "bg-green-100 text-green-800"
                : research.status === "Ongoing"
                ? "bg-blue-100 text-blue-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {research.status}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
            {research.field}
          </span>
        </div>

        <p className="text-sm text-gray-700 mt-3 line-clamp-3">
          {research.description}
        </p>

        {research.collaborators && research.collaborators.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">Collaborators:</p>
            <div className="flex flex-wrap gap-1">
              {research.collaborators.map((name, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 px-5 py-3 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Started: {new Date(research.startDate).toLocaleDateString()}
          {research.endDate && (
            <span className="ml-2">
              Ended: {new Date(research.endDate).toLocaleDateString()}
            </span>
          )}
        </div>
        {isLoggedIn && isOwner && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(research)}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => onDelete(research.id)}
              className="px-3 py-1 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
