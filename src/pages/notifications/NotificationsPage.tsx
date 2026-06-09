import { useState, useMemo } from "react";
import { Bell, Check, Trash2, Briefcase, User, Flag, Info, Filter, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/layouts/AdminLayout";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification } from "@/hooks/useNotifications";
import type { Notification } from "@/api/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  job: { icon: <Briefcase className="w-4 h-4" />, label: "وظائف", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  user: { icon: <User className="w-4 h-4" />, label: "مستخدمين", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  report: { icon: <Flag className="w-4 h-4" />, label: "بلاغات", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  system: { icon: <Info className="w-4 h-4" />, label: "نظام", color: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300" },
};

const typeFilters = [
  { value: "all", label: "الكل" },
  { value: "report", label: "البلاغات" },
  { value: "job", label: "الوظائف" },
  { value: "user", label: "المستخدمين" },
  { value: "system", label: "النظام" },
];

const sectionConfig = [
  { key: "report", label: "البلاغات", icon: Flag, color: "text-red-600 bg-red-100 dark:bg-red-900/30" },
  { key: "job", label: "وظائف جديدة", icon: Briefcase, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
  { key: "user", label: "مستخدمين جدد", icon: User, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
  { key: "system", label: "النظام", icon: Info, color: "text-gray-600 bg-gray-100 dark:bg-gray-800/40" },
];

function formatNotifDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: notifications, isLoading, isError } = useNotifications(user?.role);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();

  const grouped = useMemo(() => {
    if (!notifications) return [];
    const filtered = typeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === typeFilter);

    const groups = sectionConfig
      .map((section) => ({
        ...section,
        items: filtered.filter((n) => n.type === section.key),
      }))
      .filter((g) => g.items.length > 0);

    return groups;
  }, [notifications, typeFilter]);

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) {
      markRead.mutate(notif.id);
    }
    if (notif.metadata?.jobId) {
      navigate(`/admin/jobs/${notif.metadata.jobId}`);
    } else if (notif.metadata?.reportId) {
      navigate(`/admin/reports/${notif.metadata.reportId}`);
    } else if (notif.metadata?.conversationId) {
      navigate(`/chat`);
    }
  };



  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">الإشعارات</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} إشعار غير مقروء`
                  : "لا توجد إشعارات جديدة"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                typeFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="space-y-3">
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        ) : isError ? (
          <Alert variant="destructive" className="my-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>خطأ في تحميل الإشعارات</AlertTitle>
            <AlertDescription>حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.</AlertDescription>
          </Alert>
        ) : grouped.length > 0 ? (
          <div className="space-y-8">
            {grouped.map((section) => (
              <div key={section.key}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", section.color)}>
                    <section.icon className="w-4 h-4" />
                  </div>
                  <h2 className="font-semibold text-lg">{section.label}</h2>
                  <Badge variant="secondary" className="mr-auto">
                    {section.items.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {section.items.map((notif) => {
                    const config = typeConfig[notif.type] || typeConfig.system;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md relative group",
                          !notif.isRead
                            ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800/30"
                            : "bg-card border-border"
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", config.color)}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className={cn("font-medium", !notif.isRead && "text-foreground")}>
                                {notif.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notif.message}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <span className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 mt-1.5" />
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                {config.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatNotifDate(notif.createdAt)}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(notif.id);
                              }}
                              className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium text-muted-foreground">
              لا توجد إشعارات
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {typeFilter !== "all"
                ? "لا توجد إشعارات من هذا النوع"
                : "ستظهر الإشعارات الجديدة هنا"}
            </p>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الإشعار</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الإشعار؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteTarget) deleteNotif.mutate(deleteTarget); setDeleteTarget(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
