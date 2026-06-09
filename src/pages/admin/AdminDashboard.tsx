import { Users, Briefcase, AlertTriangle, DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/admin/ErrorState";
import AdminLayout from "@/layouts/AdminLayout";
import { useDashboardStatsQuery } from "@/hooks/useAdminQueries";

export default function AdminDashboard() {
  const { data, isLoading, isError, error, refetch } = useDashboardStatsQuery();

  if (isError) {
    return <AdminLayout><ErrorState onRetry={() => refetch()} /></AdminLayout>;
  }

  return (
    <AdminLayout>
    <div className="px-4 sm:px-6">
      <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-2">لوحة التحكم</h1>
      <p className="text-muted-foreground mb-8">نظرة عامة على نشاط منصة سندة</p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المستخدمين</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalUsers.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">الوظائف النشطة</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.activeJobs.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">البلاغات المفتوحة</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.openReports.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.heldAmount.toLocaleString()} ج</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">نشاط اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                تم إنشاء <span className="font-semibold text-foreground">{data.jobsToday}</span> وظيفة جديدة اليوم
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
    </AdminLayout>
  );
}
