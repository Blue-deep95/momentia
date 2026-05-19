# Socket.io API Reference (Momentia)

This document details the real-time communication events used in the Momentia application.

## 1. Connection & Authentication

The socket server runs on the same port as the backend API (Default: `2000`).

- **Connection URL:** `http://localhost:2000`
- **Authentication:** Momentia uses handshake authentication. The client MUST provide a valid JWT access token.

### Client Connection Example (Socket.io-client)
```javascript
const socket = io("http://localhost:2000", {
  auth: {
    token: "YOUR_JWT_ACCESS_TOKEN"
  }
});
```

---

## 2. Server -> Client (Events Emitted by Backend)

These events are sent from the server to specific connected clients.

### `welcome`
Sent immediately upon successful connection.
- **Payload:** `string` (e.g., `"Welcome to the Momentia!"`)

### `notification-post-liked`
Sent when a user's post is liked. This event is rate-limited to 1 minute per post-notification.
- **Payload (Notification Object):**
  ```json
  {
    "_id": "ObjectId",
    "recipient": "UserId",
    "notificationType": "post",
    "notificationSubType": "like",
    "targetEntityId": {
      "_id": "PostId",
      "caption": "string"
    },
    "actors": [
      {
        "_id": "UserId",
        "username": "string",
        "profilePicture": { "profileView": "url", ... }
      }
    ],
    "actorCount": "number",
    "isRead": false,
    "updatedAt": "ISO Date"
  }
  ```

### `user-followed`
Sent when someone follows the authenticated user. Rate-limited to 1 minute.
- **Payload (Notification Object):**
  ```json
  {
    "_id": "ObjectId",
    "recipient": "UserId",
    "notificationType": "follow",
    "actors": [
      {
        "_id": "UserId",
        "username": "string",
        "profilePicture": { "profileView": "url", ... }
      }
    ],
    "actorCount": "number",
    "isRead": false,
    "updatedAt": "ISO Date"
  }
  ```

### `new-message`
Sent when a new message is received in a room the user is a member of.
- **Payload (Message Object):**
  ```json
  {
    "_id": "ObjectId",
    "roomId": "ObjectId",
    "messageNumber": "number",
    "sender": "UserId",
    "content": "string",
    "isDeleted": false,
    "isEdited": false,
    "createdAt": "ISO Date",
    "updatedAt": "ISO Date"
  }
  ```
- **Note:** The `members` array is stripped from this payload for privacy and efficiency.

---

## 3. Client -> Server (Events Listened to by Backend)

### `message`
A generic event for testing or simple message logging.
- **Payload:** `string`
- **Effect:** Logs the message to the server console.

### `disconnect`
Automatically triggered when the client closes the connection.
- **Effect:** Removes the user from the `onlineUsers` store.

---

## 4. Internal Implementation Details (For Developers)

- **User Mapping:** The server maintains a Map (`onlineUsers`) that maps `userId` to `socketId`. This is used to route notifications to the correct recipient.
- **Middleware:** `authSocketMiddleware.js` validates the JWT before allowing the connection. If the token is missing or invalid, a `connect_error` is emitted to the client.
- **Rate Limiting:** Notifications are grouped if unread and only emitted via socket if the time since the last update exceeds `GLOBAL_NOTIFICATION_LIMIT` (1 minute).
