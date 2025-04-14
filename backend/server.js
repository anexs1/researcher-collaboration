import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// --- Route Imports ---
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import publicationRoutes from "./routes/publicationRoutes.js";
import collaborationRequestRoutes from "./routes/collaborationRequestRoutes.js";
import adminRoutes from "./routes/admin.routes.js";

// --- Database Connection ---
import { connectDB } from "./config/db.js";

dotenv.config();
const app = express();

// Connect DB
connectDB()
  .then(() => {
    console.log("Database connected.");

    // Initialize settings file after DB connection
    initializeSettingsFile();
  })
  .catch((err) => {
    console.error("DB Connect Failed:", err);
    process.exit(1);
  });

// Initialize settings file
const initializeSettingsFile = () => {
  const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");
  const DEFAULT_SETTINGS = {
    siteName: "ResearchConnect",
    allowPublicSignup: true,
    maintenanceMode: false,
    defaultUserRole: "user",
    emailNotifications: true,
    itemsPerPage: 10,
    themeColor: "#3b82f6",
  };

  if (!fs.existsSync(SETTINGS_PATH)) {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(path.join(process.cwd(), "data"))) {
      fs.mkdirSync(path.join(process.cwd(), "data"));
    }

    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    console.log("Default settings file created");
  }
};

// Core Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Static Folder ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// --- API Route Mounting ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/collaboration-requests", collaborationRequestRoutes);
app.use("/api/admin", adminRoutes);

// Admin Settings Routes (added directly since they're simple)
app.get("/api/admin/settings", async (req, res) => {
  try {
    const settings = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data", "settings.json"))
    );
    res.json(settings);
  } catch (err) {
    console.error("Error getting settings:", err);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

app.put("/api/admin/settings", async (req, res) => {
  try {
    const currentSettings = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data", "settings.json"))
    );
    const updatedSettings = { ...currentSettings, ...req.body };

    fs.writeFileSync(
      path.join(process.cwd(), "data", "settings.json"),
      JSON.stringify(updatedSettings, null, 2)
    );

    res.json(updatedSettings);
  } catch (err) {
    console.error("Error updating settings:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("API is running.");
});

// --- Error Handling Middleware ---
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Admin settings endpoint: http://localhost:${PORT}/api/admin/settings`
  );
});
