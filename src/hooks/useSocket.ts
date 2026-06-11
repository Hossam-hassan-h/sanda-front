import { useEffect, useRef } from "react";
import { useSocketContext } from "@/hooks/useSocketContext";

export const useSocket = <TData = Record<string, unknown>>(
  event: string,
  callback: (data: TData) => void,
) => {
  const { socket } = useSocketContext();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const listener = (data: TData) => callbackRef.current(data);
    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [event, socket]);

  return socket;
};

export const useSocketConnect = () => useSocketContext();
