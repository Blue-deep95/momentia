const z = require("zod");

// this file is mainly for validating schema especially user authentication schema
// for now very simple implementation

const emailSchema = z.string().trim().email("Invalid Email!");
const otpSchema = z
  .string()
  .trim()
  .length(5, "OTP must be exactly 5 digits")
  .regex(/^\d+$/, "OTP must contain only numbers");
const usernameSchema = z
  .string()
  .trim()
  .min(5, "Username must be at least 5 characters")
  .max(30, "Username cannot be larger than 30 characters");
const bioSchema = z
  .string()
  .trim()
  .max(150, "Bio cannot be longer than 150 characters");
const captionSchema = z
  .string()
  .trim()
  .max(300, "Caption cannot be longer than 300 characters");
// the content schema is specifically for validating messages in the chat application
const contentSchema = z
  .string()
  .trim()
  .max(1000, "Content cannot exceed 1000 characters")
  .min(1, "Content cannot be empty");
// comment schema is similar to the above
const commentSchema = z
  .string()
  .trim()
  .max(1000, "Comment cannot exceed 1000 characters")
  .min(1, "Comment cannot be empty");

const otpEmailValidation = z.object({
  email: emailSchema,
  otp: otpSchema,
});

const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

module.exports = {
  commentSchema,
  contentSchema,
  emailSchema,
  otpSchema,
  usernameSchema,
  bioSchema,
  captionSchema,
  otpEmailValidation,
  registerSchema,
  loginSchema,
};
