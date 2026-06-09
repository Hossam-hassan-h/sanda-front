import { useState, useCallback, useMemo } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { Pagination } from "@/components/admin/Pagination";
import { Search } from "@/components/admin/Search";
import { FilterBar } from "@/components/admin/FilterBar";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Modal } from "@/components/admin/Modal";
import { ErrorState } from "@/components/admin/ErrorState";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import {
  useUsersQuery,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useBanUser,
  useUnbanUser,
  useVerifyUser,
  useUnverifyUser,
} from "@/hooks/useAdminQueries";
import type { User } from "@/api/types";
import {
  MoreHorizontal,
  Edit2,
  ShieldCheck,
  ShieldAlert,
  Ban,
  UserCheck,
  Trash2,
  Loader2,
} from "lucide-react";

const roleLabel: Record<string, string> = {
  worker: "عامل",
  employer: "صاحب عمل",
  admin: "مسؤول",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-SA", {
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
    return <Badge variant="default" className="bg-green-600/10 text-green-600 border-green-600/20">موثق</Badge>;
  }
  return <Badge variant="secondary">غير موثق</Badge>;
}

function RoleBadge({ role }: { role: string }) {
  const variant = role === "admin" ? "destructive" : role === "worker" ? "default" : "secondary";
  return <Badge variant={variant}>{roleLabel[role] || role}</Badge>;
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [banOpen, setBanOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<User | null>(null);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("worker");
  const [formCity, setFormCity] = useState("");

  const resetForm = useCallback(() => {
    setFormName("");
    setFormPhone("");
    setFormRole("worker");
    setFormCity("");
  }, []);

  const openEdit = useCallback((user: User) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormPhone(user.phone);
    setFormRole(user.role);
    setFormCity(user.city || "");
    setEditOpen(true);
  }, []);

  const { data: response, isLoading, isError, error, refetch } =
    useUsersQuery({ search, role: roleFilter || undefined, status: statusFilter || undefined, page, pageSize });

  const users = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const verifyUser = useVerifyUser();
  const unverifyUser = useUnverifyUser();

  const handleCreate = useCallback(() => {
    createUser.mutate(
      { name: formName, phone: formPhone, role: formRole as User["role"], city: formCity },
      { onSuccess: () => { setCreateOpen(false); resetForm(); } },
    );
  }, [createUser, formName, formPhone, formRole, formCity, resetForm]);

  const handleUpdate = useCallback(() => {
    if (!selectedUser) return;
    updateUser.mutate(
      { id: selectedUser.id, payload: { name: formName, phone: formPhone, role: formRole as User["role"], city: formCity } },
      { onSuccess: () => { setEditOpen(false); setSelectedUser(null); resetForm(); } },
    );
  }, [updateUser, selectedUser, formName, formPhone, formRole, formCity, resetForm]);

  const handleBanToggle = useCallback(() => {
    if (!actionTarget) return;
    const mut = actionTarget.isActive === false ? unbanUser : banUser;
    mut.mutate(actionTarget.id, { onSuccess: () => { setBanOpen(false); setActionTarget(null); } });
  }, [actionTarget, banUser, unbanUser]);

  const handleVerifyToggle = useCallback((user: User) => {
    (user.isVerified ? unverifyUser : verifyUser).mutate(user.id);
  }, [verifyUser, unverifyUser]);

  const handleDelete = useCallback(() => {
    if (!actionTarget) return;
    deleteUser.mutate(actionTarget.id, { onSuccess: () => { setDeleteOpen(false); setActionTarget(null); } });
  }, [deleteUser, actionTarget]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
  }, []);

  const columns = useMemo(() => [
    {
      key: "user",
      header: "المستخدم",
      render: (u: User) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 rounded-full">
            <AvatarImage src={u.avatar} />
            <AvatarFallback className="bg-primary/10 text-xs">{u.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{u.name}</div>
            <div className="text-xs text-muted-foreground font-mono ltr text-end">{u.phone}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "النوع",
      render: (u: User) => <RoleBadge role={u.role} />,
    },
    {
      key: "city",
      header: "المدينة",
      render: (u: User) => <span className="text-sm text-muted-foreground">{u.city || "—"}</span>,
    },
    {
      key: "wallet",
      header: "المحفظة",
      render: (u: User) => <span className="font-mono text-sm">{u.walletBalance?.toLocaleString() ?? 0} ج</span>,
    },
    {
      key: "status",
      header: "الحالة",
      render: (u: User) => <StatusBadge user={u} />,
    },
    {
      key: "joined",
      header: "تاريخ الانضمام",
      render: (u: User) => <span className="text-sm text-muted-foreground">{formatDate(u.createdAt)}</span>,
    },
  ], []);

  if (isError) {
    return (
      <AdminLayout>
        <div className="p-6">
          <h1 className="font-heading font-extrabold text-3xl mb-2">إدارة المستخدمين</h1>
          <ErrorState
            title="خطأ في تحميل المستخدمين"
            message={(error as Error)?.message || "حدث خطأ أثناء تحميل البيانات"}
            onRetry={() => refetch()}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-1">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">{total ?? 0} مستخدم على المنصة</p>
        </div>
        <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
          إضافة مستخدم
        </Button>
      </div>

      <div className="space-y-4">
        <Search
          placeholder="ابحث بالاسم، الهاتف، أو المدينة..."
          onSearch={handleSearch}
          defaultValue=""
        />
        <FilterBar
          filters={[
            {
              key: "role",
              label: "النوع",
              type: "select",
              options: [
                { value: "worker", label: "عامل" },
                { value: "employer", label: "صاحب عمل" },
                { value: "admin", label: "مسؤول" },
              ],
              value: roleFilter,
              onChange: (v) => { setRoleFilter(v as string); setPage(1); },
            },
            {
              key: "status",
              label: "الحالة",
              type: "select",
              options: [
                { value: "active", label: "نشط" },
                { value: "banned", label: "محظور" },
                { value: "verified", label: "موثق" },
                { value: "unverified", label: "غير موثق" },
              ],
              value: statusFilter,
              onChange: (v) => { setStatusFilter(v as string); setPage(1); },
            },
          ]}
          onClearAll={handleClearFilters}
        />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden mt-4">
        {isLoading ? (
          <TableSkeleton rows={pageSize} columns={columns.length + 1} />
        ) : (
          <>
            <AdminDataTable
              data={users ?? []}
              columns={columns}
              emptyMessage="لا يوجد مستخدمين مطابقين للبحث"
              actions={(u: User) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-40">
                    <DropdownMenuItem onClick={() => openEdit(u)}>
                      <Edit2 className="h-4 w-4 ml-2" />
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleVerifyToggle(u)}>
                      {u.isVerified ? (
                        <><ShieldAlert className="h-4 w-4 ml-2" />إلغاء التوثيق</>
                      ) : (
                        <><ShieldCheck className="h-4 w-4 ml-2" />توثيق</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setActionTarget(u); setBanOpen(true); }}>
                      {u.isActive === false ? (
                        <><UserCheck className="h-4 w-4 ml-2" />إلغاء الحظر</>
                      ) : (
                        <><Ban className="h-4 w-4 ml-2" />حظر</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => { setActionTarget(u); setDeleteOpen(true); }}
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              mobileRender={(u: User) => (
                <Card className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10 rounded-full">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback className="bg-primary/10 text-xs">{u.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground font-mono ltr text-end">{u.phone}</div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40">
                          <DropdownMenuItem onClick={() => openEdit(u)}>
                            <Edit2 className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVerifyToggle(u)}>
                            {u.isVerified ? (
                              <><ShieldAlert className="h-4 w-4 ml-2" />إلغاء التوثيق</>
                            ) : (
                              <><ShieldCheck className="h-4 w-4 ml-2" />توثيق</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setActionTarget(u); setBanOpen(true); }}>
                            {u.isActive === false ? (
                              <><UserCheck className="h-4 w-4 ml-2" />إلغاء الحظر</>
                            ) : (
                              <><Ban className="h-4 w-4 ml-2" />حظر</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => { setActionTarget(u); setDeleteOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <RoleBadge role={u.role} />
                      <StatusBadge user={u} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{u.city || "—"}</span>
                      <span className="font-mono">{u.walletBalance?.toLocaleString() ?? 0} ج</span>
                      <span>{formatDate(u.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            />
            {total > 0 && (
              <Pagination
                currentPage={response?.page || page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={response?.pageSize || pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              />
            )}
          </>
        )}
      </div>

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="إضافة مستخدم جديد" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الاسم</label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="اسم المستخدم" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
            <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="05xxxxxxxx" className="ltr text-end" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">النوع</label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              className="h-10 px-3 rounded-md border border-border bg-background text-sm w-full"
            >
              <option value="worker">عامل</option>
              <option value="employer">صاحب عمل</option>
              <option value="admin">مسؤول</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">المدينة</label>
            <Input value={formCity} onChange={(e) => setFormCity(e.target.value)} placeholder="المدينة" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={createUser.isPending}>
              {createUser.isPending && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
              إضافة
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={editOpen}
        onOpenChange={(o) => { if (!o) { setEditOpen(false); setSelectedUser(null); } }}
        title="تعديل المستخدم"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الاسم</label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="اسم المستخدم" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
            <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="05xxxxxxxx" className="ltr text-end" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">النوع</label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              className="h-10 px-3 rounded-md border border-border bg-background text-sm w-full"
            >
              <option value="worker">عامل</option>
              <option value="employer">صاحب عمل</option>
              <option value="admin">مسؤول</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">المدينة</label>
            <Input value={formCity} onChange={(e) => setFormCity(e.target.value)} placeholder="المدينة" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setEditOpen(false); setSelectedUser(null); resetForm(); }}>إلغاء</Button>
            <Button onClick={handleUpdate} disabled={updateUser.isPending}>
              {updateUser.isPending && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
              حفظ
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={banOpen}
        onOpenChange={(o) => { if (!o) { setBanOpen(false); setActionTarget(null); } }}
        title={actionTarget?.isActive === false ? "إلغاء حظر المستخدم" : "حظر المستخدم"}
        description={
          actionTarget?.isActive === false
            ? `هل أنت متأكد من إلغاء حظر "${actionTarget?.name}"؟`
            : `هل أنت متأكد من حظر "${actionTarget?.name}"؟ لن يتمكن من تسجيل الدخول أو استخدام المنصة.`
        }
        confirmText={actionTarget?.isActive === false ? "إلغاء الحظر" : "حظر"}
        cancelText="إلغاء"
        variant={actionTarget?.isActive === false ? "default" : "destructive"}
        loading={banUser.isPending || unbanUser.isPending}
        onConfirm={handleBanToggle}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(o) => { if (!o) { setDeleteOpen(false); setActionTarget(null); } }}
        title="حذف المستخدم"
        description={`هل أنت متأكد من حذف "${actionTarget?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        loading={deleteUser.isPending}
        onConfirm={handleDelete}
      />
    </div>
    </AdminLayout>
  );
}
