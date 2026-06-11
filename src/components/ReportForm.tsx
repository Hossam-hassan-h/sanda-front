import { useState } from "react";
import { Flag, AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateReport } from "@/hooks/useReports";
import { toast } from "@/hooks/use-toast";

const PRESET_REASONS = [
  "تأخر عن الموعد",
  "لم يحضر للعمل",
  "سلوك غير لائق",
  "عدم مطابقة العمل للمواصفات",
  "احتيال أو تلاعب",
  "أخرى",
];

export interface ReportFormProps {
  reportedUserId: string;
  reportedUserName?: string;
  jobId?: string;
  trigger?: React.ReactNode;
  onReported?: () => void;
}

export default function ReportForm({
  reportedUserId,
  reportedUserName,
  jobId,
  trigger,
  onReported,
}: ReportFormProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(PRESET_REASONS[0]);
  const [details, setDetails] = useState("");

  const createReport = useCreateReport();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === "أخرى" ? details.trim() : `${reason}${details ? ` — ${details.trim()}` : ""}`;
    if (!finalReason) {
      toast({ title: "من فضلك اكتب سبب البلاغ", variant: "destructive" });
      return;
    }
    try {
      await createReport.mutateAsync({ reportedUserId, reason: finalReason, jobId });
      toast({
        title: "تم إرسال البلاغ",
        description: "فريق سندة هيراجع البلاغ في أقرب وقت.",
      });
      setOpen(false);
      setReason(PRESET_REASONS[0]);
      setDetails("");
      onReported?.();
    } catch {
      toast({ title: "فشل إرسال البلاغ", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Flag className="h-4 w-4" /> إبلاغ
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> إرسال بلاغ
          </DialogTitle>
          <DialogDescription>
            {reportedUserName
              ? `أنت على وشك الإبلاغ عن: ${reportedUserName}.`
              : "اشرح المشكلة اللي واجهتك مع هذا المستخدم."}
            <br />
            البلاغات بتتراجع من قِبَل إدارة سندة خلال ٢٤ ساعة.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reason">سبب البلاغ *</Label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PRESET_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="details">تفاصيل إضافية (اختياري)</Label>
            <Textarea
              id="details"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="اكتب أي تفاصيل تساعد فريق الدعم في المراجعة..."
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="destructive" disabled={createReport.isPending}>
              {createReport.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Flag className="h-4 w-4" />
              )}
              إرسال البلاغ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
