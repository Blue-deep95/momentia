const express = require("express")
const router = express.Router()
const { notificationBus } = require('../events/event.js')
const Follow = require('../models/Follow.js')
const User = require('../models/User.js')
const asyncHandler = require('../middleware/asyncHandler')

router.post("/follow-user",
    asyncHandler(async (req, res) => {
        const user = req.user
        const { targetId } = req.body

        // deny following yourself or an invalid target
        if (!targetId || targetId === user._id.toString()) {
            return res.status(400).json({ message: "Invalid target" })
        }

        // Check if target user exists
        const targetUser = await User.findById(targetId)
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" })
        }

        const isFollowing = await Follow.findOne({ host: user._id, target: targetId })

        if (isFollowing) {
            return res.status(403).json({ message: "Already following the user" })
        }

        const newFollow = new Follow({
            host: user._id,
            target: targetId
        })

        await newFollow.save()
        // emit notification 
        notificationBus.emit('follow-user', { ...newFollow.toObject() })

        // Update counts
        await User.findByIdAndUpdate(user._id, { $inc: { following: 1 } })
        await User.findByIdAndUpdate(targetId, { $inc: { followers: 1 } })

        return res.status(200).json({ message: "User followed succesfully" })
    })
)

router.delete("/unfollow-user/:targetId",
    asyncHandler(async (req, res) => {
        const user = req.user
        const { targetId } = req.params

        if (!targetId || targetId === user._id.toString()) {
            return res.status(400).json({ message: "Invalid target" })
        }

        const followRecord = await Follow.findOneAndDelete({ host: user._id, target: targetId })

        if (!followRecord) {
            return res.status(400).json({ message: "You are not following this user" })
        }

        // emit unfollow event to cleanup notification
        notificationBus.emit('unfollow-user', { ...followRecord.toObject() })

        // Update counts
        await User.findByIdAndUpdate(user._id, { $inc: { following: -1 } })
        await User.findByIdAndUpdate(targetId, { $inc: { followers: -1 } })

        return res.status(200).json({ message: "Unfollowed succesfully" })
    })
)

// this route is mainly for removing your followers if you do not like them or want 
// them removed
router.delete("/remove-follower/:hostId",
    asyncHandler(async (req, res) => {
        const user = req.user
        const { hostId } = req.params

        // deny removing yourself or an invalid host
        if (!hostId || hostId === user._id.toString()) {
            return res.status(400).json({ message: "Invalid host" })
        }

        const followRecord = await Follow.findOneAndDelete({ host: hostId, target: user._id })
        if (!followRecord) {
            return res.status(400).json({ message: "This user is not following you" })
        }

        // update counts
        await User.findByIdAndUpdate(user._id, { $inc: { followers: -1 } })
        await User.findByIdAndUpdate(hostId, { $inc: { following: -1 } })

        return res.status(200).json({ message: "User removed from your followers" })
    })
)

module.exports = router
