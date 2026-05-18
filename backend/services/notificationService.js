// This file is mainly for implementing the notification system and listening to various
// events related to notifications
const { notificationBus } = require("../events/event");
const Notification = require("../models/Notification"); // import the model
const { io } = require("../socket/socket");
const { onlineUsers } = require("../socket/socketStore");

// to prevent notifications from firing every second or so,
// limit sending notifications by this time
// we use this with updated at field from mongodb
const GLOBAL_NOTIFICATION_LIMIT = 1000 * 60; // 1 miniute limit

// start listening to events
notificationBus.on("post-liked", async (data) => {
  try {
    // the data is a newer object here with new Like data and post author data from toggle-like route
    // since this is our internal server message queue we do not need to check the validity of the data
    const oldNotification = await Notification.findOneAndUpdate(
      {
        recipient: data.postAuthor,
        notificationType: "post",
        notificationSubType: "like",
        targetEntityId: data.postTarget,
        isRead: false,
      },
      {
        // performing atomic updates
        $inc: { actorCount: 1 },
        // the push method is for manipulating array items in mongodb
        $push: {
          actors: {
            $each: [data.author], // The new person who liked
            $position: 0, // Put them at the very beginning
            $slice: 3, // Keep only the first 3 (latest 3)
          },
        },
      },
      // creates new document if it does not exist and returns the
      // state of document before it is updated for rate-limiting the
      // notifications
      { upsert: true, returnDocument: "before" },
    );

    // now try to send the notification to the user
    const targetSocketId = onlineUsers.get(data.postAuthor.toString());
    if (targetSocketId) {
      // also before sending the notification data i need to join the actor details and post details
      // such as captions etc
      const shouldNotify =
        !oldNotification ||
        Date.now() - oldNotification.updatedAt.getTime() >
          GLOBAL_NOTIFICATION_LIMIT;
      // only send the notifications after certain time limit to prevent notification spam
      if (shouldNotify) {
        // write aggregation pipeline like joining user data and post data here
        const notificationData = await Notification.findOne({
          recipient: data.postAuthor,
          targetEntityId: data.postTarget,
          notificationType: "post",
          notificationSubType: "like",
          isRead: false,
        })
          .populate("actors", "_id username profilePicture")
          .populate({ path: "targetEntityId", model: "post" }, "_id caption");
        io.to(targetSocketId).emit("notification-post-liked", notificationData);
      }
      // do not set the isRead = true here just sending over websocket does not mean the user read
      // it they might have also stepped away from mobile app need to create a seperate route that
      // that gets triggered when the user opens the notification page.
    }
  } catch (error) {
    console.error(
      "Background sending notification failed in event post-liked",
      error,
    );
  }
});

notificationBus.on("post-unliked", async (data) => {
  try {
    // Need to unlike the post but do not need to send the notification here we just modify the
    // document itself
    const editNotification = await Notification.findOneAndUpdate(
      {
        recipient: data.postAuthor,
        notificationType: "post",
        notificationSubType: "like",
        targetEntityId: data.postTarget,
        isRead: false,
      },
      {
        $inc: { actorCount: -1 },
        $pull: { actors: data.author },
      },
      { returnDocument: "after" },
    );

    // if the actor count is below 0 directly delete it
    if (editNotification && editNotification.actorCount < 1) {
      await Notification.findOneAndDelete({ _id: editNotification._id });
    }
  } catch (error) {
    console.error("Error in post-unliked event listener", error);
  }
});

// notification for following users
notificationBus.on("follow-user", async (data) => {
  try {
    const oldNotification = await Notification.findOneAndUpdate(
      {
        recipient: data.target,
        notificationType: "follow",
        isRead: false,
      },
      {
        $inc: { actorCount: 1 },
        $push: {
          actors: {
            $each: [data.host],
            $position: 0,
            $slice: 3,
          },
        },
      },
      { upsert: true, returnDocument: "before" },
    );

    // again check if the user is online or not
    const targetSocketId = onlineUsers.get(data.target.toString());
    if (targetSocketId) {
      // again try to find if notification can be sent now
      const shouldNotify =
        !oldNotification ||
        Date.now() - oldNotification.updatedAt.getTime() >
          GLOBAL_NOTIFICATION_LIMIT;

      if (shouldNotify) {
        const notificationData = await Notification.findOne({
          recipient: data.target,
          notificationType: "follow",
          isRead: false,
        }).populate("actors", "_id username profilePicture");

        io.to(targetSocketId).emit("user-followed", notificationData);
      }
    }
  } catch (error) {
    console.error("Error in follow-user event listener", error);
  }
});

// for unfollowing user 
notificationBus.on("unfollow-user", async (data) => {
  try {
    const editNotification = await Notification.findOneAndUpdate(
      {
        recipient: data.target,
        notificationType: "follow",
        isRead: false,
      },
      {
        $inc: { actorCount: -1 },
        $pull: { actors: data.host },
      },
      { returnDocument: "after" },
    );

    if (editNotification && editNotification.actorCount < 1) {
      await Notification.findOneAndDelete({ _id: editNotification._id });
    }
  } catch (error) {
    console.error("Error in unfollow-user event listener", error);
  }
});
