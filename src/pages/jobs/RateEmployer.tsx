import { useParams, useNavigate } from "react-router-dom";
import { useJob } from "@/hooks/useJobs";
import UserLayout from "@/layouts/UserLayout";
import RatingForm from "@/components/RatingForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Building } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function RateEmployer() {
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

  const employerId = job.employerId || "u2";
  const employerName = job.employer?.name || "سارة عبدالله";

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* Back navigation */}
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تقييم صاحب العمل</h1>
            <p className="text-sm text-muted-foreground">{job.title}</p>
          </div>
        </div>

        <Card className="mb-6 bg-muted/20 border-dashed">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Building className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">أنت تقيم الآن صاحب العمل:</p>
              <h3 className="font-bold text-foreground">{employerName}</h3>
              <p className="text-[10px] text-muted-foreground">معرف صاحب العمل: {employerId}</p>
            </div>
          </CardContent>
        </Card>

        <RatingForm
          reviewedUserId={employerId}
          reviewedUserName={employerName}
          jobId={job.id}
          onSuccess={() => navigate(`/jobs/${job.id}`)}
        />
      </div>
    </UserLayout>
  );
}
