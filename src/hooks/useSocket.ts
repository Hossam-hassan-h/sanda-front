import { useEffect, useRef } from "react";
import { socket } from "@/lib/socket";

export const useSocket = <TData = Record<string, unknown>>(event: string, callback: (data: TData) => void) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const listener = ((data: Record<string, unknown>) => callbackRef.current(data as TData)) as (...args: unknown[]) => void;

    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [event]);

  return socket;
};

export const useSocketConnect = () => {
  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);
};
