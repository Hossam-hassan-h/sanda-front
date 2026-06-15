import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Job } from "@/api/types";
import { getApiErrorMessage } from "@/lib/api-error";

const CATEGORIES = ["ضيافة وفعاليات", "تنظيف", "صيانة وتركيبات", "مطاعم", "تسويق ميداني", "تصوير", "توصيل"];
const STATUS_OPTIONS: Array<{ value: Job["status"]; label: string }> = [
  { value: "open", label: "مفتوحة" },
  { value: "in-progress", label: "قيد التنفيذ" },
  { value: "completed", label: "مكتملة" },
  { value: "cancelled", label: "ملغاة" },
];

const jobEditSchema = z.object({
  title: z.string().trim().min(1, "عنوان الوظيفة مطلوب").max(150, "العنوان طويل جدًا"),
  price: z.coerce.number({ message: "أدخل ميزانية صحيحة" }).min(0, "الميزانية لا يمكن أن تكون سالبة"),
  hours: z.coerce.number({ message: "أدخل عدد ساعات صحيح" }).min(0, "عدد الساعات لا يمكن أن يكون سالبًا"),
  status: z.enum(["open", "in-progress", "completed", "cancelled"]),
  category: z.string().trim().min(1, "اختر فئة"),
  city: z.string().trim().min(1, "المدينة مطلوبة").max(250, "المدينة طويلة جدًا"),
  description: z.string().trim().min(1, "الوصف مطلوب").max(3000, "الوصف طويل جدًا"),
  startDate: z.string().optional(),
});

type FormState = z.infer<typeof jobEditSchema>;

interface JobEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onSave: (formData: Partial<Job>) => Promise<void>;
  isSaving: boolean;
  showHours?: boolean;
  showStartDate?: boolean;
  showStatus?: boolean;
}

export default function JobEditModal({
  open,
  onOpenChange,
  job,
  onSave,
  isSaving,
  showHours = false,
  showStartDate = false,
  showStatus = false,
}: JobEditModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<FormState>({
    resolver: zodResolver(jobEditSchema),
    defaultValues: {
      title: "",
      price: 0,
      hours: 0,
      status: "open",
      category: "",
      city: "",
      description: "",
      startDate: "",
    },
  });
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = form;

  useEffect(() => {
    if (!open || !job) return;
    reset({
      title: job.title ?? "",
      price: job.price ?? 0,
      hours: job.hours ?? 0,
      status: job.status,
      category: job.category ?? "",
      city: job.city ?? "",
      description: job.description ?? "",
      startDate: job.startDate?.split("T")[0] ?? "",
    });
    setError("");
  }, [open, job, reset]);

  const handleClose = (nextOpen: boolean) => {
    if (isSaving) return;
    if (!nextOpen && isDirty) {
      setConfirmOpen(true);
      return;
    }
    onOpenChange(nextOpen);
  };

  const submit = async (values: FormState) => {
    if (isSaving) return;
    setError("");
    if (showHours && values.hours < 1) {
      setError("عدد الساعات يجب أن يكون 1 على الأقل");
      return;
    }
    if (showStartDate && !values.startDate) {
      setError("تاريخ البدء مطلوب");
      return;
    }

    const payload: Partial<Job> = {
      title: values.title.trim(),
      price: values.price,
      category: values.category,
      city: values.city.trim(),
      description: values.description.trim(),
    };
    if (showHours) payload.hours = values.hours;
    if (showStartDate) payload.startDate = values.startDate;
    if (showStatus) payload.status = values.status;

    try {
      await onSave(payload);
      reset(values);
    } catch (err) {
      setError(getApiErrorMessage(err, "تعذر حفظ الوظيفة. حاول مرة أخرى."));
    }
  };

  return (
    <>
      <Modal open={open} onOpenChange={handleClose} title="تعديل الوظيفة" size="lg">
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="admin-job-title">عنوان الوظيفة</Label>
            <Input id="admin-job-title" disabled={isSaving} aria-invalid={!!errors.title} {...register("title")} />
            <Feedback className="mt-1 justify-start text-start">{errors.title?.message}</Feedback>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-job-category">الفئة</Label>
              <select id="admin-job-category" disabled={isSaving} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm" {...register("category")}>
                <option value="">اختر فئة</option>
                {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <Feedback className="mt-1 justify-start text-start">{errors.category?.message}</Feedback>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-job-city">المدينة</Label>
              <Input id="admin-job-city" disabled={isSaving} aria-invalid={!!errors.city} {...register("city")} />
              <Feedback className="mt-1 justify-start text-start">{errors.city?.message}</Feedback>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-job-price">الميزانية (جنيه)</Label>
              <Input id="admin-job-price" type="number" min={0} disabled={isSaving} aria-invalid={!!errors.price} {...register("price")} />
              <Feedback className="mt-1 justify-start text-start">{errors.price?.message}</Feedback>
            </div>
            {showHours && (
              <div className="space-y-2">
                <Label htmlFor="admin-job-hours">عدد الساعات</Label>
                <Input id="admin-job-hours" type="number" min={1} disabled={isSaving} aria-invalid={!!errors.hours} {...register("hours")} />
                <Feedback className="mt-1 justify-start text-start">{errors.hours?.message}</Feedback>
              </div>
            )}
            {showStartDate && (
              <div className="space-y-2">
                <Label htmlFor="admin-job-start-date">تاريخ البدء</Label>
                <Input id="admin-job-start-date" type="date" disabled={isSaving} aria-invalid={!!errors.startDate} {...register("startDate")} />
                <Feedback className="mt-1 justify-start text-start">{errors.startDate?.message}</Feedback>
              </div>
            )}
            {showStatus && (
              <div className="space-y-2">
                <Label htmlFor="admin-job-status">الحالة</Label>
                <select id="admin-job-status" disabled={isSaving} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm" {...register("status")}>
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-job-description">الوصف</Label>
            <textarea
              id="admin-job-description"
              disabled={isSaving}
              aria-invalid={!!errors.description}
              className="h-20 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...register("description")}
            />
            <Feedback className="mt-1 justify-start text-start">{errors.description?.message}</Feedback>
          </div>

          <Feedback>{error}</Feedback>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isSaving}>
              إلغاء
            </Button>
            <FormSubmitButton isPending={isSaving} loadingText="جاري الحفظ...">
              حفظ التغييرات
            </FormSubmitButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(nextOpen) => { if (!nextOpen) setConfirmOpen(false); }}
        title="تجاهل التغييرات؟"
        description="لديك تغييرات غير محفوظة. هل تريد تجاهلها؟"
        confirmText="تجاهل"
        cancelText="العودة"
        variant="destructive"
        onConfirm={() => { setConfirmOpen(false); onOpenChange(false); }}
      />
    </>
  );
}
