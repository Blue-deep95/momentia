// This model is specifically for room logic that is when users want
// to chat with other people uses a members array and records their last
// seen message which is auto incrementing
const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
    // A room type to simplfy if it's a group or dm with other users
    {
    roomType: {
      type: String,
      enum: ["dm", "group"],
      default: "dm",
    },

    members: [
      {
        memberId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        lastSeenMessage: {
          type: Number,
          default: 0,
        },
      },
    ],

    // If the type is dm then room name should change dynamically
    // in the frontend it should be whatever the id the user is not present in
    roomName: String,
    roomDescription: String,

    totalMembers: { type: Number, default: 0 },
    // an auto-incrementing count that tells us how many messages ahead the
    // current chat is at
    currentMessageCount: { type: Number, default: 0 },

    // a last message field that helps us to show the latest message in the
    // chat witout joins
    lastMessage: {
      content: String,
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);
// index only members
roomSchema.index({ "members.memberId": 1 });

module.exports = mongoose.model("room", roomSchema);
