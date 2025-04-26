// backend/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config(); // ⬅️ this must come before importing anything else that uses env vars
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";

// --- Load Environment Variables VERY EARLY ---
// --------------------------------------------

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

// --- Verify Essential Environment Variables AFTER dotenv.config() ---
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"; // Your React app URL

// Add a console log to verify JWT_SECRET loading
console.log(
  "JWT_SECRET loaded in server.js:",
  JWT_SECRET
    ? `Yes (starts with: ${JWT_SECRET.substring(0, 3)}...)`
    : "No - Check .env file!"
);

if (!JWT_SECRET) {
  console.error(
    "❌ FATAL ERROR: JWT_SECRET is not defined in environment variables. Ensure it's in .env and dotenv.config() is called early."
  );
  process.exit(1); // Exit if secret is missing
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

// --- Static File Serving for uploads ---
const uploadsPath = path.join(__dirname, "uploads");
console.log(`Attempting to serve static files from: ${uploadsPath}`);
// Optional: Check and create directory if it doesn't exist
if (!fs.existsSync(uploadsPath)) {
  console.warn(`⚠️ Uploads directory does not exist, creating: ${uploadsPath}`);
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log(`✅ Successfully created uploads directory.`);
  } catch (mkdirErr) {
    console.error(`❌ Error creating uploads directory: ${mkdirErr.message}`);
  }
}
app.use("/uploads", express.static(uploadsPath)); // Serve files from /uploads URL path

// --- Settings File Initialization (Optional) ---
const initializeSettingsFile = () => {
  const DATA_DIR = path.join(process.cwd(), "data"); // Or adjust path as needed
  const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
  const DEFAULT_SETTINGS = {
    /* default settings */
  };
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
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
    await connectDB();
    console.log("✅ Database connected successfully.");

    // 2. Initialize Settings File (if used)
    // initializeSettingsFile();

    // --- API Routes Mounting ---
    console.log(" Mouting API routes...");
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/projects", projectRoutes);
    app.use("/api/projects/:projectId/members", memberRoutes); // Check route param handling
    app.use("/api/collaboration-requests", collaborationRequestRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/research", researchRoutes);
    app.use("/api/chat", chatRoutes);
    app.use("/api/publications", publicationRoutes); // <-- MOUNT Publication routes

    console.log("✅ API routes mounted.");

    // --- Root Route / Health Check ---
    app.get("/", (req, res) => {
      res.setHeader("Content-Type", "text/html");
      res.send(
        `<h1>API Running</h1><p>Status: OK - Timestamp: ${new Date().toISOString()}</p>`
      );
    });

    // --- Error Handling Middleware (Should be LAST after routes) ---
    app.use(notFound); // Handle 404s
    app.use(errorHandler); // Handle all other errors

    // --- Start Listening ---
    // Use the http server instance which has Socket.IO attached
    server.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`   Frontend expected at: ${FRONTEND_URL}`);
      // Socket.IO start message is now inside initSocketIO
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1); // Exit process on critical startup failure
  }
};

// --- Run the Server ---
startServer();
