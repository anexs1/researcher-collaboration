import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetResearchQuery } from "../../api/researchApi";

const ResearchDetails = () => {
  const { id } = useParams();
  const { data: research, isLoading, isError } = useGetResearchQuery(id);
  const { user } = useSelector((state) => state.auth);

  if (isLoading) return <div>Loading research details...</div>;
  if (isError) return <div>Error loading research</div>;

  return (
    <div className="research-details">
      <h1>{research.title}</h1>
      <p className="author">By {research.author.name}</p>
      <div className="research-content">
        <h2>Abstract</h2>
        <p>{research.abstract}</p>

        <h2>Methodology</h2>
        <p>{research.methodology}</p>

        {research.results && (
          <>
            <h2>Results</h2>
            <p>{research.results}</p>
          </>
        )}
      </div>

      {user?.id === research.author.id && (
        <div className="research-actions">
          <button>Edit Research</button>
          <button>Delete Research</button>
        </div>
      )}
    </div>
  );
};

export default ResearchDetails;
