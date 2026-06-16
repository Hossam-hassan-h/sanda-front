import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Star,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  Wallet,
  CalendarDays,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  FileText,
  ImageIcon,
  ExternalLink,
  Loader2,
  Clock,
  Pencil,
  Trash2,
} from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import {
  useUserQuery,
  useVerifyUser,
  useUnverifyUser,
  useUpdateUser,
  useDeleteUser,
  useSuspendWorker,
  useBlockWorker,
  useRestoreWorker,
} from "@/hooks/useAdminQueries";
import { useJobs } from "@/hooks/useJobs";
import { useQueryClient } from "@tanstack/react-query";
import { ErrorState } from "@/components/admin/ErrorState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import EditUserModal from "@/components/admin/EditUserModal";
import { toast } from "@/hooks/use-toast";
import type { User, VerificationDocument } from "@/api/types";

const roleLabel: Record<string, string> = {
  employer: "صاحب عمل",
  worker: "عامل",
  admin: "مدير",
};

const roleColor: Record<string, string> = {
  employer: "bg-blue-100 text-blue-700 border-blue-200",
  worker: "bg-green-100 text-green-700 border-green-200",
  admin: "bg-red-100 text-red-700 border-red-200",
};

const workerStateLabel: Record<string, string> = {
  AVAILABLE: "Available",
  ASSIGNED: "Assigned",
  ACTIVE_ON_JOB: "Active on job",
  COMPLETED: "Completed",
  SUSPENDED: "Suspended",
  BLOCKED: "Blocked",
};

function UserSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-24" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
        <div className="space-y-6">
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    </div>
  );
}

const DOC_LABELS: Record<string, string> = {
  national_id_front: "بطاقة الرقم القومي (أمام)",
  national_id_back: "بطاقة الرقم القومي (خلف)",
  personal_photo: "صورة شخصية",
};

function DocumentThumb({ doc, onPreview }: { doc: VerificationDocument; onPreview: () => void }) {
  return (
    <button
      type="button"
      onClick={onPreview}
      className="group block w-full text-right rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all overflow-hidden"
    >
      <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {doc.url.startsWith("data:image") ? (
          <img
            src={doc.url}
            alt={doc.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <FileText className="w-10 h-10 text-muted-foreground" />
        )}
      </div>
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <ImageIcon className="w-3 h-3 text-muted-foreground" />
          {DOC_LABELS[doc.type] ?? doc.name}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <ExternalLink className="w-3 h-3" />
          اضغط للتكبير
        </div>
      </div>
    </button>
  );
}

function DocumentPreviewDialog({
  doc,
  onClose,
}: {
  doc: VerificationDocument | null;
  onClose: () => void;
}) {
  if (!doc) return null;
  return (
    <Dialog open={!!doc} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{DOC_LABELS[doc.type] ?? doc.name}</DialogTitle>
        </DialogHeader>
        <div className="bg-muted rounded-lg overflow-hidden">
          {doc.url.startsWith("data:image") ? (
            <img src={doc.url} alt={doc.name} className="w-full h-auto" />
          ) : (
            <div className="p-12 flex flex-col items-center gap-2 text-muted-foreground">
              <FileText className="w-12 h-12" />
              <p className="text-sm">لا يمكن عرض هذا الملف</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError, refetch } = useUserQuery(id ?? null);
  const { data: allJobs } = useJobs({});

  const verifyUser = useVerifyUser();
  const unverifyUser = useUnverifyUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const suspendWorker = useSuspendWorker();
  const blockWorker = useBlockWorker();
  const restoreWorker = useRestoreWorker();

  const [previewDoc, setPreviewDoc] = useState<VerificationDocument | null>(null);
  const [reviewing, setReviewing] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleApprove = async () => {
    if (!user) return;
    setReviewing("approve");
    try {
      await verifyUser.mutateAsync(user.id);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "تم قبول التوثيق", description: `تم توثيق حساب ${user.name} بنجاح` });
    } catch {
      toast({ title: "حصل خطأ", description: "حاول مرة تانية", variant: "destructive" });
    } finally { setReviewing(null); }
  };

  const handleReject = async () => {
    if (!user) return;
    if (!rejectionReason.trim()) {
      toast({ title: "سبب الرفض مطلوب", description: "اكتب سبب الرفض للمتابعة", variant: "destructive" });
      return;
    }
    setReviewing("reject");
    try {
      await unverifyUser.mutateAsync(user.id);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "تم رفض التوثيق", description: `تم رفض طلب ${user.name}` });
      setRejectionReason("");
    } catch {
      toast({ title: "حصل خطأ", description: "حاول مرة تانية", variant: "destructive" });
    } finally { setReviewing(null); }
  };

  const openEdit = useCallback(() => {
    setEditOpen(true);
  }, []);

  const handleUpdate = useCallback(async (formData: { name: string; phone: string; email: string; role: User["role"]; city: string }) => {
    if (!id) return;
    try {
      await updateUser.mutateAsync({ id, payload: formData });
      toast({ title: "تم الحفظ", description: "تم تحديث بيانات المستخدم" });
      setEditOpen(false);
      refetch();
    } catch {
      toast({ title: "خطأ في الحفظ", variant: "destructive" });
    }
  }, [id, updateUser, refetch]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    try {
      await deleteUser.mutateAsync(id);
      toast({ title: "تم الحذف", description: "تم حذف المستخدم" });
      navigate("/admin/users");
    } catch {
      toast({ title: "خطأ في الحذف", variant: "destructive" });
    }
  }, [id, deleteUser, navigate]);

  const handleSuspendWorker = useCallback(async () => {
    if (!id) return;
    try {
      await suspendWorker.mutateAsync({
        id,
        payload: { reason: "Admin moderation" },
      });
      toast({ title: "Worker suspended", description: "Worker status was updated." });
      refetch();
    } catch {
      toast({ title: "Could not suspend worker", variant: "destructive" });
    }
  }, [id, suspendWorker, refetch]);

  const handleBlockWorker = useCallback(async () => {
    if (!id) return;
    try {
      await blockWorker.mutateAsync({
        id,
        payload: { reason: "Admin moderation" },
      });
      toast({ title: "Worker blocked", description: "Worker can no longer accept jobs." });
      refetch();
    } catch {
      toast({ title: "Could not block worker", variant: "destructive" });
    }
  }, [id, blockWorker, refetch]);

  const handleRestoreWorker = useCallback(async () => {
    if (!id) return;
    try {
      await restoreWorker.mutateAsync({
        id,
        payload: { reason: "Admin restored worker" },
      });
      toast({ title: "Worker restored", description: "Worker is available for assignments again." });
      refetch();
    } catch {
      toast({ title: "Could not restore worker", variant: "destructive" });
    }
  }, [id, restoreWorker, refetch]);

  // Get user's jobs
  const userJobs = allJobs?.filter((j) => j.employerId === user?.id || j.workerId === user?.id) || [];

  if (isLoading) {
    return (
      <AdminLayout>
        <UserSkeleton />
      </AdminLayout>
    );
  }

  if (isError || !user) {
    return (
      <AdminLayout>
        <ErrorState title="المستخدم غير موجود" message="لم نتمكن من العثور على هذا المستخدم." onRetry={() => refetch()} />
      </AdminLayout>
    );
  }

  const verificationStatus = user.verification_status ?? (user.isVerified ? "approved" : "none");
  const documents: VerificationDocument[] = [];
  if (user.nationalId?.front?.url) {
    documents.push({ id: "national_id_front", type: "national_id_front", name: "بطاقة الرقم القومي (أمام)", url: user.nationalId.front.url, size: 0, uploadedAt: user.createdAt });
  }
  if (user.nationalId?.back?.url) {
    documents.push({ id: "national_id_back", type: "national_id_back", name: "بطاقة الرقم القومي (خلف)", url: user.nationalId.back.url, size: 0, uploadedAt: user.createdAt });
  }
  if (user.verificationSelfie?.url) {
    documents.push({ id: "personal_photo", type: "personal_photo", name: "صورة شخصية (سيلفي)", url: user.verificationSelfie.url, size: 0, uploadedAt: user.createdAt });
  }
  const verificationRequest = verificationStatus !== "none" || documents.length > 0
    ? { status: verificationStatus, documents, submittedAt: user.createdAt }
    : undefined;
  const isPending = verificationStatus === "pending";
  const workerState = user.workerState ?? user.worker_state ?? "AVAILABLE";
  const attendanceRate = user.attendanceRate ?? user.attendance_rate ?? 0;
  const noShowCount = user.noShowCount ?? user.no_show_count ?? 0;
  const completedJobsCount = user.completedJobsCount ?? user.completed_jobs_count ?? 0;
  const cancellationCount = user.cancellationCount ?? user.cancellation_count ?? 0;
  const reportCount = user.reportCount ?? user.report_count ?? 0;
  const suspensionUntil = user.suspensionUntil ?? user.suspension_until;
  const adminReviewRequired = user.adminReviewRequired ?? user.admin_review_required;
  const isWorkerModerationPending =
    suspendWorker.isPending || blockWorker.isPending || restoreWorker.isPending;

  const statusBadge = user.isBlocked === true ? (
    <Badge variant="destructive">محظور</Badge>
  ) : user.isVerified ? (
    <Badge variant="default" className="bg-green-600/10 text-green-600 border-green-600/20 gap-1">
      <ShieldCheck className="w-3 h-3" /> موثق
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <ShieldAlert className="w-3 h-3" /> غير موثق
    </Badge>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back button + Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            العودة إلى المستخدمين
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openEdit} className="gap-2">
              <Pencil className="w-4 h-4" />
              تعديل
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} className="gap-2">
              <Trash2 className="w-4 h-4" />
              حذف
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main User Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                {/* User header */}
                <div className="flex items-start gap-4 mb-6">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-primary/10 text-xl font-bold">{user.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold">{user.name}</h2>
                      {statusBadge}
                      {isPending && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                          <Clock className="w-3 h-3" /> طلب توثيق قيد المراجعة
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{user.id}</p>
                    <Badge className={`mt-2 ${roleColor[user.role] || ""}`}>
                      {roleLabel[user.role] || user.role}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">الهاتف:</span>
                    <span dir="ltr">{user.phone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">البريد:</span>
                    <span className="truncate">{user.email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">المدينة:</span>
                    <span>{user.city || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">تاريخ التسجيل:</span>
                    <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("ar-EG") : "—"}</span>
                  </div>
                </div>

                {user.skills && user.skills.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm font-medium mb-2">المهارات</p>
                      <div className="flex flex-wrap gap-1.5">
                        {user.skills.map((s) => (
                          <Badge key={s} variant="outline">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {user.bio && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm font-medium mb-1">نبذة</p>
                      <p className="text-sm text-muted-foreground">{user.bio}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Verification Review */}
            {verificationRequest && (
              <Card className={isPending ? "border-amber-200" : "border-border"}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className={`w-5 h-5 ${isPending ? "text-amber-600" : "text-primary"}`} />
                      <CardTitle className="text-lg">طلب توثيق الحساب</CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        verificationRequest.status === "pending"
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : verificationRequest.status === "approved"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : verificationRequest.status === "rejected"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : ""
                      }
                    >
                      {verificationRequest.status === "pending" && "قيد المراجعة"}
                      {verificationRequest.status === "approved" && "مقبول"}
                      {verificationRequest.status === "rejected" && "مرفوض"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {verificationRequest.submittedAt && (
                    <p className="text-xs text-muted-foreground">
                      تم إرسال الطلب في {new Date(verificationRequest.submittedAt).toLocaleString("ar-EG")}
                    </p>
                  )}
                  {verificationRequest.documents.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">المستندات ({verificationRequest.documents.length})</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {verificationRequest.documents.map((doc) => (
                          <DocumentThumb key={doc.id} doc={doc} onPreview={() => setPreviewDoc(doc)} />
                        ))}
                      </div>
                    </div>
                  )}
                  {verificationRequest.status === "rejected" && verificationRequest.rejectionReason && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
                      <p className="font-medium text-destructive mb-1">سبب الرفض</p>
                      <p className="text-foreground">{verificationRequest.rejectionReason}</p>
                    </div>
                  )}
                  {isPending && (
                    <div className="border-t border-border pt-4 space-y-3">
                      <p className="text-sm font-medium">إجراءات المراجعة</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-lg border border-green-200 bg-green-50/30 p-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                            <CheckCircle2 className="w-4 h-4" /> قبول التوثيق
                          </div>
                          <p className="text-xs text-muted-foreground">سيتم تفعيل شارة التوثيق على حساب المستخدم.</p>
                          <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove} disabled={reviewing !== null}>
                            {reviewing === "approve" && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                            قبول
                          </Button>
                        </div>
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                            <XCircle className="w-4 h-4" /> رفض التوثيق
                          </div>
                          <Textarea placeholder="اكتب سبب الرفض" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={2} className="text-xs" />
                          <Button variant="destructive" className="w-full" onClick={handleReject} disabled={reviewing !== null}>
                            {reviewing === "reject" && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                            رفض
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {verificationRequest.status !== "pending" && (
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground">يمكن للمستخدم إعادة رفع المستندات لتقديم طلب توثيق جديد.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">الوظائف ({userJobs.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {userJobs.length > 0 ? (
                  <div className="space-y-3">
                    {userJobs.map((job) => (
                      <div key={job.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer border border-border"
                        onClick={() => navigate(`/admin/jobs/${job.id}`)}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{job.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.city}</span>
                            <span className="flex items-center gap-1"><Wallet className="w-3 h-3" />{job.price} ج</span>
                          </div>
                        </div>
                        <Badge variant={job.status === "open" ? "default" : job.status === "in-progress" ? "secondary" : "outline"}>
                          {job.status === "open" ? "مفتوحة" : job.status === "in-progress" ? "قيد التنفيذ" : "مكتملة"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">لا توجد وظائف لهذا المستخدم</p>
                )}
              </CardContent>
            </Card>

            {user.role === "worker" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Worker moderation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">State</span>
                    <Badge variant={workerState === "BLOCKED" ? "destructive" : "outline"}>
                      {workerStateLabel[workerState] ?? workerState}
                    </Badge>
                  </div>
                  {suspensionUntil && (
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Suspended until</span>
                      <span>{new Date(suspensionUntil).toLocaleString()}</span>
                    </div>
                  )}
                  {adminReviewRequired && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                      Admin review required
                    </Badge>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSuspendWorker}
                      disabled={isWorkerModerationPending || workerState === "SUSPENDED" || workerState === "BLOCKED"}
                    >
                      Suspend
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBlockWorker}
                      disabled={isWorkerModerationPending || workerState === "BLOCKED"}
                    >
                      Block
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="col-span-2"
                      onClick={handleRestoreWorker}
                      disabled={isWorkerModerationPending || workerState === "AVAILABLE"}
                    >
                      Restore
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {user.role === "worker" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Worker history</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Attendance</span>
                    <span className="font-medium">{Math.round(attendanceRate * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">No-shows</span>
                    <span className="font-medium">{noShowCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium">{completedJobsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cancellations</span>
                    <span className="font-medium">{cancellationCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reports</span>
                    <span className="font-medium">{reportCount}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">معلومات الحساب</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الرصيد</span>
                  <span className="font-bold">{user.walletBalance ?? 0} جنيه</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التقييم</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                    {user.rating?.toFixed(1) ?? "0.0"} ({user.ratingsCount ?? 0})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">النشاط</span>
                  <span>{user.isActive !== false ? "نشط" : "غير نشط"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {user && (
        <EditUserModal
          open={editOpen}
          onOpenChange={(open) => { if (!open) { setEditOpen(false); } }}
          user={user}
          onSave={handleUpdate}
          isSaving={updateUser.isPending}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(o) => { if (!o) setDeleteOpen(false); }}
        title="حذف المستخدم"
        description={`هل أنت متأكد من حذف "${user?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        loading={deleteUser.isPending}
        onConfirm={handleDelete}
      />

      <DocumentPreviewDialog doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </AdminLayout>
  );
}
