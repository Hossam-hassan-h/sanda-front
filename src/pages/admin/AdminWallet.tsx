import { useCallback, useState } from "react";
import { Download, Wallet, TrendingUp, TrendingDown, Banknote } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { Pagination } from "@/components/admin/Pagination";
import { Search } from "@/components/admin/Search";
import { FilterBar } from "@/components/admin/FilterBar";
import { ErrorState } from "@/components/admin/ErrorState";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { useWalletTransactionsQuery, useWalletStatsQuery } from "@/hooks/useAdminQueries";
import type { WalletTransaction } from "@/api/types";



const TYPE_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "deposit", label: "إيداع" },
  { value: "withdraw", label: "سحب" },
  { value: "hold", label: "رسوم" },
  { value: "release", label: "دفعة" },
  { value: "refund", label: "استرداد" },
];

function getAmountMeta(type: string) {
  if (type === "deposit" || type === "release" || type === "refund") {
    return { color: "text-green-600", prefix: "+" };
  }
  return { color: "text-red-600", prefix: "-" };
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString()} ر.س`;
}

export default function AdminWallet() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useWalletTransactionsQuery({
    page,
    pageSize,
    search: search || undefined,
    type: typeFilter || undefined,
  });

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useWalletStatsQuery();

  const transactions: WalletTransaction[] = response?.data ?? [];
  const totalItems = response?.total ?? 0;
  const actualPage = response?.page ?? page;
  const actualPageSize = response?.pageSize ?? pageSize;

  const totalPages = Math.max(1, Math.ceil(totalItems / actualPageSize));

  const handleExport = useCallback(() => {
    const rows = [
      ["id", "amount", "type", "status", "createdAt", "jobTitle"].join(","),
      ...transactions.map((t: WalletTransaction) =>
        [t.id, t.amount, t.transactionType, t.paymentStatus, t.createdAt, `"${t.jobTitle ?? ""}"`].join(",")
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sanda-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transactions]);

  const handleClearFilters = useCallback(() => {
    setTypeFilter("");
    setSearch("");
    setPage(1);
    setResetKey((k) => k + 1);
  }, []);

  const columns: Column<WalletTransaction>[] = [
    {
      key: "id",
      header: "رقم المعاملة",
      render: (t) => <span className="font-mono text-xs text-muted-foreground">{t.id}</span>,
    },
    {
      key: "userName",
      header: "المستخدم",
      render: () => <span className="text-muted-foreground">—</span>,
    },
    {
      key: "transactionType",
      header: "النوع",
      render: (t) => {
        const label = TYPE_OPTIONS.find((o) => o.value === t.transactionType)?.label ?? t.transactionType;
        return <span>{label}</span>;
      },
    },
    {
      key: "amount",
      header: "المبلغ",
      render: (t) => {
        const { color, prefix } = getAmountMeta(t.transactionType);
        return (
          <span className={`font-semibold ${color}`}>
            {prefix}{formatCurrency(t.amount)}
          </span>
        );
      },
    },
    {
      key: "jobTitle",
      header: "الوظيفة",
      render: (t) => t.jobTitle || "—",
    },
    {
      key: "createdAt",
      header: "التاريخ",
      render: (t) =>
        t.createdAt
          ? new Date(t.createdAt).toLocaleDateString("ar-EG", { dateStyle: "short" })
          : "—",
    },
  ];

  const filterConfigs = [
    {
      key: "type",
      label: "نوع المعاملة",
      type: "select" as const,
      options: TYPE_OPTIONS.filter((o) => o.value !== "all"),
      value: typeFilter,
      onChange: (v: string | string[]) => {
        setTypeFilter(v as string);
        setPage(1);
      },
    },
  ];

  return (
    <AdminLayout>
      <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-2">إدارة المحفظة</h1>
      <p className="text-muted-foreground mb-6">المدفوعات، الضمان، وسجل المعاملات المالية</p>

      {/* Stats Cards */}
      {statsError ? (
        <ErrorState onRetry={refetchStats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الودائع</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : formatCurrency(stats?.totalDeposits ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي السحوبات</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : formatCurrency(stats?.totalWithdrawals ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إيرادات المنصة</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : formatCurrency(stats?.platformRevenue ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">الرصيد الحالي</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : formatCurrency(stats?.currentBalance ?? 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Bar: Search + FilterBar + Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <Search
          key={resetKey}
          placeholder="بحث عن وظيفة..."
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          defaultValue={search}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <FilterBar filters={filterConfigs} onClearAll={handleClearFilters} />
          <Button variant="outline" onClick={handleExport} aria-label="تصدير البيانات إلى CSV" className="w-full sm:w-auto">
            <Download className="h-4 w-4 ml-2" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isError ? (
            <ErrorState onRetry={refetch} />
          ) : isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : (
            <AdminDataTable
              data={transactions}
              columns={columns}
              emptyMessage="لا توجد معاملات مطابقة"
              mobileRender={(t: WalletTransaction) => {
                const label = TYPE_OPTIONS.find((o) => o.value === t.transactionType)?.label ?? t.transactionType;
                const { color, prefix } = getAmountMeta(t.transactionType);
                return (
                  <Card className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-muted-foreground truncate max-w-[50%]">{t.id}</span>
                        <Badge variant="outline">{label}</Badge>
                      </div>
                      <div className={`font-semibold text-lg mb-2 ${color}`}>{prefix}{formatCurrency(t.amount)}</div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate max-w-[60%]">{t.jobTitle || "—"}</span>
                        <span>{t.createdAt ? new Date(t.createdAt).toLocaleDateString("ar-EG", { dateStyle: "short" }) : "—"}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!isLoading && !isError && totalItems > 0 && (
        <Pagination
          currentPage={actualPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={actualPageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </AdminLayout>
  );
}
