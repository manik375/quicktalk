import React, { useEffect, useCallback, useState } from "react";
import { Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchConversations,
  searchUsers,
} from "../../redux/chatSlice";
import { useTheme } from "../../hooks/useTheme";

export default function Chatlist({ selectedChat, onSelectChat }) {
  const dispatch = useDispatch();
  const { colors, styles, getButtonStyle } = useTheme();
  
  const {
    conversations = [],
    filteredList = [], 
    loading,
    searchQuery = "",
  } = useSelector((state) => state.chat || {});

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Fetch conversations on mount
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    
    if (e.target.value.trim().length > 0) {
      setShowSearchResults(true);
      dispatch(searchUsers(e.target.value));
    } else {
      setShowSearchResults(false);
    }
  };
  
  // Select a chat/conversation
  const handleSelectChat = (chatId) => {
    if (onSelectChat) {
      onSelectChat(chatId);
    }
  };
  
  // Format timestamp (e.g., "2h ago", "Yesterday")
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMs = now - date;
      const diffInHours = diffInMs / (1000 * 60 * 60);
      const diffInDays = diffInHours / 24;
      
      if (isNaN(date.getTime())) return "";
      
      if (diffInHours < 1) return "Just now";
      if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
      if (diffInDays < 2) return "Yesterday";
      if (diffInDays < 7) return `${Math.floor(diffInDays)}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }
  };
  
  // Display either search results or conversations
  const displayList = showSearchResults ? filteredList : conversations;
  
  return (
    <div className="h-full flex flex-col" style={styles.container}>
      {/* Search header */}
      <div className="p-4 border-b" style={{ borderColor: colors.borderColor }}>
        <div className="relative">
          <input 
            type="text"
            placeholder="Search users..."
            value={searchInput}
            onChange={handleSearchChange}
            className="w-full py-2 pl-10 pr-4 rounded-lg outline-none transition-all"
            style={styles.input}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Search size={18} style={{ color: colors.textSecondary }} />
          </div>
        </div>
      </div>
      
      {/* List header */}
      <div className="px-4 py-3">
        <h2 style={styles.text.primary} className="font-medium">
          {showSearchResults ? "Search Results" : "Recent Chats"}
        </h2>
      </div>
      
      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {loading === "pending" ? (
          <div className="text-center p-4" style={styles.text.secondary}>
            Loading...
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center p-4" style={styles.text.secondary}>
            {showSearchResults ? "No users found" : "No conversations yet"}
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {displayList.map((chat) => (
              <div
                key={chat.userId}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedChat === chat.userId ? "" : "hover:scale-[1.02]"
                }`}
                style={
                  selectedChat === chat.userId
                    ? { ...styles.card, boxShadow: "inset " + colors.buttonShadow.split("box-shadow: ")[1] }
                    : styles.card
                }
                onClick={() => handleSelectChat(chat.userId)}
              >
                <div className="flex items-center">
                  <div 
                    className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ 
                      background: colors.background,
                      boxShadow: "inset " + colors.buttonShadow.split("box-shadow: ")[1]
                    }}
                  >
                    {chat.imgSrc ? (
                      <img
                        src={chat.imgSrc}
                        alt={chat.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold" style={{ color: colors.accentPrimary }}>
                        {chat.name?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                  
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 style={styles.text.primary} className="font-medium truncate">
                        {chat.name}
                      </h3>
                      {chat.lastMessageTimestamp && (
                        <span style={styles.text.secondary} className="text-xs">
                          {formatTimestamp(chat.lastMessageTimestamp)}
                        </span>
                      )}
                    </div>
                    <p style={styles.text.secondary} className="truncate text-sm">
                      {chat.message || (showSearchResults ? chat.email : "No messages yet")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
