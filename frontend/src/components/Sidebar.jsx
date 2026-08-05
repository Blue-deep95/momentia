import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../slices/authSlice";
import api from "../services/api";

import {
  Home,
  Search,
  PlusSquare,
  Film,
  Send,
  Heart,
  Settings,
  User,
  LogOut,
} from "lucide-react";

export default function Sidebar({ profile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hideMobileNav = location.pathname.startsWith("/messages");
  const { user } = useSelector((state) => state.auth);
  const [sidebarProfile, setSidebarProfile] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchSidebarProfile = async () => {
      if (!profile && user?.id) {
        try {
          const res = await api.get(`/profile/get-profile/${user.id}`);
          setSidebarProfile(res.data.profile || null);
        } catch (err) {
          console.error("Failed to load sidebar profile:", err);
        }
      }
    };

    fetchSidebarProfile();
  }, [profile, user]);

  const effectiveProfile = profile || sidebarProfile || user || {};
  const displayName = effectiveProfile?.name || "User";
  const displayUsername =
    effectiveProfile?.username ||
    (effectiveProfile?.email ? effectiveProfile.email.split("@")[0] : "username");
  const displayImage =
    effectiveProfile?.profilePicture?.profileView ||
    effectiveProfile?.profilePicture?.commentView ||
    effectiveProfile?.profilePicture?.url ||
    (typeof effectiveProfile?.profilePicture === "string" && effectiveProfile.profilePicture ? effectiveProfile.profilePicture : "/default-avatar.svg");

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const postsCount = effectiveProfile?.totalPosts || 0;
  const followersCount = effectiveProfile?.followers || 0;
  const followingCount = effectiveProfile?.following || 0;

  const navItems = [
    {
      path: "/",
      label: "Home",
      icon: <Home size={24} />,
    },
    {
      path: "/search",
      label: "Explore",
      icon: <Search size={24} />,
    },
    {
      path: "/reels",
      label: "Reels",
      icon: <Film size={24} />,
    },
    {
      path: "/messages",
      label: "Messages",
      icon: <Send size={24} />,
    },
    {
      path: "/notifications",
      label: "Notifications",
      icon: <Heart size={24} />,
    },
    {
      path: "/profile",
      label: "Profile",
      icon: <User size={24} />,
    },
  ];

  const mobileNavItems = [
    navItems[0], // Home
    navItems[1], // Search
    navItems[2], // Reels
    navItems[3], // Messages
    navItems[5], // Profile
  ];

  return (
    <>
      {/* ================= MOBILE NAVBAR ================= */}
      {!hideMobileNav && (
        <div className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-gray-200 bg-white px-2 py-2.5 shadow-md md:hidden">
          {mobileNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center ${
                location.pathname === item.path
                  ? "text-indigo-600 font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {item.path === "/profile" && displayImage ? (
                <img
                  src={displayImage}
                  alt="Profile"
                  className={`h-6 w-6 rounded-full object-cover border ${
                    location.pathname === "/profile" ? "border-indigo-600 ring-2 ring-indigo-200" : "border-gray-300"
                  }`}
                />
              ) : (
                item.icon
              )}

              <span className="mt-1 text-[10px]">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* ================= DESKTOP / TABLET SIDEBAR ================= */}
      <div
        className={`z-50 fixed left-0 top-0 hidden md:flex h-screen flex-col overflow-hidden border-r border-gray-200 bg-white transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-65' : 'w-18'
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >

        {/* COLLAPSED PROFILE IMAGE - Only show when collapsed */}
        {!isExpanded && (
          <div className="mx-auto mb-4 mt-8">
            <Link to="/profile" className="cursor-pointer">
              <img
                src={displayImage}
                alt="profile"
                className="h-12 w-12 rounded-full border-2 border-indigo-500 object-cover transition-transform hover:scale-105"
              />
            </Link>
          </div>
        )}

        {/* EXPANDED CONTENT - Only show when hovering */}
        {isExpanded && (
          <>
            {/* LOGO */}
            <div className="px-8 pb-6 pt-8">
              <h1 className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
                Momentia
              </h1>
            </div>

            {/* PROFILE CARD */}
            <div className="mx-6 rounded-2xl border border-gray-100 bg-gray-50 p-5 shadow-sm">

              <div className="flex flex-col items-center">

                {/* PROFILE IMAGE */}
                <Link to="/profile" className="cursor-pointer">
                  <img
                    src={displayImage}
                    alt="profile"
                    className="h-20 w-20 rounded-full border-4 border-indigo-500 object-cover transition-transform hover:scale-105"
                  />
                </Link>

                {/* USERNAME */}
                <Link to="/profile" className="cursor-pointer">
                  <h2 className="mt-4 text-lg font-semibold text-gray-800 transition-colors hover:text-indigo-600">
                    {displayName}
                  </h2>
                </Link>

                <p className="text-sm text-gray-500">
                  @{displayUsername}
                </p>

                {/* STATS */}
                <div className="mt-5 flex w-full justify-between text-center">

                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {postsCount}
                    </h3>

                    <p className="text-xs text-gray-500">
                      Posts
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {followersCount}
                    </h3>

                    <p className="text-xs text-gray-500">
                      Followers
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {followingCount}
                    </h3>

                    <p className="text-xs text-gray-500">
                      Following
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CREATE POST BUTTON */}
            <div className="px-6 py-6 mt-1">
              <Link
                to="/create-post"
                className="bg-linear-to-r flex items-center justify-center gap-2 rounded-full from-blue-600 via-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
              >
                <PlusSquare size={18} />
                Create a post
              </Link>
            </div>
          </>
        )}

        {/* NAVIGATION - Icons always visible, text only when expanded */}
        <div className="mt-8 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4">

          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              title={!isExpanded ? item.label : ""}
              className={`flex items-center ${isExpanded ? 'gap-4 px-5' : 'justify-center px-0'} rounded-xl py-4 text-[15px] font-medium transition-all duration-200 ${
                location.pathname === item.path
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
              }`}
            >
              {item.icon}

              <span className={`transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>

        {/* LOGOUT - Only show when expanded at the bottom */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-600 transition hover:bg-gray-100 hover:text-red-500"
            >
              <LogOut size={22} />
              <span className="font-medium">
                Logout
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  )
}

