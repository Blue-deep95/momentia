import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice";
import feedReducer from "../slices/feedSlice";
import { commentApi } from "../slices/commentApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    feed: feedReducer,
    [commentApi.reducerPath]: commentApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(commentApi.middleware),
});