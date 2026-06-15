import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import PasswordInput from "@/components/PasswordInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/layouts/AuthLayout";
import { toast } from "@/hooks/use-toast";
import { applyApiErrorsToForm } from "@/lib/api-error";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof loginSchema>;
interface LocationState { from?: { pathname?: string } }

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  const onSubmit = async (values: FormValues) => {
    try {
      const user = await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      toast({ title: "Login successful", description: user.name });
      const from = (location.state as LocationState | null)?.from?.pathname || "/jobs";
      navigate(from, { replace: true });
    } catch (error) {
      const message = applyApiErrorsToForm(error, form, "Check your email and password.");
      toast({ title: "Login failed", description: message, variant: "destructive" });
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Sanda account">
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            disabled={isSubmitting}
            {...register("email")}
          />
          <Feedback className="mt-1 justify-start text-start">{errors.email?.message}</Feedback>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            disabled={isSubmitting}
            {...register("password")}
          />
          <Feedback className="mt-1 justify-start text-start">{errors.password?.message}</Feedback>
        </div>

        <FormSubmitButton className="mt-2 w-full" size="lg" isPending={isSubmitting} loadingText="Signing in...">
          Sign in
        </FormSubmitButton>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Do not have an account?{" "}
        <Link to="/register" className="font-semibold text-primary hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
