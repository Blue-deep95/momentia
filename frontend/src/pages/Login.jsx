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
    <div className="grid min-h-screen font-sans lg:grid-cols-2">
      
      {/* LEFT SIDE */}
      <div className="bg-linear-to-br relative hidden flex-col justify-center overflow-hidden from-blue-600 via-indigo-600 to-purple-700 px-16 py-14 lg:flex">
        
        {/* Glow */}
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>

        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"></div>

        {/* Logo */}
        <div className="z-10 mb-8 flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/20 bg-white/10 text-5xl font-bold text-white backdrop-blur-xl">
          M
        </div>

        {/* Badge */}
        <div className="z-10 mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-indigo-100 backdrop-blur-xl">
          <span className="h-2 w-2 animate-pulse rounded-full bg-purple-200"></span>
          Welcome to Momentia
        </div>

        {/* Heading */}
        <h1 className="z-10 mb-6 text-6xl font-bold leading-tight text-white">
          Share your <br />
          <span className="text-purple-200">
            moments
          </span>{" "}
          with <br />
          the world
        </h1>

        {/* Text */}
        <p className="z-10 max-w-lg text-[16px] leading-8 text-white/75">
          Connect with friends, upload stories,
          explore reels and create your own
          social experience with Momentia.
        </p>

        {/* Stats */}
        <div className="z-10 mt-12 flex gap-5">
          {[
            ["2.1M", "Users"],
            ["14M", "Posts"],
            ["99%", "Active"],
          ].map(([num, text]) => (
            <div
              key={text}
              className="texmin-w-30drop-blur-xl min-w-30 rounded-3xl border border-white/20 bg-white/10 px-8 py-5"
            >
              <h2 className="text-2xl font-bold text-white">
                {num}
              </h2>

              <p className="mt-1 text-sm text-white/70">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center bg-white px-6 py-10 lg:px-16">
        
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md"
        >
          
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600">
            <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
            Welcome back
          </div>

          {/* Title */}
          <h1 className="mb-2 text-5xl font-bold text-gray-900">
            Sign in
          </h1>

          <p className="mb-8 text-[15px] text-gray-400">
            Continue your creative journey
          </p>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
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
                className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 pr-12 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
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
          <div className="mb-7 text-right">
            <span
              onClick={() =>
                navigate("/forgot-password")
              }
              className="cursor-pointer text-sm font-semibold text-indigo-600"
            >
              Forgot password?
            </span>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-linear-to-r flex w-full items-center justify-center gap-2 rounded-2xl from-blue-600 via-indigo-600 to-purple-600 py-4 font-bold text-white shadow-xl shadow-indigo-300/40 transition-all duration-300 hover:scale-[1.01]"
          >
            {loading
              ? "Signing in..."
              : "Sign In →"}
          </button>

          {/* Register */}
          <p className="mt-7 text-center text-sm text-gray-400">
            Don’t have an account?{" "}
            <span
              onClick={() =>
                navigate("/register")
              }
              className="cursor-pointer font-bold text-indigo-600"
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