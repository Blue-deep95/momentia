import React from "react";
import { SquarePlus, Bell } from "lucide-react";
import { Link } from "react-router-dom"
import { useSelector } from "react-redux";

export default function Topbar() {
  const unreadCount = useSelector((state) => state.notification?.unreadCount || 0);

  return (
    <div className="fixed top-0 left-0 w-full bg-white z-50 md:hidden">
      <div className="flex justify-between items-center px-4 h-14">
        {/* Left: Plus Symbol */}
        <div className="cursor-pointer hover:opacity-70 transition">
          <Link to="/create-post">
          <SquarePlus size={26} />
          </Link>
        </div>

        {/* Center: Instagram Text */}
        <h1 className="text-2xl font-bold font-serif italic tracking-tight">
          <Link to="/">
          CG Media
          </Link>
        </h1>

        {/* Right: Notifications */}
            <Link to="/notifications" aria-label="Open notifications" className="cursor-pointer hover:opacity-70 transition">
              <div className="relative">
                <Bell size={26} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4.5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
            </Link>
      </div>
    </div>
  );
}

