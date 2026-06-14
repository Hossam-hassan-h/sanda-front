import { Users, Briefcase, AlertTriangle, DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { AdminStats } from "@/api/types";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

const formatNumber = (value: number | null | undefined) =>
  Number.isFinite(Number(value)) ? Number(value).toLocaleString() : "0";

export function StatCards({ data }: { data: AdminStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard icon={<Users />} label="إجمالي المستخدمين" value={formatNumber(data.totalUsers)} />
      <StatCard icon={<Briefcase />} label="الوظائف النشطة" value={formatNumber(data.activeJobs)} />
      <StatCard icon={<AlertTriangle />} label="البلاغات المفتوحة" value={formatNumber(data.openReports)} />
      <StatCard icon={<DollarSign />} label="إجمالي الإيرادات" value={`${formatNumber(data.heldAmount)} ج`} />
    </div>
  );
}
