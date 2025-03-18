import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ConversationArea from "../section/chat/ConversationArea";
import Sidebar from "../section/chat/Sidebar";
import Chatlist from "../section/chat/Chatlist";
import { selectChat } from "../redux/chatSlice";
import UserSettings from "../components/settings/UserSettings";
import UserProfile from "../components/profile/UserProfile";
import { initSocket, disconnectSocket } from "../utils/socket";
import { useTheme } from "../hooks/useTheme";
import { logout } from "../redux/authSlice";

export default function Messages() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { colors, styles } = useTheme();
  
  // Get current user from redux store
  const { user } = useSelector((state) => state.auth);
  
  // Local state
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(localStorage.getItem("sidebarCollapsed") === "true");
  const [showSettings, setShowSettings] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  // Get selected chat from redux store
  const { selectedChat } = useSelector((state) => state.chat);
  
  // Initialize socket connection
  useEffect(() => {
    if (user?.token) {
      try {
        console.log("Initializing socket with token");
        const socket = initSocket(user.token);
        
        // Add error handling
        socket.on('error', (error) => {
          console.error('Socket error:', error);
        });

        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

        // Cleanup socket on unmount
        return () => {
          console.log("Cleaning up socket connection");
          disconnectSocket();
        };
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    }
  }, [user?.token]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user?.token) {
      navigate("/login");
    }
  }, [user, navigate]);
  
  // Handle chat selection
  const handleSelectChat = useCallback((chatId) => {
    dispatch(selectChat(chatId));
    // Close settings if open
    if (showSettings) setShowSettings(false);
    if (showUserProfile) setShowUserProfile(false);
  }, [dispatch, showSettings, showUserProfile]);
  
  // Handle settings click
  const handleSettingsClick = useCallback(() => {
    setShowSettings(true);
    setShowUserProfile(false);
  }, []);
  
  // Handle conversation header click to show user profile
  const handleConversationHeaderClick = useCallback(() => {
    if (selectedChat) {
      setShowUserProfile(true);
      setShowSettings(false);
    }
  }, [selectedChat]);
  
  // Handle mobile sidebar toggle
  const toggleSidebar = useCallback(() => {
    setSidebarVisible(!sidebarVisible);
  }, [sidebarVisible]);
  
  // Handle logout
  const handleLogout = useCallback(() => {
    disconnectSocket();
    dispatch(logout());
    navigate("/login");
  }, [dispatch, navigate]);
  
  return (
    <div className="flex h-screen bg-gray-100" style={styles.container}>
      {/* Sidebar */}
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed}
        onSettingsClick={handleSettingsClick}
        handleLogout={handleLogout}
      />
      
      {/* Chat list */}
      {sidebarVisible && (
        <div className={`${collapsed ? "w-[320px]" : "w-[280px]"} h-full transition-all duration-300`}>
          <Chatlist 
            selectedChat={selectedChat} 
            onSelectChat={handleSelectChat}
          />
        </div>
      )}
      
      {/* Main content */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        {selectedChat ? (
          showSettings ? (
            <UserSettings onClose={() => setShowSettings(false)} />
          ) : showUserProfile ? (
            <UserProfile 
              userId={selectedChat}
              onBackToChat={() => setShowUserProfile(false)}
              onClose={() => {
                setShowUserProfile(false);
                dispatch(selectChat(null));
              }}
            />
          ) : (
            <ConversationArea 
              toggleSidebar={toggleSidebar} 
              sidebarVisible={sidebarVisible}
              onHeaderClick={handleConversationHeaderClick}
            />
          )
        ) : (
          showSettings ? (
            <UserSettings onClose={() => setShowSettings(false)} />
          ) : (
            <div 
              className="h-full flex flex-col items-center justify-center p-8 text-center"
              style={styles.container}
            >
              <h2 style={styles.text.primary} className="text-2xl font-semibold mb-4">
                No conversation selected
              </h2>
              <p style={styles.text.secondary} className="max-w-md">
                Select a conversation from the list or search for users to start chatting
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
