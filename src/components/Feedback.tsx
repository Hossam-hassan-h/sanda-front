import * as React from "react";
import { CircleCheck, CircleX, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type FeedbackVariant = "error" | "success" | "info";

interface FeedbackProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: FeedbackVariant;
}

export default function Feedback({
  children,
  className,
  variant = "error",
  ...props
}: FeedbackProps) {
  if (!children) return null;

  const Icon = variant === "success" ? CircleCheck : variant === "info" ? Info : CircleX;

  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn(
        "relative flex items-center justify-center rounded-md border px-3 py-2 text-center text-sm",
        variant === "error" && "border-destructive/60 bg-destructive/10 text-destructive",
        variant === "success" && "border-green-600/60 bg-green-50 text-green-700",
        variant === "info" && "border-primary/50 bg-primary/10 text-primary",
        className,
      )}
      {...props}
    >
      <Icon
        aria-hidden="true"
        className="absolute start-1/2 top-0 size-4 -translate-x-1/2 -translate-y-1/2 bg-background"
      />
      {children}
    </p>
  );
}
