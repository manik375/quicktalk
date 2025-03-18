const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http"); // Added for Socket.IO
const socketIO = require("socket.io"); // Added for Socket.IO
const connectDB = require("./configs/db");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const searchRouter = require("./routes/Search");
const path = require("path");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketIO(server, {
  cors: {
    origin: "*", // Allow connections from any origin (adjust for production)
    methods: ["GET", "POST"],
  },
}); // Initialize Socket.IO

// Middleware
app.use(cors()); // Allow frontend to make requests
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", messageRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/search", searchRouter);

// Basic route for testing
app.get("/", (req, res) => {
  res.send("Chat App Backend Running");
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  // Authenticate user (you'll need to implement this based on your auth system)
  socket.on("authenticate", (userData) => {
    // Store user data in socket object
    socket.userId = userData.userId;
    socket.username = userData.username;
    console.log(`User authenticated: ${userData.username}`);

    // You could join the user to their specific rooms here
    // For example, joining to their own user ID room for private messages
    socket.join(userData.userId);
  });

  // Handle new message
  socket.on("send_message", async (messageData) => {
    try {
      // You can use your existing message model to save to MongoDB
      // Example: const Message = require('./models/Message');
      // const newMessage = new Message({...messageData});
      // await newMessage.save();

      // Broadcast to appropriate recipients
      if (messageData.chatId) {
        // If it's a group chat or specific conversation
        io.to(messageData.chatId).emit("receive_message", {
          ...messageData,
          senderId: socket.userId,
          senderName: socket.username,
          timestamp: new Date(),
        });
      } else if (messageData.receiverId) {
        // If it's a private message
        // Send to receiver's room and sender's room
        io.to(messageData.receiverId)
          .to(socket.userId)
          .emit("receive_message", {
            ...messageData,
            senderId: socket.userId,
            senderName: socket.username,
            timestamp: new Date(),
          });
      }
    } catch (error) {
      console.error("Error handling message:", error);
      socket.emit("error", "Failed to process message");
    }
  });

  // Join a chat room
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.userId} joined chat: ${chatId}`);
  });

  // Leave a chat room
  socket.on("leave_chat", (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.userId} left chat: ${chatId}`);
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    if (data.chatId) {
      socket.to(data.chatId).emit("user_typing", {
        userId: socket.userId,
        username: socket.username,
        isTyping: data.isTyping,
      });
    } else if (data.receiverId) {
      socket.to(data.receiverId).emit("user_typing", {
        userId: socket.userId,
        username: socket.username,
        isTyping: data.isTyping,
      });
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server with Socket.IO
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Socket.IO`);
});
