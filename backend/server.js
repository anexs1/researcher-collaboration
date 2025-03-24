import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import publicationRoutes from "./routes/publicationRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/SignupPage", authRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/myprojects", projectRoutes);

app.use("/api/auth", authRoutes);
app.get("/", (req, res) => {
  res.send("My Projects Backend API");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
