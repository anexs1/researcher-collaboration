const Project = require("../models/project.model");
const Collaborator = require("../models/collaborator.model");
const ChatRoom = require("../models/chat.model");
const NotificationService = require("./notification.service");

class ChatService {
  static async checkAndCreateChat(projectId) {
    const project = await Project.findById(projectId);
    const collaboratorCount = await Project.getCollaboratorCount(projectId);

    if (
      collaboratorCount >= project.required_collaborators &&
      project.status === "open"
    ) {
      // Create chat room
      await ChatRoom.create(projectId);

      // Update project status
      await Project.updateStatus(projectId, "active");

      // Notify all collaborators
      const collaborators = await Collaborator.getByProject(projectId);
      await Promise.all(
        collaborators.map((c) =>
          NotificationService.notifyChatCreated(c.user_id, projectId)
        )
      );

      return true;
    }
    return false;
  }

  static async sendMessage(roomId, userId, content) {
    const messageId = await Message.create(roomId, userId, content);

    // Get all participants
    const participants = await ChatRoom.getParticipants(roomId);

    // Notify all participants except sender
    await Promise.all(
      participants
        .filter((p) => p.user_id !== userId)
        .map((p) =>
          NotificationService.notifyNewMessage(p.user_id, roomId, messageId)
        )
    );

    return messageId;
  }
}

module.exports = ChatService;
