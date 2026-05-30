import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice";
import feedReducer from "../slices/feedSlice";
import notificationReducer from "../slices/notificationSlice";
import { commentApi } from "../slices/commentApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notification: notificationReducer,
    feed: feedReducer,
    [commentApi.reducerPath]: commentApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(commentApi.middleware),
});