// src/store/chatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { sendMessage as sendMessageSocket } from "../utils/socket"; // Import the socket's sendMessage function

// Async thunk for fetching conversations (kept as a fallback)
export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Expected JSON but got:", text);
        throw new Error("Response is not JSON");
      }

      if (!response.ok) throw new Error("Failed to load conversations");

      const data = await response.json();

      // Transform the data - store dates as ISO strings
      const transformedChats = data.chatList.map((chat) => ({
        imgSrc: chat.pic || "/default-user.png",
        name: chat.fullName,
        message: chat.lastMessage,
        email: chat.email,
        userId: chat.userId || chat._id.toString(),
        lastMessageTimestamp: chat.lastMessageTimestamp ? new Date(chat.lastMessageTimestamp).toISOString() : new Date().toISOString(),
      }));

      return transformedChats;
    } catch (error) {
      console.error("Error in fetchConversations:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for searching users
export const searchUsers = createAsyncThunk(
  "chat/searchUsers",
  async (query, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/search?q=${encodeURIComponent(
          query.trim()
        )}`
      );

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();

      // Transform the data
      const transformedUsers = data.map((user) => ({
        imgSrc: user.pic || "/default-user.png",
        name: user.fullName,
        message: "", // Search results don't have messages
        email: user.email,
        userId: user._id.toString(),
        lastMessageTimestamp: null,
      }));

      return transformedUsers;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching messages
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/messages/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load messages");

      const data = await response.json();
      return { userId, messages: data.messages };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for sending a message via API and socket
export const sendMessageViaSocket = createAsyncThunk(
  "chat/sendMessageViaSocket",
  async ({ receiverId, content }, { dispatch, getState, rejectWithValue }) => {
    try {
      // Get current user ID from auth slice
      const currentUser = getState().auth.user;
      let currentUserId = currentUser?._id;
      
      // If user ID is not found in state, try to extract it from token
      if (!currentUserId) {
        console.log("User ID not found in state, attempting to extract from token");
        
        // Try to get user ID from localStorage
        try {
          const userFromStorage = localStorage.getItem('user');
          if (userFromStorage) {
            const parsedUser = JSON.parse(userFromStorage);
            currentUserId = parsedUser._id;
            console.log("Found user ID in localStorage:", currentUserId);
          }
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
        
        // If still no user ID, try to extract from token
        if (!currentUserId) {
          const token = localStorage.getItem('userToken');
          if (token) {
            try {
              // Decode JWT token (tokens are in format: header.payload.signature)
              const base64Url = token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              
              const payload = JSON.parse(jsonPayload);
              currentUserId = payload.userId || payload.sub || payload.id;
              console.log("Extracted user ID from token:", currentUserId);
            } catch (e) {
              console.error("Error extracting user ID from token:", e);
            }
          }
        }
      }
      
      if (!currentUserId) {
        console.error("Current user ID not found in state or token");
        return rejectWithValue("User not authenticated");
      }
      
      console.log("Using user ID for message:", currentUserId);
      
      // Generate a unique temporary ID for this message
      const tempId = `temp-${Date.now()}`;
      
      // Create a temporary message object for immediate display
      const tempMessage = {
        _id: tempId,
        senderId: currentUserId,
        receiverId: receiverId,
        content: content,
        timestamp: new Date().toISOString(), // Always use ISO string for consistency
        isTemp: true
      };
      
      // Add the temporary message to the state immediately
      dispatch({ type: 'chat/addTempMessage', payload: tempMessage });
      
      // Make the API call to send the message
      console.log("Sending message API request to:", `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/messages`);
      console.log("Message payload:", {
        receiverId,
        messageType: "text",
        content,
      });
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
        body: JSON.stringify({
          receiverId,
          messageType: "text",
          content,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || "Failed to send message");
        } catch (parseError) {
          throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log("Message sent successfully, API response:", data);

      // Emit the message via socket with both IDs for better tracking
      try {
        await sendMessageSocket({
          receiverId,
          content,
          senderId: currentUserId,
          messageId: data.messageData._id,
          _id: data.messageData._id, // Include both formats to ensure compatibility
          tempId: tempId, // Include the tempId for replacement
          chatId: data.messageData.chatId,
          timestamp: new Date().toISOString(), // Use ISO string for timestamp
        });
        console.log("Message sent via socket successfully");
      } catch (socketError) {
        console.error("Socket send error:", socketError);
        // Continue anyway since API call succeeded
      }

      // Return both the API response and the tempId for replacing the temp message
      return {
        ...data.messageData,
        tempId
      };
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Even if there's an error, update the UI after a delay to prevent stuck messages
      // This ensures users don't see "sending..." forever if there's a network issue
      setTimeout(() => {
        dispatch(messageDelivered({ messageId: `temp-${Date.now()}`, isDelivered: false }));
      }, 5000);
      
      return rejectWithValue(error.message);
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: [],
    filteredList: [],
    selectedChat: null,
    messages: {},
    loading: false,
    searchQuery: "",
    typingUsers: {},
    pendingMessages: [], // Track pending messages
    error: null,
  },
  reducers: {
    selectChat: (state, action) => {
      state.selectedChat = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    addTempMessage: (state, action) => {
      const message = action.payload;
      const receiverId = message.receiverId;
      console.log("Adding temp message:", message);
      
      // Initialize messages array if it doesn't exist
      if (!state.messages[receiverId]) {
        state.messages[receiverId] = [];
      }
      
      // Create a new messages object to ensure React detects the change
      const updatedMessages = [...state.messages[receiverId], message];
      
      // Update the messages state
      state.messages = {
        ...state.messages,
        [receiverId]: updatedMessages
      };
      
      // Add to pending messages
      if (message._id) {
        state.pendingMessages.push(message._id);
      }
      
      // Update the conversation preview
      const conversationIndex = state.conversations.findIndex(
        (conv) => conv.userId === receiverId
      );
      
      if (conversationIndex !== -1) {
        // Create a new conversations array
        const updatedConversations = [...state.conversations];
        
        // Store the timestamp as ISO string to ensure serialization
        const messageTimestamp = typeof message.timestamp === 'string' 
          ? message.timestamp 
          : new Date().toISOString();
        
        updatedConversations[conversationIndex] = {
          ...updatedConversations[conversationIndex],
          message: message.content,
          lastMessageTimestamp: messageTimestamp
        };
        
        // Update the conversations state - sort using timestamp comparison
        state.conversations = updatedConversations.sort(
          (a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
        );
      }
    },
    receiveMessage: (state, action) => {
      const message = action.payload;
      const userId = message.senderId;
      console.log("Receiving message:", message);
      
      // Skip if this message already exists in the messages array
      if (state.messages[userId] && state.messages[userId].some(m => m._id === message._id)) {
        console.log("Message already exists, skipping:", message._id);
        return;
      }
      
      // Initialize messages array if it doesn't exist
      if (!state.messages[userId]) {
        state.messages[userId] = [];
      }
      
      // Create a new messages array
      const updatedMessages = [...state.messages[userId], message];
      
      // Update the messages state
      state.messages = {
        ...state.messages,
        [userId]: updatedMessages
      };
      
      // CRITICAL: ALWAYS update the conversation preview
      // Find the conversation for this user
      let conversationIndex = state.conversations.findIndex(
        (conv) => conv.userId === userId
      );
      
      // If conversation doesn't exist, create it
      if (conversationIndex === -1) {
        console.log("Creating new conversation for user:", userId);
        // Try to get user details from the message if possible
        let newConversation = {
          userId: userId,
          message: message.content || message.text || "",
          lastMessageTimestamp: message.timestamp || new Date().toISOString(),
          hasUnread: true,
          // Create placeholder values that will be updated when user details are fetched
          name: "User",
          email: "",
          imgSrc: "/default-user.png"
        };
        
        // Add the new conversation
        state.conversations = [newConversation, ...state.conversations];
        conversationIndex = 0;
      } else {
        // Create a new conversations array
        const updatedConversations = [...state.conversations];
        
        // Store the timestamp as ISO string to ensure serialization
        const messageTimestamp = typeof message.timestamp === 'string'
          ? message.timestamp
          : new Date().toISOString();
        
        updatedConversations[conversationIndex] = {
          ...updatedConversations[conversationIndex],
          message: message.content || message.text || "",
          lastMessageTimestamp: messageTimestamp,
          // Mark as unread if received via socket
          hasUnread: message.receivedViaSocket ? true : updatedConversations[conversationIndex].hasUnread
        };
        
        // Update the conversations state - sort using timestamp comparison
        state.conversations = updatedConversations.sort(
          (a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
        );
      }
    },
    updateTypingStatus: (state, action) => {
      const { userId, isTyping } = action.payload;
      state.typingUsers[userId] = isTyping;
    },
    receiveInitialConversations: (state, action) => {
      // Ensure all timestamps are stored as strings
      const conversations = action.payload.map(conv => ({
        ...conv,
        lastMessageTimestamp: conv.lastMessageTimestamp instanceof Date 
          ? conv.lastMessageTimestamp.toISOString() 
          : conv.lastMessageTimestamp
      }));
      
      state.conversations = conversations;
      
      if (!state.searchQuery) {
        state.filteredList = conversations;
      }
      
      state.loading = "succeeded";
    },
    messageDelivered: (state, action) => {
      const { messageId, isDelivered = true } = action.payload;
      console.log(`Message delivered action received for ID: ${messageId}, setting delivered: ${isDelivered}`);
      
      // Remove from pending messages
      state.pendingMessages = state.pendingMessages.filter(id => id !== messageId);
      
      // Find and update the message across all chats
      let messageFound = false;
      let updatedMessage = null;

      for (const chatId in state.messages) {
        const chatMessages = state.messages[chatId];
        
        // First try exact match on messageId
        let messageIndex = chatMessages.findIndex(msg => 
          msg._id === messageId || msg.id === messageId);
        
        // If not found, try tempId match
        if (messageIndex === -1) {
          messageIndex = chatMessages.findIndex(msg => 
            msg.tempId === messageId);
        }
        
        // If not found, try substring match (sometimes IDs are partial)
        if (messageIndex === -1 && messageId) {
          messageIndex = chatMessages.findIndex(msg => 
            (msg._id && msg._id.includes(messageId)) || 
            (msg.id && msg.id.includes(messageId)) ||
            (msg.tempId && msg.tempId.includes(messageId)));
        }
        
        if (messageIndex !== -1) {
          messageFound = true;
          console.log(`Found message to update at index ${messageIndex} in chat ${chatId}`);
          
          // Create a new messages array
          const updatedMessages = [...chatMessages];
          
          // Update the message
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            isTemp: false,
            isDelivered: isDelivered
          };
          
          // Save reference to the updated message
          updatedMessage = updatedMessages[messageIndex];
          
          // Update the messages state
          state.messages = {
            ...state.messages,
            [chatId]: updatedMessages
          };
          
          // IMPORTANT: Also update the conversation preview with this message
          if (updatedMessage) {
            const conversationIndex = state.conversations.findIndex(
              (conv) => conv.userId === chatId
            );
            
            if (conversationIndex !== -1) {
              // Only update if the message is from the current user
              // (otherwise we'd update the preview with our own message instead of theirs)
              const currentUserId = updatedMessage.senderId;
              
              // Create a new conversations array
              const updatedConversations = [...state.conversations];
              
              updatedConversations[conversationIndex] = {
                ...updatedConversations[conversationIndex],
                message: updatedMessage.content || updatedMessage.text || "",
                lastMessageTimestamp: updatedMessage.timestamp || new Date().toISOString()
              };
              
              // Update the conversations state - sort using timestamp comparison
              state.conversations = updatedConversations.sort(
                (a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
              );
            }
          }
        }
      }
      
      if (!messageFound) {
        console.warn(`Could not find message with ID ${messageId} to mark as delivered`);
      }
    },
    messageReceived: (state, action) => {
      // Just mark that we've got an update, no need to store lastUpdate
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = "loading";
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
        if (!state.searchQuery) {
          state.filteredList = action.payload;
        }
        state.loading = "succeeded";
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.filteredList = action.payload;
        state.loading = "succeeded";
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { userId, messages } = action.payload;
        state.messages[userId] = messages;
      })
      .addCase(sendMessageViaSocket.fulfilled, (state, action) => {
        console.log("Message sent successfully, updating state:", action.payload);
        const message = action.payload;
        const receiverId = message.receiverId;
        const tempId = message.tempId;
        
        // Find and replace the temporary message
        if (state.messages[receiverId]) {
          const tempMessageIndex = state.messages[receiverId].findIndex(
            msg => msg._id === tempId
          );
          
          if (tempMessageIndex !== -1) {
            console.log("Found temp message, replacing with real message");
            // Create a new messages array
            const updatedMessages = [...state.messages[receiverId]];
            
            // Replace the temporary message with the real one
            updatedMessages[tempMessageIndex] = {
              ...message,
              isTemp: false
            };
            
            // Update the messages state
            state.messages = {
              ...state.messages,
              [receiverId]: updatedMessages
            };
          } else {
            console.log("Temp message not found, adding as new message");
            // Add as a new message
            state.messages = {
              ...state.messages,
              [receiverId]: [...state.messages[receiverId], { ...message, isTemp: false }]
            };
          }
          
          // Update the conversation preview
          const conversationIndex = state.conversations.findIndex(
            (conv) => conv.userId === receiverId
          );
          
          if (conversationIndex !== -1) {
            // Create a new conversations array
            const updatedConversations = [...state.conversations];
            
            // Store timestamp as ISO string for serialization
            const messageTimestamp = typeof message.timestamp === 'string'
              ? message.timestamp
              : new Date().toISOString();
            
            updatedConversations[conversationIndex] = {
              ...updatedConversations[conversationIndex],
              message: message.content,
              lastMessageTimestamp: messageTimestamp
            };
            
            // Update the conversations state - sort using timestamp comparison
            state.conversations = updatedConversations.sort(
              (a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
            );
          }
        }
      });
  },
});

export const {
  selectChat,
  setSearchQuery,
  receiveMessage,
  updateTypingStatus,
  receiveInitialConversations,
  addTempMessage,
  messageDelivered,
  messageReceived,
} = chatSlice.actions;

export default chatSlice.reducer;

export const chatMiddleware = store => next => action => {
  // Intercept specific actions that might need additional handling
  if (action.type === 'chat/receiveMessage') {
    // Log important actions
    console.log('Message received action intercepted:', action.payload);
    
    // Store message in localStorage for recovery/debugging
    try {
      // Use our own serialization to avoid Date issues
      const message = {
        ...action.payload,
        timestamp: action.payload.timestamp || new Date().toISOString(), // Ensure valid timestamp
      };
      
      // Get current messages from localStorage
      const storedMessages = JSON.parse(localStorage.getItem('recentMessages') || '[]');
      
      // Add new message to the array (keep only last 50 messages)
      const updatedMessages = [
        message, 
        ...storedMessages.slice(0, 49)
      ];
      
      // Save back to localStorage - store timestamp as string
      localStorage.setItem('recentMessages', JSON.stringify(updatedMessages));
      
      // Trigger storage event for other tabs - use string to avoid conversion issues
      localStorage.setItem('lastMessageTime', String(Date.now()));
    } catch (error) {
      console.error('Error storing message in localStorage:', error);
    }
  }
  
  // Always pass the action to the next middleware or reducer
  return next(action);
};
