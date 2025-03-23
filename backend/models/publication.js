import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const backendURL = "http://localhost:5000"; // <---- MAKE THIS CHANGE
const fetchPublications = async () => {
  try {
    const response = await fetch(`${backendURL}/api/user`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await response.json();
    setPublications(data);
  } catch (error) {
    console.error("Error fetching publications:", error);
  }
};

const Publication = sequelize.define(
  "Publication",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    abstract: {
      // Changed from description to abstract
      type: DataTypes.TEXT,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    document_link: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    //Qualifications and contact doesnt exist, so we deleted them to prevent any future bugs
  },
  {
    tableName: "publications", // Optional: Specify table name
    timestamps: false, // Disable auto created columns
  }
);

export default Publication;
