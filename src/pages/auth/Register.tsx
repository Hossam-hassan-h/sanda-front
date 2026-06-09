import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import AuthLayout from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { RoleToggle } from "./Login";
import type { UserRole } from "@/api/types";

interface FormValues {
  name: string;
  phone: string;
  email?: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const [role, setRole] = useState<UserRole>("worker");
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>();
  const password = watch("password");

  const onSubmit = async (values: FormValues) => {
    try {
      await registerUser({ name: values.name, phone: values.phone, email: values.email, password: values.password, role });
      toast({ title: "تم إنشاء الحساب", description: "ابدأ باستكشاف الوظائف!" });
      navigate("/jobs");
    } catch {
      toast({ title: "فشل إنشاء الحساب", variant: "destructive" });
    }
  };

  return (
    <AuthLayout title="انضم لسندة" subtitle="ابدأ رحلتك في وظائف بارت-تايم بثقة">
      <RoleToggle role={role} onChange={setRole} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
        <div>
          <Label htmlFor="name">الاسم بالكامل</Label>
          <Input id="name" placeholder="أحمد محمد" {...register("name", { required: "الاسم مطلوب" })} />
          {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input id="phone" type="tel" placeholder="01xxxxxxxxx" {...register("phone", { required: "رقم الهاتف مطلوب" })} />
          {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
        </div>
        <div>
          <Label htmlFor="password">كلمة المرور</Label>
          <Input id="password" type="password" placeholder="٨ أحرف على الأقل" {...register("password", { required: "كلمة المرور مطلوبة", minLength: { value: 8, message: "كلمة المرور لازم تكون ٨ أحرف" } })} />
          {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
          <Input id="confirmPassword" type="password" {...register("confirmPassword", { required: "أعد كتابة كلمة المرور", validate: (v) => v === password || "كلمات المرور غير متطابقة" })} />
          {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          بإنشاء حسابك أنت توافق على{" "}
          <Link to="#" className="text-primary hover:underline">شروط الاستخدام</Link> و{" "}
          <Link to="#" className="text-primary hover:underline">سياسة الخصوصية</Link>.
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        لديك حساب بالفعل؟{" "}
        <Link to="/login" className="text-primary font-semibold hover:underline">سجّل الدخول</Link>
      </p>
    </AuthLayout>
  );
}
