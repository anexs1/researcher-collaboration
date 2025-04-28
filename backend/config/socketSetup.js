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
// This should be called ONCE from your main server file after creating the HTTP server
export const initSocketIO = (httpServer) => {
  const jwtSecret = process.env.JWT_SECRET;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"; // Default for development

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
    // Check if models loaded correctly
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
        origin: frontendUrl, // Allow requests from your frontend URL
        methods: ["GET", "POST"], // Allowed HTTP methods for CORS
      },
      transports: ["websocket"], // Prefer WebSocket transport
    });

    // Explicit check if instance creation succeeded
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
    ); // Propagate error
  }

  // --- Socket Authentication Middleware ---
  // Runs for every new connecting socket *before* the 'connection' event
  try {
    io.use(async (socket, next) => {
      const token = socket.handshake.auth.token; // Get token sent from client's socket connect options
      // console.log(`Socket Middleware: Auth attempt for ${socket.id}... Token: ${!!token}`);

      if (!token) {
        console.warn(`Socket Auth Fail (No Token): Socket ${socket.id}`);
        return next(new Error("Authentication error: No token provided.")); // Deny connection
      }

      try {
        // Verify the JWT token
        const decoded = jwt.verify(token, jwtSecret);
        // Find the user in the database based on the token's payload (e.g., user ID)
        const user = await User.findByPk(decoded.id); // Using default scope (excludes password)

        if (!user) {
          throw new Error(`User not found (ID: ${decoded.id})`); // User in token doesn't exist
        }

        // --- Attach user info to the socket instance for later use ---
        socket.userId = user.id.toString(); // Ensure it's a string for map keys
        socket.username = user.username; // Store username for convenience

        // --- Manage User Socket IDs ---
        if (!userSockets.has(socket.userId)) {
          userSockets.set(socket.userId, new Set()); // Create a new set for this user if first connection
        }
        userSockets.get(socket.userId).add(socket.id); // Add current socket ID to user's set

        // console.log(`Socket Auth OK: Socket ${socket.id} -> User ${socket.userId} (${socket.username})`);
        // console.log(`User ${socket.userId} sockets:`, Array.from(userSockets.get(socket.userId)));
        next(); // Grant connection
      } catch (err) {
        // Handle JWT errors (expired, invalid) or DB errors
        console.error(`Socket Auth Fail: Socket ${socket.id}`, err.message);
        next(new Error(`Authentication error: ${err.message}`)); // Deny connection
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
  // Runs *after* the authentication middleware succeeds for a socket
  try {
    io.on("connection", (socket) => {
      const userId = socket.userId; // Get userId attached by the middleware
      const username = socket.username; // Get username attached by the middleware

      // If somehow userId is missing after middleware, disconnect immediately
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
        // Clean up user socket mapping
        if (userSockets.has(userId)) {
          const userSocketSet = userSockets.get(userId);
          userSocketSet.delete(socket.id);
          // If this was the last socket for the user, remove the user entry
          if (userSocketSet.size === 0) {
            userSockets.delete(userId);
            console.log(
              `User ${userId} (${username}) fully disconnected and removed from map.`
            );
          } else {
            // console.log(`User ${userId} sockets remaining:`, Array.from(userSocketSet));
          }
        }
      });

      // --- Handle Socket Connection Errors (less common here) ---
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
          // Acknowledge success back to the client if callback provided
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
      socket.on("sendMessage", async (messageData, callback) => {
        const receivedDataString = JSON.stringify(messageData);
        console.log(
          `---> ENTER sendMessage | User: ${userId} | Received: ${receivedDataString}`
        );

        // 1. Extract data and use reliable senderId from socket
        const { projectId, content } = messageData;
        const senderId = userId; // Use the authenticated user ID from the socket

        // 2. Validate Input Data
        console.log(
          `---> BEFORE Validation | senderId: ${senderId} | projectId: ${projectId} | content: "${content}"`
        );
        let validationError = null;
        if (!senderId)
          validationError = "Sender ID missing (authentication issue).";
        else if (!projectId || typeof projectId !== "number" || projectId <= 0)
          validationError = "Invalid Project ID.";
        else if (
          !content ||
          typeof content !== "string" ||
          content.trim() === ""
        )
          validationError = "Message content cannot be empty.";

        if (validationError) {
          console.error("---> VALIDATION FAILED:", validationError);
          if (typeof callback === "function") {
            return callback({
              success: false,
              error: `Invalid input: ${validationError}`,
            });
          } else return; // Stop processing if invalid and no callback
        }
        console.log("---> Validation PASSED");
        const trimmedContent = content.trim();
        const numericProjectId = parseInt(projectId, 10); // Ensure number type
        const numericSenderId = parseInt(senderId, 10); // Ensure number type

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
                status: "active",
              },
              attributes: ["userId"], // Check only for existence
            });
            isMember = !!membership;
          }

          if (!isOwner && !isMember) {
            throw new Error("Not an active member or owner of this project.");
          }
          console.log(
            `Authorization Passed for User ${senderId} in Project ${projectId}.`
          );
        } catch (authError) {
          console.error(
            `Authorization Failed: User ${senderId}, Project ${projectId}`,
            authError
          );
          if (typeof callback === "function") {
            return callback({
              success: false,
              error: authError.message || "Permission denied for this chat.",
            });
          } else return;
        }

        // 4. Save Message to Database
        try {
          const newMessage = await Message.create({
            senderId: numericSenderId,
            projectId: numericProjectId,
            content: trimmedContent,
          });

          // 5. Fetch message with sender details for broadcast
          const messageToSend = await Message.findByPk(newMessage.id, {
            include: [
              {
                model: User,
                as: "sender", // Must match alias in Message.associate
                attributes: ["id", "username", "profilePictureUrl"],
              },
            ],
          });

          if (!messageToSend) {
            throw new Error(
              "Failed to fetch created message with sender details."
            );
          }

          // 6. Broadcast the message to the correct project room
          const targetRoom = `project-${numericProjectId}`;
          console.log(
            `Message saved (ID: ${newMessage.id}), broadcasting to room: ${targetRoom}`
          );
          io.to(targetRoom).emit("newMessage", messageToSend.toJSON()); // Send as plain JSON

          // 7. Acknowledge success back to the sender
          if (typeof callback === "function") {
            callback({ success: true, messageId: newMessage.id });
          }
        } catch (dbError) {
          console.error(
            `Error saving message or broadcasting: User ${senderId}, Project ${projectId}`,
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
// Useful for direct notifications, presence updates, etc., but NOT for group chat messages.
export const emitToUser = (targetUserId, eventName, data) => {
  if (!io) {
    // Check if io instance exists
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
  const userSocketIds = userSockets.get(userIdStr); // Get the Set of socket IDs for the user

  if (userSocketIds && userSocketIds.size > 0) {
    const socketIdArray = Array.from(userSocketIds); // Convert Set to Array for .to()
    // console.log(`Socket Emit: Event='${eventName}', Target User='${userIdStr}', Sockets=[${socketIdArray.join(", ")}]`); // Can be noisy
    io.to(socketIdArray).emit(eventName, data); // Emit event specifically to these socket IDs
    return true; // Indicate successful emission attempt
  } else {
    // console.log(`Socket Emit Info: User '${userIdStr}' not connected. Cannot emit '${eventName}'.`);
    // TODO: Potentially store this notification in the database for offline users
    return false; // Indicate user was not connected
  }
};
