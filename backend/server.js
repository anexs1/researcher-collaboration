// backend/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createServer } from "http"; // Use http server for Socket.IO
import { Server as SocketIOServer } from "socket.io"; // Rename to avoid conflict

// --- Database ---
import { connectDB } from "./config/db.js"; // Only import connectDB unless sequelize instance needed here

// --- Load Environment Variables ---
dotenv.config();

// --- Verify Essential Environment Variables ---
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

if (!JWT_SECRET) {
  console.error(
    "❌ FATAL ERROR: JWT_SECRET is not defined in environment variables."
  );
  process.exit(1); // Exit if secret is missing
}

// --- Route Imports ---
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import memberRoutes from "./routes/members.js"; // Assuming this handles /api/projects/:projectId/members internally
import collaborationRequestRoutes from "./routes/collaborationRequestRoutes.js"; // Import the routes
import adminRoutes from "./routes/admin.routes.js"; // Check filename if different
import researchRoutes from "./routes/researchRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

// --- Express App Initialization ---
const app = express();
const httpServer = createServer(app); // Create HTTP server from Express app

// --- ES Module __dirname Equivalent ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Socket.IO Setup ---
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: FRONTEND_URL, // Use environment variable or default
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible to routes/controllers if needed
app.set("io", io);

// Basic Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on("join_project", (projectId) => {
    const roomName = `project_${projectId}`;
    socket.join(roomName);
    console.log(`User ${socket.id} joined project room: ${roomName}`);
  });

  socket.on("send_message", (data) => {
    const roomName = `project_${data.projectId}`;
    console.log(`Message received for room ${roomName}:`, data.message);
    // Emit to others in the room
    socket.to(roomName).emit("receive_message", data);
    // TODO: Save message to DB via controller/service
  });

  socket.on("disconnect", (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id}, Reason: ${reason}`);
  });

  socket.on("connect_error", (err) => {
    console.error(`Socket Connect Error: ${err.message}`);
  });
});

// --- Core Middleware ---
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static File Serving
const uploadsPath = path.join(__dirname, "uploads");
console.log(`Serving static files from: ${uploadsPath}`);
if (!fs.existsSync(uploadsPath)) {
  console.warn(`⚠️ Uploads directory does not exist, creating: ${uploadsPath}`);
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", express.static(uploadsPath));

// --- Settings File Initialization ---
const initializeSettingsFile = () => {
  const DATA_DIR = path.join(process.cwd(), "data");
  const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
  const DEFAULT_SETTINGS = {
    /* ... your default settings ... */
  };
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR);
    }
    if (!fs.existsSync(SETTINGS_PATH)) {
      fs.writeFileSync(
        SETTINGS_PATH,
        JSON.stringify(DEFAULT_SETTINGS, null, 2),
        "utf8"
      );
      console.log("✅ Default settings.json file created at:", SETTINGS_PATH);
    } else {
      // Optionally read and merge existing settings with defaults here if needed
      console.log("ℹ️ Settings file already exists at:", SETTINGS_PATH);
    }
  } catch (err) {
    console.error("❌ Error initializing settings file:", err);
  }
};

// --- Main Application Logic in an Async Function ---
const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();
    console.log("✅ Database connected successfully.");

    // 2. Initialize Settings File
    initializeSettingsFile();

    // --- API Routes Mounting ---
    console.log(" Mouting API routes...");
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/projects", projectRoutes);
    // Mount member routes under the project context
    app.use("/api/projects/:projectId/members", memberRoutes);
    // **** CORRECTED MOUNT PATH FOR COLLABORATION REQUESTS ****
    app.use("/api/collaboration-requests", collaborationRequestRoutes); // Use hyphenated path
    app.use("/api/admin", adminRoutes);
    app.use("/api/research", researchRoutes);
    app.use("/api/chat", chatRoutes);
    console.log("✅ API routes mounted.");

    // --- Root Route / Health Check ---
    app.get("/", (req, res) => {
      /* ... HTML response ... */
      res.setHeader("Content-Type", "text/html");
      res.send(`<h1>API Running</h1><p>Status: OK</p>`);
    });

    // --- 404 Not Found Handler ---
    app.use((req, res, next) => {
      const error = new Error(
        `🤔 Not Found - ${req.method} ${req.originalUrl}`
      );
      error.status = 404;
      next(error);
    });

    // --- Global Error Handler ---
    app.use((err, req, res, next) => {
      console.error("💥 Global Error Handler Caught:");
      console.error("Error:", err.message);
      if (process.env.NODE_ENV === "development") {
        console.error("Stack:", err.stack);
      }
      const statusCode = err.status || err.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        // Optionally include stack in dev only
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      });
    });

    // --- Start Listening ---
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`   Frontend expected at: ${FRONTEND_URL}`);
      console.log(`💬 WebSocket server ready.`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

// --- Run the Server ---
startServer();
