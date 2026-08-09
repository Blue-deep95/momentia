// Similar to notification Service this is message service for chat applications
// and should trigger only when user is in the specific chat window
const { messageBus } = require('../events/event')
const Message = require("../models/Message")
const { io } = require('../socket/socket')
const { onlineUsers } = require("../socket/socketStore")
const mongoose = require('mongoose')

// Event triggered when a new message is posted
messageBus.on("new-message", async (data) => {
    try {
        // Populate sender and room details before emitting to socket subscribers
        const results = await Message.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(data._id) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'sender',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                name: 1,
                                profilePicture: 1,
                            }
                        }
                    ],
                    as: 'sender'
                }
            },
            { $unwind: "$sender" },
            {
                $lookup: {
                    from: 'rooms',
                    localField: 'roomId',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $project: {
                                roomName: 1,
                                currentMessageCount: 1
                            }
                        }
                    ],
                    as: 'roomDetails'
                }
            },
            { $unwind: { path: "$roomDetails", preserveNullAndEmptyArrays: true } }
        ])

        if (!results || results.length === 0) return;

        const dataToBeSent = results[0];
        const senderIdStr = (data.sender?._id || data.sender).toString();

        data.members.forEach(item => {
            let memberIdStr = item.memberId.toString()
            let userSocketId = onlineUsers.get(memberIdStr)
            
            if (userSocketId && memberIdStr !== senderIdStr) {
                // Send to everyone in the room except the sender
                io.to(userSocketId).emit("new-message", dataToBeSent)
            }
        })
    }
    catch (error) {
        console.error("Error in sending new-message event listener background task", error)
    }
})