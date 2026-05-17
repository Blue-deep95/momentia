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

// import db 
const connectDB = require('./db/db.js')


const PORT = 2000


// change this for production 
// app.use(cors(
//     {
//         origin: "http://localhost:5173",
//         credentials: true
//     }
// ))


// to simplyfy testing just use cors with origin set to true
// WARNING !!!!NEVER PUSH THIS INTO PRODUCTION !!!!!
// UNCOMMENT THE ABOVE CODE FOR PRODUCTION USE!!!
app.use(cors({
    origin: true,
    credentials: true
}))


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())


// trying to connect db
connectDB(app)

// routes
app.use("/api/user", userRoutes)
app.use("/api/profile", protect, profileRoutes) // call the middleware right here
app.use("/api/post", protect, postRoutes)
app.use("/api/comment", protect, commentRoutes)
app.use("/api/follow", protect, followRoutes)
app.use("/api/feed", protect, feedRoutes)
app.use("/api/search", protect, searchRoutes)
app.use("/api/notifications",protect,notificationRoutes)

// event listeners
require('./services/notificationService.js')


// newer listen that handles both http and web socket connections
server.listen(PORT, () => console.log('server running on', PORT))

// the older app.listen to handle http requests
//app.listen(PORT, () => console.log('Server is running on', PORT))
