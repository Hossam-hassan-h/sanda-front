import { io } from "socket.io-client";

export const SOCKET_URL =
  import.meta.env.VITE_WS_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:4100";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});
