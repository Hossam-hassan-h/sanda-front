import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, QrCode, CheckCircle, XCircle, Hourglass } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { useJobs, useMyApplications } from "@/hooks/useJobs";
import { useMyAssignments } from "@/hooks/useJobAssignments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import RatingForm from "@/components/RatingForm";
import ReportForm from "@/components/ReportForm";
import type { JobAssignment, Application } from "@/api/types";
import { Pagination } from "@/components/admin/Pagination";

const applicationBadge: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock; label: string }> = {
  pending: { variant: "secondary", icon: Hourglass, label: "قيد المراجعة" },
  accepted: { variant: "default", icon: CheckCircle, label: "تم القبول" },
  rejected: { variant: "destructive", icon: XCircle, label: "مرفوض" },
};

export default function WorkerJobs() {
  const { user } = useAuth();
  const { data: allJobs, isLoading: jobsLoading } = useJobs({});
  const { data: applications, isLoading: appsLoading } = useMyApplications();
  const { data: assignments, isLoading: assignmentsLoading } = useMyAssignments();
  const [activeTab, setActiveTab] = useState<string>("active");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const isLoading = jobsLoading || appsLoading || assignmentsLoading;

  const appliedJobs = useMemo(() => {
    if (!applications) return [];
    return applications
      .map((app) => ({
        job: app.job ?? allJobs?.find((j) => j.id === app.jobId),
        application: app,
      }))
      .filter((item): item is { job: NonNullable<typeof item.job>; application: Application } => !!item.job);
  }, [applications, allJobs]);

  const pendingJobs = appliedJobs.filter(({ application }) => application.status === "pending");
  const acceptedJobs = appliedJobs.filter(({ application }) => application.status === "accepted");
  const rejectedJobs = appliedJobs.filter(({ application }) => application.status === "rejected");

  const activeJobs = acceptedJobs;

  const completedJobs = useMemo(() => {
    if (!assignments || !acceptedJobs.length) return [];
    return acceptedJobs.filter(({ job }) => {
      const assignment = assignments.find((a) => a.jobId === job.id && a.workerId === user?.id);
      return assignment?.status === "checked-out" || assignment?.status === "completed";
    });
  }, [assignments, acceptedJobs, user]);

  const paginatedActiveJobs = useMemo(() => {
    return activeJobs.slice((page - 1) * pageSize, page * pageSize);
  }, [activeJobs, page, pageSize]);

  const paginatedCompletedJobs = useMemo(() => {
    return completedJobs.slice((page - 1) * pageSize, page * pageSize);
  }, [completedJobs, page, pageSize]);

  const paginatedPendingJobs = useMemo(() => {
    return pendingJobs.slice((page - 1) * pageSize, page * pageSize);
  }, [pendingJobs, page, pageSize]);

  const paginatedRejectedJobs = useMemo(() => {
    return rejectedJobs.slice((page - 1) * pageSize, page * pageSize);
  }, [rejectedJobs, page, pageSize]);

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
          <h1 className="font-heading font-extrabold text-3xl">وظائفي</h1>
          <p className="text-muted-foreground">الوظائف اللي تقدمت ليها وتابع حالتها</p>
        </div>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val)}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="active">قيد التنفيذ ({activeJobs.length})</TabsTrigger>
            <TabsTrigger value="completed">مكتملة ({completedJobs.length})</TabsTrigger>
            <TabsTrigger value="pending">قيد المراجعة ({pendingJobs.length})</TabsTrigger>
            <TabsTrigger value="rejected">مرفوضة ({rejectedJobs.length})</TabsTrigger>
          </TabsList>

          {/* ── Active ── */}
          <TabsContent value="active">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
              </div>
            ) : activeJobs.length > 0 ? (
              <div className="space-y-4 mb-4">
                {paginatedActiveJobs.map(({ job }) => {
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
                          {job.hours ? <span>{job.hours} ساعات</span> : null}
                          <span>{job.price} جنيه</span>
                        </div>

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
                            <Link to={`/jobs/${job.id}`}>التفاصيل</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {activeJobs.length > 0 && (
                <Pagination
                  currentPage={page}
                  totalPages={Math.max(1, Math.ceil(activeJobs.length / pageSize))}
                  totalItems={activeJobs.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              )}
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-heading font-bold text-lg text-muted-foreground mb-2">لا توجد وظائف نشطة</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  لما يتم قبولك في وظيفة، هتظهر هنا تقدر تسجل حضورك وانصرافك
                </p>
                <Button asChild>
                  <Link to="/jobs">تصفح الوظائف المتاحة</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── Completed ── */}
          <TabsContent value="completed">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
              </div>
            ) : completedJobs.length > 0 ? (
              <div className="space-y-4 mb-4">
                {paginatedCompletedJobs.map(({ job }) => {
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
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            مكتملة
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span>{job.hours} ساعات</span>
                          <span>{job.price} جنيه</span>
                        </div>

                        {assignment?.checkInTime && assignment?.checkOutTime && (
                          <div className="bg-muted/50 rounded-lg p-3 mb-4 text-xs text-muted-foreground">
                            <span>الحضور: {new Date(assignment.checkInTime).toLocaleTimeString("ar-EG")}</span>
                            <span className="mx-2">|</span>
                            <span>الانصراف: {new Date(assignment.checkOutTime).toLocaleTimeString("ar-EG")}</span>
                          </div>
                        )}

                        <div className="space-y-2">
                          {job.employer && (
                            <RatingForm
                              reviewedUserId={job.employer.id ?? job.employerId}
                              reviewedUserName={job.employer.name}
                              jobId={job.id}
                            />
                          )}
                          {job.employer && (
                            <ReportForm
                              reportedUserId={job.employer.id ?? job.employerId}
                              reportedUserName={job.employer.name}
                              jobId={job.id}
                            />
                          )}
                          <div className="flex gap-2 pt-1">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/jobs/${job.id}`}>التفاصيل</Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {completedJobs.length > 0 && (
                <Pagination
                  currentPage={page}
                  totalPages={Math.max(1, Math.ceil(completedJobs.length / pageSize))}
                  totalItems={completedJobs.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              )}
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-heading font-bold text-lg text-muted-foreground mb-2">لا توجد وظائف مكتملة</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  الوظائف اللي خلصتها هتظهر هنا عشان تقيم وتكتب رأيك
                </p>
                <Button asChild>
                  <Link to="/jobs">تصفح الوظائف المتاحة</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── Pending Applications ── */}
          <TabsContent value="pending">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : pendingJobs.length > 0 ? (
              <div className="space-y-4 mb-4">
                {paginatedPendingJobs.map(({ job, application }) => {
                  const cfg = applicationBadge[application.status];
                  const Icon = cfg.icon;
                  return (
                    <Card key={`${job.id}-${application.id}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-heading font-bold text-lg">{job.title}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3.5 w-3.5" /> {job.city}
                            </p>
                          </div>
                          <Badge variant={cfg.variant}>
                            <Icon className="h-3 w-3 mr-1" />
                            {cfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                          {job.hours ? <span>{job.hours} ساعات</span> : null}
                          <span>{job.price} جنيه</span>
                          <span>{new Date(application.createdAt).toLocaleDateString("ar-EG")}</span>
                        </div>
                        <div className="mt-3">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/jobs/${job.id}`}>عرض التفاصيل</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {pendingJobs.length > 0 && (
                <Pagination
                  currentPage={page}
                  totalPages={Math.max(1, Math.ceil(pendingJobs.length / pageSize))}
                  totalItems={pendingJobs.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              )}
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <Hourglass className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>لا توجد طلبات قيد المراجعة</p>
              </div>
            )}
          </TabsContent>

          {/* ── Rejected ── */}
          <TabsContent value="rejected">
            {rejectedJobs.length > 0 ? (
              <div className="space-y-4 mb-4">
                {paginatedRejectedJobs.map(({ job, application }) => {
                  const cfg = applicationBadge[application.status];
                  const Icon = cfg.icon;
                  return (
                    <Card key={`${job.id}-${application.id}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-heading font-bold text-lg">{job.title}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3.5 w-3.5" /> {job.city}
                            </p>
                          </div>
                          <Badge variant={cfg.variant}>
                            <Icon className="h-3 w-3 mr-1" />
                            {cfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                          <span>{job.hours} ساعات</span>
                          <span>{job.price} جنيه</span>
                        </div>
                        <div className="mt-3">
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/jobs">البحث عن وظائف أخرى</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {rejectedJobs.length > 0 && (
                <Pagination
                  currentPage={page}
                  totalPages={Math.max(1, Math.ceil(rejectedJobs.length / pageSize))}
                  totalItems={rejectedJobs.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              )}
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-30" />
                <p>لا توجد طلبات مرفوضة</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
}