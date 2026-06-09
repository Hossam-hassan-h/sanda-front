import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2, type LucideIcon } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWalletBalance, useWalletTransactions } from "@/hooks/useWallet";
import { Skeleton } from "@/components/ui/skeleton";
import type { TransactionType } from "@/api/types";

const typeMeta: Record<TransactionType, { label: string; cls: string; sign: string; icon: LucideIcon }> = {
  hold: { label: "محجوز (Escrow)", cls: "text-warning", sign: "", icon: Clock },
  release: { label: "تحرير من Escrow", cls: "text-success", sign: "+", icon: CheckCircle2 },
  withdraw: { label: "سحب", cls: "text-destructive", sign: "-", icon: ArrowDownToLine },
  deposit: { label: "إيداع", cls: "text-success", sign: "+", icon: ArrowUpFromLine },
  refund: { label: "استرداد", cls: "text-success", sign: "+", icon: CheckCircle2 },
};

export default function Wallet() {
  const { data: balance, isLoading: bLoading } = useWalletBalance();
  const { data: txs, isLoading: tLoading } = useWalletTransactions();

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-4xl">
        <h1 className="font-heading font-extrabold text-3xl mb-2">المحفظة</h1>
        <p className="text-muted-foreground mb-8">تابع رصيدك وعملياتك المالية</p>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary to-primary-deep text-primary-foreground rounded-2xl p-6">
            <div className="flex items-center gap-2 text-sm text-primary-foreground/80 mb-2">
              <WalletIcon className="h-4 w-4" /> الرصيد المتاح للسحب
            </div>
            {bLoading ? <Skeleton className="h-10 w-32 bg-white/20" /> : (
              <div className="font-heading font-extrabold text-4xl mb-4">{balance?.available} <span className="text-lg">جنيه</span></div>
            )}
            <div className="flex gap-2">
              <Button variant="accent" size="sm"><ArrowDownToLine className="h-4 w-4" /> سحب</Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20"><ArrowUpFromLine className="h-4 w-4" /> إيداع</Button>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Clock className="h-4 w-4" /> المبلغ المحجوز (Escrow)
            </div>
            {bLoading ? <Skeleton className="h-10 w-32" /> : (
              <div className="font-heading font-extrabold text-4xl text-warning mb-2">{balance?.held} <span className="text-lg text-muted-foreground">جنيه</span></div>
            )}
            <p className="text-sm text-muted-foreground">يتم تحريره تلقائياً بعد إتمام العمل</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl">
          <div className="p-5 border-b border-border">
            <h2 className="font-heading font-bold text-lg">سجل العمليات</h2>
          </div>
          {tLoading ? (
            <div className="p-5 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : (
            <div className="divide-y divide-border">
              {txs?.map((t) => {
                const m = typeMeta[t.transactionType];
                return (
                  <div key={t.id} className="p-4 md:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-muted ${m.cls}`}>
                        <m.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{t.jobTitle ?? m.label}</div>
                        <div className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("ar-EG", { dateStyle: "medium" })} — {m.label}</div>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className={`font-heading font-bold ${m.cls}`}>{m.sign}{t.amount} ج</div>
                      {t.paymentStatus === "pending" && <Badge variant="outline" className="text-xs">قيد المعالجة</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
