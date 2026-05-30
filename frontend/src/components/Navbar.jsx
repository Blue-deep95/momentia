import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../slices/authSlice";
import {
  Home,
  Search,
  Plus,
  Send,
  UserCircle,
  LogOut,
  Bell,
} from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const unreadCount = useSelector((state) => state.notification?.unreadCount || 0);

  const navItems = [
    { path: "/", icon: <Home size={26} /> },
    { path: "/search", icon: <Search size={26} /> },
    { path: "/create-post", icon: <Plus size={26} /> },
    { path: "/messages", icon: <Send size={26} /> },
    {
      path: "/notifications",
      icon: (
        <div className="relative">
          <Bell size={26} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      ),
    },
    { path: "/profile", icon: <UserCircle size={26} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-white shadow-md md:hidden">
      {/* Mobile-style bar but stretched */}
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-6">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;

          return (
            <Link key={index} to={item.path}>
              <div
                className={`transition ${
                  isActive ? "text-black" : "text-gray-400"
                }`}
              >
                {item.icon}
              </div>
            </Link>
          );
        })}

        {/* LOGOUT BUTTON */}
        <button
          onClick={handleLogout}
          className="text-gray-400 transition hover:text-red-500"
        >
          <LogOut size={26} />
        </button>
      </div>
    </div>
  );
}