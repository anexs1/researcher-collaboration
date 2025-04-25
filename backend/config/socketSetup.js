// backend/config/socketSetup.js
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";

// Simple in-memory store for mapping userId to a Set of socketIds.
// Consider Redis or another shared store for multi-instance deployments.
const userSockets = new Map(); // { 'userIdString': Set<socketId> }

// Use environment variable for frontend URL, provide a default
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Module-level variable to hold the single Socket.IO server instance
let ioInstance = null;

/**
 * Initializes the Socket.IO server instance and configures authentication and event handlers.
 * Should be called once when the HTTP server starts.
 * @param {http.Server} httpServer - The Node.js HTTP server instance.
 * @returns {SocketIOServer} The configured Socket.IO server instance.
 */
export const initSocketIO = (httpServer) => {
  // --- Check for JWT_SECRET *inside* the function ---
  // Ensures dotenv has likely loaded environment variables first
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error(
      "❌ FATAL ERROR: JWT_SECRET environment variable is not set. Socket.IO cannot authenticate users."
    );
    // Consider throwing an error or exiting gracefully depending on requirements
    throw new Error("JWT_SECRET is required for WebSocket authentication.");
    // process.exit(1); // Or exit if WS is critical
  }
  // --- End JWT_SECRET Check ---

  console.log(`Configuring Socket.IO with CORS origin: ${FRONTEND_URL}`);
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: FRONTEND_URL, // Allow connections from your frontend
      methods: ["GET", "POST"],
    },
    transports: ["websocket"], // Prefer WebSocket
  });

  // --- Socket.IO Authentication Middleware ---
  // Runs for every new connecting socket, *before* the 'connection' event
  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth.token; // Get token sent from client
    console.log(
      `Socket Middleware: Attempting auth for socket ${
        socket.id
      }... Token provided: ${!!token}`
    );
    if (token) {
      try {
        // Verify the token using the secret fetched within this scope
        const decoded = jwt.verify(token, jwtSecret); // Use the fetched secret
        // Attach userId to the socket object for later use
        socket.userId = decoded.id?.toString(); // Ensure it's a string for map keys
        if (!socket.userId) {
          throw new Error("Token payload missing user ID ('id').");
        }
        console.log(
          `Socket Auth OK: Socket ${socket.id} mapped to User ${socket.userId}`
        );
        next(); // Proceed to connection
      } catch (err) {
        console.error(
          `Socket Auth Fail (Token Error): Socket ${socket.id}`,
          err.message
        );
        next(new Error(`Authentication error: ${err.message}`)); // Deny connection
      }
    } else {
      console.warn(`Socket Auth Fail (No Token): Socket ${socket.id}`);
      next(new Error("Authentication error - No token provided")); // Deny connection
    }
  });

  // --- Main Connection Handler ---
  ioInstance.on("connection", (socket) => {
    const userId = socket.userId; // Get userId attached by middleware
    // This should always have a value if middleware succeeded
    if (!userId) {
      console.error(
        `CRITICAL: Socket ${socket.id} connected but has no userId attached! Disconnecting.`
      );
      socket.disconnect(true); // Force disconnect
      return;
    }

    console.log(
      `✅ Client Connected: Socket ID ${socket.id}, User ID: ${userId}`
    );

    // --- Manage User Socket Connections ---
    // Add the new socket ID to the user's set in the map
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    console.log(`User ${userId} sockets:`, Array.from(userSockets.get(userId)));

    // --- Standard Event Listener: Disconnect ---
    socket.on("disconnect", (reason) => {
      console.log(
        `🔌 Client Disconnected: Socket ID ${socket.id}, User ID: ${userId}, Reason: ${reason}`
      );
      // Remove the socket ID from the user's set
      if (userSockets.has(userId)) {
        const userSet = userSockets.get(userId);
        userSet.delete(socket.id);
        // If the user has no more active sockets, remove them from the map
        if (userSet.size === 0) {
          userSockets.delete(userId);
          console.log(
            `User ${userId} removed from socket map (no active sockets).`
          );
        } else {
          console.log(`User ${userId} sockets remaining:`, Array.from(userSet));
        }
      }
    });

    // --- Standard Event Listener: Connection Error ---
    socket.on("connect_error", (err) => {
      console.error(
        `Socket Connect Error during connection for ${socket.id}: ${err.message}`
      );
    });

    // --- Custom Application Event Listeners ---
    // Example: Allow client to explicitly join project-specific rooms
    socket.on("join_project_room", (projectId) => {
      if (projectId) {
        const roomName = `project_${projectId}`;
        socket.join(roomName);
        console.log(
          `Socket ${socket.id} (User ${userId}) joined room: ${roomName}`
        );
        // Optionally emit confirmation back to client: socket.emit('joined_room', roomName);
      } else {
        console.warn(
          `Socket ${socket.id} (User ${userId}) tried to join room without projectId.`
        );
      }
    });

    socket.on("leave_project_room", (projectId) => {
      if (projectId) {
        const roomName = `project_${projectId}`;
        socket.leave(roomName);
        console.log(
          `Socket ${socket.id} (User ${userId}) left room: ${roomName}`
        );
        // Optionally emit confirmation: socket.emit('left_room', roomName);
      }
    });

    // Add listeners for other events like sending chat messages, etc.
    // socket.on('send_message', (data) => { /* handle message, emit to room */ });
  }); // End ioInstance.on('connection')

  console.log("💬 WebSocket server configured and attached to HTTP server.");
  return ioInstance; // Return the configured instance
};

// --- Function to Emit Event to Specific User(s) ---
export const emitToUser = (targetUserId, eventName, data) => {
  // Check if Socket.IO server has been initialized
  if (!ioInstance) {
    console.error(
      "Socket.IO ERROR: Attempted to emit event before server initialization."
    );
    return false; // Indicate failure
  }
  if (!targetUserId) {
    console.warn(
      `emitToUser WARNING: No targetUserId provided for event '${eventName}'.`
    );
    return false; // Indicate failure
  }

  const userIdStr = targetUserId.toString(); // Ensure string key
  const userSocketIds = userSockets.get(userIdStr); // Get the Set of socket IDs

  if (userSocketIds && userSocketIds.size > 0) {
    // User is connected, potentially on multiple devices/tabs
    const socketIdArray = Array.from(userSocketIds);
    console.log(
      `Socket Emit: Event='${eventName}', Target User='${userIdStr}', Sockets=[${socketIdArray.join(
        ", "
      )}]`
    );
    // Emit to each specific socket ID associated with the user
    socketIdArray.forEach((socketId) => {
      ioInstance.to(socketId).emit(eventName, data);
    });
    return true; // Indicate success
  } else {
    // User is not currently connected via any socket
    console.log(
      `Socket Emit Info: User '${userIdStr}' not connected. Cannot emit event '${eventName}'.`
    );
    // TODO: Implement offline notification storage (e.g., save to DB)
    return false; // Indicate user was not reachable
  }
};
