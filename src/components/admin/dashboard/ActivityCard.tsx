import { Briefcase, Users, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { AdminStats } from "@/api/types";

export function ActivityCard({ data }: { data: AdminStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">نشاط اليوم</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ActivityRow icon={<Briefcase className="h-4 w-4" />} label="وظائف جديدة" value={data.jobsToday} />
        <ActivityRow icon={<Users className="h-4 w-4" />} label="مستخدمين جدد" value={data.newUsersToday ?? 0} />
        <ActivityRow icon={<TrendingUp className="h-4 w-4" />} label="تقديمات على الوظائف" value={data.applicationsToday ?? 0} />
      </CardContent>
    </Card>
  );
}

function ActivityRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground flex items-center gap-2">{icon} {label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
