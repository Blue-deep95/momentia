import React, { useEffect, useState } from "react";
import api from "../services/api";

// Components
import PostCard from "../components/Postcard.jsx";

const Reels = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get("/feed/get-posts/1");
        const allPosts = res.data.posts || [];
        const videoPosts = allPosts.filter(
          (post) => post.mediaType === "video" || (post.video && post.video.url)
        );
        setPosts(videoPosts);
      } catch (err) {
        console.error("Error fetching reels posts", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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
              posts.map((post) => <PostCard key={post._id} post={post} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reels;
