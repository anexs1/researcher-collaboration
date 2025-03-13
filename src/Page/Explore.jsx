import React, { useState, useEffect } from "react";
import "./Explore.css";

const Explore = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch data (or simulate it)
    const fetchData = async () => {
      // Simulating fetching data
      const response = await fetch("/api/researchers"); // Replace with your actual API
      const result = await response.json();
      setData(result);
    };

    fetchData();
  }, []);

  return (
    <div className="explore-container">
      <h1>Explore Research & Collaborations</h1>
      <div className="research-list">
        {data.length > 0 ? (
          data.map((item, index) => (
            <div className="research-card" key={index}>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <button className="explore-btn">Explore</button>
            </div>
          ))
        ) : (
          <p>No research available. Please check back later.</p>
        )}
      </div>
    </div>
  );
};

export default Explore;
