import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  CheckCircle,
  XCircle,
  Flag,
  User,
  Briefcase,
  CalendarDays,
} from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import {
  useReportQuery,
  useUpdateReportStatus,
  useDeleteReport,
} from "@/hooks/useAdminQueries";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ErrorState } from "@/components/admin/ErrorState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const statusLabel: Record<string, string> = {
  open: "مفتوح",
  reviewed: "تمت المراجعة",
  closed: "مغلق",
};

const statusBadgeVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  open: "destructive",
  reviewed: "secondary",
  closed: "outline",
};

function ReportSkeleton() {
  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: report,
    isLoading,
    isError,
    refetch,
  } = useReportQuery(id!);

  const updateStatus = useUpdateReportStatus();
  const deleteReport = useDeleteReport();

  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleReview = async () => {
    if (!report) return;
    await updateStatus.mutateAsync({ id: report.id, status: "reviewed" });
  };

  const handleClose = async () => {
    if (!report) return;
    await updateStatus.mutateAsync({ id: report.id, status: "closed" });
  };

  const handleDelete = async () => {
    if (!report) return;
    await deleteReport.mutateAsync(report.id);
    navigate("/admin/reports");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <ReportSkeleton />
      </AdminLayout>
    );
  }

  if (isError || !report) {
    return (
      <AdminLayout>
        <ErrorState
          title="البلاغ غير موجود"
          message="لم نتمكن من العثور على هذا البلاغ. قد يكون قد حُذف."
          onRetry={() => refetch()}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/reports")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة إلى البلاغات
        </Button>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Details — 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Flag className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">تفاصيل البلاغ</CardTitle>
                </div>
                <Badge variant={statusBadgeVariant[report.status]}>
                  {statusLabel[report.status]}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mt-1">
                    معرف البلاغ: {report.id}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" />{" "}
                    {new Date(report.createdAt).toLocaleDateString("ar-EG")}
                  </span>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-1">سبب البلاغ</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {report.reason}
                  </p>
                </div>

                {/* Linked Job */}
                {report.job && (
                  <div>
                    <p className="text-sm font-medium mb-1">الوظيفة المرتبطة</p>
                    <div
                      className="bg-muted/50 rounded-lg p-4 cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => navigate(`/admin/jobs/${report.jobId}`)}
                    >
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm">
                          {report.job.title}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {report.job.city} — {report.job.price.toLocaleString()}{" "}
                        ج
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive text-lg">
                  منطقة الخطر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  حذف هذا البلاغ لا يمكن التراجع عنه. سيتم إزالة البلاغ بشكل
                  نهائي من المنصة.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف البلاغ
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Reporter & Reported User — 1/3 */}
          <div className="space-y-6">
            {/* Reporter */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">المُبلغ</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={report.reportedBy?.avatar} />
                    <AvatarFallback>
                      {report.reportedBy?.name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {report.reportedBy?.name ?? "غير معروف"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      المعرف: {report.reportedById}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reported User */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-destructive" />
                  <CardTitle className="text-lg">المُبلغ عنه</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={report.reportedUser?.avatar} />
                    <AvatarFallback>
                      {report.reportedUser?.name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {report.reportedUser?.name ?? "غير معروف"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      المعرف: {report.reportedUserId}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {report.status === "open" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={handleReview}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle className="w-4 h-4" />
                      تعيين كتمت المراجعة
                    </Button>
                  )}
                  {report.status !== "closed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={handleClose}
                      disabled={updateStatus.isPending}
                    >
                      <XCircle className="w-4 h-4" />
                      إغلاق البلاغ
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirm: Delete Report */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          if (!o) setDeleteOpen(false);
        }}
        title="حذف البلاغ"
        description="هل أنت متأكد من حذف هذا البلاغ؟ هذا الإجراء لا يمكن التراجع عنه."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        loading={deleteReport.isPending}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
}
