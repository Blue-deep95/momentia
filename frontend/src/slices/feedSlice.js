import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../services/api";

export const fetchPosts = createAsyncThunk(
  "feed/fetchPosts",
  async ({ cursor = null } = {}, thunkAPI) => {
    const url = cursor ? `/feed/get-posts?cursor=${encodeURIComponent(cursor)}` : "/feed/get-posts";
    const response = await api.get(url);
    return { ...response.data, cursor };
  }
);

const initialState = {
  posts: [],
  loading: false,
  loadingMore: false,
  nextCursor: null,
  hasMore: true,
  error: null,
};

const feedSlice = createSlice({
  name: "feed",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state, action) => {
        const isInitial = !action.meta.arg?.cursor;
        state.error = null;
        if (isInitial) {
          state.loading = true;
        } else {
          state.loadingMore = true;
        }
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        const { posts = [], nextCursor, hasNextPage } = action.payload;
        const isInitial = !action.meta.arg?.cursor;

        state.posts = isInitial ? posts : [...state.posts, ...posts];
        state.nextCursor = nextCursor || null;
        state.hasMore = hasNextPage ?? false;
        state.loading = false;
        state.loadingMore = false;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.error = action.error.message || "Failed to load feed";
        state.loading = false;
        state.loadingMore = false;
      });
  },
});

export default feedSlice.reducer;
