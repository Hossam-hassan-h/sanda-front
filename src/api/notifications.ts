import api from "./client";
import type { Notification } from "./types";

interface PaginatedResponse<T> {
  data: T[];
  pagination?: Record<string, unknown>;
}

const getId = (item: { id?: string; _id?: string } | string | undefined) =>
  typeof item === "string" ? item : item?.id ?? item?._id ?? "";

const mapNotification = (raw: Notification): Notification => ({
  ...raw,
  id: getId(raw),
  isRead: raw.isRead ?? raw.is_read ?? false,
  entityType: raw.entityType ?? raw.entity_type,
  entityId: raw.entityId ?? raw.entity_id,
  roleTarget: raw.roleTarget ?? "user",
});

export const notificationsApi = {
  async list(): Promise<Notification[]> {
    const { data } = await api.get<PaginatedResponse<Notification> | Notification[]>("/notifications");
    const items = Array.isArray(data) ? data : data.data ?? [];
    return items.map(mapNotification);
  },

  async unreadCount(): Promise<{ unreadCount: number; unread_count?: number }> {
    const { data } = await api.get("/notifications/unread-count");
    const unreadCount = data.unreadCount ?? data.unread_count ?? 0;
    return { unreadCount, unread_count: unreadCount };
  },

  async markRead(id: string): Promise<Notification> {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return mapNotification(data);
  },

  async markAllRead(): Promise<{ modifiedCount?: number; modified_count?: number }> {
    const { data } = await api.patch("/notifications/read-all");
    return data;
  },
};
