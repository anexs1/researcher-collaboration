import db from "../config/db.js";

class Message {
  static async create(roomId, userId, content) {
    const [result] = await db.execute(
      "INSERT INTO messages (chat_room_id, user_id, content) VALUES (?, ?, ?)",
      [roomId, userId, content]
    );
    return {
      id: result.insertId,
      chat_room_id: roomId,
      user_id: userId,
      content,
      created_at: new Date(), // optional if you want to send this back immediately
    };
  }

  static async findByProject(projectId) {
    const [rows] = await db.execute(
      `SELECT m.*, u.username as user_name 
       FROM messages m
       JOIN chat_rooms cr ON m.chat_room_id = cr.id
       JOIN users u ON m.user_id = u.id
       WHERE cr.project_id = ?
       ORDER BY m.created_at ASC`,
      [projectId]
    );
    return rows;
  }
}

export default Message;
