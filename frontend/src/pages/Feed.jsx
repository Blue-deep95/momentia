import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Virtuoso } from "react-virtuoso";

// Components
import Navbar from "../components/Navbar.jsx";
import PostCard from "../components/Postcard.jsx";
import StoryBar from "../components/Storybar.jsx";
import SuggestedProfiles from "../components/SuggestedProfiles.jsx";
import CarouselSlideshow from "../components/CarouselSlideshow.jsx";

import { fetchPosts } from "../slices/feedSlice";

const Feed = () => {
  const dispatch = useDispatch();
  const { posts, loading, loadingMore, nextCursor, hasMore } = useSelector((state) => state.feed);

  useEffect(() => {
    dispatch(fetchPosts({ cursor: null }));
  }, [dispatch]);

  const loadMore = () => {
    if (hasMore && !loading && !loadingMore && nextCursor) {
      dispatch(fetchPosts({ cursor: nextCursor }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 lg:pl-20">

      {/* 🔝 NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT */}
      <div className="flex w-full justify-between gap-6 px-4 py-6">

        {/* LEFT / CENTER FEED */}
        <div className="w-full space-y-6 md:mx-auto lg:mx-0 lg:basis-[60%]">

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
                      <p className="py-4 text-center text-gray-500">Loading more posts...</p>
                    ) : null,
                }}
              />
            )}
          </div>

        </div>

        {/* RIGHT SIDEBAR (Desktop only) */}
        <div className="mt-10 hidden lg:flex lg:basis-[40%] lg:justify-end lg:self-start">
          <div className="w-md fixed right-4 top-20 z-10 hidden flex-col space-y-6 lg:flex lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
            {/* CAROUSEL SLIDESHOW */}
            <CarouselSlideshow />

            {/* SUGGESTED PROFILES */}
            <SuggestedProfiles />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Feed;