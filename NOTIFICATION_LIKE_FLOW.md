# Notification System Flow: When a User Likes a Post

## Overview
This document explains the complete data flow when a user likes a post and how the notification system works.

---

## 1️⃣ FRONTEND: User Likes a Post

### Request Data Sent to Backend:
```
POST /api/posts/toggle-like/:postid

Headers:
  - Authorization: Bearer <token>
  - Content-Type: application/json

Body: (empty - only postid in params)

Example URL:
  POST /api/posts/toggle-like/507f1f77bcf86cd799439011
```

---

## 2️⃣ BACKEND: Toggle-Like Route (postRoutes.js)

### Step 1: Validate and Check If Already Liked
```javascript
// Check if the post exists
const post = await Post.findById(postid)

// Check if user already liked this post
const existingLike = await Like.findOne({ 
  author: user._id, 
  postTarget: postid 
})
```

### Step 2: If NOT Already Liked → Create Like & Emit Event

**Data Created in Database:**
```javascript
// New Like Document saved to DB
const newLike = new Like({
  author: user._id,           // User who liked the post
  likeType: 'post',           // Type of like
  parentPost: postid,         // Post ID for easy deletion
  postTarget: postid,         // Target post ID
  // timestamps auto-generated: createdAt, updatedAt
})
await newLike.save()

// Increment post total likes
await Post.findByIdAndUpdate(postid, { $inc: { totalLikes: 1 } })
```

**Event Emitted:**
```javascript
// Only emit if post author ≠ liker (no self notifications)
if (post.author.toString() !== user._id.toString()) {
  notificationBus.emit('post-liked', {
    ...newLike.toObject(),    // Contains: author, likeType, parentPost, postTarget, _id, timestamps
    postAuthor: post.author   // Post owner ID
  })
}
```

### Response Sent to Frontend:
```json
{
  "message": "Post liked successfully",
  "isLiked": true
}
```

---

## 3️⃣ BACKEND: Notification Service (notificationService.js)

### Event Listener: `post-liked`

The event bus triggers the `post-liked` listener with data:
```javascript
{
  _id: "507f191e810c19729de860ea",
  author: "user123_id",              // Who liked
  likeType: "post",
  parentPost: "post_id",
  postTarget: "post_id",
  createdAt: "2025-05-25T10:30:00Z",
  updatedAt: "2025-05-25T10:30:00Z",
  postAuthor: "post_author_id"       // Who receives notification
}
```

### Step 1: Update or Create Notification in Database
```javascript
const oldNotification = await Notification.findOneAndUpdate(
  {
    recipient: data.postAuthor,           // Post owner
    notificationType: "post",
    notificationSubType: "like",
    targetEntityId: data.postTarget,      // Post being liked
    isRead: false
  },
  {
    // Atomic updates using MongoDB operators
    $inc: { actorCount: 1 },              // Increment counter
    $push: {
      actors: {
        $each: [data.author],             // Add liker to actors
        $position: 0,                     // Put at beginning (newest first)
        $slice: 3                         // Keep only top 3 actors
      }
    }
  },
  { upsert: true, returnDocument: "before" }  // Create if not exists
)
```

**Resulting Notification Document in DB:**
```javascript
{
  _id: ObjectId,
  recipient: "post_author_id",
  notificationType: "post",
  notificationSubType: "like",
  targetEntityId: "post_id",
  actors: [user1_id, user2_id, user3_id],  // Latest 3 people who liked
  actorCount: 5,                            // Total count
  isRead: false,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Step 2: Rate Limiting Check
```javascript
const GLOBAL_NOTIFICATION_LIMIT = 1000;  // 1 second in milliseconds

const shouldNotify = 
  !oldNotification ||  // First time? Notify
  (Date.now() - oldNotification.updatedAt.getTime() > GLOBAL_NOTIFICATION_LIMIT)
  // It's been > 1 second since last update? Notify
```

### Step 3: Send Real-time Notification via WebSocket

**If shouldNotify is true:**

1. **Populate/Join Data:**
```javascript
const notificationData = await Notification.findOne({...})
  .populate("actors", "_id username profilePicture")
  .populate({
    path: "targetEntityId",
    model: "post",
    select: "_id caption thumbImage"
  })
```

2. **Data Structure Sent via WebSocket:**
```javascript
{
  _id: "notification_id",
  recipient: "post_author_id",
  notificationType: "post",
  notificationSubType: "like",
  targetEntityId: {
    _id: "post_id",
    caption: "Check this out!",
    thumbImage: "cloudinary_url"
  },
  actors: [
    { 
      _id: "user1_id", 
      username: "john_doe", 
      profilePicture: "profile_url" 
    },
    { 
      _id: "user2_id", 
      username: "jane_smith", 
      profilePicture: "profile_url" 
    }
  ],
  actorCount: 3,
  isRead: false,
  createdAt: "2025-05-25T10:30:00Z",
  updatedAt: "2025-05-25T10:30:02Z"
}
```

3. **WebSocket Emission:**
```javascript
const targetSocketId = onlineUsers.get(data.postAuthor.toString())
if (targetSocketId) {
  io.to(targetSocketId).emit("notification-post-liked", notificationData)
}
```

---

## 4️⃣ FRONTEND: Receive Notification via WebSocket

### Socket Event Listener (NotificationsPage.jsx):

```javascript
useEffect(() => {
  const socket = window.__socket
  
  const socketHandler = (newNotif) => {
    console.log("Received notification:", newNotif)
    
    // Add to notifications state
    setNotifications(prev => {
      const updated = [newNotif, ...prev]
      return updated
    })
    
    // Show toast
    showNotificationToast(newNotif)
  }

  socket.on("notification-post-liked", socketHandler)
  
  return () => {
    socket.off("notification-post-liked", socketHandler)
  }
}, [])
```

### Frontend Display Data:

The notification uses this data:
```javascript
actors: [
  { username: "john_doe", profilePicture: "url" },
  { username: "jane_smith", profilePicture: "url" }
]
actorCount: 3

// Displays as:
"john_doe & jane_smith +1 others liked your post"
// with post thumbnail and heart icon
```

---

## 5️⃣ Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER LIKES POST (Frontend)                                   │
│ POST /api/posts/toggle-like/:postid                             │
│ Body: {} | Headers: {Authorization: Bearer token}              │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. TOGGLE-LIKE ROUTE (Backend)                                  │
│ ✅ Create new Like document                                     │
│ ✅ Increment post.totalLikes                                    │
│ ✅ Emit event: {author, postAuthor, postTarget, ...}           │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. NOTIFICATION SERVICE EVENT (Backend)                         │
│ ✅ Find/Create Notification document                            │
│ ✅ Update actors array (keep latest 3)                         │
│ ✅ Increment actorCount                                         │
│ ✅ Check rate limit (1 second)                                 │
│ ✅ Populate actors & post details                              │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. WEBSOCKET EMIT (Backend)                                     │
│ io.to(targetSocketId).emit("notification-post-liked", data)    │
│                                                                  │
│ Data sent:                                                       │
│ {                                                                │
│   _id, recipient, notificationType, notificationSubType,        │
│   targetEntityId: {_id, caption, thumbImage},                  │
│   actors: [{_id, username, profilePicture}, ...],             │
│   actorCount, isRead, createdAt, updatedAt                    │
│ }                                                                │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. FRONTEND RECEIVES NOTIFICATION                               │
│ socket.on("notification-post-liked", (notification) => {...})  │
│ ✅ Add to notifications list                                    │
│ ✅ Show toast notification                                      │
│ ✅ Display in NotificationsPage                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6️⃣ Database Models Involved

### Like Model:
```javascript
{
  author: ObjectId,        // User who liked
  parentPost: ObjectId,    // Post being liked
  likeType: "post",
  postTarget: ObjectId,    // Post ID
  timestamps: { createdAt, updatedAt }
}
```

### Post Model:
```javascript
{
  _id: ObjectId,
  author: ObjectId,
  caption: String,
  thumbImage: String,
  totalLikes: Number,      // Incremented when liked
  // ... other fields
}
```

### Notification Model:
```javascript
{
  _id: ObjectId,
  recipient: ObjectId,                    // Post owner
  notificationType: "post",
  notificationSubType: "like",
  targetEntityId: ObjectId,               // Post being liked
  actors: [ObjectId, ObjectId, ...],      // Top 3 people who liked
  actorCount: Number,                     // Total count
  isRead: Boolean,
  timestamps: { createdAt, updatedAt }
}
```

---

## 7️⃣ Important Notes

### Rate Limiting:
- Notifications are only sent if **1+ seconds** have passed since the last update
- Prevents notification spam when multiple people like simultaneously
- Still updates database immediately, but holds back socket emission

### Actor Limit:
- Only **top 3 most recent actors** are stored in the actors array
- `actorCount` stores the **total count** of all people who liked

### No Self-Notifications:
```javascript
if (post.author.toString() !== user._id.toString()) {
  // Only emit if post author is different from the liker
}
```

### Socket Connection Requirements:
- User must be **logged in** (token in auth middleware)
- User must be **online** (socket connected)
- If offline, notification waits in DB until they log in

---

## 8️⃣ Unlike Flow (Reverse Process)

When user **unlikes** a post:

```javascript
notificationBus.emit('post-unliked', {
  ...existingLike.toObject(),
  postAuthor: post.author
})

// Backend updates notification:
$inc: { actorCount: -1 }
$pull: { actors: data.author }  // Remove liker from actors

// When actorCount reaches 0, notification can be deleted
```

---

## Summary Table

| Step | Location | Data/Action | Response |
|------|----------|------------|----------|
| 1 | Frontend | POST /toggle-like/:postid | `{message: "...", isLiked: true}` |
| 2 | Backend Route | Create Like, emit event | Event object |
| 3 | Event Listener | Create/Update Notification | Updated notification doc |
| 4 | Socket Layer | Emit via websocket | Real-time to client |
| 5 | Frontend | Receive & update state | UI updates immediately |

