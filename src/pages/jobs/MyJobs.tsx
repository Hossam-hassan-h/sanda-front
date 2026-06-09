import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { useMyJobs } from "@/hooks/useJobs";
import JobCard from "@/components/jobs/JobCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { JobStatus } from "@/api/types";

const tabs: { key: JobStatus | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "open", label: "متاحة" },
  { key: "in-progress", label: "قيد التنفيذ" },
  { key: "completed", label: "مكتملة" },
];

export default function MyJobs() {
  const { data: jobs, isLoading } = useMyJobs();

  const filteredByTab = useMemo(() => {
    if (!jobs) return {} as Record<string, typeof jobs>;
    const result: Record<string, typeof jobs> = {};
    for (const t of tabs) {
      result[t.key] = jobs.filter((j) => t.key === "all" || j.status === t.key);
    }
    return result;
  }, [jobs]);

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-extrabold text-3xl">وظائفي</h1>
            <p className="text-muted-foreground">إدارة كل الوظائف اللي نشرتها</p>
          </div>
          <Button variant="accent" asChild>
            <Link to="/jobs/new"><Plus className="h-4 w-4" /> انشر وظيفة</Link>
          </Button>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            {tabs.map((t) => <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>)}
          </TabsList>

          {tabs.map((t) => (
            <TabsContent key={t.key} value={t.key} className="mt-6">
              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
                </div>
              ) : (filteredByTab[t.key]?.length ?? 0) > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredByTab[t.key]!.map((j) => <JobCard key={j.id} job={j} />)}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">لا توجد وظائف في هذه الفئة.</div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </UserLayout>
  );
}
