import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import cdgLogo from "../assets/cdg logo.png";

const topStudents = [
  {
    id: 1,
    name: "Siddharth Jain",
    company: "Goldman Sachs",
    package: "32 LPA",
    image: "https://i.pravatar.cc/300?img=12",
  },
  {
    id: 2,
    name: "Priya Patel",
    company: "Microsoft",
    package: "42 LPA",
    image: "https://i.pravatar.cc/300?img=18",
  },
  {
    id: 3,
    name: "Amit Sharma",
    company: "Amazon",
    package: "40 LPA",
    image: "https://i.pravatar.cc/300?img=32",
  },
  {
    id: 4,
    name: "Neha Singh",
    company: "Adobe",
    package: "38 LPA",
    image: "https://i.pravatar.cc/300?img=15",
  },
];

const CarouselSlideshow = () => {
  const [items] = useState(topStudents);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay || items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, items.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setAutoPlay(false);
  };

  const currentItem = items[currentIndex];
  const studentHandle = `JFS-${currentItem.name
    .split(" ")
    .map((part) => part[0])
    .join("")}-${(currentIndex + 1).toString().padStart(3, "0")}`;

  return (
    <div className="rounded-4xl relative mx-auto w-full max-w-md overflow-hidden border border-slate-200 bg-white shadow-xl">
      <div className="flex flex-col gap-6 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <img
                src={cdgLogo}
                alt="Codegnan logo"
                className="h-8 w-auto object-contain"
                loading="lazy"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Placed Students</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goToNext}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
            <div className="rounded-full bg-violet-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
              {currentItem.package}
            </div>
          </div>
        </div>

        <div className="grid gap-5 rounded-[1.75rem] border border-slate-100 bg-slate-50 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold text-slate-900">{currentItem.name}</p>
              <p className="mt-1 text-sm text-slate-500">{studentHandle}</p>
            </div>
            <div className="inline-flex items-center rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              {currentItem.company}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-slate-100 shadow-lg">
              <img
                src={currentItem.image}
                alt={currentItem.name}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="absolute -bottom-2 right-0 rounded-full bg-blue-700 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white shadow-sm">
              Placed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarouselSlideshow;
