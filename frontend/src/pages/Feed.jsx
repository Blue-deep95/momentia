import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Virtuoso } from "react-virtuoso";

// Components
import Navbar from "../components/Navbar.jsx";
import PostCard from "../components/Postcard.jsx";
import StoryBar from "../components/Storybar.jsx";
import SuggestedProfiles from "../components/SuggestedProfiles.jsx";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch posts
  const fetchPosts = async (cursor = null) => {
    const isInitial = !cursor;
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const url = cursor ? `/feed/get-posts?cursor=${encodeURIComponent(cursor)}` : "/feed/get-posts";
      const res = await api.get(url);
      const newPosts = res.data.posts || [];
      
      setPosts((prev) => (isInitial ? newPosts : [...prev, ...newPosts]));
      setNextCursor(res.data.nextCursor);
      setHasMore(res.data.hasNextPage);
    } catch (err) {
      console.error("Error fetching posts", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const loadMore = () => {
    if (hasMore && !loading && !loadingMore && nextCursor) {
      fetchPosts(nextCursor);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 lg:pl-20">

      {/* 🔝 NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT */}
      <div className="max-w-275 mx-auto flex justify-between gap-6 px-4 py-6">

        {/* LEFT / CENTER FEED */}
        <div className="lg:max-w-153.5 md:max-w-153.5 w-full space-y-6 md:mx-auto lg:mx-0">

          {/* STORIES */}
          <StoryBar />

          {/* POSTS */}
          <div className="mt-10">
            {loading ? (
              <p className="text-center text-gray-500">Loading...</p>
            ) : posts.length === 0 ? (
              <p className="text-center text-gray-500">No posts yet</p>
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
                      <p className="text-center text-gray-500 py-4">Loading more posts...</p>
                    ) : null,
                }}
              />
            )}
          </div>

        </div>

        {/* RIGHT SIDEBAR (Desktop only) */}
        <div className="hidden w-80 shrink-0 lg:block lg:self-start">
          <div className="sticky top-24">
            <SuggestedProfiles />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Feed;