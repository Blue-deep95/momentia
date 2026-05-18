import React, { useState, useEffect } from "react";
import { SquarePlus, Heart } from "lucide-react";
import {Link} from "react-router-dom"

export default function Topbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={`fixed top-0 left-0 w-full bg-white border-b z-50 transition-transform duration-300  ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
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
          Momentia
          </Link>
        </h1>

        {/* Right: Heart Symbol */}
        <div className="cursor-pointer hover:opacity-70 transition">
          <Heart size={26} />
        </div>
      </div>
    </div>
  );
}

