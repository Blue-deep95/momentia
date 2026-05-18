import React, { useState, useRef } from "react";
import { X } from "lucide-react";
import api from "../services/api.js";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";

// Toast Component
const Toast = ({ message, type = "error", onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-[60] p-4 rounded-2xl shadow-xl text-white transition-all duration-300 border-2 ${
      type === "error" ? "bg-red-500 border-red-400" : "bg-green-500 border-green-400"
    }`}>
      <div className="flex items-center gap-2">
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 text-white transition hover:text-gray-200">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

const CreatePost = () => {
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [fileType, setFileType] = useState(""); // "image" or "video"

  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const navigate = useNavigate();


  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setImageFile(file);
      setVideoFile(null); // Mutually exclusive as per API
      setFileType("image");
      setPreview(URL.createObjectURL(file));
      
      // Clear video input field
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    }
  };

  // Handle video selection
  const handleVideoChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setVideoFile(file);
      setImageFile(null); // Mutually exclusive as per API
      setFileType("video");
      setPreview(URL.createObjectURL(file));
      
      // Clear image input field
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  // Submit post
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile && !videoFile) {
      setToast({ message: "Please select an image or a video", type: "error" });
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("caption", caption);
      
      if (videoFile) {
        formData.append("video", videoFile);
      } else {
        formData.append("images", imageFile);
      }

      const res = await api.post("/post/upload-post", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setToast({ message: res.data.message, type: "success" });
      alert(res.data.message);
      navigate("/")


      // Reset
      setCaption("");
      setImageFile(null);
      setVideoFile(null);
      setFileType("");
      setPreview("");
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";

    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.message || "Failed to create post", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* TOAST */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Navbar />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-3xl bg-white p-8 shadow-xl">

            {/* HEADER */}
            <div className="mb-6">
              <h2 className="text-3xl font-semibold text-gray-800">
                Create Post
              </h2>

              <p className="mt-1 text-gray-500">
                Share your favorite moments with the world
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* PREVIEW */}
              {preview && (
                <div className="flex h-[400px] w-full items-center justify-center overflow-hidden rounded-2xl border bg-black">
                  {fileType === "video" ? (
                    <video
                      src={preview}
                      controls
                      className="max-h-full max-w-full"
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              )}

              {/* DUAL FILE INPUTS */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* IMAGE INPUT */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Upload Image
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    ref={imageInputRef}
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm"
                  />
                </div>

                {/* VIDEO INPUT */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Upload Video
                  </label>

                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    ref={videoInputRef}
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm"
                  />
                </div>
              </div>

              {/* CAPTION */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Caption
                </label>

                <textarea
                  rows="4"
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full resize-none rounded-xl border border-gray-300 p-4 outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 py-4 text-lg font-semibold text-white transition hover:opacity-90"
              >
                {loading ? "Posting..." : "Share Post"}
              </button>

            </form>
          </div>
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
};


export default CreatePost