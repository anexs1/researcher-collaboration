// backend/config/socketSetup.js
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import db from "../models/index.js"; // Adjust path

const { User, Message } = db; // Models needed

const userSockets = new Map(); // { 'userIdString': Set<socketId> }
let ioInstance = null;

export const initSocketIO = (httpServer) => {
  const jwtSecret = process.env.JWT_SECRET;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"; // Ensure this matches your frontend port

  if (!jwtSecret) {
    throw new Error("FATAL ERROR: JWT_SECRET Missing.");
  }

  console.log(`Configuring Socket.IO with CORS origin: ${frontendUrl}`);
  ioInstance = new SocketIOServer(httpServer, {
    cors: { origin: frontendUrl, methods: ["GET", "POST"] },
    transports: ["websocket"],
  });

  // Socket Authentication Middleware
  ioInstance.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    console.log(
      `Socket Middleware: Auth attempt for ${socket.id}... Token: ${!!token}`
    );
    if (token) {
      try {
        const decoded = jwt.verify(token, jwtSecret);
        // Use defaultScope (excludes password) - important!
        const user = await User.findByPk(decoded.id);
        if (user) {
          socket.userId = user.id.toString();
          socket.username = user.username; // Store username for convenience
          if (!userSockets.has(socket.userId))
            userSockets.set(socket.userId, new Set());
          userSockets.get(socket.userId).add(socket.id); // Add socket ID to user's set
          console.log(
            `Socket Auth OK: Socket ${socket.id} -> User ${socket.userId} (${socket.username})`
          );
          console.log(
            `User ${socket.userId} sockets:`,
            Array.from(userSockets.get(socket.userId))
          );
          next();
        } else {
          throw new Error("User not found");
        }
      } catch (err) {
        console.error(`Socket Auth Fail: Socket ${socket.id}`, err.message);
        next(new Error(`Authentication error: ${err.message}`));
      }
    } else {
      console.warn(`Socket Auth Fail (No Token): Socket ${socket.id}`);
      next(new Error("Authentication error - No token"));
    }
  });

  // Main Connection Handler
  ioInstance.on("connection", (socket) => {
    const userId = socket.userId;
    if (!userId) {
      socket.disconnect(true);
      return;
    }
    console.log(
      `✅ Client Connected: Socket ID ${socket.id}, User ID: ${userId}`
    );

    // Disconnect Handler
    socket.on("disconnect", (reason) => {
      console.log(
        `🔌 Client Disconnected: Socket ID ${socket.id}, User ID: ${userId}, Reason: ${reason}`
      );
      if (userSockets.has(userId)) {
        const userSet = userSockets.get(userId);
        userSet.delete(socket.id);
        if (userSet.size === 0) {
          userSockets.delete(userId);
          console.log(`User ${userId} removed from socket map.`);
        } else {
          console.log(`User ${userId} sockets remaining:`, Array.from(userSet));
        }
      }
    });

    // Error Handler
    socket.on("connect_error", (err) => {
      console.error(`Socket Connect Error for ${socket.id}: ${err.message}`);
    });

    // --- Chat Event Listeners ---
    const getRoomName = (id1, id2) =>
      [id1?.toString(), id2?.toString()].sort().join("--");

    socket.on("joinChatRoom", ({ roomName }) => {
      // Use explicit roomName from client
      if (roomName) {
        socket.join(roomName);
        console.log(
          `Socket ${socket.id} (User ${userId}) joined room: ${roomName}`
        );
      } else {
        console.warn(
          `Socket ${socket.id} (User ${userId}) tried join without roomName.`
        );
      }
    });

    socket.on("leaveChatRoom", ({ roomName }) => {
      if (roomName) {
        socket.leave(roomName);
        console.log(
          `Socket ${socket.id} (User ${userId}) left room: ${roomName}`
        );
      }
    });

    socket.on("sendMessage", async (messageData, callback) => {
      console.log(`Received sendMessage from ${socket.userId}:`, messageData);
      const { receiverId, content } = messageData;
      const senderId = socket.userId;
      const numericReceiverId = parseInt(receiverId); // Ensure it's a number

      if (!numericReceiverId || !content || !senderId) {
        if (callback) callback({ success: false, error: "Missing data." });
        return;
      }
      if (senderId === numericReceiverId.toString()) {
        if (callback)
          callback({ success: false, error: "Cannot message self." });
        return;
      }

      try {
        if (!Message) {
          throw new Error("Message model not loaded.");
        }
        // Save message (Use Model fields camelCase)
        const newMessage = await Message.create({
          senderId,
          receiverId: numericReceiverId,
          content: content.trim(),
          readStatus: false,
        });
        console.log("Message saved to DB:", newMessage.id);

        // Prepare message to emit (Use Model fields camelCase)
        const messageToSend = {
          id: newMessage.id,
          senderId,
          receiverId: numericReceiverId,
          content: newMessage.content,
          createdAt: newMessage.createdAt,
          readStatus: newMessage.readStatus,
          sender: { id: senderId, username: socket.username }, // Attach sender username
        };

        // Emit only to the specific sender and receiver sockets
        emitToUser(senderId, "newMessage", messageToSend);
        emitToUser(numericReceiverId, "newMessage", messageToSend);

        if (callback) callback({ success: true, messageId: newMessage.id });
      } catch (error) {
        console.error("Error processing sendMessage:", error);
        if (error.original) console.error("Original DB Error:", error.original);
        if (callback)
          callback({ success: false, error: "Failed to save/send." });
      }
    });

    // Add other listeners (typing indicator, read status update) here...
  }); // End ioInstance.on('connection')

  console.log("💬 WebSocket server configured.");
  return ioInstance;
};

// --- Function to Emit Event to Specific User(s) ---
export const emitToUser = (targetUserId, eventName, data) => {
  if (!ioInstance) {
    console.error("Socket.IO ERROR: emitToUser called before init.");
    return false;
  }
  if (!targetUserId) {
    console.warn(
      `emitToUser WARNING: No targetUserId for event '${eventName}'.`
    );
    return false;
  }

  const userIdStr = targetUserId.toString();
  const userSocketIds = userSockets.get(userIdStr); // Get Set of socket IDs

  if (userSocketIds && userSocketIds.size > 0) {
    const socketIdArray = Array.from(userSocketIds);
    console.log(
      `Socket Emit: Event='${eventName}', Target User='${userIdStr}', Sockets=[${socketIdArray.join(
        ", "
      )}]`
    );
    // io.to() can take an array of socket IDs
    ioInstance.to(socketIdArray).emit(eventName, data);
    return true;
  } else {
    console.log(
      `Socket Emit Info: User '${userIdStr}' not connected. Cannot emit '${eventName}'.`
    );
    // TODO: Store offline notification
    return false;
  }
};
