// backend/config/socketSetup.js
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
    // Added Message, Project, Member check
    throw new Error(
      "FATAL ERROR: One or more required models (User, Message, Project, Member) are not loaded correctly."
    );
  }

  console.log(`Configuring Socket.IO for origin: ${frontendUrl}`);
  try {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: frontendUrl,
        methods: ["GET", "POST"],
        credentials: true,
      }, // Added credentials: true
    });
    if (!io)
      throw new Error(
        "Socket.IO server instance creation returned null/undefined."
      );
    console.log("Socket.IO Server instance created successfully.");
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
    console.log(
      `[Socket Middleware] Attempt: Socket ${
        socket.id
      }. Token present: ${!!token}`
    );
    if (!token)
      return next(new Error("Authentication error: No token provided."));
    try {
      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findByPk(decoded.id, {
        attributes: ["id", "username", "profilePictureUrl", "role"],
      }); // Added profilePictureUrl, role
      if (!user)
        return next(
          new Error(`Authentication error: User ${decoded.id} not found.`)
        );

      socket.user = user.toJSON(); // Store full user object (or selected fields)
      socket.userId = user.id.toString(); // For consistency with previous logic if still used elsewhere
      socket.username = user.username; // For logging

      if (!userSockets.has(socket.userId))
        userSockets.set(socket.userId, new Set());
      userSockets.get(socket.userId).add(socket.id);
      logUserSockets("Socket Middleware - Add");
      console.log(
        `[Socket Auth OK] Socket ${socket.id} -> User ${socket.userId} (${socket.username})`
      );
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
    const userId = socket.user.id.toString(); // Ensure string
    const username = socket.user.username;

    if (!userId) {
      console.error(
        `[Connection Handler CRITICAL] Socket ${socket.id} connected w/o userId! Disconnecting.`
      );
      socket.disconnect(true);
      return;
    }
    console.log(
      `✅ [Socket Connected] User: ${username} (ID: ${userId}), Socket ID: ${socket.id}`
    );
    logUserSockets("Socket Connected - Map State");

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
        // Authorization: Check if user is member or owner of the project
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
        console.log(
          `[Socket Event: joinChatRoom] User ${userId} (${username}) joined room: ${roomName}`
        );
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
        console.log(
          `[Socket Event: leaveChatRoom] User ${userId} (${username}) left room: ${roomName}`
        );
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

    // --- ⭐ THIS IS THE CRUCIAL HANDLER THAT WAS MISSING/INCOMPLETE ⭐ ---
    socket.on("sendMessage", async (data, callback) => {
      console.log(
        `[Socket Event: sendMessage] Received from User ID ${userId} (${username}):`,
        JSON.stringify(data).substring(0, 200)
      );
      try {
        const {
          projectId,
          content,
          roomName, // Should match `project-${projectId}`
          messageType = "text",
          fileName,
          fileUrl,
          mimeType,
          fileSize,
        } = data;

        if (!projectId || !roomName) {
          console.error(
            "[Socket sendMessage] Error: Missing projectId or roomName."
          );
          if (typeof callback === "function")
            callback({
              success: false,
              error: "Missing project/room identifier",
            });
          return;
        }
        if (!content && messageType === "text") {
          // For text messages, content is required
          console.error(
            "[Socket sendMessage] Error: Missing content for text message."
          );
          if (typeof callback === "function")
            callback({
              success: false,
              error: "Message content cannot be empty.",
            });
          return;
        }

        // Optional: Re-verify user's permission to send to this project/room
        // (Can be skipped if joinChatRoom authorization is deemed sufficient for the session)

        let newMessageData = {
          projectId: parseInt(projectId, 10),
          senderId: parseInt(userId, 10), // Ensure senderId is an integer if DB expects it
          content: content,
          messageType: messageType,
        };

        if (messageType === "file") {
          if (!fileName || !fileUrl || !mimeType || fileSize === undefined) {
            // fileSize can be 0
            console.error(
              "[Socket sendMessage] Error: Missing required file metadata for file message type."
            );
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

        // Use socket.user which was populated by the auth middleware
        const senderDetails = {
          id: socket.user.id,
          username: socket.user.username,
          profilePictureUrl: socket.user.profilePictureUrl, // Make sure this is fetched in auth middleware
        };

        const messageToSendToClients = {
          ...newMessage.toJSON(),
          sender: senderDetails,
        };

        io.to(roomName).emit("newMessage", messageToSendToClients);
        console.log(
          `[Socket Event: newMessage] Broadcasted to room ${roomName}.`
        );

        // Send acknowledgment back to the client
        if (typeof callback === "function") {
          console.log(
            "[Socket sendMessage] Sending SUCCESS acknowledgment to client."
          );
          callback({
            success: true,
            message: "Message processed and broadcasted by server.",
            sentMessage: messageToSendToClients, // Send the confirmed message back
          });
        }
      } catch (error) {
        console.error(
          `[Socket Event: sendMessage] Error processing message from User ID ${userId}:`,
          error
        );
        if (typeof callback === "function") {
          console.log(
            "[Socket sendMessage] Sending FAILURE acknowledgment to client."
          );
          callback({
            success: false,
            error: "Server failed to process message. Please try again.",
          });
        }
      }
    });
    // --- ⭐ END OF sendMessage HANDLER ⭐ ---

    socket.on("disconnect", (reason) => {
      console.log(
        `🔌 [Socket Disconnected] User: ${username} (ID: ${userId}), Socket ID: ${socket.id}, Reason: ${reason}`
      );
      logUserSockets(`Disconnect - Before User ${userId}, Socket ${socket.id}`);
      if (userSockets.has(userId)) {
        const userSocketSet = userSockets.get(userId);
        const deleted = userSocketSet.delete(socket.id);
        console.log(
          `[Disconnect] Deleted Socket ${socket.id} from User ${userId} Set: ${deleted}. Set size: ${userSocketSet.size}`
        );
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);
          console.log(
            `[Disconnect] User ${userId} (${username}) removed from map.`
          );
          logUserSockets(`Disconnect - After User ${userId} Removed`);
        } else {
          logUserSockets(
            `Disconnect - After Socket ${socket.id} Removed for User ${userId}`
          );
        }
      } else {
        console.warn(
          `[Disconnect] User ${userId} NOT in map (Socket ${socket.id}).`
        );
        logUserSockets(`Disconnect - User ${userId} Not Found`);
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

  console.log("💬 WebSocket server initialization completed successfully.");
  return io;
};

export const emitToUser = (targetUserId, eventName, data) => {
  console.log(
    `[emitToUser] Prep: '${eventName}' to User ${targetUserId}. Data: ${JSON.stringify(
      data
    ).substring(0, 100)}...`
  );
  if (!io) {
    console.error("[emitToUser] WARN: Socket.IO 'io' not initialized.");
    return false;
  }
  if (!targetUserId) {
    console.warn(`[emitToUser] WARN: No targetUserId for '${eventName}'.`);
    return false;
  }
  const userIdStr = targetUserId.toString();
  logUserSockets(`emitToUser - Check map for User ${userIdStr}`);
  const userSocketIds = userSockets.get(userIdStr);
  console.log(
    `[emitToUser] Lookup for User ${userIdStr}:`,
    userSocketIds ? `Found Set(${userSocketIds.size})` : "Not Found"
  );
  if (userSocketIds && userSocketIds.size > 0) {
    const socketIdArray = Array.from(userSocketIds);
    console.log(
      `[emitToUser] Emitting '${eventName}' to User ${userIdStr} via Sockets: [${socketIdArray.join(
        ", "
      )}]`
    );
    io.to(socketIdArray).emit(eventName, data);
    return true;
  } else {
    console.log(
      `[emitToUser] Notice: User ${userIdStr} not connected for '${eventName}'.`
    );
    return false;
  }
};
