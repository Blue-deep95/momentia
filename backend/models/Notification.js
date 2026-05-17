// The main model that handles notifications
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // target/recipient here refers to the user the notification is meant for
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    // what kind of notification the base type is
    // for example if it is post type then it can either be liked or commented on
    notificationType: {
      type: String,
      enum: ["post", "comment", "follow"],
      required: true,
    },

    // notification-sub type if the it is post or comment,
    // then it can be liked or replied to
    notificationSubType: {
      type: String,
      enum: ["like", "comment", "reply"],
    },
    // this will be a unique id of the post or comment
    targetEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },

    // Actors are the people who caused the notification to appear in the first place
    // I want to store only three recent users that is the latest one to take action on
    // this entitty
    actors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    }],
    // if this gets to zero destroy the notification itself when a user unlikes the
    // post
    actorCount: {
      type: Number,
      default: 1,
    },
    // most important! isRead is used to allow and set timers to notifications which
    // are too old and destroy them after sometime 
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("notification", notificationSchema);
