import { memo, useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import NotificationDropdown from "@/components/NotificationDropdown";

export default memo(function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const role = user?.role;
  const { data: notifications, isLoading } = useNotifications(role);
  const { data: unreadData } = useUnreadCount(role);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();

  const unreadCount = unreadData?.count ?? 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-accent transition-colors"
        aria-label="الإشعارات"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <NotificationDropdown
          notifications={notifications}
          isLoading={isLoading}
          unreadCount={unreadCount}
          userRole={user?.role}
          onMarkRead={(id) => markRead.mutate(id)}
          onMarkAllRead={() => markAllRead.mutate()}
          onDelete={(id) => deleteNotif.mutate(id)}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
});
