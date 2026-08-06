import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import SideBar from "./Sidebar";
import TopBar from "./Topbar";

export default function ProtectedRoutes() {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <TopBar />
      <SideBar />
      <div className="pt-14 pb-16 md:pt-0 md:pb-0">
        <Outlet />
      </div>
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