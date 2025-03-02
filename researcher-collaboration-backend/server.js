const express = require("express");
const cors = require("cors");
const app = express();

// Apply CORS middleware first
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Handle preflight requests
app.options("/api/publications", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.send();
});
const handleLogin = async (username, password) => {
  // Example: Check credentials with the backend
  const response = await axios.post("/api/login", { username, password });

  if (response.data.role === "admin") {
    setIsAdmin(true); // If the user is an admin, set isAdmin to true
  }
};

// Your routes
app.get("/api/publications", (req, res) => {
  res.json([{ id: 1, content: "Example publication" }]);
});

app.post("/api/publications", (req, res) => {
  const { content } = req.body;
  res.status(201).json({ id: 2, content });
});

// Start the server
app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
