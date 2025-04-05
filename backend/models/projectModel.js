import db from "../config/db.js";

class Project {
  constructor(id, title, description, status, collaborators, tags, dueDate) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.status = status || "Ongoing";
    this.collaborators = collaborators || [];
    this.tags = tags || [];
    this.dueDate = dueDate;
  }

  static async create(projectData) {
    try {
      const {
        title,
        description,
        status = "Ongoing",
        collaborators = [],
        tags = [],
        dueDate = null,
      } = projectData;

      // Validate required fields
      if (!title || !description) {
        throw new Error("Title and description are required");
      }

      // Convert arrays to JSON strings
      const collaboratorsJson = JSON.stringify(collaborators);
      const tagsJson = JSON.stringify(tags);

      // Format dueDate for MySQL
      const formattedDueDate = dueDate
        ? new Date(dueDate).toISOString().split("T")[0]
        : null;

      // Execute the query with proper parameter binding
      const [result] = await db.execute(
        `INSERT INTO projects 
         (title, description, status, collaborators, tags, dueDate)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          title,
          description,
          status,
          collaboratorsJson,
          tagsJson,
          formattedDueDate,
        ]
      );

      // Return the newly created project
      return new Project(
        result.insertId,
        title,
        description,
        status,
        collaborators,
        tags,
        dueDate
      );
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  // ... keep other methods the same ...
}

export default Project;
