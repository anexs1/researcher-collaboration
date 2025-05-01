// backend/config/socketSetup.js
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import db from "../models/index.js"; // Adjust path if necessary

// Ensure all needed models are correctly imported via the db object
const { User, Message, Project, Member } = db;

// --- Module-level variables ---
const userSockets = new Map(); // Stores mapping: userIdString -> Set<socketId>
let io = null; // Holds the initialized Socket.IO server instance

// --- Initialization Function ---
export const initSocketIO = (httpServer) => {
  const jwtSecret = process.env.JWT_SECRET;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"; // Your React app's default URL

  // --- Pre-checks ---
  if (!jwtSecret) {
    throw new Error("FATAL ERROR: JWT_SECRET Environment variable is Missing.");
  }
  if (!httpServer) {
    throw new Error(
      "FATAL ERROR: Valid httpServer instance was not provided to initSocketIO."
    );
  }
  if (!User || !Message || !Project || !Member) {
    console.error("Models loaded:", {
      User: !!User,
      Message: !!Message,
      Project: !!Project,
      Member: !!Member,
    });
    throw new Error(
      "FATAL ERROR: Required database models (User, Message, Project, Member) are not loaded correctly."
    );
  }
  console.log(`Configuring Socket.IO for origin: ${frontendUrl}`);

  // --- Create Socket.IO Server Instance ---
  try {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: frontendUrl, // Allow requests from your frontend
        methods: ["GET", "POST"], // Methods needed for polling & WebSocket handshake
        // credentials: true // Uncomment if using cookies/sessions with sockets
      },
      // REMOVED: transports: ["websocket"],
      // Default transports ['polling', 'websocket'] will be used, allowing polling fallback
    });
    if (!io) {
      throw new Error(
        "Socket.IO server instance creation returned null/undefined."
      );
    }
    console.log(
      "Socket.IO Server instance created successfully (allowing default transports)."
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

  // --- Socket Authentication Middleware ---
  try {
    io.use(async (socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.warn(`Socket Auth Fail (No Token): Socket ${socket.id}`);
        return next(new Error("Authentication error: No token provided."));
      }
      try {
        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findByPk(decoded.id, {
          attributes: ["id", "username"], // Only fetch necessary fields
        });
        if (!user) {
          // Throw specific error if user is not found after token decode
          throw new Error(`User not found (ID: ${decoded.id})`);
        }
        socket.userId = user.id.toString(); // Store user ID as string on the socket
        socket.username = user.username; // Store username

        // Add socket ID to the user's set of sockets
        if (!userSockets.has(socket.userId)) {
          userSockets.set(socket.userId, new Set());
        }
        userSockets.get(socket.userId).add(socket.id);

        next(); // Authentication successful
      } catch (err) {
        // Handle JWT errors (expired, invalid) or User not found error
        console.error(`Socket Auth Fail: Socket ${socket.id}`, err.message);
        next(new Error(`Authentication error: ${err.message}`)); // Pass error to client
      }
    });
    console.log("Socket.IO authentication middleware configured.");
  } catch (middlewareError) {
    console.error(
      "!!! FAILED TO CONFIGURE Socket.IO Middleware !!!",
      middlewareError
    );
    throw new Error(
      `Socket.IO Middleware setup failed: ${middlewareError.message}`
    );
  }

  // --- Main Connection Handler ---
  try {
    io.on("connection", (socket) => {
      // This code runs *after* the authentication middleware succeeds
      const userId = socket.userId;
      const username = socket.username;

      // Double-check if userId is somehow missing after auth (shouldn't happen often)
      if (!userId) {
        console.error(
          `Socket ${socket.id} connected but missing userId after auth middleware. Disconnecting.`
        );
        socket.disconnect(true);
        return;
      }
      console.log(
        `✅ Client Connected: Socket ID ${socket.id}, User ID: ${userId} (${username})`
      );

      // --- Handle Socket Disconnection ---
      socket.on("disconnect", (reason) => {
        console.log(
          `🔌 Client Disconnected: Socket ID ${socket.id}, User ID: ${userId}, Reason: ${reason}`
        );
        // Clean up user's socket ID from the map
        if (userSockets.has(userId)) {
          const userSocketSet = userSockets.get(userId);
          userSocketSet.delete(socket.id);
          // If the user has no more active sockets, remove their entry from the map
          if (userSocketSet.size === 0) {
            userSockets.delete(userId);
            console.log(
              `User ${userId} (${username}) fully disconnected and removed from map.`
            );
          }
        }
      });

      // --- Handle Socket Connection Errors (after initial connection) ---
      socket.on("connect_error", (err) => {
        console.error(
          `Socket Connect Error for ${socket.id} (User ${userId}): ${err.message}`
        );
        // Optionally disconnect if the error is severe
        // socket.disconnect(true);
      });

      // --- Chat Room Management Handlers ---
      socket.on("joinChatRoom", ({ roomName }, callback) => {
        if (roomName && typeof roomName === "string") {
          socket.join(roomName); // Subscribe the socket to the given room
          console.log(
            `Socket ${socket.id} (User ${userId}) joined room: ${roomName}`
          );
          // Acknowledge success via callback if provided
          if (typeof callback === "function") callback({ success: true });
        } else {
          console.error(
            `Invalid roomName provided by User ${userId}:`,
            roomName
          );
          // Acknowledge failure via callback if provided
          if (typeof callback === "function")
            callback({ success: false, error: "Invalid room name." });
        }
      });

      socket.on("leaveChatRoom", ({ roomName }) => {
        if (roomName && typeof roomName === "string") {
          socket.leave(roomName); // Unsubscribe the socket from the room
          console.log(
            `Socket ${socket.id} (User ${userId}) left room: ${roomName}`
          );
          // No callback needed typically for leaving
        }
      });

      // --- Handle Incoming Project Chat Messages ---
      socket.on("sendMessage", async (messageData, callback) => {
        const receivedDataString = JSON.stringify(messageData); // Log incoming data for debugging
        console.log(
          `---> ENTER sendMessage | User: ${userId} | Received: ${receivedDataString}`
        );

        // 1. Extract data (use authenticated senderId)
        const {
          projectId,
          content,
          messageType = "text",
          fileUrl,
          fileName,
          mimeType,
          fileSize,
        } = messageData;
        const senderId = userId; // Trust the authenticated ID

        // 2. Validate Input Data
        let validationError = null;
        const numericProjectId = projectId ? parseInt(projectId, 10) : null;
        const numericSenderId = parseInt(senderId, 10); // Should be valid from auth

        if (!numericSenderId)
          validationError = "Sender ID missing (auth issue).";
        else if (
          !numericProjectId ||
          isNaN(numericProjectId) ||
          numericProjectId <= 0
        )
          validationError = "Invalid Project ID.";
        else if (
          messageType === "text" &&
          (!content || typeof content !== "string" || content.trim() === "")
        )
          validationError = "Text message content required.";
        else if (messageType === "file" && (!fileUrl || !fileName || !mimeType))
          validationError = "File message missing required fields.";
        else if (!["text", "file"].includes(messageType))
          validationError = `Invalid messageType: ${messageType}`;

        if (validationError) {
          console.error("---> VALIDATION FAILED:", validationError);
          if (typeof callback === "function")
            return callback({
              success: false,
              error: `Invalid input: ${validationError}`,
            });
          else return; // Stop if invalid
        }
        console.log(`---> Validation PASSED for messageType: ${messageType}`);

        // 3. Authorization Check (Can sender post in this project?)
        try {
          const project = await Project.findByPk(numericProjectId, {
            attributes: ["ownerId"],
          });
          if (!project) throw new Error("Project not found.");

          const isOwner = project.ownerId === numericSenderId;
          let isMember = false;
          if (!isOwner) {
            const membership = await Member.findOne({
              where: {
                userId: numericSenderId,
                projectId: numericProjectId,
                status: "active",
              },
              attributes: ["userId"],
            });
            isMember = !!membership;
          }

          if (!isOwner && !isMember)
            throw new Error("Not an active member or owner.");
          console.log(
            `Authorization Passed for User ${senderId} in Project ${numericProjectId}.`
          );
        } catch (authError) {
          console.error(
            `Authorization Failed: User ${senderId}, Project ${numericProjectId}`,
            authError
          );
          if (typeof callback === "function")
            return callback({
              success: false,
              error: authError.message || "Permission denied.",
            });
          else return;
        }

        // 4. Prepare Data for Saving
        const dataToSave = {
          senderId: numericSenderId,
          projectId: numericProjectId,
          messageType: messageType,
          content: typeof content === "string" ? content.trim() : content, // Trim text, keep file content as is (null)
          fileUrl: messageType === "file" ? fileUrl : null,
          fileName: messageType === "file" ? fileName : null,
          mimeType: messageType === "file" ? mimeType : null,
          fileSize:
            messageType === "file" && !isNaN(parseInt(fileSize))
              ? parseInt(fileSize)
              : null,
        };
        console.log(
          ">>> [sendMessage] Data prepared for saving:",
          JSON.stringify(dataToSave, null, 2)
        );

        // 5. Save Message to Database
        try {
          const newMessage = await Message.create(dataToSave);

          // 6. Fetch message with sender details for broadcast
          const messageToSend = await Message.findByPk(newMessage.id, {
            include: [
              {
                model: User,
                as: "sender",
                attributes: ["id", "username", "profilePictureUrl"],
              },
            ],
          });
          if (!messageToSend)
            throw new Error("Failed to fetch created message with details.");

          const finalMessageObject = messageToSend.toJSON();
          console.log(
            ">>> [sendMessage] Message fetched for broadcast:",
            JSON.stringify(finalMessageObject, null, 2)
          );

          // 7. Broadcast the complete message object to the project room
          const targetRoom = `project-${numericProjectId}`;
          console.log(
            `Message saved (ID: ${newMessage.id}, Type: ${finalMessageObject.messageType}), broadcasting to room: ${targetRoom}`
          );
          io.to(targetRoom).emit("newMessage", finalMessageObject); // Event name is 'newMessage'

          // 8. Acknowledge success back to the sender
          if (typeof callback === "function") {
            callback({
              success: true,
              messageId: newMessage.id,
              sentMessage: finalMessageObject,
            }); // Optionally send back the full message
          }
        } catch (dbError) {
          console.error(
            `Error saving/broadcasting message: User ${senderId}, Project ${numericProjectId}`,
            dbError
          );
          if (typeof callback === "function") {
            callback({
              success: false,
              error: "Server error handling message.",
            });
          }
        }
      }); // --- End sendMessage Handler ---

      // --- Add other socket event listeners here ---
      // socket.on('typing', ({ roomName }) => { /* ... */ });
      // socket.on('stopTyping', ({ roomName }) => { /* ... */ });
    }); // --- End io.on("connection") ---

    console.log("Socket.IO connection handler configured successfully.");
  } catch (connectionHandlerError) {
    console.error(
      "!!! FAILED TO CONFIGURE Socket.IO Connection Handler !!!",
      connectionHandlerError
    );
    throw new Error(
      `Socket.IO Connection handler setup failed: ${connectionHandlerError.message}`
    );
  }

  console.log("💬 WebSocket server initialization completed successfully.");
  return io; // Return the initialized io instance for potential use elsewhere
}; // --- End initSocketIO ---

// --- Function to Emit Event to Specific User(s) ---
// Sends an event to all connected sockets for a given userId
export const emitToUser = (targetUserId, eventName, data) => {
  if (!io) {
    // Check if io has been initialized
    console.error(
      "Socket.IO WARN: emitToUser called before Socket.IO initialization finished."
    );
    return false; // Cannot emit if server isn't ready
  }
  if (!targetUserId) {
    console.warn(
      `emitToUser WARNING: No targetUserId provided for event '${eventName}'.`
    );
    return false;
  }
  const userIdStr = targetUserId.toString(); // Ensure string format for map key
  const userSocketIds = userSockets.get(userIdStr); // Get the Set of socket IDs for the user

  if (userSocketIds && userSocketIds.size > 0) {
    // If the user has active sockets
    const socketIdArray = Array.from(userSocketIds); // Convert Set to Array for io.to()
    console.log(
      `Emitting '${eventName}' to User ${userIdStr} (Sockets: ${socketIdArray.join(
        ", "
      )})`
    );
    io.to(socketIdArray).emit(eventName, data); // Emit to the specific socket IDs
    return true; // Indicate successful emission attempt
  } else {
    // User is not currently connected with any socket
    console.log(
      `Emit Notice: User ${userIdStr} not currently connected for event '${eventName}'.`
    );
    return false;
  }
};
