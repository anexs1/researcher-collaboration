import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateResearchMutation,
  useUpdateResearchMutation,
} from "../../api/researchApi";

const ResearchForm = ({ research, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: research?.title || "",
    abstract: research?.abstract || "",
    methodology: research?.methodology || "",
    results: research?.results || "",
  });

  const [createResearch] = useCreateResearchMutation();
  const [updateResearch] = useUpdateResearchMutation();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (research) {
        await updateResearch({ id: research.id, ...formData }).unwrap();
      } else {
        await createResearch(formData).unwrap();
      }
      onSuccess?.();
      navigate("/research");
    } catch (error) {
      console.error("Error saving research:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="research-form">
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
        <label>Abstract</label>
        <textarea
          name="abstract"
          value={formData.abstract}
          onChange={handleChange}
          required
          rows={5}
        />
      </div>

      <div className="form-group">
        <label>Methodology</label>
        <textarea
          name="methodology"
          value={formData.methodology}
          onChange={handleChange}
          required
          rows={8}
        />
      </div>

      <div className="form-group">
        <label>Results (Optional)</label>
        <textarea
          name="results"
          value={formData.results}
          onChange={handleChange}
          rows={8}
        />
      </div>

      <button type="submit" className="submit-btn">
        {research ? "Update Research" : "Create Research"}
      </button>
    </form>
  );
};

export default ResearchForm;
