// Managing message services and chat rooms
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Room = require("../models/Room");
const Message = require("../models/Message");
const { messageBus } = require("../events/event");
const { contentSchema } = require("../zodSchema/validationSchema");
const asyncHandler = require("../middleware/asyncHandler");

// Start a new DM or Group Chat
router.post("/create-room", asyncHandler(async (req, res) => {
  const creatorId = req.user._id;
  const { participants, roomName, roomDescription } = req.body;

  if (
    !participants ||
    !Array.isArray(participants) ||
    participants.length === 0
  ) {
    return res.status(400).json({ message: "Participants are required" });
  }

  const allMemberIds = [...new Set([creatorId.toString(), ...participants])];
  const totalMembers = allMemberIds.length;

  if (totalMembers === 2) {
    const otherMemberId = allMemberIds.find(
      (id) => id !== creatorId.toString(),
    );

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
      return res.status(200).json({
        room: existingRoom,
        isExisting: true,
        message: "DM room already exists",
      });
    }
  }

  const membersArray = allMemberIds.map((id) => ({
    memberId: id,
    joinedAt: new Date(),
    lastSeenMessage: 0,
  }));

  const roomType = totalMembers === 2 ? "dm" : "group";

  const newRoom = new Room({
    roomType,
    roomName: roomType === "group" ? roomName || "New Group" : undefined,
    roomDescription: roomType === "group" ? roomDescription : undefined,
    members: membersArray,
    totalMembers,
    currentMessageCount: 0,
    lastMessage: null,
  });

  await newRoom.save();

  return res.status(201).json({
    room: newRoom,
    isExisting: false,
    message: `${roomType === "dm" ? "Direct Message" : "Group"} created successfully`,
  });
}));

// Fetch all rooms for the authenticated user
router.get("/get-rooms", asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const rooms = await Room.aggregate([
    {
      $match: {
        "members.memberId": new mongoose.Types.ObjectId(userId),
      },
    },
    { $sort: { lastMessageAt: -1, updatedAt: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "members.memberId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              profilePicture: 1,
              name: 1,
            },
          },
        ],
        as: "membersDetails",
      },
    },
    {
      $addFields: {
        userMemberInfo: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$members",
                as: "m",
                cond: {
                  $eq: [
                    "$$m.memberId",
                    new mongoose.Types.ObjectId(userId),
                  ],
                },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        lastSeenMessageNumber: {
          $ifNull: ["$userMemberInfo.lastSeenMessage", 0],
        },
      },
    },
    {
      $addFields: {
        unreadCount: {
          $max: [
            0,
            {
              $subtract: [
                "$currentMessageCount",
                "$lastSeenMessageNumber",
              ],
            },
          ],
        },
      },
    },
    {
      $addFields: {
        dmUserInfo: {
          $cond: {
            if: { $eq: ["$roomType", "dm"] },
            then: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$membersDetails",
                    as: "u",
                    cond: {
                      $ne: [
                        "$$u._id",
                        new mongoose.Types.ObjectId(userId),
                      ],
                    },
                  },
                },
                0,
              ],
            },
            else: null,
          },
        },
      },
    },
  ]);

  return res.status(200).json({
    rooms,
    message: "Rooms retrieved successfully",
  });
}));

// Send a message
router.post("/send-message", asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const { roomId, content } = req.body;

  if (!roomId || !content) {
    return res.status(400).json({ message: "Room ID and content are required" });
  }

  const validation = contentSchema.safeParse(content);
  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.errors.map((err) => err.message),
    });
  }
  const validatedContent = validation.data;

  const room = await Room.findOne({
    _id: roomId,
    "members.memberId": senderId,
  });

  if (!room) {
    return res
      .status(404)
      .json({ message: "Room not found or you are not a member" });
  }

  const nextMessageNumber = room.currentMessageCount + 1;

  const newMessage = new Message({
    roomId: room._id,
    sender: senderId,
    messageNumber: nextMessageNumber,
    content: validatedContent,
  });

  await newMessage.save();

  const now = new Date();
  room.currentMessageCount = nextMessageNumber;
  room.lastMessageAt = now;
  room.lastMessage = {
    content: validatedContent,
    sender: senderId,
    messageId: newMessage._id,
  };

  const senderMemberIndex = room.members.findIndex(
    (m) => m.memberId.toString() === senderId.toString(),
  );
  if (senderMemberIndex !== -1) {
    room.members[senderMemberIndex].lastSeenMessage = nextMessageNumber;
  }

  await room.save();

  messageBus.emit("new-message", {
    ...newMessage.toObject(),
    members: room.members,
  });

  return res.status(201).json({
    messageData: newMessage,
    message: "Message sent successfully",
  });
}));

// Fetch paginated messages for a room
router.get("/get-messages/:roomId", asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { roomId } = req.params;
  const limit = parseInt(req.query.limit) || 50;
  const cursor = req.query.cursor ? parseInt(req.query.cursor) : null;

  const room = await Room.findOne({
    _id: roomId,
    "members.memberId": userId,
  });

  if (!room) {
    return res
      .status(404)
      .json({ message: "Room not found or you are not a member" });
  }

  const query = { roomId: room._id };
  if (cursor) {
    query.messageNumber = { $lt: cursor };
  }

  const messages = await Message.find(query)
    .sort({ messageNumber: -1 })
    .limit(limit)
    .populate("sender", "_id username profilePicture name")
    .lean();

  const nextCursor =
    messages.length > 0 ? messages[messages.length - 1].messageNumber : null;
  const hasMore = messages.length === limit;

  return res.status(200).json({
    messageArray: messages,
    nextCursor,
    hasMore,
    message: "Messages fetched successfully",
  });
}));

// Mark messages read in a room
router.put("/mark-message-read", asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let { latestMessageNumber, roomId } = req.body;

  if (!roomId) {
    return res.status(400).json({ message: "Room ID is required" });
  }

  if (!latestMessageNumber) {
    const roomData = await Room.findOne({
      _id: roomId,
      "members.memberId": userId,
    });
    if (!roomData) {
      return res
        .status(404)
        .json({ message: "Room not found or you are not a member" });
    }
    latestMessageNumber = roomData.currentMessageCount;
  }

  const updatedRoom = await Room.findOneAndUpdate(
    { _id: roomId, "members.memberId": userId },
    {
      $set: {
        "members.$[elem].lastSeenMessage": parseInt(latestMessageNumber),
      },
    },
    {
      new: true,
      arrayFilters: [{ "elem.memberId": userId }],
    },
  );

  if (!updatedRoom) {
    return res
      .status(404)
      .json({ message: "Room not found or you are not a member" });
  }

  return res.status(200).json({
    message: "Marked read-messages successfully",
    lastSeenMessage: latestMessageNumber,
  });
}));

// Soft delete a message
router.delete("/delete-message/:messageId", asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { messageId } = req.params;

  const deletedMessage = await Message.findOneAndUpdate(
    { _id: messageId, sender: userId, isDeleted: false },
    {
      $set: {
        content: "This message was deleted",
        isDeleted: true,
      },
    },
    { returnDocument: "after" },
  );

  if (!deletedMessage) {
    return res
      .status(403)
      .json({ message: "You are not authorized to delete this message" });
  }

  await Room.updateOne(
    { "lastMessage.messageId": messageId },
    { $set: { "lastMessage.content": "This message was deleted" } },
  );

  return res.status(200).json({
    success: true,
    message: "Message deleted successfully",
    deletedMessage,
  });
}));

// Edit a message
router.put("/edit-message/:messageId", asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { messageId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ message: "Content cannot be empty" });
  }

  const updatedMessage = await Message.findOneAndUpdate(
    { _id: messageId, sender: userId, isDeleted: false },
    {
      $set: {
        content: content,
        isEdited: true,
      },
    },
    { returnDocument: "after" },
  );

  if (!updatedMessage) {
    return res
      .status(403)
      .json({
        message:
          "You are not authorized to edit this message or it does not exist",
      });
  }

  await Room.updateOne(
    { "lastMessage.messageId": messageId },
    { $set: { "lastMessage.content": content } },
  );

  return res.status(200).json({
    success: true,
    message: "Message edited successfully",
    updatedMessage,
  });
}));

// Leave room endpoint
router.put("/leave-room", asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { roomId } = req.body;

  if (!roomId) {
    return res.status(400).json({ message: "Room ID is required" });
  }

  const room = await Room.findOne({ _id: roomId, "members.memberId": userId });
  if (!room) {
    return res.status(404).json({ message: "Room not found or you are not a member" });
  }

  await Room.findByIdAndUpdate(roomId, {
    $pull: { members: { memberId: userId } },
    $inc: { totalMembers: -1 }
  });

  return res.status(200).json({ message: "Left group successfully" });
}));

module.exports = router;
