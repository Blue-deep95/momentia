const express = require('express')
require("dotenv").config()
const cors = require("cors")
const cookieParser = require("cookie-parser")

// since we first created the socket server import express ,server from that file first 
const {app,server} = require('./socket/socket.js')

// import protect middleware 
const { protect } = require('./middleware/authMiddleware.js')

// import routes
const userRoutes = require('./routes/userRoutes.js')
const profileRoutes = require('./routes/profileRoutes.js')
const postRoutes = require('./routes/postRoutes.js')
const commentRoutes = require('./routes/commentRoutes.js')
const followRoutes = require('./routes/followRoutes.js')
const feedRoutes = require('./routes/feedRoutes.js')
const searchRoutes = require('./routes/searchRoutes.js')
const notificationRoutes = require('./routes/notificationRoutes.js')
const messageRoutes = require('./routes/messageRoutes.js')
const globalLimiter = require("./middleware/rateLimiter.js")

// import db 
const connectDB = require('./db/db.js')


const PORT = process.env.PORT || 2000

app.use(cors({
    origin: process.env.NODE_ENV === 'development' ? true : process.env.FRONTEND_URL,
    credentials: true
}))


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

//Global rate limiter
app.use(globalLimiter)


// trying to connect db
connectDB(app)

// routes
app.use("/api/user", userRoutes)
app.use("/api/profile", protect, profileRoutes) // call the middleware right here
app.use("/api/post", protect, postRoutes)
app.use("/api/comment", protect, commentRoutes)
app.use("/api/follow", protect, followRoutes)
app.use("/api/feed",feedRoutes)
app.use("/api/search", protect, searchRoutes)
app.use("/api/notifications",protect,notificationRoutes)
app.use("/api/message",protect,messageRoutes)

const errorHandler = require('./middleware/errorHandler.js')

// event listeners
require('./services/notificationService.js') // for sending notifications
require('./services/messageService.js') // for sending chat messages to the frontend

// Global error handler middleware - MUST be mounted after all routes
app.use(errorHandler)


// newer listen that handles both http and web socket connections
server.listen(PORT, () => console.log('server running on', PORT))

// the older app.listen to handle http requests
//app.listen(PORT, () => console.log('Server is running on', PORT))
