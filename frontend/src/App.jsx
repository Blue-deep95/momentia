import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import Register from "./pages/Register.jsx"
import Login from "./pages/Login.jsx"
import Feed from "./pages/Feed.jsx"
import ForgotPassword from "./pages/ForgotPassword.jsx"
import Profile from "./pages/Profile.jsx"
import SearchPage from "./pages/SearchPage.jsx"
import Reels from "./pages/Reels.jsx"
import CreatePost from "./pages/CreatePost.jsx"
import SinglePost from "./pages/SinglePost.jsx"
import MessagePage from "./pages/MessagePage.jsx"

import Notifications from "./pages/NotificationsPage.jsx"
import { initSocket, disconnectSocket } from "./socket.js"
import { login, logout } from "./slices/authSlice.js"
import api from "./services/api.js"

import ProtectedRoutes from './components/ProtectedRoutes.jsx'
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
            <Route path="/notifications" element={<Notifications/>} />

          </Route>


        </Routes>
      </BrowserRouter>
    </div>
  )
}