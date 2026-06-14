/**
 * Browser push-notification helper. Used by the SOSButton and the notification
 * dropdown as a fallback for users without the in-app dropdown visible.
 */

export type NotificationPermission = "default" | "granted" | "denied" | "unsupported";

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as NotificationPermission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission !== "default") {
    return Notification.permission as NotificationPermission;
  }
  const result = await Notification.requestPermission();
  return result as NotificationPermission;
}

export interface PushOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  onClick?: () => void;
  silent?: boolean;
}

/** Show a browser notification if permission has been granted. */
export async function showNotification(options: PushOptions): Promise<boolean> {
  const perm = getNotificationPermission();
  if (perm !== "granted" || typeof window === "undefined") return false;
  try {
    const n = new Notification(options.title, {
      body: options.body,
      icon: options.icon,
      badge: options.badge,
      tag: options.tag,
      data: options.data,
      silent: options.silent,
    });
    if (options.onClick) {
      n.onclick = () => {
        window.focus();
        options.onClick?.();
        n.close();
      };
    }
    return true;
  } catch {
    return false;
  }
}

/** Localized "unsupported" message used in UI toasts. */
export function notificationsUnsupportedMessage(): string {
  return "الإشعارات المباشرة غير مدعومة في هذا المتصفح";
}
