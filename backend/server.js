// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";

import { initSocketIO, getIo } from "./config/socketSetup.js";
import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { protect, adminOnly } from "./middleware/authMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import publicationRoutes from "./routes/publicationRoutes.js";
import collaborationRequestRoutes from "./routes/collaborationRequestRoutes.js";
import messagingRoutes from "./routes/messagingRoutes.js";
import adminMainRoutes from "./routes/admin.routes.js";
import adminMessageRoutes from "./routes/adminMessageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import helpCenterApiRoutes from "./routes/helpCenterApiRoutes.js";
import fileEditorRoutes from "./routes/fileEditorRoutes.js";

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || "development";

if (!JWT_SECRET) {
  console.error("❌ FATAL ERROR: JWT_SECRET environment variable is not set.");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

let io;
try {
  io = initSocketIO(server);
  app.set("socketio", io);
} catch (error) {
  console.error("❌ FATAL ERROR: Socket.IO initialization failed!", error);
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log(`✅ Created 'uploads' directory at: ${uploadsPath}`);
  } catch (mkdirErr) {
    console.error(
      `❌ [Server Config] Failed to create 'uploads' directory: ${uploadsPath}`,
      mkdirErr
    );
  }
}
app.use("/uploads", express.static(uploadsPath));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/collaboration-requests", collaborationRequestRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/messaging", messagingRoutes);
app.use("/api/admin-messages", adminMessageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/help-center", helpCenterApiRoutes);
app.use("/api/file-editor", fileEditorRoutes);

if (adminMainRoutes) {
  app.use("/api/admin", adminMainRoutes);
}

if (NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../frontend/dist");
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(buildPath, "index.html"));
    });
    console.log(`✅ Serving production frontend from: ${buildPath}`);
  } else {
    console.warn(`⚠️ Production frontend build not found at: ${buildPath}.`);
    app.get("/", (req, res) => {
      res
        .status(404)
        .send("API is running, but production frontend build is missing.");
    });
  }
} else {
  app.get("/", (req, res) => {
    res.send(`API is running (Development Mode on Port ${PORT})...`);
  });
}

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`\n🚀 Server listening on port ${PORT} [${NODE_ENV}]`);
      console.log(`   CORS enabled for: ${FRONTEND_URL}`);
      console.log(
        `   API base (example): http://localhost:${PORT}/api/auth/status`
      );
    });
  } catch (err) {
    console.error("❌ [Server Start] Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("SIGINT", () => {
  console.info("\nSIGINT signal received: closing HTTP server gracefully...");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.info("SIGTERM signal received: closing HTTP server gracefully...");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});
