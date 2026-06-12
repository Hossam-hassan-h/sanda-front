import { useMutation, useQuery, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { notificationsApi } from "@/api/notifications";
import type { Notification } from "@/api/types";

export const NOTIF_KEY = ["notifications"] as const;
export const NOTIF_UNREAD_KEY = ["notifications", "unread-count"] as const;

export const useNotifications = (_role?: string) =>
  useQuery({
    queryKey: NOTIF_KEY,
    queryFn: () => notificationsApi.list(),
  });

export const useNotificationUnreadCount = () =>
  useQuery({
    queryKey: NOTIF_UNREAD_KEY,
    queryFn: () => notificationsApi.unreadCount(),
  });

function useNotificationMutation<TArgs>(
  mutationFn: (args: TArgs) => Promise<unknown>,
  optimisticUpdate: (old: Notification[] | undefined, args: TArgs) => Notification[],
): UseMutationResult<unknown, Error, TArgs, { prev: [readonly unknown[], Notification[] | undefined][] }> {
  const qc = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: NOTIF_KEY, exact: true });
      const prev = qc.getQueriesData<Notification[]>({ queryKey: NOTIF_KEY, exact: true });
      qc.setQueriesData<Notification[]>({ queryKey: NOTIF_KEY, exact: true }, (old) => optimisticUpdate(old, args));
      return { prev };
    },
    onError: (_err, _args, ctx) => {
      if (ctx?.prev) {
        ctx.prev.forEach(([key, data]) => qc.setQueryData(key, data));
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: NOTIF_KEY });
      qc.invalidateQueries({ queryKey: NOTIF_UNREAD_KEY });
    },
  });
}

export const useMarkNotificationRead = () =>
  useNotificationMutation(
    (id: string) => notificationsApi.markRead(id),
    (old, id) => old?.map((n) => (n.id === id ? { ...n, isRead: true, is_read: true } : n)) ?? [],
  );

export const useMarkAllNotificationsRead = () =>
  useNotificationMutation(
    () => notificationsApi.markAllRead(),
    (old) => old?.map((n) => ({ ...n, isRead: true, is_read: true })) ?? [],
  );
