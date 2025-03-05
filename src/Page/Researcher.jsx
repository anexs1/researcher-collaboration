import React, { useState } from "react";
import { useParams } from "react-router-dom";

function Researcher() {
  const { id } = useParams(); // Get the researcher ID from the URL
  const [researcher, setResearcher] = useState({
    name: "",
    field: "",
    bio: "",
    image: "",
    email: "",
    phone: "",
    researchInterests: "",
    linkedin: "",
    researcherType: "",
    institution: "",
    publications: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [researchersList, setResearchersList] = useState([]); // Store multiple researchers
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setResearcher({ ...researcher, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setResearcher({ ...researcher, image: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !researcher.name ||
      !researcher.field ||
      !researcher.bio ||
      !researcher.email ||
      !imageFile
    ) {
      setError("All fields are required, including image upload.");
      return;
    }

    setResearchersList([...researchersList, researcher]); // Add new researcher to the list
    setResearcher({
      name: "",
      field: "",
      bio: "",
      email: "",
      phone: "",
      researchInterests: "",
      linkedin: "",
      researcherType: "",
      institution: "",
      publications: "",
      image: "",
    }); // Reset form
    setImageFile(null);
    setError(""); // Reset error if form is valid
  };

  return (
    <div className="container mt-4">
      <h2 className="title">Add Researcher</h2>
      {error && <p className="error-message">{error}</p>}
      <form className="researcher-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={researcher.name}
            onChange={handleChange}
            required
            placeholder="Enter full name"
          />
        </div>
        <div className="form-group">
          <label>Field of Research:</label>
          <input
            type="text"
            name="field"
            value={researcher.field}
            onChange={handleChange}
            required
            placeholder="Enter research field"
          />
        </div>
        <div className="form-group">
          <label>Bio:</label>
          <textarea
            name="bio"
            value={researcher.bio}
            onChange={handleChange}
            required
            placeholder="Short bio of the researcher"
          />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={researcher.email}
            onChange={handleChange}
            required
            placeholder="Enter email address"
          />
        </div>
        <div className="form-group">
          <label>Phone Number (Optional):</label>
          <input
            type="tel"
            name="phone"
            value={researcher.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
          />
        </div>
        <div className="form-group">
          <label>Research Interests:</label>
          <textarea
            name="researchInterests"
            value={researcher.researchInterests}
            onChange={handleChange}
            placeholder="Research topics or interests"
          />
        </div>

        <div className="form-group">
          <label>Researcher Type:</label>
          <select
            name="researcherType"
            value={researcher.researcherType}
            onChange={handleChange}
          >
            <option value="">Select Researcher Type</option>
            <option value="Academic">Academic</option>
            <option value="Industry">Industry Professional</option>
            <option value="Independent">Independent Researcher</option>
          </select>
        </div>
        <div className="form-group">
          <label>Institution/Organization:</label>
          <input
            type="text"
            name="institution"
            value={researcher.institution}
            onChange={handleChange}
            placeholder="Enter institution or organization"
          />
        </div>
        <div className="form-group">
          <label>Publications:</label>
          <input
            type="text"
            name="publications"
            value={researcher.publications}
            onChange={handleChange}
            placeholder="Number of publications or details"
          />
        </div>
        <div className="form-group">
          <label>Upload Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
        </div>
        <button className="submit-btn" type="submit">
          Submit
        </button>
      </form>

      {researchersList.length > 0 && (
        <div className="mt-4">
          <h2 className="title">Researchers List</h2>
          {researchersList.map((res, index) => (
            <div key={index} className="profile-card mt-3">
              <h3>{res.name}'s Profile</h3>
              <div className="row">
                <div className="col-md-4">
                  {res.image && (
                    <img
                      src={res.image}
                      alt={res.name}
                      className="profile-img"
                    />
                  )}
                </div>
                <div className="col-md-8">
                  <h4>{res.name}</h4>
                  <p>
                    <strong>Field of Research:</strong> {res.field}
                  </p>
                  <p>
                    <strong>Email:</strong> {res.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {res.phone || "N/A"}
                  </p>
                  <p>
                    <strong>Research Interests:</strong>{" "}
                    {res.researchInterests || "N/A"}
                  </p>

                  <p>
                    <strong>Researcher Type:</strong> {res.researcherType}
                  </p>
                  <p>
                    <strong>Institution:</strong> {res.institution || "N/A"}
                  </p>
                  <p>
                    <strong>Publications:</strong> {res.publications || "N/A"}
                  </p>
                  <p>
                    <strong>Bio:</strong> {res.bio}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Researcher;
