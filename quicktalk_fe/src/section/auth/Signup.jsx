import React, { useState, useEffect } from "react";
import axios from "axios";

import { Mail, Lock, User, MessageSquare, Shield, Image } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser, clearUser } from "../../redux/userSlice";
import { useDarkMode, DarkModeToggle } from "../../context/DarkModeContext";

export default function SignupPage() {
  // Use the dark mode context instead of local state
  const { darkMode } = useDarkMode();
  const dispatch = useDispatch(); // New: For Redux
  const navigate = useNavigate(); // New: For navigation
  const [profileImage, setProfileImage] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // New: For displaying errors
  const [confirmPassword, setConfirmPassword] = useState("");

  // Handle sign up submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      console.error("Passwords do not match!");
      setError("Passwords do not match!"); // New: Show error in UI
      return;
    }

    // Prepare payload
    const payload = {
      email,
      fullName,
      password,
      profileImage, // This is the object URL from the image preview; in production consider uploading the file and storing the returned URL.
    };

    console.log(payload);

    try {
      // Replace REACT_APP_API_URL with your backend URL, or use a relative URL if on the same domain.
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || ""}/api/auth/register`,
        payload
      );

      if (response.status === 201) {
        // New: Auto-login after signup
        const loginResponse = await axios.post(
          `${import.meta.env.VITE_API_URL || ""}/api/auth/login`,
          { email, password }
        );

        // New: Store user info in Redux
        dispatch(setUser(loginResponse.data.user));

        // New: Use navigate instead of window.location.href
        navigate("/"); // Changed from /home to match your Messages route
      }
    } catch (error) {
      console.error(
        "Signup failed:",
        error.response?.data?.message || error.message
      );
      // New: Show error in UI
      setError(
        error.response?.data?.message || "Signup failed. Please try again."
      );
    }
  };

  // Enhanced color palette based on provided colors
  const theme = {
    light: {
      background: "#edf2f0",
      accentPrimary: "#32C48D",
      accentSecondary: "#4DDBA4",
      textPrimary: "#1A2F28",
      textSecondary: "#4A6259",
      shadow: "rgba(144, 174, 170, 0.4)",
      buttonShadow: "5px 5px 10px #c8d6d0, -5px -5px 10px #ffffff",
      buttonInsetShadow:
        "inset 5px 5px 10px #c8d6d0, inset -5px -5px 10px #ffffff",
      inputShadow:
        "inset 4px 4px 8px rgba(144, 174, 170, 0.4), inset -4px -4px 8px #ffffff",
      hoverBg: "#dfe7e3",
      borderColor: "rgba(26, 47, 40, 0.08)",
      featureCardShadow: "8px 8px 16px #c8d6d0, -8px -8px 16px #ffffff",
    },
    dark: {
      background: "#1A2639",
      accentPrimary: "#5EB2FF",
      accentSecondary: "#8ACBFF",
      textPrimary: "#F0F5FF",
      textSecondary: "#B0C4E0",
      shadow: "rgba(0, 0, 0, 0.6)",
      buttonShadow: "5px 5px 10px #141b2b, -5px -5px 10px #243147",
      buttonInsetShadow:
        "inset 5px 5px 10px #141b2b, inset -5px -5px 10px #243147",
      inputShadow:
        "inset 4px 4px 8px rgba(0, 0, 0, 0.6), inset -4px -4px 8px #243147",
      hoverBg: "#243147",
      borderColor: "rgba(240, 245, 255, 0.08)",
      featureCardShadow: "8px 8px 16px #141b2b, -8px -8px 16px #243147",
    },
  };

  // Get current theme based on darkMode flag
  const currentTheme = darkMode ? theme.dark : theme.light;

  // Handle image upload and preview
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const imageFile = e.target.files[0];
      // Create an object URL to show a preview; in production you may use FileReader
      setProfileImage(URL.createObjectURL(imageFile));
    }
  };

  return (
    <div
      style={{
        background: currentTheme.background,
      }}
      className="h-screen w-screen flex"
    >
      {/* Left side - App Info */}
      <div className="w-1/2 p-12 flex flex-col">
        {/* App Logo */}
        <div className="mb-8 flex justify-between items-center">
          <div
            style={{
              background: currentTheme.background,
              boxShadow: currentTheme.buttonShadow,
              color: currentTheme.accentPrimary,
            }}
            className="w-14 h-14 rounded-xl flex items-center justify-center"
          >
            <MessageSquare size={26} />
          </div>
          
          {/* Add Dark Mode Toggle */}
          <DarkModeToggle />
        </div>

        {/* App Name & Slogan */}
        <div className="mb-12">
          <h1
            style={{ color: currentTheme.textPrimary }}
            className="text-3xl font-bold mb-3"
          >
            ChatSphere
          </h1>
          <p style={{ color: currentTheme.textSecondary }} className="text-lg">
            Join our community and connect with friends and colleagues in a
            secure messaging environment.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="space-y-6 flex-1">
          {/* Feature Card 1 */}
          <div
            style={{
              background: currentTheme.background,
              boxShadow: currentTheme.featureCardShadow,
              borderRadius: "16px",
            }}
            className="p-6 transition-all duration-200 hover:scale-[1.01]"
          >
            <div
              style={{
                color: currentTheme.accentPrimary,
                background: currentTheme.background,
                boxShadow: currentTheme.buttonShadow,
              }}
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            >
              <MessageSquare size={22} />
            </div>
            <h3
              style={{ color: currentTheme.textPrimary }}
              className="text-lg font-semibold mb-2"
            >
              Real-time Messaging
            </h3>
            <p
              style={{ color: currentTheme.textSecondary }}
              className="text-sm"
            >
              Experience fast and reliable messaging with your contacts.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div
            style={{
              background: currentTheme.background,
              boxShadow: currentTheme.featureCardShadow,
              borderRadius: "16px",
            }}
            className="p-6 transition-all duration-200 hover:scale-[1.01]"
          >
            <div
              style={{
                color: currentTheme.accentPrimary,
                background: currentTheme.background,
                boxShadow: currentTheme.buttonShadow,
              }}
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            >
              <Shield size={22} />
            </div>
            <h3
              style={{ color: currentTheme.textPrimary }}
              className="text-lg font-semibold mb-2"
            >
              Secure Communication
            </h3>
            <p
              style={{ color: currentTheme.textSecondary }}
              className="text-sm"
            >
              Your conversations are protected with end-to-end encryption.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Sign Up Form */}
      <div className="w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="flex flex-col items-center mb-4">
            <h1
              style={{ color: currentTheme.textPrimary }}
              className="text-2xl font-semibold tracking-wide"
            >
              Create Account
            </h1>
            <p
              style={{ color: currentTheme.textSecondary }}
              className="text-sm mt-1"
            >
              Join ChatSphere and start connecting today.
            </p>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Profile Image Upload */}
              <div>
                <label
                  style={{ color: currentTheme.textSecondary }}
                  className="text-sm font-medium mb-2 block"
                  htmlFor="profileImageUpload"
                >
                  Profile Picture
                </label>
                <div className="relative">
                  {/* Hidden File Input */}
                  <input
                    id="profileImageUpload"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                  />
                  <label
                    htmlFor="profileImageUpload"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: currentTheme.inputShadow,
                      background: currentTheme.background,
                      borderRadius: "16px",
                    }}
                    className="w-full py-3"
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile Preview"
                        className="w-10 h-10 rounded-full object-cover mr-2"
                      />
                    ) : (
                      <Image
                        size={18}
                        color={currentTheme.accentPrimary}
                        className="mr-2"
                      />
                    )}
                    {profileImage ? "Change Image" : "Upload Image"}
                  </label>
                </div>
              </div>

              {/* Full Name Field */}
              <div>
                <label
                  style={{ color: currentTheme.textSecondary }}
                  className="text-sm font-medium mb-2 block"
                >
                  Full Name
                </label>
                <div
                  style={{
                    boxShadow: currentTheme.inputShadow,
                    background: currentTheme.background,
                    borderRadius: "16px",
                  }}
                  className="relative overflow-hidden"
                >
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <User size={18} color={currentTheme.accentPrimary} />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      color: currentTheme.textPrimary,
                      background: "transparent",
                      caretColor: currentTheme.accentPrimary,
                    }}
                    className="w-full py-3 pl-12 pr-4 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label
                  style={{ color: currentTheme.textSecondary }}
                  className="text-sm font-medium mb-2 block"
                >
                  Email
                </label>
                <div
                  style={{
                    boxShadow: currentTheme.inputShadow,
                    background: currentTheme.background,
                    borderRadius: "16px",
                  }}
                  className="relative overflow-hidden"
                >
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Mail size={18} color={currentTheme.accentPrimary} />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      color: currentTheme.textPrimary,
                      background: "transparent",
                      caretColor: currentTheme.accentPrimary,
                    }}
                    className="w-full py-3 pl-12 pr-4 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  style={{ color: currentTheme.textSecondary }}
                  className="text-sm font-medium mb-2 block"
                >
                  Password
                </label>
                <div
                  style={{
                    boxShadow: currentTheme.inputShadow,
                    background: currentTheme.background,
                    borderRadius: "16px",
                  }}
                  className="relative overflow-hidden"
                >
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Lock size={18} color={currentTheme.accentPrimary} />
                  </div>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      color: currentTheme.textPrimary,
                      background: "transparent",
                      caretColor: currentTheme.accentPrimary,
                    }}
                    className="w-full py-3 pl-12 pr-4 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  style={{ color: currentTheme.textSecondary }}
                  className="text-sm font-medium mb-2 block"
                >
                  Confirm Password
                </label>
                <div
                  style={{
                    boxShadow: currentTheme.inputShadow,
                    background: currentTheme.background,
                    borderRadius: "16px",
                  }}
                  className="relative overflow-hidden"
                >
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Lock size={18} color={currentTheme.accentPrimary} />
                  </div>
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      color: currentTheme.textPrimary,
                      background: "transparent",
                      caretColor: currentTheme.accentPrimary,
                    }}
                    className="w-full py-3 pl-12 pr-4 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl text-white font-semibold"
                style={{
                  background: currentTheme.accentPrimary,
                  boxShadow: currentTheme.buttonShadow,
                }}
              >
                Create Account
              </button>

              {/* Redirect to Sign In */}
              <div className="text-center">
                <p
                  style={{ color: currentTheme.textSecondary }}
                  className="text-sm"
                >
                  Already have an account?{" "}
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/login");
                    }}
                    href="/login"
                    style={{ color: currentTheme.accentPrimary }}
                    className="hover:underline"
                  >
                    Sign in
                  </a>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
