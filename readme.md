# Momentia

Momentia is a full-stack social media application inspired by Instagram, engineered with a robust and decoupled MERN architecture to support real-time interactions, messaging, and content creation.

## Foundational Documents

- [API Reference](API.md) - Complete reference for all RESTful HTTP endpoints, requests, and response payloads.
- [Socket Reference](SOCKET.md) - Reference for real-time WebSocket events, connection handshakes, and chat protocol payloads.


---

## Project Overview

Momentia is built as a monorepo containing decoupled backend and frontend environments:
- **Backend**: Node.js, Express, and MongoDB using Mongoose, integrated with Socket.io for real-time event distribution.
- **Frontend**: Single Page Application (SPA) built with React 19, Vite, React Router 7, Redux Toolkit for global state management, and styled with Tailwind CSS 4.

The project is designed to handle user interactions like post sharing, real-time messaging, follow relationships, and notifications under high-concurrency constraints.

---

## Key Features

- **Authentication**: Secure registration, email verification using OTP (One-Time Password) sent via NodeMailer, JWT access and refresh tokens, and password hashing using bcrypt.
- **Content Creation**: Support for uploading single/multiple images (up to 5) or videos per post, complete with caption formatting, hashtags, and user mentions.
- **Social Interactions**: Real-time liking/unliking of posts, deep nested commenting systems, and user follower/following relationships.
- **Real-Time Direct & Group Messaging**: Private direct messages (DMs) and group rooms with unread message counts, message sequence numbers, typing indicators, and room participation management.
- **Event-Driven Notifications**: Real-time notifications for likes, follows, comments, and mentions. Notifications utilize grouping logic (e.g., combining multiple likes on a single post) and TTL-based database cleanup.
- **Optimized Media Delivery**: Media uploads are routed directly to Cloudinary, leveraging Cloudinary transformations to deliver resized, responsive WebP images and MP4 videos at standardized aspect ratios.

---

## Core Technical Constraints and Architectural Patterns

### 1. Atomic Database Operations
To prevent race conditions and ensure accurate metric updates (such as like counts, comment counts, and message sequence numbers), all counters use MongoDB atomic operators (like `$inc`, `$push`, and `$pull`) via Mongoose queries. Arithmetic operations are not performed in the application runtime memory.

### 2. Decoupled Event Architecture
HTTP routes do not directly invoke heavy background services or Socket.io events. Routes trigger operations and immediately emit events to an internal `EventEmitter` message bus. Dedicated service listeners subscribe to these events to execute follow-up tasks such as notification generation, background mailing, and Socket.io broadcasts.

### 3. Lightweight Authentication Context
The authentication middleware populates `req.user` with only the user ID (`_id`). This avoids redundant database lookups on protected routes, fetching full profiles only when explicitly required by a specific route.

### 4. Notification Grouping and TTL Purging
Read notifications are automatically purged from the MongoDB database after 48 hours utilizing MongoDB TTL (Time-To-Live) indexes on the `expiresAt` field. Similar activities (e.g., multiple users liking the same post) are grouped into a single notification document to reduce database reads.

---

## Tech Stack

### Frontend
- **Framework**: React 19 (ES Modules)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **State Management**: Redux Toolkit (Slices and centralized Store)
- **Routing**: React Router 7

### Backend
- **Runtime**: Node.js (CommonJS modules)
- **Framework**: Express
- **Database**: MongoDB (Object modeling via Mongoose)
- **Real-time Engine**: Socket.io
- **Mailing**: NodeMailer (OTP and system notifications)
- **Media Delivery**: Cloudinary

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance (local or Atlas)
- Cloudinary account credentials
- SMTP mail server credentials (for OTP emails)

### Directory Structure
```
insta-clone-momentia/
├── backend/            # Express server, MongoDB models, event services, socket logic
└── frontend/           # Vite dev server, React components, Redux state, styling
```

---

## Installation and Configuration

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend/` directory and configure the following variables:
   ```env
   PORT=2000
   MONGODB_URL=your_mongodb_connection_string
   JWT_ACCESS_TOKEN=your_jwt_access_secret
   JWT_REFRESH_TOKEN=your_jwt_refresh_secret
   EMAIL=your_smtp_email_address
   PASSWORD=your_smtp_email_password
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```

4. Start the backend development server:
   ```bash
   npm start
   ```
   The backend server will run on port `2000`.

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend application will run on `http://localhost:5173`.