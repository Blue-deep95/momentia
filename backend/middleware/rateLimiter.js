// This file is to limit how many requests a user can make to the server 
// within a specific time period

const rateLimit = require("express-rate-limit")


const globalLimiter = rateLimit({

    // 15 minutes
    windowMs: 15 * 60 * 1000,

    // limit each IP
    max: 200,

    message: {
        message:
            "Too many requests. Please try again later."
    },


    standardHeaders: true,

    legacyHeaders: false,
})




module.exports = globalLimiter;