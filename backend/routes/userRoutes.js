const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken.js");
const transporter = require("../utils/sendEmail.js");
const { getOtpTemplate } = require("../utils/emailTemplates.js");

// import the zod schema here
const {
  emailSchema,
  otpSchema,
  usernameSchema,
  otpEmailValidation,
  registerSchema,
  loginSchema,
} = require("../zodSchema/validationSchema.js");

router.post("/send-otp", async (req, res) => {
  try {
    // performa a zod validation here safe parsing to prevent crashing
    const validation = emailSchema.safeParse(req.body.email);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.errors.map((err) => err.message),
      });
    }
    const email = validation.data;
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email });
    }
    // ok here i will implement safeguard so that for production,
    // we get 12345 for normal development mode we set it to
    let otp = Math.floor(90000 * Math.random() + 10000);
    // only for production we use a simple otp
    user.otp =
      process.env.NODE_ENV === "production"
        ? process.env.PRODUCTION_OTP || "80215"
        : otp;
    user.otpExpiry = 5 * 60 * 1000 + Date.now();
    user.username = email;
    await user.save();
    //console.log(user);
    if (process.env.NODE_ENV !== "production") {
      const emailContent = getOtpTemplate(otp, "verification");
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    }
    return res.status(201).json({ message: "Email sent successfully" });
  } catch (err) {
    console.log("Server error in send-otp endpoint", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const validation = otpEmailValidation.safeParse({
      email: req.body.email,
      otp: req.body.otp,
    });
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid email or otp",
        errors: validation.error.errors.map((err) => err.message),
      });
    }
    const { email, otp } = validation.data;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User didnt created otp" });
    }
    if (user.otp != otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Otp expired" });
    }
    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();
    return res.status(200).json({ message: "Email Verified" });
  } catch (err) {
    console.log();
    res
      .status(500)
      .json({ message: "Internal server error while verifying otp" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const validation = registerSchema.safeParse({
      username: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.errors.map((err) => err.message),
      });
    }
    const { username, email, password } = validation.data;
    const user = await User.findOne({ email });

    if (!user || !user.isEmailVerified) {
      return res
        .status(400)
        .json({ message: "user email verification not completed" });
    }
    if (user.password) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.username = username;
    user.password = hashedPassword;

    // DO NOT DOCUMENT THEESE CHANGES TO API.MD FILE!
    // Extract the domain part of the email (everything after the '@')
    // for using and sending carousels to frontend since this a secret
    const domain = email.substring(email.lastIndexOf("@") + 1);
    // Check if the domain matches a specific target (e.g., 'something.com')
    if (domain && domain.toLowerCase() === "codegnan.com") {
      user.userType = "cdg";
    }

    await user.save();
    return res.status(201).json({ message: "user created successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.errors.map((err) => err.message),
      });
    }
    const { email, password } = validation.data;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ message: "invalid email or user not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "invalid password" });
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await User.findByIdAndUpdate(user._id, {
      $push: {
        newRefreshToken: {
          $each: [refreshToken],
          $position: 0,
          $slice: 2,
        },
      },
    });

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      accessToken: accessToken,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        // additionally give profile pictures too to the users
        // so it can be used with react-redux toolkit to send information
        profilePicture: user.profilePicture,
      },
      message: "Login successful",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "error from user login" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(10000 + Math.random() * 90000);

    user.otp =
      process.env.NODE_ENV === "production"
        ? process.env.PRODUCTION_OTP || "80215"
        : otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    if (process.env.NODE_ENV !== "production") {
      const emailContent = getOtpTemplate(otp, "reset");
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    }

    await user.save();
    return res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.otp != otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/regenerate-access-token", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN);
    const user = await User.findOne({
      _id: decoded.id,
      newRefreshToken: { $in: [refreshToken] },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid Session" });
    }


    const newAccessToken = generateAccessToken(user);
    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    console.log("Error in regenerate-access-token:", err.message);
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      let userId = null;
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN);
        userId = decoded.id;
      } catch (jwtErr) {
        console.log("JWT verify failed during logout (checking for decode):", jwtErr.message);
        try {
          const decoded = jwt.decode(refreshToken);
          userId = decoded?.id;
        } catch (decErr) {
          console.log("Failed to decode token:", decErr.message);
        }
      }

      if (userId) {
        await User.findByIdAndUpdate(userId, {
          $pull: { newRefreshToken: refreshToken },
        });
      }
    }
  } catch (err) {
    console.error("Logout database error:", err);
  } 
  finally {
    // no matter what happens log out the user
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      path: "/",
    });
    return res.status(200).json({ message: "Logout successful" });
  }
});

module.exports = router;
