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
  User,
  LogOut,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export default function Sidebar({ profile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const hideMobileNav = location.pathname.startsWith("/messages");
  const { user } = useSelector((state) => state.auth);
  const [sidebarProfile, setSidebarProfile] = useState(null);

  // Read initial collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const nextState = !prev;
      localStorage.setItem("sidebar_collapsed", String(nextState));
      return nextState;
    });
  };

  useEffect(() => {
    const fetchSidebarProfile = async () => {
      if (!profile && user?.id) {
        try {
          const res = await api.get(`/profile/get-profile/${user.id}`);
          setSidebarProfile(res.data?.profile || null);
        } catch (err) {
          console.error("Failed to load sidebar profile:", err);
        }
      }
    };

    fetchSidebarProfile();
  }, [profile, user]);

  const effectiveProfile = profile || sidebarProfile || user || {};
  const displayName = effectiveProfile?.name || effectiveProfile?.username || "User";
  const displayUsername =
    effectiveProfile?.username ||
    (effectiveProfile?.email ? effectiveProfile.email.split("@")[0] : "username");

  const displayImage =
    effectiveProfile?.profilePicture?.profileView ||
    effectiveProfile?.profilePicture?.commentView ||
    effectiveProfile?.profilePicture?.url ||
    (typeof effectiveProfile?.profilePicture === "string" && effectiveProfile.profilePicture
      ? effectiveProfile.profilePicture
      : "/default-avatar.svg");

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navItems = [
    {
      path: "/",
      label: "Home",
      icon: <Home size={20} />,
    },
    {
      path: "/search",
      label: "Search",
      icon: <Search size={20} />,
    },
    {
      path: "/reels",
      label: "Reels",
      icon: <Film size={20} />,
    },
    {
      path: "/messages",
      label: "Messages",
      icon: <Send size={20} />,
    },
    {
      path: "/notifications",
      label: "Notifications",
      icon: <Heart size={20} />,
    },
    {
      path: "/create-post",
      label: "Create",
      icon: <PlusSquare size={20} />,
    },
    {
      path: "/profile",
      label: "Profile",
      icon: <User size={20} />,
    },
  ];

  const mobileNavItems = [
    navItems[0], // Home
    navItems[1], // Search
    navItems[2], // Reels
    navItems[3], // Messages
    navItems[6], // Profile
  ];

  return (
    <>
      {/* ================= MOBILE BOTTOM BAR ================= */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-gray-200 bg-white/95 backdrop-blur-md px-2 py-2 shadow-sm md:hidden">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all ${
                  isActive
                    ? "text-indigo-600 font-bold scale-105"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {item.path === "/profile" ? (
                  <img
                    src={displayImage}
                    alt="Profile"
                    onError={(e) => {
                      e.target.src = "/default-avatar.svg";
                    }}
                    className={`h-6 w-6 rounded-full object-cover border ${
                      isActive ? "border-indigo-600 ring-2 ring-indigo-200" : "border-gray-300"
                    }`}
                  />
                ) : (
                  item.icon
                )}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

      {/* ================= DESKTOP SHADCN-STYLE COLLAPSIBLE SIDEBAR ================= */}
      <aside
        className={`fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col justify-between border-r border-gray-200/80 bg-white/95 backdrop-blur-xs font-sans transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-18" : "w-64"
        }`}
      >
        {/* TOP BRAND HEADER + TOGGLE BUTTON */}
        <div>
          <div
            className={`flex h-16 items-center border-b border-gray-100 px-4 ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs flex-shrink-0"
                title="Momentia Home"
              >
                <Sparkles size={20} />
              </Link>

              {!isCollapsed && (
                <Link
                  to="/"
                  className="text-lg font-black tracking-tight text-gray-900 hover:opacity-80 transition truncate"
                >
                  Momentia
                </Link>
              )}
            </div>

            {/* COLLAPSE / EXPAND TOGGLE BUTTON */}
            <button
              onClick={toggleSidebar}
              className={`rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition ${
                isCollapsed ? "mt-2" : ""
              }`}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label="Toggle sidebar"
            >
              {isCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            </button>
          </div>

          {/* MAIN NAVIGATION LIST */}
          <div className="p-3 space-y-1">
            {!isCollapsed && (
              <p className="px-3 pb-2 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                Menu
              </p>
            )}

            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : ""}
                  className={`flex items-center rounded-xl transition-all duration-150 ${
                    isCollapsed
                      ? "justify-center h-11 w-11 mx-auto"
                      : "gap-3.5 px-3.5 py-2.5 text-sm"
                  } ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600 shadow-2xs font-bold"
                      : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 font-semibold"
                  }`}
                >
                  <span className={isActive ? "text-indigo-600" : "text-gray-500"}>
                    {item.icon}
                  </span>

                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* BOTTOM USER FOOTER */}
        <div className="border-t border-gray-100 p-3 bg-gray-50/50">
          <div
            className={`flex items-center gap-3 rounded-2xl transition hover:bg-gray-100/60 ${
              isCollapsed ? "justify-center p-1" : "justify-between p-2"
            }`}
          >
            <Link
              to="/profile"
              className="flex items-center gap-3 min-w-0 flex-1"
              title={isCollapsed ? displayName : ""}
            >
              <img
                src={displayImage}
                alt={displayName}
                onError={(e) => {
                  e.target.src = "/default-avatar.svg";
                }}
                className="h-9 w-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
              />

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    @{displayUsername}
                  </p>
                </div>
              )}
            </Link>

            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="rounded-xl p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
