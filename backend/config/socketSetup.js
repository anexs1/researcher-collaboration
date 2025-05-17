import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import db from "../models/index.js"; // Adjust path if necessary

const { User, Message, Project, Member } = db; // Ensure Message, Project, Member are correctly loaded from db

const userSockets = new Map(); // Stores mapping: userIdString -> Set<socketId>
let io = null; // Will hold the Socket.IO server instance

const logUserSockets = (context) => {
  const mapEntries = Array.from(userSockets.entries()).map(
    ([userId, socketSet]) =>
      `User ${userId}: ${Array.from(socketSet).join(", ")}`
  );
  const logString = `{ ${mapEntries.join("; ")} }`;
  console.log(
    `[${context}] UserSockets (${
      userSockets.size
    } users): ${logString.substring(0, 500)}${
      logString.length > 500 ? "..." : ""
    }`
  );
};

export const initSocketIO = (httpServer) => {
  const jwtSecret = process.env.JWT_SECRET;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (!jwtSecret)
    throw new Error("FATAL ERROR: JWT_SECRET Environment variable is Missing.");
  if (!httpServer)
    throw new Error("FATAL ERROR: Valid httpServer instance was not provided.");
  if (!User || !Message || !Project || !Member) {
    throw new Error(
      "FATAL ERROR: One or more required models (User, Message, Project, Member) are not loaded correctly."
    );
  }

  try {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: frontendUrl,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });
    if (!io)
      throw new Error(
        "Socket.IO server instance creation returned null/undefined."
      );
  } catch (creationError) {
    console.error(
      "!!! FAILED TO CREATE Socket.IO Server instance !!!",
      creationError
    );
    throw new Error(
      `Socket.IO Server creation failed: ${creationError.message}`
    );
  }

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token)
      return next(new Error("Authentication error: No token provided."));
    try {
      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findByPk(decoded.id, {
        attributes: ["id", "username", "profilePictureUrl", "role"],
      });
      if (!user)
        return next(
          new Error(`Authentication error: User ${decoded.id} not found.`)
        );

      socket.user = user.toJSON();
      socket.userId = user.id.toString();
      socket.username = user.username;

      if (!userSockets.has(socket.userId))
        userSockets.set(socket.userId, new Set());
      userSockets.get(socket.userId).add(socket.id);
      logUserSockets("Socket Middleware - Add");
      next();
    } catch (err) {
      console.error(
        `[Socket Auth Fail] Socket ${socket.id}, Err: ${err.message}`
      );
      next(
        new Error(
          `Authentication error: ${
            err.name === "TokenExpiredError" ? "Token expired" : "Invalid token"
          }`
        )
      );
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id.toString();
    const username = socket.user.username;

    if (!userId) {
      console.error(
        `[Connection Handler CRITICAL] Socket ${socket.id} connected w/o userId! Disconnecting.`
      );
      socket.disconnect(true);
      return;
    }

    socket.on("joinChatRoom", async ({ roomName }, callback) => {
      if (!roomName || !roomName.startsWith("project-")) {
        if (typeof callback === "function")
          callback({ success: false, error: "Invalid room name." });
        return;
      }
      const projectId = parseInt(roomName.split("-")[1], 10);
      if (isNaN(projectId)) {
        if (typeof callback === "function")
          callback({
            success: false,
            error: "Invalid project ID in room name.",
          });
        return;
      }

      try {
        const project = await Project.findByPk(projectId);
        if (!project) {
          if (typeof callback === "function")
            callback({ success: false, error: "Project not found." });
          return;
        }
        const isOwner = project.ownerId === parseInt(userId, 10);
        const isMember = await Member.findOne({
          where: { projectId, userId: parseInt(userId, 10), status: "active" },
        });

        if (!isOwner && !isMember) {
          if (typeof callback === "function")
            callback({
              success: false,
              error: "Access denied to project room.",
            });
          return;
        }

        socket.join(roomName);
        if (typeof callback === "function")
          callback({ success: true, message: `Joined room ${roomName}` });
      } catch (error) {
        console.error(
          `[Socket Event: joinChatRoom] Error for User ${userId} joining ${roomName}:`,
          error
        );
        if (typeof callback === "function")
          callback({ success: false, error: "Server error joining room." });
      }
    });

    socket.on("leaveChatRoom", ({ roomName }) => {
      if (roomName) {
        socket.leave(roomName);
      }
    });

    socket.on("typing", ({ roomName }) => {
      if (roomName) {
        socket.to(roomName).emit("userTyping", { userId, username });
      }
    });

    socket.on("stopTyping", ({ roomName }) => {
      if (roomName) {
        socket.to(roomName).emit("userStopTyping", { userId });
      }
    });

    socket.on("sendMessage", async (data, callback) => {
      try {
        const {
          projectId,
          content,
          roomName,
          messageType = "text",
          fileName,
          fileUrl,
          mimeType,
          fileSize,
        } = data;

        if (!projectId || !roomName) {
          if (typeof callback === "function")
            callback({
              success: false,
              error: "Missing project/room identifier",
            });
          return;
        }
        if (!content && messageType === "text") {
          if (typeof callback === "function")
            callback({
              success: false,
              error: "Message content cannot be empty.",
            });
          return;
        }

        let newMessageData = {
          projectId: parseInt(projectId, 10),
          senderId: parseInt(userId, 10),
          content: content,
          messageType: messageType,
        };

        if (messageType === "file") {
          if (!fileName || !fileUrl || !mimeType || fileSize === undefined) {
            if (typeof callback === "function")
              callback({ success: false, error: "Incomplete file metadata." });
            return;
          }
          newMessageData.fileName = fileName;
          newMessageData.fileUrl = fileUrl;
          newMessageData.mimeType = mimeType;
          newMessageData.fileSize = fileSize;
        }

        const newMessage = await Message.create(newMessageData);

        const senderDetails = {
          id: socket.user.id,
          username: socket.user.username,
          profilePictureUrl: socket.user.profilePictureUrl,
        };

        const messageToSendToClients = {
          ...newMessage.toJSON(),
          sender: senderDetails,
        };

        io.to(roomName).emit("newMessage", messageToSendToClients);

        if (typeof callback === "function") {
          callback({
            success: true,
            message: "Message processed and broadcasted by server.",
            sentMessage: messageToSendToClients,
          });
        }
      } catch (error) {
        console.error(
          `[Socket Event: sendMessage] Error processing message from User ID ${userId}:`,
          error
        );
        if (typeof callback === "function") {
          callback({
            success: false,
            error: "Server failed to process message. Please try again.",
          });
        }
      }
    });

    socket.on("disconnect", (reason) => {
      if (userSockets.has(userId)) {
        const userSocketSet = userSockets.get(userId);
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);
        }
      }
    });

    socket.on("connect_error", (err) => {
      console.error(
        `[Socket connect_error] Socket ${socket.id} (User ${
          userId || "N/A"
        }): ${err.message}`
      );
    });
  });

  return io;
};

export const emitToUser = (targetUserId, eventName, data) => {
  if (!io) {
    console.error("[emitToUser] WARN: Socket.IO 'io' not initialized.");
    return false;
  }
  if (!targetUserId) {
    console.warn(`[emitToUser] WARN: No targetUserId for '${eventName}'.`);
    return false;
  }
  const userIdStr = targetUserId.toString();
  const userSocketIds = userSockets.get(userIdStr);
  if (userSocketIds && userSocketIds.size > 0) {
    io.to(Array.from(userSocketIds)).emit(eventName, data);
    return true;
  }
  return false;
};
