import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Flag } from "lucide-react";

import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useCreateReport } from "@/hooks/useReports";
import { getApiErrorMessage } from "@/lib/api-error";

const PRESET_REASONS = [
  "Late arrival",
  "No show",
  "Inappropriate behavior",
  "Work did not match requirements",
  "Fraud or manipulation",
  "Other",
];

const reportSchema = z.object({
  reason: z.string().trim().min(1, "Choose a report reason."),
  details: z.string().trim().max(1000, "Report details cannot exceed 1000 characters.").optional(),
}).superRefine((values, ctx) => {
  if (values.reason === "Other" && !values.details?.trim()) {
    ctx.addIssue({ code: "custom", path: ["details"], message: "Write the report reason." });
  }
});

type ReportValues = z.infer<typeof reportSchema>;

export interface ReportFormProps {
  reportedUserId: string;
  reportedUserName?: string;
  jobId?: string;
  assignmentId?: string;
  trigger?: React.ReactNode;
  onReported?: () => void;
}

export default function ReportForm({
  reportedUserId,
  reportedUserName,
  jobId,
  assignmentId,
  trigger,
  onReported,
}: ReportFormProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const createReport = useCreateReport();
  const form = useForm<ReportValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reason: PRESET_REASONS[0], details: "" },
  });
  const { register, handleSubmit, reset, watch, formState: { errors } } = form;

  const onSubmit = async (values: ReportValues) => {
    if (createReport.isPending) return;
    setError("");
    const details = values.details?.trim();
    const finalReason = values.reason === "Other" ? details || "" : `${values.reason}${details ? ` - ${details}` : ""}`;

    try {
      await createReport.mutateAsync({ reportedUserId, reason: finalReason, jobId, assignmentId });
      toast({ title: "Report submitted", description: "The Sanda team will review it soon." });
      reset({ reason: PRESET_REASONS[0], details: "" });
      setOpen(false);
      onReported?.();
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not submit the report. Please try again.");
      setError(message);
      toast({ title: "Report failed", description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!createReport.isPending) setOpen(nextOpen);
    }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="sm">
            <Flag className="h-4 w-4" /> Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Submit report
          </DialogTitle>
          <DialogDescription>
            {reportedUserName
              ? `You are reporting ${reportedUserName}.`
              : "Describe the issue you had with this user."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <select
              id="reason"
              disabled={createReport.isPending}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("reason")}
            >
              {PRESET_REASONS.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
            <Feedback className="mt-1 justify-start text-start">{errors.reason?.message}</Feedback>
          </div>

          <div>
            <Label htmlFor="details">{watch("reason") === "Other" ? "Details" : "Additional details"}</Label>
            <Textarea
              id="details"
              rows={4}
              maxLength={1000}
              disabled={createReport.isPending}
              placeholder="Add any details that help the support team review the report..."
              {...register("details")}
            />
            <Feedback className="mt-1 justify-start text-start">{errors.details?.message}</Feedback>
          </div>

          <Feedback>{error}</Feedback>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={createReport.isPending}>
              Cancel
            </Button>
            <FormSubmitButton variant="destructive" isPending={createReport.isPending} loadingText="Submitting...">
              <Flag className="h-4 w-4" />
              Submit report
            </FormSubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
