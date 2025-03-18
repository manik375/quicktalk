import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
  User,
  Lock,
  Mail,
  ArrowRight,
  MessageSquare,
  Users,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { login } from "../../redux/authSlice"; // Import login action from authSlice instead
import { initializeSocket } from "../../services/socketService"; // Import the socket initialization function
import { useDarkMode, DarkModeToggle } from "../../context/DarkModeContext";

export default function LoginPage() {
  // Use the dark mode context instead of local state
  const { darkMode } = useDarkMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState("");

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

  // Get current theme
  const currentTheme = darkMode ? theme.dark : theme.light;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Payload for sign-in
    const payload = {
      email,
      password,
    };

    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/auth/login`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("apna code yaha tak chal gya");

      if (response.status === 200) {
        // Extract JWT token from response
        const token = response.data.token;

        // Store JWT token in localStorage
        localStorage.setItem("userToken", token);
        console.log("JWT Token stored:", token);

        // Store user info in Redux with token
        const userData = {
          ...response.data.user,
          token // Add token to user data
        };
        
        // Use the userData directly in localStorage as well to match authSlice expectations
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Dispatch to Redux
        dispatch({ type: 'auth/login/fulfilled', payload: userData });

        // Check if userData has the required fields, otherwise extract them
        let userId = userData._id;
        let username = userData.username;

        // If no _id, try to extract it from token (assuming JWT contains userId)
        if (!userId) {
          try {
            // Decode JWT token to get user ID (tokens are usually in format header.payload.signature)
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              userId = payload.userId || payload.sub || payload.id;
              console.log("Extracted userId from token:", userId);
            }
          } catch (e) {
            console.error("Could not extract userId from token:", e);
          }
        }

        // If no username, use email
        if (!username && userData.email) {
          username = userData.email.split('@')[0]; // Use part before @ as username
          console.log("Using email-based username:", username);
        }

        // Initialize socket if we have both userId and username
        if (userId && username) {
          console.log("Initializing socket with:", userId, username);
          initializeSocket(userId, username);
        } else {
          console.error("Cannot initialize socket: missing user data", userData);
        }

        setError(""); // Clear any previous errors
        navigate("/"); // Redirect to home (Messages component)
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Sign-in failed. Please try again.";
      setError(errorMessage);
      console.error("Sign-in failed:", errorMessage);
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
        {/* App Logo Section */}
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
            Connect with friends and colleagues in a secure and modern messaging
            environment.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="space-y-6 flex-1 ">
          {/* Feature 1 */}
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
              Send and receive messages instantly with our powerful real-time
              messaging system.
            </p>
          </div>

          {/* Feature 3 */}
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
              End-to-end encryption ensures your conversations remain private
              and secure.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-1/2 p-8 flex flex-col justify-center items-center">
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">
              Login to QuickTalk
            </h2>
          </div>
          
          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
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
                    className="w-full py-4 pl-12 pr-4 focus:outline-none"
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
                    className="w-full py-4 pl-12 pr-4 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Error message display */}
              {error && (
                <div
                  style={{ color: "#ff5252" }}
                  className="text-sm text-center"
                >
                  {error}
                </div>
              )}

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <a
                  href="#"
                  style={{ color: currentTheme.accentPrimary }}
                  className="text-sm hover:underline"
                >
                  Forgot Password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                style={{
                  background: currentTheme.background,
                  boxShadow: currentTheme.buttonShadow,
                  color: currentTheme.accentPrimary,
                }}
                className="w-full py-4 rounded-2xl mt-4 font-medium transition-all duration-150 hover:scale-[1.01]"
              >
                <div className="flex items-center justify-center">
                  <span>Sign In</span>
                  <ArrowRight size={18} className="ml-2" />
                </div>
              </button>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p style={{ color: currentTheme.textSecondary }}>
                  <span className="text-sm">Don't have an account? </span>
                  <a
                    href="/signup"
                    style={{ color: currentTheme.accentPrimary }}
                    className="text-sm font-medium hover:underline"
                  >
                    Sign Up
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
