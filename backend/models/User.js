const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    name: String,
    
    bio: {
        type: String,
        default: ""
    },
    gender: {
        type: String,
        default: "",
    },

    password: String,
    refreshToken: String,
    otp: String,
    otpExpiry: Number,
    isEmailVerified: {
        type: Boolean,
        default: false
    },

    // to delete and update images in cloudinary, a single public id 
    // for original is required. Deleting original in cloudinary also 
    // removes transformed images completely
    profilePicture: {
        original: {
            url: String,
            public_id: String
        },
        profileView: String,
        commentView: String
    },

    // for saved posts instead of creating seperate schema we can simply use 
    // this to store the postids of posts that user saved in this array.
    savedPosts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'post'
        }
    ],
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],

    totalLikes: {
        type: Number,
        default: 0
    },
    totalComments: {
        type: Number,
        default: 0
    },
    totalPosts: {
        type: Number,
        default: 0
    },
    followers: {
        type: Number,
        default: 0
    },
    following: {
        type: Number,
        default: 0
    },

    // settings for later use user default settings are stored here
    //settings:{}


}, { timestamps: true })

// create a special text index to search through databases quickly
// this is a special indexing only text to speed up searches based on name,username
UserSchema.index({name:'text',username:'text'})

module.exports = mongoose.model('user', UserSchema)