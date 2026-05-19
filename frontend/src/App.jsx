import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useSelector } from "react-redux"
import Register from "./pages/Register.jsx"
import Login from "./pages/Login.jsx"
import Feed from "./pages/Feed.jsx"
import ForgotPassword from "./pages/ForgotPassword.jsx"
import Profile from "./pages/Profile.jsx"
import SearchPage from "./pages/SearchPage.jsx"
import Reels from "./pages/Reels.jsx"
import CreatePost from "./pages/CreatePost.jsx"
import Notifications from "./pages/NotificationsPage.jsx"
import NotificationToaster from "./components/NotificationToaster.jsx"
import { initSocket, disconnectSocket } from "./socket.js"
import SinglePost from "./pages/SinglePost.jsx"


import ProtectedRoutes from './components/ProtectedRoutes.jsx'

export default function App() {
  const token = useSelector((state) => state.auth.token);

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
    socket.on("connect_error", (err) => {
      console.error("Global socket connect error:", err.message || err);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      window.__socket = null;
    };
  }, [token]);

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
            <Route path="/create-post" element={<CreatePost />} />
            
            <Route path="/notifications" element={<Notifications />} />

          </Route>


        </Routes>
      </BrowserRouter>
    </div>
  )
}