import { io } from "socket.io-client";

let socket = null;

const getSocketUrl = (apiUrl) => {
  if (!apiUrl) return "http://localhost:2000";
  try {
    const url = new URL(apiUrl);
    return url.origin;
  } catch (e) {
    return apiUrl;
  }
};

export const initSocket = (token) => {
  if (!token) return null;

  if (socket) {
    if (socket.auth?.token === token && socket.connected) {
      return socket;
    }
    socket.disconnect();
  }

  const socketUrl = getSocketUrl(import.meta.env.VITE_API_URL);

  socket = io(socketUrl, {
    withCredentials: true,
    transports: ["websocket"],
    auth: { token },
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
