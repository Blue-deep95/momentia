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

// import db 
const connectDB = require('./db/db.js')


const PORT = process.env.PORT || 2000


// change this for production 
// app.use(cors(
//     {
//         origin: "http://localhost:5173",
//         credentials: true
//     }
// ))




app.use(cors({
    origin: process.env.NODE_ENV === 'development' ? true : process.env.FRONTEND_URL,
    credentials: true
}))


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())


// trying to connect db
connectDB(app)
console.log('request reached server')
// routes
app.use("/api/user", userRoutes)
app.use("/api/profile", protect, profileRoutes) // call the middleware right here
app.use("/api/post", protect, postRoutes)
app.use("/api/comment", protect, commentRoutes)
app.use("/api/follow", protect, followRoutes)
app.use("/api/feed", protect, feedRoutes)
app.use("/api/search", protect, searchRoutes)
app.use("/api/notifications",protect,notificationRoutes)
app.use("/api/message",protect,messageRoutes)

// event listeners
require('./services/notificationService.js') // for sending notifications
require('./services/messageService.js') // for sending chat messages to the frontend


// newer listen that handles both http and web socket connections
server.listen(PORT, () => console.log('server running on', PORT))

// the older app.listen to handle http requests
//app.listen(PORT, () => console.log('Server is running on', PORT))
