import { memo, type ReactNode } from "react";
import { Bell, Check, Trash2, Briefcase, User, Flag, Info } from "lucide-react";
import type { Notification } from "@/api/types";
import { cn } from "@/lib/utils";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  if (diff < MINUTE) return "الآن";
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return `منذ ${m} دقيقة`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `منذ ${h} ساعة`;
  }
  if (diff < WEEK) {
    const d = Math.floor(diff / DAY);
    return `منذ ${d} يوم`;
  }
  return new Date(dateStr).toLocaleDateString("ar-EG", {
    month: "short",
    day: "numeric",
  });
}

const MAX_VISIBLE = 10;

const typeConfig: Record<string, { icon: ReactNode; label: string; color: string }> = {
  job: { icon: <Briefcase className="w-4 h-4" />, label: "وظائف", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  user: { icon: <User className="w-4 h-4" />, label: "مستخدمين", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  report: { icon: <Flag className="w-4 h-4" />, label: "بلاغات", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  system: { icon: <Info className="w-4 h-4" />, label: "نظام", color: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300" },
};

interface NotificationDropdownProps {
  notifications?: Notification[];
  isLoading: boolean;
  unreadCount: number;
  userRole?: string;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default memo(function NotificationDropdown({
  notifications,
  isLoading,
  unreadCount,
  userRole,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onClose,
}: NotificationDropdownProps) {
  const visible = notifications?.slice(0, MAX_VISIBLE) ?? [];
  const isAdmin = userRole === "admin";

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) {
      onMarkRead(notif.id);
    }
    if (notif.metadata?.jobId) {
      window.location.href = isAdmin
        ? `/admin/jobs/${notif.metadata.jobId}`
        : `/jobs/${notif.metadata.jobId}`;
    } else if (notif.metadata?.reportId) {
      window.location.href = isAdmin
        ? `/admin/reports/${notif.metadata.reportId}`
        : `/admin/reports/${notif.metadata.reportId}`;
    } else if (notif.metadata?.conversationId) {
      window.location.href = `/chat`;
    }
    onClose();
  };

  return (
    <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto top-16 sm:top-auto sm:left-0 sm:mt-2 w-auto sm:w-96 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <h3 className="font-semibold text-sm">الإشعارات</h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length > 0 ? (
          visible.map((notif) => {
            const config = typeConfig[notif.type] || typeConfig.system;
            return (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={cn(
                "flex items-start gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors border-b last:border-b-0 group",
                !notif.isRead
                  ? "bg-blue-50/70 dark:bg-blue-950/20"
                  : "bg-popover"
              )}
            >
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", config.color)}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold", !notif.isRead ? "text-foreground" : "text-foreground/80")}>
                  {notif.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {notif.message}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {timeAgo(notif.createdAt)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notif.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive transition-opacity"
                title="حذف"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">لا توجد إشعارات</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {isAdmin && (
        <div className="p-2 border-t bg-muted/30 text-center">
          <a
            href="/notifications"
            className="text-xs text-primary hover:underline"
            onClick={onClose}
          >
            عرض كل الإشعارات
          </a>
        </div>
      )}
    </div>
  );
});
