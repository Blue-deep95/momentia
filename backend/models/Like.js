
// this is mainly a schema for like collection to avoid storing everything in a single db
const mongoose = require('mongoose')

const LikeSchema = new mongoose.Schema({
    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        index:true,
        required:true
    },
    // include additional parentPost to simplfy the removal
    // of likes belonging to the same posts
    parentPost:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'post',
        index:true,
    },
    likeType:{
        type:String,
        enum:["post","comment"]
    },
    postTarget:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'post',
        index:true
    },
    commentTarget:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'comment',
        index:true
    }


},{timestamps:true})

module.exports = mongoose.model('like',LikeSchema)