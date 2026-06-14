import { Users, Briefcase, AlertTriangle, DollarSign, TrendingUp, Clock } from "lucide-react";
import { ErrorState } from "@/components/admin/ErrorState";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDashboardStatsQuery } from "@/hooks/useAdminQueries";
import { StatCards } from "@/components/admin/dashboard/StatCards";
import { ActivityCard } from "@/components/admin/dashboard/ActivityCard";
import { RevenueChart } from "@/components/admin/dashboard/RevenueChart";
import { CategoryChart } from "@/components/admin/dashboard/CategoryChart";

const formatNumber = (value: number | null | undefined) =>
  Number.isFinite(Number(value)) ? Number(value).toLocaleString() : "0";

export default function AdminDashboard() {
  const { data, isLoading, isError, refetch } = useDashboardStatsQuery();

  if (isError) {
    return <AdminLayout><ErrorState onRetry={() => refetch()} /></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6">
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-2">لوحة التحكم</h1>
        <p className="text-muted-foreground mb-8">نظرة عامة على نشاط منصة سندة</p>

        {isLoading ? (
          <DashboardSkeleton />
        ) : data ? (
          <>
            <StatCards data={data} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <ActivityCard data={data} />
              <RevenueChart data={data.revenueByMonth} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <CategoryChart data={data.jobsByCategory} />
              <StatsList data={data} />
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}

function StatsList({ data }: { data: import("@/api/types").AdminStats }) {
  return (
    <Card>
      <CardHeader>
        <div className="text-lg font-semibold">الإحصائيات</div>
      </CardHeader>
      <CardContent className="space-y-3">
        <StatsRow icon={<DollarSign className="h-4 w-4" />} label="إجمالي الإيرادات" value={`${formatNumber(data.heldAmount)} ج`} />
        <StatsRow icon={<Clock className="h-4 w-4" />} label="بلاغات معلقة" value={formatNumber(data.openReports)} />
        <StatsRow icon={<AlertTriangle className="h-4 w-4" />} label="وظائف نشطة" value={formatNumber(data.activeJobs)} />
      </CardContent>
    </Card>
  );
}

function StatsRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground flex items-center gap-2">{icon} {label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
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
  );
}
