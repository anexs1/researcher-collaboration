import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ResearchDetails = () => {
  const { id } = useParams();
  const [research, setResearch] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/research/${id}`)
      .then((res) => res.json())
      .then((data) => setResearch(data))
      .catch((err) => console.error("Error fetching data:", err));
  }, [id]);

  if (!research) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8 bg-white rounded shadow">
      <h1 className="text-3xl font-bold text-purple-700">{research.title}</h1>
      <p className="text-sm text-gray-500 mb-2">
        By <span className="font-medium">{research.researcher}</span>
      </p>
      <p className="text-sm mb-4">
        Field: <span className="italic">{research.field}</span>
      </p>
      <p className="text-gray-700 leading-relaxed">{research.description}</p>
    </div>
  );
};

export default ResearchDetails;
