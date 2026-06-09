import { io, type Socket } from "socket.io-client";
import { USE_MOCKS } from "@/api/client";

type SocketPayload = Record<string, unknown>;
type SocketCallback = (data: SocketPayload) => void;

class MockSocket {
  private listeners: Record<string, SocketCallback[]> = {};
  public connected = true;

  on(event: string, callback: SocketCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  off(event: string, callback: SocketCallback) {
    if (!this.listeners[event]) return this;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    return this;
  }

  emit(event: string, data: SocketPayload) {
    if (event === "join_room") {
      console.log(`[MockSocket] Joined room: ${data}`);
    } else if (event === "sos_trigger") {
      console.log(`[MockSocket] Worker triggered SOS:`, data);
      setTimeout(() => {
        this.trigger("sos_alert", {
          id: "sos-" + Date.now(),
          workerId: data.workerId,
          workerName: data.workerName || "أحمد المصري",
          location: data.location || "حدائق الأهرام، الحي الثاني",
          coordinates: data.coordinates || { latitude: 29.98, longitude: 31.13 },
          jobId: data.jobId,
          createdAt: new Date().toISOString(),
        });
      }, 1000);
    } else if (event === "send_message") {
      console.log(`[MockSocket] Message sent:`, data);
      setTimeout(() => {
        this.trigger("new_message", {
          id: "msg-" + Date.now(),
          conversationId: data.conversationId,
          senderId: "receiver",
          message: "وصلت الرسالة! شكراً لك.",
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }, 1500);
    }
    return this;
  }

  public trigger(event: string, data: SocketPayload) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }

  connect() {
    this.connected = true;
    console.log("[MockSocket] Connected to real-time server");
    return this;
  }

  disconnect() {
    this.connected = false;
    console.log("[MockSocket] Disconnected from real-time server");
    return this;
  }
}

function createRealSocket(): Socket {
  const url = import.meta.env.VITE_WS_URL || "http://localhost:5000";
  return io(url, { autoConnect: false });
}

export const socket = USE_MOCKS ? new MockSocket() : createRealSocket();
