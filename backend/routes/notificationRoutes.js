// This file is mainly for sending notifications to the user when they open the app
// marking them seen if they have already benn read by users
const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

// this route gets all notifications from the server both read and unread,
// joins the data page for extra safety and send 20 notifications per each request
router.get("/get-notifications/:page", async (req, res) => {
  try {
    const user = req.user;
    // Basic pagination logic
    const page = parseInt(req.params.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // complex joining required here
    const notifications = await Notification.aggregate([
      { $match: { recipient: new mongoose.Types.ObjectId(user._id) } },
      // Sort by unread first, then by the most recent updates
      { $sort: { isRead: 1, updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      // 1. Join the actors details (User details)
      {
        $lookup: {
          from: "users",
          localField: "actors",
          foreignField: "_id",
          as: "actorDetails",
          pipeline: [
            {
              $project: {
                username: 1,
                profilePicture: 1,
                _id: 1,
              },
            },
          ],
        },
      },

      // 2. Conditional Join: Post Details (only if notificationType is 'post')
      {
        $lookup: {
          from: "posts",
          let: { targetId: "$targetEntityId", type: "$notificationType" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_id", "$$targetId"] },
                    { $eq: ["$$type", "post"] },
                  ],
                },
              },
            },
            {
              $project: {
                caption: 1,
                thumbImage: 1,
                _id: 1,
              },
            },
          ],
          as: "postDetails",
        },
      },

      // 3. Conditional Join: Comment Details (only if notificationType is 'comment')
      {
        $lookup: {
          from: "comments",
          let: { targetId: "$targetEntityId", type: "$notificationType" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_id", "$$targetId"] },
                    { $eq: ["$$type", "comment"] },
                  ],
                },
              },
            },
            {
              $project: {
                content: 1,
                post: 1,
                _id: 1,
              },
            },
            // Join the post thumbnail for the comment as well
            {
              $lookup: {
                from: "posts",
                localField: "post",
                foreignField: "_id",
                as: "postInfo",
                pipeline: [{ $project: { thumbImage: 1 } }],
              },
            },
            { $addFields: { postInfo: { $arrayElemAt: ["$postInfo", 0] } } },
          ],
          as: "commentDetails",
        },
      },

      // 4. Flatten the detail arrays
      {
        $addFields: {
          postDetails: { $arrayElemAt: ["$postDetails", 0] },
          commentDetails: { $arrayElemAt: ["$commentDetails", 0] },
        },
      },
    ]);

    return res
      .status(200)
      .json({ notifications, message: "Notifications retrieved succesfully!" });
  } catch (err) {
    console.log("Error in get-notifications route", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// mark-as-read route updates the notifications from isRead from false to true
// as soon as the user opens the page
router.put("/mark-as-read", async (req, res) => {
  try {
    // The body should conatain all the notifications that are seen
    const user = req.user;
    const { seenNotifications } = req.body;

    // Set expiry date to 2 days from now
    const expiryDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    const updateIsRead = await Notification.updateMany(
      { _id: { $in: seenNotifications }, isRead: false },
      {
        $set: {
          isRead: true,
          expiresAt: expiryDate,
        },
      },
    );

    return res.status(200).json({ message: "Notifications read successfully" });
  } catch (err) {
    console.log("Error in mark-as-read route", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});
module.exports = router;
