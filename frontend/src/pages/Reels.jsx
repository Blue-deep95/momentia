import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Virtuoso } from "react-virtuoso";

// Components
import PostCard from "../components/Postcard.jsx";

const Reels = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchReels = async (cursor = null) => {
    const isInitial = !cursor;
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const url = cursor ? `/feed/get-reels?cursor=${encodeURIComponent(cursor)}` : "/feed/get-reels";
      const res = await api.get(url);
      const newReels = res.data.reels || [];

      setPosts((prev) => (isInitial ? newReels : [...prev, ...newReels]));
      setNextCursor(res.data.nextCursor);
      setHasMore(res.data.hasNextPage);
    } catch (err) {
      console.error("Error fetching reels posts", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const loadMore = () => {
    if (hasMore && !loading && !loadingMore && nextCursor) {
      fetchReels(nextCursor);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 lg:pl-20">
      <div className="mx-auto flex max-w-275 justify-between gap-6 px-4 py-6">
        <div className="w-full space-y-6 md:mx-auto md:max-w-153.5 lg:mx-0 lg:max-w-153.5">
          <div className="mb-6">
            <h2 className="text-3xl font-semibold text-gray-800">Reels</h2>
            <p className="mt-1 text-gray-500">Watch the latest video highlights from Momentia.</p>
          </div>

          <div className="mt-10">
            {loading ? (
              <p className="text-center text-gray-500">Loading reels...</p>
            ) : posts.length === 0 ? (
              <p className="text-center text-gray-500">No reels available yet.</p>
            ) : (
              <Virtuoso
                useWindowScroll
                data={posts}
                endReached={loadMore}
                itemContent={(index, post) => (
                  <div className="w-full">
                    <PostCard key={post._id} post={post} />
                  </div>
                )}
                components={{
                  Footer: () =>
                    loadingMore ? (
                      <p className="text-center text-gray-500 py-4">Loading more reels...</p>
                    ) : null,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reels;
