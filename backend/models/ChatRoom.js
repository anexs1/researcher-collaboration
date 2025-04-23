import db from "../config/db.js";

class ChatRoom {
  static async create(projectId) {
    const [result] = await db.execute(
      "INSERT INTO chat_rooms (project_id) VALUES (?)",
      [projectId]
    );
    return result.insertId;
  }

  static async findByProject(projectId) {
    const [rows] = await db.execute(
      "SELECT * FROM chat_rooms WHERE project_id = ?",
      [projectId]
    );
    return rows[0];
  }

  static async getParticipants(roomId) {
    const [rows] = await db.execute(
      `SELECT u.id as user_id, u.username 
       FROM chat_room_participants crp
       JOIN users u ON crp.user_id = u.id
       WHERE crp.chat_room_id = ?`,
      [roomId]
    );
    return rows;
  }
}

export default ChatRoom;
