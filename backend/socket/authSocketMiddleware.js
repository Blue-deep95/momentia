
// This file is mainly for validating access tokens with middleware before a connection happens 
// to perfectly use this middleware place it on top just above io.on(connection) event

const jwt = require('jsonwebtoken')

const authSocketMiddleware = (socket,next) => {
    // expect a token from the frontend 
    const token = socket.handshake.auth.token;

    if(!token){
        return next( new Error('Authentication error no token provided!'))
    }

    try{
        const decoded = jwt.verify(token,process.env.JWT_ACCESS_TOKEN)
        // similar to req.user in express , attatch the user id to socket
        socket.userId = decoded.id
        next() // call the next 
    }
    catch(err){
        return next( new Error('Authentication error: Invalid token'))
    }
}

module.exports = {authSocketMiddleware}