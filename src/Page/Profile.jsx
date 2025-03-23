import React, { useEffect, useState } from "react";
import "./Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    aboutMe: "",
    skills: "",
    researchInterests: "",
    achievements: "",
    socialLinks: {
      github: "",
      linkedin: "",
      twitter: "",
    },
    collaborationStatus: "",
    recentActivities: "",
    contactInfo: {
      email: "",
      phone: "",
    },
    website: "",
    experience: "",
    education: "",
    location: "",
    profileImage: "",
    password: "",
  });

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Initialize form with user data, handling missing values
        setFormData((prevFormData) => ({
          ...prevFormData,
          ...parsedUser,
          socialLinks: {
            ...prevFormData.socialLinks,
            ...parsedUser.socialLinks,
          },
          contactInfo: {
            ...prevFormData.contactInfo,
            ...parsedUser.contactInfo,
          },
        }));
      }
    } catch (err) {
      setError(err);
      console.error("Error loading data from localStorage:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSocialChange = (e) => {
    setFormData({
      ...formData,
      socialLinks: { ...formData.socialLinks, [e.target.name]: e.target.value },
    });
  };

  const handleContactChange = (e) => {
    setFormData({
      ...formData,
      contactInfo: { ...formData.contactInfo, [e.target.name]: e.target.value },
    });
  };

  const handleSave = () => {
    try {
      const userProfile = { ...formData };
      delete userProfile.password;
      localStorage.setItem("user", JSON.stringify(userProfile));
      setUser(userProfile);
      setEditing(false);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    } catch (err) {
      setError(err);
      console.error("Error saving data to localStorage:", err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProfileImage(reader.result);
        setFormData({ ...formData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearField = (fieldName) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [fieldName]: "",
    }));
  };

  if (isLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="error">
        Error loading profile data. Please try again later.
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* New Header Section */}
      <div className="profile-header">
        <div className="profile-header-content">
          <img
            src={
              newProfileImage ||
              formData?.profileImage ||
              "https://via.placeholder.com/150"
            }
            alt="Profile"
            className="profile-header-image"
          />
          <input
            type="file"
            className="hidden"
            id="fileUpload"
            onChange={handleImageChange}
          />
          <label htmlFor="fileUpload" className="upload-button">
            📷
          </label>
          <h2 className="profile-header-username">
            {formData.username || "ROHIT KOHLI"}
          </h2>
          <h3 className="profile-header-title">Web Developer</h3>
        </div>
      </div>

      <div className="profile-details">
        {/* Username and Email  (from signup) */}
        <h2 className="details-title">Account Information</h2>
        {editing ? (
          <div className="edit-section">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
            <button onClick={() => handleClearField("username")}>Clear</button>

            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            <button onClick={() => handleClearField("email")}>Clear</button>
          </div>
        ) : (
          <>
            <p>
              <strong>Username:</strong> {formData.username || "Not provided"}
            </p>
            <p>
              <strong>Email:</strong> {formData.email || "Not provided"}
            </p>
          </>
        )}

        <h2 className="details-title">About Me</h2>
        {editing ? (
          <div className="edit-section">
            <label>About Me:</label>
            <textarea
              name="aboutMe"
              value={formData.aboutMe}
              onChange={handleChange}
            />
            <button onClick={() => handleClearField("aboutMe")}>Clear</button>
          </div>
        ) : (
          <p className="details-bio">
            {formData.aboutMe ||
              "Write an enticing performance summary that impresses the recruiter. Showcase your uniqueness through your skills and accomplishments."}
          </p>
        )}

        <h3 className="education-title">Education</h3>
        {editing ? (
          <div className="edit-section">
            <label>Education:</label>
            <input
              type="text"
              name="education"
              value={formData.education}
              onChange={handleChange}
            />
            <button onClick={() => handleClearField("education")}>Clear</button>
          </div>
        ) : (
          <div className="profile-item">
            <strong>Education:</strong> {formData.education || "Not provided"}
          </div>
        )}

        <h3 className="skills-title">Skills & Technologies</h3>
        {editing ? (
          <div className="edit-section">
            <label>Skills:</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
            />
            <button onClick={() => handleClearField("skills")}>Clear</button>
          </div>
        ) : (
          <div className="profile-item">
            <strong>Skills:</strong> {formData.skills || "Not provided"}
          </div>
        )}

        <h3 className="research-title">Research Interests</h3>
        {editing ? (
          <div className="edit-section">
            <label>Research Interests:</label>
            <input
              type="text"
              name="researchInterests"
              value={formData.researchInterests}
              onChange={handleChange}
            />
            <button onClick={() => handleClearField("researchInterests")}>
              Clear
            </button>
          </div>
        ) : (
          <div className="profile-item">
            <strong>Research Interests:</strong>{" "}
            {formData.researchInterests || "Not provided"}
          </div>
        )}

        <h3 className="achievements-title">Achievements</h3>
        {editing ? (
          <div className="edit-section">
            <label>Achievements:</label>
            <textarea
              name="achievements"
              value={formData.achievements}
              onChange={handleChange}
            />
            <button onClick={() => handleClearField("achievements")}>
              Clear
            </button>
          </div>
        ) : (
          <div className="profile-item">
            <strong>Achievements:</strong>{" "}
            {formData.achievements || "Not provided"}
          </div>
        )}

        <h3 className="experience-title">Experience</h3>
        {editing ? (
          <div className="edit-section">
            <label>Experience:</label>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleChange}
            />
            <button onClick={() => handleClearField("experience")}>
              Clear
            </button>
          </div>
        ) : (
          <div className="profile-item">
            <strong>Experience:</strong> {formData.experience || "Not provided"}
          </div>
        )}

        <h3 className="location-title">Location</h3>
        {editing ? (
          <div className="edit-section">
            <label>Location:</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
            <button onClick={() => handleClearField("location")}>Clear</button>
          </div>
        ) : (
          <div className="profile-item">
            <strong>Location:</strong> {formData.location || "Not provided"}
          </div>
        )}

        {/* Social Links Section */}
        <h3 className="social-title">Social Links</h3>
        {editing ? (
          <div className="edit-section">
            <label>GitHub:</label>
            <input
              type="text"
              name="github"
              value={formData.socialLinks.github}
              onChange={handleSocialChange}
            />
            <button onClick={() => handleClearField("socialLinks.github")}>
              Clear
            </button>

            <label>LinkedIn:</label>
            <input
              type="text"
              name="linkedin"
              value={formData.socialLinks.linkedin}
              onChange={handleSocialChange}
            />
            <button onClick={() => handleClearField("socialLinks.linkedin")}>
              Clear
            </button>

            <label>Twitter:</label>
            <input
              type="text"
              name="twitter"
              value={formData.socialLinks.twitter}
              onChange={handleSocialChange}
            />
            <button onClick={() => handleClearField("socialLinks.twitter")}>
              Clear
            </button>
          </div>
        ) : (
          <div className="social-links">
            {formData.socialLinks.github && (
              <a
                href={formData.socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            )}
            {formData.socialLinks.linkedin && (
              <a
                href={formData.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            )}
            {formData.socialLinks.twitter && (
              <a
                href={formData.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter
              </a>
            )}
          </div>
        )}

        <h3 className="contact-title">Contact Information</h3>
        {editing ? (
          <div className="edit-section">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.contactInfo.email}
              onChange={handleContactChange}
            />
            <button onClick={() => handleClearField("contactInfo.email")}>
              Clear
            </button>

            <label>Phone:</label>
            <input
              type="text"
              name="phone"
              value={formData.contactInfo.phone}
              onChange={handleContactChange}
            />
            <button onClick={() => handleClearField("contactInfo.phone")}>
              Clear
            </button>
          </div>
        ) : (
          <div className="contact-info">
            <p>
              <strong>Email:</strong>{" "}
              {formData.contactInfo.email || "Not provided"}
            </p>
            <p>
              <strong>Phone:</strong>{" "}
              {formData.contactInfo.phone || "Not provided"}
            </p>
          </div>
        )}

        {editing ? (
          <div className="edit-section">
            <button onClick={handleSave} className="save-button">
              Save
            </button>
          </div>
        ) : (
          <button onClick={handleEditToggle} className="edit-button">
            Edit
          </button>
        )}

        {showConfirmation && (
          <div className="confirmation-message">Profile Saved!</div>
        )}
      </div>
    </div>
  );
}
