import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, XCircle, CheckCircle, Trash2 } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { useReportsQuery, useUpdateReportStatus, useDeleteReport } from "@/hooks/useAdminQueries";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { Pagination } from "@/components/admin/Pagination";
import { Search } from "@/components/admin/Search";
import { FilterBar } from "@/components/admin/FilterBar";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ErrorState } from "@/components/admin/ErrorState";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Report } from "@/api/types";

const statusMeta: Record<string, { label: string; className: string }> = {
  open: { label: "مفتوح", className: "bg-destructive/10 text-destructive border-destructive/20" },
  reviewed: { label: "تمت المراجعة", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  closed: { label: "مغلق", className: "bg-success/10 text-success border-success/20" },
};

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status] ?? statusMeta.open;
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  );
}

export default function AdminReports() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);

  const { data: response, isLoading, isError, error, refetch } = useReportsQuery({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const reports = response?.data ?? [];
  const total = response?.total ?? 0;
  const serverPage = response?.page ?? 1;
  const serverPageSize = response?.pageSize ?? 10;

  const updateStatus = useUpdateReportStatus();
  const deleteReport = useDeleteReport();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusFilter = useCallback((value: string | string[]) => {
    setStatusFilter(value as string);
    setPage(1);
  }, []);

  const handleClearAll = useCallback(() => {
    setStatusFilter("");
    setSearch("");
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const handleResolve = useCallback(
    (report: Report) => {
      updateStatus.mutateAsync({ id: report.id, status: "reviewed" });
    },
    [updateStatus],
  );

  const handleClose = useCallback(
    (report: Report) => {
      updateStatus.mutateAsync({ id: report.id, status: "closed" });
    },
    [updateStatus],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteReport.mutateAsync(deleteTarget.id).then(() => setDeleteTarget(null));
  }, [deleteTarget, deleteReport]);

  if (isError) {
    return (
      <AdminLayout>
        <ErrorState
          title="خطأ في تحميل البلاغات"
          message={(error as Error)?.message || "حدث خطأ أثناء تحميل البيانات"}
          onRetry={() => refetch()}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl">البلاغات والنزاعات</h1>
        <p className="text-muted-foreground">{total} بلاغ</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <Search
          placeholder="بحث عن سبب البلاغ..."
          onSearch={handleSearch}
          defaultValue={search}
        />
        <FilterBar
          filters={[
            {
              key: "status",
              label: "الحالة",
              type: "select",
              options: [
                { value: "open", label: "مفتوح" },
                { value: "reviewed", label: "تمت المراجعة" },
                { value: "closed", label: "مغلق" },
              ],
              value: statusFilter,
              onChange: handleStatusFilter,
            },
          ]}
          onClearAll={handleClearAll}
        />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <>
            <AdminDataTable<Report>
              data={reports}
              onRowClick={(r) => navigate(`/admin/reports/${r.id}`)}
              columns={[
                {
                  key: "reporter",
                  header: "المبلغ",
                  render: (r) => (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {r.reportedBy?.name?.charAt(0) || "?"}
                      </div>
                      <span className="font-medium">{r.reportedBy?.name || "غير معروف"}</span>
                    </div>
                  ),
                },
                {
                  key: "reportedUser",
                  header: "المُبلغ عنه",
                  render: (r) => (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {r.reportedUser?.name?.charAt(0) || "?"}
                      </div>
                      <span className="font-medium">{r.reportedUser?.name || "غير معروف"}</span>
                    </div>
                  ),
                },
                {
                  key: "reason",
                  header: "السبب",
                  className: "max-w-[200px]",
                  render: (r) => (
                    <span className="text-sm text-muted-foreground truncate block">{r.reason}</span>
                  ),
                },
                {
                  key: "status",
                  header: "الحالة",
                  render: (r) => <StatusBadge status={r.status} />,
                },
                {
                  key: "date",
                  header: "التاريخ",
                  render: (r) => (
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString("ar-EG")}
                    </span>
                  ),
                },
              ]}
              mobileRender={(r: Report) => (
                <Card className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {r.reportedBy?.name?.charAt(0) || "?"}
                        </div>
                        <span className="font-medium text-sm">{r.reportedBy?.name || "غير معروف"}</span>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>أبلغ عن:</span>
                      <span className="font-medium">{r.reportedUser?.name || "غير معروف"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-3">{r.reason}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("ar-EG")}</span>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/admin/reports/${r.id}`); }}><Eye className="h-4 w-4" /></Button>
                        {r.status === "open" && (
                          <Button size="sm" variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/10" onClick={() => handleResolve(r)}><CheckCircle className="h-4 w-4" /></Button>
                        )}
                        {r.status !== "closed" && (
                          <Button size="sm" variant="ghost" className="text-success hover:text-success hover:bg-success/10" onClick={() => handleClose(r)}><XCircle className="h-4 w-4" /></Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(r)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              actions={(r) => (
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/admin/reports/${r.id}`)}
                    aria-label="عرض التفاصيل"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {r.status === "open" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                      onClick={() => handleResolve(r)}
                      disabled={updateStatus.isPending}
                      aria-label="تعيين كتمت المراجعة"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {r.status !== "closed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-success hover:text-success hover:bg-success/10"
                      onClick={() => handleClose(r)}
                      disabled={updateStatus.isPending}
                      aria-label="إغلاق البلاغ"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(r)}
                    aria-label="حذف البلاغ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            />

            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / pageSize) || 1}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="تأكيد حذف البلاغ"
        description={`هل أنت متأكد من حذف هذا البلاغ؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        loading={deleteReport.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  );
}
