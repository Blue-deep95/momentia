// Similar to notification Service this is message service for chat applications
// and should trigger only when in user is in the specific chat window
const { messageBus } = require('../events/event')
const Message = require("../models/Message")
const { io } = require('../socket/socket')
const { onlineUsers } = require("../socket/socketStore")
const mongoose = require('mongoose')


// events start 
// This event is only for sending the message if the user is in the same room he gets message if not,
// it should either show a notification or just be silent in frontend
messageBus.on("new-message", async (data) => {
    try {
        // before sending to frontend need to attatch sender and room details
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
                                profilePicture: 1,
                            }
                        }
                    ],
                    as: 'senderDetails'
                }
            },
            { $unwind: "$senderDetails" },
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
                                // need to add room picture here later when implementing it 
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

        data.members.forEach(item => {
            let memberIdStr = item.memberId.toString()
            let userSocketId = onlineUsers.get(memberIdStr)
            
            if (userSocketId && memberIdStr !== data.sender.toString()) {
                // send to everyone except the sender
                io.to(userSocketId).emit("new-message", dataToBeSent)
            }
        })
    }
    catch (error) {
        console.error("Error in sending new-message event listener background task", error)
    }
})