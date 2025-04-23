const db = require("../config/db.config");

class Project {
  static async create({
    title,
    description,
    owner_id,
    required_collaborators,
  }) {
    const [result] = await db.execute(
      "INSERT INTO projects (title, description, owner_id, required_collaborators) VALUES (?, ?, ?, ?)",
      [title, description, owner_id, required_collaborators]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.execute("SELECT * FROM projects WHERE id = ?", [
      id,
    ]);
    return rows[0];
  }

  static async findByOwner(owner_id) {
    const [rows] = await db.execute(
      "SELECT * FROM projects WHERE owner_id = ?",
      [owner_id]
    );
    return rows;
  }

  static async updateStatus(id, status) {
    await db.execute("UPDATE projects SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
  }

  static async getCollaboratorCount(project_id) {
    const [rows] = await db.execute(
      "SELECT COUNT(*) as count FROM collaborators WHERE project_id = ?",
      [project_id]
    );
    return rows[0].count;
  }

  static async delete(id) {
    await db.execute("DELETE FROM projects WHERE id = ?", [id]);
  }
}

module.exports = Project;
