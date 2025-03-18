const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true, // Email is mandatory
      unique: true, // No duplicate emails allowed
      lowercase: true, // Convert to lowercase for consistency
      trim: true, // Remove extra spaces
    },
    fullName: {
      type: String,
      required: true, // Name is mandatory
      trim: true, // Remove extra spaces
    },
    password: {
      type: String,
      required: true, // Password is mandatory
      minlength: 6, // Minimum length for security
    },
    pic: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1000&auto=format&fit=crop", // Default Unsplash profile pic
    },
    bio: {
      type: String,
      default: "", // Default empty bio
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""], // Allowed values
      default: "", // Not required
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Create the User model
const User = mongoose.model("User", userSchema);

// Export the model
module.exports = User;
