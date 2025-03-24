const db = require("../config/db");

class Project {
  constructor(id, title, description, status, collaborators) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.status = status;
    this.collaborators = collaborators;
  }

  static async getAll() {
    try {
      const [rows] = await db.query("SELECT * FROM projects");
      return rows.map(
        (row) =>
          new Project(
            row.id,
            row.title,
            row.description,
            row.status,
            JSON.parse(row.collaborators)
          )
      ); // Parse JSON
    } catch (error) {
      console.error("Error getting all projects:", error);
      throw error;
    }
  }

  static async create(title, description, status, collaborators) {
    try {
      const collaboratorsJson = JSON.stringify(collaborators); // Convert to JSON
      const sql =
        "INSERT INTO projects (title, description, status, collaborators) VALUES (?, ?, ?, ?)";
      const [result] = await db.query(sql, [
        title,
        description,
        status,
        collaboratorsJson,
      ]);
      const newProjectId = result.insertId;
      return new Project(
        newProjectId,
        title,
        description,
        status,
        collaborators
      );
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const [rows] = await db.query("SELECT * FROM projects WHERE id = ?", [
        id,
      ]);
      if (rows.length === 0) {
        return null;
      }
      const row = rows[0];
      return new Project(
        row.id,
        row.title,
        row.description,
        row.status,
        JSON.parse(row.collaborators)
      ); // Parse JSON
    } catch (error) {
      console.error("Error getting project by ID:", error);
      throw error;
    }
  }

  static async update(id, title, description, status, collaborators) {
    try {
      const collaboratorsJson = JSON.stringify(collaborators); // Convert to JSON
      const sql =
        "UPDATE projects SET title = ?, description = ?, status = ?, collaborators = ? WHERE id = ?";
      await db.query(sql, [title, description, status, collaboratorsJson, id]);
      return new Project(id, title, description, status, collaborators);
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await db.query("DELETE FROM projects WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  }
}

module.exports = Project;
