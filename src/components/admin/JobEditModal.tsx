import { useState, useCallback, useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormSubmitButton from "@/components/common/FormSubmitButton";
import type { Job } from "@/api/types";

const CATEGORIES = ["ضيافة وفعاليات", "تنظيف", "صيانة وتركيبات", "مطاعم", "تسويق ميداني", "تصوير", "توصيل"];
const STATUS_OPTIONS = [
  { value: "open", label: "مفتوحة" },
  { value: "in-progress", label: "قيد التنفيذ" },
  { value: "completed", label: "مكتملة" },
  { value: "cancelled", label: "ملغاة" },
];

interface FormState {
  title: string;
  price: number;
  hours: number;
  status: Job["status"];
  category: string;
  city: string;
  description: string;
  startDate: string;
}

interface FormErrors {
  title?: string;
  price?: string;
  hours?: string;
  category?: string;
  city?: string;
  description?: string;
  startDate?: string;
}

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

function validate(form: FormState, showHours: boolean, showStartDate: boolean): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim()) errors.title = "عنوان الوظيفة مطلوب";
  if (!form.category) errors.category = "اختر فئة";
  if (!form.city.trim()) errors.city = "المدينة مطلوبة";
  if (!form.description.trim()) errors.description = "الوصف مطلوب";
  if (!form.price || form.price < 50) errors.price = "الميزانية يجب أن تكون 50 جنيه على الأقل";
  if (showHours && (!form.hours || form.hours < 1)) errors.hours = "عدد الساعات يجب أن يكون 1 على الأقل";
  if (showStartDate && !form.startDate) errors.startDate = "تاريخ البدء مطلوب";
  return errors;
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
  const [form, setForm] = useState<FormState>({
    title: "", price: 0, hours: 0, status: "open", category: "", city: "", description: "", startDate: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [initial, setInitial] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const initialRef = useRef("");

  const toForm = useCallback((j: Job): FormState => ({
    title: j.title,
    price: j.price,
    hours: j.hours ?? 0,
    status: j.status,
    category: j.category ?? "",
    city: j.city ?? "",
    description: j.description ?? "",
    startDate: j.startDate ?? "",
  }), []);

  const formKey = (f: FormState) => JSON.stringify(f);

  useEffect(() => {
    if (open && job) {
      const f = toForm(job);
      setForm(f);
      const key = formKey(f);
      setInitial(key);
      initialRef.current = key;
      setErrors({});
    }
  }, [open, job, toForm]);

  const hasChanges = formKey(form) !== initialRef.current;

  const handleClose = (open: boolean) => {
    if (!open) {
      if (hasChanges) { setConfirmOpen(true); return; }
      onOpenChange(false);
    }
  };

  const handleConfirmDiscard = () => {
    setConfirmOpen(false);
    onOpenChange(false);
  };

  const handleSave = async () => {
    const validationErrors = validate(form, showHours, showStartDate);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const payload: Partial<Job> = {
      title: form.title,
      price: form.price,
      hours: form.hours,
      category: form.category,
      city: form.city,
      description: form.description,
    };
    if (showStartDate) payload.startDate = form.startDate;
    if (showStatus) payload.status = form.status;
    await onSave(payload);
  };

  const set = (field: keyof FormState, value: string | number) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof FormErrors];
        return next;
      });
    }
  };

  const renderError = (field: keyof FormErrors) => {
    if (!errors[field]) return null;
    return (
      <span className="text-xs text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3" /> {errors[field]}
      </span>
    );
  };

  return (
    <>
      <Modal open={open} onOpenChange={handleClose} title="تعديل الوظيفة" size="lg">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>عنوان الوظيفة</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
            {renderError("title")}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>الفئة</Label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="h-9 w-full px-3 rounded-md border border-border bg-background text-sm"
              >
                <option value="">اختر فئة</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {renderError("category")}
            </div>
            <div className="space-y-2">
              <Label>المدينة</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              {renderError("city")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>الميزانية (جنيه)</Label>
              <Input type="number" value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
              {renderError("price")}
            </div>
            {showHours && (
              <div className="space-y-2">
                <Label>عدد الساعات</Label>
                <Input type="number" value={form.hours} onChange={(e) => set("hours", Number(e.target.value))} />
                {renderError("hours")}
              </div>
            )}
            {showStartDate && (
              <div className="space-y-2">
                <Label>تاريخ البدء</Label>
                <Input type="date" value={form.startDate?.split("T")[0] ?? ""} onChange={(e) => set("startDate", e.target.value)} />
                {renderError("startDate")}
              </div>
            )}
            {showStatus && (
              <div className="space-y-2">
                <Label>الحالة</Label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as Job["status"])}
                  className="h-9 w-full px-3 rounded-md border border-border bg-background text-sm"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>الوصف</Label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="h-20 w-full px-3 py-2 rounded-md border border-border bg-background text-sm resize-none"
            />
            {renderError("description")}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleClose(false)}>
              إلغاء
            </Button>
            <FormSubmitButton pending={isSaving} pendingLabel="جاري الحفظ...">
              حفظ التغييرات
            </FormSubmitButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => { if (!o) setConfirmOpen(false); }}
        title="تجاهل التغييرات؟"
        description="لديك تغييرات غير محفوظة. هل تريد تجاهلها؟"
        confirmText="تجاهل"
        cancelText="العودة"
        variant="destructive"
        onConfirm={handleConfirmDiscard}
      />
    </>
  );
}
