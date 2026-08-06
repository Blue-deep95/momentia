// routes for uploading, updating, and deleting posts
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
const asyncHandler = require('../middleware/asyncHandler')

// import the notification service here to send notifications
const { notificationBus } = require('../events/event')

let upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 30 * 1024 * 1024 } // 30mb limit for file uploads
})

// getting a singular post and its contents with joined author and like info
router.get("/get-singlepost/:postid",
    asyncHandler(async (req, res) => {
        const user = req.user
        const { postid } = req.params

        if (!mongoose.Types.ObjectId.isValid(postid)) {
            return res.status(400).json({ message: "Invalid post id" })
        }

        const postExists = await Post.exists({ _id: postid })
        if (!postExists) {
            return res.status(404).json({ post: null, message: "Post does not exist or has been removed" })
        }

        const result = await Post.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(postid) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'authorDetails'
                }
            },
            { $unwind: '$authorDetails' },
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
            {
                $addFields: {
                    isLiked: { $gt: [{ $size: '$likedStatus' }, 0] },
                    isSaved: { $gt: [{ $size: '$savedStatus' }, 0] },
                    isFollowing: { $gt: [{ $size: '$followStatus' }, 0] }
                }
            },
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
    })
)

// uploading new posts (images or video)
router.post("/upload-post",
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'video', maxCount: 1 }
    ]),
    asyncHandler(async (req, res) => {
        const user = req.user
        const { caption } = req.body
        if (!caption) {
            return res.status(400).json({ message: "Caption is required!" })
        }

        const imageFiles = req.files['images'] || []
        const videoFile = req.files['video'] ? req.files['video'][0] : null

        if (imageFiles.length === 0 && !videoFile) {
            return res.status(400).json({ message: "No media uploaded" })
        }

        let post

        if (imageFiles.length > 0) {
            const uploadPromises = imageFiles.map((file) => {
                return uploadToCloudinary(file.buffer, 'momentia/posts', 'post', 'image')
            })
            const cloudinaryResults = await Promise.all(uploadPromises)

            post = new Post({ author: user._id, mediaType: 'image', caption: caption, images: [] })
            cloudinaryResults.forEach(item => {
                post.images.push({ url: item.secure_url, public_id: item.public_id })
            })

            const thumbUrl = cloudinaryResults[0].secure_url.replace('/upload/', '/upload/w_250,h_250,c_fill,q_auto,f_auto/')
            post.thumbImage = thumbUrl
        }
        else {
            const cloudinaryResult = await uploadToCloudinary(videoFile.buffer, 'momentia/posts', 'post', 'video')

            post = new Post({
                author: req.user._id, mediaType: 'video', caption: caption,
                video: { url: cloudinaryResult.secure_url, public_id: cloudinaryResult.public_id }
            })

            post.thumbImage = cloudinaryResult.secure_url
                .replace(/\.[^/.]+$/, ".jpg")
                .replace('/upload/', '/upload/w_250,h_250,c_fill,q_auto,f_auto/')
        }

        await post.save()
        await User.findByIdAndUpdate(user._id, { $inc: { totalPosts: 1 } })

        return res.status(200).json({ message: 'Post created succesfully!' })
    })
)

router.delete("/delete-post/:id",
    asyncHandler(async (req, res) => {
        const user = req.user
        const { id } = req.params
        const post = await Post.findById(id)
        if (!post) {
            return res.status(400).json({ message: "Post does not exist or already deleted" })
        }

        if (post.author.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this post" })
        }

        const deletePromises = []

        if (post.mediaType === 'image') {
            post.images.forEach(item => {
                if (item.public_id) {
                    deletePromises.push(deleteFromCloudinary(item.public_id, 'image'))
                }
            })
        } else if (post.mediaType === 'video' && post.video?.public_id) {
            deletePromises.push(deleteFromCloudinary(post.video.public_id, 'video'))
        }

        if (deletePromises.length > 0) {
            await Promise.all(deletePromises).catch(err => console.error("Error deleting post media:", err))
        }

        await Post.findByIdAndDelete(post._id)
        await User.findByIdAndUpdate(user._id, { $inc: { totalPosts: -1 } })

        await Like.deleteMany({ parentPost: post._id })
        await Comment.deleteMany({ post: post._id })

        return res.status(200).json({ message: "Post deleted successfully!" })
    })
)

router.post("/update-post",
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'video', maxCount: 1 }
    ]),
    asyncHandler(async (req, res) => {
        const { postId, caption } = req.body
        const user = req.user

        if (!postId) {
            return res.status(400).json({ message: "Post ID is required" })
        }

        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({ message: "Post not found" })
        }

        if (post.author.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to update this post" })
        }

        if (caption) {
            post.caption = caption
        }

        const imageFiles = req.files['images'] || []
        const videoFile = req.files['video'] ? req.files['video'][0] : null

        if (imageFiles.length > 0 || videoFile) {
            const deletePromises = []
            if (post.mediaType === 'image') {
                post.images.forEach(item => {
                    if (item.public_id) {
                        deletePromises.push(deleteFromCloudinary(item.public_id, 'image'))
                    }
                })
                post.images = []
            } else if (post.mediaType === 'video' && post.video?.public_id) {
                deletePromises.push(deleteFromCloudinary(post.video.public_id, 'video'))
                post.video = undefined
            }

            if (deletePromises.length > 0) {
                await Promise.all(deletePromises).catch(err => console.error("Error deleting old media on update:", err))
            }

            if (imageFiles.length > 0) {
                const uploadPromises = imageFiles.map((file) => {
                    return uploadToCloudinary(file.buffer, 'momentia/posts', 'post', 'image')
                })
                const cloudinaryResults = await Promise.all(uploadPromises)

                post.mediaType = 'image'
                cloudinaryResults.forEach(item => {
                    post.images.push({ url: item.secure_url, public_id: item.public_id })
                })

                const thumbUrl = cloudinaryResults[0].secure_url.replace('/upload/', '/upload/w_250,h_250,c_fill,q_auto,f_auto/')
                post.thumbImage = thumbUrl
                post.video = undefined
            } else if (videoFile) {
                const cloudinaryResult = await uploadToCloudinary(videoFile.buffer, 'momentia/posts', 'post', 'video')

                post.mediaType = 'video'
                post.video = { url: cloudinaryResult.secure_url, public_id: cloudinaryResult.public_id }

                post.thumbImage = cloudinaryResult.secure_url
                    .replace(/\.[^/.]+$/, ".jpg")
                    .replace('/upload/', '/upload/w_250,h_250,c_fill,q_auto,f_auto/')
                post.images = []
            }
        }

        await post.save()
        return res.status(200).json({ message: 'Post updated successfully!', post })
    })
)

// toggling likes on posts
router.post("/toggle-like/:postid",
    asyncHandler(async (req, res) => {
        const { postid } = req.params
        const user = req.user

        if (!postid) {
            return res.status(400).json({ message: "Invalid or missing post id" })
        }

        const post = await Post.findById(postid)
        if (!post) {
            return res.status(404).json({ message: "Post not found" })
        }

        const existingLike = await Like.findOne({ author: user._id, postTarget: postid })

        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id)
            notificationBus.emit('post-unliked', { ...existingLike.toObject(), postAuthor: post.author })

            await Post.findByIdAndUpdate(postid, { $inc: { totalLikes: -1 } })
            return res.status(200).json({ message: "Post unliked successfully", isLiked: false })
        } else {
            const newLike = new Like({
                author: user._id,
                likeType: 'post',
                parentPost: postid,
                postTarget: postid
            })
            await newLike.save()

            if (post.author.toString() !== user._id.toString()) {
                notificationBus.emit('post-liked', { ...newLike.toObject(), postAuthor: post.author })
            }

            await Post.findByIdAndUpdate(postid, { $inc: { totalLikes: 1 } })
            return res.status(200).json({ message: "Post liked successfully", isLiked: true })
        }
    })
)

// saving and unsaving posts
router.post("/toggle-savedposts/:postid",
    asyncHandler(async (req, res) => {
        const { postid } = req.params
        const userId = req.user._id

        const postExists = await Post.exists({ _id: postid })
        if (!postExists) {
            await User.findByIdAndUpdate(userId, { $pull: { savedPosts: postid } })
            return res.status(404).json({ message: "Target post does not exist!" })
        }

        const user = await User.findById(userId).select('savedPosts')
        const isSaved = user.savedPosts.some(id => id.toString() === postid)

        if (isSaved) {
            await User.findByIdAndUpdate(userId, { $pull: { savedPosts: postid } })
            return res.status(200).json({ message: "Post removed from saved posts successfully", isSaved: false })
        }
        else {
            await User.findByIdAndUpdate(userId, { $addToSet: { savedPosts: postid } })
            return res.status(200).json({ message: "Post added to saved posts successfully!", isSaved: true })
        }
    })
)

module.exports = router
