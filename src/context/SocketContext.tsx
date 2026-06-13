import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { SocketContext } from "@/context/socket-context";
import type { Conversation, JobAssignment, Message, Notification } from "@/api/types";

const getId = (value: { id?: string; _id?: string } | string | null | undefined) =>
  typeof value === "string" ? value : value?.id ?? value?._id ?? "";

const normalizeConversation = (conversation: Conversation): Conversation => ({
  ...conversation,
  id: getId(conversation),
});

const normalizeMessage = (message: Message): Message => ({
  ...message,
  id: getId(message),
  conversation: getId(message.conversation),
  sender: typeof message.sender === "object" && message.sender ? { ...message.sender, id: getId(message.sender) } : message.sender,
});

const normalizeNotification = (notification: Notification): Notification => ({
  ...notification,
  id: getId(notification),
  conversation: typeof notification.conversation === "object" && notification.conversation
    ? { ...notification.conversation, id: getId(notification.conversation) }
    : notification.conversation,
});

const sortConversations = (items: Conversation[]) =>
  [...items].sort((a, b) => {
    const aTime = a.lastMessageAt ?? a.last_message_at ?? a.updatedAt ?? "";
    const bTime = b.lastMessageAt ?? b.last_message_at ?? b.updatedAt ?? "";
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("sanda_token");

    if (!isAuthenticated || !token) {
      socket.removeAllListeners();
      socket.disconnect();
      setIsConnected(false);
      return;
    }

    socket.auth = { token };
    if (socket.connected) socket.disconnect();
    socket.connect();

    const handleConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    };
    const handleDisconnect = () => setIsConnected(false);
    const handleReconnectAttempt = () => setIsReconnecting(true);

    const handleMessageNew = (payload: Message) => {
      const message = normalizeMessage(payload);
      queryClient.setQueryData<Message[]>(["messages", message.conversation], (old = []) =>
        old.some((item) => getId(item) === message.id) ? old : [...old, message],
      );
    };

    const handleConversationUpdated = (payload: Conversation) => {
      const conversation = normalizeConversation(payload);
      queryClient.setQueryData<Conversation[]>(["conversations"], (old = []) =>
        sortConversations([
          conversation,
          ...old.filter((item) => getId(item) !== conversation.id),
        ]),
      );
      queryClient.setQueryData(["conversation", conversation.id], conversation);
    };

    const handleMessageRead = (payload: { conversation?: string; read_at?: string; readAt?: string }) => {
      const conversationId = payload.conversation;
      if (!conversationId) return;
      const readAt = payload.read_at ?? payload.readAt ?? new Date().toISOString();
      queryClient.setQueryData<Message[]>(["messages", conversationId], (old = []) =>
        old.map((message) => ({ ...message, readAt, read_at: readAt })),
      );
    };

    const handleNotificationNew = (payload: Notification) => {
      const notification = normalizeNotification(payload);
      queryClient.setQueriesData<Notification[]>({ queryKey: ["notifications"] }, (old = []) =>
        old.some((item) => getId(item) === notification.id) ? old : [notification, ...old],
      );
    };

    const handleUnreadCount = (payload: { unread_count?: number; unreadCount?: number }) => {
      const unreadCount = payload.unread_count ?? payload.unreadCount ?? 0;
      queryClient.setQueryData(["notifications", "unread-count"], { unreadCount, unread_count: unreadCount });
    };

    const handleAssignmentUpdated = (payload: JobAssignment) => {
      const assignmentId = getId(payload);
      if (assignmentId) {
        queryClient.setQueryData(["assignments", assignmentId], payload);
      }
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    };

    const handleUserUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    };

    const handleAdminUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.on("message:new", handleMessageNew);
    socket.on("conversation:updated", handleConversationUpdated);
    socket.on("message:read", handleMessageRead);
    socket.on("notification:new", handleNotificationNew);
    socket.on("notifications:unread-count", handleUnreadCount);
    socket.on("assignment:updated", handleAssignmentUpdated);
    socket.on("payment:updated", handleAssignmentUpdated);
    socket.on("user:updated", handleUserUpdated);
    socket.on("admin:updated", handleAdminUpdated);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.off("message:new", handleMessageNew);
      socket.off("conversation:updated", handleConversationUpdated);
      socket.off("message:read", handleMessageRead);
      socket.off("notification:new", handleNotificationNew);
      socket.off("notifications:unread-count", handleUnreadCount);
      socket.off("assignment:updated", handleAssignmentUpdated);
      socket.off("payment:updated", handleAssignmentUpdated);
      socket.off("user:updated", handleUserUpdated);
      socket.off("admin:updated", handleAdminUpdated);
    };
  }, [isAuthenticated, queryClient]);

  const value = useMemo(
    () => ({ socket, isConnected, isReconnecting }),
    [isConnected, isReconnecting],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
