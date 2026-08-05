const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Post = require('../models/Post')
const asyncHandler = require('../middleware/asyncHandler')

// this route works as a search for users 
router.get("/search-users/:query/:page",
    asyncHandler(async (req, res) => {
        const { query } = req.params
        const page = req.params.page || 1
        const limit = 30
        const skip = (parseInt(page) - 1) * limit

        if (!query) {
            return res.status(200).json({ results: [], message: "Query is empty" })
        }

        // Using Regex for partial matching
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { name: { $regex: query, $options: 'i' } }
            ],
            _id: { $ne: req.user._id }
        })
        .select('_id username name profilePicture followers following')
        .skip(skip)
        .limit(limit)

        return res.status(200).json({ results: users, message: 'Results acquired successfully' })
    })
)

// same as above but now for posts 
router.get("/search-posts/:query/:page",
    asyncHandler(async (req, res) => {
        const { query } = req.params
        const page = req.params.page || 1
        const limit = 30
        const skip = (parseInt(page) - 1) * limit

        if (!query) {
            return res.status(200).json({ results: [], message: "Query is empty" })
        }

        // Using Regex for partial matching
        const queriedPosts = await Post.find({
            caption: { $regex: query, $options: 'i' },
            author: { $ne: req.user._id }
        })
        .select('_id author thumbImage totalLikes caption')
        .skip(skip)
        .limit(limit)

        return res.status(200).json({ results: queriedPosts, message: "Results acquired succesfully" })
    })
)

module.exports = router
