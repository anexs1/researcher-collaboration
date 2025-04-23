// backend/server.js (or app.js)

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createServer } from "http"; // Use http server for Socket.IO
import { Server as SocketIOServer } from "socket.io"; // Rename to avoid conflict

// --- Database ---
import { connectDB } from "./config/db.js";

// --- Load Environment Variables ---
dotenv.config();

// --- Verify Essential Environment Variables ---
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"; // Default frontend URL

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
import collaborationRequestRoutes from "./routes/collaborationRequestRoutes.js";
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
  // Optional: Add other Socket.IO options if needed
  // pingTimeout: 60000,
});

// Make io accessible to routes/controllers if needed (e.g., for emitting events)
app.set("io", io);

// Basic Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // Example: Join project-specific room
  socket.on("join_project", (projectId) => {
    const roomName = `project_${projectId}`;
    socket.join(roomName);
    console.log(`User ${socket.id} joined project room: ${roomName}`);
    // You might want to emit a confirmation or fetch initial data here
    // socket.emit('joined_project_confirmation', { projectId });
  });

  // Handle chat messages (example, move logic to chatController/service)
  socket.on("send_message", (data) => {
    // TODO: Save message to DB
    // Emit message to the specific project room
    const roomName = `project_${data.projectId}`;
    console.log(`Message received for room ${roomName}:`, data.message);
    // Emit to all clients in the room *including* the sender
    // io.to(roomName).emit('receive_message', data);
    // Or emit to all *except* sender:
    socket.to(roomName).emit("receive_message", data);
  });

  socket.on("disconnect", (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id}, Reason: ${reason}`);
    // Handle cleanup if necessary (e.g., leave rooms)
  });

  socket.on("connect_error", (err) => {
    console.error(`Socket Connect Error: ${err.message}`);
  });
});

// --- Core Middleware ---

// 1. CORS - Allow requests from frontend
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// 2. Body Parsers - for JSON and URL-encoded data
// IMPORTANT: These handle standard requests. Multipart/form-data (file uploads)
// MUST be handled by middleware like 'multer' applied *specifically* on the relevant routes
// within the route files (e.g., inside projectRoutes.js for POST /api/projects).
app.use(express.json({ limit: "10mb" })); // Increase limit if needed for JSON data
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 3. Static File Serving - for accessing uploaded files
// Serves files from the 'uploads' directory at the '/uploads' URL path
// Adjust the path if your 'uploads' folder is located differently (e.g., inside 'public')
const uploadsPath = path.join(__dirname, "uploads");
console.log(`Serving static files from: ${uploadsPath}`); // Verify path
if (!fs.existsSync(uploadsPath)) {
  console.warn(`⚠️ Uploads directory does not exist, creating: ${uploadsPath}`);
  fs.mkdirSync(uploadsPath, { recursive: true }); // Create if it doesn't exist
}
app.use("/uploads", express.static(uploadsPath));

// --- Settings File Initialization (Run once on startup) ---
const initializeSettingsFile = () => {
  const DATA_DIR = path.join(process.cwd(), "data"); // Use project root for data dir
  const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
  const DEFAULT_SETTINGS = {
    siteName: "ResearchConnect",
    allowPublicSignup: true,
    maintenanceMode: false,
    defaultUserRole: "user",
    emailNotifications: true,
    itemsPerPage: 10,
    themeColor: "#3b82f6",
    chatEnabled: true,
    maxCollaborators: 10,
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
    await connectDB(); // Ensure connection is established before proceeding
    console.log("✅ Database connected successfully.");

    // 2. Initialize Settings File
    initializeSettingsFile();

    // --- API Routes ---
    console.log(" Mouting API routes...");
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/projects", projectRoutes);
    // Mount member routes under the project context - ensure memberRoutes handles :projectId
    app.use("/api/projects/:projectId/members", memberRoutes);
    app.use("/api/collaboration-requests", collaborationRequestRoutes);
    app.use("/api/admin", adminRoutes); // For admin-specific actions
    app.use("/api/research", researchRoutes);
    app.use("/api/chat", chatRoutes);
    console.log("✅ API routes mounted.");

    // --- Root Route (Optional Health Check/Info) ---
    app.get("/", (req, res) => {
      res.setHeader("Content-Type", "text/html");
      res.send(`
        <!DOCTYPE html><html><head><title>ResearchConnect API</title></head>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1>🚀 ResearchConnect API</h1>
          <p>Server is running smoothly.</p>
          <p>Database Status: Connected</p>
          <p>Socket.IO Status: Listening</p>
          <hr>
          <p>Available Route Prefixes:</p>
          <ul>
            <li>/api/auth</li>
            <li>/api/users</li>
            <li>/api/projects</li>
            <li>/api/collaboration-requests</li>
            <li>/api/admin</li>
            <li>/api/research</li>
            <li>/api/chat</li>
            <li>/uploads (Static files)</li>
          </ul>
        </body></html>
      `);
    });

    // --- 404 Not Found Handler ---
    // Must be after all other routes
    app.use((req, res, next) => {
      const error = new Error(
        `🤔 Not Found - ${req.method} ${req.originalUrl}`
      );
      error.status = 404; // Set status code for the error object
      next(error); // Pass error to the global error handler
    });

    // --- Global Error Handler ---
    // Must have 4 arguments (err, req, res, next)
    app.use((err, req, res, next) => {
      console.error("💥 Global Error Handler Caught:");
      console.error("Error Message:", err.message);
      console.error("Error Status:", err.status || err.statusCode);
      console.error("Error Stack:", err.stack);

      const statusCode = err.status || err.statusCode || 500; // Use error status or default to 500
      res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        // Only include stack trace in development environment for security
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      });
    });

    // --- Start Listening ---
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`   Frontend expected at: ${FRONTEND_URL}`);
      console.log(`💬 WebSocket server ready.`);
      // Optional: Sync database schema if using Sequelize sync (use with caution in production)
      // sequelize.sync({ force: false }).then(() => console.log('DB schema synced'));
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1); // Exit process with failure code
  }
};

// --- Run the Server ---
startServer();
