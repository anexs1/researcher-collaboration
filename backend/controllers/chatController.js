import ChatRoom from "../models/ChatRoom.js";
import Message from "../models/Message.js";
import Project from "../models/project.js";
import ProjectCollaborator from "../models/ProjectCollaborator.js";

// Get all messages for a project
export const getMessages = async (req, res) => {
  try {
    const isCollaborator = await ProjectCollaborator.exists(
      req.params.projectId,
      req.user.id
    );

    if (!isCollaborator) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this chat",
      });
    }

    const messages = await Message.findByProject(req.params.projectId);
    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const isCollaborator = await ProjectCollaborator.exists(
      req.params.projectId,
      req.user.id
    );

    if (!isCollaborator) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to post in this chat",
      });
    }

    const message = await Message.create({
      projectId: req.params.projectId,
      userId: req.user.id,
      content: req.body.content,
    });

    req.app
      .get("io")
      .to(`project_${req.params.projectId}`)
      .emit("new_message", message);

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create a chat room (initialize)
export const createChatRoom = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (project.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only project owner can initialize chat",
      });
    }

    const existingChat = await ChatRoom.findByProject(req.params.projectId);
    if (existingChat) {
      return res
        .status(400)
        .json({ success: false, message: "Chat room already exists" });
    }

    const chatRoom = await ChatRoom.create(req.params.projectId);

    res.status(201).json({ success: true, data: chatRoom });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
