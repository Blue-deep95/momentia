
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
const { uploadToGridFS, deleteFromGridFS } = require('../utils/gridfs')
const { processPostImage } = require('../utils/imageProcessor')

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
                // 1. Upload to Cloudinary (Primary)
                const cloudinaryPromise = (async () => {
                    const uploadPromises = imageFiles.map((file) => {
                        return uploadToCloudinary(file.buffer, 'momentia/posts', 'post', 'image')
                    })
                    return await Promise.all(uploadPromises)
                })()

                // 2. Upload to GridFS (Backup)
                const gridFSPromise = (async () => {
                    try {
                        const uploadGridFSPromises = imageFiles.map(async (file, idx) => {
                            const { postImage, thumbnail } = await processPostImage(file.buffer)
                            const filenameBase = `${user._id}_post_${Date.now()}_${idx}`
                            const imgRes = await uploadToGridFS(postImage, `${filenameBase}_post.webp`, 'image/webp')
                            
                            let thumbRes = null
                            if (idx === 0) {
                                thumbRes = await uploadToGridFS(thumbnail, `${filenameBase}_thumb.webp`, 'image/webp')
                            }
                            return { imgRes, thumbRes }
                        })

                        const uploadGridFSResults = await Promise.all(uploadGridFSPromises)
                        const getGridFSUrl = (fileId) => `${req.protocol}://${req.get('host')}/api/media/gridfs/${fileId}`

                        const media = uploadGridFSResults.map(res => ({
                            url: getGridFSUrl(res.imgRes.fileId),
                            fileId: res.imgRes.fileId
                        }))

                        const firstResult = uploadGridFSResults[0]
                        const thumbUrl = firstResult.thumbRes ? getGridFSUrl(firstResult.thumbRes.fileId) : null

                        return { media, thumbUrl }
                    } catch (gridfsErr) {
                        console.error("[GridFS Backup] Image post upload failed:", gridfsErr)
                        return null
                    }
                })()

                const [cloudinaryResults, gridFSResult] = await Promise.all([
                    cloudinaryPromise,
                    gridFSPromise
                ])

                post = new Post({ author: user._id, mediaType: 'image', caption: caption, images: [] })
                cloudinaryResults.forEach(item => {
                    post.images.push({ url: item.secure_url, public_id: item.public_id })
                })

                const thumbUrl = cloudinaryResults[0].secure_url.replace('/upload/', '/upload/w_250,h_250,c_fill,q_auto,f_auto/')
                post.thumbImage = thumbUrl

                if (gridFSResult) {
                    post.gridFsMedia = gridFSResult.media
                    post.gridFsThumbImage = gridFSResult.thumbUrl
                }
            }
            else {
                // 1. Upload to Cloudinary (Primary)
                const cloudinaryPromise = uploadToCloudinary(videoFile.buffer, 'momentia/posts', 'post', 'video')

                // 2. Upload to GridFS (Backup)
                const gridFSPromise = (async () => {
                    try {
                        const filename = `${user._id}_post_${Date.now()}_video`
                        const result = await uploadToGridFS(videoFile.buffer, filename, videoFile.mimetype)
                        const getGridFSUrl = (fileId) => `${req.protocol}://${req.get('host')}/api/media/gridfs/${fileId}`
                        return {
                            url: getGridFSUrl(result.fileId),
                            fileId: result.fileId
                        }
                    } catch (gridfsErr) {
                        console.error("[GridFS Backup] Video post upload failed:", gridfsErr)
                        return null
                    }
                })()

                const [cloudinaryResult, gridFSResult] = await Promise.all([
                    cloudinaryPromise,
                    gridFSPromise
                ])

                post = new Post({
                    author: req.user._id, mediaType: 'video', caption: caption,
                    video: { url: cloudinaryResult.secure_url, public_id: cloudinaryResult.public_id }
                })

                post.thumbImage = cloudinaryResult.secure_url
                    .replace(/\.[^/.]+$/, ".jpg")
                    .replace('/upload/', '/upload/w_250,h_250,c_fill,q_auto,f_auto/')

                if (gridFSResult) {
                    post.gridFsMedia = [{
                        url: gridFSResult.url,
                        fileId: gridFSResult.fileId
                    }]
                    post.gridFsThumbImage = post.thumbImage
                }
            }

            await post.save()
            await User.findByIdAndUpdate(user._id, { $inc: { totalPosts: 1 } })

            return res.status(200).json({ message: 'Post created succesfully!' })
        }
        catch (err) {
            console.log('error in upload post route 😂', err)
            return res.status(500).json({ message: "internal server error" })
        }
    }
)

router.delete("/delete-post/:id",
    async (req, res) => {
        try {
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

            // 1. Queue Cloudinary deletes
            if (post.mediaType === 'image') {
                post.images.forEach(item => {
                    if (item.public_id) {
                        deletePromises.push(deleteFromCloudinary(item.public_id, 'image'))
                    }
                })
            } else if (post.mediaType === 'video' && post.video?.public_id) {
                deletePromises.push(deleteFromCloudinary(post.video.public_id, 'video'))
            }

            // 2. Queue GridFS deletes
            if (post.gridFsMedia && post.gridFsMedia.length > 0) {
                post.gridFsMedia.forEach(item => {
                    if (item.fileId) {
                        deletePromises.push(deleteFromGridFS(item.fileId))
                    }
                })
            }
            if (post.gridFsThumbImage) {
                const extractFileIdFromUrl = (url) => {
                    if (!url || !url.includes('/api/media/gridfs/')) return null
                    const parts = url.split('/api/media/gridfs/')
                    return parts[parts.length - 1]
                }
                const thumbFileId = extractFileIdFromUrl(post.gridFsThumbImage)
                if (thumbFileId) {
                    deletePromises.push(deleteFromGridFS(thumbFileId))
                }
            }

            // Delete all in parallel
            if (deletePromises.length > 0) {
                await Promise.all(deletePromises).catch(err => console.error("Error deleting post media:", err))
            }

            await Post.findByIdAndDelete(post._id)
            await User.findByIdAndUpdate(user._id, { $inc: { totalPosts: -1 } })

            await Like.deleteMany({ parentPost: post._id })
            await Comment.deleteMany({ post: post._id })

            return res.status(200).json({ message: "Post deleted successfully!" })
        }
        catch (err) {
            console.log('error in delete-post route 😂', err)
            return res.status(500).json({ message: "Internal server Error" })
        }
    }
)

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
                // Delete old media from Cloudinary and GridFS in parallel
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

                if (post.gridFsMedia && post.gridFsMedia.length > 0) {
                    post.gridFsMedia.forEach(item => {
                        if (item.fileId) {
                            deletePromises.push(deleteFromGridFS(item.fileId))
                        }
                    })
                    post.gridFsMedia = []
                }
                if (post.gridFsThumbImage) {
                    const extractFileIdFromUrl = (url) => {
                        if (!url || !url.includes('/api/media/gridfs/')) return null
                        const parts = url.split('/api/media/gridfs/')
                        return parts[parts.length - 1]
                    }
                    const thumbFileId = extractFileIdFromUrl(post.gridFsThumbImage)
                    if (thumbFileId) {
                        deletePromises.push(deleteFromGridFS(thumbFileId))
                    }
                    post.gridFsThumbImage = undefined
                }

                if (deletePromises.length > 0) {
                    await Promise.all(deletePromises).catch(err => console.error("Error deleting old media on update:", err))
                }

                // Upload new media
                if (imageFiles.length > 0) {
                    // Cloudinary Upload
                    const cloudinaryPromise = (async () => {
                        const uploadPromises = imageFiles.map((file) => {
                            return uploadToCloudinary(file.buffer, 'momentia/posts', 'post', 'image')
                        })
                        return await Promise.all(uploadPromises)
                    })()

                    // GridFS Upload (Backup)
                    const gridFSPromise = (async () => {
                        try {
                            const uploadGridFSPromises = imageFiles.map(async (file, idx) => {
                                const { postImage, thumbnail } = await processPostImage(file.buffer)
                                const filenameBase = `${user._id}_post_${Date.now()}_${idx}`
                                const imgRes = await uploadToGridFS(postImage, `${filenameBase}_post.webp`, 'image/webp')
                                
                                let thumbRes = null
                                if (idx === 0) {
                                    thumbRes = await uploadToGridFS(thumbnail, `${filenameBase}_thumb.webp`, 'image/webp')
                                }
                                return { imgRes, thumbRes }
                            })

                            const uploadGridFSResults = await Promise.all(uploadGridFSPromises)
                            const getGridFSUrl = (fileId) => `${req.protocol}://${req.get('host')}/api/media/gridfs/${fileId}`

                            const media = uploadGridFSResults.map(res => ({
                                url: getGridFSUrl(res.imgRes.fileId),
                                fileId: res.imgRes.fileId
                            }))

                            const firstResult = uploadGridFSResults[0]
                            const thumbUrl = firstResult.thumbRes ? getGridFSUrl(firstResult.thumbRes.fileId) : null

                            return { media, thumbUrl }
                        } catch (gridfsErr) {
                            console.error("[GridFS Backup] Image post update failed:", gridfsErr)
                            return null
                        }
                    })()

                    const [cloudinaryResults, gridFSResult] = await Promise.all([
                        cloudinaryPromise,
                        gridFSPromise
                    ])

                    post.mediaType = 'image'
                    cloudinaryResults.forEach(item => {
                        post.images.push({ url: item.secure_url, public_id: item.public_id })
                    })

                    const thumbUrl = cloudinaryResults[0].secure_url.replace('/upload/', '/upload/w_250,h_250,c_fill,q_auto,f_auto/')
                    post.thumbImage = thumbUrl
                    post.video = undefined

                    if (gridFSResult) {
                        post.gridFsMedia = gridFSResult.media
                        post.gridFsThumbImage = gridFSResult.thumbUrl
                    }
                } else if (videoFile) {
                    // Cloudinary Upload
                    const cloudinaryPromise = uploadToCloudinary(videoFile.buffer, 'momentia/posts', 'post', 'video')

                    // GridFS Upload (Backup)
                    const gridFSPromise = (async () => {
                        try {
                            const filename = `${user._id}_post_${Date.now()}_video`
                            const result = await uploadToGridFS(videoFile.buffer, filename, videoFile.mimetype)
                            const getGridFSUrl = (fileId) => `${req.protocol}://${req.get('host')}/api/media/gridfs/${fileId}`
                            return {
                                url: getGridFSUrl(result.fileId),
                                fileId: result.fileId
                            }
                        } catch (gridfsErr) {
                            console.error("[GridFS Backup] Video post update failed:", gridfsErr)
                            return null
                        }
                    })()

                    const [cloudinaryResult, gridFSResult] = await Promise.all([
                        cloudinaryPromise,
                        gridFSPromise
                    ])

                    post.mediaType = 'video'
                    post.video = { url: cloudinaryResult.secure_url, public_id: cloudinaryResult.public_id }

                    post.thumbImage = cloudinaryResult.secure_url
                        .replace(/\.[^/.]+$/, ".jpg")
                        .replace('/upload/', '/upload/w_250,h_250,c_fill,q_auto,f_auto/')
                    post.images = []

                    if (gridFSResult) {
                        post.gridFsMedia = [{
                            url: gridFSResult.url,
                            fileId: gridFSResult.fileId
                        }]
                        post.gridFsThumbImage = post.thumbImage
                    }
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
                // do not send notification if post author is same as one who likes
                if (post.author.toString() !== user._id.toString()){
                    notificationBus.emit('post-liked',{...newLike.toObject(),postAuthor:post.author})
                }
                
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

