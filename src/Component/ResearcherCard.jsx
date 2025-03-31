import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons"; // Import specific icon

const ResearcherCard = ({ onClick }) => {
  return (
    <div
      className="relative p-5 rounded-xl bg-white bg-opacity-60 backdrop-blur-md shadow-lg border border-gray-300 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        <FontAwesomeIcon
          icon={faUser}
          size="2x"
          className="mb-3 text-yellow-500"
        />
        <h3 className="font-semibold text-gray-700 text-lg">Researcher</h3>
        <p className="text-gray-500 text-sm text-center">
          Citizen scientists and journalists
        </p>
      </div>
    </div>
  );
};

export default ResearcherCard;
