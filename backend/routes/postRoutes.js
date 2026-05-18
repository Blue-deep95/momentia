
// theese routes are mainly for uploading,updating and deleting posts
const express = require('express')
const multer = require('multer')
const mongoose = require('mongoose')

const router = express.Router()
const User = require('../models/User')
const Post = require('../models/Post')
const Like = require('../models/Like')
const Comment = require('../models/Comment')

const uploadToCloudinary = require('../utils/uploadToCloudinary')
const deleteFromCloudinary = require('../utils/deleteFromCloudinary')

// import the notification service here to send notifications
const {notificationBus} = require('../events/event')

let upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 30 * 1024 * 1024 } // gives 30mb limit for file uploads
})

// this route is for getting a singular post and it's contents with additional information
router.get("/get-singlepost/:postid",
    async (req, res) => {
        try {
            const user = req.user
            const { postid } = req.params

            if (!mongoose.Types.ObjectId.isValid(postid)) {
                return res.status(400).json({ message: "Invalid post id" })
            }

            // try to find if the post exists or not 
            const postExists = await Post.exists({ _id: postid })
            if (!postExists) {
                return res.status(404).json({ post: null, message: "Post does not exist or has been removed" })
            }

            // if post exists, perform a complex join operation
            const result = await Post.aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(postid) } },
                // Join the author data
                {
                    $lookup: {
                        from: 'users',
                        localField: 'author',
                        foreignField: '_id',
                        as: 'authorDetails'
                    }
                },
                { $unwind: '$authorDetails' },
                // Check if the current user liked the post
                {
                    $lookup: {
                        from: 'likes',
                        let: { postId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$postTarget', '$$postId'] },
                                            { $eq: ['$author', new mongoose.Types.ObjectId(user._id)] },
                                            { $eq: ['$likeType', 'post'] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'likedStatus'
                    }
                },
                // Check if the current user saved the post
                {
                    $lookup: {
                        from: 'users',
                        let: { postId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$_id', new mongoose.Types.ObjectId(user._id)] },
                                            { $in: ['$$postId', '$savedPosts'] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'savedStatus'
                    }
                },
                // Check if the user follows the author
                {
                    $lookup: {
                        from: 'follows',
                        let: { authorId: '$author' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$target', '$$authorId'] },
                                            { $eq: ['$host', new mongoose.Types.ObjectId(user._id)] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'followStatus'
                    }
                },
                // Transform joined arrays into boolean flags
                {
                    $addFields: {
                        isLiked: { $gt: [{ $size: '$likedStatus' }, 0] },
                        isSaved: { $gt: [{ $size: '$savedStatus' }, 0] },
                        isFollowing: { $gt: [{ $size: '$followStatus' }, 0] }
                    }
                },
                // Cleanup sensitive data before sending
                {
                    $project: {
                        likedStatus: 0,
                        savedStatus: 0,
                        followStatus: 0,
                        'authorDetails.password': 0,
                        'authorDetails.email': 0,
                        'authorDetails.refreshToken': 0,
                        'authorDetails.otp': 0,
                        'authorDetails.savedPosts': 0,
                        'authorDetails.blockedUsers': 0
                    }
                }
            ])

            if (result.length === 0) {
                return res.status(404).json({ message: "Post not found" })
            }

            return res.status(200).json({ post: result[0], message: "Post fetched successfully" })

        }
        catch (err) {
            console.log('Error in get-singlepost route', err)
            return res.status(500).json({ message: "Internal server error" })
        }
    }
)

// this route is mainly used for uploading new posts it accepts either 5 images or 1 video
router.post("/upload-post",
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'video', maxCount: 1 }
    ]),
    async (req, res) => {
        console.log('request reached upload post')
        try {
            // there is no need to find the user becuase req.user contains it 
            const user = req.user

            const { caption } = req.body // mediaType needs to be either image or video
            if (!caption) {
                return res.status(400).json({ message: "Caption is required!" })
            }

            // since we are using multer for handling both images and videos, and also 
            // upload.fields(), we must seperate both from each other
            const imageFiles = req.files['images'] || []
            const videoFile = req.files['video'] ? req.files['video'][0] : null

            // if both are empty no media was uploaded
            if (imageFiles.length === 0 && !videoFile) {
                return res.status(400).json({ message: "No media uploaded" })
            }

            let post


            if (imageFiles.length > 0) {

                // loop through the files and catch all images send them to cloudinary
                // simultaneously.
                const uploadPromises = imageFiles.map((file) => {
                    return uploadToCloudinary(file.buffer, 'momentia/posts', 'post', 'image')
                })

                const results = await Promise.all(uploadPromises)

                // create a new post with author as the id from the user
                post = new Post({ author: user._id, mediaType: 'image', caption: caption, images: [] })
                // now go through results and using forEach and save in Post schema
                results.forEach(item => {
                    post.images.push({ url: item.secure_url, public_id: item.public_id })
                })

                // aspect ration of 1:1 to keep it consistent
                const thumbUrl = results[0].secure_url.replace('/upload/', '/upload/w_250,h_250,c_fill,q_auto,f_auto/')

                post.thumbImage = thumbUrl
            }

            // if the file is video,
            else {
                const uploadVideo = await uploadToCloudinary(videoFile.buffer, 'momentia/posts', 'post', 'video')

                post = new Post({
                    author: req.user._id, mediaType: 'video', caption: caption,
                    video: { url: uploadVideo.secure_url, public_id: uploadVideo.public_id }
                })

                post.thumbImage = uploadVideo.secure_url
                    .replace(/\.[^/.]+$/, ".jpg")
                    .replace('/upload/', '/upload/w_250,h_250,c_fill,q_auto,f_auto/')
            }

            // after this save the post 
            await post.save()
            // also update the user's total post in user's schema
            await User.findByIdAndUpdate(user._id, { $inc: { totalPosts: 1 } })

            // if all succeded, return success message
            return res.status(200).json({ message: 'Post created succesfully!' })
        }
        catch (err) {
            console.log('error in upload post route 😂', err)
            return res.status(500).json({ message: "internal server error" })
        }

    }
)

// delete route for deleting already existing post
router.delete("/delete-post/:id",
    async (req, res) => {
        try {
            const user = req.user // this comes from protect middleware
            // first check if the post exists 
            const { id } = req.params
            const post = await Post.findById(id)
            if (!post) {
                return res.status(400).json({ message: "Post does not exist or already deleted" })
            }

            // check if the user is the author of the post
            if (post.author.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "You are not authorized to delete this post" })
            }

            // delete media from cloudinary
            if (post.mediaType === 'image') {
                const deletePromises = post.images.map(item => {
                    return deleteFromCloudinary(item.public_id, 'image')
                })

                await Promise.all(deletePromises)

            }
            else if (post.mediaType === 'video') {
                // get the public id from video
                const video_id = post.video?.public_id
                if (video_id) {
                    await deleteFromCloudinary(video_id, 'video')
                }
            }

            // after deleting media, delete post from db
            await Post.findByIdAndDelete(post._id)
            // also update the user's total post count in user's schema
            await User.findByIdAndUpdate(user._id, { $inc: { totalPosts: -1 } })

            // also delete all the comments and likes associated with the post
            // since adding new parentPost field to Likes schema it works perfectly
            await Like.deleteMany({parentPost:post._id})
            await Comment.deleteMany({post:post._id})


            return res.status(200).json({ message: "Post deleted successfully!" })
        }
        catch (err) {
            console.log('error in delete-post route 😂', err)
            return res.status(500).json({ message: "Internal server Error" })
        }
    }
)

// for later updating posts either caption or images or videos in it
router.post("/update-post",
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'video', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const { postId, caption } = req.body
            const user = req.user

            if (!postId) {
                return res.status(400).json({ message: "Post ID is required" })
            }

            // Find the post first
            const post = await Post.findById(postId)
            if (!post) {
                return res.status(404).json({ message: "Post not found" })
            }

            // Check if the user is the author
            if (post.author.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "You are not authorized to update this post" })
            }

            // Update caption if provided
            if (caption) {
                post.caption = caption
            }

            const imageFiles = req.files['images'] || []
            const videoFile = req.files['video'] ? req.files['video'][0] : null

            // If new media is uploaded, we replace the old media
            if (imageFiles.length > 0 || videoFile) {

                // 1. Delete old media from Cloudinary
                if (post.mediaType === 'image') {
                    const deletePromises = post.images.map(item => {
                        return deleteFromCloudinary(item.public_id, 'image')
                    })
                    await Promise.all(deletePromises)
                    post.images = [] // Clear old images
                } else if (post.mediaType === 'video') {
                    if (post.video?.public_id) {
                        await deleteFromCloudinary(post.video.public_id, 'video')
                    }
                    post.video = undefined // Clear old video
                }

                // 2. Upload new media
                if (imageFiles.length > 0) {
                    const uploadPromises = imageFiles.map((file) => {
                        return uploadToCloudinary(file.buffer, 'momentia/posts', 'post', 'image')
                    })

                    const results = await Promise.all(uploadPromises)

                    post.mediaType = 'image'
                    results.forEach(item => {
                        post.images.push({ url: item.secure_url, public_id: item.public_id })
                    })

                    // Update thumb image
                    const thumbUrl = results[0].secure_url.replace('/upload/', '/upload/w_250,h_250,c_fill,q_auto,f_auto/')
                    post.thumbImage = thumbUrl
                    post.video = undefined // Ensure video is cleared
                } else if (videoFile) {
                    const uploadVideo = await uploadToCloudinary(videoFile.buffer, 'momentia/posts', 'post', 'video')

                    post.mediaType = 'video'
                    post.video = { url: uploadVideo.secure_url, public_id: uploadVideo.public_id }

                    // Update thumb image for video
                    post.thumbImage = uploadVideo.secure_url
                        .replace(/\.[^/.]+$/, ".jpg")
                        .replace('/upload/', '/upload/w_250,h_250,c_fill,q_auto,f_auto/')
                    post.images = [] // Ensure images are cleared
                }
            }

            await post.save()

            return res.status(200).json({ message: 'Post updated successfully!', post })
        }
        catch (err) {
            console.log("Error in update-post route 😂", err)
            return res.status(500).json({ message: "Internal server error" })
        }
    }

)

// this route is for toggling likes (like/unlike)
router.post("/toggle-like/:postid",
    async (req, res) => {
        try {
            const { postid } = req.params
            const user = req.user

            if (!postid) {
                return res.status(400).json({ message: "Invalid or missing post id" })
            }

            // Check if the post exists
            const post = await Post.findById(postid)
            if (!post) {
                return res.status(404).json({ message: "Post not found" })
            }

            // Check if the user already liked the post
            const existingLike = await Like.findOne({ author: user._id, postTarget: postid })

            if (existingLike) {
                // If it exists, UNLIKE it
                await Like.findByIdAndDelete(existingLike._id)

                // again emit event to indicate the post has been unliked 
                // convert to object for safety
                notificationBus.emit('post-unliked',{...existingLike.toObject(),postAuthor:post.author})

                await Post.findByIdAndUpdate(postid, { $inc: { totalLikes: -1 } })
                return res.status(200).json({ message: "Post unliked successfully", isLiked: false })
            } else {
                // If it doesn't exist, LIKE it
                const newLike = new Like({
                    author: user._id,
                    likeType: 'post',
                    parentPost:postid,
                    postTarget: postid
                })
                await newLike.save()
                // after the new Like is saved send notification 
                notificationBus.emit('post-liked',{...newLike.toObject(),postAuthor:post.author})
                
                await Post.findByIdAndUpdate(postid, { $inc: { totalLikes: 1 } })
                return res.status(200).json({ message: "Post liked successfully", isLiked: true })
            }
        }
        catch (err) {
            console.log("Error in /toggle-like route 😂", err)
            return res.status(500).json({ message: "Internal server error" })
        }
    }
)

// this route is for saving posts and unsaving them
router.post("/toggle-savedposts/:postid",
    async (req, res) => {
        try {
            const { postid } = req.params
            const userId = req.user._id

            // check the validity of posts 
            const postExists = await Post.exists({ _id: postid })
            if (!postExists) {
                // remove the post from the user object if it does exist (cleanup)
                await User.findByIdAndUpdate(userId, { $pull: { savedPosts: postid } })
                return res.status(404).json({ message: "Target post does not exist!" })
            }

            // Check if the post is already saved
            const user = await User.findById(userId).select('savedPosts')
            const isSaved = user.savedPosts.some(id => id.toString() === postid)

            if (isSaved) {
                // remove the post 
                await User.findByIdAndUpdate(userId, { $pull: { savedPosts: postid } })
                return res.status(200).json({ message: "Post removed from saved posts successfully", isSaved: false })
            }
            else {
                // add the post
                await User.findByIdAndUpdate(userId, { $addToSet: { savedPosts: postid } })
                return res.status(200).json({ message: "Post added to saved posts successfully!", isSaved: true })
            }
        }
        catch (err) {
            console.log('Error in toggle-savedposts route', err)
            return res.status(500).json({ message: "Internal server error" })
        }
    }
)

module.exports = router

