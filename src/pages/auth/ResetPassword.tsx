import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import AuthLayout from "@/layouts/AuthLayout";
import PasswordResetSteps from "./PasswordResetSteps";
import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/PasswordInput";
import { toast } from "@/hooks/use-toast";
import {
  clearResetFlow,
  getApiErrorMessage,
  RESET_EMAIL_KEY,
  RESET_OTP_KEY,
} from "@/lib/password-reset";

interface FormValues {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const email = localStorage.getItem(RESET_EMAIL_KEY) || "";
  const otp = localStorage.getItem(RESET_OTP_KEY) || "";
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>();

  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  if (!otp) {
    return <Navigate to="/verify-otp" replace />;
  }

  const onSubmit = async (values: FormValues) => {
    try {
      await authApi.resetPassword({
        email,
        otp,
        newPassword: values.newPassword,
      });

      clearResetFlow();
      toast({ title: "تم تغيير كلمة المرور", description: "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة." });
      navigate("/login", { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error, "حدث خطأ في الاتصال. حاول مرة أخرى.");
      toast({
        title: message.toLowerCase().includes("expired") ? "انتهت صلاحية الرمز" : "رمز غير صحيح",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthLayout title="إعادة تعيين كلمة المرور" subtitle="أنشئ كلمة مرور جديدة لحسابك.">
      <PasswordResetSteps currentStep={3} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            placeholder="٨ أحرف على الأقل"
            {...register("newPassword", {
              required: "كلمة المرور الجديدة مطلوبة",
              minLength: { value: 8, message: "كلمة المرور يجب أن تكون ٨ أحرف على الأقل" },
            })}
          />
          {errors.newPassword && <p className="mt-1 text-sm text-destructive">{errors.newPassword.message}</p>}
        </div>

        <div>
          <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="أعد كتابة كلمة المرور"
            {...register("confirmPassword", {
              required: "تأكيد كلمة المرور مطلوب",
              validate: (value) => value === watch("newPassword") || "كلمتا المرور غير متطابقتين",
            })}
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "جاري التحديث..." : "تغيير كلمة المرور"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        تحتاج رمزًا جديدًا؟{" "}
        <Link to="/verify-otp" className="font-semibold text-primary hover:underline">العودة إلى الرمز</Link>
      </p>
    </AuthLayout>
  );
}
