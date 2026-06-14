import { createContext } from "react";
import { socket } from "@/lib/socket";

export interface SocketContextValue {
  socket: typeof socket;
  isConnected: boolean;
  isReconnecting: boolean;
}

export const SocketContext = createContext<SocketContextValue | null>(null);
