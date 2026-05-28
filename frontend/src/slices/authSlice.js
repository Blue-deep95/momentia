import { createSlice } from "@reduxjs/toolkit";

const storedUser = localStorage.getItem("user");
const storedToken = localStorage.getItem("token");

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: storedToken ? true : false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      const { user, accessToken } = action.payload;

      state.user = user;
      state.token = accessToken;
      state.isAuthenticated = true;

      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
    },

    updateUser: (state, action) => {
      const updatedUser = action.payload;
      state.user = {
        ...state.user,
        ...updatedUser,
      };
      localStorage.setItem("user", JSON.stringify(state.user));
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;

