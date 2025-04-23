import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useCreatePublicationMutation } from "../../api/publicationApi";

const PostPublicationPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [createPublication] = useCreatePublicationMutation();

  const [formData, setFormData] = useState({
    title: "",
    authors: user ? `${user.username}` : "",
    abstract: "",
    publicationType: "journal",
    journalName: "",
    publicationDate: "",
    doi: "",
    keywords: "",
    file: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, file: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formPayload = new FormData();
    formPayload.append("title", formData.title);
    formPayload.append("authors", formData.authors);
    formPayload.append("abstract", formData.abstract);
    formPayload.append("type", formData.publicationType);
    formPayload.append("journalName", formData.journalName);
    formPayload.append("date", formData.publicationDate);
    formPayload.append("doi", formData.doi);
    formPayload.append("keywords", formData.keywords);
    if (formData.file) {
      formPayload.append("file", formData.file);
    }

    try {
      await createPublication(formPayload).unwrap();
      navigate("/publications");
    } catch (error) {
      console.error("Error creating publication:", error);
    }
  };

  return (
    <div className="post-publication">
      <h1>Add New Publication</h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Authors (comma separated)</label>
          <input
            type="text"
            name="authors"
            value={formData.authors}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Abstract</label>
          <textarea
            name="abstract"
            value={formData.abstract}
            onChange={handleChange}
            required
            rows={6}
          />
        </div>

        <div className="form-group">
          <label>Publication Type</label>
          <select
            name="publicationType"
            value={formData.publicationType}
            onChange={handleChange}
          >
            <option value="journal">Journal Article</option>
            <option value="conference">Conference Paper</option>
            <option value="thesis">Thesis</option>
            <option value="book">Book</option>
          </select>
        </div>

        {formData.publicationType === "journal" && (
          <div className="form-group">
            <label>Journal Name</label>
            <input
              type="text"
              name="journalName"
              value={formData.journalName}
              onChange={handleChange}
            />
          </div>
        )}

        <div className="form-group">
          <label>Publication Date</label>
          <input
            type="date"
            name="publicationDate"
            value={formData.publicationDate}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>DOI (Digital Object Identifier)</label>
          <input
            type="text"
            name="doi"
            value={formData.doi}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Keywords (comma separated)</label>
          <input
            type="text"
            name="keywords"
            value={formData.keywords}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Upload PDF</label>
          <input
            type="file"
            name="file"
            accept=".pdf"
            onChange={handleFileChange}
          />
        </div>

        <button type="submit" className="submit-btn">
          Submit Publication
        </button>
      </form>
    </div>
  );
};

export default PostPublicationPage;
