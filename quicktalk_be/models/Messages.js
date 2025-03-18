const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Assuming you have a User model
  receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Assuming you have a User model
  messageType: {
    type: String,
    required: true,
    enum: ["text", "audio", "image", "file"],
  }, // Restrict to these types
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema); // 'Message' is the name of your collection in MongoDB

module.exports = Message;
