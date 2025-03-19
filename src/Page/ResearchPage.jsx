import React, { useState } from "react";
import ResearchUpload from "../Component/ResearchUpload.jsx";
import ResearchList from "../Component/ResearchList.jsx";
import SearchBar from "../Component/SearchBar.jsx";

const ResearchPage = () => {
  const [results, setResults] = useState([]);

  return (
    <div>
      <h1>Research Portal</h1>
      <ResearchUpload />
      <SearchBar setResults={setResults} />
      <ResearchList papers={results.length > 0 ? results : undefined} />
    </div>
  );
};

export default ResearchPage;
