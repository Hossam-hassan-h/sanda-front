import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import AuthLayout from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/password-reset";

interface FormValues { email: string; password: string }
interface LocationState { from?: { pathname?: string } }

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    try {
      const u = await login(values);
      toast({ title: "أهلاً بعودتك!", description: u.name });
      const from = (location.state as LocationState | null)?.from?.pathname || "/jobs";
      navigate(from, { replace: true });
    } catch (error) {
      toast({
        title: "فشل تسجيل الدخول",
        description: getApiErrorMessage(error, "تحقق من البيانات"),
        variant: "destructive",
      });
    }
  };

  return (
    <AuthLayout title="مرحباً بعودتك" subtitle="ادخل لحسابك على سندة">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-4">
        <div>
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email", { required: "البريد الإلكتروني مطلوب" })}
          />
          {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">كلمة المرور</Label>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">نسيت كلمة المرور؟</Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register("password", { required: "كلمة المرور مطلوبة" })}
          />
          {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full mt-2" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "جاري الدخول..." : "تسجيل الدخول"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        ليس لديك حساب؟{" "}
        <Link to="/register" className="text-primary font-semibold hover:underline">أنشئ حساب جديد</Link>
      </p>
    </AuthLayout>
  );
}
