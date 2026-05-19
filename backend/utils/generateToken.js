const jwt = require('jsonwebtoken')

// takes user as an input and returns a signed jwt token using .env files
const generateAccessToken = (user)=>{
    return jwt.sign({id:user._id,},process.env.JWT_ACCESS_TOKEN,{expiresIn:'15m'})
}


const generateRefreshToken = (user) =>{
    return jwt.sign({id:user._id},process.env.JWT_REFRESH_TOKEN,{expiresIn:'30d'})
}

module.exports = {generateAccessToken,generateRefreshToken}
