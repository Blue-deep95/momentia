const express=require("express")
const router=express.Router()
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const User=require("../models/User.js")
const { generateAccessToken,generateRefreshToken } = require("../utils/generateToken.js")
const transporter= require("../utils/sendEmail.js")


router.post("/send-otp",async(req,res)=>{
    const {email} = req.body
    try{
        let user = await User.findOne({email})
        console.log("email", email)
        if (!user) {
            user= new User({email})
        }
        let otp  = Math.floor(90000 * Math.random() + 10000)
        user.otp= otp
         user.otpExpiry = 50 * 60 * 1000 + Date.now()
         user.username= email
        await user.save()
        console.log(user)
        await transporter.sendMail({
            from:process.env.EMAIL,
            to: email,
            subject: "OTP verification user",
            html:`<h2> OTP for email verification is ${otp}</h2>`
        })
        return res.status(201).json({ message:"Email sent successfully" })
    }
    catch(err){
        console.log("Server error in send-otp endpoint", err)
        res.status(500).json({ message:"Internal server error" })
    }
})

router.post("/verify-otp",async(req,res)=>{
    try{
        const { email, otp } = req.body
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "User didnt created otp" })
        }
        if (user.otp != otp || user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: "Otp expired" })
        }
        user.isEmailVerified = true
        user.otp = null
        user.otpExpiry = null
        await user.save()
        return res.status(200).json({ message: "Email Verified" })
    }
    catch(err){
        console.log()
        res.status(500).json({ message:"Internal server error while verifying otp" })
    }
})

router.post("/register",async(req,res)=>{
    try{
        const {name,email,password}=req.body
        const user=await User.findOne({email})

        if(!user.isEmailVerified){
            return res.status(400).json({ message:"user email verification not completed" })
        }
        if (user.password){
            return res.status(400).json({message:"User already exists!"})
        }

        const hashedPassword=await bcrypt.hash(password,10)
        user.username = name
        user.password = hashedPassword
        
        user.save()
        return res.status(201).json({ message:"user created successfully" })
    }
    catch(err){
        console.log(err)
        res.status(500).json({ message:"server error" })
    }
})


router.post("/login",async(req,res)=>{
    try{
        const {email,password}=req.body
        const user=await User.findOne({email})
        //console.log('request reached login route')

        if(!user){
            return res.status(400).json({ message:"invalid email or user not found" })
        }
        const isMatch=await bcrypt.compare(password,user.password)
        if(!isMatch){
            return res.status(400).json({ message:"invalid password" })
        }
       const accessToken=generateAccessToken(user)
       const refreshToken=generateRefreshToken(user)
       user.refreshToken=refreshToken
       await user.save()

       res.cookie("refreshToken",refreshToken, {
        httpOnly:true,
        sameSite:"lax",
        secure:false,
        path:"/",
        maxAge:7 * 24 * 60 * 60 * 1000
       })
       return res.status(200).json({accessToken:accessToken,
        user:{
            id: user._id,
            name: user.name,
            email: user.email,
            // aditionally give profile pictures too to the users
            // so it can be used with react-redux toolkit to send information
            profilePicture:user.profilePicture
        },
        message:"Login successful"
       })
    }
    catch(err){
        console.log(err)
        res.status(500).json({ message:"error from user login" })
    }
})


router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const otp = Math.floor(100000 + Math.random() * 900000)

        user.otp = otp
        user.otpExpiry = Date.now() + 50 * 60 * 1000 
        await transporter.sendMail({
            from:process.env.EMAIL,
            to: email,
            subject: "OTP for changin passowrd",
            html:`<h2> OTP for changing password is ${otp}</h2>`
        })

        await user.save()
        return res.status(200).json({ message: "OTP sent to email" })

    } catch (error) {
        console.error("Forgot Password Error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

router.post("/reset-password", async (req, res) => {
    try {
        const { email, otp, password } = req.body

        const user = await User.findOne({ email })

        if (!user || user.otp != otp || user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        user.password = hashedPassword
        user.otp = null
        user.otpExpiry = null

        await user.save()

        res.status(200).json({ message: "Password reset successful" })

    } catch (error) {
        console.error("Reset Password Error:", error)
        res.status(500).json({ message: "Server error" })
    }
})


router.post("/regenerate-access-token",async(req,res)=>{
    const refreshToken=req.cookies.refreshToken
    try{
        const decoded=jwt.verify(refreshToken,process.env.JWT_REFRESH_TOKEN)
        const user= await User.findById(decoded.id)
        if (!user){
            return res.status(400).json({ message:"user not found" })
        }
        const newAccessToken= generateAccessToken(user)
        return res.status(200).json({accessToken:newAccessToken})
    }
    catch(err){
        console.log(err)
        res.status(500).json({ message:"error from regenerate access token" })
    }
})

router.post("/logout",async(req,res)=>{
    const refreshToken = req.cookies.refreshToken
    const decoded=jwt.verify(refreshToken,process.env.JWT_REFRESH_TOKEN)
    const user=await User.findById(decoded.id)
    user.refreshToken= null
    await user.save()
    res.clearCookie("refreshToken")
    return res.status(200).json({ message:"Logout successful" })
})


module.exports=router