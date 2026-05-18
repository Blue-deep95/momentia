# Insta-clone (Momentia) Project Context

This project is a full-stack social media application (Instagram clone) built with the MERN stack.

## Project Overview

*   **Architecture:** Monorepo-style structure with separate `backend` and `frontend` directories.
*   **Backend:** Node.js, Express, MongoDB (via Mongoose).
*   **Frontend:** React 19, Vite, Tailwind CSS 4, Redux Toolkit, React Router 7.
*   **Authentication:** JWT-based authentication with access and refresh tokens.
*   **Real-time Messaging:** Hybrid HTTP/WebSocket system for DMs and Group chats with unread tracking and sequence numbers.
*   **Notification System:** Event-driven architecture with grouping logic and TTL-based purging.
*   **Media Storage:** Cloudinary for image uploads and transformations.
*   **Emails:** NodeMailer for system emails (e.g., OTP for email verification).

## Foundational Documents

- **API Documentation:** Refer to [API.md](./API.md) for RESTful endpoint details.
- **Socket Reference:** Refer to [SOCKET.md](./SOCKET.md) for real-time events and handshake details.
- **Project Design & Styling:** Refer to [DESIGN.md](./DESIGN.md) for visual language and UI standards.

## Core Technical Constraints & Architectural Patterns

### 1. Atomic Database Operations
*   **Requirement:** All counter-based operations (likes, comments, message sequences, unread counts) MUST use MongoDB atomic operators (`$inc`, `$push`, `$pull`).
*   **Rationale:** Prevents race conditions and "over-counting" in high-concurrency environments.
*   **Example:** Use `findOneAndUpdate` with `$inc` instead of fetching, incrementing in JS, and saving.

### 2. Decoupled Event Architecture
*   **Requirement:** HTTP routes must NOT directly invoke Socket.io or heavy background services.
*   **Pattern:** Use the internal `EventEmitter` bus (`backend/events/event.js`). Routes emit events (e.g., `new-message`, `new-notification`), and specialized services (`messageService.js`, `notificationService.js`) listen and act.

### 3. Lightweight Auth Context
*   **Requirement:** `req.user` should only contain the user ID (e.g., `{ _id: "..." }`).
*   **Rationale:** Minimizes DB lookups on protected routes. Fetch full user profiles only when explicitly needed.

### 4. Notification Grouping & TTL
*   **Requirement:** Read notifications must be automatically purged after 48 hours using MongoDB TTL indexes (`expiresAt`).
*   **Grouping:** Similar notifications (e.g., multiple likes on one post) must be grouped into a single document with an `actorCount` and `actors` array.

## Building and Running

### Prerequisites
*   Node.js installed.
*   MongoDB instance (local or Atlas).
*   Cloudinary account for image handling.

### Backend
1.  Navigate to `backend/`.
2.  Install dependencies: `npm install`.
3.  Configure `.env` file (see `backend/index.js` for required variables).
4.  Run the server: `npm start` (starts with `nodemon`).
5.  Default Port: `2000`.

### Frontend
1.  Navigate to `frontend/`.
2.  Install dependencies: `npm install`.
3.  Run the development server: `npm run dev`.
4.  Default Port: `5173`.

## Development Conventions

### Backend
*   **Module System:** CommonJS (`require`/`module.exports`).
*   **Routing:** Organized in `backend/routes/`.
*   **Middleware:** Custom middleware (like `authMiddleware.js`) for protection and validation.
*   **Events:** Utilize `messageBus` and `notificationBus` for cross-module signaling.

### Frontend
*   **Module System:** ESM (`import`/`export`).
*   **State Management:** Redux Toolkit (Slices in `src/slices/`, Store in `src/store/`).
*   **Styling:** Tailwind CSS 4.
*   **API Calls:** Centralized in `frontend/src/services/api.js`.

### General
*   **Validation:** Use idiomatic patterns (Mongoose schemas, frontend type checking).
*   **Testing:** TODO: Implement unit and integration tests.


