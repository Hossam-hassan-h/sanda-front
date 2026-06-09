import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Ban, UserX, Briefcase, MapPin, Clock, CircleDollarSign, CalendarDays, ShieldCheck, ShieldAlert } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { useJobQuery, useDeleteJob, useUserQuery, useBanUser, useUnbanUser, useDeleteUser } from "@/hooks/useAdminQueries";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ErrorState } from "@/components/admin/ErrorState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { Job, User } from "@/api/types";

const statusLabel: Record<string, string> = {
  open: "مفتوحة",
  "in-progress": "قيد التنفيذ",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

const statusBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "default",
  "in-progress": "secondary",
  completed: "outline",
  cancelled: "destructive",
};

const roleLabel: Record<string, string> = {
  employer: "صاحب عمل",
  worker: "عامل",
  admin: "مدير",
};

function JobSkeleton() {
  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminJobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading, isError, refetch } = useJobQuery(id!);

  const employerId = job?.employerId;
  const { data: publisher } = useUserQuery(employerId ?? null);

  const deleteJob = useDeleteJob();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const deleteUser = useDeleteUser();

  const [deleteJobOpen, setDeleteJobOpen] = useState(false);
  const [banUserOpen, setBanUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);

  const handleDeleteJob = async () => {
    await deleteJob.mutateAsync(id!);
    navigate("/admin/jobs");
  };

  const handleBanToggle = async () => {
    if (!publisher) return;
    if (publisher.isActive === false) {
      await unbanUser.mutateAsync(publisher.id);
    } else {
      await banUser.mutateAsync(publisher.id);
    }
    setBanUserOpen(false);
  };

  const handleDeleteUser = async () => {
    await deleteUser.mutateAsync(publisher!.id);
    setDeleteUserOpen(false);
    navigate("/admin/jobs");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <JobSkeleton />
      </AdminLayout>
    );
  }

  if (isError || !job) {
    return (
      <AdminLayout>
        <ErrorState
          title="الوظيفة غير موجودة"
          message="لم نتمكن من العثور على هذه الوظيفة. قد تكون قد حُذفت."
          onRetry={() => refetch()}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/jobs")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          العودة إلى الوظائف
        </Button>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job Details — 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">تفاصيل الوظيفة</CardTitle>
                </div>
                <Badge variant={statusBadgeVariant[job.status]}>{statusLabel[job.status]}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{job.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{job.id}</p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> {job.city}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CircleDollarSign className="w-4 h-4" /> {job.price} جنيه
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> {job.hours} ساعة
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" /> {new Date(job.createdAt).toLocaleDateString("ar-EG")}
                  </span>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-1">التصنيف</p>
                  <Badge variant="secondary">{job.category}</Badge>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">الوصف</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
                </div>

                {job.address && (
                  <div>
                    <p className="text-sm font-medium mb-1">العنوان</p>
                    <p className="text-sm text-muted-foreground">{job.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive text-lg">منطقة الخطر</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  حذف هذه الوظيفة لا يمكن التراجع عنه. سيتم إزالة الوظيفة بشكل نهائي من المنصة.
                </p>
                <Button variant="destructive" onClick={() => setDeleteJobOpen(true)} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  حذف الوظيفة
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Publisher Info — 1/3 */}
      <div className="space-y-6 px-4 sm:px-0">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <UserX className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">الناشر</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={publisher?.avatar} />
                    <AvatarFallback>{publisher?.name?.[0] ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{publisher?.name ?? "غير معروف"}</p>
                    <Badge variant="outline" className="mt-1">
                      {roleLabel[publisher?.role ?? ""] ?? publisher?.role}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الهاتف</span>
                    <span dir="ltr" className="font-medium">{publisher?.phone ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">البريد</span>
                    <span className="font-medium text-left">{publisher?.email ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المدينة</span>
                    <span className="font-medium">{publisher?.city ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الرصيد</span>
                    <span className="font-medium">{publisher?.walletBalance ?? 0} جنيه</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تاريخ التسجيل</span>
                    <span className="font-medium">
                      {publisher?.createdAt
                        ? new Date(publisher.createdAt).toLocaleDateString("ar-EG")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">الحالة</span>
                    {publisher?.isActive === false ? (
                      <Badge variant="destructive">محظور</Badge>
                    ) : publisher?.isVerified ? (
                      <Badge variant="default" className="gap-1"><ShieldCheck className="w-3 h-3" /> موثق</Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1"><ShieldAlert className="w-3 h-3" /> غير موثق</Badge>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button
                    variant={publisher?.isActive === false ? "outline" : "destructive"}
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setBanUserOpen(true)}
                    disabled={!publisher}
                  >
                    <Ban className="w-4 h-4" />
                    {publisher?.isActive === false ? "إلغاء الحظر" : "حظر المستخدم"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setDeleteUserOpen(true)}
                    disabled={!publisher}
                  >
                    <UserX className="w-4 h-4" />
                    حذف المستخدم
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirm: Delete Job */}
      <ConfirmDialog
        open={deleteJobOpen}
        onOpenChange={(o) => { if (!o) setDeleteJobOpen(false); }}
        title="حذف الوظيفة"
        description={`هل أنت متأكد من حذف "${job.title}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        loading={deleteJob.isPending}
        onConfirm={handleDeleteJob}
      />

      {/* Confirm: Ban/Unban Publisher */}
      <ConfirmDialog
        open={banUserOpen}
        onOpenChange={(o) => { if (!o) setBanUserOpen(false); }}
        title={publisher?.isActive === false ? "إلغاء حظر المستخدم" : "حظر المستخدم"}
        description={
          publisher?.isActive === false
            ? `هل أنت متأكد من إلغاء حظر "${publisher?.name}"؟`
            : `هل أنت متأكد من حظر "${publisher?.name}"؟ لن يتمكن من تسجيل الدخول أو استخدام المنصة.`
        }
        confirmText={publisher?.isActive === false ? "إلغاء الحظر" : "حظر"}
        cancelText="إلغاء"
        variant={publisher?.isActive === false ? "default" : "destructive"}
        loading={banUser.isPending || unbanUser.isPending}
        onConfirm={handleBanToggle}
      />

      {/* Confirm: Delete Publisher */}
      <ConfirmDialog
        open={deleteUserOpen}
        onOpenChange={(o) => { if (!o) setDeleteUserOpen(false); }}
        title="حذف المستخدم"
        description={`هل أنت متأكد من حذف "${publisher?.name}"؟ هذا الإجراء لا يمكن التراجع عنه وسيؤدي إلى حذف جميع بيانات المستخدم.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        loading={deleteUser.isPending}
        onConfirm={handleDeleteUser}
      />
    </AdminLayout>
  );
}
