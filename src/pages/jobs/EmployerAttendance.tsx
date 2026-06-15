import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Search, MapPin, Clock, CheckCircle, XCircle, Filter, Download } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployerAttendanceReport } from "@/hooks/useAttendance";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { AttendanceReportItem } from "@/api/types";

const statusConfig: Record<string, { label: string; color: string }> = {
  "checked-in": { label: "حاضر", color: "bg-blue-100 text-blue-700 border-blue-200" },
  "checked-out": { label: "منتهي", color: "bg-green-100 text-green-700 border-green-200" },
  assigned: { label: "لم يبدأ", color: "bg-gray-100 text-gray-700 border-gray-200" },
  "no-show": { label: "لم يحضر", color: "bg-red-100 text-red-700 border-red-200" },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-700 border-red-200" },
};

export default function EmployerAttendance() {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [workerSearch, setWorkerSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const queryParams = useMemo(() => ({
    page,
    limit: 10,
    ...(jobId ? { jobId } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(workerSearch ? { workerName: workerSearch } : {}),
    ...(dateFrom ? { fromDate: new Date(dateFrom).toISOString() } : {}),
    ...(dateTo ? { toDate: new Date(dateTo).toISOString() } : {}),
  }), [page, jobId, statusFilter, workerSearch, dateFrom, dateTo]);

  const { data, isLoading, error } = useEmployerAttendanceReport(queryParams);

  const records = data?.data ?? [];
  const pagination = data?.pagination;
  const totalRecords = pagination?.total ?? 0;

  const clearFilters = () => {
    setStatusFilter("all");
    setWorkerSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasFilters = statusFilter !== "all" || workerSearch || dateFrom || dateTo;

  const formatDuration = (hours: number | null | undefined) => {
    if (hours == null) return "—";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m} د`;
    return `${h} س ${m} د`;
  };

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(jobId ? `/jobs/${jobId}/active` : "/my-jobs")} className="gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" />
          العودة
        </Button>

        <div className="mb-6">
          <h1 className="font-heading font-extrabold text-3xl">تقرير الحضور</h1>
          <p className="text-muted-foreground mt-1">
            {jobId ? "سجل حضور وانصراف العمال لهذه الوظيفة" : "سجل حضور وانصراف جميع وظائفك"}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-4 h-4" />
              الفلاتر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">الحالة</label>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="checked-in">حاضر</SelectItem>
                    <SelectItem value="checked-out">منتهي</SelectItem>
                    <SelectItem value="no-show">لم يحضر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">اسم العامل</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={workerSearch}
                    onChange={(e) => { setWorkerSearch(e.target.value); setPage(1); }}
                    placeholder="بحث..."
                    className="pr-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">من تاريخ</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">إلى تاريخ</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3">
                مسح الفلاتر
              </Button>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : error ? (
          <div className="text-center py-20 text-destructive">حدث خطأ في تحميل البيانات</div>
        ) : records.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-heading font-bold text-lg text-muted-foreground mb-2">لا توجد سجلات حضور</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {hasFilters ? "حاول تغيير الفلاتر" : "عندما يسجل العمال حضورهم، ستظهر هنا"}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-right p-3 font-medium">العامل</th>
                      <th className="text-right p-3 font-medium">الوظيفة</th>
                      <th className="text-right p-3 font-medium">الحالة</th>
                      <th className="text-right p-3 font-medium">وقت الحضور</th>
                      <th className="text-right p-3 font-medium">وقت الانصراف</th>
                      <th className="text-right p-3 font-medium">المدة</th>
                      <th className="text-right p-3 font-medium">الموقع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record: AttendanceReportItem) => {
                      const cfg = statusConfig[record.attendanceStatus === "checked_in" ? "checked-in" : record.attendanceStatus === "checked_out" ? "checked-out" : record.status === "cancelled" ? "no-show" : record.status] ?? statusConfig.assigned;
                      return (
                        <tr key={record.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {record.worker?.name?.charAt(0) || "ع"}
                              </div>
                              <div>
                                <p className="font-medium">{record.worker?.name || "عامل"}</p>
                                {record.worker?.rating != null && (
                                  <p className="text-xs text-muted-foreground">★ {record.worker.rating.toFixed(1)}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Link to={`/jobs/${record.jobId}`} className="hover:text-primary transition-colors">
                              {record.job?.title || record.jobId}
                            </Link>
                            {record.job?.city && <p className="text-xs text-muted-foreground">{record.job.city}</p>}
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
                          <td className="p-3">
                            <span className="font-medium">{formatDuration(record.workedHours ?? null)}</span>
                          </td>
                          <td className="p-3">
                            {record.checkInLocation ? (
                              <a
                                href={`https://www.google.com/maps?q=${record.checkInLocation.lat},${record.checkInLocation.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                              >
                                <MapPin className="w-3 h-3" />
                                عرض
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
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm">
                <p className="text-muted-foreground">
                  إجمالي {totalRecords} سجل — صفحة {pagination.page} من {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    السابق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= (pagination.totalPages || 1)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    التالي
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
}
