// post schema
const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true
    },

    caption: {
        type: String,
        required: true
    },
    totalLikes: {
        type: Number,
        default: 0
    },
    totalComments: {
        type: Number,
        default: 0
    },
    totalShares: {
        type: Number,
        default: 0
    },

    mediaType: {
        type: String,
        enum: ["image", "video"]
    },

    // thumb image for displaying posts at the same time
    // thumb image will always be the first image stored here whether for videos or 
    // images 
    thumbImage: String,

    // images if they exist are stored in array as urls both their urls and public_ids
    images: [
        {
            url: String,
            public_id: String
        }
    ],

    // video if they exist are stored in string url
    video: {
        url:String,
        public_id:String
    },

    // hashtags for future use 
    hashtags: [
        {
            type: String,
            lowercase: true,
            trim: true
        }
    ],

    // mentions for future uses
    mentions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    ]

}, { timestamps: true })

// Indexing for faster feed generation and profile post queries
PostSchema.index({ caption: 'text', hashtags: 'text' });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });


module.exports = mongoose.model('post', PostSchema)