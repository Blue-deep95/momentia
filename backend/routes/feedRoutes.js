// this file is mainly used for sending posts to the user requesting them
const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const User = require('../models/User')
const Follow = require('../models/Follow')
const Post = require('../models/Post')
const Like = require('../models/Like')

// the main route that sends posts to the frontend
// the page indicates where the user is and we send the next 20 posts to based on the pages
// much work is required on theese routes in the future when sending information too much information is being sent to 
// the frontend now
router.get("/get-posts/:page",
    async (req, res) => {
        try {
            const user = req.user
            const page = parseInt(req.params.page) || 1
            const skip = (page - 1) * 20
            
            // need to write a proper aggregation with mongoose
            const postsToSend = await Post.aggregate([
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: 20 },
                // First join the author data
                {
                    $lookup: {
                        // Ok this a mongodb feauture where named collections change from singular
                        // word to plural
                        from: 'users',
                        localField: 'author',
                        foreignField: '_id',
                        as: 'authorDetails'
                    }
                },
                { $unwind: '$authorDetails' },
                // Checking if the user liked the post
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
                // check if the user follows the author or not
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
                        ], as: 'followStatus'
                    }
                },
                // transform to booleans
                {
                    $addFields: {
                        isLiked: { $gt: [{ $size: '$likedStatus' }, 0] },
                        isSaved: { $gt: [{ $size: '$savedStatus' }, 0] },
                        isFollowing: { $gt: [{ $size: '$followStatus' }, 0] }
                    }
                },
                // cleanup sensitive data
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
            ]
            )

            return res.status(200).json({ posts: postsToSend, message: "posts retreived succesfully" })
        }
        catch (err) {
            console.log("error in feedroutes get-posts", err)
            return res.status(500).json({ message: "Internal server error" })
        }
    }
)

router.get("/get-reels/:page",
    async (req, res) => {
        try {
            const user = req.user
            const page = parseInt(req.params.page) || 1
            const limit = 20
            const skip = (page - 1) * limit

            const reelsToSend = await Post.aggregate([
                { $match: { mediaType: 'video' } },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
                // again same as above but we will project the author details here
                {
                    $lookup: {
                        from: 'users',
                        let: { authorId: '$author' },
                        // start the pipeline to project only the required fields instead of everything
                        pipeline: [
                            {
                                $match: { $expr: { $eq: ['$_id', '$$authorId'] } }
                            },
                            {
                                $project: {
                                    username: 1,
                                    profilePicture: 1,
                                    fullName: 1
                                }
                            }
                        ],
                        as: 'authorDetails'
                    },
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
                // check if the user follows the author or not
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
                        ], as: 'followStatus'
                    }
                },
                // transform to booleans
                {
                    $addFields: {
                        isLiked: { $gt: [{ $size: '$likedStatus' }, 0] },
                        isSaved: { $gt: [{ $size: '$savedStatus' }, 0] },
                        isFollowing: { $gt: [{ $size: '$followStatus' }, 0] }
                    }
                },
                // cleanup sensitive data
                {
                    $project: {
                        likedStatus: 0,
                        savedStatus: 0,
                        followStatus: 0
                    }
                }
            ])

            return res.status(200).json({ reels: reelsToSend, message: "reels retrieved successfully" })
        }
        catch (err) {
            console.log('error in get-reels route', err)
            return res.status(500).json({ message: "Internal server Error" })
        }
    }
)


module.exports = router
