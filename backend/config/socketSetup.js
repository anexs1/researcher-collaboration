// backend/config/socketSetup.js (Assuming this is the correct path and filename)
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import db from "../models/index.js"; // Adjust path if necessary

const { User, Message, Project, Member } = db; // Ensure Message, Project, Member are correctly loaded from db

const userSockets = new Map(); // Stores mapping: userIdString -> Set<socketId>
let ioInstance = null; // <<<< MODIFIED: Use a different name than the global 'io' if 'io' is used elsewhere, or ensure this is the one. I'll use ioInstance for clarity.

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

  if (ioInstance) {
    // <<<< MODIFIED: Check ioInstance
    console.warn("Socket.IO already initialized. Returning existing instance.");
    return ioInstance;
  }

  if (!jwtSecret)
    throw new Error("FATAL ERROR: JWT_SECRET Environment variable is Missing.");
  if (!httpServer)
    throw new Error("FATAL ERROR: Valid httpServer instance was not provided.");
  if (!User || !Message || !Project || !Member) {
    // Ensure all needed models are checked
    throw new Error(
      "FATAL ERROR: One or more required models (User, Message, Project, Member) are not loaded correctly."
    );
  }

  try {
    // Assign to the module-scoped ioInstance
    ioInstance = new SocketIOServer(httpServer, {
      // <<<< MODIFIED
      cors: {
        origin: frontendUrl,
        methods: ["GET", "POST", "PUT", "DELETE"], // Added PUT, DELETE for completeness
        credentials: true,
      },
    });
    if (!ioInstance)
      // <<<< MODIFIED
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

  // Socket.IO Middleware for Authentication
  ioInstance.use(async (socket, next) => {
    // <<<< MODIFIED
    const token = socket.handshake.auth.token;
    if (!token)
      return next(new Error("Authentication error: No token provided."));
    try {
      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findByPk(decoded.id, {
        attributes: ["id", "username", "profilePictureUrl", "role"], // Include role
      });
      if (!user)
        return next(
          new Error(`Authentication error: User ${decoded.id} not found.`)
        );

      socket.user = user.toJSON(); // Attach full user object (as JSON) to socket
      socket.userId = user.id.toString(); // For convenience
      socket.username = user.username; // For convenience

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

  // Connection Handler
  ioInstance.on("connection", (socket) => {
    // <<<< MODIFIED
    // At this point, socket.user, socket.userId, socket.username are available due to middleware
    const userId = socket.userId; // Already a string from middleware
    const username = socket.username;

    if (!userId) {
      // Should not happen if middleware is effective
      console.error(
        `[Connection Handler CRITICAL] Socket ${socket.id} connected w/o userId! Disconnecting.`
      );
      socket.disconnect(true);
      return;
    }
    console.log(
      `SOCKET.IO: User ${username} (ID: ${userId}, Socket: ${socket.id}) fully connected.`
    );

    socket.on("joinChatRoom", async ({ roomName }, callback) => {
      if (!roomName || !roomName.startsWith("project-")) {
        if (typeof callback === "function")
          callback({ success: false, error: "Invalid room name." });
        return;
      }
      const projectIdStr = roomName.split("-")[1];
      const projectId = parseInt(projectIdStr, 10);

      if (isNaN(projectId)) {
        if (typeof callback === "function")
          callback({
            success: false,
            error: "Invalid project ID in room name.",
          });
        return;
      }

      try {
        const project = await Project.findByPk(projectId, {
          attributes: ["id", "ownerId"],
        });
        if (!project) {
          if (typeof callback === "function")
            callback({ success: false, error: "Project not found." });
          return;
        }
        // User is already authenticated, check if they are owner or member for this project
        const isOwner = project.ownerId === parseInt(userId, 10);
        let isMember = false;
        if (!isOwner) {
          isMember = await Member.findOne({
            where: {
              projectId,
              userId: parseInt(userId, 10),
              status: "active",
            }, // Ensure status check
            attributes: ["id"], // Just need to check existence
          });
        }

        if (!isOwner && !isMember && socket.user.role !== "admin") {
          // Allow admin to join any room
          if (typeof callback === "function")
            callback({
              success: false,
              error: "Access denied to project room.",
            });
          return;
        }

        socket.join(roomName);
        console.log(
          `SOCKET.IO: User ${username} (ID: ${userId}) joined room ${roomName}`
        );
        if (typeof callback === "function")
          callback({ success: true, message: `Joined room ${roomName}` });
      } catch (error) {
        console.error(
          `[Socket Event: joinChatRoom] Error for User ${username} (ID: ${userId}) joining ${roomName}:`,
          error
        );
        if (typeof callback === "function")
          callback({ success: false, error: "Server error joining room." });
      }
    });

    socket.on("leaveChatRoom", ({ roomName }) => {
      if (roomName) {
        socket.leave(roomName);
        console.log(
          `SOCKET.IO: User ${username} (ID: ${userId}) left room ${roomName}`
        );
      }
    });

    socket.on("typing", ({ roomName }) => {
      if (roomName && userId && username) {
        // Ensure all details are present
        socket.to(roomName).emit("userTyping", { userId, username });
      }
    });

    socket.on("stopTyping", ({ roomName }) => {
      if (roomName && userId) {
        // Ensure userId is present
        socket.to(roomName).emit("userStopTyping", { userId });
      }
    });

    // This 'sendMessage' event is for when a client sends a message via WebSocket
    // The API-first approach (client POSTs to API, API saves then emits) is often preferred for chat messages.
    socket.on("sendMessage", async (data, callback) => {
      console.log(
        `SOCKET.IO: Received 'sendMessage' from User ${username} (ID: ${userId}):`,
        data
      );
      try {
        const {
          projectId,
          content,
          // roomName, // roomName can be derived from projectId
          messageType = "text", // Default to text
          fileName,
          fileUrl,
          mimeType,
          fileSize,
        } = data;

        const parsedProjectId = parseInt(projectId, 10);

        if (isNaN(parsedProjectId)) {
          if (typeof callback === "function")
            callback({ success: false, error: "Invalid Project ID." });
          return;
        }
        const roomName = `project-${parsedProjectId}`; // Derive roomName

        if (!content && messageType === "text") {
          if (typeof callback === "function")
            callback({
              success: false,
              error: "Message content cannot be empty for text messages.",
            });
          return;
        }

        // Authorization check: Is user allowed to send message to this project?
        // (already done for joining room, but good to have here too if direct message sending is allowed without explicit join)
        const project = await Project.findByPk(parsedProjectId, {
          attributes: ["id", "ownerId"],
        });
        if (!project) {
          if (typeof callback === "function")
            callback({ success: false, error: "Target project not found." });
          return;
        }
        const isOwner = project.ownerId === parseInt(userId, 10);
        let isMember = false;
        if (!isOwner) {
          isMember = await Member.findOne({
            where: {
              projectId: parsedProjectId,
              userId: parseInt(userId, 10),
              status: "active",
            },
          });
        }
        if (!isOwner && !isMember && socket.user.role !== "admin") {
          if (typeof callback === "function")
            callback({
              success: false,
              error: "Not authorized to send messages to this project.",
            });
          return;
        }

        let newMessageData = {
          projectId: parsedProjectId,
          senderId: parseInt(userId, 10),
          content: content,
          messageType: messageType,
        };

        if (messageType === "file") {
          if (!fileName || !fileUrl || !mimeType || fileSize === undefined) {
            if (typeof callback === "function")
              callback({
                success: false,
                error: "Incomplete file metadata for file message.",
              });
            return;
          }
          newMessageData.fileName = fileName;
          newMessageData.fileUrl = fileUrl;
          newMessageData.mimeType = mimeType;
          newMessageData.fileSize = fileSize;
        }

        const newMessage = await Message.create(newMessageData);

        // Prepare the message object to send to clients (includes sender details)
        const messageToSendToClients = {
          ...newMessage.toJSON(),
          sender: socket.user, // socket.user is already a plain object from middleware
        };

        ioInstance.to(roomName).emit("newMessage", messageToSendToClients); // <<<< MODIFIED: Use ioInstance
        console.log(
          `SOCKET.IO: Broadcasted 'newMessage' to room ${roomName}:`,
          messageToSendToClients
        );

        if (typeof callback === "function") {
          callback({
            success: true,
            message: "Message saved and broadcasted by server.",
            sentMessage: messageToSendToClients, // Send back the full message object
          });
        }
      } catch (error) {
        console.error(
          `[Socket Event: sendMessage] Error processing message from User ${username} (ID: ${userId}):`,
          error
        );
        if (typeof callback === "function") {
          callback({
            success: false,
            error:
              "Server error: Failed to process your message. Please try again.",
          });
        }
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `SOCKET.IO: User ${username} (ID: ${userId}, Socket: ${socket.id}) disconnected. Reason: ${reason}`
      );
      if (userSockets.has(userId)) {
        const userSocketSet = userSockets.get(userId);
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);
          console.log(
            `SOCKET.IO: User ${userId} now has no active sockets. Removed from userSockets.`
          );
        }
      }
      logUserSockets("Socket Disconnect - Remove");
    });

    socket.on("connect_error", (err) => {
      console.error(
        `[Socket connect_error] Socket ${socket.id} (User ${username} / ID ${
          userId || "N/A"
        }): ${err.message}`
      );
    });
  });

  console.log("✅ Socket.IO event handlers configured.");
  return ioInstance; // <<<< MODIFIED: Return ioInstance
};

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// + ADD THIS EXPORTED FUNCTION                                                +
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
export const getIo = () => {
  if (!ioInstance) {
    // <<<< MODIFIED: Check ioInstance
    console.error(
      "Attempted to get Socket.IO instance before proper initialization!"
    );
    throw new Error(
      "Socket.io not initialized! Ensure initSocketIO(httpServer) is called successfully in server.js."
    );
  }
  return ioInstance; // <<<< MODIFIED: Return ioInstance
};
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// This function is for emitting to specific users based on their userId
// It uses the userSockets map to find all socket IDs for a given userId
export const emitToUser = (targetUserId, eventName, data) => {
  if (!ioInstance) {
    // <<<< MODIFIED: Check ioInstance
    console.error(
      "[emitToUser] WARN: Socket.IO 'ioInstance' not initialized. Cannot emit."
    );
    return false;
  }
  if (!targetUserId) {
    console.warn(
      `[emitToUser] WARN: No targetUserId provided for event '${eventName}'.`
    );
    return false;
  }
  const userIdStr = targetUserId.toString();
  const userSocketIds = userSockets.get(userIdStr); // Get the Set of socket IDs

  if (userSocketIds && userSocketIds.size > 0) {
    const socketIdsArray = Array.from(userSocketIds);
    ioInstance.to(socketIdsArray).emit(eventName, data); // <<<< MODIFIED: Use ioInstance
    console.log(
      `[emitToUser] Emitted '${eventName}' to user ${userIdStr} (Sockets: ${socketIdsArray.join(
        ", "
      )}). Data:`,
      data
    );
    return true;
  } else {
    console.log(
      `[emitToUser] No active sockets found for user ${userIdStr} to emit '${eventName}'.`
    );
    return false;
  }
};
