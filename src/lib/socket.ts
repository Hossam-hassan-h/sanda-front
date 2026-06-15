import { io } from "socket.io-client";
import { API_ROOT_URL } from "@/api/client";

export const SOCKET_URL =
  import.meta.env.VITE_WS_URL ||
  API_ROOT_URL;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
});
