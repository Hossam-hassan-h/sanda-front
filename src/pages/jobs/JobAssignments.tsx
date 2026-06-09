import { useState } from "react";
import { useParams } from "react-router-dom";
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle, User, ArrowLeft } from "lucide-react";
import { useJob } from "@/hooks/useJobs";
import {
  useJobAssignments,
  useCheckOut,
  useMarkNoShow,
} from "@/hooks/useJobAssignments";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import QRGenerator from "@/components/QRGenerator";
import { cn } from "@/lib/utils";
import type { JobAssignment } from "@/api/types";

const statusConfig = {
  "checked-in": { label: "حاضر", color: "bg-blue-100 text-blue-700", icon: <Clock className="w-4 h-4" /> },
  "checked-out": { label: "منتهي", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-4 h-4" /> },
  "no-show": { label: "لم يحضر", color: "bg-red-100 text-red-700", icon: <XCircle className="w-4 h-4" /> },
};

function AssignmentCard({ assignment }: { assignment: JobAssignment }) {
  const checkOut = useCheckOut();
  const markNoShow = useMarkNoShow();
  const config = statusConfig[assignment.status];

  const handleCheckOut = async () => {
    try {
      await checkOut.mutateAsync(assignment.id);
      toast({ title: "تم تسجيل الانصراف", description: "تم تحويل المبلغ إلى محفظة العامل" });
    } catch {
      toast({ title: "خطأ", description: "فشل في تسجيل الانصراف", variant: "destructive" });
    }
  };

  const handleNoShow = async () => {
    try {
      await markNoShow.mutateAsync(assignment.id);
      toast({ title: "تم التسجيل", description: "تم تسجيل العامل كـ 'لم يحضر'" });
    } catch {
      toast({ title: "خطأ", description: "فشل في التسجيل", variant: "destructive" });
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{assignment.worker?.name || "عامل"}</h3>
              <p className="text-xs text-muted-foreground">
                ID: {assignment.workerId}
              </p>
            </div>
          </div>
          <Badge className={cn(config.color)}>
            {config.icon}
            <span className="mr-1">{config.label}</span>
          </Badge>
        </div>

        {/* Times */}
        <div className="mt-3 space-y-1 text-sm">
          {assignment.checkInTime && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Check-in: {new Date(assignment.checkInTime).toLocaleTimeString("ar-EG")}</span>
            </div>
          )}
          {assignment.checkOutTime && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Check-out: {new Date(assignment.checkOutTime).toLocaleTimeString("ar-EG")}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {assignment.status === "checked-in" && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleCheckOut} disabled={checkOut.isPending}>
              <CheckCircle className="w-4 h-4 mr-1" />
              تسجيل الانصراف
            </Button>
            <Button size="sm" variant="outline" onClick={handleNoShow} disabled={markNoShow.isPending}>
              <AlertTriangle className="w-4 h-4 mr-1" />
              لم يحضر
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function JobAssignmentsPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("assignments");

  const { data: job } = useJob(jobId || "");
  const { data: assignments, isLoading } = useJobAssignments(jobId || "");

  if (!user || (user.role !== "employer" && user.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">غير مصرح بالوصول</p>
      </div>
    );
  }

  if (!jobId) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">إدارة الحضور</h1>
        <p className="text-muted-foreground">يرجى اختيار وظيفة لعرض تفاصيل الحضور</p>
      </div>
    );
  }

  const checkedIn = assignments?.filter((a) => a.status === "checked-in") || [];
  const checkedOut = assignments?.filter((a) => a.status === "checked-out") || [];
  const noShows = assignments?.filter((a) => a.status === "no-show") || [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">إدارة الحضور</h1>
          <p className="text-sm text-muted-foreground">{job?.title}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="assignments">سجل الحضور</TabsTrigger>
          <TabsTrigger value="qr">QR Code</TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{checkedIn.length}</p>
                <p className="text-xs text-muted-foreground">حاضر الآن</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{checkedOut.length}</p>
                <p className="text-xs text-muted-foreground">منتهي</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{noShows.length}</p>
                <p className="text-xs text-muted-foreground">لم يحضر</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter Tabs */}
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">الكل ({assignments?.length || 0})</TabsTrigger>
              <TabsTrigger value="checked-in">حاضر ({checkedIn.length})</TabsTrigger>
              <TabsTrigger value="checked-out">منتهي ({checkedOut.length})</TabsTrigger>
              <TabsTrigger value="no-show">لم يحضر ({noShows.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : assignments && assignments.length > 0 ? (
                assignments.map((a) => <AssignmentCard key={a.id} assignment={a} />)
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">لا توجد سجلات حضور</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="checked-in" className="mt-4 space-y-3">
              {checkedIn.length > 0 ? (
                checkedIn.map((a) => <AssignmentCard key={a.id} assignment={a} />)
              ) : (
                <p className="text-center text-muted-foreground py-8">لا يوجد حاضرين الآن</p>
              )}
            </TabsContent>

            <TabsContent value="checked-out" className="mt-4 space-y-3">
              {checkedOut.length > 0 ? (
                checkedOut.map((a) => <AssignmentCard key={a.id} assignment={a} />)
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد سجلات منتهية</p>
              )}
            </TabsContent>

            <TabsContent value="no-show" className="mt-4 space-y-3">
              {noShows.length > 0 ? (
                noShows.map((a) => <AssignmentCard key={a.id} assignment={a} />)
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد حالات غياب</p>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* QR Tab */}
        <TabsContent value="qr">
          <QRGenerator
            jobId={jobId}
            jobTitle={job?.title || ""}
            jobStatus={job?.status || ""}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
