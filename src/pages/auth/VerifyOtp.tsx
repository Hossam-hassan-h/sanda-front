import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import PasswordResetSteps from "./PasswordResetSteps";
import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import {
  getApiErrorMessage,
  getOtpCooldownRemaining,
  markOtpSent,
  persistResetOtp,
  RESET_EMAIL_KEY,
  RESET_OTP_KEY,
  setResetStep,
} from "@/lib/password-reset";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const email = localStorage.getItem(RESET_EMAIL_KEY) || "";
  const [otp, setOtp] = useState(localStorage.getItem(RESET_OTP_KEY) || "");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(getOtpCooldownRemaining());
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCooldown(getOtpCooldownRemaining());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  const handleVerify = () => {
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("اكتب الرمز المكون من 6 أرقام من بريدك الإلكتروني.");
      return;
    }

    persistResetOtp(otp);
    setResetStep(3);
    navigate("/reset-password");
  };

  const handleResend = async () => {
    const remaining = getOtpCooldownRemaining();
    if (remaining > 0) {
      const message = `يرجى الانتظار ${remaining} ثانية قبل طلب رمز جديد`;
      setError(message);
      toast({ title: "انتظر قليلًا", description: message, variant: "destructive" });
      return;
    }

    setIsResending(true);
    setError("");
    setOtp("");
    localStorage.removeItem(RESET_OTP_KEY);

    try {
      await authApi.forgotPassword({ email });
      markOtpSent();
      setCooldown(getOtpCooldownRemaining());
      toast({ title: "تم إرسال رمز جديد", description: "استخدم آخر رمز وصل إلى بريدك الإلكتروني." });
    } catch (error) {
      setError(getApiErrorMessage(error, "حدث خطأ في الاتصال. حاول مرة أخرى."));
      toast({
        title: "تعذر إعادة إرسال الرمز",
        description: getApiErrorMessage(error, "حدث خطأ في الاتصال. حاول مرة أخرى."),
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout title="تأكيد الرمز" subtitle={`أرسلنا رمزًا مكونًا من 6 أرقام إلى ${email}.`}>
      <PasswordResetSteps currentStep={2} />

      <div className="space-y-5">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => {
              setError("");
              setOtp(value);
            }}
            inputMode="numeric"
            pattern="[0-9]*"
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        <Button type="button" className="w-full" onClick={handleVerify} disabled={otp.length !== 6}>
          متابعة
        </Button>

        <Button type="button" variant="outline" className="w-full" onClick={handleResend} disabled={cooldown > 0 || isResending}>
          {cooldown > 0 ? `إعادة الإرسال خلال ${cooldown}ث` : isResending ? "جاري الإرسال..." : "إعادة إرسال الرمز"}
        </Button>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        البريد غير صحيح؟{" "}
        <Link to="/forgot-password" className="font-semibold text-primary hover:underline">ابدأ من جديد</Link>
      </p>
    </AuthLayout>
  );
}
