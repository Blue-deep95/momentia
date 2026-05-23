const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require("../models/User.js")
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken.js")
const transporter = require("../utils/sendEmail.js")

router.post("/send-otp", async (req, res) => {
    const { email } = req.body
    try {
        let user = await User.findOne({ email })
        console.log("email", email)
        if (!user) {
            user = new User({ email })
        }
        let otp = Math.floor(90000 * Math.random() + 10000)
        // only for production we use a simple otp
        user.otp = otp
        user.otpExpiry = 5 * 60 * 1000 + Date.now()
        user.username = email
        await user.save()
        console.log(user)
        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: "Momentia - Email Verification OTP",
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Momentia OTP Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; width: 100%; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
          
          <!-- Header Banner (Left panel theme - dark gradient background) -->
          <tr>
            <td style="background: linear-gradient(150deg, #071c1a 0%, #0b2e2b 100%); padding: 40px 30px; text-align: center;">
              <!-- Logo Container -->
              <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 20px auto;">
                <tr>
                  <td style="width: 44px; height: 44px; background-color: rgba(77, 217, 172, 0.08); border: 1.5px solid rgba(77, 217, 172, 0.4); border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="font-family: 'Fraunces', Georgia, serif; font-size: 22px; font-weight: bold; color: #4DD9AC; line-height: 44px; display: block;">M</span>
                  </td>
                  <td style="padding-left: 12px; vertical-align: middle; text-align: left;">
                    <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; font-family: 'Plus Jakarta Sans', sans-serif;">Momentia</span>
                  </td>
                </tr>
              </table>
              
              <!-- Subtle badge -->
              <div style="display: inline-block; padding: 5px 13px; background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.11); border-radius: 20px; margin-top: 10px;">
                <span style="display: inline-block; width: 6px; height: 6px; background-color: #4DD9AC; border-radius: 50%; margin-right: 6px; vertical-align: middle; box-shadow: 0 0 6px 2px rgba(77,217,172,0.4);"></span>
                <span style="font-size: 10px; color: #4DD9AC; font-weight: 600; letter-spacing: 1.8px; text-transform: uppercase; vertical-align: middle; font-family: 'Plus Jakarta Sans', sans-serif;">Verification Code</span>
              </div>
            </td>
          </tr>
          
          <!-- Email Content Body -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #111827; font-weight: 700; text-align: center; font-family: 'Plus Jakarta Sans', sans-serif;">Verify Your Email Address</h2>
              
              <p style="margin: 0 0 30px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center; font-family: 'Plus Jakarta Sans', sans-serif;">
                Welcome to Momentia! To complete your registration and start capturing your moments, please enter the verification code below on the signup page.
              </p>
              
              <!-- OTP Display Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #f0fdfb; border: 1.5px solid #0D9488; border-radius: 16px; padding: 18px 36px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.05);">
                      <span style="font-size: 32px; font-weight: 800; color: #0D9488; letter-spacing: 6px; font-family: monospace;">${otp}</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5; font-family: 'Plus Jakarta Sans', sans-serif;">
                This code is valid for <strong>5 minutes</strong>. If you did not request this email, you can safely ignore it.
              </p>
              
              <div style="height: 1px; background-color: #e5e7eb; margin: 30px 0;"></div>
              
              <!-- Footer info -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="font-size: 11px; color: #9ca3af; line-height: 1.5; font-family: 'Plus Jakarta Sans', sans-serif;">
                    &copy; 2026 Momentia. Share your world.<br>
                    This is an automated system message. Please do not reply.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
        })
        return res.status(201).json({ message: "Email sent successfully" })
    }
    catch (err) {
        console.log("Server error in send-otp endpoint", err)
        res.status(500).json({ message: "Internal server error" })
    }
})

router.post("/verify-otp", async (req, res) => {
    try {
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
    catch (err) {
        console.log()
        res.status(500).json({ message: "Internal server error while verifying otp" })
    }
})

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body
        const user = await User.findOne({ email })

        if (!user.isEmailVerified) {
            return res.status(400).json({ message: "user email verification not completed" })
        }
        if (user.password) {
            return res.status(400).json({ message: "User already exists!" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        user.username = name
        user.password = hashedPassword

        // DO NOT DOCUMENT THEESE CHANGES TO API.MD FILE!
        // Extract the domain part of the email (everything after the '@')
        // for using and sending carousels to frontend since this a secret
        const domain = email.substring(email.lastIndexOf("@") + 1);
        // Check if the domain matches a specific target (e.g., 'something.com')
        if (domain && domain.toLowerCase() === "codegnan.com") {
            user.userType = "cdg";
        }

        await user.save()
        return res.status(201).json({ message: "user created successfully" })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ message: "server error" })
    }
})


router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email })
        //console.log('request reached login route')

        if (!user) {
            return res.status(400).json({ message: "invalid email or user not found" })
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: "invalid password" })
        }
        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)
        user.refreshToken = refreshToken
        await user.save()

        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction,
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        return res.status(200).json({
            accessToken: accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                // aditionally give profile pictures too to the users
                // so it can be used with react-redux toolkit to send information
                profilePicture: user.profilePicture
            },
            message: "Login successful"
        })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ message: "error from user login" })
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
        user.otpExpiry = Date.now() + 5 * 60 * 1000
        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: "Momentia - Reset Password OTP",
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Momentia Reset Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; width: 100%; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
          
          <!-- Header Banner (Left panel theme - dark gradient background) -->
          <tr>
            <td style="background: linear-gradient(150deg, #071c1a 0%, #0b2e2b 100%); padding: 40px 30px; text-align: center;">
              <!-- Logo Container -->
              <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 20px auto;">
                <tr>
                  <td style="width: 44px; height: 44px; background-color: rgba(77, 217, 172, 0.08); border: 1.5px solid rgba(77, 217, 172, 0.4); border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="font-family: 'Fraunces', Georgia, serif; font-size: 22px; font-weight: bold; color: #4DD9AC; line-height: 44px; display: block;">M</span>
                  </td>
                  <td style="padding-left: 12px; vertical-align: middle; text-align: left;">
                    <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; font-family: 'Plus Jakarta Sans', sans-serif;">Momentia</span>
                  </td>
                </tr>
              </table>
              
              <!-- Subtle badge -->
              <div style="display: inline-block; padding: 5px 13px; background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.11); border-radius: 20px; margin-top: 10px;">
                <span style="display: inline-block; width: 6px; height: 6px; background-color: #4DD9AC; border-radius: 50%; margin-right: 6px; vertical-align: middle; box-shadow: 0 0 6px 2px rgba(77,217,172,0.4);"></span>
                <span style="font-size: 10px; color: #4DD9AC; font-weight: 600; letter-spacing: 1.8px; text-transform: uppercase; vertical-align: middle; font-family: 'Plus Jakarta Sans', sans-serif;">Security Verification</span>
              </div>
            </td>
          </tr>
          
          <!-- Email Content Body -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #111827; font-weight: 700; text-align: center; font-family: 'Plus Jakarta Sans', sans-serif;">Reset Your Password</h2>
              
              <p style="margin: 0 0 30px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center; font-family: 'Plus Jakarta Sans', sans-serif;">
                We received a request to reset your Momentia password. Enter the verification code below on the password reset page to choose a new password.
              </p>
              
              <!-- OTP Display Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #f0fdfb; border: 1.5px solid #0D9488; border-radius: 16px; padding: 18px 36px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.05);">
                      <span style="font-size: 32px; font-weight: 800; color: #0D9488; letter-spacing: 6px; font-family: monospace;">${otp}</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5; font-family: 'Plus Jakarta Sans', sans-serif;">
                This code is valid for <strong>5 minutes</strong>. If you did not request this email, you can safely ignore it.
              </p>
              
              <div style="height: 1px; background-color: #e5e7eb; margin: 30px 0;"></div>
              
              <!-- Footer info -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="font-size: 11px; color: #9ca3af; line-height: 1.5; font-family: 'Plus Jakarta Sans', sans-serif;">
                    &copy; 2026 Momentia. Share your world.<br>
                    This is an automated system message. Please do not reply.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
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


router.post("/regenerate-access-token", async (req, res) => {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token not found" })
    }
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN)
        const user = await User.findById(decoded.id)
        if (!user) {
            return res.status(401).json({ message: "User not found" })
        }
        const newAccessToken = generateAccessToken(user)
        return res.status(200).json({ accessToken: newAccessToken })
    }
    catch (err) {
        console.log("Error in regenerate-access-token:", err.message)
        return res.status(401).json({ message: "Invalid or expired refresh token" })
    }
})

router.post("/logout", async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken
        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN)
                const user = await User.findById(decoded.id)
                if (user) {
                    user.refreshToken = null
                    await user.save()
                }
            } catch (jwtErr) {
                // If token is invalid or expired, we still clear the cookie on the browser
                console.log("JWT verify failed during logout:", jwtErr.message)
            }
        }
    } catch (err) {
        console.error("Logout database error:", err)
    }

    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        path: "/"
    })
    return res.status(200).json({ message: "Logout successful" })
})


module.exports = router