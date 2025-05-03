// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config(); // Load .env variables FIRST
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";

// --- Config & Middleware ---
import { initSocketIO } from "./config/socketSetup.js";
import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// --- Route Imports ---
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js"; // Uses multer internally now
import publicationRoutes from "./routes/publicationRoutes.js";
import collaborationRequestRoutes from "./routes/collaborationRequestRoutes.js";
import messagingRoutes from "./routes/messagingRoutes.js";
import adminRoutes from "./routes/admin.routes.js";

// --- Environment Variable Check & Setup ---
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || "development";

console.log(`[Server Config] NODE_ENV: ${NODE_ENV}`);
console.log(`[Server Config] Frontend URL CORS Target: ${FRONTEND_URL}`);
if (!JWT_SECRET) {
  console.error("❌ FATAL ERROR: JWT_SECRET missing.");
  process.exit(1);
} else {
  console.log("✅ [Server Config] JWT_SECRET loaded.");
}

// --- Initialize Express App and HTTP Server ---
const app = express();
const server = http.createServer(app);

// --- Initialize Socket.IO ---
let io;
try {
  io = initSocketIO(server);
  app.set("socketio", io); // Make io accessible in routes if needed via req.app.get('socketio')
  console.log("✅ [Server Config] Socket.IO initialized.");
} catch (error) {
  console.error("❌ FATAL ERROR: Socket.IO init failed!", error);
  process.exit(1);
}

// --- ES Module __dirname Configuration ---
// This correctly determines the directory where server.js resides.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Core Express Middleware ---
app.use(cors({ origin: FRONTEND_URL, credentials: true })); // Enable CORS for your frontend
app.use(express.json({ limit: "10mb" })); // For parsing application/json request bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // For parsing application/x-www-form-urlencoded request bodies

// =======================================================
// --- Static File Serving Configuration ---
// This section tells Express how to handle requests for static assets like images.
// =======================================================

// 1. Calculate the absolute path to the 'uploads' directory.
//    Assumes 'uploads' is directly inside the 'backend' directory (where server.js is).
//    Verify your actual project structure matches this assumption.
const uploadsPath = path.join(__dirname, "uploads");

// 2. Log the path being used (useful for debugging). Check this path in your console!
console.log(
  `[Server Config] Configuring static file serving for URL '/uploads' from filesystem path: ${uploadsPath}`
);

// 3. Ensure the 'uploads' directory exists. Create it if it doesn't.
if (!fs.existsSync(uploadsPath)) {
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log(
      `✅ [Server Config] Created missing 'uploads' directory at: ${uploadsPath}`
    );
  } catch (mkdirErr) {
    console.error(
      `❌ [Server Config] Failed to create 'uploads' directory at: ${uploadsPath}`,
      mkdirErr
    );
    // Decide if you want to exit or just warn if directory creation fails
  }
}

// 4. Mount the static middleware.
//    Any request starting with '/uploads' (e.g., '/uploads/projects/image.jpg')
//    will make Express look for the corresponding file inside the 'uploadsPath' directory
//    (e.g., looking for '[absolute path]/backend/uploads/projects/image.jpg').
//    *This setup looks correct.* If you still get 404s, the issue is likely:
//      a) The files DO NOT EXIST in the expected subdirectories (e.g., 'uploads/projects/').
//      b) The file upload process (Multer) is saving files to a DIFFERENT location.
//      c) The file URLs in your database/API response are incorrect (e.g., missing '/uploads/').
app.use("/uploads", express.static(uploadsPath));

// =======================================================
// --- End Static File Serving Configuration ---
// =======================================================

// --- API Route Mounting ---
console.log("[Server Config] Mounting API routes...");
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes); // Ensure Multer config within these routes saves to 'uploads/projects' (or respective subdirs)
app.use("/api/collaboration-requests", collaborationRequestRoutes);
app.use("/api/publications", publicationRoutes); // Ensure Multer config within these routes saves to 'uploads/publications' etc.
app.use("/api/messaging", messagingRoutes);
app.use("/api/admin", adminRoutes);
console.log("✅ [Server Config] API routes mounted.");

// --- Serve React Frontend Build (Production Mode Only) ---
if (NODE_ENV === "production") {
  // Path to the frontend build output directory
  const buildPath = path.join(__dirname, "../frontend/dist"); // Assumes frontend is sibling to backend
  console.log(`[Server Prod] Checking for frontend build at: ${buildPath}`);

  if (fs.existsSync(buildPath)) {
    // Serve static assets from the build directory
    app.use(express.static(buildPath));

    // For any other GET request, serve the index.html (for SPA routing)
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(buildPath, "index.html"));
    });
    console.log(
      `✅ [Server Prod] Serving production frontend build from: ${buildPath}`
    );
  } else {
    console.warn(
      `⚠️ [Server Prod] Frontend build directory not found at ${buildPath}. Cannot serve frontend.`
    );
    // Fallback for root path if build is missing in production
    app.get("/", (req, res) => {
      res
        .status(404)
        .send("API is running, but production frontend build is missing.");
    });
  }
} else {
  // Root path response for development mode
  app.get("/", (req, res) => {
    res.send("API is running (Development Mode)...");
  });
}

// --- Custom Error Handling Middleware (Must be defined LAST) ---
// Handles routes that are not found (404)
app.use(notFound);
// Catches errors passed via next(err) or thrown in async handlers (using express-async-handler)
app.use(errorHandler);

// --- Start Server Function ---
const startServer = async () => {
  try {
    console.log("[Server Start] Attempting database connection...");
    await connectDB(); // Connect to MongoDB or your database
    console.log("✅ [Server Start] Database connected successfully.");

    // Start listening only after DB connection is successful
    server.listen(PORT, () => {
      console.log(`\n🚀 Server listening on port ${PORT} [${NODE_ENV}]`);
      console.log(`   CORS enabled for: ${FRONTEND_URL}`);
      console.log(`   API base URL: http://localhost:${PORT}`);
      console.log(`   Static uploads served from: ${uploadsPath}`);
    });
  } catch (err) {
    console.error("❌ [Server Start] Failed to connect to database:", err);
    process.exit(1); // Exit if database connection fails
  }
};

// --- Run the Server ---
startServer();
