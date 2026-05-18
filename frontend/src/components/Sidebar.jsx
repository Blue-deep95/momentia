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
  LogOut,
} from "lucide-react";

export default function Sidebar({ profile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
    "https://via.placeholder.com/150";

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
      path: "/settings",
      label: "Settings",
      icon: <Settings size={24} />,
    },
  ];

  return (
    <>
      {/* ================= MOBILE NAVBAR ================= */}
      <div className=" fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-gray-200 bg-white px-2 py-3 shadow-md md:hidden">

        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center ${
              location.pathname === item.path
                ? "text-pink-500"
                : "text-gray-500"
            }`}
          >
            {item.icon}

            <span className="mt-1 text-[11px] font-medium">
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* ================= DESKTOP / TABLET SIDEBAR ================= */}
      <div
        className={`z-50 fixed left-0 top-0 hidden h-screen flex-col overflow-hidden border-r border-gray-200 bg-white transition-all duration-300 ease-in-out lg:flex ${
          isExpanded ? 'w-[260px]' : 'w-[72px]'
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
                className="h-12 w-12 rounded-full border-2 border-pink-400 object-cover transition-transform hover:scale-105"
              />
            </Link>
          </div>
        )}

        {/* EXPANDED CONTENT - Only show when hovering */}
        {isExpanded && (
          <>
            {/* LOGO */}
            <div className="px-8 pb-6 pt-8">
              <h1 className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-3xl font-bold text-transparent">
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
                    className="h-20 w-20 rounded-full border-4 border-pink-400 object-cover transition-transform hover:scale-105"
                  />
                </Link>

                {/* USERNAME */}
                <Link to="/profile" className="cursor-pointer">
                  <h2 className="mt-4 text-lg font-semibold text-gray-800 transition-colors hover:text-pink-500">
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
            <div className="px-6 pb-4">
              <Link
                to="/create-post"
                className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
              >
                <PlusSquare size={18} />
                Create a post
              </Link>
            </div>
          </>
        )}

        {/* NAVIGATION - Icons always visible, text only when expanded */}
        <div className="mt-8 flex flex-1 min-h-0 flex-col gap-2 px-4 overflow-y-auto pb-4">

          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              title={!isExpanded ? item.label : ""}
              className={`flex items-center ${isExpanded ? 'gap-4 px-5' : 'justify-center px-0'} rounded-xl py-4 text-[15px] font-medium transition-all duration-200 ${
                location.pathname === item.path
                  ? "bg-pink-50 text-pink-500"
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

