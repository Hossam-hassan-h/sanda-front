import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PhoneInput from "react-phone-number-input/input";

import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { User } from "@/api/types";
import { getApiErrorMessage } from "@/lib/api-error";

const editUserSchema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب").max(100, "الاسم طويل جدًا"),
  phone: z.string().trim().optional(),
  email: z.string().trim().min(1, "البريد الإلكتروني مطلوب").email("البريد الإلكتروني غير صالح"),
  role: z.enum(["worker", "employer", "admin"]),
  city: z.string().trim().max(200, "المدينة طويلة جدًا").optional(),
});

type EditUserForm = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Pick<User, "name" | "phone" | "email" | "role" | "city"> | null;
  onSave: (data: EditUserForm) => Promise<void>;
  isSaving: boolean;
}

export default function EditUserModal({ open, onOpenChange, user, onSave, isSaving }: EditUserModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: "", phone: "", email: "", role: "worker", city: "" },
  });
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isDirty } } = form;

  useEffect(() => {
    if (!open || !user) return;
    reset({
      name: user.name ?? "",
      phone: user.phone ?? "",
      email: user.email ?? "",
      role: user.role,
      city: user.city ?? "",
    });
    setError("");
  }, [open, reset, user]);

  const handleClose = (nextOpen: boolean) => {
    if (isSaving) return;
    if (!nextOpen && isDirty) {
      setConfirmOpen(true);
      return;
    }
    onOpenChange(nextOpen);
  };

  const submit = async (values: EditUserForm) => {
    if (isSaving) return;
    setError("");
    try {
      await onSave({
        ...values,
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || "",
        city: values.city?.trim() || "",
      });
      reset(values);
    } catch (err) {
      setError(getApiErrorMessage(err, "تعذر حفظ بيانات المستخدم. حاول مرة أخرى."));
    }
  };

  return (
    <>
      <Modal open={open} onOpenChange={handleClose} title="تعديل المستخدم" size="md">
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="admin-user-name" className="mb-1 block text-sm font-medium">الاسم</label>
            <Input id="admin-user-name" disabled={isSaving} aria-invalid={!!errors.name} {...register("name")} />
            <Feedback className="mt-1 justify-start text-start">{errors.name?.message}</Feedback>
          </div>

          <div>
            <label htmlFor="admin-user-phone" className="mb-1 block text-sm font-medium">رقم الهاتف</label>
            <PhoneInput
              id="admin-user-phone"
              defaultCountry="EG"
              countries={["EG"]}
              value={watch("phone") || ""}
              onChange={(value) => setValue("phone", value || "", { shouldDirty: true, shouldValidate: true })}
              placeholder="01xxxxxxxxx"
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Feedback className="mt-1 justify-start text-start">{errors.phone?.message}</Feedback>
          </div>

          <div>
            <label htmlFor="admin-user-email" className="mb-1 block text-sm font-medium">البريد الإلكتروني</label>
            <Input id="admin-user-email" type="email" disabled={isSaving} aria-invalid={!!errors.email} className="ltr text-end" {...register("email")} />
            <Feedback className="mt-1 justify-start text-start">{errors.email?.message}</Feedback>
          </div>

          <div>
            <label htmlFor="admin-user-role" className="mb-1 block text-sm font-medium">النوع</label>
            <select
              id="admin-user-role"
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              {...register("role")}
            >
              <option value="worker">عامل</option>
              <option value="employer">صاحب عمل</option>
              <option value="admin">مسؤول</option>
            </select>
          </div>

          <div>
            <label htmlFor="admin-user-city" className="mb-1 block text-sm font-medium">المدينة</label>
            <Input id="admin-user-city" disabled={isSaving} aria-invalid={!!errors.city} {...register("city")} />
            <Feedback className="mt-1 justify-start text-start">{errors.city?.message}</Feedback>
          </div>

          <Feedback>{error}</Feedback>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isSaving}>
              إلغاء
            </Button>
            <FormSubmitButton isPending={isSaving} loadingText="جاري الحفظ...">
              حفظ التغييرات
            </FormSubmitButton>
          </div>
        </form>
      </Modal>

      <Modal open={confirmOpen} onOpenChange={setConfirmOpen} title="تجاهل التغييرات؟" size="sm">
        <p className="mb-4 text-sm text-muted-foreground">لديك تغييرات غير محفوظة. هل تريد تجاهلها؟</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>العودة</Button>
          <Button type="button" variant="destructive" onClick={() => { setConfirmOpen(false); onOpenChange(false); }}>تجاهل</Button>
        </div>
      </Modal>
    </>
  );
}
