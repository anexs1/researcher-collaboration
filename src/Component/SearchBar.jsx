import React, { useState } from "react";
import axios from "axios";

const SearchBar = ({ setResults }) => {
  const [keyword, setKeyword] = useState("");

  const handleSearch = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/publications/search?keyword=${keyword}`
      );
      setResults(response.data);
    } catch (error) {
      console.error("Search failed", error);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search research..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

export default SearchBar;
