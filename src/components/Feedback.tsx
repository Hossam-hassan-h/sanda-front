import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FeedbackVariant = "error" | "success" | "info";

interface FeedbackProps {
  children?: ReactNode;
  variant?: FeedbackVariant;
  className?: string;
}

const variantStyles: Record<FeedbackVariant, string> = {
  error: "border-destructive/40 bg-destructive/10 text-destructive",
  success: "border-green-500/40 bg-green-500/10 text-green-700",
  info: "border-primary/30 bg-primary/10 text-primary",
};

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

export default function Feedback({ children, variant = "info", className }: FeedbackProps) {
  if (!children) return null;

  const Icon = icons[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn("flex items-start gap-2 rounded-md border px-3 py-2 text-sm", variantStyles[variant], className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
