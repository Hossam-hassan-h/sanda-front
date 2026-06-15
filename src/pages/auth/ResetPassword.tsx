import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { authApi } from "@/api/auth";
import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import PasswordInput from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/layouts/AuthLayout";
import PasswordResetSteps from "./PasswordResetSteps";
import { toast } from "@/hooks/use-toast";
import { applyApiErrorsToForm } from "@/lib/api-error";
import {
  clearResetFlow,
  RESET_EMAIL_KEY,
  RESET_OTP_KEY,
} from "@/lib/password-reset";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm your password"),
}).refine((values) => values.newPassword === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

type FormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const email = localStorage.getItem(RESET_EMAIL_KEY) || "";
  const otp = localStorage.getItem(RESET_OTP_KEY) || "";
  const form = useForm<FormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  if (!email) return <Navigate to="/forgot-password" replace />;
  if (!otp) return <Navigate to="/verify-otp" replace />;

  const onSubmit = async (values: FormValues) => {
    try {
      await authApi.resetPassword({ email, otp, newPassword: values.newPassword });
      clearResetFlow();
      toast({ title: "Password reset successful", description: "You can now sign in with your new password." });
      navigate("/login", { replace: true });
    } catch (error) {
      const message = applyApiErrorsToForm(error, form, "Could not reset the password. Try again.");
      toast({ title: "Password reset failed", description: message, variant: "destructive" });
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="Create a new password for your account.">
      <PasswordResetSteps currentStep={3} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={!!errors.newPassword}
            disabled={isSubmitting}
            {...register("newPassword")}
          />
          <Feedback className="mt-1 justify-start text-start">{errors.newPassword?.message}</Feedback>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            aria-invalid={!!errors.confirmPassword}
            disabled={isSubmitting}
            {...register("confirmPassword")}
          />
          <Feedback className="mt-1 justify-start text-start">{errors.confirmPassword?.message}</Feedback>
        </div>

        <FormSubmitButton className="w-full" isPending={isSubmitting} loadingText="Updating...">
          Change password
        </FormSubmitButton>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Need a new code?{" "}
        <Link to="/verify-otp" className="font-semibold text-primary hover:underline">
          Back to OTP
        </Link>
      </p>
    </AuthLayout>
  );
}
