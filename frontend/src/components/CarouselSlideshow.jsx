import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import api from "../services/api";

const CarouselSlideshow = () => {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    const fetchCarouselItems = async () => {
      try {
        const res = await api.get("/feed/get-carousel");
        setItems(res.data.carouselItems || []);
      } catch (err) {
        console.error("Failed to load carousel:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCarouselItems();
  }, []);

  // Auto-play carousel
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

  if (loading) {
    return (
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];

  return (
    <div className="relative w-full rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden group">
      {/* Carousel Content */}
      <div className="relative bg-black">
        {/* Image/Video Display */}
        {currentItem.mediaType === "image" && currentItem.images?.length > 0 ? (
          <img
            src={currentItem.images[0].url}
            alt="carousel"
            className="h-96 w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : currentItem.mediaType === "video" && currentItem.video?.url ? (
          <video
            src={currentItem.video.url}
            preload="none"
            poster={currentItem.thumbImage || currentItem.images?.[0]?.url || ""}
            className="h-96 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-96 w-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No media</span>
          </div>
        )}

        {/* Left Arrow */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/80 opacity-0 group-hover:opacity-100"
          aria-label="Previous"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Right Arrow */}
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/80 opacity-0 group-hover:opacity-100"
          aria-label="Next"
        >
          <ChevronRight size={24} />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setAutoPlay(false);
              }}
              className={`h-2 rounded-full transition ${
                index === currentIndex
                  ? "w-6 bg-white"
                  : "w-2 bg-white/60 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Post Info */}
      <div className="p-4">
        {/* Author Info */}
        <div className="mb-3 flex items-center gap-3">
          <img
            src={
              currentItem.authorDetails?.profilePicture?.profileView ||
              "https://i.pravatar.cc/150?img=12"
            }
            alt={currentItem.authorDetails?.username}
            className="h-10 w-10 rounded-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {currentItem.authorDetails?.username || "User"}
            </h3>
            <p className="text-xs text-gray-500">Momentia</p>
          </div>
        </div>

        {/* Caption */}
        {currentItem.caption && (
          <p className="mb-2 text-sm text-gray-700 line-clamp-2">
            {currentItem.caption}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-4 text-xs text-gray-600">
          <span>❤️ {currentItem.totalLikes || 0} likes</span>
          <span>💬 {currentItem.totalComments || 0} comments</span>
        </div>
      </div>
    </div>
  );
};

export default CarouselSlideshow;
