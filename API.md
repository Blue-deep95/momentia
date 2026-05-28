# Momentia API Documentation

This document provides a comprehensive overview of the Momentia API endpoints, including authentication requirements, request parameters, and response structures.

## 📌 Table of Contents
*   [🔐 User & Authentication](#-user--authentication-user)
*   [👤 Profile](#-profile-profile)
*   [🏠 Feed](#-feed-feed)
*   [🔍 Search](#-search-search)
*   [📝 Posts](#-posts-post)
*   [💬 Comments](#-comments-comment)
*   [🤝 Follow](#-follow-follow)
*   [🔔 Notifications](#-notifications-notifications)
*   [💬 Messages](#-messages-message)

---

## Base URL
`http://localhost:2000/api`

## Authentication
The API uses **JWT (JSON Web Tokens)** for authentication.
*   **Access Token:** Must be sent in the `Authorization` header as a Bearer token: `Authorization: Bearer <access_token>`.
*   **Refresh Token:** Handled via HTTP-only cookies (`refreshToken`).

---

## 🔐 User & Authentication (`/user`)

### 1. Send OTP
Sends a verification OTP to the user's email.
*   **URL:** `/user/send-otp`
*   **Method:** `POST`
*   **Body:**
    ```json
    { "email": "user@example.com" }
    ```
*   **Success Response (201):**
    ```json
    { "message": "Email sent successfully" }
    ```

### 2. Verify OTP
Verifies the OTP sent to the user's email.
*   **URL:** `/user/verify-otp`
*   **Method:** `POST`
*   **Body:**
    ```json
    { "email": "user@example.com", "otp": "12345" }
    ```
*   **Success Response (200):**
    ```json
    { "message": "Email Verified" }
    ```

### 3. Register
Registers a new user after email verification.
*   **URL:** `/user/register`
*   **Method:** `POST`
*   **Body:**
    ```json
    { 
      "name": "John Doe", 
      "email": "user@example.com", 
      "password": "password123" 
    }
    ```
*   **Success Response (201):**
    ```json
    { "message": "user created successfully" }
    ```

### 4. Login
Authenticates a user and returns an access token.
*   **URL:** `/user/login`
*   **Method:** `POST`
*   **Body:**
    ```json
    { "email": "user@example.com", "password": "password123" }
    ```
*   **Success Response (200):**
    ```json
    {
      "accessToken": "...",
      "user": { "id": "...", "name": "...", "email": "..." },
      "message": "Login successful"
    }
    ```
*   **Note:** Sets an HTTP-only `refreshToken` cookie.

### 5. Forgot Password
Sends a password reset OTP.
*   **URL:** `/user/forgot-password`
*   **Method:** `POST`
*   **Body:**
    ```json
    { "email": "user@example.com" }
    ```
*   **Success Response (200):**
    ```json
    { "message": "OTP sent to email" }
    ```

### 6. Reset Password
Resets the password using an OTP.
*   **URL:** `/user/reset-password`
*   **Method:** `POST`
*   **Body:**
    ```json
    { "email": "user@example.com", "otp": "123456", "password": "newpassword123" }
    ```
*   **Success Response (200):**
    ```json
    { "message": "Password reset successful" }
    ```

### 7. Regenerate Access Token
Uses the refresh token cookie to issue a new access token.
*   **URL:** `/user/regenerate-access-token`
*   **Method:** `POST`
*   **Success Response (200):**
    ```json
    { "accessToken": "..." }
    ```
*   **Error Response (401):**
    ```json
    { "message": "Refresh token not found" }
    ```
    OR
    ```json
    { "message": "Invalid or expired refresh token" }
    ```

### 8. Logout
Invalidates the refresh token (if valid and active in database) and clears the cookie.
*   **URL:** `/user/logout`
*   **Method:** `POST`
*   **Success Response (200):**
    ```json
    { "message": "Logout successful" }
    ```


---

## 👤 Profile (`/profile`)
*All routes in this section require a valid Bearer Token.*

### 1. Get Profile
Retrieves public profile information for a user.
*   **URL:** `/profile/get-profile/:id`
*   **Method:** `GET`
*   **Success Response (200):**
    ```json
    {
      "self": true/false,
      "following": true/false,
      "profile": {
        "username": "...",
        "name": "...",
        "bio": "...",
        "profilePicture": { ... },
        "totalPosts": 0,
        "followers": 0,
        "following": 0
      },
      "message": "profile search succesful"
    }
    ```

### 2. Get Profile by Username
Retrieves public profile information for a user by their username.
*   **URL:** `/profile/get-profilebyusername/:username`
*   **Method:** `GET`
*   **Success Response (200):**
    ```json
    {
      "self": true/false,
      "following": true/false,
      "profile": {
        "username": "...",
        "name": "...",
        "bio": "...",
        "profilePicture": { ... },
        "totalPosts": 0,
        "followers": 0,
        "following": 0
      },
      "message": "profile search succesful"
    }
    ```

### 3. Get User Posts
Retrieves posts belonging to a specific user (defaults to authenticated user if no ID is provided).
*   **URL:** `/profile/get-userposts/:id?`
*   **Method:** `GET`
*   **Query Parameters:**
*   `page` (Number, optional, default: 1)
*   `limit` (Number, optional, default: 12)
*   **Success Response (200):**
    ```json
    {
      "posts": [
        {
          "_id": "...",
          "thumbImage": "...",
          "mediaType": "image/video",
          "totalLikes": 0,
          "totalComments": 0
        }
      ],
      "message": "User posts fetched successfully"
    }
    ```

### 4. Get Saved Posts
Retrieves posts saved by a specific user (defaults to authenticated user if no ID is provided).
*   **URL:** `/profile/get-savedposts/:id?`
*   **Method:** `GET`
*   **Query Parameters:**
*   `page` (Number, optional, default: 1)
*   `limit` (Number, optional, default: 12)
*   **Success Response (200):**
    ```json
    {
      "savedPosts": [
        {
          "_id": "...",
          "thumbImage": "...",
          "mediaType": "image/video",
          "totalLikes": 0,
          "totalComments": 0
        }
      ],
      "message": "Saved posts retrieved successfully"
    }
    ```
*   **Empty Response (200):**
    ```json
    {
      "savedPosts": [],
      "message": "No saved posts found"
    }
    ```

### 5. Get Suggested Users
Retrieves a list of suggested users to follow.
*   **URL:** `/profile/get-suggested-users`
*   **Method:** `GET`
*   **Success Response (200):**
    ```json
    {
      "users": [ { ... } ],
      "message": "Suggested users fetched successfully"
    }
    ```

### 6. Upload Avatar
Uploads and processes a profile picture via Cloudinary.
*   **URL:** `/profile/upload-avatar`
*   **Method:** `POST`
*   **Headers:** `Content-Type: multipart/form-data`
*   **Body:** `avatar` (File)
*   **Success Response (200):**
    ```json
    { "message": "Profile picture updated succesfully" }
    ```

### 7. Remove Avatar
Deletes the user's active profile picture/avatar from Cloudinary and clears it from their database record.
*   **URL:** `/profile/remove-avatar`
*   **Method:** `DELETE`
*   **Success Response (200):**
    ```json
    { "message": "Removal of avatar succesfull" }
    ```
*   **Error Response (400):**
    ```json
    { "message": "User profile picture does not exist" }
    ```
*   **Error Response (404):**
    ```json
    { "message": "User not found" }
    ```

### 8. Edit Profile
Updates the authenticated user's profile details.
*   **URL:** `/profile/edit-profile`
*   **Method:** `POST`
*   **Body:**
    ```json
    { 
      "name": "New Name", 
      "bio": "New Bio", 
      "gender": "Male/Female/Other",
      "username": "newusername"
    }
    ```
*   **Success Response (200):**
    ```json
    { "message": "Profile update succesful" }
    ```

### 9. Get Followers
Retrieves the list of followers for a specific user with pagination.
*   **URL:** `/profile/get-followers/:id`
*   **Method:** `GET`
*   **Query Parameters:**
*   `page` (Number, optional, default: 1)
*   `limit` (Number, optional, default: 50)
*   **Success Response (200):**
    ```json
    {
      "followers": [
        { 
          "userId": "...", 
          "username": "...", 
          "name": "...", 
          "profilePicture": "...",
          "isFollowing": true
        }
      ],
      "message": "Followers list retrieved successfully"
    }
    ```

### 10. Get Following
Retrieves the list of users a specific user is following with pagination.
*   **URL:** `/profile/get-following/:id`
*   **Method:** `GET`
*   **Query Parameters:**
*   `page` (Number, optional, default: 1)
*   `limit` (Number, optional, default: 50)
*   **Success Response (200):**
    ```json
    {
      "following": [
        { 
          "userId": "...", 
          "username": "...", 
          "name": "...", 
          "profilePicture": "...",
          "isFollowing": true
        }
      ],
      "message": "Following list retrieved successfully"
    }
    ```

---

## 🏠 Feed (`/feed`)

### 1. Get MainPage Posts
Retrieves the top 10 most liked posts. This endpoint is **public** and does not require authentication.
*   **URL:** `/feed/get-mainpage`
*   **Method:** `GET`
*   **Success Response (200):**
    ```json
    {
      "posts": [
        {
          "_id": "...",
          "author": "...",
          "caption": "...",
          "mediaType": "image/video",
          "thumbImage": "...",
          "images": [ { "url": "...", "public_id": "..." } ],
          "video": { "url": "...", "public_id": "..." },
          "authorDetails": { "_id": "...", "username": "...", "profilePicture": "..." },
          "isLiked": false,
          "isFollowing": false,
          "isSaved": false,
          "totalLikes": 120,
          "totalComments": 4,
          "createdAt": "..."
        }
      ],
      "message": "Posts fetched succesfully"
    }
    ```

### 2. Get Carousel Items
Retrieves posts uploaded by secret/creator users (`userType: 'cdg'`). This endpoint is **public** and does not require authentication.
*   **URL:** `/feed/get-carousel`
*   **Method:** `GET`
*   **Success Response (200):**
    ```json
    {
      "carouselItems": [
        {
          "_id": "post_id_here",
          "caption": "...",
          "mediaType": "image",
          "thumbImage": "...",
          "images": [ { "url": "...", "public_id": "..." } ],
          "video": null,
          "totalLikes": 10,
          "totalComments": 2,
          "createdAt": "...",
          "authorDetails": {
            "_id": "user_id_here",
            "username": "secret_creator",
            "profilePicture": "...",
            "email": "secret@example.com"
          }
        }
      ],
      "message": "Carousel items fetched succesfully"
    }
    ```

### 3. Get Feed Posts
Retrieves posts for the main feed using **cursor-based pagination** with a split-timeline (social graph priority) algorithm and interaction metadata. Requires a valid Bearer Token.
*   **URL:** `/feed/get-posts`
*   **Method:** `GET`
*   **Headers:** `Authorization: Bearer <access_token>`
*   **Query Parameters:**
    *   `cursor` (optional, string): The base64-encoded cursor token from the previous page's response.
*   **Success Response (200):**
    ```json
    {
      "posts": [
        {
          "_id": "...",
          "author": "...",
          "caption": "...",
          "mediaType": "image/video",
          "thumbImage": "...",
          "images": [ { "url": "...", "public_id": "..." } ],
          "video": { "url": "...", "public_id": "..." },
          "authorDetails": { "username": "...", "profilePicture": { ... } },
          "isLiked": true/false,
          "isSaved": true/false,
          "isFollowing": true/false,
          "totalLikes": 0,
          "totalComments": 0,
          "feedGroup": 1
        }
      ],
      "nextCursor": "eyJmZWVkR3JvdXAiOjEsImNyZWF0ZWRBdCI6IjIwMjYtMDUt...",
      "hasNextPage": true,
      "message": "posts retreived successfully"
    }
    ```

### 4. Get Reels
Retrieves reels (video posts) using **cursor-based pagination**. Requires a valid Bearer Token.
*   **URL:** `/feed/get-reels`
*   **Method:** `GET`
*   **Headers:** `Authorization: Bearer <access_token>`
*   **Query Parameters:**
    *   `cursor` (optional, string): The base64-encoded cursor token from the previous page's response.
*   **Success Response (200):**
    ```json
    {
      "reels": [
        {
          "_id": "...",
          "authorDetails": { 
            "username": "...", 
            "profilePicture": { ... },
            "fullName": "..."
          },
          "isLiked": true/false,
          "isSaved": true/false,
          "isFollowing": true/false
        }
      ],
      "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTA1LTIwVDEyOjU0OjQyKzA4OjAw...",
      "hasNextPage": true,
      "message": "reels retrieved successfully"
    }
    ```

---

## 🔍 Search (`/search`)
*All routes in this section require a valid Bearer Token.*

### 1. Search Users
Searches for users by name or username with pagination.
*   **URL:** `/search/search-users/:query/:page`
*   **Method:** `GET`
*   **Success Response (200):**
    ```json
    {
      "results": [
        {
          "_id": "...",
          "username": "...",
          "name": "...",
          "profilePicture": { ... },
          "followers": 0,
          "following": 0
        }
      ],
      "message": "Results acquired successfully"
    }
    ```

### 2. Search Posts
Searches for posts by caption or hashtags with pagination.
*   **URL:** `/search/search-posts/:query/:page`
*   **Method:** `GET`
*   **Success Response (200):**
    ```json
    {
      "results": [
        {
          "_id": "...",
          "author": "...",
          "caption": "...",
          "thumbImage": "...",
          "totalLikes": 0
        }
      ],
      "message": "Results acquired successfully"
    }
    ```

---

## 📝 Posts (`/post`)
*All routes in this section require a valid Bearer Token.*

### 1. Get Single Post
Retrieves a single post by ID with full metadata (author, liked/saved status, etc.).
*   **URL:** `/post/get-singlepost/:postid`
*   **Method:** `GET`
*   **Success Response (200):**
    ```json
    {
      "post": {
        "_id": "...",
        "author": "...",
        "caption": "...",
        "mediaType": "image/video",
        "thumbImage": "...",
        "authorDetails": { ... },
        "isLiked": true/false,
        "isSaved": true/false,
        "isFollowing": true/false,
        "totalLikes": 0,
        "totalComments": 0
      },
      "message": "Post fetched successfully"
    }
    ```

### 2. Upload Post
Uploads a new post with images or a video.
*   **URL:** `/post/upload-post`
*   **Method:** `POST`
*   **Headers:** `Content-Type: multipart/form-data`
*   **Body:** 
    *   `caption` (String, required)
    *   `images` (File, max 5) OR `video` (File, max 1)
*   **Success Response (200):**
    ```json
    { "message": "Post created succesfully!" }
    ```

### 3. Delete Post
Deletes an existing post and its associated media from Cloudinary.
*   **URL:** `/post/delete-post/:id`
*   **Method:** `DELETE`
*   **Parameters:** `id` (Post ID)
*   **Success Response (200):**
    ```json
    { "message": "Post deleted successfully!" }
    ```

### 4. Update Post
Updates the caption or media of an existing post.
*   **URL:** `/post/update-post`
*   **Method:** `POST`
*   **Headers:** `Content-Type: multipart/form-data`
*   **Body:**
    *   `postId` (String, required)
    *   `caption` (String, optional)
    *   `images` (File, optional, replaces old images) OR `video` (File, optional, replaces old video)
*   **Success Response (200):**
    ```json
    { "message": "Post updated successfully!", "post": { ... } }
    ```

### 5. Toggle Like
Likes or unlikes a post.
*   **URL:** `/post/toggle-like/:postid`
*   **Method:** `POST`
*   **Parameters:** `postid` (Post ID)
*   **Success Response (200):**
    ```json
    { "message": "Post liked/unliked successfully", "isLiked": true/false }
    ```

### 6. Toggle Saved Posts
Saves or unsaves a post for the authenticated user.
*   **URL:** `/post/toggle-savedposts/:postid`
*   **Method:** `POST`
*   **Parameters:** `postid` (Post ID)
*   **Success Response (200):**
    ```json
    { "message": "Post added to/removed from saved posts successfully", "isSaved": true/false }
    ```

---

## 💬 Comments (`/comment`)
*All routes in this section require a valid Bearer Token.*

### 1. Get Comments
Retrieves paginated top-level comments for a specific post, sorted by popularity and recency.
*   **URL:** `/comment/get-comments/:postid/:page`
*   **Method:** `GET`
*   **Parameters:**
    *   `postid` (Post ID)
    *   `page` (Number, optional, default: 1)
*   **Success Response (200):**
    ```json
    {
      "comments": [
        {
          "_id": "...",
          "author": "...",
          "post": "...",
          "content": "...",
          "totalLikes": 0,
          "totalReplies": 0,
          "authorDetails": { 
            "username": "...", 
            "profilePicture": { "url": "...", "public_id": "..." } 
          },
          "isLiked": true/false
        }
      ],
      "message": "Comments fetched successfully"
    }
    ```

### 2. Get Replies
Retrieves paginated replies for a specific parent comment.
*   **URL:** `/comment/get-replies/:postid/:parentid/:page`
*   **Method:** `GET`
*   **Parameters:**
    *   `postid` (Post ID)
    *   `parentid` (Parent Comment ID)
    *   `page` (Number, optional, default: 1)
*   **Success Response (200):**
    ```json
    {
      "replies": [
        {
          "_id": "...",
          "author": "...",
          "post": "...",
          "parent": "...",
          "content": "...",
          "totalLikes": 0,
          "authorDetails": { "username": "...", "profilePicture": { ... } },
          "referencedUser": { "username": "...", "profilePicture": { ... } },
          "isLiked": true/false
        }
      ],
      "message": "Replies fetched successfully"
    }
    ```

### 3. Create Comment
Adds a new comment or a reply to an existing comment.
*   **URL:** `/comment/create-comment`
*   **Method:** `POST`
*   **Body:**
    ```json
    {
      "content": "Comment text",
      "postid": "...",
      "parent": "...", // (Optional, ID of parent comment for replies. Required if nested reply)
      "reference": "...", // (Optional, ID of user being replied to. Required if parent is provided)
      "referenceComment": "..." // (Optional, ID of direct comment being replied to. Required if parent is provided)
    }
    ```
*   **Success Response (200):**
    ```json
    { "message": "Comment added successfully", "comment": { ... } }
    ```

### 4. Update Comment
Updates the content of an existing comment.
*   **URL:** `/comment/update-comment`
*   **Method:** `PUT`
*   **Body:**
    ```json
    { "commentId": "...", "content": "Updated text" }
    ```
*   **Success Response (200):**
    ```json
    { "message": "Comment edit succesful" }
    ```

### 5. Delete Comment
Deletes an existing comment and all its nested replies, updating associated counts.
*   **URL:** `/comment/delete-comment/:commentId`
*   **Method:** `DELETE`
*   **Parameters:** `commentId` (Comment ID)
*   **Success Response (200):**
    ```json
    { 
      "message": "Comment and its replies deleted successfully", 
      "deletedCount": 5 
    }
    ```

### 6. Toggle Like
Likes or unlikes a comment.
*   **URL:** `/comment/toggle-like/:commentid`
*   **Method:** `POST`
*   **Parameters:** `commentid` (Comment ID)
*   **Success Response (200):**
    ```json
    { "message": "Comment liked/unliked successfully", "isLiked": true/false }
    ```


---

## 🤝 Follow (`/follow`)
*All routes in this section require a valid Bearer Token.*

### 1. Follow User
Follows another user and updates counts.
*   **URL:** `/follow/follow-user`
*   **Method:** `POST`
*   **Body:**
    ```json
    { "targetId": "..." }
    ```
*   **Success Response (200):**
    ```json
    { "message": "User followed succesfully" }
    ```

### 2. Unfollow User
Unfollows a user and updates counts.
*   **URL:** `/follow/unfollow-user/:targetId`
*   **Method:** `DELETE`
*   **Parameters:** `targetId` (User ID)
*   **Success Response (200):**
    ```json
    { "message": "Unfollowed succesfully" }
    ```

### 3. Remove Follower
Removes a user from your own followers list and updates counts.
*   **URL:** `/follow/remove-follower/:hostId`
*   **Method:** `DELETE`
*   **Parameters:** `hostId` (User ID of the follower to be removed)
*   **Success Response (200):**
    ```json
    { "message": "User removed from your followers" }
    ```

---

## 🔔 Notifications (`/notifications`)
*All routes in this section require a valid Bearer Token.*

### 1. Get Notifications
Retrieves paginated notifications for the authenticated user, sorted by unread first and then by recency.
*   **URL:** `/notifications/get-notifications/:page`
*   **Method:** `GET`
*   **Success Response (200):**
    ```json
    {
      "notifications": [
        {
          "_id": "...",
          "recipient": "...",
          "notificationType": "post/comment/follow",
          "notificationSubType": "like/comment/reply",
          "actors": [ { "username": "...", "profilePicture": { ... } } ],
          "actorCount": 1,
          "isRead": true/false,
          "postDetails": { "caption": "...", "thumbImage": "..." },
          "commentDetails": { "content": "...", "postInfo": { "thumbImage": "..." } }
        }
      ],
      "message": "Notifications retrieved succesfully!"
    }
    ```

### 2. Mark as Read
Marks a list of notifications as read and sets a 2-day TTL for their deletion.
*   **URL:** `/notifications/mark-as-read`
*   **Method:** `PUT`
*   **Body:**
    ```json
    { "seenNotifications": ["id1", "id2"] }
    ```
*   **Success Response (200):**
    ```json
    { "message": "Notifications read successfully" }
    ```

---

## 💬 Messages (`/message`)
*All routes in this section require a valid Bearer Token.*

### 1. Create Room
Starts a new DM or Group Chat. Automatically creates a DM if 2 people are involved, or a Group if 3+ are provided.
*   **URL:** `/message/create-room`
*   **Method:** `POST`
*   **Body:**
    ```json
    {
      "participants": ["userId1", "userId2"],
      "roomName": "Group Name", (Required for 3+ participants)
      "roomDescription": "Optional description"
    }
    ```
*   **Success Response (201):**
    ```json
    { "room": { ... }, "message": "Room created successfully" }
    ```

### 2. Get Rooms
Retrieves all chat rooms (DMs and Groups) the user is a member of, including unread counts and DM partner info.
*   **URL:** `/message/get-rooms`
*   **Method:** `GET`
*   **Success Response (200):**
    ```json
    {
      "userRooms": [
        {
          "_id": "...",
          "roomType": "dm/group",
          "currentMessageCount": 10,
          "unreadCount": 2,
          "dmUserInfo": { "username": "...", "profilePicture": { ... } },
          "lastMessage": { "content": "...", "sender": "..." },
          "lastMessageAt": "..."
        }
      ],
      "message": "User rooms retrieved successfully"
    }
    ```

### 3. Send Message
Sends a message to a room. Synchronizes unread counts and triggers real-time updates.
*   **URL:** `/message/send-message`
*   **Method:** `POST`
*   **Body:**
    ```json
    { "roomId": "...", "content": "Hello!" }
    ```
*   **Success Response (201):**
    ```json
    { "message": { ... }, "success": true }
    ```

### 4. Get Messages
Retrieves paginated messages for a specific room using cursor-based pagination.
*   **URL:** `/message/get-messages/:roomId`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `cursor` (Number, optional): The `messageNumber` of the last message received.
    *   `limit` (Number, optional, default: 25): Number of messages to fetch.
*   **Success Response (200):**
    ```json
    {
      "messageArray": [
        {
          "_id": "...",
          "roomId": "...",
          "messageNumber": 10,
          "sender": { "username": "...", "profilePicture": "..." },
          "content": "...",
          "isDeleted": false,
          "isEdited": false,
          "createdAt": "..."
        }
      ],
      "nextCursor": 9,
      "hasMore": true,
      "message": "Messages fetched successfully"
    }
    ```

### 5. Mark Message Read
Updates the authenticated user's `lastSeenMessage` count for a specific room.
*   **URL:** `/message/mark-message-read`
*   **Method:** `PUT`
*   **Body:**
    ```json
    { 
      "roomId": "...", 
      "latestMessageNumber": 15 (Optional, defaults to current room message count)
    }
    ```
*   **Success Response (200):**
    ```json
    { 
      "message": "Marked read-messages successfully",
      "lastSeenMessage": 15 
    }
    ```

### 6. Delete Message
Soft-deletes a message by replacing its content and setting a flag. Only the sender can delete their message.
*   **URL:** `/message/delete-message/:messageId`
*   **Method:** `DELETE`
*   **Success Response (200):**
    ```json
    { 
      "success": true, 
      "message": "Message deleted successfully",
      "deletedMessage": { ... } 
    }
    ```

### 7. Edit Message
Updates the content of a message and sets an `isEdited` flag. Only the sender can edit their message.
*   **URL:** `/message/edit-message/:messageId`
*   **Method:** `PUT`
*   **Body:**
    ```json
    { "content": "New updated message content" }
    ```
*   **Success Response (200):**
    ```json
    {
      "success": true,
      "message": "Message edited successfully",
      "updatedMessage": { ... }
    }
    ```

### 8. Leave Room
Removes the authenticated user from a group room. If the group has less than 2 members remaining after the user leaves, the room itself is deleted (conversations are preserved). Users cannot leave DMs.
*   **URL:** `/message/leave-room`
*   **Method:** `PUT`
*   **Body:**
    ```json
    { "roomId": "..." }
    ```
*   **Success Response (200):**
    ```json
    { "message": "User removed successfully from the group" }
    ```
*   **Error Response (400):**
    ```json
    { "message": "No such group or user found!" }
    ```
    OR
    ```json
    { "message": "You can't leave a dm" }
    ```
