const express = require("express");
const cors = require("cors");
const app = express();
const publicationRoutes = require("./routes/publicationRoutes");

app.use(cors()); // Enable CORS to allow the frontend to connect
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

app.use("/api/publications", publicationRoutes); // Your API routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
