# Socket.io API Reference (Momentia)

This document details the real-time communication events used in the Momentia application.

## 1. Connection & Authentication

The socket server runs on the same port as the backend API (Default: `2000`).

- **Connection URL:** The base server origin (e.g., `http://localhost:2000`).
  > [!IMPORTANT]
  > Do **NOT** pass a URL containing a path suffix (such as `http://localhost:2000/api`) to the `io()` function. The Socket.io client treats any path suffix as a custom Socket.io namespace (e.g. `/api`), resulting in connection failures like `Invalid namespace` if the namespace is not configured on the server. Always extract only the protocol and host (`url.origin`) for connection.

- **Authentication:** Momentia uses handshake authentication. The client MUST provide a valid JWT access token.

### Client Connection Example (Socket.io-client)
```javascript
import { io } from "socket.io-client";

// Normalize the API URL to get only the origin (protocol + host)
const getSocketUrl = (apiUrl) => {
  if (!apiUrl) return "http://localhost:2000";
  try {
    const url = new URL(apiUrl);
    return url.origin;
  } catch (e) {
    return apiUrl;
  }
};

const socketUrl = getSocketUrl(import.meta.env.VITE_API_URL);

const socket = io(socketUrl, {
  withCredentials: true,
  transports: ["websocket"],
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
    "updatedAt": "ISO Date",
    "senderDetails": {
      "_id": "UserId",
      "username": "string",
      "profilePicture": { 
        "original": {
          "url": "string",
          "public_id": "string"
        },
        "profileView": "string",
        "commentView": "string"
      }
    },
    "roomDetails": {
      "roomName": "string",
      "currentMessageCount": "number"
    }
  }
  ```
- **Note:** The `members` array is stripped from this payload for privacy and efficiency. Message data is enriched with sender and room context to facilitate immediate UI updates.

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
- **Client Connection Error Handling:** The client should listen to `connect_error` to handle expired/invalid tokens and trigger access token regeneration.
  ```javascript
  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
    // e.g. Trigger token refresh and reconnect
  });
  ```
- **CORS Allowed Origins:** The socket server dynamically allows cross-origin requests from the client. Configured via the `FRONTEND_URL` environment variable (trailing slashes are automatically stripped to prevent origin matching mismatches) and falls back to `http://localhost:5173` in development.
- **Rate Limiting:** Notifications are grouped if unread and only emitted via socket if the time since the last update exceeds `GLOBAL_NOTIFICATION_LIMIT` (1 minute).

