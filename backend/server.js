// backend/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config(); // ⬅️ Good, called early
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";

// --- Now import modules that might depend on process.env ---
import { initSocketIO } from "./config/socketSetup.js"; // Adjust path if needed
import { connectDB } from "./config/db.js"; // Adjust path if needed
import authRoutes from "./routes/authRoutes.js"; // Adjust path
import userRoutes from "./routes/userRoutes.js"; // Adjust path
import projectRoutes from "./routes/projectRoutes.js"; // Adjust path
import memberRoutes from "./routes/members.js"; // Adjust path
import publicationRoutes from "./routes/publicationRoutes.js"; // <-- IMPORT Publication routes
import collaborationRequestRoutes from "./routes/collaborationRequestRoutes.js";
import adminRoutes from "./routes/admin.routes.js"; // Adjust path
import researchRoutes from "./routes/researchRoutes.js"; // Adjust path
import chatRoutes from "./routes/chatRoutes.js"; // Adjust path
import { notFound, errorHandler } from "./middleware/errorMiddleware.js"; // Adjust path, ensure file exists
import messagingRoutes from "./routes/messagingRoutes.js"; // <<< **** ADD THIS IMPORT ****

// --- Verify Essential Environment Variables AFTER dotenv.config() ---
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"; // Your React app URL

console.log(
  "JWT_SECRET loaded in server.js:",
  JWT_SECRET
    ? `Yes (starts with: ${JWT_SECRET.substring(0, 3)}...)`
    : "No - Check .env file!"
);
if (!JWT_SECRET) {
  console.error("❌ FATAL ERROR: JWT_SECRET is not defined...");
  process.exit(1);
}
// -----------------------------------------------------------------

// --- Express App Initialization ---
const app = express();
const server = http.createServer(app); // Create HTTP server BEFORE Socket.IO init

// --- Initialize Socket.IO using the setup function ---
const io = initSocketIO(server); // Pass the http server instance
// ---------------------------------------------------

// --- ES Module __dirname Equivalent ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Core Express Middleware ---
app.use(cors({ origin: FRONTEND_URL, credentials: true })); // Enable CORS
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded bodies
// NOTE: messagingRoutes was already mounted in your previous version, which is correct.
// app.use("/api/messaging", messagingRoutes); // This line should already be present based on your file

// --- Static File Serving for uploads ---
const uploadsPath = path.join(__dirname, "uploads");
console.log(`Attempting to serve static files from: ${uploadsPath}`);
if (!fs.existsSync(uploadsPath)) {
  /* ... create dir logic ... */
}
app.use("/uploads", express.static(uploadsPath));

// --- Settings File Initialization (Optional - Keep as is) ---
const initializeSettingsFile = () => {
  /* ... */
};

// --- Main Application Logic in an Async Function ---
const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();
    console.log("✅ Database connected successfully.");

    // 2. Initialize Settings File (if used)
    // initializeSettingsFile();

    // --- API Routes Mounting ---
    console.log(" Mouting API routes...");
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/projects", projectRoutes);
    app.use("/api/projects/:projectId/members", memberRoutes); // Check this pattern
    app.use("/api/collaboration-requests", collaborationRequestRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/research", researchRoutes);
    app.use("/api/chat", chatRoutes); // Keep if you have separate chat routes
    app.use("/api/publications", publicationRoutes);
    app.use("/api/messaging", messagingRoutes); // <<< **** ENSURE THIS LINE IS PRESENT ****

    console.log("✅ API routes mounted.");

    // --- Root Route / Health Check ---
    app.get("/", (req, res) => {
      /* ... */
    });

    // --- Error Handling Middleware (Should be LAST after routes) ---
    app.use(notFound); // Handle 404s
    app.use(errorHandler); // Handle all other errors

    // --- Start Listening ---
    server.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`   Frontend expected at: ${FRONTEND_URL}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

// --- Run the Server ---
startServer();
