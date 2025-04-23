import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useGetPublicationsQuery } from "../../api/publicationApi";
import PublicationCard from "../../Component/Publication/PublicationCard";

const Publication = () => {
  const { data: publications, isLoading, isError } = useGetPublicationsQuery();
  const { user } = useSelector((state) => state.auth);
  const [filter, setFilter] = useState("all");

  if (isLoading) return <div>Loading publications...</div>;
  if (isError) return <div>Error loading publications</div>;

  const filteredPublications = publications.filter((pub) => {
    if (filter === "all") return true;
    if (filter === "mine") return pub.author.id === user?.id;
    return pub.type === filter;
  });

  return (
    <div className="publication-page">
      <div className="publication-header">
        <h1>Publications</h1>
        <div className="publication-filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Publications</option>
            <option value="mine">My Publications</option>
            <option value="journal">Journal Articles</option>
            <option value="conference">Conference Papers</option>
            <option value="thesis">Theses</option>
          </select>
          {user && (
            <button
              className="new-publication-btn"
              onClick={() => (window.location.href = "/publications/new")}
            >
              + New Publication
            </button>
          )}
        </div>
      </div>

      <div className="publication-list">
        {filteredPublications.length > 0 ? (
          filteredPublications.map((publication) => (
            <PublicationCard
              key={publication.id}
              publication={publication}
              isOwner={publication.author.id === user?.id}
            />
          ))
        ) : (
          <p>No publications found</p>
        )}
      </div>
    </div>
  );
};

export default Publication;
