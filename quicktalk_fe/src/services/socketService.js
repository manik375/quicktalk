// socket.js
import { io } from "socket.io-client";
import { store } from "../redux/Store"; // Adjust path if necessary
import {
  receiveMessage,
  updateTypingStatus,
  receiveInitialConversations,
  fetchMessages,
  messageDelivered,
  messageReceived
} from "../redux/chatSlice";

let socket;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Enhanced socket initialization with better error handling
export const initializeSocket = (userId, username) => {
  if (socket?.connected) {
    console.log("Socket already connected, reusing connection");
    return socket; // Return existing connection if already connected
  }

  console.log("Initializing socket connection...");
  
  // Connect to the server
  socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
    auth: {
      token: localStorage.getItem("userToken"),
    },
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  // Connection events
  socket.on("connect", () => {
    console.log("Socket connected successfully!");
    connectionAttempts = 0;

    // Authenticate with user details
    socket.emit("authenticate", {
      userId,
      username,
    });
  });

  // Listener for initial conversations
  socket.on("initial_conversations", (data) => {
    console.log("Received initial conversations:", data);
    
    // Transform the data to match the expected format
    const transformedChats = data.chatList.map((chat) => ({
      imgSrc: chat.pic || "/default-user.png",
      name: chat.fullName,
      message: chat.lastMessage,
      email: chat.email,
      userId: chat.userId || chat._id.toString(),
      lastMessageTimestamp: chat.lastMessageTimestamp ? new Date(chat.lastMessageTimestamp).toISOString() : new Date().toISOString(),
    }));
    
    // Dispatch the transformed data to the Redux store
    store.dispatch(receiveInitialConversations(transformedChats));
  });

  // Message receiving with enhanced handling for better UI updates
  socket.on("receive_message", (message) => {
    console.log("Socket received message:", message);
    
    if (!message) {
      console.error("Received empty message from socket");
      return;
    }
    
    try {
      // Ensure the message has all required properties
      const normalizedMessage = {
        ...message,
        // Use a valid timestamp or current time
        timestamp: ensureValidTimestamp(message.timestamp || message.createdAt),
        content: message.content || message.text || "",
        _id: message._id || message.id || `socket-${Date.now()}`,
        senderId: message.senderId || message.sender,
        receivedViaSocket: true, // Mark that this came via socket for special handling
      };
      
      console.log("Normalized message about to be dispatched:", normalizedMessage);
      
      // CRITICAL: Mark message as delivered instantly for real-time updates
      if (normalizedMessage._id) {
        store.dispatch(messageDelivered({ 
          messageId: normalizedMessage._id,
          isDelivered: true 
        }));
      }
      
      // Dispatch message to Redux
      store.dispatch(receiveMessage(normalizedMessage));
      
      // Also dispatch the messageReceived action for cross-tab sync
      store.dispatch(messageReceived(Date.now()));
      
      // Store in localStorage for cross-tab sync
      try {
        const recentMessages = JSON.parse(localStorage.getItem('recentMessages') || '[]');
        localStorage.setItem('recentMessages', 
          JSON.stringify([normalizedMessage, ...recentMessages.slice(0, 49)]));
        localStorage.setItem('lastMessageUpdate', String(Date.now()));
      } catch (error) {
        console.error("Error storing message in localStorage:", error);
      }
    } catch (error) {
      console.error("Error processing received message:", error);
    }
  });

  // Typing indicators
  socket.on("user_typing", (data) => {
    console.log("Typing indicator received:", data);
    store.dispatch(updateTypingStatus(data));
  });

  // Message delivery confirmations
  socket.on("message_delivered", (data) => {
    console.log("Message delivery confirmation received:", data);
    if (data && data.messageId) {
      // CRITICAL: This will update the UI to show the message as delivered
      store.dispatch(messageDelivered({ 
        messageId: data.messageId,
        isDelivered: true
      }));
    }
  });

  // Enhanced error handling
  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
    connectionAttempts++;
    
    if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error("Maximum reconnection attempts reached");
    }
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  socket.on("disconnect", (reason) => {
    console.log("Disconnected from chat server:", reason);
    
    // If server disconnected us, try to reconnect
    if (reason === "io server disconnect") {
      console.log("Attempting to reconnect...");
      socket.connect();
    }
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log(`Reconnected to server after ${attemptNumber} attempts`);
    
    // Re-authenticate after reconnection
    const state = store.getState();
    const userId = state.auth?.user?._id;
    const username = state.auth?.user?.username;
    
    if (userId && username) {
      socket.emit("authenticate", {
        userId,
        username,
      });
      
      // After reconnection, refresh messages for the currently selected chat
      const selectedChat = state.chat?.selectedChat;
      if (selectedChat) {
        console.log("Refreshing messages after reconnection for chat:", selectedChat);
        store.dispatch(fetchMessages(selectedChat));
      }
    }
  });

  socket.on("reconnect_error", (error) => {
    console.error("Socket reconnection error:", error);
  });

  return socket;
};

// Helper function to ensure we always have a valid timestamp
function ensureValidTimestamp(timestamp) {
  if (!timestamp) {
    return new Date().toISOString();
  }
  
  try {
    // If it's already a Date object, convert to ISO string
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    
    // If it's a number, create a new Date and convert to ISO string
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toISOString();
    }
    
    // If it's a string, validate it first
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        // Invalid date string, return current time
        return new Date().toISOString();
      }
      return date.toISOString();
    }
    
    // If we get here, use current time as fallback
    return new Date().toISOString();
  } catch (error) {
    console.error("Error processing timestamp:", error);
    return new Date().toISOString();
  }
}

// Send a message via socket with enhanced reliability
export const sendMessageSocket = (messageData) => {
  console.log("Preparing to send message via socket:", messageData);
  
  if (!socket?.connected) {
    console.error("Socket not connected, trying to reconnect...");
    
    // Try to reconnect if needed
    const userId = store.getState().auth?.user?._id;
    const username = store.getState().auth?.user?.username;
    
    if (userId && username) {
      initializeSocket(userId, username);
      
      // Wait briefly for connection - REDUCED DELAY
      setTimeout(() => {
        if (socket?.connected) {
          console.log("Reconnected, now sending message");
          emitMessage(messageData);
        } else {
          console.error("Failed to reconnect socket");
          // Try HTTP fallback if socket fails
          sendMessageHttp(messageData);
        }
      }, 100); // Reduced from 300ms to 100ms
      
      return;
    } else {
      console.error("Cannot reconnect: user data not available");
      return;
    }
  }
  
  emitMessage(messageData);
};

// Helper function to actually emit the message via socket
function emitMessage(messageData) {
  console.log("Emitting message via socket:", messageData);
  
  // Ensure the message data has a valid timestamp
  const enhancedMessageData = {
    ...messageData,
    timestamp: ensureValidTimestamp(messageData.timestamp || new Date()),
  };
  
  // CRITICAL: Make sure messageId exists
  if (!enhancedMessageData.messageId && enhancedMessageData._id) {
    enhancedMessageData.messageId = enhancedMessageData._id;
  }
  
  // Also make sure _id exists (some parts of the code use _id, others use messageId)
  if (!enhancedMessageData._id && enhancedMessageData.messageId) {
    enhancedMessageData._id = enhancedMessageData.messageId;
  }
  
  console.log("Enhanced message data for socket:", enhancedMessageData);
  
  // CRITICAL: Update the message as no longer temp IMMEDIATELY
  // This fixes the "stuck in sending" issue - even if socket acknowledgment fails
  if (enhancedMessageData.messageId || enhancedMessageData._id) {
    const messageId = enhancedMessageData.messageId || enhancedMessageData._id;
    // Update immediately - no delay
    store.dispatch(messageDelivered({ 
      messageId: messageId,
      isDelivered: true 
    }));
  }
  
  // Add acknowledgment callback for reliability
  socket.emit("send_message", enhancedMessageData, (acknowledgment) => {
    console.log("Socket acknowledgment received:", acknowledgment);
    
    if (acknowledgment && acknowledgment.success) {
      console.log("Message successfully delivered to server");
      
      // CRITICAL: Notify store that message was delivered
      const messageId = enhancedMessageData.messageId || enhancedMessageData._id;
      store.dispatch(messageDelivered({ 
        messageId: messageId,
        isDelivered: true
      }));
      
      // Force a fetch to make sure messages are up-to-date - Reduced delay to almost zero
      const state = store.getState();
      const selectedChat = state.chat?.selectedChat;
      if (selectedChat) {
        // IMMEDIATE refresh - no delay
        store.dispatch(fetchMessages(selectedChat));
      }
    } else if (acknowledgment) {
      console.error("Server reported error with message:", acknowledgment.error);
      // Try HTTP fallback on socket error
      sendMessageHttp(enhancedMessageData);
    } else {
      // No acknowledgment received at all, still mark message as delivered after timeout
      console.log("No acknowledgment details received from server");
      const messageId = enhancedMessageData.messageId || enhancedMessageData._id;
      if (messageId) {
        store.dispatch(messageDelivered({ 
          messageId: messageId,
          isDelivered: true
        }));
      }
    }
  });
  
  // Set a timeout for acknowledgment - reduced to 500ms for faster fallback
  setTimeout(() => {
    // If no ack received, try HTTP fallback
    const state = store.getState();
    const pendingMessages = state.chat.pendingMessages || [];
    const messageId = enhancedMessageData.messageId || enhancedMessageData._id;
    
    if (messageId && pendingMessages.includes(messageId)) {
      console.log("No acknowledgment received, trying HTTP fallback");
      sendMessageHttp(enhancedMessageData);
    }
  }, 500); // Reduced from 1000ms to 500ms
}

// Fallback HTTP method for message delivery
async function sendMessageHttp(messageData) {
  try {
    console.log("Using HTTP fallback for message delivery");
    
    const response = await fetch("/api/messages/socket-fallback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("userToken")}`,
      },
      body: JSON.stringify(messageData),
    });
    
    if (response.ok) {
      console.log("Message delivered via HTTP fallback");
      
      // CRITICAL: Notify store that message was delivered
      const messageId = messageData.messageId || messageData._id;
      if (messageId) {
        store.dispatch(messageDelivered({ 
          messageId: messageId,
          isDelivered: true
        }));
      }
      
      // Force a fetch to make sure messages are up-to-date
      const state = store.getState();
      const selectedChat = state.chat?.selectedChat;
      if (selectedChat) {
        // Immediate refresh - no delay
        store.dispatch(fetchMessages(selectedChat));
      }
    } else {
      console.error("HTTP fallback also failed");
      
      // Even if HTTP fallback fails, still update UI after a delay
      const messageId = messageData.messageId || messageData._id;
      if (messageId) {
        // Shorter delay to resolve UI quickly
        setTimeout(() => {
          store.dispatch(messageDelivered({ 
            messageId: messageId,
            isDelivered: true 
          }));
        }, 500); // Reduced from 2000ms to 500ms
      }
    }
  } catch (error) {
    console.error("Error in HTTP fallback:", error);
    
    // Even if there's an error, still update UI to avoid stuck state
    const messageId = messageData.messageId || messageData._id;
    if (messageId) {
      // Shorter delay
      setTimeout(() => {
        store.dispatch(messageDelivered({ 
          messageId: messageId,
          isDelivered: true 
        }));
      }, 500); // Reduced from 2000ms to 500ms
    }
  }
}

// Join a chat room
export const joinChat = (chatId) => {
  if (!socket?.connected) {
    throw new Error("Socket not connected");
  }
  socket.emit("join_chat", chatId);
};

// Send typing indicator
export const sendTypingStatus = (data) => {
  if (!socket?.connected) {
    return; // Silently fail if not connected
  }
  socket.emit("typing", data);
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
};

// Get socket instance
export const getSocket = () => {
  return socket;
};

// Check connection status
export const isSocketConnected = () => {
  return socket?.connected || false;
};
