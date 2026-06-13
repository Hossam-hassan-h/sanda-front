import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackVariant = "error" | "success" | "warning" | "info";

interface FeedbackProps {
  message?: string | null;
  variant?: FeedbackVariant;
  className?: string;
}

const variantStyles: Record<FeedbackVariant, string> = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
};

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: TriangleAlert,
  info: Info,
};

export default function Feedback({ message, variant = "error", className }: FeedbackProps) {
  if (!message) return null;

  const Icon = icons[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2 text-sm leading-6",
        variantStyles[variant],
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0">{message}</span>
    </div>
  );
}
