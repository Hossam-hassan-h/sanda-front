import api, { USE_MOCKS } from "./client";
import { mockConversations, mockMessages } from "@/lib/mock/data";
import { mockDelay } from "@/lib/mock/utils";
import type { Conversation, Message, MessageAttachment } from "./types";

const mockSendResponse = (conversationId: string, message: string, attachments?: File[]): Message => {
  const fileAttachments: MessageAttachment[] | undefined = attachments?.length
    ? attachments.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        url: URL.createObjectURL(f),
      }))
    : undefined;
  return {
    id: "m" + Date.now(),
    conversationId,
    senderId: "u1",
    message,
    attachments: fileAttachments,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
};

export const chatApi = {
  async conversations(): Promise<Conversation[]> {
    if (!USE_MOCKS) {
      try { const { data } = await api.get("/conversations"); return data; } catch { /* fallback */ }
    }
    return mockDelay(mockConversations);
  },
  async messages(conversationId: string): Promise<Message[]> {
    if (!USE_MOCKS) {
      try { const { data } = await api.get(`/conversations/${conversationId}/messages`); return data; } catch { /* fallback */ }
    }
    return mockDelay(mockMessages[conversationId] ?? []);
  },
  async send(conversationId: string, message: string, attachments?: File[]): Promise<Message> {
    if (!USE_MOCKS) {
      try {
        const formData = new FormData();
        formData.append("message", message);
        attachments?.forEach((f) => formData.append("attachments", f));
        const { data } = await api.post(`/conversations/${conversationId}/messages`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
      } catch { /* fallback */ }
    }
    return mockDelay(mockSendResponse(conversationId, message, attachments));
  },
};
