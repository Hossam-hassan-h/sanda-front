import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Users, Clock, CheckCircle, BarChart3, MapPin, Search } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAttendanceAnalytics } from "@/hooks/useAttendance";
import { cn } from "@/lib/utils";
import type { AttendanceReportItem } from "@/api/types";

const statusConfig: Record<string, { label: string; color: string }> = {
  "checked-in": { label: "حاضر", color: "bg-blue-100 text-blue-700 border-blue-200" },
  "checked-out": { label: "منتهي", color: "bg-green-100 text-green-700 border-green-200" },
  assigned: { label: "لم يبدأ", color: "bg-gray-100 text-gray-700 border-gray-200" },
  "no-show": { label: "لم يحضر", color: "bg-red-100 text-red-700 border-red-200" },
};

export default function AdminAttendance() {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const queryParams = useMemo(() => ({
    page,
    limit: 15,
    ...(dateFrom ? { fromDate: new Date(dateFrom).toISOString() } : {}),
    ...(dateTo ? { toDate: new Date(dateTo).toISOString() } : {}),
  }), [page, dateFrom, dateTo]);

  const { data, isLoading } = useAdminAttendanceAnalytics(queryParams);

  const analytics = data?.analytics;
  const records = data?.data ?? [];
  const pagination = data?.pagination;

  const formatDuration = (hours: number | null | undefined) => {
    if (hours == null) return "—";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m} د`;
    return `${h} س ${m} د`;
  };

  const statCards = [
    { label: "إجمالي التعيينات", value: analytics?.totalAssignments ?? 0, icon: Users, color: "text-blue-600 bg-blue-100" },
    { label: "تسجيلات اليوم", value: analytics?.todayCheckIns ?? 0, icon: CheckCircle, color: "text-green-600 bg-green-100" },
    { label: "مناوبات نشطة", value: analytics?.activeShifts ?? 0, icon: Clock, color: "text-amber-600 bg-amber-100" },
    { label: "متوسط ساعات العمل", value: analytics?.avgWorkedHours != null ? `${formatDuration(analytics.avgWorkedHours)}` : "—", icon: BarChart3, color: "text-purple-600 bg-purple-100" },
  ];

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6">
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-2">مراقبة الحضور</h1>
        <p className="text-muted-foreground mb-8">نظرة عامة على نشاط الحضور والانصراف في المنصة</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">جميع سجلات الحضور</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">من تاريخ</label>
                <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">إلى تاريخ</label>
                <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">لا توجد سجلات حضور</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-right p-3 font-medium">العامل</th>
                        <th className="text-right p-3 font-medium">صاحب العمل</th>
                        <th className="text-right p-3 font-medium">الوظيفة</th>
                        <th className="text-right p-3 font-medium">الحالة</th>
                        <th className="text-right p-3 font-medium">الحضور</th>
                        <th className="text-right p-3 font-medium">الانصراف</th>
                        <th className="text-right p-3 font-medium">المدة</th>
                        <th className="text-right p-3 font-medium">الموقع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record: AttendanceReportItem) => {
                        const statusKey = record.attendanceStatus === "checked_in" ? "checked-in" : record.attendanceStatus === "checked_out" ? "checked-out" : record.status;
                        const cfg = statusConfig[statusKey] ?? statusConfig.assigned;
                        return (
                          <tr key={record.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                  {record.worker?.name?.charAt(0) || "ع"}
                                </div>
                                <span className="font-medium text-xs">{record.worker?.name || "عامل"}</span>
                              </div>
                            </td>
                            <td className="p-3 text-xs">{record.employer && 'name' in record.employer ? (record.employer as Record<string, unknown>).name as string : "—"}</td>
                            <td className="p-3 text-xs">
                              <Link to={`/admin/jobs/${record.jobId}`} className="hover:text-primary">
                                {record.job?.title || record.jobId}
                              </Link>
                            </td>
                            <td className="p-3">
                              <Badge className={cn(cfg.color, "border text-xs")}>{cfg.label}</Badge>
                            </td>
                            <td className="p-3 text-xs" dir="ltr">
                              {record.checkInTime ? new Date(record.checkInTime).toLocaleString("ar-EG") : "—"}
                            </td>
                            <td className="p-3 text-xs" dir="ltr">
                              {record.checkOutTime ? new Date(record.checkOutTime).toLocaleString("ar-EG") : "—"}
                            </td>
                            <td className="p-3 text-xs font-medium">{formatDuration(record.workedHours ?? null)}</td>
                            <td className="p-3">
                              {record.checkInLocation ? (
                                <a href={`https://www.google.com/maps?q=${record.checkInLocation.lat},${record.checkInLocation.lng}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
                                  <MapPin className="w-3 h-3" /> عرض
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 text-sm">
                    <p className="text-muted-foreground">
                      صفحة {pagination.page} من {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>السابق</Button>
                      <Button variant="outline" size="sm" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>التالي</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
