import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Virtuoso } from "react-virtuoso";

// Components
import PostCard from "../components/Postcard.jsx";
import SuggestedProfiles from "../components/SuggestedProfiles.jsx";

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
    <div className="min-h-screen bg-gray-100 pb-16 md:pb-0 lg:pl-20">
      {/* MAIN CONTENT */}
      <div className="flex w-full justify-between gap-6 px-4 py-6">

        {/* LEFT / CENTER FEED */}
        <div className="w-full space-y-6 md:mx-auto lg:mx-0 lg:basis-[60%]">

          {/* POSTS */}
          <div className="mt-4">
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
        <div className="hidden lg:flex lg:basis-[35%] lg:justify-end lg:self-start">
          <div className="fixed right-8 top-20 z-10 hidden w-80 flex-col lg:flex">
            <SuggestedProfiles />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Feed;