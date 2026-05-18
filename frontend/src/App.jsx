import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Register from "./pages/Register.jsx"
import Login from "./pages/Login.jsx"
import Feed from "./pages/Feed.jsx"
import ForgotPassword from "./pages/ForgotPassword.jsx"
import Profile from "./pages/Profile.jsx"
import SearchPage from "./pages/SearchPage.jsx"
import Reels from "./pages/Reels.jsx"
import CreatePost from "./pages/CreatePost.jsx"


import ProtectedRoutes from './components/ProtectedRoutes.jsx'

export default function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          
          <Route path="/" element={<ProtectedRoutes />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            
            <Route path="/search" element={<SearchPage />} />
            <Route path="/reels" element={<Reels />} />
            <Route path="/" element={<Feed />} />
            <Route path="/create-post" element={<CreatePost />} />

          </Route>


        </Routes>
      </BrowserRouter>
    </div>
  )
}