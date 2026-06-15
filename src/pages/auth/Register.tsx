import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, User } from "lucide-react";

import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import PasswordInput from "@/components/PasswordInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/layouts/AuthLayout";
import { toast } from "@/hooks/use-toast";
import { applyApiErrorsToForm } from "@/lib/api-error";
import type { UserRole } from "@/api/types";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().trim().max(13, "Phone cannot exceed 13 characters").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm your password"),
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

type FormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [role, setRole] = useState<UserRole>("worker");
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form;
  const phone = watch("phone");

  const onSubmit = async (values: FormValues) => {
    const email = values.email.trim().toLowerCase();
    try {
      await registerUser({
        name: values.name.trim(),
        email,
        phone: values.phone || undefined,
        password: values.password,
        role,
      });
      localStorage.setItem("account_verify_email", email);
      toast({ title: "Registration OTP sent", description: "Check your email for the verification code." });
      navigate("/verify-email");
    } catch (error) {
      const message = applyApiErrorsToForm(error, form, "Review your details and try again.");
      toast({ title: "Registration failed", description: message, variant: "destructive" });
    }
  };

  return (
    <AuthLayout title="Join Sanda" subtitle="Start using trusted part-time jobs">
      <RoleToggle role={role} onChange={setRole} disabled={isSubmitting} />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3" noValidate>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" placeholder="Ahmed Mohamed" aria-invalid={!!errors.name} disabled={isSubmitting} {...register("name")} />
          <Feedback className="mt-1 justify-start text-start">{errors.name?.message}</Feedback>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} disabled={isSubmitting} {...register("email")} />
          <Feedback className="mt-1 justify-start text-start">{errors.email?.message}</Feedback>
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <PhoneInput
            defaultCountry="EG"
            countries={["EG"]}
            id="phone"
            placeholder="01xxxxxxxxx"
            value={phone || ""}
            onChange={(value) => setValue("phone", value || "", { shouldValidate: true })}
            disabled={isSubmitting}
          />
          <Feedback className="mt-1 justify-start text-start">{errors.phone?.message}</Feedback>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" autoComplete="new-password" placeholder="At least 8 characters" aria-invalid={!!errors.password} disabled={isSubmitting} {...register("password")} />
          <Feedback className="mt-1 justify-start text-start">{errors.password?.message}</Feedback>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} disabled={isSubmitting} {...register("confirmPassword")} />
          <Feedback className="mt-1 justify-start text-start">{errors.confirmPassword?.message}</Feedback>
        </div>

        <FormSubmitButton className="mt-2 w-full" size="lg" isPending={isSubmitting} loadingText="Creating account...">
          Create account
        </FormSubmitButton>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By creating an account you agree to{" "}
          <Link to="/terms" className="text-primary hover:underline">Terms</Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

function RoleToggle({ role, onChange, disabled }: { role: UserRole; onChange: (role: UserRole) => void; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("worker")}
        className={`flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          role === "worker" ? "bg-card text-primary shadow" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <User className="h-4 w-4" /> Worker
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("employer")}
        className={`flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          role === "employer" ? "bg-card text-primary shadow" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Briefcase className="h-4 w-4" /> Employer
      </button>
    </div>
  );
}
