import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/password-reset";
import { useAuth } from "@/context/AuthContext";

const ACCOUNT_VERIFY_EMAIL_KEY = "account_verify_email";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const email = localStorage.getItem(ACCOUNT_VERIFY_EMAIL_KEY) || "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  const handleVerify = async () => {
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("اكتب رمز التحقق المكون من 6 أرقام.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { user } = await authApi.verifyEmail({ email, otp });
      updateUser(user);
      localStorage.setItem("sanda_user", JSON.stringify(user));
      localStorage.removeItem(ACCOUNT_VERIFY_EMAIL_KEY);
      toast({ title: "تم تأكيد البريد الإلكتروني", description: "يمكنك الآن استخدام حسابك." });
      navigate("/jobs", { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error, "تعذر تأكيد البريد الإلكتروني. حاول مرة أخرى.");
      setError(message);
      toast({ title: "رمز غير صحيح", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="تأكيد البريد الإلكتروني" subtitle={`أرسلنا رمز تحقق مكون من 6 أرقام إلى ${email}.`}>
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

        <Button type="button" className="w-full" onClick={handleVerify} disabled={otp.length !== 6 || isSubmitting}>
          {isSubmitting ? "جاري التأكيد..." : "تأكيد البريد الإلكتروني"}
        </Button>
      </div>
    </AuthLayout>
  );
}
