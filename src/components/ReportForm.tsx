import { useState } from "react";
import { Flag, AlertTriangle } from "lucide-react";
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
import Feedback from "@/components/common/Feedback";
import FormSubmitButton from "@/components/common/FormSubmitButton";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

const PRESET_REASONS = [
  "تأخر عن الموعد",
  "لم يحضر للعمل",
  "سلوك غير لائق",
  "عدم مطابقة العمل للمواصفات",
  "احتيال أو تلاعب",
  "أخرى",
];

const MAX_REPORT_LENGTH = 1000;

export interface ReportFormProps {
  reportedUserId: string;
  reportedUserName?: string;
  jobId?: string;
  trigger?: React.ReactNode;
  onReported?: () => void;
}

export default function ReportForm({ reportedUserId, reportedUserName, jobId, trigger, onReported }: ReportFormProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(PRESET_REASONS[0]);
  const [details, setDetails] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const createReport = useCreateReport();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedDetails = details.trim();
    const finalReason = reason === "أخرى" ? trimmedDetails : `${reason}${trimmedDetails ? ` — ${trimmedDetails}` : ""}`;

    if (!finalReason.trim()) {
      setFormError("من فضلك اكتب سبب البلاغ.");
      return;
    }
    if (finalReason.length > MAX_REPORT_LENGTH) {
      setFormError("سبب البلاغ لا يمكن أن يزيد عن 1000 حرف.");
      return;
    }

    try {
      await createReport.mutateAsync({ reportedUserId, reason: finalReason, jobId });
      toast({ title: "تم إرسال البلاغ", description: "فريق سندة سيراجع البلاغ في أقرب وقت." });
      setOpen(false);
      setReason(PRESET_REASONS[0]);
      setDetails("");
      onReported?.();
    } catch (error) {
      const message = getApiErrorMessage(error, "فشل إرسال البلاغ.");
      setFormError(message);
      toast({ title: "فشل إرسال البلاغ", description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="sm">
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
            {reportedUserName ? `أنت على وشك الإبلاغ عن: ${reportedUserName}.` : "اشرح المشكلة التي واجهتك مع هذا المستخدم."}
            <br />
            البلاغات تتم مراجعتها من قبل إدارة سندة خلال 24 ساعة.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Feedback message={formError} />
          <div>
            <Label htmlFor="reason">سبب البلاغ *</Label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={createReport.isPending}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {PRESET_REASONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="details">تفاصيل إضافية {reason === "أخرى" ? "*" : "(اختياري)"}</Label>
            <Textarea
              id="details"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={MAX_REPORT_LENGTH}
              disabled={createReport.isPending}
              placeholder="اكتب أي تفاصيل تساعد فريق الدعم في المراجعة..."
            />
            <div className="text-xs text-muted-foreground text-end mt-1">{details.length}/{MAX_REPORT_LENGTH}</div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={createReport.isPending}>
              إلغاء
            </Button>
            <FormSubmitButton variant="destructive" pending={createReport.isPending} pendingLabel="جاري الإرسال...">
              <Flag className="h-4 w-4" />
              إرسال البلاغ
            </FormSubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
