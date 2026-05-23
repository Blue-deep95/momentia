import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../services/api";
import { login } from "../slices/authSlice";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/user/login", form);

      dispatch(
        login({
          user: res.data.user,
          accessToken: res.data.accessToken,
        })
      );

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-sans">
      
      {/* LEFT SIDE */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-16 py-14 flex-col justify-center">
        
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>

        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>

        {/* Logo */}
        <div className="w-24 h-24 rounded-[28px] bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white text-5xl font-bold mb-8 z-10">
          M
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-xl rounded-full px-4 py-2 text-sm text-indigo-100 font-semibold w-fit mb-6 z-10">
          <span className="w-2 h-2 rounded-full bg-purple-200 animate-pulse"></span>
          Welcome to Momentia
        </div>

        {/* Heading */}
        <h1 className="text-white text-6xl leading-tight font-bold mb-6 z-10">
          Share your <br />
          <span className="text-purple-200">
            moments
          </span>{" "}
          with <br />
          the world
        </h1>

        {/* Text */}
        <p className="text-white/75 text-[16px] leading-8 max-w-lg z-10">
          Connect with friends, upload stories,
          explore reels and create your own
          social experience with Momentia.
        </p>

        {/* Stats */}
        <div className="flex gap-5 mt-12 z-10">
          {[
            ["2.1M", "Users"],
            ["14M", "Posts"],
            ["99%", "Active"],
          ].map(([num, text]) => (
            <div
              key={text}
              className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-3xl px-8 py-5 min-w-[120px] text-center"
            >
              <h2 className="text-white text-2xl font-bold">
                {num}
              </h2>

              <p className="text-white/70 text-sm mt-1">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="bg-white flex items-center justify-center px-6 py-10 lg:px-16">
        
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md"
        >
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 rounded-full px-4 py-2 text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            Welcome back
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold text-gray-900 mb-2">
            Sign in
          </h1>

          <p className="text-gray-400 text-[15px] mb-8">
            Continue your creative journey
          </p>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mb-5">
            <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={
                  showPass ? "text" : "password"
                }
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 pr-12 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPass(!showPass)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                👁
              </button>
            </div>
          </div>

          {/* Forgot */}
          <div className="text-right mb-7">
            <span
              onClick={() =>
                navigate("/forgot-password")
              }
              className="text-indigo-600 font-semibold text-sm cursor-pointer"
            >
              Forgot password?
            </span>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:scale-[1.01] transition-all duration-300 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-300/40 flex items-center justify-center gap-2"
          >
            {loading
              ? "Signing in..."
              : "Sign In →"}
          </button>

          {/* Register */}
          <p className="text-center text-gray-400 text-sm mt-7">
            Don’t have an account?{" "}
            <span
              onClick={() =>
                navigate("/register")
              }
              className="text-indigo-600 font-bold cursor-pointer"
            >
              Create Account
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;