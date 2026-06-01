import React, { useState, useRef } from "react";
import {
  X,
  Image as ImageIcon,
  Video,
  Sparkles,
  Send,
} from "lucide-react";

import api from "../services/api.js";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";

// TOAST COMPONENT
const Toast = ({
  message,
  type = "error",
  onClose,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(
      onClose,
      3000
    );

    return () =>
      clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed right-4 top-4 z-999 rounded-2xl border px-5 py-4 text-white shadow-2xl backdrop-blur-xl ${
        type === "error"
          ? "border-red-400 bg-red-500/90"
          : "border-emerald-400 bg-emerald-500/90"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">
          {message}
        </span>

        <button
          onClick={onClose}
          className="rounded-full p-1 transition hover:bg-white/20"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

const CreatePost = () => {
  const [caption, setCaption] =
    useState("");

  const [imageFile, setImageFile] =
    useState(null);

  const [videoFile, setVideoFile] =
    useState(null);

  const [fileType, setFileType] =
    useState("");

  const [preview, setPreview] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [toast, setToast] =
    useState(null);

  const imageInputRef = useRef(null);

  const videoInputRef = useRef(null);

  const navigate = useNavigate();

  // IMAGE CHANGE
  const handleImageChange = (e) => {
    const file =
      e.target.files[0];

    if (file) {
      setImageFile(file);
      setVideoFile(null);

      setFileType("image");

      setPreview(
        URL.createObjectURL(file)
      );

      if (videoInputRef.current) {
        videoInputRef.current.value =
          "";
      }
    }
  };

  // VIDEO CHANGE
  const handleVideoChange = (e) => {
    const file =
      e.target.files[0];

    if (file) {
      setVideoFile(file);
      setImageFile(null);

      setFileType("video");

      setPreview(
        URL.createObjectURL(file)
      );

      if (imageInputRef.current) {
        imageInputRef.current.value =
          "";
      }
    }
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !imageFile &&
      !videoFile
    ) {
      setToast({
        message:
          "Please select image or video",
        type: "error",
      });

      return;
    }

    try {
      setLoading(true);

      const formData =
        new FormData();

      formData.append(
        "caption",
        caption
      );

      if (videoFile) {
        formData.append(
          "video",
          videoFile
        );
      } else {
        formData.append(
          "images",
          imageFile
        );
      }

      const res = await api.post(
        "/post/upload-post",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setToast({
        message:
          res.data.message,
        type: "success",
      });

      navigate("/");

      // RESET
      setCaption("");
      setImageFile(null);
      setVideoFile(null);
      setFileType("");
      setPreview("");

      if (imageInputRef.current)
        imageInputRef.current.value =
          "";

      if (videoInputRef.current)
        videoInputRef.current.value =
          "";
    } catch (err) {
      console.error(err);

      setToast({
        message:
          err.response?.data
            ?.message ||
          "Failed to create post",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-linear-to-br min-h-screen from-blue-50 via-white to-indigo-50">

      {/* TOAST */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() =>
            setToast(null)
          }
        />
      )}

      <Navbar />

      {/* =============================== */}
      {/* UPDATED SPACING HERE 👇 */}
      {/* pt-20 = navbar top space */}
      {/* pb-28 = bottom mobile space */}
      {/* =============================== */}

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-3 pb-28 pt-20 sm:px-5 sm:pb-20 lg:grid-cols-3 lg:px-6 lg:pb-10 lg:pt-6">

        {/* MAIN */}
        <div className="lg:col-span-2">

          <div className="rounded-4xl overflow-hidden border border-white/40 bg-white/80 p-4 shadow-2xl backdrop-blur-xl sm:p-6 lg:p-8">

            {/* HEADER */}
            <div className="mb-8 flex items-start gap-4">

              <div className="bg-linear-to-br flex h-14 w-14 items-center justify-center rounded-2xl from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg">
                <Sparkles size={26} />
              </div>

              <div>
                <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">
                  Create Post
                </h2>

                <p className="mt-1 text-sm text-gray-600 sm:text-base">
                  Share your favorite moments
                  with the world ✨
                </p>
              </div>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-7"
            >

              {/* PREVIEW */}
              {preview && (
                <div className="overflow-hidden rounded-3xl border border-indigo-200 bg-black shadow-xl">

                  {fileType ===
                  "video" ? (
                    <video
                      src={preview}
                      controls
                      className="max-h-125 w-full object-cover"
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-125 w-full object-cover"
                    />
                  )}
                </div>
              )}

              {/* UPLOAD BOXES */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* IMAGE */}
                <div className="bg-linear-to-br rounded-3xl border border-indigo-100 from-white via-indigo-50 to-blue-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

                  <div className="mb-5 flex items-center gap-4">

                    <div className="bg-linear-to-br flex h-14 w-14 items-center justify-center rounded-2xl from-blue-600 to-indigo-600 text-white shadow-lg">
                      <ImageIcon size={26} />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Upload Image
                      </h3>

                      <p className="text-sm text-gray-600">
                        JPG, PNG up to
                        10MB
                      </p>
                    </div>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleImageChange
                    }
                    ref={imageInputRef}
                    className="file:bg-linear-to-r block w-full cursor-pointer rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm transition file:mr-4 file:rounded-xl file:border-0 file:from-blue-600 file:to-indigo-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:opacity-90 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* VIDEO */}
                <div className="bg-linear-to-br rounded-3xl border border-purple-100 from-white via-purple-50 to-indigo-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

                  <div className="mb-5 flex items-center gap-4">

                    <div className="bg-linear-to-br flex h-14 w-14 items-center justify-center rounded-2xl from-indigo-600 to-purple-600 text-white shadow-lg">
                      <Video size={26} />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Upload Video
                      </h3>

                      <p className="text-sm text-gray-600">
                        MP4, MOV up to
                        50MB
                      </p>
                    </div>
                  </div>

                  <input
                    type="file"
                    accept="video/*"
                    onChange={
                      handleVideoChange
                    }
                    ref={videoInputRef}
                    className="file:bg-linear-to-r block w-full cursor-pointer rounded-2xl border border-purple-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm transition file:mr-4 file:rounded-xl file:border-0 file:from-indigo-600 file:to-purple-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:opacity-90 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* CAPTION */}
              <div>

                <div className="mb-3 flex items-center justify-between">

                  <label className="text-sm font-semibold text-gray-700">
                    Caption
                  </label>

                  <span className="text-xs font-medium text-indigo-500">
                    {caption.length}
                    /2200
                  </span>
                </div>

                <textarea
                  rows="5"
                  placeholder="What's on your mind?"
                  value={caption}
                  onChange={(e) =>
                    setCaption(
                      e.target.value
                    )
                  }
                  className="w-full resize-none rounded-3xl border border-indigo-200 bg-white/90 p-5 text-gray-700 shadow-sm outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="bg-linear-to-r group flex w-full items-center justify-center gap-3 rounded-2xl from-blue-600 via-indigo-600 to-purple-600 py-4 text-lg font-bold text-white shadow-2xl shadow-indigo-300/40 transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send
                  size={20}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />

                {loading
                  ? "Posting..."
                  : "Share Post"}
              </button>
            </form>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;