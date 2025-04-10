// src/Page/PostPublicationPage.jsx
import React, { useState } from "react";
import PostPublicationForm from "../Component/Profile/PostPublicationForm"; // Adjust path if needed
import Notification from "../Component/Common/Notification"; // Import Notification

// This page component wraps the form and handles its notifications
function PostPublicationPage({ currentUser }) {
  // State for notifications specific to this page's actions
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });

  // Function to show notifications, passed down to the form
  const showNotification = (message, type = "success") => {
    setNotification({ message, type, show: true });
    // Auto-hide after 5 seconds
    setTimeout(
      () => setNotification({ message: "", type: "", show: false }),
      5000
    );
  };

  // Optional: Handle case where user data might not be loaded yet
  if (!currentUser) {
    // You could return a loading spinner or a simple message
    return (
      <div className="p-6 text-center text-gray-600">
        Loading user information...
      </div>
    );
  }

  return (
    // Container for the page content with padding
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Notification Area for this page */}
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}

      {/* Render the actual form component */}
      <PostPublicationForm
        currentUser={currentUser}
        showNotification={showNotification} // Pass the handler down
      />
    </div>
  );
}

export default PostPublicationPage;
