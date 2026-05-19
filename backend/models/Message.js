
// This is the chat message that belongs to a room and has it's own 
// message serial
const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    roomId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'room',
        index:true
    },
    // The current message number in this room only 
    messageNumber:{
        type:Number,
        required:true
    },
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        index:true
    },
    content:{
        type:String,
        required:true,
    },
    // This is mainly for soft-deleting messages and still preserve the messageNumber
    isDeleted:{
        type:Boolean,
        default:false
    },
    isEdited:{
        type:Boolean,
        default:false
    }

},{timestamps:true})

messageSchema.index({ roomId: 1, messageNumber: -1 });

module.exports = mongoose.model('message',messageSchema)