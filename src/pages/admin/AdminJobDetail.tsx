import { useState, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  CircleDollarSign,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  Star,
  Wallet,
  Trash2,
  Pencil,
} from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { useJobQuery, useDeleteJob, useUpdateJob, useUserQuery } from "@/hooks/useAdminQueries";
import { getApiErrorMessage } from "@/lib/password-reset";
import type { Job } from "@/api/types";
import JobEditModal from "@/components/admin/JobEditModal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ErrorState } from "@/components/admin/ErrorState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

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

function UserInfoCard({
  user,
  title,
  icon,
  onViewProfile,
}: {
  user: import("@/api/types").User | undefined;
  title: string;
  icon: ReactNode;
  onViewProfile?: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onViewProfile}
        >
          <Avatar className="w-12 h-12">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{user?.name?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user?.name ?? "غير معروف"}</p>
            {user?.role && (
              <Badge variant="outline" className="mt-1">
                {roleLabel[user.role] ?? user.role}
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">الهاتف</span>
            <span dir="ltr" className="font-medium">{user?.phone ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">البريد</span>
            <span className="font-medium text-left">{user?.email ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">المدينة</span>
            <span className="font-medium">{user?.city ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الرصيد</span>
            <span className="font-medium">{user?.walletBalance ?? 0} جنيه</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">تاريخ التسجيل</span>
            <span className="font-medium">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("ar-EG")
                : "—"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">الحالة</span>
            {user?.isActive === false ? (
              <Badge variant="destructive">محظور</Badge>
            ) : user?.isVerified ? (
              <Badge variant="default" className="gap-1"><ShieldCheck className="w-3 h-3" /> موثق</Badge>
            ) : (
              <Badge variant="secondary" className="gap-1"><ShieldAlert className="w-3 h-3" /> غير موثق</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminJobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading, isError, refetch } = useJobQuery(id!);

  const employerId = job?.employerId;
  const workerId = job?.workerId;
  const { data: publisher } = useUserQuery(employerId ?? null);
  const { data: worker } = useUserQuery(workerId ?? null);

  const deleteJob = useDeleteJob();
  const updateJob = useUpdateJob();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteJob.mutateAsync(id!);
      toast({ title: "تم الحذف", description: "تم حذف الوظيفة بنجاح" });
      setDeleteOpen(false);
      navigate("/admin/jobs");
    } catch (err) {
      toast({
        title: "خطأ في الحذف",
        description: getApiErrorMessage(err, "حاول مرة أخرى"),
        variant: "destructive",
      });
    }
  };

  const handleEditSave = async (formData: Partial<Job>) => {
    if (!id) return;
    try {
      await updateJob.mutateAsync({ id, payload: formData });
      toast({ title: "تم الحفظ", description: "تم تحديث بيانات الوظيفة بنجاح" });
      setEditOpen(false);
    } catch (err) {
      toast({
        title: "خطأ في الحفظ",
        description: getApiErrorMessage(err, "حاول مرة أخرى"),
        variant: "destructive",
      });
    }
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
          message="لم نتمكن من العثور على هذه الوظيفة."
          onRetry={() => refetch()}
        />
      </AdminLayout>
    );
  }

  const canDelete = job.status === "open";

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back button + Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/jobs")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            العودة إلى الوظائف
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-2">
              <Pencil className="w-4 h-4" />
              تعديل
            </Button>
            {canDelete && (
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} className="gap-2">
                <Trash2 className="w-4 h-4" />
                حذف
              </Button>
            )}
          </div>
        </div>

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

                {job.status === "in-progress" && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">المبلغ المحجوز (Escrow)</p>
                      <div className="bg-primary-soft border border-primary/20 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">قيمة الوظيفة</span>
                          <span className="font-bold text-primary">{job.price} جنيه</span>
                        </div>
                        <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                          <span>عمولة المنصة (٥٪)</span>
                          <span>{Math.round(job.price * 0.05)} جنيه</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-primary/20">
                          <span className="text-sm font-medium">صافي العامل</span>
                          <span className="font-bold">{Math.round(job.price * 0.95)} جنيه</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <UserInfoCard
              user={publisher}
              title="صاحب العمل"
              icon={<UserIcon className="w-5 h-5 text-primary" />}
              onViewProfile={publisher ? () => navigate(`/admin/users/${publisher.id}`) : undefined}
            />

            {(worker || job.status === "in-progress") && (
              <UserInfoCard
                user={worker}
                title="العامل المنفذ"
                icon={<Star className="w-5 h-5 text-warning" />}
                onViewProfile={worker ? () => navigate(`/admin/users/${worker.id}`) : undefined}
              />
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">الماليات</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">قيمة الوظيفة</span>
                  <span className="font-bold">{job.price} جنيه</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">عدد الساعات</span>
                  <span>{job.hours} ساعة</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مدة العمل</span>
                  <span>{new Date(job.startDate).toLocaleDateString("ar-EG")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المتقدمين</span>
                  <span>{job.applicantsCount ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <JobEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        job={job}
        onSave={handleEditSave}
        isSaving={updateJob.isPending}
        showHours
        showStartDate
        showStatus
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(o) => { if (!o) setDeleteOpen(false); }}
        title="حذف الوظيفة"
        description={`هل أنت متأكد من حذف "${job.title}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        loading={deleteJob.isPending}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
}
