// SearchPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { Virtuoso, VirtuosoGrid } from "react-virtuoso";
import { useNavigate } from "react-router-dom";
import {
  Search,
  User,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

const TABS = ["Users", "Posts"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Users");

  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const navigate = useNavigate();

  // Debounce effect: update debouncedQuery after 1 sec of no typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Fetch Search Results
  const fetchResults = useCallback(
    async (currentPage = 1, reset = false) => {
      if (!debouncedQuery.trim()) return;
      try {
        setLoading(true);

        const endpoint = activeTab === "Users" ? "search/search-users" : "search/search-posts";
        const res = await api.get(`${endpoint}/${encodeURIComponent(debouncedQuery)}/${currentPage}`);

        const newResults = res.data.results || [];

        if (reset) {
          setResults(newResults);
        } else {
          setResults((prev) => [...prev, ...newResults]);
        }

        // Infer hasMore from length (assuming limit is 30)
        setHasMore(newResults.length === 30);
      } catch (error) {
        console.error("Search fetch error:", error);
      } finally {
        setLoading(false);
      }
    },
    [debouncedQuery, activeTab]
  );

  // Search whenever debounced query or tab changes
  useEffect(() => {
    setPage(1);

    if (debouncedQuery.trim() !== "") {
      fetchResults(1, true);
    } else {
      setResults([]);
      setHasMore(false);
    }
  }, [debouncedQuery, activeTab, fetchResults]);

  // Infinite Scroll
  const loadMore = async () => {
    if (!hasMore || loading) return;

    const nextPage = page + 1;
    setPage(nextPage);

    await fetchResults(nextPage);
  };

  return (
    <div className="w-full h-screen bg-black text-white flex flex-col lg:pl-[72px] z-1 ">
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-black border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-3">
          {/* Search Input */}
          <div className="flex items-center bg-zinc-900 rounded-xl px-3 py-2">
            <Search size={18} className="text-zinc-400" />

            <input
              type="text"
              placeholder={`Search ${activeTab}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent outline-none flex-1 px-3 text-sm"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-5 mt-4 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm whitespace-nowrap pb-2 transition-all ${
                  activeTab === tab
                    ? "text-white border-b border-white"
                    : "text-zinc-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full">
          {results.length === 0 && debouncedQuery && !loading ? (
            <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
              No {activeTab} Found for "{debouncedQuery}"
            </div>
          ) : activeTab === "Users" ? (
            <Virtuoso
              style={{ height: "100%" }}
              data={results}
              endReached={loadMore}
              itemContent={(index, item) => (
                <UserCard item={item} navigate={navigate} />
              )}
              components={{
                Footer: () =>
                  loading ? (
                    <div className="flex justify-center py-5">
                      <Loader2 className="animate-spin text-zinc-500" />
                    </div>
                  ) : null,
              }}
            />
          ) : (
            <VirtuosoGrid
              style={{ height: "100%" }}
              data={results}
              endReached={loadMore}
              listClassName="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 p-1"
              itemContent={(index, item) => (
                <PostGridItem item={item} navigate={navigate} />
              )}
              components={{
                Footer: () =>
                  loading ? (
                    <div className="flex justify-center py-5 w-full col-span-3 md:col-span-4 lg:col-span-5">
                      <Loader2 className="animate-spin text-zinc-500" />
                    </div>
                  ) : null,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------ */
/* User Card */
/* ------------------------------------------------ */

function UserCard({ item, navigate }) {
  const profilePic = item.profilePicture?.profileView || item.profilePicture?.original?.url || "https://via.placeholder.com/150";

  return (
    <div 
      onClick={() => navigate(`/profile/${item._id}`)}
      className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900 transition cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <img
          src={profilePic}
          alt={item.username}
          className="w-12 h-12 rounded-full object-cover border border-zinc-800"
        />

        <div>
          <h3 className="font-semibold text-sm">
            {item.username}
          </h3>
          <p className="text-zinc-400 text-xs">
            {item.name}
          </p>
        </div>
      </div>
      <User size={18} className="text-zinc-600" />
    </div>
  );
}

/* ------------------------------------------------ */
/* Post Grid Item */
/* ------------------------------------------------ */

function PostGridItem({ item, navigate }) {
  return (
    <div 
      onClick={() => navigate(`/profile/${item.author}`)}
      className="aspect-square relative group cursor-pointer overflow-hidden rounded-sm"
    >
      <img
        src={item.thumbImage}
        alt="post"
        className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
      />
      
      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
        <div className="flex items-center gap-1 text-white font-bold text-sm">
          <ImageIcon size={16} />
          <span>{item.totalLikes || 0}</span>
        </div>
      </div>
    </div>
  );
}
