import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Briefcase, Shield, User } from "lucide-react";
import AuthLayout from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { UserRole } from "@/api/types";

interface FormValues { phone: string; password: string }
interface LocationState { from?: { pathname?: string } }

export default function Login() {
  const [role, setRole] = useState<UserRole>("worker");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    try {
      const u = await login({ ...values, role });
      toast({ title: "أهلاً بعودتك!", description: u.name });
      const from = (location.state as LocationState | null)?.from?.pathname || "/jobs";
      navigate(from, { replace: true });
    } catch {
      toast({ title: "فشل تسجيل الدخول", description: "تحقق من البيانات", variant: "destructive" });
    }
  };

  return (
    <AuthLayout title="مرحباً بعودتك" subtitle="ادخل لحسابك على سندة">
      <RoleToggle role={role} onChange={setRole} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
        <div>
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="01xxxxxxxxx"
            {...register("phone", { required: "رقم الهاتف مطلوب" })}
          />
          {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">كلمة المرور</Label>
            <Link to="#" className="text-sm text-primary hover:underline">نسيت كلمة المرور؟</Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register("password", { required: "كلمة المرور مطلوبة" })}
          />
          {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "جاري الدخول..." : "تسجيل الدخول"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        ليس لديك حساب؟{" "}
        <Link to="/register" className="text-primary font-semibold hover:underline">أنشئ حساب جديد</Link>
      </p>
    </AuthLayout>
  );
}

export function RoleToggle({ role, onChange }: { role: UserRole; onChange: (r: UserRole) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-xl">
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
      <button
        type="button"
        onClick={() => onChange("admin")}
        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition ${
          role === "admin" ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Shield className="h-4 w-4" /> مدير
      </button>
    </div>
  );
}