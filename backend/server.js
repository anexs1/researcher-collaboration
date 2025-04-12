import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// --- Route Imports ---
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // Make sure this file exists and exports default
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
  })
  .catch((err) => {
    console.error("DB Connect Failed:", err);
    process.exit(1); // Exit the process if DB connection fails
  });

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Static Folder ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// *** ADJUST this path if your uploads are elsewhere ***
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// --- API Route Mounting ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // For user profile actions
app.use("/api/publications", publicationRoutes);
app.use("/api/projects", projectRoutes); // <<< CORRECT path for projects
app.use("/api/collaboration-requests", collaborationRequestRoutes);
app.use("/api/admin", adminRoutes);

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
  const statusCode =
    res.statusCode === 200 ? err.statusCode || 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Error" : err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
