// File: backend/server.js (or app.js) - CORRECTED IMPORTS

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// --- Route Imports (Corrected Paths) ---
import authRoutes from "./routes/authRoutes.js"; // <<< REMOVED /src
import projectRoutes from "./routes/projectRoutes.js"; // <<< REMOVED /src (Assuming same location)
import publicationRoutes from "./routes/publicationRoutes.js"; // <<< REMOVED /src
import collaborationRequestRoutes from "./routes/collaborationRequestRoutes.js"; // <<< REMOVED /src
import adminRoutes from "./routes/admin.routes.js"; // <<< REMOVED /src

// --- Database Connection ---
// Adjust path if config/db.js is not directly under backend/
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();

// Connect to the database
connectDB()
  .then(() => {
    console.log("Database connection attempt completed.");
  })
  .catch((err) => {
    console.error("Database connection or authentication failed:", err);
    process.exit(1);
  });

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Mount API Routers ---
// Base paths remain the same
app.use("/api/auth", authRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/myprojects", projectRoutes); // Ensure this maps correctly
app.use("/api/collaboration-requests", collaborationRequestRoutes);
app.use("/api/admin", adminRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Research Collaboration Backend API is running.");
});

// Basic Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === "development" && { error: err.stack }),
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});
