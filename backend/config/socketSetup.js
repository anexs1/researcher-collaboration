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
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

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
      cors: { origin: frontendUrl, methods: ["GET", "POST"] },
      transports: ["websocket"],
    });
    if (!io) {
      throw new Error(
        "Socket.IO server instance creation returned null/undefined."
      );
    }
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
        const user = await User.findByPk(decoded.id);
        if (!user) {
          throw new Error(`User not found (ID: ${decoded.id})`);
        }
        socket.userId = user.id.toString();
        socket.username = user.username;
        if (!userSockets.has(socket.userId)) {
          userSockets.set(socket.userId, new Set());
        }
        userSockets.get(socket.userId).add(socket.id);
        next();
      } catch (err) {
        console.error(`Socket Auth Fail: Socket ${socket.id}`, err.message);
        next(new Error(`Authentication error: ${err.message}`));
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
      const userId = socket.userId;
      const username = socket.username;

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
        if (userSockets.has(userId)) {
          const userSocketSet = userSockets.get(userId);
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            userSockets.delete(userId);
            console.log(
              `User ${userId} (${username}) fully disconnected and removed from map.`
            );
          }
        }
      });

      // --- Handle Socket Connection Errors ---
      socket.on("connect_error", (err) => {
        console.error(
          `Socket Connect Error for ${socket.id} (User ${userId}): ${err.message}`
        );
      });

      // --- Chat Room Management Handlers ---
      socket.on("joinChatRoom", ({ roomName }, callback) => {
        if (roomName && typeof roomName === "string") {
          socket.join(roomName);
          console.log(
            `Socket ${socket.id} (User ${userId}) joined room: ${roomName}`
          );
          if (typeof callback === "function") callback({ success: true });
        } else {
          console.error(
            `Invalid roomName provided by User ${userId}:`,
            roomName
          );
          if (typeof callback === "function")
            callback({ success: false, error: "Invalid room name." });
        }
      });

      socket.on("leaveChatRoom", ({ roomName }) => {
        if (roomName && typeof roomName === "string") {
          socket.leave(roomName);
          console.log(
            `Socket ${socket.id} (User ${userId}) left room: ${roomName}`
          );
        }
      });

      // --- Handle Incoming Project Chat Messages ---
      // ****** EDITED sendMessage Handler ******
      socket.on("sendMessage", async (messageData, callback) => {
        const receivedDataString = JSON.stringify(messageData);
        console.log(
          `---> ENTER sendMessage | User: ${userId} | Received: ${receivedDataString}`
        );

        // 1. Extract ALL relevant data
        const {
          projectId,
          content, // May be null/placeholder for files
          messageType = "text", // Default to 'text' if not provided
          fileUrl,
          fileName,
          mimeType,
          fileSize,
        } = messageData;
        const senderId = userId; // Use the authenticated user ID

        // 2. Validate Input Data (Adjusted)
        let validationError = null;
        const numericProjectId = projectId ? parseInt(projectId, 10) : null; // Convert early, check for null/NaN
        const numericSenderId = parseInt(senderId, 10); // Should always be valid from middleware

        if (!numericSenderId) {
          validationError = "Sender ID missing (authentication issue).";
        } else if (
          !numericProjectId ||
          isNaN(numericProjectId) ||
          numericProjectId <= 0
        ) {
          validationError = "Invalid or missing Project ID.";
        } else if (
          messageType === "text" &&
          (!content || typeof content !== "string" || content.trim() === "")
        ) {
          // Validate content only for text messages
          validationError = "Text message content cannot be empty.";
        } else if (
          messageType === "file" && // Changed from messageType !== 'text' to be explicit
          (!fileUrl || !fileName || !mimeType)
        ) {
          // Basic validation for file messages
          validationError =
            "File message missing required fields (fileUrl, fileName, mimeType).";
        } else if (!["text", "file"].includes(messageType)) {
          // Ensure messageType is one of the expected values
          validationError = `Invalid messageType: ${messageType}`;
        }

        if (validationError) {
          console.error("---> VALIDATION FAILED:", validationError);
          if (typeof callback === "function") {
            return callback({
              success: false,
              error: `Invalid input: ${validationError}`,
            });
          } else return; // Stop processing if invalid and no callback
        }
        console.log(`---> Validation PASSED for messageType: ${messageType}`);

        // 3. Authorization Check (Is sender allowed in this project chat?)
        try {
          const project = await Project.findByPk(numericProjectId, {
            attributes: ["ownerId"],
          });
          if (!project) {
            throw new Error("Project not found.");
          }

          const isOwner = project.ownerId === numericSenderId;
          let isMember = false;
          if (!isOwner) {
            const membership = await Member.findOne({
              where: {
                userId: numericSenderId,
                projectId: numericProjectId,
                status: "active", // Ensure user is active member
              },
              attributes: ["userId"],
            });
            isMember = !!membership;
          }

          if (!isOwner && !isMember) {
            throw new Error("Not an active member or owner of this project.");
          }
          console.log(
            `Authorization Passed for User ${senderId} in Project ${numericProjectId}.`
          );
        } catch (authError) {
          console.error(
            `Authorization Failed: User ${senderId}, Project ${numericProjectId}`,
            authError
          );
          if (typeof callback === "function") {
            return callback({
              success: false,
              error: authError.message || "Permission denied for this chat.",
            });
          } else return;
        }

        // 4. Prepare Data for Saving
        const dataToSave = {
          senderId: numericSenderId,
          projectId: numericProjectId,
          messageType: messageType, // Store the type ('text' or 'file')
          // Use trimmed content for text, allow original/null content for file
          content: typeof content === "string" ? content.trim() : content,
          // Store file info only if it's a file type
          fileUrl: messageType === "file" ? fileUrl : null,
          fileName: messageType === "file" ? fileName : null,
          mimeType: messageType === "file" ? mimeType : null,
          // Ensure fileSize is a number or null
          fileSize:
            messageType === "file" && !isNaN(parseInt(fileSize))
              ? parseInt(fileSize)
              : null,
        };

        // *** ADDED DIAGNOSTIC LOG ***
        console.log(
          ">>> [sendMessage] Data prepared for saving:",
          JSON.stringify(dataToSave, null, 2)
        );

        // 5. Save Message to Database
        try {
          // Save the prepared data
          const newMessage = await Message.create(dataToSave);

          // 6. Fetch message with sender details for broadcast
          // Fetching the newly created message ensures we get all DB defaults/timestamps etc.
          const messageToSend = await Message.findByPk(newMessage.id, {
            include: [
              {
                model: User,
                as: "sender", // Match alias in Message.associate
                attributes: ["id", "username", "profilePictureUrl"], // Specify needed fields
              },
            ],
          });

          if (!messageToSend) {
            // This case should be rare if create succeeded, but good practice to check
            throw new Error(
              "Failed to fetch created message with sender details immediately after creation."
            );
          }

          const finalMessageObject = messageToSend.toJSON(); // Get the plain object

          // *** ADDED DIAGNOSTIC LOG ***
          console.log(
            ">>> [sendMessage] Message fetched for broadcast:",
            JSON.stringify(finalMessageObject, null, 2)
          );

          // 7. Broadcast the COMPLETE message to the correct project room
          const targetRoom = `project-${numericProjectId}`;
          console.log(
            `Message saved (ID: ${newMessage.id}, Type: ${finalMessageObject.messageType}), broadcasting to room: ${targetRoom}`
          );
          // finalMessageObject will now contain all the fields saved to the DB
          io.to(targetRoom).emit("newMessage", finalMessageObject);

          // 8. Acknowledge success back to the sender
          if (typeof callback === "function") {
            callback({ success: true, messageId: newMessage.id });
          }
        } catch (dbError) {
          console.error(
            `Error saving message or broadcasting: User ${senderId}, Project ${numericProjectId}`,
            dbError
          );
          if (typeof callback === "function") {
            // Provide a more generic error to the client for security
            callback({
              success: false,
              error: "Server error handling message.",
            });
          }
        }
      }); // --- End sendMessage Handler ---

      // --- Add other specific socket event handlers here ---
      // Example: socket.on('typing', ({ roomName }) => { socket.to(roomName).emit('userTyping', { userId, username }); });
      // Example: socket.on('stopTyping', ({ roomName }) => { socket.to(roomName).emit('userStopTyping', { userId }); });
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
  return io; // Return the initialized io instance
};

// --- Function to Emit Event to Specific User(s) ---
export const emitToUser = (targetUserId, eventName, data) => {
  if (!io) {
    console.error(
      "Socket.IO WARN: emitToUser called before Socket.IO initialization finished."
    );
    return false;
  }
  if (!targetUserId) {
    console.warn(
      `emitToUser WARNING: No targetUserId for event '${eventName}'.`
    );
    return false;
  }
  const userIdStr = targetUserId.toString();
  const userSocketIds = userSockets.get(userIdStr);
  if (userSocketIds && userSocketIds.size > 0) {
    const socketIdArray = Array.from(userSocketIds);
    io.to(socketIdArray).emit(eventName, data);
    return true;
  } else {
    return false; // User not connected
  }
};
