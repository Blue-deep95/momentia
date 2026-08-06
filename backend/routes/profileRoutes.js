// routes for getting information about user profiles, uploading profile images, and updating settings

const express = require('express')
const mongoose = require('mongoose')
const User = require('../models/User')
const Follow = require('../models/Follow.js')
const Post = require('../models/Post')
const multer = require('multer')

const router = express.Router()
const uploadToCloudinary = require('../utils/uploadToCloudinary')
const deleteFromCloudinary = require('../utils/deleteFromCloudinary')
const asyncHandler = require('../middleware/asyncHandler')

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5 mb limit per profile picture
})

// route for getting only the user saved posts 
router.get("/get-savedposts/:id",
    asyncHandler(async (req, res) => {
        let { id } = req.params;
        const userId = req.user._id;

        if (!id) {
            id = userId;
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const user = await User.findById(id).select("savedPosts");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const paginatedSavedPostIds = user.savedPosts.slice(skip, skip + limit);

        const posts = await Post.find({ _id: { $in: paginatedSavedPostIds } })
            .select("caption thumbImage totalLikes totalComments totalShares author createdAt")
            .populate("author", "username profilePicture");

        return res.status(200).json({
            message: "Saved posts fetched successfully",
            posts,
            currentPage: page,
            totalPages: Math.ceil(user.savedPosts.length / limit),
            totalSavedPosts: user.savedPosts.length,
        });
    })
);

// route for getting posts of a specific user
router.get("/get-posts/:id",
    asyncHandler(async (req, res) => {
        let { id } = req.params;
        const userId = req.user._id;

        if (!id) {
            id = userId;
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const totalUserPosts = await Post.countDocuments({ author: id });

        const posts = await Post.find({ author: id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("caption thumbImage mediaType totalLikes totalComments totalShares createdAt")
            .populate("author", "username profilePicture");

        return res.status(200).json({
            message: "User posts fetched successfully",
            posts,
            currentPage: page,
            totalPages: Math.ceil(totalUserPosts / limit),
            totalPosts: totalUserPosts,
        });
    })
);

// route for getting general profile details
router.get("/get-profile/:id",
    asyncHandler(async (req, res) => {
        let { id } = req.params;
        const currentUserId = req.user._id;

        if (!id) {
            id = currentUserId;
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const userProfile = await User.findById(id).select(
            "-password -refreshToken -newRefreshToken -otp -otpExpiry"
        );

        if (!userProfile) {
            return res.status(404).json({ message: "User profile not found" });
        }

        const isFollowing = await Follow.exists({
            host: currentUserId,
            target: id,
        });

        const isSelf = currentUserId.toString() === id.toString();

        return res.status(200).json({
            message: "Profile fetched successfully",
            profile: {
                ...userProfile.toObject(),
                isFollowing: Boolean(isFollowing),
                isSelf,
            },
        });
    })
);

// route for suggested profiles
router.get("/get-suggested-users",
    asyncHandler(async (req, res) => {
        const currentUserId = new mongoose.Types.ObjectId(req.user._id);

        const suggestedUsers = await User.aggregate([
            { $match: { _id: { $ne: currentUserId } } },
            {
                $lookup: {
                    from: 'follows',
                    let: { targetId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$host', currentUserId] },
                                        { $eq: ['$target', '$$targetId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'followStatus'
                }
            },
            { $match: { followStatus: { $size: 0 } } },
            { $sort: { followers: -1 } },
            { $limit: 6 },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    name: 1,
                    profilePicture: {
                        profileView: 1,
                        commentView: 1
                    },
                    followers: 1
                }
            }
        ])

        return res.status(200).json({ users: suggestedUsers, message: "Suggested users fetched successfully" })
    })
)

// uploading profile avatar
router.post("/upload-avatar",
    upload.single('avatar'),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ message: "No image provided" })
        }
        const userId = req.user._id

        const user = await User.findById(userId)
        if (!user) {
            return res.status(400).json({ message: "invalid user" })
        }

        const old_public_id = user.profilePicture?.original?.public_id
        if (old_public_id) {
            await deleteFromCloudinary(old_public_id, 'image').catch(err => console.error("Error deleting old avatar:", err))
        }

        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'momentia/profiles', 'avatar', 'image')

        const profileViewUrl = cloudinaryResult.secure_url.replace('/upload/', '/upload/w_400,h_400,c_fill,g_face,q_auto/')
        const commentViewUrl = cloudinaryResult.secure_url.replace('/upload/', '/upload/w_50,h_50,c_fill,g_face,q_auto/')

        const updateData = {
            profilePicture: {
                original: {
                    url: cloudinaryResult.secure_url,
                    public_id: cloudinaryResult.public_id
                },
                profileView: profileViewUrl,
                commentView: commentViewUrl
            }
        }

        await User.findByIdAndUpdate(userId, updateData)
        return res.status(200).json({ message: 'Profile picture updated succesfully' })
    })
)

// removing profile picture
router.delete("/remove-avatar",
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user._id)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const publicId = user.profilePicture?.original?.public_id

        if (!publicId) {
            return res.status(400).json({ message: "User profile picture does not exist" })
        }

        await deleteFromCloudinary(publicId, 'image').catch(err => console.error("Error removing avatar file:", err))

        user.profilePicture = {
            original: { url: null, public_id: null },
            profileView: null,
            commentView: null
        }

        await user.save()
        return res.status(200).json({ message: "Removal of avatar succesfull" })
    })
)

// editing bio, name, gender, username
router.post("/edit-profile",
    asyncHandler(async (req, res) => {
        const { bio, name, gender, username } = req.body
        const userId = req.user._id

        const user = await User.findById(userId)
        if (!user) {
            return res.status(400).json({ message: "No such user exists" })
        }

        if (username && username !== user.username) {
            const isUserNameTaken = await User.findOne({ username: username })
            if (isUserNameTaken) {
                return res.status(400).json({ message: "Username already taken please choose another one" })
            }
            user.username = username
        }

        if (bio !== undefined) user.bio = bio;
        if (name !== undefined) user.name = name;
        if (gender !== undefined) user.gender = gender;

        await user.save()

        return res.status(200).json({
            message: 'Profile update succesful',
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
            },
        })
    })
)

// getting followers list
router.get("/get-followers/:id",
    asyncHandler(async (req, res) => {
        const { id } = req.params
        const currentUserId = new mongoose.Types.ObjectId(req.user._id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const followers = await Follow.aggregate([
            { $match: { target: new mongoose.Types.ObjectId(id) } },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'host',
                    foreignField: '_id',
                    as: 'followerData'
                }
            },
            { $unwind: '$followerData' },
            {
                $lookup: {
                    from: 'follows',
                    let: { followerId: '$followerData._id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$host', currentUserId] },
                                        { $eq: ['$target', '$$followerId'] }
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
                    isFollowing: { $gt: [{ $size: '$followStatus' }, 0] }
                }
            },
            {
                $project: {
                    _id: 0,
                    userId: '$followerData._id',
                    username: '$followerData.username',
                    name: '$followerData.name',
                    profilePicture: '$followerData.profilePicture.commentView',
                    isFollowing: 1
                }
            }
        ]);

        return res.status(200).json({
            followers: followers,
            message: "Followers list retrieved successfully"
        })
    })
)

// getting following list
router.get("/get-following/:id",
    asyncHandler(async (req, res) => {
        const { id } = req.params
        const currentUserId = new mongoose.Types.ObjectId(req.user._id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const following = await Follow.aggregate([
            { $match: { host: new mongoose.Types.ObjectId(id) } },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'target',
                    foreignField: '_id',
                    as: 'followingData'
                }
            },
            { $unwind: '$followingData' },
            {
                $lookup: {
                    from: 'follows',
                    let: { targetId: '$followingData._id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$host', currentUserId] },
                                        { $eq: ['$target', '$$targetId'] }
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
                    isFollowing: { $gt: [{ $size: '$followStatus' }, 0] }
                }
            },
            {
                $project: {
                    _id: 0,
                    userId: '$followingData._id',
                    username: '$followingData.username',
                    name: '$followingData.name',
                    profilePicture: '$followingData.profilePicture.commentView',
                    isFollowing: 1
                }
            }
        ]);

        return res.status(200).json({
            following: following,
            message: "Following list retrieved successfully"
        })
    })
)

module.exports = router
