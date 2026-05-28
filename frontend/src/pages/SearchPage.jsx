// SearchPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { Virtuoso, VirtuosoGrid } from "react-virtuoso";
import { useNavigate } from "react-router-dom";
import FollowButton from "../components/FollowButton";
import {
  Search,
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 1000);
    return () => clearTimeout(handler);
  }, [query]);

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
        setHasMore(newResults.length === 30);
      } catch (error) {
        console.error("Search fetch error:", error);
      } finally {
        setLoading(false);
      }
    },
    [debouncedQuery, activeTab]
  );

  useEffect(() => {
    setPage(1);
    if (debouncedQuery.trim() !== "") {
      fetchResults(1, true);
    } else {
      setResults([]);
      setHasMore(false);
    }
  }, [debouncedQuery, activeTab, fetchResults]);

  const loadMore = async () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchResults(nextPage);
  };

  return (
    <div className="w-full h-screen bg-white text-gray-900 flex flex-col lg:pl-[72px] z-1 ">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center bg-gray-100 rounded-xl px-3 py-2">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent outline-none flex-1 px-3 text-sm text-gray-800"
            />
          </div>
          <div className="flex gap-5 mt-4 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm whitespace-nowrap pb-2 transition-all ${
                  activeTab === tab
                    ? "text-black border-b-2 border-black font-bold"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-white">
        <div className="max-w-5xl mx-auto h-full">
          {results.length === 0 && debouncedQuery && !loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
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
                      <Loader2 className="animate-spin text-gray-400" />
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
                      <Loader2 className="animate-spin text-gray-400" />
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

function UserCard({ item, navigate }) {
  const profilePic = item.profilePicture?.profileView || item.profilePicture?.original?.url || "https://via.placeholder.com/150";
  return (
    <div 
      onClick={() => navigate(`/profile/${item._id}`)}
      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition cursor-pointer border-b border-gray-50 last:border-0"
    >
      <div className="flex items-center gap-3">
        <img
          src={profilePic}
          alt={item.username}
          className="w-12 h-12 rounded-full object-cover border border-gray-100"
          loading="lazy"
          decoding="async"
        />
        <div>
          <h3 className="font-semibold text-sm text-gray-900">{item.username}</h3>
          <p className="text-gray-500 text-xs">{item.name}</p>
        </div>
      </div>
      <FollowButton userId={item._id} initialFollowing={item.isFollowing ?? null} />
    </div>
  );
}

function PostGridItem({ item, navigate }) {
  return (
    <div 
      onClick={() => navigate(`/profile/${item.author}`)}
      className="aspect-square relative group cursor-pointer overflow-hidden rounded-md bg-gray-100"
    >
      <img
        src={item.thumbImage}
        alt="post"
        className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
        <div className="flex items-center gap-1 text-white font-bold text-sm">
          <ImageIcon size={16} />
          <span>{item.totalLikes || 0}</span>
        </div>
      </div>
    </div>
  );
}
