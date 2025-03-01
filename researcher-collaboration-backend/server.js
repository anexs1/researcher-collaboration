// 🚀 Get All Collaboration Requests
app.get("/api/collaboration", (req, res) => {
  db.query(
    "SELECT * FROM collaboration_requests ORDER BY createdAt DESC", // Adjust the query to match your database schema
    (err, results) => {
      if (err)
        return res.status(500).json({
          message: "Error fetching collaboration requests",
          error: err,
        });
      res.json(results); // Return the fetched collaboration requests
    }
  );
});

// 🚀 Add a New Collaboration Request
const fetchResearchers = async () => {
  try {
    const response = await axios.get("http://localhost:5000/api/researchers");
    console.log("Researchers:", response.data);
  } catch (error) {
    console.error("Error fetching researchers:", error);
  }
};

const query =
  "INSERT INTO collaboration_requests (researcherId, collaborationDetails) VALUES (?, ?)";
db.query(query, [researcherId, collaborationDetails], (err, result) => {
  if (err)
    return res
      .status(500)
      .json({ message: "Error adding collaboration request", error: err });
  res.json({ message: "Collaboration request added!", id: result.insertId });
});

// 🚀 Get All Researchers
app.get("/api/researchers", (req, res) => {
  db.query(
    "SELECT * FROM researchers ORDER BY name ASC", // Adjust the query to match your database schema
    (err, results) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error fetching researchers", error: err });
      res.json(results); // Return the list of researchers
    }
  );
});
