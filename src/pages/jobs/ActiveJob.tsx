import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Clock, CheckCircle, XCircle, User } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useJob } from "@/hooks/useJobs";
import { useAuth } from "@/context/AuthContext";
import QRGenerator from "@/components/QRGenerator";
import QRScanner from "@/components/QRScanner";
import { useJobAssignments } from "@/hooks/useJobAssignments";
import { cn } from "@/lib/utils";

const statusConfig = {
  "checked-in": { label: "حاضر", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <Clock className="w-3.5 h-3.5" /> },
  "checked-out": { label: "منتهي", color: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  "no-show": { label: "لم يحضر", color: "bg-red-100 text-red-700 border-red-200", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function ActiveJob() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading } = useJob(id!);
  const { user } = useAuth();
  
  // حالة للتحكم في ظهور الكاميرا للعامل
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // جلب سجل الحضور لهذه الوظيفة
  const { data: assignments, isLoading: assignmentsLoading } = useJobAssignments(id || "");

  const isEmployer = user?.role === "employer";
  const isWorker = user?.role === "worker";
  const workerAssignment = useMemo(() => {
    if (!assignments || !user) return undefined;
    return assignments.find((a) => a.workerId === user.id);
  }, [assignments, user]);

  const backUrl = isEmployer ? "/my-jobs" : "/my-jobs-active";

  if (isLoading) {
    return (
      <UserLayout>
        <div className="container py-20 px-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </UserLayout>
    );
  }

  if (!job) {
    return (
      <UserLayout>
        <div className="container py-20 px-4 text-center text-muted-foreground">
          الوظيفة غير موجودة
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(backUrl)}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة
        </Button>
        <Badge className="bg-warning/10 text-warning border-warning/20 mb-3">قيد التنفيذ</Badge>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-2">{job.title}</h1>
        <p className="text-muted-foreground mb-8">
          {isEmployer 
            ? "اعرض QR Code للعامل ليسجل الحضور والانصراف" 
            : "امسح QR Code الخاص بصاحب العمل لتسجيل حضورك"}
        </p>

        {/* لوحة QR — تختلف حسب نوع المستخدم */}
        {isEmployer ? (
          <QRGenerator
            jobId={job.id}
            jobTitle={job.title}
            jobStatus={job.status}
          />
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
            {workerAssignment?.status === "checked-in" || workerAssignment?.status === "checked-out" ? (
              // حالة بعد تسجيل الحضور — يعرض التايم والانصراف
              <div className="space-y-6">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="font-heading font-bold text-xl">
                  {workerAssignment.status === "checked-out" ? "تم تسجيل الانصراف" : "تم تسجيل الحضور"}
                </h2>
                <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
                  {workerAssignment.checkInTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">تسجيل الحضور</span>
                      <span dir="ltr" className="font-medium">
                        {new Date(workerAssignment.checkInTime).toLocaleTimeString("ar-EG")}
                      </span>
                    </div>
                  )}
                  {workerAssignment.checkOutTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">تسجيل الانصراف</span>
                      <span dir="ltr" className="font-medium">
                        {new Date(workerAssignment.checkOutTime).toLocaleTimeString("ar-EG")}
                      </span>
                    </div>
                  )}
                </div>
                {workerAssignment.status === "checked-in" && (
                  <p className="text-sm text-muted-foreground">
                    لا تنسَ تسجيل الانصراف بعد انتهاء العمل
                  </p>
                )}
              </div>
            ) : isScannerOpen ? (
              // فتح الكاميرا للمسح
              <div className="space-y-4">
                <QRScanner jobId={job.id} />
                <Button variant="ghost" onClick={() => setIsScannerOpen(false)}>
                  إلغاء
                </Button>
              </div>
            ) : (
              // العرض الافتراضي — زر فتح الكاميرا
              <>
                <div className="mx-auto w-32 h-32 rounded-full bg-primary-soft flex items-center justify-center mb-6">
                  <Camera className="h-16 w-16 text-primary" />
                </div>
                <h2 className="font-heading font-bold text-xl mb-2">مسح كود الحضور</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  اضغط الزر لفتح الكاميرا ومسح QR Code الخاص بصاحب العمل
                </p>
                <Button variant="accent" size="lg" onClick={() => setIsScannerOpen(true)}>
                  <Camera className="h-5 w-5 ml-2" /> فتح الكاميرا
                </Button>
              </>
            )}
          </div>
        )}

        {/* سجل الحضور — الكل يشوفه */}
        <div className="mt-6">
          <h3 className="font-heading font-bold mb-3 text-lg">سجل الحضور</h3>
          {assignmentsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 rounded-lg" />
            </div>
          ) : assignments && assignments.length > 0 ? (
            <div className="space-y-2">
              {assignments.map((assignment) => {
                const config = statusConfig[assignment.status] || statusConfig["checked-in"];
                return (
                  <Card key={assignment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", config.color)}>
                            {config.icon}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{assignment.worker?.name || "عامل"}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {assignment.checkInTime && (
                                <span>حضور: {new Date(assignment.checkInTime).toLocaleTimeString("ar-EG")}</span>
                              )}
                              {assignment.checkOutTime && (
                                <>
                                  <span>|</span>
                                  <span>انصراف: {new Date(assignment.checkOutTime).toLocaleTimeString("ar-EG")}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge className={cn(config.color, "border text-xs")}>
                          {config.icon}
                          <span className="mr-1">{config.label}</span>
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-card border border-border rounded-xl">
              <User className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">لا توجد سجلات حضور حتى الآن</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2 justify-center">
          <Button variant="outline" asChild>
            <Link to="/chat">انتقل للمحادثة</Link>
          </Button>
          {isEmployer && (
            <Button variant="outline" asChild>
              <Link to={`/jobs/${job.id}/assignments`}>إدارة الحضور</Link>
            </Button>
          )}
          {isWorker && (
            <Button variant="outline" asChild>
              <Link to="/my-jobs-active">كل وظائفي</Link>
            </Button>
          )}
        </div>
      </div>
    </UserLayout>
  );
}