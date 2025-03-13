// server.js
const express = require("express");
const cors = require("cors");
const publicationRoutes = require("./routes/publicationRoutes");
const sequelize = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use("/uploads", express.static("uploads"));

// Mount publication routes
app.use("/api", publicationRoutes);

// Sync database
sequelize.sync().then(() => console.log("Database synced."));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
