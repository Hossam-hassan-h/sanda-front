import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import { getApiErrorMessage } from "@/lib/password-reset";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import type { Column } from "@/components/admin/AdminDataTable";
import { Pagination } from "@/components/admin/Pagination";
import { Search } from "@/components/admin/Search";
import { FilterBar } from "@/components/admin/FilterBar";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ErrorState } from "@/components/admin/ErrorState";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import EditUserModal from "@/components/admin/EditUserModal";
import {
  useUsersQuery,
  useUpdateUser,
  useDeleteUser,
  useBanUser,
  useUnbanUser,
  useVerifyUser,
  useUnverifyUser,
} from "@/hooks/useAdminQueries";
import type { User } from "@/api/types";
import {
  Eye,
  Pencil,
  Trash2,
  Ban,
  UserCheck,
  ShieldCheck,
  ShieldOff,
  MoreHorizontal,
  Phone,
  Wallet,
  Star,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const roleLabel: Record<string, string> = {
  worker: "عامل",
  employer: "صاحب عمل",
  admin: "مسؤول",
};

const STATUS_FILTERS = [
  { value: "active", label: "نشط" },
  { value: "banned", label: "محظور" },
  { value: "verified", label: "موثق" },
  { value: "unverified", label: "غير موثق" },
  { value: "pending_verification", label: "بانتظار التوثيق" },
];

const ROLE_FILTERS = [
  { value: "worker", label: "عامل" },
  { value: "employer", label: "صاحب عمل" },
  { value: "admin", label: "مسؤول" },
];

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ user }: { user: User }) {
  if (user.isBlocked === true) {
    return <Badge variant="destructive">محظور</Badge>;
  }
  if (user.isVerified) {
    return (
      <Badge variant="default" className="bg-green-600/10 text-green-600 border-green-600/20">
        موثق
      </Badge>
    );
  }
  const vr = (user as { verificationRequest?: { status: string } }).verificationRequest;
  if (vr?.status === "pending") {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
        بانتظار المراجعة
      </Badge>
    );
  }
  if (vr?.status === "rejected") {
    return (
      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
        مرفوض
      </Badge>
    );
  }
  return <Badge variant="secondary">غير موثق</Badge>;
}

function RoleBadge({ role }: { role: string }) {
  const variant = role === "admin" ? "destructive" : role === "worker" ? "default" : "secondary";
  return <Badge variant={variant}>{roleLabel[role] || role}</Badge>;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const roleFilter = searchParams.get("role") || "";
  const statusFilter = searchParams.get("status") || "";
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const pageSize = Math.max(Number(searchParams.get("pageSize")) || 10, 1);

  const updateParams = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined || value === "") {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setPage = useCallback((p: number) => updateParams({ page: p }), [updateParams]);

  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const query = useUsersQuery({
    search: search || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    page,
    pageSize,
  });

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const verifyUser = useVerifyUser();
  const unverifyUser = useUnverifyUser();

  const users = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const currentPage = page;
  const currentPageSize = query.data?.pageSize ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / currentPageSize));

  useEffect(() => {
    if (query.data && !query.isLoading && page > totalPages) setPage(totalPages);
  }, [query.data, query.isLoading, page, totalPages]);

  function normalizePhone(phone: string): string {
    if (!phone.startsWith("+")) return `+20${phone.replace(/^0+/, "")}`;
    return phone;
  }

  const openEdit = useCallback((user: User) => {
    setEditUserId(user.id);
  }, []);

  const handleUpdate = useCallback(async (formData: { name: string; phone: string; email: string; role: User["role"]; city: string }) => {
    if (!editUserId) return;
    try {
      await updateUser.mutateAsync({
        id: editUserId,
        payload: formData,
      });
      toast({ title: "تم الحفظ", description: "تم تحديث بيانات المستخدم بنجاح" });
      setEditUserId(null);
    } catch (err) {
      toast({ title: "خطأ في الحفظ", description: getApiErrorMessage(err, "حاول مرة أخرى"), variant: "destructive" });
    }
  }, [editUserId, updateUser]);

  const handleToggleBan = useCallback(async () => {
    if (!banUserId) return;
    const target = users.find((u) => u.id === banUserId);
    if (!target) return;
    try {
      if (target.isBlocked === true) {
        await unbanUser.mutateAsync(banUserId);
        toast({ title: "تم فك الحظر" });
      } else {
        await banUser.mutateAsync(banUserId);
        toast({ title: "تم حظر المستخدم" });
      }
      setBanUserId(null);
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  }, [banUserId, users, banUser, unbanUser]);

  const handleToggleVerify = useCallback(
    (user: User) => {
      try {
        (user.isVerified ? unverifyUser : verifyUser).mutate(user.id);
      } catch {
        toast({ title: "حدث خطأ", description: "تعذر تغيير حالة التوثيق", variant: "destructive" });
      }
    },
    [verifyUser, unverifyUser]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteUserId) return;
    try {
      await deleteUser.mutateAsync(deleteUserId);
      toast({ title: "تم الحذف", description: "تم حذف المستخدم بنجاح" });
      setDeleteUserId(null);
    } catch {
      toast({ title: "خطأ في الحذف", variant: "destructive" });
    }
  }, [deleteUserId, deleteUser]);

  const handleClearFilters = useCallback(() => {
    updateParams({ role: null, status: null, page: 1 });
  }, [updateParams]);

  const banTarget = users.find((u) => u.id === banUserId);
  const deleteTarget = users.find((u) => u.id === deleteUserId);

  const columns = useMemo<Column<User>[]>(
    () => [
      {
        key: "user",
        header: "المستخدم",
        render: (u) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={u.avatar} />
              <AvatarFallback className="bg-primary/10 text-sm">{u.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{u.name}</div>
              <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span dir="ltr">{u.phone}</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        header: "النوع",
        render: (u) => <RoleBadge role={u.role} />,
      },
      {
        key: "city",
        header: "المدينة",
        render: (u) => <span className="text-sm text-muted-foreground">{u.city || "—"}</span>,
      },
      {
        key: "rating",
        header: "التقييم",
        render: (u) =>
          u.rating != null ? (
            <span className="inline-flex items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              {u.rating.toFixed(1)}
              <span className="text-xs text-muted-foreground">({u.ratingsCount ?? 0})</span>
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
      },
      {
        key: "wallet",
        header: "المحفظة",
        render: (u) => (
          <span className="inline-flex items-center gap-1 text-sm font-mono">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
            {(u.walletBalance ?? 0).toLocaleString()} ج
          </span>
        ),
      },
      {
        key: "status",
        header: "الحالة",
        render: (u) => <StatusBadge user={u} />,
      },
      {
        key: "joined",
        header: "تاريخ الانضمام",
        render: (u) => <span className="text-muted-foreground text-xs">{formatDate(u.createdAt)}</span>,
      },
    ],
    []
  );

  if (query.isError) {
    return (
      <AdminLayout>
        <div className="p-6">
          <h1 className="font-heading font-extrabold text-3xl mb-2">إدارة المستخدمين</h1>
          <ErrorState
            title="خطأ في تحميل المستخدمين"
            message={(query.error as Error)?.message || "حدث خطأ أثناء تحميل البيانات"}
            onRetry={() => query.refetch()}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-1">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">{total} مستخدم</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Search
          placeholder="ابحث بالاسم، الهاتف، أو المدينة..."
          defaultValue={search}
          onSearch={(v) => {
            if (v !== search) {
              updateParams({ search: v, page: 1 });
            }
          }}
        />
      </div>

      <FilterBar
        filters={[
          {
            key: "role",
            label: "النوع",
            type: "select",
            options: ROLE_FILTERS,
            value: roleFilter,
            onChange: (v) => {
              updateParams({ role: v as string, page: 1 });
            },
          },
          {
            key: "status",
            label: "الحالة",
            type: "select",
            options: STATUS_FILTERS,
            value: statusFilter,
            onChange: (v) => {
              updateParams({ status: v as string, page: 1 });
            },
          },
        ]}
        onClearAll={handleClearFilters}
      />

      <div className="mt-4 bg-card border border-border rounded-2xl overflow-hidden">
        {query.isLoading ? (
          <TableSkeleton rows={pageSize} columns={columns.length + 1} />
        ) : (
          <>
            <AdminDataTable
              data={users}
              columns={columns}
              emptyMessage="لا يوجد مستخدمين مطابقين للبحث."
              onRowClick={(u) => navigate(`/admin/users/${u.id}`)}
              mobileRender={(u: User) => (
                <Card className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback className="bg-primary/10 text-sm">{u.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span dir="ltr">{u.phone}</span>
                        </div>
                      </div>
                      <StatusBadge user={u} />
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-3">
                      <RoleBadge role={u.role} />
                      <span>{u.city || "—"}</span>
                      <span className="font-mono">{(u.walletBalance ?? 0).toLocaleString()} ج</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/users/${u.id}`);
                          }}
                          aria-label={`عرض ملف ${u.name}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(u);
                          }}
                          aria-label={`تعديل ${u.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteUserId(u.id);
                          }}
                          aria-label={`حذف ${u.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                              aria-label="المزيد من الإجراءات"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-44" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              onClick={() => handleToggleVerify(u)}
                            >
                              {u.isVerified ? (
                                <><ShieldOff className="h-4 w-4 ml-2" />إلغاء التوثيق</>
                              ) : (
                                <><ShieldCheck className="h-4 w-4 ml-2" />توثيق</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setBanUserId(u.id)}
                              className={u.isBlocked === true ? "" : "text-destructive focus:text-destructive"}
                            >
                              {u.isBlocked === true ? (
                                <><UserCheck className="h-4 w-4 ml-2" />إلغاء الحظر</>
                              ) : (
                                <><Ban className="h-4 w-4 ml-2" />حظر المستخدم</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              actions={(u) => (
                <div className="flex items-center gap-0.5 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/users/${u.id}`);
                    }}
                    title="عرض الملف"
                    aria-label={`عرض ملف ${u.name}`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(u);
                    }}
                    title="تعديل"
                    aria-label={`تعديل ${u.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteUserId(u.id);
                    }}
                    title="حذف"
                    aria-label={`حذف ${u.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="المزيد من الإجراءات"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-44" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => handleToggleVerify(u)}>
                        {u.isVerified ? (
                          <><ShieldOff className="h-4 w-4 ml-2" />إلغاء التوثيق</>
                        ) : (
                          <><ShieldCheck className="h-4 w-4 ml-2" />توثيق</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setBanUserId(u.id)}
                        className={u.isBlocked === true ? "" : "text-destructive focus:text-destructive"}
                      >
                        {u.isBlocked === true ? (
                          <><UserCheck className="h-4 w-4 ml-2" />إلغاء الحظر</>
                        ) : (
                          <><Ban className="h-4 w-4 ml-2" />حظر المستخدم</>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            />
            {total > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={total}
                pageSize={currentPageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  updateParams({ pageSize: size, page: 1 });
                }}
              />
            )}
          </>
        )}
      </div>

      {editUserId && (() => {
        const editingUser = users.find((u) => u.id === editUserId);
        if (!editingUser) return null;
        return (
          <EditUserModal
            open={!!editUserId}
            onOpenChange={(open) => { if (!open) { setEditUserId(null); } }}
            user={editingUser}
            onSave={handleUpdate}
            isSaving={updateUser.isPending}
          />
        );
      })()}

      <ConfirmDialog
        open={!!banUserId}
        onOpenChange={(open) => {
          if (!open) setBanUserId(null);
        }}
        title={banTarget?.isBlocked === true ? "إلغاء حظر المستخدم" : "حظر المستخدم"}
        description={
          banTarget?.isBlocked === true
            ? `هل أنت متأكد من إلغاء حظر "${banTarget?.name}"؟`
            : `هل أنت متأكد من حظر "${banTarget?.name}"؟ لن يتمكن من تسجيل الدخول أو استخدام المنصة.`
        }
        confirmText={banTarget?.isBlocked === true ? "إلغاء الحظر" : "حظر"}
        cancelText="إلغاء"
        variant={banTarget?.isBlocked === true ? "default" : "destructive"}
        loading={banUser.isPending || unbanUser.isPending}
        onConfirm={handleToggleBan}
      />

      <ConfirmDialog
        open={!!deleteUserId}
        onOpenChange={(open) => {
          if (!open) setDeleteUserId(null);
        }}
        title="حذف المستخدم"
        description={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        loading={deleteUser.isPending}
        onConfirm={handleDelete}
      />

    </AdminLayout>
  );
}
