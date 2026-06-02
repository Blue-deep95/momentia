import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../services/api";
import { login } from "../slices/authSlice";
import CarouselSlideshow from "../components/CarouselSlideshow";

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
    <div className="grid min-h-screen font-sans lg:grid-cols-[44%_56%]">
      
      {/* LEFT SIDE */}
      <div className="relative hidden overflow-hidden bg-slate-50 p-10 lg:flex lg:items-center lg:justify-center">
        <div className="absolute top-[-120px] left-[-100px] h-80 w-80 rounded-full bg-blue-200/20 blur-3xl"></div>
        <div className="absolute bottom-[-120px] right-[-100px] h-80 w-80 rounded-full bg-slate-200/60 blur-3xl"></div>
        <div className="relative z-10 h-[calc(100vh-3.5rem)] w-full max-w-[32rem]">
          <CarouselSlideshow />
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