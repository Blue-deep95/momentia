// this route is mainly for creating, deleting, and updating comments

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');

const { notificationBus } = require('../events/event');
const { commentSchema } = require('../zodSchema/validationSchema');
const asyncHandler = require('../middleware/asyncHandler');

// this is only for top-level comments 
router.get("/get-comments/:postid/:page",
    asyncHandler(async (req, res) => {
        const { postid } = req.params
        const user = req.user

        if (!postid) {
            return res.status(400).json({ message: "Invalid parameters" })
        }

        const page = parseInt(req.params.page) || 1
        const limit = 25
        const skip = (page - 1) * limit

        const comments = await Comment.aggregate([
            {
                $match: {
                    post: new mongoose.Types.ObjectId(postid),
                    parent: null // Only top-level comments
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },

            // Lookup author details
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'authorDetails'
                }
            },
            { $unwind: '$authorDetails' },

            // Check if current user liked the comment
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
            {
                $addFields: {
                    isLiked: { $gt: [{ $size: '$likeStatus' }, 0] }
                }
            },
            {
                $project: {
                    likeStatus: 0,
                    'authorDetails.password': 0,
                    'authorDetails.email': 0,
                    'authorDetails.refreshToken': 0,
                    'authorDetails.otp': 0,
                    'authorDetails.savedPosts': 0,
                    'authorDetails.blockedUsers': 0
                }
            }
        ])

        return res.status(200).json({ comments, message: "Comments fetched successfully" })
    })
)

// get-replies route for nested replies
router.get("/get-replies/:postid/:parentid/:page",
    asyncHandler(async (req, res) => {
        const { postid, parentid } = req.params
        const user = req.user

        if (!postid || !parentid) {
            return res.status(400).json({ message: "Invalid parameters" })
        }
        const page = parseInt(req.params.page) || 1
        const limit = 25
        const skip = (page - 1) * limit

        const replies = await Comment.aggregate([
            {
                $match: {
                    post: new mongoose.Types.ObjectId(postid),
                    parent: new mongoose.Types.ObjectId(parentid)
                }
            },
            { $sort: { totalLikes: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },

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
                    from: 'users',
                    localField: 'reference',
                    foreignField: '_id',
                    as: 'referencedUser'
                }
            },
            {
                $unwind: {
                    path: '$referencedUser',
                    preserveNullAndEmptyArrays: true
                }
            },
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
            {
                $addFields: {
                    isLiked: { $gt: [{ $size: '$likeStatus' }, 0] }
                }
            },
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
    })
)

// This route is mainly for adding comments 
router.post("/create-comment",
    asyncHandler(async (req, res) => {
        const { content, postid, parent, reference, referenceComment } = req.body;
        const user = req.user;

        if (!postid) {
            return res.status(400).json({ message: "Invalid comment" });
        }

        const validation = commentSchema.safeParse(content);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: validation.error.errors.map((err) => err.message),
            });
        }
        const validatedContent = validation.data;

        // Prepare the base comment data
        const commentData = {
            author: user._id,
            post: postid,
            content: validatedContent
        };

        if (reference && reference.toString() == user._id.toString()) {
            return res.status(400).json({ message: "You can't reply to yourself!" })
        }

        // Add nesting fields if they exist
        if (parent) {
            commentData.parent = parent;
            commentData.reference = reference;
            commentData.referenceComment = referenceComment
        }

        const comment = new Comment(commentData);
        await comment.save();

        if (parent) {
            await Comment.findByIdAndUpdate(parent, { $inc: { totalReplies: 1 } });
        }

        const updatedPost = await Post.findByIdAndUpdate(postid, { $inc: { totalComments: 1 } });

        if (updatedPost && updatedPost.author.toString() !== user._id.toString()) {
            notificationBus.emit('comment-posted', {
                author: user._id,
                postAuthor: updatedPost.author,
                postTarget: postid,
                commentId: comment._id,
                isReply: !!parent
            });
        }

        if (parent && commentData.reference) {
            notificationBus.emit('comment-reply', {
                author: user._id,
                repliedTo: commentData.reference,
                repliedToComment: commentData.referenceComment,
                postAuthor: updatedPost ? updatedPost.author : null,
                postTarget: postid,
                commentId: comment._id
            });
        }

        return res.status(200).json({ message: "Comment added successfully", comment });
    })
);

router.put("/update-comment",
    asyncHandler(async (req, res) => {
        const user = req.user
        const { content, commentId } = req.body

        if (!commentId) {
            return res.status(400).json({ message: "Invalid operation" })
        }

        const validation = commentSchema.safeParse(content);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: validation.error.errors.map((err) => err.message),
            });
        }
        const validatedContent = validation.data;

        const comment = await Comment.findById(commentId)
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' })
        }

        if (comment.author.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to edit this comment' })
        }

        comment.content = validatedContent
        await comment.save()

        return res.status(200).json({ message: "Comment edit succesful" })
    })
)

router.delete("/delete-comment/:commentId",
    asyncHandler(async (req, res) => {
        const user = req.user
        const { commentId } = req.params

        const comment = await Comment.findById(commentId)

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" })
        }

        if (comment.author.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this comment" })
        }

        const deletedReplies = await Comment.deleteMany({ parent: commentId })
        const totalDeletedCount = deletedReplies.deletedCount + 1

        await Comment.findByIdAndDelete(commentId)

        if (comment.parent) {
            await Comment.findByIdAndUpdate(comment.parent, { $inc: { totalReplies: -1 } })
        }

        await Post.findByIdAndUpdate(comment.post, { $inc: { totalComments: -totalDeletedCount } })

        return res.status(200).json({
            message: "Comment and its replies deleted successfully",
            deletedCount: totalDeletedCount
        })
    })
)

// toggle likes on comments
router.post("/toggle-like/:commentid",
    asyncHandler(async (req, res) => {
        const { commentid } = req.params
        const user = req.user

        if (!commentid) {
            return res.status(400).json({ message: "Invalid comment id" })
        }

        const comment = await Comment.findById(commentid)
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" })
        }

        const existingLike = await Like.findOne({
            author: user._id,
            commentTarget: commentid,
            likeType: 'comment'
        })

        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id)

            if (comment.author.toString() !== user._id.toString()) {
                notificationBus.emit("comment-unliked", {
                    author: user._id,
                    commentAuthor: comment.author,
                    commentTarget: comment._id
                })
            }
            await Comment.findByIdAndUpdate(commentid, { $inc: { totalLikes: -1 } })
            return res.status(200).json({ message: "Comment unliked successfully", isLiked: false })
        } else {
            const newLike = new Like({
                author: user._id,
                likeType: 'comment',
                parentPost: comment.post,
                commentTarget: commentid
            })
            await newLike.save()

            if (comment.author.toString() !== user._id.toString()) {
                notificationBus.emit("comment-liked", {
                    author: user._id,
                    commentAuthor: comment.author,
                    commentTarget: comment._id
                })
            }
            await Comment.findByIdAndUpdate(commentid, { $inc: { totalLikes: 1 } })
            return res.status(200).json({ message: "Comment liked successfully", isLiked: true })
        }
    })
)

module.exports = router;
