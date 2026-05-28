import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

/* ───────────────── FLOAT CARD ───────────────── */
const FloatCard = ({ title, sub }) => (
  <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-xl">
    <div className="flex items-center gap-3">
      <div className="bg-linear-to-br flex h-10 w-10 items-center justify-center rounded-full from-blue-500 to-purple-500 font-bold text-white">
        M
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-xs text-blue-100/70">{sub}</p>
      </div>
    </div>
  </div>
);

/* ───────────────── INPUT FIELD ───────────────── */
const Field = ({
  label,
  type = "text",
  name,
  placeholder,
  value,
  onChange,
  disabled = false,
  extra,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="mb-5">
      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </label>

      <div className="relative">
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-sm outline-none transition-all duration-300 ${
            focused
              ? "border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
              : "border-gray-200"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          style={{
            paddingRight: extra ? 50 : 16,
          }}
        />

        {extra && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {extra}
          </div>
        )}
      </div>
    </div>
  );
};

/* ───────────────── EYE ICON ───────────────── */
const EyeIcon = ({ show, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="text-gray-400 transition hover:text-blue-600"
  >
    {show ? "🙈" : "👁️"}
  </button>
);

/* ───────────────── REGISTER ───────────────── */
const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [otpStatus, setOtpStatus] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* ───────────────── SEND OTP ───────────────── */
  const handleSendOtp = async () => {
    if (!formData.email) {
      setError("Please enter your email");
      return;
    }

    try {
      setError("");
      setOtpStatus("sending");

      await api.post("/user/send-otp", {
        email: formData.email.trim(),
      });

      setOtpStatus("sent");
    } catch (err) {
      setError("Failed to send OTP");
      setOtpStatus("idle");
    }
  };

  /* ───────────────── VERIFY OTP ───────────────── */
  const handleVerifyOtp = async () => {
    try {
      setError("");
      setOtpStatus("verifying");

      await api.post("/user/verify-otp", {
        email: formData.email.trim(),
        otp: otp.trim(),
      });

      setOtpStatus("verified");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
      setOtpStatus("sent");
    }
  };

  /* ───────────────── REGISTER ───────────────── */
  const handleRegister = async (e) => {
    e.preventDefault();

    if (otpStatus !== "verified") {
      setError("Please verify OTP");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/user/register", formData);

      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen font-sans lg:grid-cols-2">
      {/* ───────────────── LEFT ───────────────── */}
      <div className="bg-linear-to-br relative hidden overflow-hidden from-blue-700 via-indigo-700 to-purple-700 p-10 lg:flex">
        {/* glow */}
        <div className="-left-25 -top-30 absolute h-80 w-80 rounded-full bg-blue-400/20 blur-3xl"></div>

        <div className="-bottom-30 -right-25 absolute h-80 w-80 rounded-full bg-purple-400/20 blur-3xl"></div>

        <div className="relative z-10 flex w-full flex-col justify-between">
          <FloatCard
            title="@creative_world joined"
            sub="Welcome to Momentia"
          />

          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-lg">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-300"></div>
              <span className="text-xs uppercase tracking-[3px] text-blue-100">
                Join Today
              </span>
            </div>

            <h1 className="text-6xl font-black leading-tight text-white">
              Start your
              <span className="block text-blue-200">creative journey</span>
            </h1>

            <p className="mt-6 max-w-md leading-7 text-blue-100/80">
              Connect with creators, share moments, and build your digital
              world with beautiful experiences.
            </p>

            <div className="mt-10 grid grid-cols-3 overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl">
              {[
                ["2.1M", "Creators"],
                ["14M", "Posts"],
                ["98%", "Happy"],
              ].map(([num, text]) => (
                <div key={text} className="p-5 text-center">
                  <h3 className="text-2xl font-bold text-white">{num}</h3>
                  <p className="mt-1 text-xs uppercase tracking-widest text-blue-100/70">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <FloatCard title="@momentia trending" sub="Blue & Purple Theme" />
        </div>
      </div>

      {/* ───────────────── RIGHT ───────────────── */}
      <div className="relative flex items-center justify-center overflow-hidden bg-white px-6 py-12">
        <div className="-right-25 -top-25 absolute h-72 w-72 rounded-full bg-blue-100 blur-3xl"></div>

        <div className="-bottom-25 -left-25 absolute h-72 w-72 rounded-full bg-purple-100 blur-3xl"></div>

        <form
          onSubmit={handleRegister}
          className="relative z-10 w-full max-w-md"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
            Create your account
          </div>

          <h2 className="text-5xl font-black text-gray-900">Sign up</h2>

          <p className="mb-8 mt-3 text-gray-500">
            Begin your journey with Momentia
          </p>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Field
            label="Full Name"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
          />

          {/* EMAIL */}
          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Email Address
            </label>

            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                disabled={otpStatus === "verified"}
                className="flex-1 rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
              />

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={
                  otpStatus === "sending" ||
                  otpStatus === "verified"
                }
                className="bg-linear-to-r rounded-2xl from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white shadow-lg transition hover:scale-105 disabled:opacity-50"
              >
                {otpStatus === "sending"
                  ? "Sending..."
                  : otpStatus === "verified"
                  ? "Verified"
                  : "Send OTP"}
              </button>
            </div>
          </div>

          {/* OTP */}
          {(otpStatus === "sent" || otpStatus === "verifying") && (
            <div className="mb-5">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Verification Code
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="flex-1 rounded-2xl border border-blue-300 px-4 py-3.5 text-sm tracking-[5px] outline-none focus:shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
                />

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="bg-linear-to-r rounded-2xl from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white shadow-lg transition hover:scale-105"
                >
                  {otpStatus === "verifying"
                    ? "Checking..."
                    : "Verify"}
                </button>
              </div>
            </div>
          )}

          {/* PASSWORD */}
          <Field
            label="Password"
            type={showPass ? "text" : "password"}
            name="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
            disabled={otpStatus !== "verified"}
            extra={
              otpStatus === "verified" ? (
                <EyeIcon
                  show={showPass}
                  onToggle={() => setShowPass(!showPass)}
                />
              ) : null
            }
          />

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading || otpStatus !== "verified"}
            className="bg-linear-to-r mt-3 w-full rounded-2xl from-blue-600 via-indigo-600 to-purple-600 py-4 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account →"}
          </button>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="cursor-pointer font-bold text-blue-600 hover:text-purple-600"
            >
              Sign in
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;