import db from "../config/db.js"; // Update to use `import`

class ProjectCollaborator {
  static async exists(projectId, userId) {
    const [rows] = await db.execute(
      "SELECT 1 FROM project_collaborators WHERE project_id = ? AND user_id = ?",
      [projectId, userId]
    );
    return rows.length > 0;
  }

  static async add({ projectId, userId, role }) {
    const [result] = await db.execute(
      "INSERT INTO project_collaborators (project_id, user_id, role) VALUES (?, ?, ?)",
      [projectId, userId, role]
    );
    return result.insertId;
  }
}

export default ProjectCollaborator; // Ensure it's exported as default
