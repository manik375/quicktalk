const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const isAuthenticated = require("../middlewares/isAuthenticated");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept only images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
  const { email, fullName, password, pic } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10); // 10 rounds for security
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      email,
      fullName,
      password: hashedPassword,
      pic: pic || undefined, // Use provided pic or default from schema
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and log them in
// @access  Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare provided password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // **JWT GENERATION ON SUCCESSFUL LOGIN**
    const payload = {
      userId: user._id, // Information to include in the token (keep it minimal)
    };

    const jwtSecret = process.env.JWT_SECRET; // Get JWT secret from environment variable
    if (!jwtSecret) {
      console.error("JWT_SECRET is not set in environment variables!");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: "1h", // Token expires in 1 hour (adjust as needed)
    });

    // Successful login - send back the token
    res.status(200).json({
      message: "Login successful",
      token: token, // Send the JWT to the client
      user: {
        // Optionally, you can still send user details
        email: user.email,
        name: user.fullName,
        pic: user.pic,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private (requires authentication)
router.put("/profile", isAuthenticated, upload.single("profilePicture"), async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, email, bio, gender } = req.body;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Update user fields if provided
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (gender !== undefined) user.gender = gender;
    
    // If a new profile picture was uploaded
    if (req.file) {
      // Create URL for the uploaded file
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      user.pic = `${baseUrl}/uploads/${req.file.filename}`;
    }
    
    // Save the updated user
    await user.save();
    
    // Return the updated user (without password)
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      pic: user.pic,
      bio: user.bio,
      gender: user.gender,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
