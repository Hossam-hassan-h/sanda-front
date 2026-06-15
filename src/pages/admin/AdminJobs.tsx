import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, User, Star, MapPin } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import type { Column } from "@/components/admin/AdminDataTable";
import { Pagination } from "@/components/admin/Pagination";
import { Search } from "@/components/admin/Search";
import { FilterBar } from "@/components/admin/FilterBar";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import JobEditModal from "@/components/admin/JobEditModal";
import { ErrorState } from "@/components/admin/ErrorState";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useJobsQuery, useUpdateJob, useDeleteJob } from "@/hooks/useAdminQueries";
import type { Job, JobStatus } from "@/api/types";
import { getApiErrorMessage } from "@/lib/api-error";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = [
  "ضيافة وفعاليات",
  "صيانة وتركيبات",
  "تنظيف",
  "مطاعم",
  "تسويق ميداني",
  "تصوير",
];

const STATUS_FILTERS = [
  { value: "open", label: "مفتوحة" },
  { value: "in-progress", label: "قيد التنفيذ" },
  { value: "completed", label: "مكتملة" },
  { value: "cancelled", label: "ملغاة" },
];

const statusLabel: Record<JobStatus, string> = {
  open: "مفتوحة",
  "in-progress": "قيد التنفيذ",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

const statusBadgeConfig: Record<JobStatus, { variant: "default" | "outline" | "destructive" | "secondary"; className?: string }> = {
  open: { variant: "default" },
  "in-progress": { variant: "outline", className: "bg-warning/10 text-warning border-warning/20" },
  completed: { variant: "outline", className: "bg-success/10 text-success border-success/20" },
  cancelled: { variant: "destructive" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminJobs() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editJobId, setEditJobId] = useState<string | null>(null);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);

  const query = useJobsQuery({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
  });

  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const jobs = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const currentPage = query.data?.page ?? 1;
  const currentPageSize = query.data?.pageSize ?? 10;
  const editingJob = jobs.find((j) => j.id === editJobId) ?? null;

  const openEdit = useCallback((job: Job) => {
    setEditJobId(job.id);
  }, []);

  const handleEditSave = async (formData: Partial<Job>) => {
    if (!editJobId || updateJob.isPending) return;
    try {
      await updateJob.mutateAsync({ id: editJobId, payload: formData });
      toast({ title: "تم حفظ التعديلات" });
      setEditJobId(null);
    } catch (err) {
      toast({ title: "فشل حفظ التعديلات", description: getApiErrorMessage(err, "حاول مرة أخرى"), variant: "destructive" });
      throw err;
    }
  };

  const handleDelete = useCallback(async () => {
    if (!deleteJobId || deleteJob.isPending) return;
    try {
      await deleteJob.mutateAsync(deleteJobId);
      toast({ title: "تم حذف الوظيفة" });
      setDeleteJobId(null);
    } catch (err) {
      toast({ title: "فشل حذف الوظيفة", description: getApiErrorMessage(err, "حاول مرة أخرى"), variant: "destructive" });
    }
  }, [deleteJobId, deleteJob]);

  const columns = useMemo<Column<Job>[]>(() => [
    {
      key: "title",
      header: "الوظيفة",
      render: (j) => (
        <div>
          <div className="font-semibold">{j.title}</div>
          <div className="text-xs text-muted-foreground">{j.category}</div>
        </div>
      ),
    },
    {
      key: "city",
      header: "المدينة",
      render: (j) => (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {j.city}
        </span>
      ),
    },
    {
      key: "budget",
      header: "الميزانية",
      render: (j) => (
        <span className="font-semibold text-primary">{j.price.toLocaleString()} ج</span>
      ),
    },
    {
      key: "applicantsCount",
      header: "المتقدمين",
      render: (j) => (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          {j.applicantsCount ?? 0}
        </span>
      ),
    },
    {
      key: "postedBy",
      header: "صاحب العمل",
      render: (j) => (
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>{j.employer?.name || "—"}</span>
          {j.employer?.rating ? (
            <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-accent text-accent" />
              {j.employer.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "الحالة",
      render: (j) => {
        const cfg = statusBadgeConfig[j.status];
        return (
          <Badge variant={cfg.variant} className={cfg.className}>
            {statusLabel[j.status]}
          </Badge>
        );
      },
    },
    {
      key: "postedAt",
      header: "تاريخ النشر",
      render: (j) => (
        <span className="text-muted-foreground text-xs">{formatDate(j.createdAt)}</span>
      ),
    },
  ], []);

  if (query.isError) {
    return (
      <AdminLayout>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-2">إدارة الوظائف</h1>
        <ErrorState
          title="خطأ في تحميل الوظائف"
          message={getApiErrorMessage(query.error, "حدث خطأ أثناء تحميل البيانات")}
          onRetry={() => query.refetch()}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-1">إدارة الوظائف</h1>
          <p className="text-muted-foreground">{total} وظيفة</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Search
          placeholder="ابحث بالعنوان، الفئة، أو المدينة..."
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
      </div>

      <FilterBar
        filters={[
          {
            key: "status",
            label: "الحالة",
            type: "select",
            options: STATUS_FILTERS,
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v as string);
              setPage(1);
            },
          },
          {
            key: "category",
            label: "الفئة",
            type: "select",
            options: CATEGORIES.map((c) => ({ value: c, label: c })),
            value: categoryFilter,
            onChange: (v) => {
              setCategoryFilter(v as string);
              setPage(1);
            },
          },
        ]}
        onClearAll={() => {
          setStatusFilter("");
          setCategoryFilter("");
          setPage(1);
        }}
      />

      <div className="mt-4 bg-card border border-border rounded-2xl overflow-hidden">
        {query.isLoading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : (
          <>
            <AdminDataTable
              data={jobs}
              columns={columns}
              emptyMessage="لا توجد وظائف مطابقة للبحث."
              onRowClick={(j) => navigate(`/admin/jobs/${j.id}`)}
              mobileRender={(j: Job) => (
                <Card className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{j.title}</div>
                        <div className="text-xs text-muted-foreground">{j.category}</div>
                      </div>
                      <Badge variant={statusBadgeConfig[j.status].variant} className={statusBadgeConfig[j.status].className}>
                        {statusLabel[j.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{j.city}</span>
                      <span className="font-semibold text-primary">{j.price.toLocaleString()} ج</span>
                      <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{j.applicantsCount ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{formatDate(j.createdAt)}</span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); navigate(`/admin/jobs/${j.id}`); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); openEdit(j); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteJobId(j.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              actions={(j) => (
                <div className="flex items-center gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/jobs/${j.id}`); }}
                    aria-label={`عرض تفاصيل ${j.title}`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); openEdit(j); }}
                    aria-label={`تعديل ${j.title}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => { e.stopPropagation(); setDeleteJobId(j.id); }}
                    aria-label={`حذف ${j.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            />
            {total > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(total / currentPageSize)}
                totalItems={total}
                pageSize={currentPageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            )}
          </>
        )}
      </div>

      <JobEditModal
        open={!!editJobId}
        onOpenChange={(open) => { if (!open) setEditJobId(null); }}
        job={editingJob}
        onSave={handleEditSave}
        isSaving={updateJob.isPending}
        showHours
        showStartDate
        showStatus
      />

      <ConfirmDialog
        open={!!deleteJobId}
        onOpenChange={(open) => {
          if (!open) setDeleteJobId(null);
        }}
        title="حذف الوظيفة"
        description={`هل أنت متأكد من حذف "${jobs.find((j) => j.id === deleteJobId)?.title}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        loading={deleteJob.isPending}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
}
