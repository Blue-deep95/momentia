import React, { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
const Register = lazy(() => import("./pages/Register.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Feed = lazy(() => import("./pages/Feed.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const SearchPage = lazy(() => import("./pages/SearchPage.jsx"));
const Reels = lazy(() => import("./pages/Reels.jsx"));
const CreatePost = lazy(() => import("./pages/CreatePost.jsx"));
const SinglePost = lazy(() => import("./pages/SinglePost.jsx"));
const MessagePage = lazy(() => import("./pages/MessagePage.jsx"));
const Notifications = lazy(() => import("./pages/NotificationsPage.jsx"));
const TopStudents = lazy(() => import("./pages/TopStudents.jsx"));
import { initSocket, disconnectSocket } from "./socket.js"
import { login, logout } from "./slices/authSlice.js"
import api from "./services/api.js"

const ProtectedRoutes = lazy(() => import('./components/ProtectedRoutes.jsx'));
import NotificationToaster from './components/NotificationToaster.jsx'

export default function App() {
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();


  // socket instance starts here this instance can be used throughout the frontend 
  // also handles access tokens refreshing naturally using api from api.js
  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }

    const socket = initSocket(token);
    if (!socket) return;

    window.__socket = socket;
    window.dispatchEvent(new Event("socket-ready"));

    socket.on("connect", () => {
      console.log("Global socket connected:", socket.id);
    });
    socket.on("disconnect", (reason) => {
      console.log("Global socket disconnected:", reason);
    });
    socket.on("connect_error", async (err) => {
      console.error("Global socket connect error:", err.message || err);
      // Check if this error is due to an authentication failure/expired token
      if (err.message && (err.message.includes("Authentication error") || err.message.includes("Invalid token"))) {
        console.log("Socket connection rejected due to authentication error. Attempting to refresh token...");
        try {
          const res = await api.post("/user/regenerate-access-token");
          const newAccessToken = res.data.accessToken;
          console.log("Successfully regenerated token from socket connect_error handler. Dispatching update...");
          dispatch(login({ user, accessToken: newAccessToken }));
        } catch (refreshErr) {
          console.error("Failed to regenerate token after socket connection rejection:", refreshErr);
          // Refresh token is expired or invalid, so log the user out
          dispatch(logout());
        }
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      window.__socket = null;
    };
  }, [token, user, dispatch]);

  return (
    <div>
      <BrowserRouter>
        <NotificationToaster />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-white text-gray-500">
            Loading...
          </div>
        }>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/" element={<ProtectedRoutes />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />

              <Route path="/search" element={<SearchPage />} />
              <Route path="/reels" element={<Reels />} />
              <Route path="/post/:postId" element={<SinglePost />} />
              <Route path="/" element={<Feed />} />
              <Route path="/messages" element={<MessagePage />} />
              <Route path="/create-post" element={<CreatePost />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/top-placed" element={<TopStudents />} />
            </Route>

          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  )
}
