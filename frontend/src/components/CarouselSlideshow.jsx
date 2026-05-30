import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import cdgLogo from "../assets/cdg logo.png";
import api from "../services/api.js";

// We'll load carousel items from the backend (Codegnan domain users)
const CarouselSlideshow = () => {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!autoPlay || items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, items.length]);

  useEffect(() => {
    let mounted = true
    const fetchCarousel = async () => {
      try {
        const res = await api.get('/feed/get-carousel')
        const carouselItems = res.data.carouselItems || []
        const mapped = carouselItems.map((it) => ({
          id: it._id,
          name: it.authorDetails?.name || it.authorDetails?.username || 'Codegnan',
          caption: it.caption || '',
          company: it.caption || '',
          package: '',
          mediaType: it.mediaType,
          // primary media URL: prefer cloud image/video, fallback to gridfs or thumb
          mediaUrl: it.mediaType === 'image'
            ? (it.images?.[0]?.url || it.gridFsMedia?.[0]?.url || it.thumbImage || '')
            : (it.video?.url || it.gridFsMedia?.[0]?.url || it.thumbImage || ''),
          // small avatar/thumbnail to show in corner if needed
          thumb: it.thumbImage || (it.images?.[0]?.url) || ''
        }))
        if (mounted) setItems(mapped)
      } catch (err) {
        console.error('Failed to load carousel items', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchCarousel()
    return () => { mounted = false }
  }, [])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  if (loading) return null
  if (!items || items.length === 0) return null

  const currentItem = items[currentIndex];
  const studentHandle = `JFS-${(currentItem.name || '')
    .split(" ")
    .map((part) => part[0])
    .join("")}-${(currentIndex + 1).toString().padStart(3, "0")}`;

  return (
    <div className="rounded-4xl relative flex h-full w-full flex-col overflow-hidden border border-slate-200 bg-white shadow-xl">
      {/* Header Section */}
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
          </div>
        </div>
      </div>

      {/* Media Section - Expands to fill remaining space */}
      <div className="flex w-full flex-1 items-center justify-center overflow-hidden">
        {currentItem.mediaType === 'video' ? (
          <video
            src={currentItem.mediaUrl}
            controls
            className="h-full w-full object-contain"
            poster={currentItem.thumb}
          />
        ) : (
          <img
            src={currentItem.mediaUrl}
            alt={currentItem.caption || 'carousel item'}
            className="h-full w-full object-contain"
          />
        )}
      </div>
    </div>
  );
};

export default CarouselSlideshow;
