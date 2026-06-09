import { useMemo, useState } from "react";
import { Activity, Filter, Search, Download, Calendar, User, type LucideIcon } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockUserLogs, mockUsers } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const TARGET_TYPES = [
  { value: "all", label: "كل الأهداف" },
  { value: "session", label: "جلسات" },
  { value: "job", label: "وظائف" },
  { value: "application", label: "تقديمات" },
  { value: "rating", label: "تقييمات" },
  { value: "wallet", label: "محفظة" },
  { value: "report", label: "بلاغات" },
];

const ACTION_META: Record<string, { label: string; cls: string }> = {
  login: { label: "تسجيل دخول", cls: "bg-primary/10 text-primary border-primary/20" },
  logout: { label: "تسجيل خروج", cls: "bg-muted text-muted-foreground border-border" },
  "job.create": { label: "نشر وظيفة", cls: "bg-success/10 text-success border-success/20" },
  "job.apply": { label: "تقديم على وظيفة", cls: "bg-accent/10 text-accent border-accent/20" },
  "job.checkin": { label: "تسجيل حضور", cls: "bg-warning/10 text-warning border-warning/20" },
  "job.checkout": { label: "تسجيل انصراف", cls: "bg-success/10 text-success border-success/20" },
  "application.accept": { label: "قبول متقدم", cls: "bg-success/10 text-success border-success/20" },
  "application.reject": { label: "رفض متقدم", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  "wallet.deposit": { label: "إيداع", cls: "bg-success/10 text-success border-success/20" },
  "wallet.withdraw": { label: "سحب", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  "rating.create": { label: "إنشاء تقييم", cls: "bg-accent/10 text-accent border-accent/20" },
  "report.create": { label: "إنشاء بلاغ", cls: "bg-warning/10 text-warning border-warning/20" },
};

const FALLBACK_ACTION = { label: "إجراء", cls: "bg-muted text-muted-foreground border-border" };

export default function AdminUserLogs() {
  const [query, setQuery] = useState("");
  const [userId, setUserId] = useState<string>("all");
  const [targetType, setTargetType] = useState<string>("all");

  const filtered = useMemo(() => {
    return mockUserLogs.filter((l) => {
      const user = mockUsers.find((u) => u.id === l.userId);
      const matchQ =
        !query ||
        l.action.includes(query) ||
        l.targetId.includes(query) ||
        (user?.name ?? "").includes(query);
      const matchU = userId === "all" || l.userId === userId;
      const matchT = targetType === "all" || l.targetType === targetType;
      return matchQ && matchU && matchT;
    });
  }, [query, userId, targetType]);

  const totalLogs = mockUserLogs.length;
  const uniqueUsers = new Set(mockUserLogs.map((l) => l.userId)).size;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = mockUserLogs.filter((l) => l.createdAt.startsWith(today)).length;

  const handleExport = () => {
    const rows = [
      ["id", "userId", "action", "targetType", "targetId", "createdAt"].join(","),
      ...filtered.map((l) => [l.id, l.userId, l.action, l.targetType, l.targetId, l.createdAt].join(",")),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-2">سجل نشاط المستخدمين</h1>
      <p className="text-muted-foreground mb-6">
        تتبع إجراءات المستخدمين لأغراض الأمان والمراجعة
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <Kpi icon={Activity} label="إجمالي السجلات" value={totalLogs} cls="bg-primary/10 text-primary" />
        <Kpi icon={User} label="مستخدمين نشطين" value={uniqueUsers} cls="bg-accent/10 text-accent" />
        <Kpi icon={Calendar} label="نشاط اليوم" value={todayCount} cls="bg-success/10 text-success" />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> تصفية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px_180px_auto] gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالإجراء، الهدف، أو اسم المستخدم..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="كل المستخدمين" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المستخدمين</SelectItem>
                {mockUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={targetType} onValueChange={setTargetType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TARGET_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport} aria-label="تصدير السجلات إلى CSV">
              <Download className="h-4 w-4" /> تصدير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="mt-6">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">مفيش سجلات مطابقة.</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-right">
                    <tr>
                      <th className="px-4 py-3 font-semibold">المستخدم</th>
                      <th className="px-4 py-3 font-semibold">الإجراء</th>
                      <th className="px-4 py-3 font-semibold">نوع الهدف</th>
                      <th className="px-4 py-3 font-semibold">معرّف الهدف</th>
                      <th className="px-4 py-3 font-semibold">التاريخ والوقت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((l) => {
                      const user = mockUsers.find((u) => u.id === l.userId);
                      const meta = ACTION_META[l.action] ?? FALLBACK_ACTION;
                      return (
                        <tr key={l.id} className={cn("hover:bg-muted/20")}>
                          <td className="px-4 py-3">
                            <div className="font-semibold">{user?.name ?? l.userId}</div>
                            <div className="text-xs text-muted-foreground font-mono">{l.userId}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{l.action}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="text-[10px]">{l.targetType}</Badge>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.targetId}</td>
                          <td className="px-4 py-3 text-xs">
                            {new Date(l.createdAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="block md:hidden p-4 space-y-3">
                {filtered.map((l) => {
                  const user = mockUsers.find((u) => u.id === l.userId);
                  const meta = ACTION_META[l.action] ?? FALLBACK_ACTION;
                  return (
                    <Card key={l.id} className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold text-sm">{user?.name ?? l.userId}</div>
                            <div className="text-xs text-muted-foreground font-mono">{l.userId}</div>
                          </div>
                          <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="secondary" className="text-[10px]">{l.targetType}</Badge>
                          <span className="text-xs font-mono text-muted-foreground">{l.targetId}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(l.createdAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

function Kpi({ icon: Icon, label, value, cls }: { icon: LucideIcon; label: string; value: number; cls: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", cls)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="font-heading font-extrabold text-xl">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
