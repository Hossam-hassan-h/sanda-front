import api, { USE_MOCKS } from "./client";
import { mockConversations, mockMessages } from "@/lib/mock/data";
import { mockDelay } from "@/lib/mock/utils";
import type { Conversation, Message, MessageAttachment } from "./types";

export const chatApi = {
  async conversations(): Promise<Conversation[]> {
    if (USE_MOCKS) return mockDelay(mockConversations);
    const { data } = await api.get("/conversations");
    return data;
  },
  async messages(conversationId: string): Promise<Message[]> {
    if (USE_MOCKS) return mockDelay(mockMessages[conversationId] ?? []);
    const { data } = await api.get(`/conversations/${conversationId}/messages`);
    return data;
  },
  async send(conversationId: string, message: string, attachments?: File[]): Promise<Message> {
    if (USE_MOCKS) {
      const fileAttachments: MessageAttachment[] | undefined = attachments?.length
        ? attachments.map((f) => ({
            name: f.name,
            size: f.size,
            type: f.type,
            url: URL.createObjectURL(f),
          }))
        : undefined;
      return mockDelay({
        id: "m" + Date.now(),
        conversationId,
        senderId: "u1",
        message,
        attachments: fileAttachments,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
    const formData = new FormData();
    formData.append("message", message);
    attachments?.forEach((f) => formData.append("attachments", f));
    const { data } = await api.post(`/conversations/${conversationId}/messages`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
