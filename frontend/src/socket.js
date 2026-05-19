import { io } from "socket.io-client";

let socket = null;

export const initSocket = (token) => {
  if (!token) return null;

  if (socket) {
    if (socket.auth?.token === token && socket.connected) {
      return socket;
    }
    socket.disconnect();
  }

  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:2000", {
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
