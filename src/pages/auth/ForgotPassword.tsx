import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { authApi } from "@/api/auth";
import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/layouts/AuthLayout";
import PasswordResetSteps from "./PasswordResetSteps";
import { toast } from "@/hooks/use-toast";
import { applyApiErrorsToForm } from "@/lib/api-error";
import {
  getOtpCooldownRemaining,
  markOtpSent,
  persistResetEmail,
  setResetStep,
} from "@/lib/password-reset";

const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
});

type FormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [cooldown, setCooldown] = useState(getOtpCooldownRemaining());
  const form = useForm<FormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  useEffect(() => {
    const interval = window.setInterval(() => setCooldown(getOtpCooldownRemaining()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const onSubmit = async (values: FormValues) => {
    const remaining = getOtpCooldownRemaining();
    if (remaining > 0) {
      toast({
        title: "Please wait",
        description: `Try again in ${remaining} seconds.`,
        variant: "destructive",
      });
      setCooldown(remaining);
      return;
    }

    const email = values.email.trim().toLowerCase();
    try {
      await authApi.forgotPassword({ email });
      persistResetEmail(email);
      localStorage.removeItem("password_reset_otp");
      setResetStep(2);
      markOtpSent();
      setCooldown(getOtpCooldownRemaining());
      toast({ title: "OTP sent", description: "Check your email for the 6-digit code." });
      navigate("/verify-otp");
    } catch (error) {
      const message = applyApiErrorsToForm(error, form, "Could not send the code. Try again.");
      toast({ title: "Could not send OTP", description: message, variant: "destructive" });
    }
  };

  return (
    <AuthLayout title="Forgot password" subtitle="Enter your email to receive a secure reset code.">
      <PasswordResetSteps currentStep={1} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            disabled={isSubmitting || cooldown > 0}
            {...register("email")}
          />
          <Feedback className="mt-1 justify-start text-start">{errors.email?.message}</Feedback>
        </div>

        <FormSubmitButton
          className="w-full"
          isPending={isSubmitting}
          disabled={cooldown > 0}
          loadingText="Sending..."
        >
          {cooldown > 0 ? `Wait ${cooldown}s` : "Send OTP"}
        </FormSubmitButton>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
