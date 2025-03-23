import express from "express";
import cors from "cors"; // Import CORS if needed
import authRoutes from "./routes/authRoutes.js"; // Adjust the path according to your structure
import projectRoutes from "./routes/projectRoutes.js"; // Add .js extension

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/my-projects", projectRoutes);

app.use("/api/auth", authRoutes); // Use the routes defined in auth.js
app.get("/", (req, res) => {
  res.send("My Projects Backend API");
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
