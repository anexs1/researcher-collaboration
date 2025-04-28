// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config(); // Load .env variables FIRST
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http"; // Node's built-in HTTP module

// --- Config & Middleware ---
import { initSocketIO } from "./config/socketSetup.js"; // Socket.IO setup function
import { connectDB } from "./config/db.js"; // Database connection function
import { notFound, errorHandler } from "./middleware/errorMiddleware.js"; // Custom error handlers

// --- Route Imports ---
// Import all the route handlers you've created
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import publicationRoutes from "./routes/publicationRoutes.js";
import collaborationRequestRoutes from "./routes/collaborationRequestRoutes.js";
import messagingRoutes from "./routes/messagingRoutes.js";
import adminRoutes from "./routes/admin.routes.js"; // <<< Make sure this path is correct and uncommented

// Comment out routes you are not currently using to avoid potential issues
// import memberRoutes from './routes/members.js';
// import researchRoutes from './routes/researchRoutes.js';
// import chatRoutes from './routes/chatRoutes.js'; // Likely replaced by messaging + sockets

// --- Environment Variable Check & Setup ---
// Essential configuration variables checked at startup
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000; // Default port if not specified in .env
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"; // Default for Vite dev server
const NODE_ENV = process.env.NODE_ENV || "development";

console.log(`[Server Config] NODE_ENV: ${NODE_ENV}`);
console.log(`[Server Config] Frontend URL CORS Target: ${FRONTEND_URL}`);
if (!JWT_SECRET) {
  console.error(
    "❌ FATAL ERROR: JWT_SECRET environment variable is missing. Server cannot start securely."
  );
  process.exit(1); // Exit if essential secret is missing
} else {
  console.log("✅ [Server Config] JWT_SECRET loaded.");
}
// --- End Env Check ---

// --- Initialize Express App and HTTP Server ---
const app = express(); // Create Express application instance
const server = http.createServer(app); // Create standard HTTP server using the Express app

// --- Initialize Socket.IO ---
// Pass the HTTP server instance to the Socket.IO setup function
let io; // Declare io variable
try {
  io = initSocketIO(server); // Initialize Socket.IO and attach it to the server
  app.set("socketio", io); // Store io instance in app settings for access in controllers (req.app.get('socketio'))
  console.log(
    "✅ [Server Config] Socket.IO initialized and attached to server."
  );
} catch (error) {
  console.error("❌ FATAL ERROR: Failed to initialize Socket.IO!", error);
  process.exit(1); // Exit if socket setup fails critically
}

// --- ES Module __dirname Configuration ---
// Provides __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Core Express Middleware ---
// Enable Cross-Origin Resource Sharing (CORS) for requests from your frontend URL
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
// Parse incoming JSON request bodies (limit size for security)
app.use(express.json({ limit: "10mb" }));
// Parse incoming URL-encoded request bodies (limit size for security)
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// --- Static File Serving (for uploaded files) ---
const uploadsPath = path.join(__dirname, "uploads");
console.log(`[Server Config] Serving static '/uploads' from: ${uploadsPath}`);
// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("✅ [Server Config] Created 'uploads' directory.");
}
// Serve files from the 'uploads' directory when requested at the '/uploads' path
app.use("/uploads", express.static(uploadsPath));

// --- API Route Mounting ---
console.log("[Server Config] Mounting API routes...");
app.use("/api/auth", authRoutes); // Authentication routes (login, register)
app.use("/api/users", userRoutes); // User profile, settings routes
app.use("/api/projects", projectRoutes); // Project CRUD, search, etc. routes
app.use("/api/collaboration-requests", collaborationRequestRoutes); // Routes for handling join requests
app.use("/api/publications", publicationRoutes); // Publication CRUD, search routes
app.use("/api/messaging", messagingRoutes); // Routes for fetching chat history/contacts
app.use("/api/admin", adminRoutes); // <<< Mount all admin routes under /api/admin
// app.use('/api/research', researchRoutes);         // Uncomment if used
console.log("✅ [Server Config] API routes mounted.");

// --- Serve React Frontend Build (Production Mode Only) ---
if (NODE_ENV === "production") {
  // Adjust path to your frontend's build output directory (usually 'dist')
  const buildPath = path.join(__dirname, "../frontend/dist");
  console.log(
    `[Server Prod] Attempting to serve static files from ${buildPath}`
  );
  if (fs.existsSync(buildPath)) {
    // Serve static assets (JS, CSS, images) from the build directory
    app.use(express.static(buildPath));
    // For any other GET request not handled by API routes, serve the index.html
    // This allows React Router to handle client-side routing
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(buildPath, "index.html"));
    });
    console.log(
      "✅ [Server Prod] Configured to serve production frontend build."
    );
  } else {
    console.warn(
      `⚠️ [Server Prod] Frontend build directory not found at ${buildPath}`
    );
    // Fallback for root path if build is missing
    app.get("/", (req, res) => {
      res.status(404).send("API Running (Production Frontend build missing)");
    });
  }
} else {
  // Development mode root path response
  app.get("/", (req, res) => {
    res.send("API is running (Development Mode)...");
  });
}

// --- Custom Error Handling Middleware (Must be LAST) ---
// Handles routes that are not found (404)
app.use(notFound);
// Handles all other errors passed via next(err)
app.use(errorHandler);

// --- Start Server Function ---
// Encapsulates database connection and server listening logic
const startServer = async () => {
  try {
    console.log("[Server Start] Attempting database connection...");
    await connectDB(); // Connect to the database first
    console.log("✅ [Server Start] Database connected successfully.");

    // Start listening on the configured port using the HTTP server
    // Socket.IO is already attached to this server instance
    server.listen(PORT, () => {
      console.log(`\n🚀 Server listening on port ${PORT} [${NODE_ENV}]`);
      console.log(`   Frontend should connect to: ${FRONTEND_URL}`);
      console.log(`   API base URL: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ [Server Start] Database Connection Failed:", err);
    process.exit(1); // Exit the process with an error code if DB connection fails
  }
};

// --- Run the Server ---
startServer();
