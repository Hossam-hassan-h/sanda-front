import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, QrCode, CheckCircle } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { useJobs } from "@/hooks/useJobs";
import { useMyAssignments } from "@/hooks/useJobAssignments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import type { JobAssignment } from "@/api/types";

export default function WorkerJobs() {
  const { user } = useAuth();
  const { data: allJobs, isLoading: jobsLoading } = useJobs({});
  const { data: assignments, isLoading: assignmentsLoading } = useMyAssignments();

  const isLoading = jobsLoading || assignmentsLoading;

  // Get the worker's accepted jobs (jobs where the workerId matches the user)
  const acceptedJobs = useMemo(() => {
    if (!allJobs || !user) return [];
    const acceptedApplicationIds = assignments
      ?.filter((a) => a.workerId === user.id)
      .map((a) => a.jobId) || [];
    
    return allJobs.filter(
      (j) =>
        (j.workerId === user.id || acceptedApplicationIds.includes(j.id)) &&
        (j.status === "in-progress" || j.status === "completed")
    );
  }, [allJobs, user, assignments]);

  const activeJobs = acceptedJobs.filter((j) => j.status === "in-progress");
  const completedJobs = acceptedJobs.filter((j) => j.status === "completed");

  const getAssignmentForJob = (jobId: string): JobAssignment | undefined => {
    return assignments?.find((a) => a.jobId === jobId && a.workerId === user?.id);
  };

  if (user?.role !== "worker") {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">هذه الصفحة مخصصة للعمال فقط</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/jobs">تصفح الوظائف</Link>
          </Button>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-10">
        <div className="mb-6">
          <h1 className="font-heading font-extrabold text-3xl">وظائفي النشطة</h1>
          <p className="text-muted-foreground">الوظائف اللي تم قبولك فيها وتقدّر تتابعها</p>
        </div>

        <Tabs defaultValue="active">
          <TabsList className="mb-6">
            <TabsTrigger value="active">
              قيد التنفيذ ({activeJobs.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              مكتملة ({completedJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
              </div>
            ) : activeJobs.length > 0 ? (
              <div className="space-y-4">
                {activeJobs.map((job) => {
                  const assignment = getAssignmentForJob(job.id);
                  return (
                    <Card key={job.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-heading font-bold text-lg">{job.title}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3.5 w-3.5" /> {job.city}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                            <Clock className="h-3 w-3 mr-1" />
                            قيد التنفيذ
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span>{job.hours} ساعات</span>
                          <span>{job.price} جنيه</span>
                        </div>

                        {/* Assignment Status */}
                        {assignment && (
                          <div className="bg-muted/50 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              {assignment.status === "checked-in" ? (
                                <Badge className="bg-blue-100 text-blue-700">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  تم تسجيل الحضور
                                </Badge>
                              ) : assignment.status === "checked-out" ? (
                                <Badge className="bg-green-100 text-green-700">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  تم تسجيل الانصراف
                                </Badge>
                              ) : (
                                <Badge variant="outline">لم تسجل حضور بعد</Badge>
                              )}
                              {assignment.checkInTime && (
                                <span className="text-xs">
                                  الحضور: {new Date(assignment.checkInTime).toLocaleTimeString("ar-EG")}
                                </span>
                              )}
                              {assignment.checkOutTime && (
                                <span className="text-xs">
                                  الانصراف: {new Date(assignment.checkOutTime).toLocaleTimeString("ar-EG")}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button variant="accent" asChild>
                            <Link to={`/jobs/${job.id}/active`}>
                              <QrCode className="h-4 w-4 mr-1" />
                              {assignment?.status === "checked-in" ? "تسجيل الانصراف" : "تسجيل الحضور"}
                            </Link>
                          </Button>
                          <Button variant="outline" asChild>
                            <Link to={`/jobs/${job.id}`}>
                              التفاصيل
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-heading font-bold text-lg text-muted-foreground mb-2">
                  لا توجد وظائف نشطة
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  لما يتم قبولك في وظيفة، هتظهر هنا تقدر تسجل حضورك وانصرافك عن طريق QR Code
                </p>
                <Button asChild>
                  <Link to="/jobs">تصفح الوظائف المتاحة</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedJobs.length > 0 ? (
              <div className="space-y-4">
                {completedJobs.map((job) => {
                  const assignment = getAssignmentForJob(job.id);
                  return (
                    <Card key={job.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-heading font-bold text-lg">{job.title}</h3>
                            <p className="text-sm text-muted-foreground">{job.city}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700">
                            مكتملة
                          </Badge>
                        </div>
                        {assignment?.checkOutTime && (
                          <p className="text-sm text-muted-foreground">
                            تم الانصراف: {new Date(assignment.checkOutTime).toLocaleString("ar-EG")}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                لا توجد وظائف مكتملة بعد
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
}