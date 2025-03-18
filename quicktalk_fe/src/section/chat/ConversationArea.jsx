import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  VideoCamera,
  Phone,
  PaperPlaneRight,
  Smiley,
  Image,
  Paperclip,
  DotsThree,
  ArrowLeft,
  MicrophoneStage,
  ChatTeardropText,
  ArrowClockwise,
  User,
  X,
  List,
} from "@phosphor-icons/react";
import { fetchMessages, sendMessageViaSocket } from "../../redux/chatSlice";
import { sendTypingStatus, getSocket } from "../../utils/socket";
import { useTheme } from "../../hooks/useTheme";

export default function ConversationArea({
  toggleSidebar,
  sidebarVisible,
  onHeaderClick
}) {
  const dispatch = useDispatch();
  const { colors, styles, getButtonStyle } = useTheme();
  const selectedChat = useSelector(state => state.chat.selectedChat);
  
  // Get conversations list
  const conversations = useSelector(state => state.chat.conversations);
  const filteredList = useSelector(state => state.chat.filteredList);
  
  // Get messages directly from Redux
  const messagesObj = useSelector(state => state.chat.messages);
  
  // Get typing status
  const typingUsers = useSelector(state => state.chat.typingUsers);

  // Socket connection status for reliability
  const socket = getSocket();
  const isConnected = socket?.connected;

  // Local state
  const [message, setMessage] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isTyping, setIsTyping] = useState(false);
  const [forceRefreshCounter, setForceRefreshCounter] = useState(0);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get current chat data
  const currentChat = useMemo(() => {
    return selectedChat
      ? conversations.find((chat) => chat.userId === selectedChat) ||
        filteredList.find((chat) => chat.userId === selectedChat)
      : null;
  }, [selectedChat, conversations, filteredList]);

  // Get messages for selected chat with proper memoization
  const messages = useMemo(() => {
    if (!selectedChat || !messagesObj[selectedChat]) {
      return [];
    }
    return [...messagesObj[selectedChat]];
  }, [selectedChat, messagesObj, messagesObj[selectedChat]]);

  // Is other user typing?
  const isOtherTyping = selectedChat ? typingUsers[selectedChat] : false;

  // Fetch messages when chat changes
  useEffect(() => {
    if (selectedChat) {
      dispatch(fetchMessages(selectedChat));
    }
  }, [selectedChat, dispatch]);

  // Force scroll to bottom on new messages - IMPROVED with more reliable trigger
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use immediate scrolling without animation for faster experience
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]); // Watch the entire messages array instead of just the length

  // Update mobile detection on window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Set up a message polling system to ensure messages are always up-to-date - FASTER POLLING
  useEffect(() => {
    if (!selectedChat) return;
    
    // Initial fetch immediately
    dispatch(fetchMessages(selectedChat));
    
    // Force refresh messages MUCH more frequently
    const intervalId = setInterval(() => {
      dispatch(fetchMessages(selectedChat));
      setForceRefreshCounter(prev => prev + 1);
    }, 500); // Every 500ms instead of 3000ms for much faster updates
    
    return () => clearInterval(intervalId);
  }, [selectedChat, dispatch]);

  // Enhanced handleSendMessage with FASTER refreshes
  const handleSendMessage = () => {
    if (message.trim() === "" || !selectedChat) return;

    console.log("Sending message to:", selectedChat, "Content:", message);
    
    try {
      // Store message content before clearing input
      const messageContent = message;
      
      // Clear input immediately for better UX
      setMessage("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      
      // Add a temporary message to show sending status
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        content: messageContent,
        senderId: "me", // This will be replaced by the actual ID
        timestamp: new Date().toISOString(),
        isTemp: true
      };
      
      // Dispatch message to Redux
      dispatch(
        sendMessageViaSocket({
          receiverId: selectedChat,
          content: messageContent,
        })
      )
      .then((result) => {
        console.log("Message sent successfully, result:", result);
        
        // Force immediate scroll to bottom right away
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        }
        
        // Force refresh to get latest messages
        dispatch(fetchMessages(selectedChat));
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        
        // Show error message to user
        alert("Failed to send message. Please try again.");
        
        // Re-add the message to the input field so the user doesn't lose it
        setMessage(messageContent);
      });
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      alert("An error occurred while sending your message. Please try again.");
    }
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  // Handle typing detection
  const handleTyping = () => {
    if (!selectedChat) return;

    if (!isTyping) {
      setIsTyping(true);
      sendTypingStatus({ receiverId: selectedChat, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingStatus({ receiverId: selectedChat, isTyping: false });
    }, 2000);
  };

  // Add debug output for messages
  useEffect(() => {
    if (messages && messages.length > 0) {
      console.log(`Showing ${messages.length} messages for chat ${selectedChat}:`, 
        messages.map(m => ({
          id: m._id,
          content: m.content?.substring(0, 20) + "...", 
          isTemp: m.isTemp
        }))
      );
    }
  }, [messages, selectedChat]);

  // Debug network issues
  useEffect(() => {
    const checkConnection = () => {
      const socketConnected = getSocket()?.connected || false;
      console.log("Socket connection status:", socketConnected ? "Connected" : "Disconnected");
      
      if (!socketConnected) {
        const userId = localStorage.getItem("userId");
        const username = localStorage.getItem("username");
        if (userId && username) {
          console.log("Attempting to reconnect socket...");
        }
      }
    };
    
    checkConnection();
    const intervalId = setInterval(checkConnection, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Add a message status display component
  // This will show "sending", "delivered", "failed" etc.
  const MessageStatus = ({ message }) => {
    // Default to showing nothing
    if (!message.isTemp && !message.hasOwnProperty('isDelivered')) {
      return null;
    }
    
    // If message is temporary (being sent)
    if (message.isTemp) {
      return (
        <span className="text-xs mr-2 italic" style={styles.text.secondary}>
          Sending...
        </span>
      );
    }
    
    // If message delivery failed
    if (message.hasOwnProperty('isDelivered') && message.isDelivered === false) {
      return (
        <span className="text-xs mr-2 italic" style={{ color: "red" }}>
          Failed
        </span>
      );
    }
    
    // If message was delivered
    if (message.isDelivered) {
      return (
        <span className="text-xs mr-2 italic" style={styles.text.secondary}>
          Delivered
        </span>
      );
    }
    
    return null;
  };

  // Helper function to safely format timestamps
  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    
    try {
      // Try to create a Date object, handling various input formats
      let date;
      
      if (typeof timestamp === 'string') {
        if (timestamp === 'Invalid Date') return 'N/A';
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        return 'N/A';
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) return 'N/A';
      
      // Format the time
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (err) {
      console.error("Error formatting time:", err);
      return "N/A";
    }
  };

  return (
    <div className="flex flex-col h-full w-full" style={styles.container}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${colors.scrollbarTrack};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${colors.scrollbarThumb};
          border-radius: 10px;
          border: 3px solid ${colors.scrollbarTrack};
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${colors.scrollbarThumbHover};
        }
        .custom-scrollbar::-webkit-scrollbar-button {
          display: none;
        }
      `}</style>
      
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b" 
        style={{ borderColor: colors.borderColor }}
      >
        {/* Left side - Toggle sidebar on mobile */}
        <button
          onClick={toggleSidebar}
          style={getButtonStyle()}
          className="w-10 h-10 flex items-center justify-center rounded-lg md:hidden"
        >
          {sidebarVisible ? (
            <X size={18} style={{ color: colors.accentPrimary }} />
          ) : (
            <List size={18} style={{ color: colors.accentPrimary }} />
          )}
        </button>

        {/* Center - User info (clickable) */}
        {currentChat && (
          <div 
            className="flex items-center flex-1 px-3 cursor-pointer"
            onClick={onHeaderClick}
          >
            <div 
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden mr-3"
              style={getButtonStyle()}
            >
              {currentChat.imgSrc ? (
                <img
                  src={currentChat.imgSrc}
                  alt={currentChat.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span 
                  className="text-lg font-semibold" 
                  style={{ color: colors.accentPrimary }}
                >
                  {currentChat.name?.charAt(0) || "?"}
                </span>
              )}
            </div>
            <div>
              <h3 style={styles.text.primary} className="font-medium text-sm">
                {currentChat.name}
              </h3>
              <span style={styles.text.secondary} className="text-xs">
                {currentChat.isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        )}
        
        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            className="p-3 rounded-full transition-all duration-200 hover:scale-105"
            style={getButtonStyle()}
            aria-label="Voice call"
          >
            <Phone size={22} style={{ color: colors.accentPrimary }} />
          </button>
          <button
            className="p-3 rounded-full transition-all duration-200 hover:scale-105"
            style={getButtonStyle()}
            aria-label="Video call"
          >
            <VideoCamera size={22} style={{ color: colors.accentPrimary }} />
          </button>
          <button
            className="p-3 rounded-full transition-all duration-200 hover:scale-105"
            style={getButtonStyle()}
            aria-label="More options"
          >
            <DotsThree
              size={22}
              weight="bold"
              style={{ color: colors.textSecondary }}
            />
          </button>
          <button
            className="p-3 rounded-full transition-all duration-200 hover:scale-105"
            style={getButtonStyle()}
            aria-label="Refresh messages"
            onClick={() => {
              console.log("Manual refresh triggered");
              if (selectedChat) {
                dispatch(fetchMessages(selectedChat));
                setForceRefreshCounter(prev => prev + 1);
              }
            }}
          >
            <ArrowClockwise size={22} style={{ color: colors.accentPrimary }} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar"
        style={{
          background: colors.backgroundAlt,
          boxShadow: styles.insetShadow
        }}
      >
        {messages.length > 0 ? (
          <>
            {messages.map((msg) => {
              const isSentByMe = msg.senderId !== selectedChat;
              const isTemp = msg.isTemp === true;
              
              return (
                <div
                  key={msg._id || msg.id || `msg-${Date.now()}-${Math.random()}`}
                  className={`flex ${
                    isSentByMe
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl p-4 ${
                      isSentByMe
                        ? "rounded-tr-none"
                        : "rounded-tl-none"
                    } ${isTemp ? "opacity-70" : "opacity-100"} transition-opacity duration-300`}
                    style={{
                      background: isSentByMe ? colors.myMessageBg : colors.theirMessageBg,
                      boxShadow: colors.messageShadow,
                    }}
                  >
                    <p className="leading-relaxed break-words" style={styles.text.primary}>{msg.content || msg.text}</p>
                    <div className="flex items-center justify-end mt-2">
                      {isSentByMe && <MessageStatus message={msg} />}
                      <p 
                        className="text-xs"
                        style={styles.text.secondary}
                      >
                        {formatTime(msg.timestamp || msg.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {isOtherTyping && (
              <div className="text-sm italic" style={styles.text.secondary}>
                {currentChat?.name} is typing...
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p style={styles.text.secondary}>
              No messages yet. Start the conversation!
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="px-6 py-4 border-t"
        style={{ borderColor: colors.borderColor }}
      >
        <div className="flex items-center bg-transparent">
          <div className="flex space-x-2 mr-3">
            <button
              className="p-3 rounded-full transition-all duration-200 hover:scale-105"
              style={getButtonStyle()}
              aria-label="Add attachment"
            >
              <Paperclip size={20} style={{ color: colors.textSecondary }} />
            </button>
            <button
              className="p-3 rounded-full transition-all duration-200 hover:scale-105"
              style={getButtonStyle()}
              aria-label="Add image"
            >
              <Image size={20} style={{ color: colors.textSecondary }} />
            </button>
            <button
              className="p-3 rounded-full transition-all duration-200 hover:scale-105"
              style={getButtonStyle()}
              aria-label="Add emoji"
            >
              <Smiley size={20} style={{ color: colors.textSecondary }} />
            </button>
          </div>
          <div className="relative flex-grow">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="w-full py-4 px-5 pr-14 rounded-2xl resize-none outline-none transition-all duration-200 min-h-12 max-h-32"
              style={styles.input}
              rows={1}
            />
            {message.trim() && (
              <button
                onClick={handleSendMessage}
                className="absolute right-3 top-[45%] transform -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-105"
                style={getButtonStyle()}
                aria-label="Send message"
              >
                <PaperPlaneRight size={18} style={{ color: colors.accentPrimary }} />
              </button>
            )}
          </div>
          {!message.trim() && (
            <button
              className="p-4 rounded-full transition-all duration-200 hover:scale-105 ml-3"
              style={getButtonStyle()}
              aria-label="Voice message"
            >
              <MicrophoneStage size={22} style={{ color: colors.accentPrimary }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
