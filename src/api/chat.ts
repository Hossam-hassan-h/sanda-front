import api from "./client";
import type { Conversation, Message } from "./types";

interface PaginatedResponse<T> {
  data: T[];
  pagination?: Record<string, unknown>;
}

export const chatApi = {
  async createConversation(assignmentId: string): Promise<Conversation> {
    const { data } = await api.post(`/job-assignments/${assignmentId}/conversation`);
    return data;
  },

  async conversations(): Promise<Conversation[]> {
    const { data } = await api.get<PaginatedResponse<Conversation> | Conversation[]>("/conversations");
    return Array.isArray(data) ? data : data.data ?? [];
  },

  async conversation(conversationId: string): Promise<Conversation> {
    const { data } = await api.get(`/conversations/${conversationId}`);
    return data;
  },

  async messages(conversationId: string, before?: string): Promise<Message[]> {
    const params = before ? { before } : undefined;
    const { data } = await api.get<PaginatedResponse<Message> | Message[]>(
      `/conversations/${conversationId}/messages`,
      { params },
    );
    return Array.isArray(data) ? data : data.data ?? [];
  },

  async send(conversationId: string, content: string): Promise<Message> {
    const { data } = await api.post(`/conversations/${conversationId}/messages`, { content });
    return data;
  },

  async markRead(conversationId: string): Promise<{ modifiedCount?: number; modified_count?: number }> {
    const { data } = await api.patch(`/conversations/${conversationId}/read`);
    return data;
  },
};
