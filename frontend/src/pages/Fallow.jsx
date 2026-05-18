import React, { useEffect, useState } from "react";
import { X, User } from "lucide-react";
import api from "../services/api.js";

const Fallow = ({ title, onClose, userId, type = "followers" }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchList = async () => {
      setLoading(true);
      setError(null);

      try {
        const path =
          type === "following"
            ? `/profile/get-following/${userId}`
            : `/profile/get-followers/${userId}`;

        const res = await api.get(path);
        const list =
          res.data.following ||
          res.data.followers ||
          res.data[type] ||
          [];
        setItems(list);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load list.");
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [type, userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <User size={20} />
            {title}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex min-h-[160px] items-center justify-center text-sm text-gray-500">
              Loading {type}...
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center text-sm text-gray-500">
              No {type} found.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const avatarSrc =
                  item.profilePicture?.commentView ||
                  item.profilePicture?.profileView ||
                  item.profilePicture ||
                  "https://via.placeholder.com/48";

                return (
                  <div
                    key={item.userId}
                    className="flex items-center gap-3 rounded-3xl border border-gray-100 bg-gray-50 p-3"
                  >
                    <img
                      src={avatarSrc}
                      alt={item.username}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.username}</p>
                      <p className="text-xs text-gray-500">
                        {type === "following" ? "Following" : "Follower"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-5 py-4 text-right">
          {/* <button
            onClick={onClose}
            className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
          >
            Close
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default Fallow;
