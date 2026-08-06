import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../services/api";
import { login } from "../slices/authSlice";

/* ───────────────── FLOAT CARD ───────────────── */
const FloatCard = ({ title, sub }) => (
  <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-xl">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 font-bold text-white">
        M
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-xs text-blue-100/70">{sub}</p>
      </div>
    </div>
  </div>
);

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
      
      {/* ───────────────── LEFT SIDE ───────────────── */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 p-10 lg:flex">
        {/* glow */}
        <div className="absolute -left-25 -top-30 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl"></div>
        <div className="absolute -bottom-30 -right-25 h-80 w-80 rounded-full bg-purple-400/20 blur-3xl"></div>

        <div className="relative z-10 flex w-full flex-col justify-between">
          <FloatCard
            title="Welcome back"
            sub="Connect with your friends"
          />

          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-lg">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-300"></div>
              <span className="text-xs uppercase tracking-[3px] text-blue-100">
                Momentia Social
              </span>
            </div>

            <h1 className="text-6xl font-black leading-tight text-white">
              Capture your
              <span className="block text-blue-200">best moments</span>
            </h1>

            <p className="mt-6 max-w-md leading-7 text-blue-100/80">
              Share posts, explore reels, talk with friends, and discover endless creative stories.
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

          <FloatCard title="@momentia community" sub="Explore & Share" />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center bg-white px-6 py-10 lg:px-10">
        
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