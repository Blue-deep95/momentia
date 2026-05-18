import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice"; // your slice
import { commentApi } from "../slices/commentApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [commentApi.reducerPath]: commentApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(commentApi.middleware),
});