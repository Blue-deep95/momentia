// This is mainly for managing message services
const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const Message = require('../models/Message')

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


// This route sends message to a particular room the user is part of
router.post("/send-message", async (req, res) => {
  try {
    const user = req.user;
    const { roomId, content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Content cannot be empty" });
    }

    // 1. Atomic update of the room
    const room = await Room.findOneAndUpdate(
      { _id: roomId, "members.memberId": user._id },
      {
        $inc: { currentMessageCount: 1 },
        $set: {
          lastMessage: { content: content, sender: user._id },
          lastMessageAt: Date.now(),
          "members.$[elem].lastSeenMessage": 0, // We'll update this properly in a sec
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
    // We do this separately to ensure it's exactly the same as currentMessageCount
    await Room.updateOne(
      { _id: roomId, "members.memberId": user._id },
      { $set: { "members.$.lastSeenMessage": room.currentMessageCount } }
    );

    // 3. Create the new message
    const newMessage = new Message({
      roomId: roomId,
      messageNumber: room.currentMessageCount,
      sender: user._id,
      content: content,
    });

    await newMessage.save();

    // Emit real-time update via Socket.io
    // Use messageBus event emitter for this later to send messages to the room
    // Send an event here...

    return res.status(201).json({
      message: newMessage,
      success: true
    });

  } catch (err) {
    console.error("Error in send-message:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
