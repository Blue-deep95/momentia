
// Similar to notification Service this is message service for chat applications
// and should trigger only when in user is in the specific chat window
const {messageBus} = require('../events/event')
const Message = require("../models/Message")
const {io} = require('../socket/socket')
const {onlineUsers} = require("../socket/socketStore")


// events start 
// This event is only for sending the message if the user is in the same room he gets message if not,
// it should either show a notification or just be silent in frontend
messageBus.on("new-message",async(data) =>{
    try{
        // go through the members 
        data.members.forEach(item =>{
            let userSocketId = onlineUsers.get(item.memberId.toString())
            const dataToBeSent = {...data}
            dataToBeSent.members = undefined
            if (userSocketId && item.memberId.toString() !== data.sender.toString()){
                // send to everyone except the user
                io.to(userSocketId).emit("new-message",{...dataToBeSent})
            }
        })
    }
    catch(error){
        console.error("Error in sending new-message event listener background task", error)
    }
})