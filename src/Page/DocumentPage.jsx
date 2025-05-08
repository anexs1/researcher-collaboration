// src/pages/DocumentPage.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom"; // For login link
import DocumentEditor from "../Component/documents/DocumentEditor"; // Adjusted path
import axios from "axios";
import LoadingSpinner from "../Component/Common/LoadingSpinner"; // Assuming you have this

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// This component will now expect 'currentUser' as a prop from App.jsx
const DocumentPage = ({ currentUser }) => {
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [docsList, setDocsList] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [errorDocs, setErrorDocs] = useState("");

  const apiClient = useMemo(() => {
    const token = localStorage.getItem("authToken");
    return axios.create({
      baseURL: API_BASE_URL,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, []); // Dependency array is empty

  const fetchUserDocuments = useCallback(() => {
    if (!currentUser || !currentUser.id) {
      setErrorDocs("Please log in to see your documents.");
      setDocsList([]);
      setIsLoadingDocs(false);
      return;
    }
    setIsLoadingDocs(true);
    setErrorDocs("");
    apiClient
      .get("/api/documents") // Endpoint to list user's/accessible documents
      .then((res) => {
        if (res.data.success) {
          setDocsList(res.data.data);
        } else {
          setErrorDocs(res.data.message || "Failed to fetch documents.");
        }
      })
      .catch((err) => {
        console.error("Error fetching documents list:", err);
        setErrorDocs(
          err.response?.data?.message || "Could not load your documents."
        );
      })
      .finally(() => setIsLoadingDocs(false));
  }, [apiClient, currentUser]); // Add currentUser as a dependency

  useEffect(() => {
    fetchUserDocuments();
  }, [fetchUserDocuments]); // Fetch on component mount or when fetchUserDocuments changes (due to currentUser)

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      alert("Please enter a title for the new document.");
      return;
    }
    if (!currentUser || !currentUser.id) {
      alert("You must be logged in to create a document.");
      return;
    }
    try {
      const response = await apiClient.post("/api/documents", {
        title: newDocTitle,
      });
      if (response.data.success) {
        const newDoc = response.data.data;
        alert(`Document "${newDoc.title}" created!`);
        // Instead of manually adding, re-fetch the list to get the latest from server
        fetchUserDocuments();
        setCurrentDocumentId(newDoc.id); // Open the new document
        setNewDocTitle("");
      } else {
        alert(`Failed to create document: ${response.data.message}`);
      }
    } catch (error) {
      alert(
        `Error creating document: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // If user is not logged in (currentUser prop is null/undefined)
  if (!currentUser) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <p className="text-xl text-gray-700">
          Please{" "}
          <Link
            to="/login"
            className="text-indigo-600 hover:underline font-semibold"
          >
            log in
          </Link>{" "}
          to access and manage your documents.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Documents</h1>
        <p className="text-gray-600">
          Create, manage, and collaborate on your research documents.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center">
          <input
            type="text"
            value={newDocTitle}
            onChange={(e) => setNewDocTitle(e.target.value)}
            placeholder="Enter new document title..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <button
            onClick={handleCreateDocument}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-md transition-colors duration-150 ease-in-out shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Create Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-4 md:p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
            Document List
          </h3>
          {isLoadingDocs && (
            <div className="flex items-center text-gray-500 py-2">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Loading documents...</span>
            </div>
          )}
          {errorDocs && (
            <p className="text-red-500 bg-red-50 p-2 rounded border border-red-200">
              {errorDocs}
            </p>
          )}
          {!isLoadingDocs && docsList.length === 0 && !errorDocs && (
            <p className="text-gray-500 italic py-2">
              No documents found. Create one to get started!
            </p>
          )}
          <ul className="space-y-1 max-h-96 overflow-y-auto">
            {docsList.map((doc) => (
              <li
                key={doc.id}
                className={`block w-full text-left p-3 rounded-md cursor-pointer transition-colors duration-150 ease-in-out
                                 ${
                                   currentDocumentId === doc.id
                                     ? "bg-indigo-600 text-white shadow-md"
                                     : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                                 }`}
                onClick={() => {
                  console.log(
                    "DocumentPage: Setting currentDocumentId to",
                    doc.id
                  );
                  setCurrentDocumentId(doc.id);
                }}
              >
                <span className="font-medium block truncate">
                  {doc.title || "Untitled Document"}
                </span>
                <span
                  className={`text-xs block ${
                    currentDocumentId === doc.id
                      ? "text-indigo-200"
                      : "text-gray-400"
                  }`}
                >
                  ID: {doc.id} | Updated:{" "}
                  {new Date(doc.updatedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          {currentDocumentId ? (
            <DocumentEditor
              documentId={currentDocumentId}
              currentUser={currentUser}
            />
          ) : (
            !isLoadingDocs &&
            !errorDocs && ( // Only show this if not loading and no error
              <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500 h-full flex flex-col justify-center items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-gray-300 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-xl">Select a document to begin.</p>
                <p className="text-sm">
                  Choose a document from the list on the left, or create a new
                  one.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPage;
