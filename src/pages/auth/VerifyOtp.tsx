import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { authApi } from "@/api/auth";
import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/layouts/AuthLayout";
import PasswordResetSteps from "./PasswordResetSteps";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  getOtpCooldownRemaining,
  markOtpSent,
  persistResetOtp,
  RESET_EMAIL_KEY,
  RESET_OTP_KEY,
  setResetStep,
} from "@/lib/password-reset";

const OTP_LENGTH = 6;

export default function VerifyOtp() {
  const navigate = useNavigate();
  const email = localStorage.getItem(RESET_EMAIL_KEY) || "";
  const [otp, setOtp] = useState(localStorage.getItem(RESET_OTP_KEY) || "");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(getOtpCooldownRemaining());
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => setCooldown(getOtpCooldownRemaining()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (!email) return <Navigate to="/forgot-password" replace />;

  const handleVerify = () => {
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    persistResetOtp(otp);
    setResetStep(3);
    navigate("/reset-password");
  };

  const handleResend = async () => {
    const remaining = getOtpCooldownRemaining();
    if (remaining > 0) {
      const message = `Try again in ${remaining} seconds.`;
      setError(message);
      toast({ title: "Please wait", description: message, variant: "destructive" });
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
      toast({ title: "New OTP sent", description: "Use the latest code from your email." });
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not resend the code. Try again.");
      setError(message);
      toast({ title: "Could not resend OTP", description: message, variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout title="Verify OTP" subtitle={`We sent a 6-digit code to ${email}.`}>
      <PasswordResetSteps currentStep={2} />

      <div className="space-y-5">
        <div className="flex justify-center">
          <InputOTP
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={(value) => {
              setError("");
              setOtp(value.replace(/\D/g, "").slice(0, OTP_LENGTH));
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            aria-label="Password reset code"
            disabled={isResending}
          >
            <InputOTPGroup dir="ltr">
              {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Feedback>{error}</Feedback>

        <FormSubmitButton type="button" className="w-full" onClick={handleVerify} disabled={otp.length !== OTP_LENGTH}>
          Continue
        </FormSubmitButton>

        <Button type="button" variant="outline" className="w-full" onClick={handleResend} disabled={cooldown > 0 || isResending}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : isResending ? "Sending..." : "Resend OTP"}
        </Button>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Wrong email?{" "}
        <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
          Start again
        </Link>
      </p>
    </AuthLayout>
  );
}
