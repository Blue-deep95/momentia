import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "./Navbar";
import SideBar from "./Sidebar"
import TopBar from "./Topbar"

export default function ProtectedRoutes() {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith("/messages");

  // Get user from Redux store
  const { user } = useSelector((state) => state.auth);

  // If user not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }


  return (
    <>
      <TopBar/>
      <SideBar/>
      {!hideNavbar && <Navbar />}
      <Outlet/>
    </>
  );
}

// Unauthorized Page
export const Unauthorized = () => {
  return (
    <h2 className="text-danger mt-5 text-center">
      You are not authorized to access this page
    </h2>
  );
};