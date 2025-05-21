// backend/socketManager.js
import { Server } from "socket.io"; // Modern ES Module import

let io = null;

export const initializeSocketIo = (httpServer) => {
  if (io) {
    console.warn("Socket.IO already initialized.");
    return io;
  }

  // Ensure httpServer is provided
  if (!httpServer) {
    throw new Error(
      "HTTP server instance is required to initialize Socket.IO."
    );
  }

  const newIo = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173", // Your frontend URL
      methods: ["GET", "POST", "PUT", "DELETE"], // Allow necessary methods
      credentials: true, // If you use cookies or session-based auth with sockets
    },
    // Consider adding other options like transport preferences if needed
    // transports: ['websocket', 'polling'],
  });

  io = newIo;

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(
      `SOCKET: User connected: ${socket.id}, UserID: ${userId || "N/A"}`
    );

    if (userId) {
      // Optionally, join a user-specific room if needed for direct messages to this user
      socket.join(`user-${userId}`);
      console.log(
        `SOCKET: User ${socket.id} (UserID: ${userId}) joined their user-specific room.`
      );
    }

    socket.on("joinChatRoom", ({ roomName }) => {
      if (roomName) {
        socket.join(roomName);
        console.log(
          `SOCKET: User ${socket.id} (UserID: ${
            userId || "N/A"
          }) joined room: ${roomName}`
        );
      } else {
        console.warn(
          `SOCKET: User ${socket.id} tried to join a room with no roomName.`
        );
      }
    });

    socket.on("leaveChatRoom", ({ roomName }) => {
      if (roomName) {
        socket.leave(roomName);
        console.log(
          `SOCKET: User ${socket.id} (UserID: ${
            userId || "N/A"
          }) left room: ${roomName}`
        );
      } else {
        console.warn(
          `SOCKET: User ${socket.id} tried to leave a room with no roomName.`
        );
      }
    });

    // Example: Handling a new chat message sent by a client
    // This is usually for user-to-user messages, not admin deletions
    socket.on("newChatMessage", (data) => {
      // data might include { projectId, content, senderId (from auth or client) }
      console.log("SOCKET: Received 'newChatMessage'", data);
      const roomName = getRoomName(data.projectId); // Assuming getRoomName helper
      if (roomName) {
        // Here you would typically save the message to DB
        // And then emit it back to the room (including the sender for their own UI update)
        // For simplicity, just broadcasting back now.
        // The actual message creation and saving should happen via an API endpoint for reliability.
        // This socket event is more for broadcasting that a new message IS available.
        // Or, the client POSTs to API, API saves and then API emits 'newMessage'.
        // Let's assume an API call saved the message and now needs to broadcast it.
        // This 'newChatMessage' listener might be redundant if API emits 'newMessage'.
        // io.to(roomName).emit("newMessage", { ...data, createdAt: new Date().toISOString() });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `SOCKET: User disconnected: ${socket.id} (UserID: ${
          userId || "N/A"
        }). Reason: ${reason}`
      );
    });

    socket.on("error", (error) => {
      console.error(`SOCKET ERROR for socket ${socket.id}:`, error);
    });
  });

  console.log("Socket.IO initialized successfully.");
  return io;
};

export const getIo = () => {
  if (!io) {
    console.error("Attempted to get Socket.IO instance before initialization!");
    throw new Error(
      "Socket.io not initialized! Call initializeSocketIo(httpServer) first."
    );
  }
  return io;
};

// Helper function (if not already globally available, or import if it is)
// This is duplicated from controller for standalone socketManager, better to share/import
const getRoomName = (projectId) => (projectId ? `project-${projectId}` : null);
