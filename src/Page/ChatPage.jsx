// src/Page/ChatPage.jsx
import React from "react";
import { useParams, Link } from "react-router-dom"; // Import useParams to get the user ID

function ChatPage({ currentUser }) {
  // Accept currentUser if needed
  const { userId } = useParams(); // Get the dynamic part from the URL (:userId)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h1 className="text-xl font-semibold mb-4 text-gray-800">
          Chat with User ID: {userId}
        </h1>
        <p className="text-gray-600 mb-4">
          This is the placeholder for the chat interface with user {userId}.
          Build your message display and input form here.
        </p>
        {/* Add more details about the user being chatted with if needed */}
        {/* Example: Fetch user details based on userId */}
        <div className="mt-6">
          <Link
            to="/messages" // Link back to the contact list
            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            ← Back to Messages
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
