// server.js
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import publicationRoutes from "./routes/publicationRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
import {
  authenticateToken,
  authorizeRoles,
} from "./middleware/authMiddleware.js"; // Import both middleware functions

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/myprojects", projectRoutes);

// Example: Only 'admin' users can access the admin routes
// app.use(
//   "/api/admin/researchers",
//   authenticateToken,
//   authorizeRoles("admin"),
//   adminRoutes
// );

// Example: Only 'admin' or 'moderator' users can access these routes
app.get(
  "/api/moderated",
  authenticateToken,
  authorizeRoles("admin", "moderator"),
  (req, res) => {
    res.json({ message: "Moderated content", user: req.user });
  }
);

// Example: Only authenticated users (any role) can access user profile
app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({ message: "User profile", user: req.user });
});

app.get("/", (req, res) => {
  res.send("My Projects Backend API");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
