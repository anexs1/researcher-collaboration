import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetPublicationQuery,
  useUpdatePublicationMutation,
} from "../../api/publicationApi";

const EditPublicationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: publication, isLoading } = useGetPublicationQuery(id);
  const [updatePublication] = useUpdatePublicationMutation();

  const [formData, setFormData] = useState({
    title: "",
    authors: "",
    abstract: "",
    publicationType: "journal",
    journalName: "",
    publicationDate: "",
    doi: "",
    keywords: "",
  });

  useEffect(() => {
    if (publication) {
      setFormData({
        title: publication.title,
        authors: publication.authors.join(", "),
        abstract: publication.abstract,
        publicationType: publication.type,
        journalName: publication.journalName || "",
        publicationDate: publication.date || "",
        doi: publication.doi || "",
        keywords: publication.keywords?.join(", ") || "",
      });
    }
  }, [publication]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updatePublication({
        id,
        publicationData: {
          ...formData,
          authors: formData.authors.split(",").map((a) => a.trim()),
          keywords: formData.keywords.split(",").map((k) => k.trim()),
        },
      }).unwrap();
      navigate("/publications");
    } catch (error) {
      console.error("Error updating publication:", error);
    }
  };

  if (isLoading) return <div>Loading publication...</div>;

  return (
    <div className="edit-publication">
      <h1>Edit Publication</h1>
      <form onSubmit={handleSubmit}>
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

        <button type="submit" className="save-btn">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditPublicationPage;
