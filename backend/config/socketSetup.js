// backend/config/socketSetup.js
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";

// Simple in-memory store. Replace with Redis for scalability. { userId: Set<socketId> }
const userSockets = new Map();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"; // Use your frontend URL

// --- REMOVE this top-level constant ---
// const JWT_SECRET = process.env.JWT_SECRET;

let ioInstance = null; // Store the io instance globally within this module

/**
 * Initializes the Socket.IO server instance and sets up event handlers.
 * @param {http.Server} httpServer - The Node.js HTTP server instance.
 * @returns {SocketIOServer} The configured Socket.IO server instance.
 */
export const initSocketIO = (httpServer) => {
  // --- Check process.env directly inside the function ---
  if (!process.env.JWT_SECRET) {
    // <<< ACCESS process.env HERE
    console.error(
      "❌ FATAL ERROR: process.env.JWT_SECRET not available for Socket.IO initialization. Check .env and dotenv.config() call order."
    );
    process.exit(1);
  }

  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  });

  // --- Socket.IO Middleware for Authentication ---
  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        // --- Use process.env directly for verification ---
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // <<< ACCESS process.env HERE
        socket.userId = decoded.id;
        console.log(`Socket Auth OK: ${socket.id} -> User ${socket.userId}`);
        next();
      } catch (err) {
        console.error(
          `Socket Auth Fail (Token Error): ${socket.id}`,
          err.message
        );
        next(new Error(`Authentication error: ${err.message}`));
      }
    } else {
      console.warn(`Socket Auth Fail (No Token): ${socket.id}`);
      next(new Error("Authentication error - No token provided"));
    }
  });

  // --- Socket.IO Connection Logic (remains the same) ---
  ioInstance.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(
      `✅ Client Connected: Socket ID ${socket.id}, User ID: ${userId}`
    );

    // Manage User Sockets
    if (userId) {
      const userIdStr = userId.toString();
      if (!userSockets.has(userIdStr)) {
        userSockets.set(userIdStr, new Set());
      }
      userSockets.get(userIdStr).add(socket.id);
      console.log(
        `User ${userIdStr} sockets:`,
        Array.from(userSockets.get(userIdStr))
      );
    }

    // Standard Event Listeners
    socket.on("disconnect", (reason) => {
      // ... (disconnect logic remains the same) ...
      console.log(
        `🔌 Client Disconnected: Socket ID ${socket.id}, User ID: ${userId}, Reason: ${reason}`
      );
      if (userId) {
        const userIdStr = userId.toString();
        if (userSockets.has(userIdStr)) {
          userSockets.get(userIdStr).delete(socket.id);
          if (userSockets.get(userIdStr).size === 0) {
            userSockets.delete(userIdStr);
            console.log(`Removed user entry ${userIdStr} (no sockets left).`);
          } else {
            console.log(
              `User ${userIdStr} sockets remaining:`,
              Array.from(userSockets.get(userIdStr))
            );
          }
        }
      }
    });

    socket.on("connect_error", (err) => {
      console.error(`Socket Connect Error for ${socket.id}: ${err.message}`);
    });

    // Custom Application Event Listeners (Examples)
    socket.on("join_project_room", (projectId) => {
      // ... (logic remains the same) ...
      if (projectId) {
        const roomName = `project_${projectId}`;
        socket.join(roomName);
        console.log(
          `Socket ${socket.id} (User ${userId}) joined room: ${roomName}`
        );
      }
    });

    socket.on("leave_project_room", (projectId) => {
      // ... (logic remains the same) ...
      if (projectId) {
        const roomName = `project_${projectId}`;
        socket.leave(roomName);
        console.log(
          `Socket ${socket.id} (User ${userId}) left room: ${roomName}`
        );
      }
    });

    // Add more listeners as needed...
  });

  console.log("💬 WebSocket server configured and attached.");
  return ioInstance; // Return the instance
};

// --- emitToUser function remains the same ---
export const emitToUser = (userId, eventName, data) => {
  if (!ioInstance) {
    console.error("Socket.IO not initialized before attempting to emit event.");
    return false;
  }
  if (!userId) {
    console.warn("Attempted to emit event with no userId.");
    return false;
  }

  const userIdStr = userId.toString();
  const userSocketIds = userSockets.get(userIdStr);

  if (userSocketIds && userSocketIds.size > 0) {
    console.log(
      `Emitting '${eventName}' to user ${userIdStr} (Sockets: ${Array.from(
        userSocketIds
      ).join(", ")})`
    );
    userSocketIds.forEach((socketId) => {
      ioInstance.to(socketId).emit(eventName, data);
    });
    return true;
  } else {
    console.log(
      `No active sockets found for user ${userIdStr} to emit '${eventName}'.`
    );
    return false;
  }
};
