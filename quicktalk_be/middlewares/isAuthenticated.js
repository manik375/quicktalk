const jwt = require("jsonwebtoken"); // Import the jsonwebtoken library

const isAuthenticated = (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Typically "Bearer <token>"

    if (!token) {
      return res.status(401).json({ message: "No token provided" }); // 401 Unauthorized
    }
    console.log("Token received:", token); // Add this line
    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
      // Use your JWT secret key from environment variables!
      if (error) {
        console.error("JWT verification error:", error);
        return res.status(401).json({ message: "Invalid token" }); // 401 Unauthorized - token is invalid or expired
      }

      // If verification is successful, 'decoded' will contain the token payload (user info)
      // You can attach the user ID from the token to req.user
      req.user = { _id: decoded.userId }; // Attach user ID from token
      next(); // Proceed to the next middleware or route handler
    });
  } else {
    // No Authorization header provided
    return res.status(401).json({ message: "Authorization header missing" }); // 401 Unauthorized
  }
};

module.exports = isAuthenticated;
