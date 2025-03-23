// models/projectModel.js
import pool from "../config/db.js";

const projectModel = {
  createProject: async (project) => {
    const { title, description, status, collaborators } = project;

    console.log("Creating project with data:", {
      title,
      description,
      status,
      collaborators,
    }); // Debugging

    try {
      const [result] = await pool.query(
        "INSERT INTO Projects (title, description, status, collaborators) VALUES (?, ?, ?, ?)",
        [title, description, status, JSON.stringify(collaborators)]
      );
      return result.insertId; // Return the ID of the new project
    } catch (error) {
      console.error("Error creating project:", error);
      throw error; // Re-throw the error to be handled by the controller
    }
  },
  // ... other functions
};

export default projectModel;
