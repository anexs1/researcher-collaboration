const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes.js");
const projectRoutes = require("./routes/projectRoutes.js");
const publicationRoutes = require("./routes/publicationRoutes.js");

const app = express();

app.use(cors());
app.use(express.json());

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
