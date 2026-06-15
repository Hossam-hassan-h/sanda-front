import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { authApi } from "@/api/auth";
import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/layouts/AuthLayout";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";

const ACCOUNT_VERIFY_EMAIL_KEY = "account_verify_email";
const OTP_LENGTH = 6;

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const email = localStorage.getItem(ACCOUNT_VERIFY_EMAIL_KEY) || "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!email) return <Navigate to="/register" replace />;

  const handleVerify = async () => {
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { user } = await authApi.verifyEmail({ email, otp });
      updateUser(user);
      localStorage.setItem("sanda_user", JSON.stringify(user));
      localStorage.removeItem(ACCOUNT_VERIFY_EMAIL_KEY);
      toast({ title: "Email verified", description: "Your account is ready." });
      navigate("/jobs", { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not verify your email. Try again.");
      setError(message);
      toast({ title: "Invalid OTP", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Verify email" subtitle={`We sent a 6-digit code to ${email}.`}>
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
            aria-label="Email verification code"
            disabled={isSubmitting}
          >
            <InputOTPGroup dir="ltr">
              {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Feedback>{error}</Feedback>

        <FormSubmitButton
          type="button"
          className="w-full"
          onClick={handleVerify}
          disabled={otp.length !== OTP_LENGTH}
          isPending={isSubmitting}
          loadingText="Verifying..."
        >
          Verify email
        </FormSubmitButton>
      </div>
    </AuthLayout>
  );
}
