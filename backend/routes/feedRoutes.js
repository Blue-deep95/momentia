// this file is mainly used for sending posts to the user requesting them
const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const User = require('../models/User')
const Follow = require('../models/Follow')
const Post = require('../models/Post')
const Like = require('../models/Like')
const {protect}  = require('../middleware/authMiddleware')
const encodeCursor = (obj) => {
    return Buffer.from(JSON.stringify(obj)).toString('base64');
};

const decodeCursor = (cursorStr) => {
    try {
        return JSON.parse(Buffer.from(cursorStr, 'base64').toString('utf-8'));
    } catch (err) {
        return null;
    }
};

// this route is only for getting the first 10 most liked posts on the feed page.
// users can see this page even if they are not logged in but any interaction with the posts 
// ask the user to login 
router.get("/get-mainpage",async(req,res) =>{
    try{
        // since this page does not need any user we just get the top 10 most liked posts 
        const postsToSend = await Post.aggregate([
            {$sort:{totalLikes:-1} },
            {$limit:10},
            // join the author data
            {
                $lookup:{
                    from:'users',
                    localField:'author',
                    foreignField:'_id',
                    pipeline:[{$project:{_id:1,username:1,profilePicture:1}}],
                    as:'authorDetails'
                }
            },
            {$unwind:'$authorDetails'},
            {
                $addFields:{
                    isLiked:false,
                    isFollowing:false,
                    isSaved:false
                }
        }
        ])
        return res.status(200).json({message:"Posts fetched succesfully",posts:postsToSend})
    }
    catch(err){
        console.log("Error in get-mainpage route",err)
        return res.status(500).json({message:"Internal server error"})
    }
})

// this route is mainly for getting the posts uploaded by secret users and display them on the main screen
// this too will not have any protection from authmiddleware
router.get("/get-carousel",async(req,res) => {
    try{
        // let's include pagination later if the posts themselves are good for now just send everything
        const carouselItems = await User.aggregate([
            {$match:{userType:'cdg'}},
            // try to lookup all the posts by someone with userType:cdg
            {
                $lookup:{
                    from:'posts',
                    localField:'_id',
                    foreignField:'author',
                    as:'postDetails'
                }
            },
            {$unwind:'$postDetails'},
            // Sort to show the latest secret/carousel posts first
            {$sort:{'postDetails.createdAt':-1}},
            {$project:{
                _id: '$postDetails._id',
                caption: '$postDetails.caption',
                mediaType: '$postDetails.mediaType',
                thumbImage: '$postDetails.thumbImage',
                images: '$postDetails.images',
                video: '$postDetails.video',
                totalLikes: '$postDetails.totalLikes',
                totalComments: '$postDetails.totalComments',
                createdAt: '$postDetails.createdAt',
                authorDetails:{
                    _id: '$_id',
                    username: '$username',
                    name: '$name',
                    profilePicture: '$profilePicture',
                    email: '$email'
                }
            }}

        ])

        return res.status(200).json({message:"Carousel items fetched succesfully",carouselItems})

    }
    catch(err){
        console.log("Error in get-carousel route",err)
        return res.status(500).json({message:"Internal server error"})
    }
})

// the main route that sends posts to the frontend
router.get("/get-posts",protect,
    async (req, res) => {
        try {
            const user = req.user
            const limitCount = 20
            const cursorStr = req.query.cursor
            const cursor = cursorStr ? decodeCursor(cursorStr) : null

            // 1. Calculate the 2-day time boundary for followed users
            const twoDaysAgo = new Date()
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

            // 2. Fetch the user's social graph
            const followingRelationships = await Follow.find({ host: user._id }).select('target')
            const followedIds = followingRelationships.map(rel => rel.target)
            
            // Include the logged-in user so their own recent posts are prioritized too
            const priorityAuthors = [...followedIds, new mongoose.Types.ObjectId(user._id)]

            let postsToSend = []

            if (cursor && cursor.feedGroup === 2) {
                // STREAM 2 ONLY (past feedGroup 1)
                postsToSend = await Post.aggregate([
                    {
                        $match: {
                            $and: [
                                {
                                    $or: [
                                        { author: { $nin: priorityAuthors } },
                                        { createdAt: { $lt: twoDaysAgo } }
                                    ]
                                },
                                {
                                    $or: [
                                        { createdAt: { $lt: new Date(cursor.createdAt) } },
                                        {
                                            createdAt: new Date(cursor.createdAt),
                                            _id: { $lt: new mongoose.Types.ObjectId(cursor.id) }
                                        }
                                    ]
                                }
                            ]
                        }
                    },
                    { $addFields: { feedGroup: 2 } },
                    {
                        $sort: {
                            createdAt: -1,
                            _id: -1
                        }
                    },
                    { $limit: limitCount + 1 },
                    // First join the author data
                    {
                        $lookup: {
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
                ])
            } else {
                // STREAM 1 (with potential cursor) UNION STREAM 2
                const stream1Match = {
                    author: { $in: priorityAuthors },
                    createdAt: { $gte: twoDaysAgo }
                }

                if (cursor && cursor.feedGroup === 1) {
                    stream1Match.$or = [
                        { createdAt: { $lt: new Date(cursor.createdAt) } },
                        {
                            createdAt: new Date(cursor.createdAt),
                            _id: { $lt: new mongoose.Types.ObjectId(cursor.id) }
                        }
                    ]
                }

                postsToSend = await Post.aggregate([
                    { $match: stream1Match },
                    { $addFields: { feedGroup: 1 } },
                    {
                        $unionWith: {
                            coll: "posts",
                            pipeline: [
                                {
                                    $match: {
                                        $or: [
                                            { author: { $nin: priorityAuthors } },
                                            { createdAt: { $lt: twoDaysAgo } }
                                        ]
                                    }
                                },
                                { $addFields: { feedGroup: 2 } }
                            ]
                        }
                    },
                    {
                        $sort: {
                            feedGroup: 1,
                            createdAt: -1,
                            _id: -1
                        }
                    },
                    { $limit: limitCount + 1 },
                    // First join the author data
                    {
                        $lookup: {
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
                ])
            }

            const hasNextPage = postsToSend.length > limitCount
            if (hasNextPage) {
                postsToSend.pop()
            }

            const nextCursor = postsToSend.length > 0 ? encodeCursor({
                feedGroup: postsToSend[postsToSend.length - 1].feedGroup,
                createdAt: postsToSend[postsToSend.length - 1].createdAt,
                id: postsToSend[postsToSend.length - 1]._id
            }) : null

            return res.status(200).json({ 
                posts: postsToSend, 
                nextCursor, 
                hasNextPage, 
                message: "posts retreived successfully" 
            })
        }
        catch (err) {
            console.log("error in feedroutes get-posts", err)
            return res.status(500).json({ message: "Internal server error" })
        }
    }
)

router.get("/get-reels",protect,
    async (req, res) => {
        try {
            const user = req.user
            const limit = 20
            const cursorStr = req.query.cursor
            const cursor = cursorStr ? decodeCursor(cursorStr) : null

            const matchQuery = { mediaType: 'video' }
            if (cursor) {
                matchQuery.$or = [
                    { createdAt: { $lt: new Date(cursor.createdAt) } },
                    {
                        createdAt: new Date(cursor.createdAt),
                        _id: { $lt: new mongoose.Types.ObjectId(cursor.id) }
                    }
                ]
            }

            const reelsToSend = await Post.aggregate([
                { $match: matchQuery },
                { $sort: { createdAt: -1, _id: -1 } },
                { $limit: limit + 1 },
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

            const hasNextPage = reelsToSend.length > limit
            if (hasNextPage) {
                reelsToSend.pop()
            }

            const nextCursor = reelsToSend.length > 0 ? encodeCursor({
                createdAt: reelsToSend[reelsToSend.length - 1].createdAt,
                id: reelsToSend[reelsToSend.length - 1]._id
            }) : null

            return res.status(200).json({ 
                reels: reelsToSend, 
                nextCursor,
                hasNextPage,
                message: "reels retrieved successfully" 
            })
        }
        catch (err) {
            console.log('error in get-reels route', err)
            return res.status(500).json({ message: "Internal server Error" })
        }
    }
)


module.exports = router
