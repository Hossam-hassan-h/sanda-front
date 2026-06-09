import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, X, Star, MapPin, MessageCircle, CreditCard } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useApplicants, useAcceptApplicant, useRejectApplicant, useJob } from "@/hooks/useJobs";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function Applicants() {
  const { id } = useParams<{ id: string }>();
  const { data: job } = useJob(id!);
  const { data: applicants, isLoading } = useApplicants(id!);
  const accept = useAcceptApplicant();
  const reject = useRejectApplicant();
  const [paymentFor, setPaymentFor] = useState<string | null>(null);

  const handleAccept = (appId: string) => setPaymentFor(appId);

  const confirmPayment = async () => {
    if (!paymentFor) return;
    await accept.mutateAsync(paymentFor);
    toast({ title: "تم القبول والدفع", description: "المبلغ محجوز حتى اكتمال العمل." });
    setPaymentFor(null);
  };

  const handleReject = async (appId: string) => {
    await reject.mutateAsync(appId);
    toast({ title: "تم رفض المتقدم" });
  };

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-4xl">
        <Link to={`/jobs/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 rotate-180" /> الرجوع للوظيفة
        </Link>

        <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-1">المتقدمين لـ "{job?.title}"</h1>
        <p className="text-muted-foreground mb-8">{applicants?.length ?? 0} متقدم — اختار الأنسب لشغلك</p>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        ) : applicants && applicants.length ? (
          <div className="space-y-4">
            {applicants.map((a) => (
              <div key={a.id} className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={a.worker.avatar} />
                  <AvatarFallback>{a.worker.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <Link to={`/profile/${a.worker.id}`} className="font-heading font-bold text-lg hover:text-primary">{a.worker.name}</Link>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-accent text-accent" /> {a.worker.rating?.toFixed(1)} ({a.worker.ratingsCount} تقييم)</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {a.worker.city}</span>
                      </div>
                    </div>
                    {a.status === "accepted" && <Badge className="bg-success/10 text-success border-success/20">مقبول</Badge>}
                    {a.status === "rejected" && <Badge variant="destructive">مرفوض</Badge>}
                  </div>

                  {a.worker.skills && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {a.worker.skills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                    </div>
                  )}

                  <p className="text-foreground/80 text-sm bg-muted/50 rounded-lg p-3 mb-3">{a.message}</p>

                  {a.status === "pending" && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="accent" onClick={() => handleAccept(a.id)}>
                        <Check className="h-4 w-4" /> قبول ودفع
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(a.id)}>
                        <X className="h-4 w-4" /> رفض
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link to="/chat"><MessageCircle className="h-4 w-4" /> مراسلة</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
            لم يتقدم أحد بعد. شارك الوظيفة لتصل لعمال أكتر.
          </div>
        )}
      </div>

      <Dialog open={!!paymentFor} onOpenChange={(o) => !o && setPaymentFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> تأكيد الدفع والقبول
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              المبلغ <strong className="text-foreground">{job?.price} جنيه</strong> هيتحجز في الـ Escrow ولا يتم تحويله للعامل إلا بعد إتمام العمل وتسجيل الـ Check-out.
            </p>
            <div className="bg-primary-soft border border-primary/20 rounded-lg p-3 text-sm">
              <div className="flex justify-between mb-1"><span>قيمة الوظيفة</span><strong>{job?.price} ج</strong></div>
              <div className="flex justify-between text-muted-foreground"><span>عمولة المنصة (٥٪)</span><span>{Math.round((job?.price ?? 0) * 0.05)} ج</span></div>
              <div className="flex justify-between mt-2 pt-2 border-t border-primary/20"><span>الإجمالي</span><strong className="text-primary">{Math.round((job?.price ?? 0) * 1.05)} ج</strong></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentFor(null)}>إلغاء</Button>
            <Button variant="accent" onClick={confirmPayment} disabled={accept.isPending}>
              {accept.isPending ? "جاري المعالجة..." : "تأكيد الدفع"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UserLayout>
  );
}
