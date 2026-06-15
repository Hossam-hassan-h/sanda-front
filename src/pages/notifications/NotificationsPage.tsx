import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, Briefcase, Check, Flag, Filter, Info, MessageCircle, ShieldCheck, User } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationUnreadCount,
  useNotifications,
} from "@/hooks/useNotifications";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/api-error";
import { toast } from "@/hooks/use-toast";
import type { Notification } from "@/api/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  job: { icon: <Briefcase className="w-4 h-4" />, label: "وظائف", color: "bg-blue-100 text-blue-700" },
  user: { icon: <User className="w-4 h-4" />, label: "مستخدمين", color: "bg-green-100 text-green-700" },
  report: { icon: <Flag className="w-4 h-4" />, label: "بلاغات", color: "bg-red-100 text-red-700" },
  system: { icon: <Info className="w-4 h-4" />, label: "نظام", color: "bg-gray-100 text-gray-700" },
  message_received: { icon: <MessageCircle className="w-4 h-4" />, label: "رسائل", color: "bg-purple-100 text-purple-700" },
  verification_request: { icon: <ShieldCheck className="w-4 h-4" />, label: "توثيق", color: "bg-amber-100 text-amber-700" },
};

const typeFilters = [
  { value: "all", label: "الكل" },
  { value: "message_received", label: "الرسائل" },
  { value: "job", label: "الوظائف" },
  { value: "user", label: "المستخدمين" },
  { value: "report", label: "البلاغات" },
  { value: "verification_request", label: "التوثيق" },
  { value: "system", label: "النظام" },
];

function formatNotifDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState("all");
  const { data: notifications, isLoading, isError } = useNotifications();
  const { data: unreadCountData } = useNotificationUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = unreadCountData?.unreadCount ?? unreadCountData?.unread_count ?? 0;

  const filtered = useMemo(() => {
    if (!notifications) return [];
    return typeFilter === "all" ? notifications : notifications.filter((n) => n.type === typeFilter);
  }, [notifications, typeFilter]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markRead.mutateAsync(notification.id);
      } catch (err) {
        toast({ title: "فشل تحديث الإشعار", description: getApiErrorMessage(err, "حاول مرة أخرى"), variant: "destructive" });
      }
    }

    const jobId = typeof notification.job === "object" ? notification.job?.id ?? notification.job?._id : notification.job;
    const conversationId =
      typeof notification.conversation === "object"
        ? notification.conversation?.id ?? notification.conversation?._id
        : notification.conversation;
    const userRole = user?.role;
    const notifType = notification.type;
    const entityType = notification.entityType;

    if (conversationId || notification.metadata?.conversationId) {
      navigate(`/chat?conversation=${conversationId ?? notification.metadata?.conversationId}`);
      return;
    }

    if (notifType === "application_accepted" && userRole === "worker") {
      navigate("/my-jobs-active");
      return;
    }

    if (entityType === "report") {
      const reportId = notification.entityId ?? notification.metadata?.reportId;
      if (reportId) { navigate(`/admin/reports/${reportId}`); return; }
    }

    if (notifType === "verification_request" && userRole === "admin") {
      const targetId = notification.entityId ?? (typeof notification.actor === "string" ? notification.actor : notification.actor?.id ?? notification.actor?._id);
      if (targetId) { navigate(`/admin/users/${targetId}`); return; }
    }

    if (notification.metadata?.reportId) {
      navigate(`/admin/reports/${notification.metadata.reportId}`);
      return;
    }

    const targetJobId = jobId ?? notification.metadata?.jobId;
    if (!targetJobId) return;

    if (userRole === "admin") {
      navigate(`/admin/jobs/${targetJobId}`);
    } else if (userRole === "employer" && notifType === "application_created") {
      navigate(`/jobs/${targetJobId}/applicants`);
    } else {
      navigate(`/jobs/${targetJobId}`);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto" dir="rtl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">الإشعارات</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : "لا توجد إشعارات جديدة"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} className="gap-2">
              <Check className="w-4 h-4" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {typeFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                typeFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : isError ? (
          <Alert variant="destructive" className="my-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>خطأ في تحميل الإشعارات</AlertTitle>
            <AlertDescription>حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.</AlertDescription>
          </Alert>
        ) : filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((notification) => {
              const config = typeConfig[notification.type] || typeConfig.system;
              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md text-start",
                    !notification.isRead ? "bg-blue-50/70 border-blue-200/60" : "bg-card border-border",
                  )}
                >
                  <span className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", config.color)}>
                    {config.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-start justify-between gap-2">
                      <span>
                        <span className="block font-medium">{notification.title}</span>
                        <span className="block text-sm text-muted-foreground mt-1">{notification.message}</span>
                      </span>
                      {!notification.isRead && <span className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 mt-1.5" />}
                    </span>
                    <span className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
                      <span className="text-xs text-muted-foreground">{formatNotifDate(notification.createdAt)}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium text-muted-foreground">لا توجد إشعارات</h3>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
