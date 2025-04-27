// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config(); // Load .env FIRST
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http"; // Use http for Socket.IO

// --- Config & Middleware ---
import { initSocketIO } from "./config/socketSetup.js"; // Make sure path is correct
import { connectDB } from "./config/db.js"; // Make sure path is correct
import { notFound, errorHandler } from "./middleware/errorMiddleware.js"; // Adjust path

// --- Route Imports ---
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
// import memberRoutes from './routes/members.js'; // Comment out if not used/defined
import publicationRoutes from "./routes/publicationRoutes.js";
import collaborationRequestRoutes from "./routes/collaborationRequestRoutes.js";
// import adminRoutes from './routes/admin.routes.js'; // Comment out if not used/defined
// import researchRoutes from './routes/researchRoutes.js'; // Comment out if not used/defined
// import chatRoutes from './routes/chatRoutes.js'; // Comment out if not used (handled by messaging/sockets now)
import messagingRoutes from "./routes/messagingRoutes.js"; // <<< MESSAGING ROUTES

// --- Environment Variable Check ---
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || "development";

console.log(`NODE_ENV: ${NODE_ENV}`);
console.log(`Frontend URL CORS Target: ${FRONTEND_URL}`);
if (!JWT_SECRET) {
  console.error("❌ FATAL ERROR: JWT_SECRET missing.");
  process.exit(1);
} else {
  console.log("✅ JWT_SECRET loaded.");
}
// --- End Env Check ---

// --- Initialize Express App and HTTP Server ---
const app = express();
const server = http.createServer(app); // Create HTTP server

// --- Initialize Socket.IO ---
const io = initSocketIO(server); // Attach Socket.IO

// --- ES Module __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Core Middleware ---
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// --- Static File Serving ---
const uploadsPath = path.join(__dirname, "uploads");
console.log(`Serving static '/uploads' from: ${uploadsPath}`);
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("Created uploads directory.");
}
app.use("/uploads", express.static(uploadsPath));

// --- API Routes ---
console.log("Mounting API routes...");
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
// app.use('/api/projects/:projectId/members', memberRoutes); // Verify structure if using
app.use("/api/collaboration-requests", collaborationRequestRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/messaging", messagingRoutes); // <<< Mounted messaging routes
// app.use('/api/admin', adminRoutes);
// app.use('/api/research', researchRoutes);
// app.use('/api/chat', chatRoutes); // Likely superseded by messaging/sockets
console.log("✅ API routes mounted.");

// --- Serve React Frontend Build in Production ---
if (NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../frontend/dist"); // Adjust to your build dir
  console.log(`Production: Serving static files from ${buildPath}`);
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(buildPath, "index.html"));
    });
    console.log("✅ Configured to serve production frontend build.");
  } else {
    console.warn(
      `⚠️ Production: Frontend build directory not found at ${buildPath}`
    );
    app.get("/", (req, res) => {
      res.send("API Running (Production Frontend build missing)");
    });
  }
} else {
  app.get("/", (req, res) => {
    res.send("API is running (Development Mode)...");
  });
}

// --- Error Handling Middleware (LAST) ---
app.use(notFound);
app.use(errorHandler);

// --- Start Server Function ---
const startServer = async () => {
  try {
    await connectDB(); // Connect to DB first
    // Use the HTTP server (with Socket.IO attached) to listen
    server.listen(PORT, () => {
      console.log(`\n🚀 Server listening on port ${PORT} [${NODE_ENV}]`);
    });
  } catch (err) {
    console.error("❌ Database Connection Failed:", err);
    process.exit(1);
  }
};

// --- Run ---
startServer();
