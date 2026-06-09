import { useParams, useNavigate } from "react-router-dom";
import { useJob } from "@/hooks/useJobs";
import UserLayout from "@/layouts/UserLayout";
import RatingForm from "@/components/RatingForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function RateWorker() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading } = useJob(id || "");

  if (isLoading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </UserLayout>
    );
  }

  if (!job) {
    return (
      <UserLayout>
        <div className="container mx-auto py-8 text-center">
          <p className="text-muted-foreground">الوظيفة غير موجودة</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>
            العودة
          </Button>
        </div>
      </UserLayout>
    );
  }

  // Fallback worker name if not resolved in mock/api
  const workerId = job.workerId || "u1";
  const workerName = job.worker?.name || "أحمد المصري";

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* Back navigation */}
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تقييم الأداء</h1>
            <p className="text-sm text-muted-foreground">{job.title}</p>
          </div>
        </div>

        <Card className="mb-6 bg-muted/20 border-dashed">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">أنت تقيم الآن:</p>
              <h3 className="font-bold text-foreground">{workerName}</h3>
              <p className="text-[10px] text-muted-foreground">معرف العامل: {workerId}</p>
            </div>
          </CardContent>
        </Card>

        <RatingForm
          reviewedUserId={workerId}
          reviewedUserName={workerName}
          jobId={job.id}
          onSuccess={() => navigate(`/jobs/${job.id}`)}
        />
      </div>
    </UserLayout>
  );
}
