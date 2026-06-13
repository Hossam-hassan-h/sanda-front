import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormSubmitButtonProps extends ButtonProps {
  pending?: boolean;
  pendingLabel?: string;
}

export default function FormSubmitButton({
  children,
  pending = false,
  pendingLabel,
  disabled,
  className,
  ...props
}: FormSubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      className={cn("disabled:pointer-events-none", className)}
      {...props}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {pending ? pendingLabel ?? children : children}
    </Button>
  );
}
