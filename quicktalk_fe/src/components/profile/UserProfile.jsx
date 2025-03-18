import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft, X } from "@phosphor-icons/react";
import { useTheme } from "../../hooks/useTheme";
import axios from "axios";

export default function UserProfile({ userId, onBackToChat, onClose }) {
  const dispatch = useDispatch();
  const { colors, styles, getButtonStyle } = useTheme();
  const { user } = useSelector((state) => state.auth);
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Function to fetch user profile - wrapped in useCallback to prevent infinite loops
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching user profile for userId:", userId);
      console.log("User ID type:", typeof userId);
      
      // First try to get user from chat list (which contains user information)
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`
        }
      });
      
      console.log("Chat list API response:", response.data);
      
      if (!response.data || !response.data.chatList) {
        console.error("No chat data found in response:", response.data);
        throw new Error("No chat data found in response");
      }
      
      console.log("Chat list users:", response.data.chatList.map(chat => ({
        userId: chat.userId,
        name: chat.fullName
      })));
      
      // Find the user in the chat list
      let userData = response.data.chatList.find(chat => 
        chat.userId === userId || 
        chat.userId === userId.toString() || 
        (chat._id && (chat._id === userId || chat._id.toString() === userId))
      );
      
      if (userData) {
        console.log("User found in chat list:", userData);
      }
      
      // If user not found in chat list, try to search for them
      if (!userData) {
        console.log("User not found in chat list, trying search API");
        
        try {
          // Try to get user from search API
          const searchResponse = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/search?q=${userId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`
            }
          });
          
          console.log("Search API response:", searchResponse.data);
          
          if (searchResponse.data && Array.isArray(searchResponse.data)) {
            console.log("Search results:", searchResponse.data.map(user => ({
              _id: user._id,
              userId: user.userId,
              name: user.fullName || user.name
            })));
            
            // Find the user in search results - check different ID formats
            userData = searchResponse.data.find(user => 
              user._id === userId || 
              user._id.toString() === userId ||
              (user.userId && (user.userId === userId || user.userId.toString() === userId))
            );
            
            if (userData) {
              console.log("User found in search results:", userData);
              
              // Transform to expected format
              userData = {
                userId: userData._id || userData.userId,
                fullName: userData.fullName || userData.name,
                email: userData.email,
                pic: userData.pic
              };
              
              console.log("Transformed user data:", userData);
            } else {
              console.log("User not found in search results after checking all ID formats");
            }
          }
        } catch (searchError) {
          console.error("Error searching for user:", searchError);
          console.error("Search error details:", searchError.response?.data || searchError.message);
          // Continue with the flow, we'll throw the original error if needed
        }
      }
      
      // If user not found in chat list or search, try to get from messages
      if (!userData) {
        console.log("User not found in chat list or search, trying messages endpoint");
        
        try {
          // Try to get user info from messages
          const messagesResponse = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/messages/${userId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`
            }
          });
          
          console.log("Messages API response:", messagesResponse.data);
          
          if (messagesResponse.data && messagesResponse.data.messages && messagesResponse.data.messages.length > 0) {
            // Get the first message where the user is either sender or receiver
            const message = messagesResponse.data.messages.find(msg => 
              msg.senderId === userId || msg.receiverId === userId
            );
            
            if (message) {
              console.log("Found message with user:", message);
              
              // Create minimal user data
              userData = {
                userId: userId,
                fullName: "User " + userId.substring(0, 8), // Use part of ID as name
                email: "unknown@example.com",
                pic: null
              };
              
              console.log("Created minimal user data from messages:", userData);
            }
          }
        } catch (messagesError) {
          console.error("Error getting messages for user:", messagesError);
          // Continue with the flow, we'll throw the original error if needed
        }
      }
      
      if (!userData) {
        console.error("User not found in chat list, search results, or messages");
        throw new Error("User not found. They might not be in your chat list yet.");
      }
      
      setProfileData({
        name: userData.fullName || "Unknown User",
        email: userData.email || "No email available",
        bio: "No bio available", // Chat list doesn't include bio
        imgSrc: userData.pic || null,
        status: 'Active', // Default status
        createdAt: new Date().toISOString() // We don't have this info from chat list
      });
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      console.error("Error details:", err.response?.data || err.message);
      
      // Set a more user-friendly error message
      if (err.response?.status === 404) {
        setError("User profile not found. The user may not exist or you don't have permission to view their profile.");
      } else if (err.response?.status === 401) {
        setError("Authentication error. Please log in again.");
      } else {
        setError(err.response?.data?.message || err.message || "Failed to fetch user profile");
      }
      
      setLoading(false);
    }
  }, [userId]);
  
  // Fetch user profile on component mount
  useEffect(() => {
    if (userId) {
      const token = localStorage.getItem("userToken");
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      fetchUserProfile();
    } else {
      setError("Missing user ID");
      setLoading(false);
    }
  }, [userId, fetchUserProfile]);
  
  // Format date to readable string
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "Invalid date";
    }
  };
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={styles.container}>
        <p style={styles.text.secondary}>Loading profile...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={styles.container}>
        <p style={styles.text.secondary} className="text-center mb-4">
          {error}
        </p>
        <div className="flex space-x-4">
          <button 
            onClick={fetchUserProfile} 
            style={getButtonStyle('primary')}
            className="px-4 py-2 rounded-lg"
          >
            Retry
          </button>
          <button 
            onClick={onBackToChat} 
            style={getButtonStyle()}
            className="px-4 py-2 rounded-lg"
          >
            Back to chat
          </button>
        </div>
      </div>
    );
  }
  
  const {
    name,
    email,
    bio,
    imgSrc,
    status,
    createdAt
  } = profileData || {};
  
  return (
    <div className="h-full flex flex-col" style={styles.container}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.borderColor }}>
        <button
          onClick={onBackToChat}
          style={getButtonStyle()}
          className="w-10 h-10 flex items-center justify-center rounded-lg"
        >
          <ArrowLeft size={18} style={{ color: colors.accentPrimary }} />
        </button>
        
        <h2 style={styles.text.primary} className="font-medium">
          User Profile
        </h2>
        
        <button
          onClick={onClose}
          style={getButtonStyle()}
          className="w-10 h-10 flex items-center justify-center rounded-lg"
        >
          <X size={18} style={{ color: colors.accentPrimary }} />
        </button>
      </div>
      
      {/* Profile content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col items-center mb-8">
          <div 
            className="w-24 h-24 rounded-full overflow-hidden mb-4"
            style={{ 
              boxShadow: colors.buttonShadow,
              background: colors.background
            }}
          >
            {imgSrc ? (
              <img 
                src={imgSrc} 
                alt={name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-3xl font-bold"
                style={{ color: colors.accentPrimary }}  
              >
                {name?.charAt(0) || "?"}
              </div>
            )}
          </div>
          
          <h1 style={styles.text.primary} className="text-xl font-semibold mb-1">
            {name || "Unknown User"}
          </h1>
          
          <p style={styles.text.secondary} className="text-sm mb-2">
            {email || "No email available"}
          </p>
          
          <div 
            className="px-3 py-1 rounded-full text-xs"
            style={{ 
              background: colors.accentPrimary,
              color: "#fff"
            }}
          >
            {status || "Active"}
          </div>
        </div>
        
        {/* User details */}
        <div style={styles.card} className="rounded-lg p-4 mb-4">
          <h3 style={styles.text.primary} className="font-medium mb-3">
            About
          </h3>
          <p style={styles.text.secondary} className="text-sm">
            {bio || "This user hasn't added a bio yet."}
          </p>
        </div>
        
        <div style={styles.card} className="rounded-lg p-4">
          <h3 style={styles.text.primary} className="font-medium mb-3">
            Account Info
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span style={styles.text.secondary} className="text-sm">Status</span>
              <span style={styles.text.primary} className="text-sm font-medium">{status || "Active"}</span>
            </div>
            
            <div className="flex justify-between">
              <span style={styles.text.secondary} className="text-sm">Joined</span>
              <span style={styles.text.primary} className="text-sm font-medium">{formatDate(createdAt)}</span>
            </div>
            
            <div className="flex justify-between">
              <span style={styles.text.secondary} className="text-sm">Last Active</span>
              <span style={styles.text.primary} className="text-sm font-medium">Recently</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 