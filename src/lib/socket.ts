import { io } from "socket.io-client";

const API_ORIGIN = import.meta.env.VITE_API_URL
  ?.replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

export const SOCKET_URL =
  import.meta.env.VITE_WS_URL ||
  API_ORIGIN ||
  "https://backend-clone-sanda-production.up.railway.app";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});
