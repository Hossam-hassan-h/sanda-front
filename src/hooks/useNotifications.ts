import { useQuery, useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { notificationsApi } from "@/api/notifications";
import type { Notification } from "@/api/types";

const NOTIF_KEY = ["notifications"] as const;
const UNREAD_KEY = ["notifications", "unread-count"] as const;

// ─── Query hooks ─────────────────────────────────────────────────

export const useNotifications = (role?: string) =>
  useQuery({
    queryKey: [...NOTIF_KEY, role],
    queryFn: () => notificationsApi.list(role),
  });

export const useUnreadCount = (role?: string) =>
  useQuery({
    queryKey: [...UNREAD_KEY, role],
    queryFn: () => notificationsApi.unreadCount(role),
  });

// ─── Shared mutation helper ───────────────────────────────────────

/**
 * Shared helper that handles optimistic updates for notification mutations.
 * Eliminates the duplicated onMutate / onError / onSettled boilerplate
 * that was repeated in every notification mutation hook.
 */
function useNotificationMutation<TArgs>(
  mutationFn: (args: TArgs) => Promise<unknown>,
  optimisticUpdate: (old: Notification[] | undefined, args: TArgs) => Notification[],
): UseMutationResult<unknown, Error, TArgs, { prev: [readonly unknown[], Notification[] | undefined][] }> {
  const qc = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: NOTIF_KEY });
      const prev = qc.getQueriesData<Notification[]>({ queryKey: NOTIF_KEY });
      qc.setQueriesData<Notification[]>({ queryKey: NOTIF_KEY }, (old) => optimisticUpdate(old, args));
      return { prev };
    },
    onError: (_err, _args, ctx) => {
      if (ctx?.prev) {
        ctx.prev.forEach(([key, data]) => qc.setQueryData(key, data));
      }
    },
    onSettled: (_data, error) => {
      if (error) {
        qc.invalidateQueries({ queryKey: NOTIF_KEY });
        qc.invalidateQueries({ queryKey: UNREAD_KEY });
      }
    },
  });
}

/** Mark a single notification as read. */
export const useMarkNotificationRead = () =>
  useNotificationMutation(
    (id: string) => notificationsApi.markRead(id),
    (old, id) => old?.map((n) => (n.id === id ? { ...n, isRead: true } : n)) ?? [],
  );

/** Mark all notifications as read. */
export const useMarkAllNotificationsRead = () =>
  useNotificationMutation(
    () => notificationsApi.markAllRead(),
    (old) => old?.map((n) => ({ ...n, isRead: true })) ?? [],
  );

/** Delete a notification. */
export const useDeleteNotification = () =>
  useNotificationMutation(
    (id: string) => notificationsApi.delete(id),
    (old, id) => old?.filter((n) => n.id !== id) ?? [],
  );
