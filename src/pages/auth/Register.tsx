import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Briefcase, User } from "lucide-react";
import AuthLayout from "@/layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import Feedback from "@/components/common/Feedback";
import FormSubmitButton from "@/components/common/FormSubmitButton";
import PasswordInput from "@/components/common/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import type { UserRole } from "@/api/types";

interface FormValues {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EGYPT_PHONE_PATTERN = /^\+20\d{10}$/;

export default function Register() {
  const [role, setRole] = useState<UserRole>("worker");
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });
  const phone = watch("phone");
  const password = watch("password");

  const onSubmit = async (values: FormValues) => {
    clearErrors("root");
    try {
      await registerUser({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || undefined,
        password: values.password,
        role,
      });
      toast({ title: "تم إنشاء الحساب", description: "ابدأ باستكشاف الوظائف!" });
      navigate("/jobs");
    } catch (error) {
      const message = getApiErrorMessage(error, "فشل إنشاء الحساب. حاول مرة أخرى.");
      setError("root", { message });
      toast({ title: "فشل إنشاء الحساب", description: message, variant: "destructive" });
    }
  };

  return (
    <AuthLayout title="انضم لسندة" subtitle="ابدأ رحلتك في وظائف بارت-تايم بثقة">
      <RoleToggle role={role} onChange={setRole} disabled={isSubmitting} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-4" noValidate>
        <Feedback message={errors.root?.message} />

        <div>
          <Label htmlFor="name">الاسم بالكامل</Label>
          <Input
            id="name"
            placeholder="أحمد محمد"
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...register("name", {
              required: "الاسم مطلوب",
              maxLength: { value: 100, message: "الاسم لا يزيد عن 100 حرف" },
              setValueAs: (value) => String(value).trim(),
            })}
          />
          {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email", {
              required: "البريد الإلكتروني مطلوب",
              pattern: { value: EMAIL_PATTERN, message: "اكتب بريد إلكتروني صحيح" },
              setValueAs: (value) => String(value).trim(),
            })}
          />
          {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="phone">رقم الهاتف</Label>
          <PhoneInput
            defaultCountry="EG"
            countries={["EG"]}
            id="phone"
            placeholder="01xxxxxxxxx"
            value={phone || ""}
            disabled={isSubmitting}
            aria-invalid={!!errors.phone}
            onChange={(value) => {
              setValue("phone", value || "", { shouldValidate: true, shouldDirty: true });
              if (errors.phone) clearErrors("phone");
            }}
          />
          <input
            type="hidden"
            {...register("phone", {
              validate: (value) => !value || EGYPT_PHONE_PATTERN.test(value) || "اكتب رقم هاتف مصري صحيح",
            })}
          />
          {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <Label htmlFor="password">كلمة المرور</Label>
          <PasswordInput
            id="password"
            placeholder="8 أحرف على الأقل"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password", {
              required: "كلمة المرور مطلوبة",
              minLength: { value: 8, message: "كلمة المرور لازم تكون 8 أحرف على الأقل" },
            })}
          />
          {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword", {
              required: "أعد كتابة كلمة المرور",
              validate: (value) => value === password || "كلمات المرور غير متطابقة",
            })}
          />
          {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <FormSubmitButton className="w-full mt-2" size="lg" pending={isSubmitting} pendingLabel="جاري إنشاء الحساب...">
          إنشاء حساب
        </FormSubmitButton>

        <p className="text-xs text-muted-foreground text-center mt-4">
          بإنشاء حسابك أنت توافق على{" "}
          <Link to="/terms" className="text-primary hover:underline">شروط الاستخدام</Link> و{" "}
          <Link to="/privacy" className="text-primary hover:underline">سياسة الخصوصية</Link>.
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        لديك حساب بالفعل؟{" "}
        <Link to="/login" className="text-primary font-semibold hover:underline">سجّل الدخول</Link>
      </p>
    </AuthLayout>
  );
}

function RoleToggle({ role, onChange, disabled }: { role: UserRole; onChange: (role: UserRole) => void; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl" role="radiogroup" aria-label="نوع الحساب">
      <button
        type="button"
        disabled={disabled}
        role="radio"
        aria-checked={role === "worker"}
        onClick={() => onChange("worker")}
        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition disabled:pointer-events-none disabled:opacity-60 ${
          role === "worker" ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <User className="h-4 w-4" /> عامل
      </button>
      <button
        type="button"
        disabled={disabled}
        role="radio"
        aria-checked={role === "employer"}
        onClick={() => onChange("employer")}
        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition disabled:pointer-events-none disabled:opacity-60 ${
          role === "employer" ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Briefcase className="h-4 w-4" /> صاحب عمل
      </button>
    </div>
  );
}
