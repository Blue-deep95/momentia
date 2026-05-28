
// this schema is mainly for followers list for getting
// the follower count and following
const mongoose = require('mongoose')

const FollowSchema = new mongoose.Schema({
    // this has mainly host and target both user ids

    // host is  following the target.
    host:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true,
        index:true
    },
    target:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true,
        index:true
    }
},{timestamps:true})

FollowSchema.index({ host: 1, target: 1 }, { unique: true })

module.exports = mongoose.model('follow',FollowSchema)

