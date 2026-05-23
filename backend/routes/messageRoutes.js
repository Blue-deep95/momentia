// This is mainly for managing message services
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Room = require("../models/Room");
const Message = require('../models/Message')
const {messageBus} = require('../events/event');
const { findByIdAndDelete } = require("../models/User");


// If the user wants to start a new dm/group with someone
router.post("/create-room", async (req, res) => {
  try {
    const creatorId = req.user._id;
    const { participants, roomName, roomDescription } = req.body;

    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length === 0
    ) {
      return res.status(400).json({ message: "Participants are required" });
    }

    // Add creator to members list and ensure uniqueness
    const allMemberIds = [...new Set([creatorId.toString(), ...participants])];
    const totalMembers = allMemberIds.length;

    // Logic for DM (2 people)
    if (totalMembers === 2) {
      const otherMemberId = allMemberIds.find(
        (id) => id !== creatorId.toString(),
      );

      // Check if a DM already exists between these two users
      const existingRoom = await Room.findOne({
        roomType: "dm",
        totalMembers: 2,
        members: {
          $all: [
            { $elemMatch: { memberId: creatorId } },
            { $elemMatch: { memberId: otherMemberId } },
          ],
        },
      });

      if (existingRoom) {
        return res
          .status(200)
          .json({ room: existingRoom, message: "Existing room found" });
      }
    }

    // Logic for Group (3+ people)
    let roomType = "dm";
    if (totalMembers >= 3) {
      if (!roomName) {
        return res
          .status(400)
          .json({ message: "Room name is required for group chats" });
      }
      roomType = "group";
    }

    const members = allMemberIds.map((id) => ({
      memberId: id,
      lastSeenMessage: 0,
    }));

    const newRoom = new Room({
      roomType,
      members,
      totalMembers,
      roomName: roomType === "group" ? roomName : undefined,
      roomDescription: roomType === "group" ? roomDescription : undefined,
      lastMessageAt: Date.now(),
    });

    await newRoom.save();
    return res
      .status(201)
      .json({ room: newRoom, message: "Room created successfully" });
  } catch (err) {
    console.error("Error creating room:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// This route if for getting a user all his rooms
// He sees this in the main dm page when he opens it first
router.get("/get-rooms", async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch rooms, populate member data, and sort by activity
    const userRooms = await Room.find({ "members.memberId": userId })
      .populate({
        path: "members.memberId",
        select: "username profilePicture name",
      })
      .sort({ lastMessageAt: -1 });

    // Format results to provide DM user info and unread counts
    const formattedRooms = userRooms.map((room) => {
      const roomObj = room.toObject();

      if (roomObj.roomType === "dm") {
        // Find the other user in the DM
        const otherMember = roomObj.members.find(
          (m) => m.memberId._id.toString() !== userId.toString(),
        );
        roomObj.dmUserInfo = otherMember ? otherMember.memberId : null;
      }

      // Calculate unread count for the current user
      const myMemberData = roomObj.members.find(
        (m) => m.memberId._id.toString() === userId.toString(),
      );
      roomObj.unreadCount =
        roomObj.currentMessageCount - (myMemberData?.lastSeenMessage || 0);

      return roomObj;
    });

    return res.status(200).json({
      userRooms: formattedRooms,
      message: "User rooms retrieved successfully",
    });
  } catch (err) {
    console.log("Error in get-rooms route", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// this route is mainly for leaving rooms by the user if he is part of the group
router.put("/leave-room", async (req, res) => {
  try {
    const user = req.user;
    const { roomId } = req.body;

    // first search if user belongs in the room or not
    const room = await Room.findOne({ _id: roomId, "members.memberId": user._id.toString() });
    if (!room) {
      return res.status(400).json({ message: "No such group or user found!" });
    }

    // if roomType is dm do not let the user leave room 
    if (room.roomType === "dm") {
      return res.status(400).json({ message: "You can't leave a dm" });
    }

    // remove the user from the room using mongodb atomic updates
    const newRoom = await Room.findOneAndUpdate(
      { _id: roomId, "members.memberId": user._id },
      {
        $inc: { totalMembers: -1 },
        $pull: {
          members: { memberId: user._id }
        }
      },
      { returnDocument: "after" }
    );

    if (!newRoom) {
      return res.status(400).json({ message: "Failed to leave the room. You might not be a member." });
    }

    // if the group has less than 2 people, delete the room itself but save the conversations
    if (newRoom.totalMembers < 2) {
      await Room.findByIdAndDelete(roomId);
    }

    return res.status(200).json({ message: "User removed successfully from the group" });
  } catch (err) {
    console.log("Error in leave-room route", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


// This route sends message to a particular room the user is part of
router.post("/send-message", async (req, res) => {
  try {
    const user = req.user;
    const { roomId, content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Content cannot be empty" });
    }

    // Pre-generate the message ID so we can include it in the room update
    const messageId = new mongoose.Types.ObjectId();

    // 1. Atomic update of the room
    const room = await Room.findOneAndUpdate(
      { _id: roomId, "members.memberId": user._id },
      {
        $inc: { currentMessageCount: 1 },
        $set: {
          lastMessage: { 
            messageId: messageId,
            content: content, 
            sender: user._id 
          },
          lastMessageAt: Date.now(),
          "members.$[elem].lastSeenMessage": 0, // Reset for unread count logic
        },
      },
      {
        returnDocument: "after",
        arrayFilters: [{ "elem.memberId": user._id }]
      }
    );

    if (!room) {
      return res.status(404).json({ message: "Room not found or you are not a member" });
    }

    // 2. Sync the sender's lastSeenMessage to the new count
    await Room.updateOne(
      { _id: roomId, "members.memberId": user._id },
      { $set: { "members.$.lastSeenMessage": room.currentMessageCount } }
    );

    // 3. Create the new message with the pre-generated ID
    const newMessage = new Message({
      _id: messageId,
      roomId: roomId,
      messageNumber: room.currentMessageCount,
      sender: user._id,
      content: content,
    });

    await newMessage.save();

    // Emit real-time update via Socket.io logic
    messageBus.emit("new-message", {
      ...newMessage.toObject(),
      members: room.members
    });

    return res.status(201).json({
      message: newMessage,
      success: true
    });

  } catch (err) {
    console.error("Error in send-message:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// need to implement another route here that gets called when the user first open's that
// particular room or group page this route sends the messages based from the user's lastSeenMessage
// and every message after it implement later 

// this route is for getting messages from a room with cursor-based pagination
router.get("/get-messages/:roomId", async (req, res) => {
  try {
    const user = req.user
    const { roomId } = req.params
    const cursor = parseInt(req.query.cursor) // This should be the messageNumber of the last message received
    const limit = parseInt(req.query.limit) || 25

    if (!roomId) {
      return res.status(400).json({ message: "Invalid room id" })
    }

    // Search if the user belongs to the same room
    const room = await Room.findOne({ _id: roomId, "members.memberId": user._id })

    if (!room) {
      return res.status(403).json({ message: "You do not belong to this room" })
    }

    // Build the query
    const query = { roomId: room._id }
    if (cursor) {
      // Fetch messages with a messageNumber smaller than the cursor
      query.messageNumber = { $lt: cursor }
    }

    // Fetch messages sorted by messageNumber in descending order
    const messages = await Message.find(query)
      .sort({ messageNumber: -1 })
      .limit(limit)
      .populate('sender', '_id username profilePicture name')
      .lean()

    // The next cursor is the messageNumber of the last message in the current batch
    const nextCursor = messages.length > 0 ? messages[messages.length - 1].messageNumber : null
    const hasMore = messages.length === limit

    return res.status(200).json({ 
      messageArray: messages, 
      nextCursor,
      hasMore,
      message: "Messages fetched successfully" 
    })

  } catch (err) {
    console.log("Error in get-messages route", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// mark message read route this route is used to indicate whether the user has read a message or not
// this route would get the latest message Number the user has seen and sends a call to this endpoint
router.put("/mark-message-read", async (req, res) => {
  try {
    const userId = req.user._id;
    let { latestMessageNumber, roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    // If latestMessageNumber isn't provided, we fetch the room to get the current count
    // This ensures we mark everything as read up to the current state
    if (!latestMessageNumber) {
      const roomData = await Room.findOne({ _id: roomId, "members.memberId": userId });
      if (!roomData) {
        return res.status(404).json({ message: "Room not found or you are not a member" });
      }
      latestMessageNumber = roomData.currentMessageCount;
    }

    // Atomic update using arrayFilters to target only the current user's entry in the members array
    const updatedRoom = await Room.findOneAndUpdate(
      { _id: roomId, "members.memberId": userId },
      { $set: { "members.$[elem].lastSeenMessage": parseInt(latestMessageNumber) } },
      {
        new: true,
        arrayFilters: [{ "elem.memberId": userId }]
      }
    );

    if (!updatedRoom) {
      return res.status(404).json({ message: "Room not found or you are not a member" });
    }

    return res.status(200).json({ 
      message: "Marked read-messages successfully",
      lastSeenMessage: latestMessageNumber 
    });
  } catch (err) {
    console.error("Error in mark-message-read route:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


// route for deleting messages but only soft-delete
router.delete("/delete-message/:messageId", async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    // Soft delete: Update content and flag
    const deletedMessage = await Message.findOneAndUpdate(
      { _id: messageId, sender: userId, isDeleted: false },
      { 
        $set: { 
          content: "This message was deleted", 
          isDeleted: true 
        } 
      },
      { returnDocument: 'after' }
    );

    if (!deletedMessage) {
      return res.status(403).json({ message: "You are not authorized to delete this message" });
    }

    // Exact sync: Update room preview only if this specific message is the preview
    await Room.updateOne(
      { "lastMessage.messageId": messageId },
      { $set: { "lastMessage.content": "This message was deleted" } }
    );

    return res.status(200).json({ 
      success: true, 
      message: "Message deleted successfully",
      deletedMessage 
    });
  } catch (err) {
    console.error("Error in delete-message route:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// route for editing messages
router.put("/edit-message/:messageId", async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Content cannot be empty" });
    }

    // Update message content and set isEdited flag
    // only if the sender matches and it's not deleted
    const updatedMessage = await Message.findOneAndUpdate(
      { _id: messageId, sender: userId, isDeleted: false },
      { 
        $set: { 
          content: content, 
          isEdited: true 
        } 
      },
      { returnDocument: 'after' }
    );

    if (!updatedMessage) {
      return res.status(403).json({ message: "You are not authorized to edit this message or it does not exist" });
    }

    // Synchronize room preview if this was the last message
    await Room.updateOne(
      { "lastMessage.messageId": messageId },
      { $set: { "lastMessage.content": content } }
    );

    return res.status(200).json({
      success: true,
      message: "Message edited successfully",
      updatedMessage
    });
  } catch (err) {
    console.error("Error in edit-message route:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;

