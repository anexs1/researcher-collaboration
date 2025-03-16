import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import publicationRoutes from "./routes/publicationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import multer from "multer"; // ✅ File upload support
import path from "path";
import { fileURLToPath } from "url";

// Setup for ES Module directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ Enable CORS with credentials
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow cookies & tokens
  })
);

// ✅ Serve static files (uploaded publications)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Routes
app.use("/api/publications", publicationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth", multer().single("image")); // ✅ File upload support

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
