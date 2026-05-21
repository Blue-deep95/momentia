// this file is mainly used to initialize the socket server and express app too
// initializing the socket server helps us to integrate auth middleware layer before everything
const { Server } = require("socket.io");
const { createServer } = require("node:http");
const express = require("express");
const { onlineUsers } = require("./socketStore"); // Require your Map
const { authSocketMiddleware } = require("./authSocketMiddleware.js");

const app = express();

const server = createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : null,
  "http://localhost:5173"
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Use the authmiddleware here
io.use(authSocketMiddleware);

io.on("connection", (socket) => {
  console.log(`A user ${socket.userId} logged in with socket->${socket.id}`);

  // try to map the current users to online users
  onlineUsers.set(socket.userId, socket.id);
  socket.emit("welcome", "Welcome to the Momentia!");

  socket.on("disconnect", () => {
    // on disconnect remove the user from the map
    onlineUsers.delete(socket.userId);
    console.log(`A user disconnected ${socket.id}`);
  });

  socket.on("message", (msg) => {
    console.log(`Message from the user${socket.id} is  ${msg}`);
  });
});

module.exports = { app, io, server };
