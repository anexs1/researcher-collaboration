import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import db from "../models/index.js"; // Adjust path if necessary

const { User } = db;

const userSockets = new Map(); // Stores mapping: userIdString -> Set<socketId>
let io = null;

// --- Helper to log map contents (optional, can be verbose) ---
const logUserSockets = (context) => {
  // Convert map to a more readable format for logging
  const mapEntries = Array.from(userSockets.entries()).map(
    ([userId, socketSet]) => {
      return `User ${userId}: ${Array.from(socketSet).join(", ")}`;
    }
  );
  // Limit log length if map gets very large
  const logString = `{ ${mapEntries.join("; ")} }`;
  console.log(
    `[${context}] Current userSockets Map (${
      userSockets.size
    } users): ${logString.substring(0, 500)}${
      logString.length > 500 ? "..." : ""
    }`
  );
};

export const initSocketIO = (httpServer) => {
  const jwtSecret = process.env.JWT_SECRET;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"; // Ensure this matches your frontend

  if (!jwtSecret)
    throw new Error("FATAL ERROR: JWT_SECRET Environment variable is Missing.");
  if (!httpServer)
    throw new Error("FATAL ERROR: Valid httpServer instance was not provided.");
  if (!User)
    throw new Error("FATAL ERROR: User model is not loaded correctly.");

  console.log(`Configuring Socket.IO for origin: ${frontendUrl}`);

  try {
    io = new SocketIOServer(httpServer, {
      cors: { origin: frontendUrl, methods: ["GET", "POST"] },
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

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    console.log(
      `[Socket Middleware] Incoming connection attempt: Socket ${socket.id}. Checking token...`
    ); // Log attempt
    if (!token) {
      console.warn(`[Socket Auth Fail] No Token: Socket ${socket.id}`);
      return next(new Error("Authentication error: No token provided.")); // Reject connection
    }
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log(
        `[Socket Middleware] Token decoded for User ID: ${decoded.id}. Fetching user... Socket: ${socket.id}`
      ); // Log decoded ID
      const user = await User.findByPk(decoded.id, {
        attributes: ["id", "username"],
      });
      if (!user) {
        console.warn(
          `[Socket Auth Fail] User Not Found in DB: Decoded ID ${decoded.id}, Socket ${socket.id}`
        ); // Log user not found
        // Explicitly pass an error indicating user not found associated with token
        return next(
          new Error(`Authentication error: User ${decoded.id} not found.`)
        );
      }

      // --- Assign User Info and Map Socket ---
      socket.userId = user.id.toString(); // Store user ID as string
      socket.username = user.username;

      console.log(
        `[Socket Middleware] Adding User ${socket.userId} -> Socket ${socket.id} to map.`
      );
      if (!userSockets.has(socket.userId)) {
        userSockets.set(socket.userId, new Set());
        console.log(
          `[Socket Middleware] Created new Set in map for User ${socket.userId}.`
        );
      }
      userSockets.get(socket.userId).add(socket.id);
      logUserSockets("Socket Middleware - After Add"); // Log map state

      console.log(
        `[Socket Auth OK] Socket ${socket.id} authenticated as User ${socket.userId} (${socket.username})`
      );
      next(); // Grant connection
    } catch (err) {
      // Handle JWT errors (expired, invalid signature) or other unexpected errors
      console.error(
        `[Socket Auth Fail] JWT/Other Error: Socket ${socket.id}, Message: ${err.message}`
      );
      // Pass a generic auth error to the client
      next(
        new Error(
          `Authentication error: ${
            err.name === "TokenExpiredError" ? "Token expired" : "Invalid token"
          }`
        )
      );
    }
  }); // End io.use() Middleware

  // Main Connection Handler (runs only AFTER middleware calls next())
  io.on("connection", (socket) => {
    const userId = socket.userId;
    const username = socket.username;

    // Should always have userId here due to middleware success
    if (!userId) {
      console.error(
        `[Connection Handler] CRITICAL: Socket ${socket.id} connected BUT MISSING userId after auth middleware succeeded. Disconnecting.`
      );
      socket.disconnect(true); // Force disconnect
      return;
    }
    console.log(
      `✅ [Connection Handler] Client Connected and Authenticated: Socket ID ${socket.id}, User ID: ${userId} (${username})`
    );
    logUserSockets("Connection Handler - On Connect"); // Log map state upon successful connect

    // --- Handle Socket Disconnection ---
    socket.on("disconnect", (reason) => {
      console.log(
        `🔌 [Disconnect Handler] Client Disconnected: Socket ID ${socket.id}, User ID: ${userId}, Reason: ${reason}`
      );
      logUserSockets(
        `Disconnect Handler - Before Cleanup for User ${userId}, Socket ${socket.id}`
      ); // Log map state before cleanup

      if (userSockets.has(userId)) {
        const userSocketSet = userSockets.get(userId);
        const deleted = userSocketSet.delete(socket.id); // Remove this specific socket ID from the user's set
        console.log(
          `[Disconnect Handler] Attempted to delete Socket ${socket.id} from User ${userId}'s Set. Deleted: ${deleted}. Set size now: ${userSocketSet.size}`
        );
        if (userSocketSet.size === 0) {
          // If this was the user's last socket, remove the user entry from the map
          userSockets.delete(userId);
          console.log(
            `[Disconnect Handler] User ${userId} (${username}) has no more sockets. Removed User entry from map.`
          );
          logUserSockets(`Disconnect Handler - After User ${userId} Removed`); // Log map state after user removal
        } else {
          // User still has other sockets connected
          logUserSockets(
            `Disconnect Handler - After Socket ${socket.id} Removed for User ${userId}`
          ); // Log map state after just socket removal
        }
      } else {
        // This might happen if disconnect fires before connection mapping completes fully, or if map state is somehow wrong
        console.warn(
          `[Disconnect Handler] User ${userId} NOT found in map upon disconnect of Socket ${socket.id}. Map might be inconsistent or disconnect happened before full connect.`
        );
        logUserSockets(`Disconnect Handler - User ${userId} Not Found`);
      }
    }); // End socket.on("disconnect")

    // --- Handle Socket Connection Errors (Post-Connection) ---
    socket.on("connect_error", (err) => {
      // This usually indicates issues happening after the initial successful handshake/authentication
      console.error(
        `[Socket connect_error Event] Post-connection error for Socket ${socket.id} (User ${userId}): ${err.message}`
      );
    });

    // --- Add other specific event listeners here if needed ---
    // Example: socket.on('join_room', (room) => socket.join(room));
  }); // End io.on("connection")

  console.log("💬 WebSocket server initialization completed successfully.");
  return io;
}; // End initSocketIO

// --- Function to Emit Event to Specific User(s) ---
export const emitToUser = (targetUserId, eventName, data) => {
  // Log the emit attempt and target user ID
  console.log(
    `[emitToUser] Prepare to emit '${eventName}' to User ${targetUserId}. Data preview:`,
    JSON.stringify(data).substring(0, 150) + "..."
  );

  // --- Check io instance ---
  if (!io) {
    console.error(
      "[emitToUser] Socket.IO WARN: emitToUser called before Socket.IO instance ('io') is initialized."
    );
    return false;
  }
  // --- Check targetUserId ---
  if (!targetUserId) {
    console.warn(
      `[emitToUser] WARNING: No targetUserId provided for event '${eventName}'. Cannot emit.`
    );
    return false;
  }
  const userIdStr = targetUserId.toString(); // Ensure string key for map lookup

  // --- LOG MAP STATE BEFORE CHECKING ---
  logUserSockets(`emitToUser - Checking map for User ${userIdStr}`);

  const userSocketIds = userSockets.get(userIdStr); // Get the Set of socket IDs for the user

  // --- LOG RESULT OF MAP LOOKUP ---
  console.log(
    `[emitToUser] Lookup result for User ${userIdStr} in map:`,
    userSocketIds ? `Found Set(${userSocketIds.size})` : "Not Found (undefined)"
  );

  // --- Check if user exists in map AND has active sockets ---
  if (userSocketIds && userSocketIds.size > 0) {
    const socketIdArray = Array.from(userSocketIds); // Convert Set to Array for io.to()
    console.log(
      `[emitToUser] Emitting '${eventName}' to User ${userIdStr} via Sockets: [${socketIdArray.join(
        ", "
      )}]`
    );
    io.to(socketIdArray).emit(eventName, data); // Emit event only to this user's sockets
    return true; // Indicate successful emission attempt
  } else {
    // Log clearly why emit didn't happen
    console.log(
      `[emitToUser] Emit Notice: User ${userIdStr} not found in map OR has empty socket Set. Cannot emit '${eventName}' real-time.`
    );
    return false; // Indicate user wasn't connected for real-time push
  }
}; // End emitToUser
