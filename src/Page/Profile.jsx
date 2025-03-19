import React, { useEffect, useState } from "react";
import "./Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({});
  const [newProfileImage, setNewProfileImage] = useState(null);

  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setUpdatedUser(parsedUser);
      setFormData(parsedUser); // Set form data from localStorage
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
    const userProfile = { ...formData };
    localStorage.setItem("user", JSON.stringify(userProfile));
    setUser(userProfile);
    setEditing(false);
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

  return (
    <div className="profile-container">
      <div className="profile-image-section">
        <img
          src={
            newProfileImage ||
            user?.profileImage ||
            "https://via.placeholder.com/150"
          }
          alt="Profile"
          className="profile-image"
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
        <h2 className="profile-username">{user?.username || "ROHIT KOHLI"}</h2>
        <h3 className="profile-title">Web Developer</h3>
      </div>

      <div className="profile-details">
        <h2 className="details-title">Profile</h2>
        <p className="details-bio">
          {user?.bio ||
            "Write an enticing performance summary that impresses the recruiter. Showcase your uniqueness through your skills and accomplishments."}
        </p>

        <h3 className="education-title">Education</h3>
        <div className="education-item">
          <h4 className="education-degree">
            {formData.education || "No Education Provided"}
          </h4>
        </div>

        {editing && (
          <div className="edit-section">
            <label>Education:</label>
            <textarea
              name="education"
              value={formData.education}
              onChange={handleChange}
            />
          </div>
        )}

        <h3 className="skills-title">Skills & Technologies</h3>
        <div className="skills-item">
          <p>{formData.skills || "No skills listed"}</p>
        </div>

        {editing && (
          <div className="edit-section">
            <label>Skills & Technologies:</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
            />
          </div>
        )}

        <h3 className="research-title">Research Interests</h3>
        <div className="research-item">
          <p>
            {formData.researchInterests || "No research interests provided"}
          </p>
        </div>

        {editing && (
          <div className="edit-section">
            <label>Research Interests:</label>
            <input
              type="text"
              name="researchInterests"
              value={formData.researchInterests}
              onChange={handleChange}
            />
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
      </div>
    </div>
  );
}
