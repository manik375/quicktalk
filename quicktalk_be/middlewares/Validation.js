const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const User = require("../models/User");

// Define Zod schema for registration
const registerSchema = z.object({
  email: z
    .string()
    .email({ message: "Please provide a valid email address" })
    .transform((val) => val.toLowerCase()), // Normalize email
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name must be less than 50 characters" })
    .trim(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .regex(/[A-Za-z]/, { message: "Password must contain at least one letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  pic: z
    .string()
    .url({ message: "Profile picture must be a valid URL" })
    .optional(), // Optional field
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
  const { email, fullName, password, pic } = req.body;

  try {
    // Validate input using Zod
    const parsedData = registerSchema.safeParse(req.body);
    if (!parsedData.success) {
      // Format Zod errors and return them
      const errors = parsedData.error.issues.map((issue) => ({
        field: issue.path[0],
        message: issue.message,
      }));
      return res.status(400).json({ errors });
    }

    // Extract validated data
    const validatedData = parsedData.data;

    // Check if user exists
    let user = await User.findOne({ email: validatedData.email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    // Create new user
    user = new User({
      email: validatedData.email,
      name: validatedData.fullName,
      password: hashedPassword,
      pic: validatedData.pic, // Will use schema default if undefined
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
