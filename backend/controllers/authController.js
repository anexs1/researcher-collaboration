import db from "../config/db";

export const signup = (req, res) => {
  const {
    username,
    email,
    password,
    expertise,
    profileImage,
    bio,
    location,
    phone,
  } = req.body;
  const query =
    "INSERT INTO users (username, email, password, expertise, profileImage, bio, location, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

  db.query(
    query,
    [username, email, password, expertise, profileImage, bio, location, phone],
    (err) => {
      if (err) {
        return res.status(500).send({ error: "Error creating user" });
      }
      res.status(201).send({ message: "User created successfully" });
    }
  );
};

export const login = (req, res) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username = ? AND password = ?";

  db.query(query, [username, password], (err, results) => {
    if (err) {
      return res.status(500).send({ error: "Error logging in" });
    }
    if (results.length > 0) {
      res.send({ token: "fake-jwt-token", user: results[0] });
    } else {
      res.status(401).send({ error: "Invalid credentials" });
    }
  });
};
