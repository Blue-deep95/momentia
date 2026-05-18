
const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema({
    // who created the comment
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    // post that comment belongs to
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post",
        required: true,
        index: true,
    },
    // parent if the comment is nested
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "comment",
        default: null,
        index: true
    },

    // reference that tells which user the comment replies to
    // this mainly to avoid comment depth more than 1 in nested replies
    reference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null,
        index: true
    },

    // content of the comment
    content:{
        type:String,
        required:true
    },

    totalLikes: {
        type: Number,
        default: 0
    },

    // only if the parent is null otherwise this stays at 0
    totalReplies: {
        type: Number,
        default: 0,
    }


},{timestamps:true})

module.exports = mongoose.model('comment',CommentSchema)