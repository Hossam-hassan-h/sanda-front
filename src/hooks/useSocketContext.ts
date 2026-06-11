import { useContext } from "react";
import { SocketContext } from "@/context/socket-context";

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketContext must be used inside SocketProvider");
  return ctx;
}
