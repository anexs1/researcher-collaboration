import express from "express";
import dotenv from "dotenv";
import cors from "cors"; // ✅ Import CORS
import publicationRoutes from "./routes/publicationRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ Enable CORS for frontend
app.use(
  cors({
    origin: "http://localhost:5173", // Allow frontend requests
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Define routes
app.use("/api/publications", publicationRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
