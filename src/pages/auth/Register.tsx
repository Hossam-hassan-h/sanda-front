import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Briefcase, Shield, User } from "lucide-react";
import AuthLayout from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import PasswordInput from "@/components/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/password-reset";
import type { UserRole } from "@/api/types";

interface FormValues {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const [role, setRole] = useState<UserRole>("worker");
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>();
  const phone = watch("phone");
  const password = watch("password");

  const onSubmit = async (values: FormValues) => {
    try {
      await registerUser({ name: values.name, email: values.email, phone: values.phone, password: values.password, role });
      localStorage.setItem("account_verify_email", values.email.trim().toLowerCase());
      toast({ title: "تم إنشاء الحساب", description: "أرسلنا رمز التحقق إلى بريدك الإلكتروني." });
      navigate("/verify-email");
    } catch (error) {
      toast({
        title: "فشل إنشاء الحساب",
        description: getApiErrorMessage(error, "راجع البيانات وحاول مرة أخرى"),
        variant: "destructive",
      });
    }
  };

  return (
    <AuthLayout title="انضم لسندة" subtitle="ابدأ رحلتك في وظائف بارت-تايم بثقة">
      <RoleToggle role={role} onChange={setRole} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-4">
        <div>
          <Label htmlFor="name">الاسم بالكامل</Label>
          <Input id="name" placeholder="أحمد محمد" {...register("name", { required: "الاسم مطلوب" })} />
          {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email", { required: "البريد الإلكتروني مطلوب" })} />
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
            onChange={(value) => setValue("phone", value || "")}
          />
        </div>
        <div>
          <Label htmlFor="password">كلمة المرور</Label>
          <PasswordInput id="password" autoComplete="new-password" placeholder="٨ أحرف على الأقل" {...register("password", { required: "كلمة المرور مطلوبة", minLength: { value: 8, message: "كلمة المرور لازم تكون ٨ أحرف" } })} />
          {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
          <PasswordInput id="confirmPassword" autoComplete="new-password" {...register("confirmPassword", { required: "أعد كتابة كلمة المرور", validate: (v) => v === password || "كلمات المرور غير متطابقة" })} />
          {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full mt-2" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
        </Button>

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

function RoleToggle({ role, onChange }: { role: UserRole; onChange: (r: UserRole) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
      <button
        type="button"
        onClick={() => onChange("worker")}
        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition ${
          role === "worker" ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <User className="h-4 w-4" /> عامل
      </button>
      <button
        type="button"
        onClick={() => onChange("employer")}
        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition ${
          role === "employer" ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Briefcase className="h-4 w-4" /> صاحب عمل
      </button>
    </div>
  );
}
