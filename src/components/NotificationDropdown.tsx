import { memo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Briefcase, Check, Flag, Info, MessageCircle, User } from "lucide-react";
import type { Notification } from "@/api/types";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 10;

const typeConfig: Record<string, { icon: ReactNode; color: string }> = {
  job: { icon: <Briefcase className="w-4 h-4" />, color: "bg-blue-100 text-blue-700" },
  user: { icon: <User className="w-4 h-4" />, color: "bg-green-100 text-green-700" },
  report: { icon: <Flag className="w-4 h-4" />, color: "bg-red-100 text-red-700" },
  system: { icon: <Info className="w-4 h-4" />, color: "bg-gray-100 text-gray-700" },
  message_received: { icon: <MessageCircle className="w-4 h-4" />, color: "bg-purple-100 text-purple-700" },
};

const getDateLabel = (date: string) =>
  new Date(date).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });

interface NotificationDropdownProps {
  notifications?: Notification[];
  isLoading: boolean;
  unreadCount: number;
  userRole?: string;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export default memo(function NotificationDropdown({
  notifications,
  isLoading,
  unreadCount,
  userRole,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: NotificationDropdownProps) {
  const navigate = useNavigate();
  const visible = notifications?.slice(0, MAX_VISIBLE) ?? [];
  const isAdmin = userRole === "admin";

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      try { onMarkRead(notification.id); } catch { /* best-effort */ }
    }

    const jobId = typeof notification.job === "object" ? notification.job?.id ?? notification.job?._id : notification.job;
    const conversationId =
      typeof notification.conversation === "object"
        ? notification.conversation?.id ?? notification.conversation?._id
        : notification.conversation;
    const notifType = notification.type;

    if (conversationId || notification.metadata?.conversationId) {
      navigate(`/chat?conversation=${conversationId ?? notification.metadata?.conversationId}`);
    } else if (jobId || notification.metadata?.jobId) {
      const targetJobId = jobId ?? notification.metadata?.jobId;
      if (isAdmin) {
        navigate(`/admin/jobs/${targetJobId}`);
      } else if (notifType === "application_created") {
        navigate(`/jobs/${targetJobId}/applicants`);
      } else {
        navigate(`/jobs/${targetJobId}`);
      }
    } else if (notification.metadata?.reportId) {
      navigate(`/admin/reports/${notification.metadata.reportId}`);
    }

    onClose();
  };

  return (
    <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto top-16 sm:top-auto sm:left-0 sm:mt-2 w-auto sm:w-96 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden text-right" dir="rtl">
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <h3 className="font-semibold text-sm">الإشعارات</h3>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : visible.length > 0 ? (
          visible.map((notification) => {
            const config = typeConfig[notification.type] || typeConfig.system;
            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 text-start hover:bg-accent/50 transition-colors border-b last:border-b-0",
                  !notification.isRead ? "bg-blue-50/70 dark:bg-blue-950/20" : "bg-popover",
                )}
              >
                <span className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", config.color)}>
                  {config.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold truncate">{notification.title}</span>
                  <span className="block text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.message}</span>
                  <span className="block text-[10px] text-muted-foreground mt-1">{getDateLabel(notification.createdAt)}</span>
                </span>
              </button>
            );
          })
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">لا توجد إشعارات</p>
          </div>
        )}
      </div>
    </div>
  );
});
