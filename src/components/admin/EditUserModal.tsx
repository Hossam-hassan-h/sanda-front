import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PhoneInput from "react-phone-number-input/input";
import type { User } from "@/api/types";

interface EditUserForm {
  name: string;
  phone: string;
  email: string;
  role: User["role"];
  city: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Pick<User, "name" | "phone" | "email" | "role" | "city"> | null;
  onSave: (data: EditUserForm) => Promise<void>;
  isSaving: boolean;
}

function validate(form: EditUserForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "الاسم مطلوب";
  if (!form.email.trim()) {
    errors.email = "البريد الإلكتروني مطلوب";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "البريد الإلكتروني غير صالح";
  }
  return errors;
}

export default function EditUserModal({ open, onOpenChange, user, onSave, isSaving }: EditUserModalProps) {
  const [form, setForm] = useState<EditUserForm>({ name: "", phone: "", email: "", role: "worker", city: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const initialRef = useRef("");

  const toForm = useCallback((u: NonNullable<typeof user>): EditUserForm => ({
    name: u.name,
    phone: u.phone ?? "",
    email: u.email,
    role: u.role,
    city: u.city ?? "",
  }), []);

  useEffect(() => {
    if (open && user) {
      const f = toForm(user);
      setForm(f);
      initialRef.current = JSON.stringify(f);
      setErrors({});
    }
  }, [open, user, toForm]);

  const hasChanges = JSON.stringify(form) !== initialRef.current;

  const handleClose = (open: boolean) => {
    if (!open) {
      if (hasChanges) { setConfirmOpen(true); return; }
      onOpenChange(false);
    }
  };

  const handleSave = async () => {
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    await onSave(form);
  };

  const set = (field: keyof EditUserForm, value: string) => {
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
      <Modal open={open} onOpenChange={handleClose} title="تعديل المستخدم" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الاسم</label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="اسم المستخدم" />
            {renderError("name")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
            <PhoneInput
              defaultCountry="EG"
              countries={["EG"]}
              value={form.phone}
              onChange={(value) => set("phone", value || "")}
              placeholder="01xxxxxxxxx"
            />
            {renderError("phone")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="user@example.com" className="ltr text-end" />
            {renderError("email")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">النوع</label>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value as User["role"])}
              className="h-10 px-3 rounded-md border border-border bg-background text-sm w-full"
            >
              <option value="worker">عامل</option>
              <option value="employer">صاحب عمل</option>
              <option value="admin">مسؤول</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">المدينة</label>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="المدينة" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { if (hasChanges) { setConfirmOpen(true); return; } onOpenChange(false); }}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
              حفظ التغييرات
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmOpen} onOpenChange={setConfirmOpen} title="تجاهل التغييرات؟" size="sm">
        <p className="text-sm text-muted-foreground mb-4">لديك تغييرات غير محفوظة. هل تريد تجاهلها؟</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>العودة</Button>
          <Button variant="destructive" onClick={() => { setConfirmOpen(false); onOpenChange(false); }}>تجاهل</Button>
        </div>
      </Modal>
    </>
  );
}
