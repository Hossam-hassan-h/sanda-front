import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  ArrowLeft,
  QrCode,
} from "lucide-react";

import { useJob } from "@/hooks/useJobs";
import {
  useJobAssignments,
  useCheckOut,
  useMarkNoShow,
  useRefundAssignment,
} from "@/hooks/useJobAssignments";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import QRGenerator from "@/components/QRGenerator";
import { cn } from "@/lib/utils";

/**
 * 🔥 Backend → UI mapping (ONLY FOR DISPLAY)
 */
const getUiStatus = (a: any) => {
  if (a.attendance?.no_show) return "no-show";

  switch (a.status) {
    case "assigned":
      return "assigned";
    case "in_progress":
      return "checked-in";
    case "completed":
      return "checked-out";
    case "cancelled":
      return "no-show";
    default:
      return "assigned";
  }
};

const statusConfig = {
  assigned: {
    label: "تم التعيين",
    color: "bg-slate-100 text-slate-700",
    icon: <Clock className="w-4 h-4" />,
  },
  "checked-in": {
    label: "حاضر",
    color: "bg-blue-100 text-blue-700",
    icon: <Clock className="w-4 h-4" />,
  },
  "checked-out": {
    label: "منتهي",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  "no-show": {
    label: "لم يحضر",
    color: "bg-red-100 text-red-700",
    icon: <XCircle className="w-4 h-4" />,
  },
};

function AssignmentCard({ assignment }: { assignment: any }) {
  const checkOut = useCheckOut();
  const markNoShow = useMarkNoShow();
  const refundAssignment = useRefundAssignment();

  const uiStatus = getUiStatus(assignment);

  const config =
    statusConfig[uiStatus] ?? {
      label: "غير معروف",
      color: "bg-gray-100 text-gray-700",
      icon: <AlertTriangle className="w-4 h-4" />,
    };

  const handleCheckOut = async () => {
    try {
      await checkOut.mutateAsync(assignment._id);
      toast({ title: "تم تسجيل الانصراف" });
    } catch {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  const handleNoShow = async () => {
    try {
      await markNoShow.mutateAsync(assignment._id);
      toast({ title: "تم تسجيل الغياب" });
    } catch {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  const handleRefund = async () => {
    try {
      await refundAssignment.mutateAsync(assignment._id);
      toast({ title: "تم استرجاع المبلغ" });
    } catch {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  const refundWindowActive =
    assignment.marketplace_status === "REFUND_WINDOW_ACTIVE";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5" />
            <div>
              <div className="font-medium">{assignment.worker?.name}</div>
              <div className="text-xs text-muted-foreground">
                ID: {assignment.worker?._id}
              </div>
            </div>
          </div>

          <Badge className={cn(config.color)}>
            {config.icon}
            <span className="mr-1">{config.label}</span>
          </Badge>
        </div>

        {/* ATTENDANCE */}
        <div className="mt-3 text-sm space-y-1">
          {assignment.attendance?.checked_in_at && (
            <div>
              ⏱ دخول:{" "}
              {new Date(
                assignment.attendance.checked_in_at
              ).toLocaleTimeString("ar-EG")}
            </div>
          )}

          {assignment.attendance?.checked_out_at && (
            <div>
              ✔ خروج:{" "}
              {new Date(
                assignment.attendance.checked_out_at
              ).toLocaleTimeString("ar-EG")}
            </div>
          )}
        </div>

        {/* ACTIONS */}
        {(uiStatus === "checked-in" || refundWindowActive) && (
          <div className="flex gap-2 mt-3">
            {uiStatus === "checked-in" && (
              <>
                <Button size="sm" onClick={handleCheckOut}>
                  خروج
                </Button>
                <Button size="sm" variant="outline" onClick={handleNoShow}>
                  غياب
                </Button>
              </>
            )}

            {refundWindowActive && (
              <Button size="sm" variant="destructive" onClick={handleRefund}>
                Refund
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function JobAssignmentsPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: job } = useJob(jobId || "");
  const { data: assignments = [] } = useJobAssignments(jobId || "");

  const [qrAssignmentId, setQrAssignmentId] = useState<string | null>(null);

  const normalized = useMemo(() => {
    return assignments.map((a: any) => ({
      ...a,
      uiStatus: getUiStatus(a),
    }));
  }, [assignments]);

  const checkedIn = normalized.filter(
    (a) => a.uiStatus === "checked-in"
  );

  const checkedOut = normalized.filter(
    (a) => a.uiStatus === "checked-out"
  );

  const noShow = normalized.filter((a) => a.uiStatus === "no-show");

  const assignedWorkers = normalized.filter(
    (a) => a.uiStatus === "assigned" || a.uiStatus === "checked-in"
  );

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex gap-2 mb-4">
        <ArrowLeft onClick={() => window.history.back()} />
        <h1>{job?.title}</h1>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card><CardContent>حاضر {checkedIn.length}</CardContent></Card>
        <Card><CardContent>منتهي {checkedOut.length}</CardContent></Card>
        <Card><CardContent>غياب {noShow.length}</CardContent></Card>
      </div>

      {/* LIST */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="checked-in">حاضر</TabsTrigger>
          <TabsTrigger value="checked-out">منتهي</TabsTrigger>
          <TabsTrigger value="no-show">غياب</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {normalized.map((a) => (
            <AssignmentCard key={a._id} assignment={a} />
          ))}
        </TabsContent>
      </Tabs>

      {/* QR */}
      <div className="mt-6 flex gap-2">
        {assignedWorkers.map((a) => (
          <Button
            key={a._id}
            variant={qrAssignmentId === a._id ? "default" : "outline"}
            onClick={() => setQrAssignmentId(a._id)}
          >
            <QrCode className="w-4 h-4 mr-1" />
            {a.worker?.name}
          </Button>
        ))}
      </div>

      {qrAssignmentId && (
        <QRGenerator
          assignmentId={qrAssignmentId}
          assignmentStatus={
            normalized.find((a) => a._id === qrAssignmentId)?.status
          }
          workerName={
            normalized.find((a) => a._id === qrAssignmentId)?.worker?.name
          }
        />
      )}
    </div>
  );
}
