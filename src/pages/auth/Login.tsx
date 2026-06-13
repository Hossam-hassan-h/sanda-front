import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import AuthLayout from "@/layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Feedback from "@/components/common/Feedback";
import FormSubmitButton from "@/components/common/FormSubmitButton";
import PasswordInput from "@/components/common/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

interface FormValues {
  email: string;
  password: string;
}

interface LocationState {
  from?: { pathname?: string };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { email: "", password: "" } });

  const onSubmit = async (values: FormValues) => {
    clearErrors("root");
    try {
      const user = await login({ email: values.email.trim(), password: values.password });
      toast({ title: "أهلا بعودتك!", description: user.name });
      const from = (location.state as LocationState | null)?.from?.pathname || "/jobs";
      navigate(from, { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error, "تحقق من البريد الإلكتروني وكلمة المرور.");
      setError("root", { message });
      toast({ title: "فشل تسجيل الدخول", description: message, variant: "destructive" });
    }
  };

  return (
    <AuthLayout title="مرحبا بعودتك" subtitle="ادخل لحسابك على سندة">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-4" noValidate>
        <Feedback message={errors.root?.message} />

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
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">كلمة المرور</Label>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password", { required: "كلمة المرور مطلوبة" })}
          />
          {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
        </div>

        <FormSubmitButton className="w-full mt-2" size="lg" pending={isSubmitting} pendingLabel="جاري الدخول...">
          تسجيل الدخول
        </FormSubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        ليس لديك حساب؟{" "}
        <Link to="/register" className="text-primary font-semibold hover:underline">
          أنشئ حساب جديد
        </Link>
      </p>
    </AuthLayout>
  );
}
