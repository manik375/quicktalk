const express = require("express");
const router = express.Router();
const Message = require("../models/Messages");
const isAuthenticated = require("../middlewares/isAuthenticated");
const { body, validationResult } = require("express-validator");
const sanitizeHtml = require("sanitize-html");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");

// ----------------- RATE LIMITING -----------------
const messageRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message:
    "Too many messages sent from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// ----------------- MESSAGE SENDING ROUTE -----------------
router.post(
  "/messages",
  isAuthenticated,
  messageRateLimiter,
  [
    body("receiverId")
      .notEmpty()
      .isString()
      .trim()
      .escape()
      .withMessage("Receiver ID is required and must be a string."),
    body("messageType")
      .isIn(["text", "audio", "image", "file"])
      .withMessage("Invalid messageType."),
    body("content")
      .notEmpty()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Message content must be between 1 and 2000 characters.")
      .escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { receiverId, messageType, content } = req.body;
      const senderId = req.user._id;

      // Validate receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }

      // Content sanitization
      let sanitizedContent = sanitizeHtml(content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
        allowedAttributes: {
          "*": ["class", "id", "style"],
          img: ["src", "alt"],
        },
        allowedSchemes: ["http", "https", "data"],
      });

      const newMessage = new Message({
        senderId,
        receiverId,
        messageType,
        content: sanitizedContent,
        timestamp: new Date(),
      });

      await newMessage.save();

      res.status(201).json({
        message: "Message sent successfully!",
        messageData: newMessage,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res
        .status(500)
        .json({ message: "Failed to send message", error: error.message });
    }
  }
);

// ----------------- GET CHAT LIST ROUTE -----------------
router.get("/chats", isAuthenticated, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    })
      .sort({ timestamp: -1 })
      .populate("senderId", "fullName email") // Include both fields
      .populate("receiverId", "fullName email"); // Include both fields

    if (!messages || messages.length === 0) {
      return res
        .status(404)
        .json({ message: "No messages found for this user." });
    }

    // Add a debug log to see what's being populated
    console.log(
      "First message populated:",
      messages.length > 0
        ? {
            sender: messages[0].senderId,
            receiver: messages[0].receiverId,
          }
        : "No messages"
    );

    const chatUsers = new Map();
    const uniqueChatUserIds = new Set();

    for (const message of messages) {
      let chatPartnerId, chatPartnerFullName, chatPartnerEmail;

      if (message.senderId._id.equals(loggedInUserId)) {
        chatPartnerId = message.receiverId._id;
        chatPartnerFullName = message.receiverId.fullName;
        chatPartnerEmail = message.receiverId.email;
      } else {
        chatPartnerId = message.senderId._id;
        chatPartnerFullName = message.senderId.fullName;
        chatPartnerEmail = message.senderId.email;
      }

      const partnerIdString = chatPartnerId.toString();

      if (!uniqueChatUserIds.has(partnerIdString)) {
        uniqueChatUserIds.add(partnerIdString);
        chatUsers.set(partnerIdString, {
          userId: partnerIdString,
          fullName: chatPartnerFullName,
          email: chatPartnerEmail,
          lastMessage: message.content,
          lastMessageTimestamp: message.timestamp,
        });
      } else {
        const existing = chatUsers.get(partnerIdString);
        if (message.timestamp > existing.lastMessageTimestamp) {
          existing.lastMessage = message.content;
          existing.lastMessageTimestamp = message.timestamp;
        }
      }
    }

    const chatList = Array.from(chatUsers.values()).sort(
      (a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp
    );

    res.status(200).json({ chatList });
  } catch (error) {
    console.error("Error fetching chat list:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch chat list", error: error.message });
  }
});

// GET endpoint to retrieve messages between current user and another user
router.get("/messages/:userId", isAuthenticated, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    // Optional pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Find messages where current user is either sender or receiver
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    })
      .sort({ timestamp: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .lean(); // For better performance

    res.status(200).json({
      messages: messages.reverse(), // Reverse to show oldest first in client
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch messages", error: error.message });
  }
});
module.exports = router;
