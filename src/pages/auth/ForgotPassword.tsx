import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import AuthLayout from "@/layouts/AuthLayout";
import PasswordResetSteps from "./PasswordResetSteps";
import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  getApiErrorMessage,
  getOtpCooldownRemaining,
  markOtpSent,
  persistResetEmail,
  setResetStep,
} from "@/lib/password-reset";

interface FormValues {
  email: string;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [cooldown, setCooldown] = useState(getOtpCooldownRemaining());
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCooldown(getOtpCooldownRemaining());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const onSubmit = async (values: FormValues) => {
    const remaining = getOtpCooldownRemaining();
    if (remaining > 0) {
      toast({
        title: "انتظر قليلًا",
        description: `يرجى الانتظار ${remaining} ثانية قبل طلب رمز جديد`,
        variant: "destructive",
      });
      setCooldown(remaining);
      return;
    }

    try {
      await authApi.forgotPassword({ email: values.email });
      persistResetEmail(values.email);
      localStorage.removeItem("password_reset_otp");
      setResetStep(2);
      markOtpSent();
      setCooldown(getOtpCooldownRemaining());
      toast({ title: "تم إرسال الرمز", description: "راجع بريدك الإلكتروني للحصول على الرمز المكون من 6 أرقام." });
      navigate("/verify-otp");
    } catch (error) {
      toast({
        title: "تعذر إرسال الرمز",
        description: getApiErrorMessage(error, "حدث خطأ في الاتصال. حاول مرة أخرى."),
        variant: "destructive",
      });
    }
  };

  return (
    <AuthLayout title="نسيت كلمة المرور" subtitle="اكتب بريدك الإلكتروني لاستلام رمز آمن لإعادة التعيين.">
      <PasswordResetSteps currentStep={1} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email", {
              required: "البريد الإلكتروني مطلوب",
              pattern: { value: /^\S+@\S+\.\S+$/, message: "اكتب بريدًا إلكترونيًا صحيحًا" },
            })}
          />
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || cooldown > 0}>
          {cooldown > 0 ? `انتظر ${cooldown}ث` : isSubmitting ? "جاري الإرسال..." : "إرسال الرمز"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        تذكرت كلمة المرور؟{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">العودة لتسجيل الدخول</Link>
      </p>
    </AuthLayout>
  );
}
