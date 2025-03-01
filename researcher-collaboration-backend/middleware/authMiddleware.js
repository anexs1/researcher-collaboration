const jwt = require("jsonwebtoken");
app.use(express.json());

const protect = (req, res, next) => {
  // Check if the Authorization header contains a token
  let token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  // Remove the "Bearer" prefix from the token
  token = token.split(" ")[1]; // The token is in the format "Bearer <token>"

  try {
    // Verify the token with the secret key
    const decoded = jwt.verify(token, "your_secret_key"); // Replace "your_secret_key" with your actual secret

    // Attach the decoded user information to the request object
    req.user = decoded;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = { protect };
