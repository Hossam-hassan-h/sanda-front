import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
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
import { Modal } from "@/components/admin/Modal";
import { ErrorState } from "@/components/admin/ErrorState";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
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
  Loader2,
} from "lucide-react";

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
  if (user.isActive === false) {
    return <Badge variant="destructive">محظور</Badge>;
  }
  if (user.isVerified) {
    return (
      <Badge variant="default" className="bg-green-600/10 text-green-600 border-green-600/20">
        موثق
      </Badge>
    );
  }
  // Check if user has a pending verification request
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
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "worker" as User["role"],
    city: "",
  });

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
  const currentPage = query.data?.page ?? 1;
  const currentPageSize = query.data?.pageSize ?? 10;

  const openEdit = useCallback((user: User) => {
    setEditUserId(user.id);
    setEditForm({
      name: user.name,
      phone: user.phone || "",
      email: user.email || "",
      role: user.role,
      city: user.city || "",
    });
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!editUserId) return;
    const target = users.find((u) => u.id === editUserId);
    await updateUser.mutateAsync({
      id: editUserId,
      payload: {
        ...editForm,
        email: editForm.email || target?.email,
      },
    });
    setEditUserId(null);
  }, [editUserId, editForm, updateUser, users]);

  const handleToggleBan = useCallback(async () => {
    if (!banUserId) return;
    const target = users.find((u) => u.id === banUserId);
    if (!target) return;
    if (target.isActive === false) {
      await unbanUser.mutateAsync(banUserId);
    } else {
      await banUser.mutateAsync(banUserId);
    }
    setBanUserId(null);
  }, [banUserId, users, banUser, unbanUser]);

  const handleToggleVerify = useCallback(
    (user: User) => {
      (user.isVerified ? unverifyUser : verifyUser).mutate(user.id);
    },
    [verifyUser, unverifyUser]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteUserId) return;
    await deleteUser.mutateAsync(deleteUserId);
    setDeleteUserId(null);
  }, [deleteUserId, deleteUser]);

  const handleClearFilters = useCallback(() => {
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
  }, []);

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
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
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
              setRoleFilter(v as string);
              setPage(1);
            },
          },
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
                              className={u.isActive === false ? "" : "text-destructive focus:text-destructive"}
                            >
                              {u.isActive === false ? (
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
                        className={u.isActive === false ? "" : "text-destructive focus:text-destructive"}
                      >
                        {u.isActive === false ? (
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
                totalPages={Math.max(1, Math.ceil(total / currentPageSize))}
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

      <Modal
        open={!!editUserId}
        onOpenChange={(open) => {
          if (!open) setEditUserId(null);
        }}
        title="تعديل المستخدم"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الاسم</label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="اسم المستخدم"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
            <Input
              value={editForm.phone}
              onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="05xxxxxxxx"
              className="ltr text-end"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
            <Input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com"
              className="ltr text-end"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">النوع</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as User["role"] }))}
              className="h-10 px-3 rounded-md border border-border bg-background text-sm w-full"
            >
              <option value="worker">عامل</option>
              <option value="employer">صاحب عمل</option>
              <option value="admin">مسؤول</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">المدينة</label>
            <Input
              value={editForm.city}
              onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="المدينة"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setEditUserId(null)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdate} disabled={updateUser.isPending}>
              {updateUser.isPending && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
              حفظ التغييرات
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!banUserId}
        onOpenChange={(open) => {
          if (!open) setBanUserId(null);
        }}
        title={banTarget?.isActive === false ? "إلغاء حظر المستخدم" : "حظر المستخدم"}
        description={
          banTarget?.isActive === false
            ? `هل أنت متأكد من إلغاء حظر "${banTarget?.name}"؟`
            : `هل أنت متأكد من حظر "${banTarget?.name}"؟ لن يتمكن من تسجيل الدخول أو استخدام المنصة.`
        }
        confirmText={banTarget?.isActive === false ? "إلغاء الحظر" : "حظر"}
        cancelText="إلغاء"
        variant={banTarget?.isActive === false ? "default" : "destructive"}
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
