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
const asyncHandler = require("../middleware/asyncHandler");

// import the zod schema here
const {
  emailSchema,
  otpEmailValidation,
  registerSchema,
  loginSchema,
} = require("../zodSchema/validationSchema.js");

router.post("/send-otp", asyncHandler(async (req, res) => {
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

  let otp = Math.floor(90000 * Math.random() + 10000);
  user.otp =
    process.env.NODE_ENV === "production"
      ? process.env.PRODUCTION_OTP || "80215"
      : otp;
  user.otpExpiry = 5 * 60 * 1000 + Date.now();
  user.username = email;
  await user.save();

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
}));

router.post("/verify-otp", asyncHandler(async (req, res) => {
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
}));

router.post("/register", asyncHandler(async (req, res) => {
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

  await user.save();
  return res.status(201).json({ message: "user created successfully" });
}));

router.post("/login", asyncHandler(async (req, res) => {
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
      profilePicture: user.profilePicture,
    },
    message: "Login successful",
  });
}));

router.post("/forgot-password", asyncHandler(async (req, res) => {
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
}));

router.post("/reset-password", asyncHandler(async (req, res) => {
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
}));

router.post("/regenerate-access-token", asyncHandler(async (req, res) => {
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
  } catch (_err) {
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }
}));

router.post("/logout", asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    let userId = null;
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN);
      userId = decoded.id;
    } catch (_jwtErr) {
      try {
        const decoded = jwt.decode(refreshToken);
        userId = decoded?.id;
      } catch (_decErr) {
        // silent fallback
      }
    }

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $pull: { newRefreshToken: refreshToken },
      });
    }
  }

  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
  });
  return res.status(200).json({ message: "Logout successful" });
}));

module.exports = router;
