import { useState } from "react";
import { CreditCard, ShieldCheck, Landmark, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { paymentService } from "@/lib/payment";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
  amount: number;
  onSuccess?: () => void;
}

export default function PaymentModal({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  amount,
  onSuccess,
}: PaymentModalProps) {
  const [gateway, setGateway] = useState<"stripe" | "paymob">("stripe");
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [paymentStep, setPaymentStep] = useState<"select" | "card" | "success">("select");

  const handlePayInit = async () => {
    setLoading(true);
    try {
      await paymentService.createPaymentSession({ amount, jobId, gateway });
      setPaymentStep("card");
    } catch {
      toast({
        title: "خطأ",
        description: "فشل في إطلاق جلسة الدفع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Simulate verifying payment
      await paymentService.verifyPayment("pay_mock_" + Date.now());
      setPaymentStep("success");
      toast({
        title: "تم الدفع بنجاح",
        description: `تم إيداع مبلغ ${amount} جنيه في حساب الضمان (Escrow).`,
      });
      onSuccess?.();
    } catch {
      toast({
        title: "خطأ في الدفع",
        description: "يرجى التحقق من بيانات بطاقتك والمحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center font-bold text-lg flex items-center gap-2 justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
            تأمين مبلغ الوظيفة (Escrow)
          </DialogTitle>
        </DialogHeader>

        {paymentStep === "select" && (
          <div className="space-y-4 py-3 text-right">
            <div className="bg-muted/40 p-4 rounded-xl space-y-1">
              <span className="text-xs text-muted-foreground">الوظيفة:</span>
              <p className="font-semibold text-foreground">{jobTitle}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                <span className="text-sm font-semibold">المبلغ المطلوب تأمينه:</span>
                <span className="text-lg font-black text-primary">{amount} جنيه</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">اختر وسيلة الدفع</label>
              <RadioGroup
                defaultValue="stripe"
                value={gateway}
                onValueChange={(val) => setGateway(val as "stripe" | "paymob")}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <RadioGroupItem value="stripe" id="stripe" className="peer sr-only" />
                  <Label
                    htmlFor="stripe"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <CreditCard className="mb-2 h-6 w-6 text-primary" />
                    <span>البطاقات الائتمانية (Stripe)</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="paymob" id="paymob" className="peer sr-only" />
                  <Label
                    htmlFor="paymob"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Landmark className="mb-2 h-6 w-6 text-primary" />
                    <span>محافظ الهاتف (Paymob)</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={handlePayInit} className="w-full mt-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              متابعة للدفع الآمن
            </Button>
          </div>
        )}

        {paymentStep === "card" && (
          <form onSubmit={handlePayComplete} className="space-y-4 py-3 text-right">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">رقم البطاقة</Label>
              <Input
                type="text"
                placeholder="4000 1234 5678 9010"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
                className="text-left font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">تاريخ الانتهاء</Label>
                <Input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  required
                  className="text-left font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">CVC</Label>
                <Input
                  type="password"
                  placeholder="***"
                  maxLength={3}
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  required
                  className="text-left font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>مبلغك مؤمن بالكامل في حساب الضمان، وسيتم نقله للمنفذ فور انتهاء العمل وتأكيد الانصراف.</span>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              تأكيد ودفع {amount} جنيه
            </Button>
          </form>
        )}

        {paymentStep === "success" && (
          <div className="text-center py-6 space-y-4 text-right">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-600 animate-bounce" />
            </div>
            <div className="space-y-1 text-center">
              <h3 className="text-lg font-bold text-foreground">تمت العملية بنجاح</h3>
              <p className="text-sm text-muted-foreground">تم حجز قيمة الوظيفة في حساب الضمان سندة.</p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              حسناً
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
