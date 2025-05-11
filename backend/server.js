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
import projectRoutes from "./routes/projectRoutes.js";
import publicationRoutes from "./routes/publicationRoutes.js";
import collaborationRequestRoutes from "./routes/collaborationRequestRoutes.js";
import messagingRoutes from "./routes/messagingRoutes.js";
import adminRoutes from "./routes/admin.routes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import helpCenterApiRoutes from "./routes/helpCenterApiRoutes.js"; // Path to your new help center routes

// ... (rest of your server.js code as you provided) ...
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

const app = express();
const server = http.createServer(app);

let io;
try {
  io = initSocketIO(server);
  app.set("socketio", io);
  console.log("✅ [Server Config] Socket.IO initialized.");
} catch (error) {
  console.error("❌ FATAL ERROR: Socket.IO init failed!", error);
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const uploadsPath = path.join(__dirname, "uploads");
console.log(
  `[Server Config] Configuring static file serving for URL '/uploads' from filesystem path: ${uploadsPath}`
);
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
  }
}
app.use("/uploads", express.static(uploadsPath));

console.log("[Server Config] Mounting API routes...");
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/collaboration-requests", collaborationRequestRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/messaging", messagingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/help-center", helpCenterApiRoutes); // MOUNTED HERE

console.log("✅ [Server Config] API routes mounted.");

if (NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../frontend/dist");
  console.log(`[Server Prod] Checking for frontend build at: ${buildPath}`);
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
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
    app.get("/", (req, res) => {
      res
        .status(404)
        .send("API is running, but production frontend build is missing.");
    });
  }
} else {
  app.get("/", (req, res) => {
    res.send("API is running (Development Mode)...");
  });
}

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    console.log("[Server Start] Attempting database connection...");
    await connectDB(); // This is your existing DB connection setup
    console.log("✅ [Server Start] Database connected successfully.");

    server.listen(PORT, () => {
      console.log(`\n🚀 Server listening on port ${PORT} [${NODE_ENV}]`);
      console.log(`   CORS enabled for: ${FRONTEND_URL}`);
      console.log(`   API base URL: http://localhost:${PORT}`);
      console.log(`   Static uploads served from: ${uploadsPath}`);
    });
  } catch (err) {
    console.error("❌ [Server Start] Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection", (err, promise) => {
  console.error(`Unhandled Rejection at: ${promise}, reason: ${err.message}`);
});

process.on("SIGTERM", () => {
  console.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
