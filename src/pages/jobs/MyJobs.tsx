import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, QrCode, CalendarCheck, Eye, Clock, AlertTriangle } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { useMyJobs } from "@/hooks/useJobs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { JobStatus, Job } from "@/api/types";

const tabs: { key: JobStatus | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "open", label: "متاحة" },
  { key: "in-progress", label: "قيد التنفيذ" },
  { key: "completed", label: "مكتملة" },
];

function EmployerJobCard({ job }: { job: Job }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <Badge variant="outline" className="text-xs mb-2">{job.category}</Badge>
            <h3 className="font-heading font-bold text-lg truncate">{job.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{job.city}</p>
          </div>
          <span className={`badge-status border shrink-0 ${
            job.status === "open" ? "bg-success/10 text-success border-success/20" :
            job.status === "in-progress" ? "bg-warning/10 text-warning border-warning/20" :
            "bg-muted text-muted-foreground border-border"
          }`}>
            {job.status === "open" ? "متاحة" : job.status === "in-progress" ? "قيد التنفيذ" : "مكتملة"}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {job.hours} ساعات</span>
          <span className="font-semibold text-foreground">{job.price} جنيه</span>
        </div>

        {/* أزرار الإجراءات حسب حالة الوظيفة */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
          {job.status === "open" && (
            <>
              <Button size="sm" variant="accent" asChild>
                <Link to={`/jobs/${job.id}/applicants`}>
                  <Users className="h-4 w-4 mr-1" />
                  المتقدمين ({job.applicantsCount})
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to={`/jobs/${job.id}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  التفاصيل
                </Link>
              </Button>
            </>
          )}
          {job.status === "in-progress" && (
            <>
              <Button size="sm" variant="accent" asChild>
                <Link to={`/jobs/${job.id}/active`}>
                  <QrCode className="h-4 w-4 mr-1" />
                  QR Code والحضور
                </Link>
              </Button>
              <Button size="sm" variant="default" asChild>
                <Link to={`/jobs/${job.id}/assignments`}>
                  <CalendarCheck className="h-4 w-4 mr-1" />
                  إدارة الحضور
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to={`/jobs/${job.id}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  التفاصيل
                </Link>
              </Button>
            </>
          )}
          {job.status === "completed" && (
            <Button size="sm" variant="outline" asChild>
              <Link to={`/jobs/${job.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                عرض التفاصيل
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyJobs() {
  const { data: jobs, isLoading, isError } = useMyJobs();

  const filteredByTab = useMemo(() => {
    if (!jobs) return {} as Record<JobStatus | "all", Job[]>;
    const result: Record<JobStatus | "all", Job[]> = {
      all: jobs,
      open: [],
      "in-progress": [],
      completed: [],
      cancelled: [],
    };
    for (const job of jobs) {
      if (result[job.status]) result[job.status].push(job);
    }
    return result;
  }, [jobs]);

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-extrabold text-3xl">وظائفي</h1>
            <p className="text-muted-foreground">إدارة كل الوظائف اللي نشرتها — من النشر للحضور والانصراف</p>
          </div>
          <Button variant="accent" asChild>
            <Link to="/jobs/new"><Plus className="h-4 w-4" /> انشر وظيفة</Link>
          </Button>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            {tabs.map((t) => <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>)}
          </TabsList>

          {isError ? (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>خطأ في تحميل الوظائف</AlertTitle>
              <AlertDescription>حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.</AlertDescription>
            </Alert>
          ) : tabs.map((t) => (
            <TabsContent key={t.key} value={t.key} className="mt-6">
              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
                </div>
              ) : (filteredByTab[t.key]?.length ?? 0) > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredByTab[t.key]!.map((j) => <EmployerJobCard key={j.id} job={j} />)}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  {t.key === "all" ? (
                    <div>
                      <p className="mb-4">لا توجد وظائف بعد. انشر أول وظيفة الآن!</p>
                      <Button variant="accent" asChild>
                        <Link to="/jobs/new"><Plus className="h-4 w-4" /> انشر وظيفة</Link>
                      </Button>
                    </div>
                  ) : (
                    "لا توجد وظائف في هذه الفئة."
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </UserLayout>
  );
}