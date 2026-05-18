// this route is mainly for creating,deleting updating comments

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');


// need to implement get-comments route here 
// this is only for top-level comments 
router.get("/get-comments/:postid/:page",
    async (req, res) => {
        try {
            const { postid } = req.params
            const user = req.user

            if (!postid) {
                return res.status(400).json({ message: "Invalid parameters" })
            }

            // Corrected parameter parsing
            const page = parseInt(req.params.page) || 1
            const limit = 25
            const skip = (page - 1) * limit

            // aggregate 
            const comments = await Comment.aggregate([
                {
                    $match: {
                        post: new mongoose.Types.ObjectId(postid),
                        parent: null // Only top-level comments
                    }
                },
                { $sort: { 'totalLikes': -1, 'createdAt': -1 } }, // Sort by most liked and newest

                { $skip: skip },
                { $limit: limit },

                // first join the users data to get author details
                {
                    $lookup: {
                        from: 'users',
                        localField: 'author',
                        foreignField: '_id',
                        as: 'authorDetails'
                    }
                },
                { $unwind: '$authorDetails' },

                // lookup the data from Likes to tell if the user liked that comment or not
                {
                    $lookup: {
                        from: 'likes',
                        let: { commentId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$likeType', 'comment'] },
                                            { $eq: ['$author', new mongoose.Types.ObjectId(user._id)] },
                                            { $eq: ['$commentTarget', '$$commentId'] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'likedStatus'
                    }
                },
                // finally we need to add fields that have whether user liked the post or not
                // totalReplies is already part of the document so it is sent automatically
                {
                    $addFields: {
                        isLiked: { $gt: [{ $size: '$likedStatus' }, 0] }
                    }
                },
                // remove unnecessary user information when sending information
                {
                    $project: {
                        likedStatus: 0,
                        'authorDetails.password': 0,
                        'authorDetails.email': 0,
                        'authorDetails.refreshToken': 0,
                        'authorDetails.otp': 0,
                        'authorDetails.savedPosts': 0,
                        'authorDetails.blockedUsers': 0,
                        'authorDetails.otpExpiry': 0
                    }
                }
            ])

            return res.status(200).json({ comments, message: "Comments fetched successfully" })
        }
        catch (err) {
            console.log("error in get-comments route", err)
            return res.status(500).json({ message: "Internal server error" })
        }
    }
)

// seperate get-replies route instead of get-comments route to simplfy frontend logic
router.get("/get-replies/:postid/:parentid/:page",
    async (req, res) => {
        try {
            const { postid, parentid } = req.params
            const user = req.user

            if (!postid || !parentid) {
                return res.status(400).json({ message: "Invalid parameters" })
            }
            const page = parseInt(req.params.page) || 1
            const limit = 25
            const skip = (page - 1) * limit

            // aggregation start
            
            const replies = await Comment.aggregate([
                // first match the comments with the postid and parentid
                {
                    $match: {
                        post: new mongoose.Types.ObjectId(postid),
                        parent: new mongoose.Types.ObjectId(parentid)
                    }
                },
                { $sort: { totalLikes: -1, createdAt: -1 } },

                { $skip: skip },
                { $limit: limit },

                // the first lookup is for author details
                {
                    $lookup: {
                        from: 'users',
                        localField: 'author',
                        foreignField: '_id',
                        as: 'authorDetails'
                    }
                },
                { $unwind: '$authorDetails' },
                // now perform a second lookup for referenced users (the user being replied to)
                {
                    $lookup: {
                        from: 'users',
                        localField: 'reference',
                        foreignField: '_id',
                        as: 'referencedUser'
                    }
                },
                // IMPORTANT: Use preserveNullAndEmptyArrays so we don't lose replies that have no reference
                {
                    $unwind: {
                        path: '$referencedUser',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Now to check whether the current user liked the reply or not
                {
                    $lookup: {
                        from: 'likes',
                        let: { commentId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$likeType', 'comment'] },
                                            { $eq: ['$author', new mongoose.Types.ObjectId(user._id)] },
                                            { $eq: ['$commentTarget', '$$commentId'] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'likeStatus'
                    }
                },
                // add fields for easy frontend access
                {
                    $addFields: {
                        isLiked: { $gt: [{ $size: '$likeStatus' }, 0] }
                    }
                },
                // remove unnecessary information
                {
                    $project: {
                        likeStatus: 0,
                        'authorDetails.password': 0,
                        'authorDetails.email': 0,
                        'authorDetails.refreshToken': 0,
                        'authorDetails.otp': 0,
                        'authorDetails.savedPosts': 0,
                        'authorDetails.blockedUsers': 0,
                        'authorDetails.otpExpiry': 0,
                        'referencedUser.password': 0,
                        'referencedUser.email': 0,
                        'referencedUser.refreshToken': 0,
                        'referencedUser.otp': 0,
                        'referencedUser.savedPosts': 0,
                        'referencedUser.blockedUsers': 0,
                        'referencedUser.otpExpiry': 0,
                        'referencedUser.profilePicture': 0
                    }
                }
            ])



            return res.status(200).json({ replies, message: "Replies fetched successfully" })
        }
        catch (err) {
            console.log('Error in get-replies route', err)
            return res.status(500).json({ message: "Internal server Error" })
        }
    }
)

// This route is mainly for adding comments 
router.post("/create-comment",
    async (req, res) => {
        try {
            const { content, postid, parent, reference } = req.body;
            const user = req.user;

            if (!postid || !content) {
                return res.status(400).json({ message: "Invalid comment" });
            }

            // Prepare the base comment data
            const commentData = {
                author: user._id,
                post: postid,
                content: content
            };

            // here we have to prevent the ability of the user to reply to himself
            if (reference && reference.toString() == user._id.toString()) {
                return res.status(400).json({ message: "You can't reply to yourself!" })
            }

            // Add nesting fields if they exist
            if (parent) {
                commentData.parent = parent;
                commentData.reference = reference;
            }

            const comment = new Comment(commentData);
            await comment.save();

            // Update parent's reply count if it's a reply
            if (parent) {
                await Comment.findByIdAndUpdate(parent, { $inc: { totalReplies: 1 } });
            }

            // Update post's comment count
            await Post.findByIdAndUpdate(postid, { $inc: { totalComments: 1 } });

            return res.status(200).json({ message: "Comment added successfully", comment });
        }
        catch (err) {
            console.log("error in /create-comment route ", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
);

router.put("/update-comment",
    async (req, res) => {
        try {
            const user = req.user
            const { content, commentId } = req.body

            if (!content || !commentId) {
                return res.status(400).json({ message: "Invalid operation" })
            }
            // get the comment 
            const comment = await Comment.findById(commentId)
            if (!comment) {
                return res.status(404).json({ message: 'Comment not found' })
            }

            if (comment.author.toString() !== user._id.toString()) {
                return res.status(403).json({ message: 'Unauthorized to edit this comment' })
            }

            comment.content = content
            await comment.save()

            return res.status(200).json({ message: "Comment edit succesful" })

        }
        catch (err) {
            console.log("error in update-comment route", err)
            return res.status(500).json({ message: "Internal server error" })
        }
    }
)

router.delete("/delete-comment/:commentId",
    async (req, res) => {
        try {
            const user = req.user
            const { commentId } = req.params

            // Find the comment first to get post and parent info
            const comment = await Comment.findById(commentId)

            if (!comment) {
                return res.status(404).json({ message: "Comment not found" })
            }

            // Check if user is the author
            if (comment.author.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "Unauthorized to delete this comment" })
            }

            // 1. Delete all nested replies first
            const deletedReplies = await Comment.deleteMany({ parent: commentId })
            const totalDeletedCount = deletedReplies.deletedCount + 1

            // 2. Delete the main comment
            await Comment.findByIdAndDelete(commentId)

            // 3. Decrement parent's reply count if the deleted comment itself was a reply
            if (comment.parent) {
                await Comment.findByIdAndUpdate(comment.parent, { $inc: { totalReplies: -1 } })
            }

            // 4. Decrement post's comment count by the total number of deleted documents (parent + children)
            await Post.findByIdAndUpdate(comment.post, { $inc: { totalComments: -totalDeletedCount } })

            return res.status(200).json({
                message: "Comment and its replies deleted successfully",
                deletedCount: totalDeletedCount
            })

        }
        catch (err) {
            console.log("Error in delete-comment route", err)
            return res.status(500).json({ message: "Internal server error" })
        }
    }
)

// this route is for toggling likes on comments (like/unlike)
router.post("/toggle-like/:commentid",
    async (req, res) => {
        try {
            const { commentid } = req.params
            const user = req.user

            if (!commentid) {
                return res.status(400).json({ message: "Invalid comment id" })
            }

            // Check if the comment exists
            const comment = await Comment.findById(commentid)
            if (!comment) {
                return res.status(404).json({ message: "Comment not found" })
            }

            // Check if the user already liked the comment
            const existingLike = await Like.findOne({
                author: user._id,
                commentTarget: commentid,
                likeType: 'comment'
            })

            if (existingLike) {
                // If it exists, UNLIKE it
                await Like.findByIdAndDelete(existingLike._id)
                await Comment.findByIdAndUpdate(commentid, { $inc: { totalLikes: -1 } })
                return res.status(200).json({ message: "Comment unliked successfully", isLiked: false })
            } else {
                // If it doesn't exist, LIKE it
                // INCLUDING NEW parentPost field to help us find and delete likes faster
                const newLike = new Like({
                    author: user._id,
                    likeType: 'comment',
                    parentPost: comment.post,
                    commentTarget: commentid
                })
                await newLike.save()
                await Comment.findByIdAndUpdate(commentid, { $inc: { totalLikes: 1 } })
                return res.status(200).json({ message: "Comment liked successfully", isLiked: true })
            }
        }
        catch (err) {
            console.log("Error in /comment/toggle-like route ", err)
            return res.status(500).json({ message: "Internal server error" })
        }
    }
)

module.exports = router;
