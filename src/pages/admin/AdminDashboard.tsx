import { Users, Briefcase, AlertTriangle, DollarSign, TrendingUp, Clock } from "lucide-react";
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">نشاط اليوم</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> وظائف جديدة
                  </span>
                  <span className="font-semibold">{data.jobsToday}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" /> مستخدمين جدد
                  </span>
                  <span className="font-semibold">{data.newUsersToday ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> تقديمات على الوظائف
                  </span>
                  <span className="font-semibold">{data.applicationsToday ?? 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">الإحصائيات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> إجمالي الإيرادات
                  </span>
                  <span className="font-semibold">{data.heldAmount.toLocaleString()} ج</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" /> بلاغات معلقة
                  </span>
                  <span className="font-semibold">{data.openReports}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> وظائف نشطة
                  </span>
                  <span className="font-semibold">{data.activeJobs}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
    </AdminLayout>
  );
}
